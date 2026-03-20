export class StoreRepository {
  constructor(db) {
    this.db = db;
  }

  async findPlans() {
    const [rows] = await this.db.query(`
      SELECT id, codigo, nome, descricao, tipo_exibicao, preco_mensal, permite_cardapio,
             permite_produtos, permite_pedidos, permite_relatorios, limite_produtos, limite_banners
      FROM planos
      WHERE ativo = TRUE
      ORDER BY preco_mensal ASC, nome ASC
    `);
    return rows;
  }

  async homeCards() {
    const [rows] = await this.db.query(`
      SELECT
        ch.id,
        ch.titulo_exibicao,
        ch.subtitulo_exibicao,
        ch.descricao_curta,
        ch.imagem_url,
        ch.botao_label,
        ch.link_destino,
        ch.tipo_card,
        ch.ordem_exibicao,
        l.id AS loja_id,
        l.nome AS loja_nome,
        l.slug,
        l.categoria_principal,
        l.status_loja,
        l.logo_url,
        l.whatsapp
      FROM cards_home ch
      INNER JOIN lojas l ON l.id = ch.loja_id
      WHERE ch.ativo = TRUE
        AND l.deleted_at IS NULL
        AND (ch.data_inicio IS NULL OR ch.data_inicio <= NOW())
        AND (ch.data_fim IS NULL OR ch.data_fim >= NOW())
      ORDER BY ch.ordem_exibicao ASC, ch.id DESC
    `);
    return rows;
  }

  async activeStores(category = null, search = null) {
    let sql = `
      SELECT
        l.id,
        l.uuid,
        l.nome,
        l.slug,
        l.categoria_principal,
        l.descricao_curta,
        l.whatsapp,
        l.telefone,
        l.logo_url,
        l.capa_url,
        l.endereco_cidade,
        l.endereco_estado,
        l.horario_funcionamento,
        l.modo_operacao,
        l.status_loja,
        c.taxa_entrega_padrao,
        c.pedido_minimo,
        c.tempo_medio_preparo_minutos
      FROM lojas l
      LEFT JOIN configuracoes_loja c ON c.loja_id = l.id
      WHERE l.status_loja = 'ATIVA'
        AND l.deleted_at IS NULL
    `;
    const params = [];

    if (category) {
      sql += " AND l.categoria_principal = ?";
      params.push(category);
    }

    if (search) {
      sql += " AND (l.nome ILIKE ? OR l.descricao_curta ILIKE ? OR l.categoria_principal ILIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += " ORDER BY l.destaque_home DESC, l.nome ASC";
    const [rows] = await this.db.execute(sql, params);
    return rows;
  }

  async findStoreBySlug(slug) {
    const [rows] = await this.db.execute(
      `
        SELECT
          l.*,
          c.cor_primaria,
          c.cor_secundaria,
          c.taxa_entrega_padrao,
          c.pedido_minimo,
          c.tempo_medio_preparo_minutos,
          c.tempo_medio_entrega_minutos,
          c.aceita_retirada,
          c.aceita_entrega,
          c.exibir_produtos_esgotados,
          c.exibir_whatsapp,
          c.mensagem_boas_vindas,
          c.politica_troca,
          c.politica_entrega,
          c.seo_title,
          c.seo_description
        FROM lojas l
        LEFT JOIN configuracoes_loja c ON c.loja_id = l.id
        WHERE l.slug = ?
          AND l.deleted_at IS NULL
        LIMIT 1
      `,
      [slug]
    );
    return rows[0] || null;
  }

  async merchantSettings(storeId) {
    const [rows] = await this.db.execute(
      `
        SELECT
          l.*,
          c.id AS configuracao_id,
          c.cor_primaria,
          c.cor_secundaria,
          c.taxa_entrega_padrao,
          c.pedido_minimo,
          c.tempo_medio_preparo_minutos,
          c.tempo_medio_entrega_minutos,
          c.aceita_retirada,
          c.aceita_entrega,
          c.exibir_produtos_esgotados,
          c.exibir_whatsapp,
          c.mensagem_boas_vindas,
          c.politica_troca,
          c.politica_entrega,
          c.seo_title,
          c.seo_description
        FROM lojas l
        LEFT JOIN configuracoes_loja c ON c.loja_id = l.id
        WHERE l.id = ?
          AND l.deleted_at IS NULL
        LIMIT 1
      `,
      [storeId]
    );
    return rows[0] || null;
  }

  async merchantDashboard(storeId) {
    const store = await this.merchantSettings(storeId);
    const [summaryRows] = await this.db.execute(
      `
        SELECT
          COUNT(*) AS total_pedidos,
          SUM(CASE WHEN status_pedido IN ('NOVO', 'ACEITO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA') THEN 1 ELSE 0 END) AS pedidos_abertos,
          SUM(CASE WHEN status_pedido = 'CONCLUIDO' THEN 1 ELSE 0 END) AS pedidos_concluidos,
          SUM(CASE WHEN status_pedido IN ('CANCELADO', 'RECUSADO') THEN 1 ELSE 0 END) AS pedidos_cancelados,
          COALESCE(SUM(total), 0) AS faturamento_total
        FROM pedidos
        WHERE loja_id = ?
      `,
      [storeId]
    );
    const [productRows] = await this.db.execute(
      `
        SELECT
          COUNT(*) AS total_produtos,
          SUM(CASE WHEN status_produto = 'ATIVO' THEN 1 ELSE 0 END) AS produtos_ativos,
          SUM(CASE WHEN status_produto = 'ESGOTADO' THEN 1 ELSE 0 END) AS produtos_esgotados
        FROM produtos
        WHERE loja_id = ?
          AND deleted_at IS NULL
      `,
      [storeId]
    );
    const [metricRows] = await this.db.execute(
      `
        SELECT *
        FROM metricas
        WHERE loja_id = ?
        ORDER BY data_referencia DESC
        LIMIT 7
      `,
      [storeId]
    );

    return {
      store,
      summary: summaryRows[0] || {},
      products: productRows[0] || {},
      metrics: metricRows
    };
  }

  async adminStores(status = null) {
    let sql = `
      SELECT
        l.id,
        l.nome,
        l.slug,
        l.categoria_principal,
        l.modo_operacao,
        l.status_loja,
        l.destaque_home,
        l.aceita_pedidos,
        l.created_at,
        u.nome AS responsavel_nome,
        u.email AS responsavel_email,
        u.telefone AS responsavel_telefone,
        p.nome AS plano_nome,
        p.codigo AS plano_codigo,
        s.status_solicitacao,
        s.status_pagamento
      FROM lojas l
      INNER JOIN donos_loja dl ON dl.id = l.dono_loja_id
      INNER JOIN usuarios u ON u.id = dl.usuario_id
      INNER JOIN planos p ON p.id = l.plano_id
      LEFT JOIN solicitacoes_cadastro s ON s.id = l.solicitacao_cadastro_id
      WHERE l.deleted_at IS NULL
    `;
    const params = [];

    if (status) {
      sql += " AND l.status_loja = ?";
      params.push(status);
    }

    sql += " ORDER BY l.created_at DESC, l.id DESC";
    const [rows] = await this.db.execute(sql, params);
    return rows;
  }

  async updateStoreStatus(storeId, status, adminId, reason) {
    await this.db.execute(
      `
        UPDATE lojas
        SET status_loja = ?,
            aprovado_por_admin_id = CASE WHEN ? = 'ATIVA' THEN ? ELSE aprovado_por_admin_id END,
            aprovado_em = CASE WHEN ? = 'ATIVA' THEN NOW() ELSE aprovado_em END,
            bloqueado_em = CASE WHEN ? IN ('BLOQUEADA', 'SUSPENSA') THEN NOW() ELSE NULL END,
            motivo_status = ?
        WHERE id = ?
      `,
      [status, status, adminId, status, status, reason, storeId]
    );
  }

  async upsertSettings(storeId, payload) {
    const [rows] = await this.db.execute("SELECT id FROM configuracoes_loja WHERE loja_id = ? LIMIT 1", [storeId]);
    const exists = rows[0]?.id;

    const values = [
      payload.cor_primaria ?? null,
      payload.cor_secundaria ?? null,
      payload.taxa_entrega_padrao ?? 0,
      payload.pedido_minimo ?? 0,
      payload.tempo_medio_preparo_minutos ?? null,
      payload.tempo_medio_entrega_minutos ?? null,
      payload.aceita_retirada ?? true,
      payload.aceita_entrega ?? true,
      payload.exibir_produtos_esgotados ?? false,
      payload.exibir_whatsapp ?? true,
      payload.mensagem_boas_vindas ?? null,
      payload.politica_troca ?? null,
      payload.politica_entrega ?? null,
      payload.seo_title ?? null,
      payload.seo_description ?? null
    ];

    if (exists) {
      await this.db.execute(
        `
          UPDATE configuracoes_loja
          SET cor_primaria = ?, cor_secundaria = ?, taxa_entrega_padrao = ?, pedido_minimo = ?,
              tempo_medio_preparo_minutos = ?, tempo_medio_entrega_minutos = ?, aceita_retirada = ?,
              aceita_entrega = ?, exibir_produtos_esgotados = ?, exibir_whatsapp = ?, mensagem_boas_vindas = ?,
              politica_troca = ?, politica_entrega = ?, seo_title = ?, seo_description = ?
          WHERE loja_id = ?
        `,
        values.concat(storeId)
      );
    } else {
      await this.db.execute(
        `
          INSERT INTO configuracoes_loja (
            loja_id, cor_primaria, cor_secundaria, taxa_entrega_padrao, pedido_minimo,
            tempo_medio_preparo_minutos, tempo_medio_entrega_minutos, aceita_retirada, aceita_entrega,
            exibir_produtos_esgotados, exibir_whatsapp, mensagem_boas_vindas, politica_troca,
            politica_entrega, seo_title, seo_description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [storeId].concat(values)
      );
    }

    await this.db.execute(
      `
        UPDATE lojas
        SET whatsapp = ?, telefone = ?, email_contato = ?, descricao_curta = ?, descricao_completa = ?,
            logo_url = ?, capa_url = ?, horario_funcionamento = ?
        WHERE id = ?
      `,
      [
        payload.whatsapp ?? null,
        payload.telefone ?? null,
        payload.email_contato ?? null,
        payload.descricao_curta ?? null,
        payload.descricao_completa ?? null,
        payload.logo_url ?? null,
        payload.capa_url ?? null,
        payload.horario_funcionamento ?? null,
        storeId
      ]
    );
  }
}
