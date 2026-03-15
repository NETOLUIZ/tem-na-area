export class AdminRepository {
  constructor(db) {
    this.db = db;
  }

  async dashboard() {
    const [summaryRows] = await this.db.query(`
      SELECT
        (SELECT COUNT(*) FROM lojas WHERE deleted_at IS NULL) AS total_lojas,
        (SELECT COUNT(*) FROM lojas WHERE status_loja = 'ATIVA' AND deleted_at IS NULL) AS lojas_ativas,
        (SELECT COUNT(*) FROM lojas WHERE status_loja = 'PENDENTE' AND deleted_at IS NULL) AS lojas_pendentes,
        (SELECT COUNT(*) FROM solicitacoes_cadastro WHERE status_solicitacao IN ('PENDENTE', 'EM_ANALISE', 'AGUARDANDO_PAGAMENTO')) AS solicitacoes_abertas,
        (SELECT COUNT(*) FROM pedidos WHERE created_at >= NOW() - INTERVAL '30 days') AS pedidos_30_dias,
        (SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE created_at >= NOW() - INTERVAL '30 days') AS faturamento_30_dias
    `);

    const [recentRows] = await this.db.query(`
      SELECT id, protocolo, nome_empresa, categoria_principal, status_solicitacao, status_pagamento, created_at
      FROM solicitacoes_cadastro
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return {
      summary: summaryRows[0] || {},
      recent_requests: recentRows
    };
  }

  async logs() {
    const [rows] = await this.db.query(`
      SELECT
        CONCAT('SOL-', sc.id) AS id,
        'SOLICITACAO_CADASTRO' AS tipo,
        sc.nome_empresa AS entidade,
        sc.status_solicitacao AS status,
        sc.observacoes AS descricao,
        sc.created_at AS created_at
      FROM solicitacoes_cadastro sc
      UNION ALL
      SELECT
        CONCAT('PED-', h.id) AS id,
        'ALTERACAO_PEDIDO' AS tipo,
        p.codigo AS entidade,
        h.status_novo AS status,
        h.observacao AS descricao,
        h.created_at AS created_at
      FROM historico_status_pedido h
      INNER JOIN pedidos p ON p.id = h.pedido_id
      ORDER BY created_at DESC
      LIMIT 50
    `);

    return rows;
  }
}
