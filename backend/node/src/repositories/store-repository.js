export class StoreRepository {
  constructor(db) {
    this.db = db;
  }

  normalizeBoolean(value, fallback = false) {
    if (typeof value === "boolean") {
      return value;
    }

    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "sim", "yes", "on"].includes(normalized)) return true;
      if (["false", "0", "nao", "não", "no", "off"].includes(normalized)) return false;
    }

    return Boolean(value);
  }

  async queryStoreSettings(storeId, includeExtended = true) {
    const extendedFields = includeExtended ? `
          c.bairros_atendidos,
          c.formas_pagamento_aceitas,
          c.painel_compacto,
          c.alerta_sonoro_pedidos,
          c.exibir_dashboard_financeiro,
    ` : "";

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
          ${extendedFields}
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
    try {
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
            c.bairros_atendidos,
            c.formas_pagamento_aceitas,
            c.painel_compacto,
            c.alerta_sonoro_pedidos,
            c.exibir_dashboard_financeiro,
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
    } catch (error) {
      if (error?.code !== "42703") {
        throw error;
      }

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
  }

  async merchantSettings(storeId) {
    try {
      return await this.queryStoreSettings(storeId, true);
    } catch (error) {
      if (error?.code !== "42703") {
        throw error;
      }

      return this.queryStoreSettings(storeId, false);
    }
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
    const [todayRows] = await this.db.execute(
      `
        SELECT
          COUNT(*) AS total_pedidos,
          SUM(CASE WHEN status_pedido IN ('NOVO', 'ACEITO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA') THEN 1 ELSE 0 END) AS pedidos_abertos,
          COALESCE(SUM(total), 0) AS faturamento_total,
          COALESCE(AVG(total), 0) AS ticket_medio
        FROM pedidos
        WHERE loja_id = ?
          AND DATE(created_at) = CURRENT_DATE
      `,
      [storeId]
    );
    const [yesterdayRows] = await this.db.execute(
      `
        SELECT
          COUNT(*) AS total_pedidos,
          SUM(CASE WHEN status_pedido IN ('NOVO', 'ACEITO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA') THEN 1 ELSE 0 END) AS pedidos_abertos,
          COALESCE(SUM(total), 0) AS faturamento_total,
          COALESCE(AVG(total), 0) AS ticket_medio
        FROM pedidos
        WHERE loja_id = ?
          AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
      `,
      [storeId]
    );
    const [paymentRows] = await this.db.execute(
      `
        SELECT
          status_pagamento,
          COUNT(*) AS total,
          COALESCE(SUM(total), 0) AS valor_total
        FROM pedidos
        WHERE loja_id = ?
          AND DATE(created_at) = CURRENT_DATE
        GROUP BY status_pagamento
        ORDER BY valor_total DESC, total DESC
      `,
      [storeId]
    );
    const [recentOrders] = await this.db.execute(
      `
        SELECT
          id,
          codigo,
          nome_cliente,
          telefone_cliente,
          status_pedido,
          status_pagamento,
          tipo_entrega,
          canal_venda,
          total,
          created_at
        FROM pedidos
        WHERE loja_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 8
      `,
      [storeId]
    );

    const summary = summaryRows[0] || {};
    const products = productRows[0] || {};
    const today = todayRows[0] || {};
    const yesterday = yesterdayRows[0] || {};

    function toNumber(value) {
      return Number(value || 0);
    }

    function compare(current, previous) {
      const currentValue = toNumber(current);
      const previousValue = toNumber(previous);
      if (!previousValue) {
        return currentValue > 0 ? 100 : 0;
      }
      return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
    }

    const alerts = [];
    if (String(store?.status_loja || store?.status || "") !== "ATIVA") {
      alerts.push({
        id: "store-status",
        tone: "warning",
        title: "Status da loja requer atencao",
        description: `A loja esta com status ${store?.status_loja || store?.status || "desconhecido"}.`
      });
    }
    if (toNumber(products.produtos_ativos) === 0) {
      alerts.push({
        id: "products-empty",
        tone: "danger",
        title: "Nenhum produto ativo",
        description: "Ative itens no catalogo para receber pedidos no painel."
      });
    }
    if (toNumber(today.pedidos_abertos) > 0) {
      alerts.push({
        id: "orders-open",
        tone: "info",
        title: "Pedidos em aberto",
        description: `${toNumber(today.pedidos_abertos)} pedido(s) exigem acompanhamento agora.`
      });
    }
    if (toNumber(today.total_pedidos) === 0) {
      alerts.push({
        id: "orders-today-empty",
        tone: "muted",
        title: "Sem pedidos hoje",
        description: "Acompanhe campanhas e visibilidade para reaquecer a operacao."
      });
    }

    return {
      store,
      summary,
      products,
      metrics: metricRows,
      today: {
        total_pedidos: toNumber(today.total_pedidos),
        pedidos_abertos: toNumber(today.pedidos_abertos),
        faturamento_total: toNumber(today.faturamento_total),
        ticket_medio: toNumber(today.ticket_medio)
      },
      yesterday: {
        total_pedidos: toNumber(yesterday.total_pedidos),
        pedidos_abertos: toNumber(yesterday.pedidos_abertos),
        faturamento_total: toNumber(yesterday.faturamento_total),
        ticket_medio: toNumber(yesterday.ticket_medio)
      },
      comparison: {
        faturamento_total_pct: compare(today.faturamento_total, yesterday.faturamento_total),
        total_pedidos_pct: compare(today.total_pedidos, yesterday.total_pedidos),
        ticket_medio_pct: compare(today.ticket_medio, yesterday.ticket_medio)
      },
      payment_summary: paymentRows.map((row) => ({
        label: row.status_pagamento,
        total: toNumber(row.total),
        valor_total: toNumber(row.valor_total)
      })),
      recent_orders: recentOrders,
      alerts
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
      this.normalizeBoolean(payload.aceita_retirada, true),
      this.normalizeBoolean(payload.aceita_entrega, true),
      this.normalizeBoolean(payload.exibir_produtos_esgotados, false),
      this.normalizeBoolean(payload.exibir_whatsapp, true),
      payload.bairros_atendidos ?? null,
      payload.formas_pagamento_aceitas ?? null,
      this.normalizeBoolean(payload.painel_compacto, false),
      this.normalizeBoolean(payload.alerta_sonoro_pedidos, true),
      this.normalizeBoolean(payload.exibir_dashboard_financeiro, true),
      payload.mensagem_boas_vindas ?? null,
      payload.politica_troca ?? null,
      payload.politica_entrega ?? null,
      payload.seo_title ?? null,
      payload.seo_description ?? null
    ];

    try {
      if (exists) {
        await this.db.execute(
          `
            UPDATE configuracoes_loja
            SET cor_primaria = ?, cor_secundaria = ?, taxa_entrega_padrao = ?, pedido_minimo = ?,
                tempo_medio_preparo_minutos = ?, tempo_medio_entrega_minutos = ?, aceita_retirada = ?,
                aceita_entrega = ?, exibir_produtos_esgotados = ?, exibir_whatsapp = ?, bairros_atendidos = ?,
                formas_pagamento_aceitas = ?, painel_compacto = ?, alerta_sonoro_pedidos = ?,
                exibir_dashboard_financeiro = ?, mensagem_boas_vindas = ?, politica_troca = ?,
                politica_entrega = ?, seo_title = ?, seo_description = ?
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
              exibir_produtos_esgotados, exibir_whatsapp, bairros_atendidos, formas_pagamento_aceitas,
              painel_compacto, alerta_sonoro_pedidos, exibir_dashboard_financeiro, mensagem_boas_vindas,
              politica_troca, politica_entrega, seo_title, seo_description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [storeId].concat(values)
        );
      }
    } catch (error) {
      if (error?.code !== "42703") {
        throw error;
      }

      const fallbackValues = [
        payload.cor_primaria ?? null,
        payload.cor_secundaria ?? null,
        payload.taxa_entrega_padrao ?? 0,
        payload.pedido_minimo ?? 0,
        payload.tempo_medio_preparo_minutos ?? null,
        payload.tempo_medio_entrega_minutos ?? null,
        this.normalizeBoolean(payload.aceita_retirada, true),
        this.normalizeBoolean(payload.aceita_entrega, true),
        this.normalizeBoolean(payload.exibir_produtos_esgotados, false),
        this.normalizeBoolean(payload.exibir_whatsapp, true),
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
          fallbackValues.concat(storeId)
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
          [storeId].concat(fallbackValues)
        );
      }
    }

    await this.db.execute(
      `
        UPDATE lojas
        SET whatsapp = ?, telefone = ?, email_contato = ?, descricao_curta = ?, descricao_completa = ?,
            logo_url = ?, capa_url = ?, horario_funcionamento = ?, nome = ?, categoria_principal = ?,
            status_loja = ?, endereco_cep = ?, endereco_logradouro = ?, endereco_numero = ?,
            endereco_complemento = ?, endereco_bairro = ?, endereco_cidade = ?, endereco_estado = ?,
            website_url = ?, instagram_url = ?, facebook_url = ?, aceita_pedidos = ?
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
        payload.nome ?? null,
        payload.categoria_principal ?? null,
        payload.status_loja ?? null,
        payload.endereco_cep ?? null,
        payload.endereco_logradouro ?? null,
        payload.endereco_numero ?? null,
        payload.endereco_complemento ?? null,
        payload.endereco_bairro ?? null,
        payload.endereco_cidade ?? null,
        payload.endereco_estado ?? null,
        payload.website_url ?? null,
        payload.instagram_url ?? null,
        payload.facebook_url ?? null,
        this.normalizeBoolean(payload.aceita_pedidos, true),
        storeId
      ]
    );
  }
}
