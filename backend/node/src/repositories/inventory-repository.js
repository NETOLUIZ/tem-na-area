import { ApiError } from "../lib/api-error.js";

export class InventoryRepository {
  constructor(db) {
    this.db = db;
  }

  async ensureTable() {
    try {
      await this.db.execute("SELECT 1 FROM estoque_movimentacoes LIMIT 1");
      return true;
    } catch (error) {
      if (error?.code === "42P01") {
        return false;
      }

      throw error;
    }
  }

  async overviewByStore(storeId) {
    const [products] = await this.db.execute(
      `
        SELECT
          id,
          nome,
          sku,
          categoria_id,
          status_produto,
          estoque_atual,
          estoque_minimo,
          controla_estoque,
          permite_venda_sem_estoque,
          updated_at
        FROM produtos
        WHERE loja_id = ?
          AND deleted_at IS NULL
        ORDER BY COALESCE(estoque_atual, 0) ASC, nome ASC
      `,
      [storeId]
    );

    const movementTableAvailable = await this.ensureTable();
    const movements = movementTableAvailable
      ? await this.latestMovementsByStore(storeId, 20)
      : [];

    return {
      products: products.map((product) => ({
        ...product,
        estoque_atual: Number(product.estoque_atual || 0),
        estoque_minimo: Number(product.estoque_minimo || 0)
      })),
      movements,
      summary: {
        total_products: products.length,
        low_stock: products.filter((product) => Number(product.controla_estoque ?? 1) === 1 && Number(product.estoque_atual || 0) <= Number(product.estoque_minimo || 0)).length,
        out_of_stock: products.filter((product) => Number(product.estoque_atual || 0) <= 0).length
      }
    };
  }

  async latestMovementsByStore(storeId, limit = 20) {
    if (!(await this.ensureTable())) {
      return [];
    }

    const [rows] = await this.db.execute(
      `
        SELECT
          m.*,
          p.nome AS produto_nome,
          p.sku AS produto_sku
        FROM estoque_movimentacoes m
        INNER JOIN produtos p ON p.id = m.produto_id
        WHERE m.loja_id = ?
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT ?
      `,
      [storeId, Math.max(1, Math.min(50, Number(limit) || 20))]
    );

    return rows.map((row) => ({
      ...row,
      quantidade: Number(row.quantidade || 0),
      estoque_anterior: Number(row.estoque_anterior || 0),
      estoque_atual: Number(row.estoque_atual || 0)
    }));
  }

  async productMovements(storeId, productId, limit = 12) {
    if (!(await this.ensureTable())) {
      return [];
    }

    const [rows] = await this.db.execute(
      `
        SELECT *
        FROM estoque_movimentacoes
        WHERE loja_id = ?
          AND produto_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT ?
      `,
      [storeId, productId, Math.max(1, Math.min(50, Number(limit) || 12))]
    );

    return rows.map((row) => ({
      ...row,
      quantidade: Number(row.quantidade || 0),
      estoque_anterior: Number(row.estoque_anterior || 0),
      estoque_atual: Number(row.estoque_atual || 0)
    }));
  }

  async createMovement(connection, storeId, productId, userId, payload) {
    const [productRows] = await connection.execute(
      `
        SELECT *
        FROM produtos
        WHERE loja_id = ?
          AND id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [storeId, productId]
    );

    const product = productRows[0] || null;
    if (!product) {
      throw new ApiError("Produto nao encontrado para movimentacao de estoque.", 404);
    }

    if (!["ENTRADA", "SAIDA", "AJUSTE"].includes(String(payload.tipo_movimentacao || "").toUpperCase())) {
      throw new ApiError("Tipo de movimentacao de estoque invalido.", 422);
    }

    const quantity = Math.max(1, Number(payload.quantidade || 0));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ApiError("Quantidade invalida para movimentacao.", 422);
    }

    const previousStock = Number(product.estoque_atual || 0);
    const movementType = String(payload.tipo_movimentacao || "").toUpperCase();
    const nextStock = movementType === "ENTRADA"
      ? previousStock + quantity
      : movementType === "SAIDA"
        ? previousStock - quantity
        : quantity;

    if (movementType === "SAIDA" && nextStock < 0 && !(product.permite_venda_sem_estoque === true || Number(product.permite_venda_sem_estoque ?? 0) === 1)) {
      throw new ApiError("A saida deixaria o estoque negativo.", 422);
    }

    await connection.execute(
      `
        UPDATE produtos
        SET estoque_atual = ?,
            status_produto = CASE
              WHEN ? <= 0 AND COALESCE(controla_estoque, TRUE) = TRUE THEN 'ESGOTADO'
              WHEN status_produto = 'ESGOTADO' AND ? > 0 THEN 'ATIVO'
              ELSE status_produto
            END,
            updated_at = NOW()
        WHERE id = ?
          AND loja_id = ?
      `,
      [nextStock, nextStock, nextStock, productId, storeId]
    );

    if (await this.ensureTable()) {
      await connection.execute(
        `
          INSERT INTO estoque_movimentacoes (
            loja_id,
            produto_id,
            operador_usuario_id,
            tipo_movimentacao,
            quantidade,
            estoque_anterior,
            estoque_atual,
            observacoes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          storeId,
          productId,
          userId,
          movementType,
          quantity,
          previousStock,
          nextStock,
          payload.observacoes || null
        ]
      );
    }

    const [updatedRows] = await connection.execute(
      `
        SELECT *
        FROM produtos
        WHERE loja_id = ?
          AND id = ?
        LIMIT 1
      `,
      [storeId, productId]
    );

    return updatedRows[0] || null;
  }
}
