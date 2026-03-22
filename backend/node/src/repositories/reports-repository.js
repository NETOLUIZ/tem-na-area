export class ReportsRepository {
  constructor(db) {
    this.db = db;
  }

  normalizeRange(start, end) {
    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - (6 * 24 * 60 * 60 * 1000));
    return {
      start: startDate.toISOString(),
      end: new Date(endDate.getTime() + (24 * 60 * 60 * 1000) - 1).toISOString()
    };
  }

  async byStore(storeId, start, end) {
    const range = this.normalizeRange(start, end);

    const [summaryRows] = await this.db.execute(
      `
        SELECT
          COUNT(*) AS total_pedidos,
          COALESCE(SUM(total), 0) AS faturamento_total,
          COALESCE(AVG(total), 0) AS ticket_medio,
          SUM(CASE WHEN status_pedido IN ('CANCELADO', 'RECUSADO') THEN 1 ELSE 0 END) AS cancelamentos
        FROM pedidos
        WHERE loja_id = ?
          AND created_at >= ?
          AND created_at <= ?
      `,
      [storeId, range.start, range.end]
    );

    const [dailyRows] = await this.db.execute(
      `
        SELECT
          DATE(created_at) AS data_ref,
          COUNT(*) AS total_pedidos,
          COALESCE(SUM(total), 0) AS faturamento_total
        FROM pedidos
        WHERE loja_id = ?
          AND created_at >= ?
          AND created_at <= ?
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `,
      [storeId, range.start, range.end]
    );

    const [statusRows] = await this.db.execute(
      `
        SELECT status_pedido, COUNT(*) AS total
        FROM pedidos
        WHERE loja_id = ?
          AND created_at >= ?
          AND created_at <= ?
        GROUP BY status_pedido
        ORDER BY total DESC
      `,
      [storeId, range.start, range.end]
    );

    const [categoryRows] = await this.db.execute(
      `
        SELECT
          COALESCE(c.nome, 'Outros') AS categoria,
          SUM(ip.quantidade) AS itens_vendidos,
          COALESCE(SUM(ip.subtotal), 0) AS faturamento_total
        FROM itens_pedido ip
        INNER JOIN pedidos p ON p.id = ip.pedido_id
        LEFT JOIN produtos pr ON pr.id = ip.produto_id
        LEFT JOIN categorias c ON c.id = pr.categoria_id
        WHERE p.loja_id = ?
          AND p.created_at >= ?
          AND p.created_at <= ?
        GROUP BY COALESCE(c.nome, 'Outros')
        ORDER BY faturamento_total DESC, itens_vendidos DESC
      `,
      [storeId, range.start, range.end]
    );

    const [topProducts] = await this.db.execute(
      `
        SELECT
          ip.produto_id,
          ip.produto_nome,
          SUM(ip.quantidade) AS quantidade_total,
          COALESCE(SUM(ip.subtotal), 0) AS faturamento_total
        FROM itens_pedido ip
        INNER JOIN pedidos p ON p.id = ip.pedido_id
        WHERE p.loja_id = ?
          AND p.created_at >= ?
          AND p.created_at <= ?
        GROUP BY ip.produto_id, ip.produto_nome
        ORDER BY quantidade_total DESC, faturamento_total DESC
        LIMIT 5
      `,
      [storeId, range.start, range.end]
    );

    const [lowProducts] = await this.db.execute(
      `
        SELECT
          ip.produto_id,
          ip.produto_nome,
          SUM(ip.quantidade) AS quantidade_total,
          COALESCE(SUM(ip.subtotal), 0) AS faturamento_total
        FROM itens_pedido ip
        INNER JOIN pedidos p ON p.id = ip.pedido_id
        WHERE p.loja_id = ?
          AND p.created_at >= ?
          AND p.created_at <= ?
        GROUP BY ip.produto_id, ip.produto_nome
        ORDER BY quantidade_total ASC, faturamento_total ASC
        LIMIT 5
      `,
      [storeId, range.start, range.end]
    );

    let paymentRows = [];
    try {
      [paymentRows] = await this.db.execute(
        `
          SELECT
            metodo_pagamento,
            COUNT(*) AS total_registros,
            COALESCE(SUM(valor), 0) AS valor_total
          FROM pedido_pagamentos
          WHERE loja_id = ?
            AND created_at >= ?
            AND created_at <= ?
          GROUP BY metodo_pagamento
          ORDER BY valor_total DESC, total_registros DESC
        `,
        [storeId, range.start, range.end]
      );
    } catch (error) {
      if (error?.code !== "42P01") {
        throw error;
      }
    }

    const summary = summaryRows[0] || {};
    return {
      range,
      summary: {
        total_pedidos: Number(summary.total_pedidos || 0),
        faturamento_total: Number(summary.faturamento_total || 0),
        ticket_medio: Number(summary.ticket_medio || 0),
        cancelamentos: Number(summary.cancelamentos || 0)
      },
      daily: dailyRows.map((row) => ({
        date: row.data_ref,
        total_pedidos: Number(row.total_pedidos || 0),
        faturamento_total: Number(row.faturamento_total || 0)
      })),
      status: statusRows.map((row) => ({
        label: row.status_pedido,
        total: Number(row.total || 0)
      })),
      categories: categoryRows.map((row) => ({
        label: row.categoria,
        itens_vendidos: Number(row.itens_vendidos || 0),
        faturamento_total: Number(row.faturamento_total || 0)
      })),
      payments: paymentRows.map((row) => ({
        label: row.metodo_pagamento,
        total: Number(row.total_registros || 0),
        valor_total: Number(row.valor_total || 0)
      })),
      top_products: topProducts.map((row) => ({
        id: Number(row.produto_id || 0),
        nome: row.produto_nome,
        quantidade_total: Number(row.quantidade_total || 0),
        faturamento_total: Number(row.faturamento_total || 0)
      })),
      low_products: lowProducts.map((row) => ({
        id: Number(row.produto_id || 0),
        nome: row.produto_nome,
        quantidade_total: Number(row.quantidade_total || 0),
        faturamento_total: Number(row.faturamento_total || 0)
      }))
    };
  }
}
