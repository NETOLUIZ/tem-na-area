import { ApiError } from "../lib/api-error.js";

export class CashRegisterRepository {
  constructor(db) {
    this.db = db;
  }

  async ensureTables() {
    try {
      await this.db.execute("SELECT 1 FROM caixas_loja LIMIT 1");
      await this.db.execute("SELECT 1 FROM caixa_movimentacoes LIMIT 1");
      return true;
    } catch (error) {
      if (error?.code === "42P01") {
        return false;
      }

      throw error;
    }
  }

  async currentByStore(storeId) {
    if (!(await this.ensureTables())) {
      return null;
    }

    const [rows] = await this.db.execute(
      `
        SELECT *
        FROM caixas_loja
        WHERE loja_id = ?
          AND status_caixa = 'ABERTO'
        ORDER BY aberto_em DESC, id DESC
        LIMIT 1
      `,
      [storeId]
    );

    const session = rows[0] || null;
    if (!session) {
      return null;
    }

    return this.detailById(storeId, session.id);
  }

  async historyByStore(storeId, limit = 8) {
    if (!(await this.ensureTables())) {
      return [];
    }

    const [rows] = await this.db.execute(
      `
        SELECT *
        FROM caixas_loja
        WHERE loja_id = ?
        ORDER BY aberto_em DESC, id DESC
        LIMIT ?
      `,
      [storeId, Math.max(1, Math.min(50, Number(limit) || 8))]
    );

    return Promise.all(rows.map((row) => this.detailById(storeId, row.id)));
  }

  async salesTotalDuring(storeId, startAt, endAt = null) {
    try {
      const [rows] = await this.db.execute(
        `
          SELECT COALESCE(SUM(valor), 0) AS total_recebido
          FROM pedido_pagamentos
          WHERE loja_id = ?
            AND status_pagamento IN ('PAGO', 'PARCIAL')
            AND created_at >= ?
            AND (? IS NULL OR created_at <= ?)
        `,
        [storeId, startAt, endAt, endAt]
      );

      return Number(rows[0]?.total_recebido || 0);
    } catch (error) {
      if (error?.code === "42P01") {
        return 0;
      }

      throw error;
    }
  }

  async detailById(storeId, sessionId) {
    if (!(await this.ensureTables())) {
      return null;
    }

    const [rows] = await this.db.execute(
      `
        SELECT *
        FROM caixas_loja
        WHERE loja_id = ?
          AND id = ?
        LIMIT 1
      `,
      [storeId, sessionId]
    );

    const session = rows[0] || null;
    if (!session) {
      return null;
    }

    const [movements] = await this.db.execute(
      `
        SELECT *
        FROM caixa_movimentacoes
        WHERE caixa_id = ?
        ORDER BY created_at DESC, id DESC
      `,
      [sessionId]
    );

    const totals = movements.reduce((accumulator, movement) => {
      const amount = Number(movement.valor || 0);
      if (["ENTRADA", "REFORCO"].includes(movement.tipo_movimentacao)) {
        accumulator.entries += amount;
      }
      if (["SAIDA", "SANGRIA"].includes(movement.tipo_movimentacao)) {
        accumulator.outputs += amount;
      }
      return accumulator;
    }, { entries: 0, outputs: 0 });

    const salesTotal = await this.salesTotalDuring(storeId, session.aberto_em, session.fechado_em || null);
    const expected = Number((Number(session.valor_inicial || 0) + totals.entries + salesTotal - totals.outputs).toFixed(2));

    return {
      ...session,
      valor_inicial: Number(session.valor_inicial || 0),
      valor_esperado: expected,
      valor_real: session.valor_real == null ? null : Number(session.valor_real),
      diferenca_valor: session.diferenca_valor == null ? null : Number(session.diferenca_valor),
      vendas_recebidas: salesTotal,
      totais_movimentacao: {
        entradas: Number(totals.entries.toFixed(2)),
        saidas: Number(totals.outputs.toFixed(2))
      },
      movements: movements.map((movement) => ({
        ...movement,
        valor: Number(movement.valor || 0)
      }))
    };
  }

  async open(connection, storeId, userId, payload) {
    if (!(await this.ensureTables())) {
      throw new ApiError("O modulo de caixa ainda nao foi migrado neste banco.", 503);
    }

    const current = await this.currentByStore(storeId);
    if (current) {
      throw new ApiError("Ja existe um caixa aberto para esta loja.", 422);
    }

    const [rows, meta] = await connection.execute(
      `
        INSERT INTO caixas_loja (
          loja_id,
          operador_usuario_id,
          status_caixa,
          valor_inicial,
          valor_esperado,
          observacoes_abertura
        ) VALUES (?, ?, 'ABERTO', ?, ?, ?)
      `,
      [
        storeId,
        userId,
        Number(payload.valor_inicial || 0),
        Number(payload.valor_inicial || 0),
        payload.observacoes_abertura || null
      ]
    );

    const sessionId = rows[0]?.id ?? meta.insertId;
    return this.detailById(storeId, sessionId);
  }

  async createMovement(connection, storeId, sessionId, userId, payload) {
    if (!(await this.ensureTables())) {
      throw new ApiError("O modulo de caixa ainda nao foi migrado neste banco.", 503);
    }

    if (!["ENTRADA", "SAIDA", "REFORCO", "SANGRIA"].includes(String(payload.tipo_movimentacao || "").toUpperCase())) {
      throw new ApiError("Tipo de movimentacao invalido.", 422);
    }

    if (Number(payload.valor || 0) <= 0) {
      throw new ApiError("Valor da movimentacao deve ser maior que zero.", 422);
    }

    const session = await this.detailById(storeId, sessionId);
    if (!session || session.status_caixa !== "ABERTO") {
      throw new ApiError("Caixa aberto nao encontrado para registrar movimentacao.", 404);
    }

    await connection.execute(
      `
        INSERT INTO caixa_movimentacoes (
          caixa_id,
          loja_id,
          operador_usuario_id,
          tipo_movimentacao,
          valor,
          observacoes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        sessionId,
        storeId,
        userId,
        String(payload.tipo_movimentacao || "").toUpperCase(),
        Number(payload.valor || 0),
        payload.observacoes || null
      ]
    );

    return this.detailById(storeId, sessionId);
  }

  async close(connection, storeId, sessionId, payload) {
    if (!(await this.ensureTables())) {
      throw new ApiError("O modulo de caixa ainda nao foi migrado neste banco.", 503);
    }

    const session = await this.detailById(storeId, sessionId);
    if (!session || session.status_caixa !== "ABERTO") {
      throw new ApiError("Caixa aberto nao encontrado para fechamento.", 404);
    }

    const realValue = Number(payload.valor_real || 0);
    const diff = Number((realValue - Number(session.valor_esperado || 0)).toFixed(2));

    await connection.execute(
      `
        UPDATE caixas_loja
        SET status_caixa = 'FECHADO',
            valor_esperado = ?,
            valor_real = ?,
            diferenca_valor = ?,
            observacoes_fechamento = ?,
            fechado_em = NOW(),
            updated_at = NOW()
        WHERE id = ?
          AND loja_id = ?
      `,
      [
        Number(session.valor_esperado || 0),
        realValue,
        diff,
        payload.observacoes_fechamento || null,
        sessionId,
        storeId
      ]
    );

    return this.detailById(storeId, sessionId);
  }
}
