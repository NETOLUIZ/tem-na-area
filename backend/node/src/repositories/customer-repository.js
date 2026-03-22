import crypto from "node:crypto";
import { uuid } from "../lib/strings.js";

function mapCustomer(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    usuario_id: Number(row.usuario_id),
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    whatsapp: row.whatsapp,
    cpf_cnpj: row.cpf_cnpj,
    endereco: {
      cep: row.endereco_principal_cep,
      logradouro: row.endereco_principal_logradouro,
      numero: row.endereco_principal_numero,
      complemento: row.endereco_principal_complemento,
      bairro: row.endereco_principal_bairro,
      cidade: row.endereco_principal_cidade,
      estado: row.endereco_principal_estado,
      referencia: row.referencia_endereco
    },
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export class CustomerRepository {
  constructor(db) {
    this.db = db;
  }

  async searchByStore(storeId, search = "", limit = 20) {
    const normalizedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const normalizedSearch = String(search || "").trim();
    const hasSearch = normalizedSearch.length > 0;
    const term = `%${normalizedSearch}%`;
    const params = [storeId];
    let whereClause = "";

    if (hasSearch) {
      whereClause = `
        AND (
          u.nome ILIKE ?
          OR COALESCE(u.telefone, '') ILIKE ?
          OR COALESCE(u.whatsapp, '') ILIKE ?
          OR COALESCE(u.email, '') ILIKE ?
        )
      `;
      params.push(term, term, term, term);
    } else {
      whereClause = "AND COALESCE(store_stats.orders_count, 0) > 0";
    }

    const [rows] = await this.db.execute(
      `
        SELECT
          c.*,
          u.nome,
          u.email,
          u.telefone,
          u.whatsapp,
          COALESCE(store_stats.orders_count, 0) AS pedidos_total,
          COALESCE(store_stats.total_spent, 0) AS total_gasto,
          store_stats.last_order_at AS ultimo_pedido_em
        FROM clientes c
        INNER JOIN usuarios u ON u.id = c.usuario_id
        LEFT JOIN (
          SELECT
            cliente_id,
            COUNT(*) AS orders_count,
            SUM(total) AS total_spent,
            MAX(created_at) AS last_order_at
          FROM pedidos
          WHERE loja_id = ?
          GROUP BY cliente_id
        ) AS store_stats ON store_stats.cliente_id = c.id
        WHERE u.deleted_at IS NULL
          ${whereClause}
        ORDER BY
          COALESCE(store_stats.last_order_at, c.updated_at, c.created_at) DESC,
          u.nome ASC
        LIMIT ?
      `,
      params.concat(normalizedLimit)
    );

    return rows.map((row) => ({
      ...mapCustomer(row),
      metricas: {
        totalPedidos: Number(row.pedidos_total || 0),
        totalGasto: Number(row.total_gasto || 0),
        ultimoPedidoEm: row.ultimo_pedido_em || null
      }
    }));
  }

  async detailByStore(storeId, customerId) {
    const [rows] = await this.db.execute(
      `
        SELECT
          c.*,
          u.nome,
          u.email,
          u.telefone,
          u.whatsapp,
          COUNT(p.id) AS pedidos_total,
          COALESCE(SUM(p.total), 0) AS total_gasto,
          MAX(p.created_at) AS ultimo_pedido_em
        FROM clientes c
        INNER JOIN usuarios u ON u.id = c.usuario_id
        LEFT JOIN pedidos p ON p.cliente_id = c.id AND p.loja_id = ?
        WHERE c.id = ?
          AND u.deleted_at IS NULL
        GROUP BY c.id, u.id
        LIMIT 1
      `,
      [storeId, customerId]
    );

    const row = rows[0];
    if (!row) {
      return null;
    }

    const [recentOrders] = await this.db.execute(
      `
        SELECT id, codigo, status_pedido, status_pagamento, total, created_at
        FROM pedidos
        WHERE loja_id = ?
          AND cliente_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 8
      `,
      [storeId, customerId]
    );

    return {
      ...mapCustomer(row),
      metricas: {
        totalPedidos: Number(row.pedidos_total || 0),
        totalGasto: Number(row.total_gasto || 0),
        ultimoPedidoEm: row.ultimo_pedido_em || null
      },
      pedidosRecentes: recentOrders.map((order) => ({
        id: Number(order.id),
        codigo: order.codigo,
        status: order.status_pedido,
        paymentStatus: order.status_pagamento,
        total: Number(order.total || 0),
        createdAt: order.created_at
      }))
    };
  }

  async search(search = "", limit = 20) {
    const normalizedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const term = `%${String(search || "").trim()}%`;
    const [rows] = await this.db.execute(
      `
        SELECT
          c.*,
          u.nome,
          u.email,
          u.telefone,
          u.whatsapp
        FROM clientes c
        INNER JOIN usuarios u ON u.id = c.usuario_id
        WHERE u.deleted_at IS NULL
          AND (
            u.nome ILIKE ?
            OR COALESCE(u.telefone, '') ILIKE ?
            OR COALESCE(u.whatsapp, '') ILIKE ?
            OR COALESCE(u.email, '') ILIKE ?
          )
        ORDER BY u.nome ASC
        LIMIT ?
      `,
      [term, term, term, term, normalizedLimit]
    );

    return rows.map(mapCustomer);
  }

  async findById(customerId) {
    const [rows] = await this.db.execute(
      `
        SELECT
          c.*,
          u.nome,
          u.email,
          u.telefone,
          u.whatsapp
        FROM clientes c
        INNER JOIN usuarios u ON u.id = c.usuario_id
        WHERE c.id = ?
          AND u.deleted_at IS NULL
        LIMIT 1
      `,
      [customerId]
    );

    return mapCustomer(rows[0]);
  }

  async findByContact({ telefone = null, whatsapp = null, email = null }) {
    const contacts = [telefone, whatsapp, email]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    if (contacts.length === 0) {
      return null;
    }

    const placeholders = contacts.map(() => "?").join(", ");
    const [rows] = await this.db.execute(
      `
        SELECT
          c.*,
          u.nome,
          u.email,
          u.telefone,
          u.whatsapp
        FROM clientes c
        INNER JOIN usuarios u ON u.id = c.usuario_id
        WHERE u.deleted_at IS NULL
          AND (
            COALESCE(u.telefone, '') IN (${placeholders})
            OR COALESCE(u.whatsapp, '') IN (${placeholders})
            OR COALESCE(u.email, '') IN (${placeholders})
          )
        ORDER BY c.id ASC
        LIMIT 1
      `,
      contacts.concat(contacts, contacts)
    );

    return mapCustomer(rows[0]);
  }

  async create(connection, payload) {
    const normalizedEmail = payload.email ? String(payload.email).trim().toLowerCase() : null;
    const normalizedPhone = payload.telefone ? String(payload.telefone).trim() : null;
    const normalizedWhatsapp = payload.whatsapp ? String(payload.whatsapp).trim() : normalizedPhone;
    const passwordSeed = crypto.randomBytes(24).toString("hex");
    const passwordHash = crypto.createHash("sha256").update(passwordSeed).digest("hex");

    const [userRows, userMeta] = await connection.execute(
      `
        INSERT INTO usuarios (
          uuid, nome, email, telefone, whatsapp, senha_hash, tipo_usuario, status, telefone_verificado_em
        ) VALUES (?, ?, ?, ?, ?, ?, 'CLIENTE', 'ATIVO', NOW())
      `,
      [
        uuid(),
        String(payload.nome).trim(),
        normalizedEmail,
        normalizedPhone,
        normalizedWhatsapp,
        passwordHash
      ]
    );

    const userId = userRows[0]?.id ?? userMeta.insertId;
    const [customerRows, customerMeta] = await connection.execute(
      `
        INSERT INTO clientes (
          usuario_id, cpf_cnpj, endereco_principal_cep, endereco_principal_logradouro,
          endereco_principal_numero, endereco_principal_complemento, endereco_principal_bairro,
          endereco_principal_cidade, endereco_principal_estado, referencia_endereco
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        payload.cpf_cnpj ?? null,
        payload.cep ?? null,
        payload.logradouro ?? null,
        payload.numero ?? null,
        payload.complemento ?? null,
        payload.bairro ?? null,
        payload.cidade ?? null,
        payload.estado ?? null,
        payload.referencia ?? null
      ]
    );

    const customerId = customerRows[0]?.id ?? customerMeta.insertId;
    return this.findById(customerId);
  }

  async update(connection, customerId, payload) {
    const current = await this.findById(customerId);
    if (!current) {
      return null;
    }

    const normalizedEmail = payload.email ? String(payload.email).trim().toLowerCase() : null;
    const normalizedPhone = payload.telefone ? String(payload.telefone).trim() : null;
    const normalizedWhatsapp = payload.whatsapp ? String(payload.whatsapp).trim() : normalizedPhone;

    await connection.execute(
      `
        UPDATE usuarios
        SET nome = ?,
            email = ?,
            telefone = ?,
            whatsapp = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      [
        String(payload.nome || current.nome).trim(),
        normalizedEmail,
        normalizedPhone,
        normalizedWhatsapp,
        current.usuario_id
      ]
    );

    await connection.execute(
      `
        UPDATE clientes
        SET cpf_cnpj = ?,
            endereco_principal_cep = ?,
            endereco_principal_logradouro = ?,
            endereco_principal_numero = ?,
            endereco_principal_complemento = ?,
            endereco_principal_bairro = ?,
            endereco_principal_cidade = ?,
            endereco_principal_estado = ?,
            referencia_endereco = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      [
        payload.cpf_cnpj ?? null,
        payload.cep ?? null,
        payload.logradouro ?? null,
        payload.numero ?? null,
        payload.complemento ?? null,
        payload.bairro ?? null,
        payload.cidade ?? null,
        payload.estado ?? null,
        payload.referencia ?? null,
        customerId
      ]
    );

    return this.findById(customerId);
  }
}
