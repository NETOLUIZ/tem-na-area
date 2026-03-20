export class CommerceRepository {
  constructor(db) {
    this.db = db;
  }

  async listStores({ status = null, search = null } = {}) {
    let sql = `
      SELECT
        l.id,
        l.uuid,
        l.nome,
        l.slug,
        l.categoria_principal,
        l.descricao_curta,
        l.email_contato,
        l.telefone,
        l.whatsapp,
        l.status_loja,
        l.modo_operacao,
        l.endereco_cidade,
        l.endereco_estado,
        l.created_at
      FROM lojas l
      WHERE l.deleted_at IS NULL
    `;
    const params = [];

    if (status) {
      sql += " AND l.status_loja = ?";
      params.push(status);
    }

    if (search) {
      sql += " AND (l.nome ILIKE ? OR l.slug ILIKE ? OR l.categoria_principal ILIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += " ORDER BY l.created_at DESC, l.id DESC";
    const [rows] = await this.db.execute(sql, params);
    return rows;
  }

  async listProducts({ storeId = null, activeOnly = false } = {}) {
    let sql = `
      SELECT
        p.id,
        p.loja_id,
        p.categoria_id,
        p.cardapio_id,
        p.sku,
        p.nome,
        p.slug,
        p.descricao,
        p.descricao_curta,
        p.imagem_url,
        p.preco,
        p.preco_promocional,
        p.estoque_atual,
        p.status_produto,
        p.created_at,
        c.nome AS categoria_nome
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.deleted_at IS NULL
    `;
    const params = [];

    if (storeId) {
      sql += " AND p.loja_id = ?";
      params.push(storeId);
    }

    if (activeOnly) {
      sql += " AND p.status_produto = 'ATIVO'";
    }

    sql += " ORDER BY p.created_at DESC, p.id DESC";
    const [rows] = await this.db.execute(sql, params);
    return rows;
  }

  async listOrders({ storeId = null, status = null, limit = 100 } = {}) {
    let sql = `
      SELECT
        p.*,
        l.nome AS loja_nome,
        l.slug AS loja_slug
      FROM pedidos p
      INNER JOIN lojas l ON l.id = p.loja_id
      WHERE 1 = 1
    `;
    const params = [];

    if (storeId) {
      sql += " AND p.loja_id = ?";
      params.push(storeId);
    }

    if (status) {
      sql += " AND p.status_pedido = ?";
      params.push(status);
    }

    sql += " ORDER BY p.created_at DESC, p.id DESC LIMIT ?";
    params.push(Math.max(1, Math.min(Number(limit || 100), 500)));

    const [orders] = await this.db.execute(sql, params);

    for (const order of orders) {
      const [items] = await this.db.execute(
        "SELECT * FROM itens_pedido WHERE pedido_id = ? ORDER BY id ASC",
        [order.id]
      );
      order.items = items;
    }

    return orders;
  }

  async findOrder(orderId) {
    const [rows] = await this.db.execute(
      `
        SELECT
          p.*,
          l.nome AS loja_nome,
          l.slug AS loja_slug
        FROM pedidos p
        INNER JOIN lojas l ON l.id = p.loja_id
        WHERE p.id = ?
        LIMIT 1
      `,
      [orderId]
    );

    const order = rows[0] || null;
    if (!order) {
      return null;
    }

    const [items] = await this.db.execute(
      "SELECT * FROM itens_pedido WHERE pedido_id = ? ORDER BY id ASC",
      [order.id]
    );
    order.items = items;
    return order;
  }

  async listPayments({ storeId = null, status = null, limit = 100 } = {}) {
    let sql = `
      SELECT
        pg.*,
        l.nome AS loja_nome,
        s.protocolo AS solicitacao_protocolo
      FROM pagamentos pg
      LEFT JOIN solicitacoes_cadastro s ON s.id = pg.solicitacao_cadastro_id
      LEFT JOIN lojas l ON l.solicitacao_cadastro_id = s.id
      WHERE 1 = 1
    `;
    const params = [];

    if (storeId) {
      sql += " AND l.id = ?";
      params.push(storeId);
    }

    if (status) {
      sql += " AND pg.status_pagamento = ?";
      params.push(status);
    }

    sql += " ORDER BY pg.id DESC LIMIT ?";
    params.push(Math.max(1, Math.min(Number(limit || 100), 500)));

    const [rows] = await this.db.execute(sql, params);
    return rows;
  }

  async listSales({ storeId = null, status = null, dateFrom = null, dateTo = null, limit = 100 } = {}) {
    let sql = `
      SELECT
        v.*,
        l.nome AS loja_nome,
        p.codigo AS pedido_codigo
      FROM vendas v
      INNER JOIN lojas l ON l.id = v.loja_id
      LEFT JOIN pedidos p ON p.id = v.pedido_id
      WHERE 1 = 1
    `;
    const params = [];

    if (storeId) {
      sql += " AND v.loja_id = ?";
      params.push(storeId);
    }

    if (status) {
      sql += " AND v.status_venda = ?";
      params.push(status);
    }

    if (dateFrom) {
      sql += " AND DATE(v.data_venda) >= DATE(?)";
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += " AND DATE(v.data_venda) <= DATE(?)";
      params.push(dateTo);
    }

    sql += " ORDER BY v.data_venda DESC, v.id DESC LIMIT ?";
    params.push(Math.max(1, Math.min(Number(limit || 100), 500)));

    const [rows] = await this.db.execute(sql, params);
    return rows;
  }
}
