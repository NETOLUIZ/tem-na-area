import { protocol, slugify, uuid } from "../lib/strings.js";
import crypto from "node:crypto";
import { ApiError } from "../lib/api-error.js";

function getInsertedId(rows, meta) {
  if (Array.isArray(rows) && rows[0]?.id != null) {
    return Number(rows[0].id);
  }

  if (meta?.insertId != null) {
    return Number(meta.insertId);
  }

  return null;
}

export class RegistrationRepository {
  constructor(db) {
    this.db = db;
  }

  async planByCode(code) {
    const [rows] = await this.db.execute("SELECT * FROM planos WHERE codigo = ? AND ativo = TRUE LIMIT 1", [code]);
    return rows[0] || null;
  }

  async createLead(payload, plan) {
    const [, meta] = await this.db.execute(
      `
        INSERT INTO solicitacoes_cadastro (
          protocolo, tipo_solicitacao, nome_empresa, nome_responsavel, email, telefone, whatsapp,
          cpf_cnpj, categoria_principal, descricao_resumida, cidade, estado, endereco_logradouro,
          endereco_numero, endereco_bairro, endereco_complemento, cep, horario_funcionamento,
          logo_url, capa_url, observacoes, plano_id, status_solicitacao, status_pagamento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        protocol("SOL"),
        plan.codigo === "FREE" ? "LOJA_GRATIS" : "LOJA_PAGA",
        payload.nome_empresa,
        payload.nome_responsavel ?? null,
        payload.email ?? null,
        payload.telefone ?? null,
        payload.whatsapp,
        payload.cpf_cnpj ?? null,
        payload.categoria_principal,
        payload.descricao_resumida ?? null,
        payload.cidade ?? null,
        payload.estado ?? null,
        payload.endereco_logradouro ?? null,
        payload.endereco_numero ?? null,
        payload.endereco_bairro ?? null,
        payload.endereco_complemento ?? null,
        payload.cep ?? null,
        payload.horario_funcionamento ?? null,
        payload.logo_url ?? null,
        payload.capa_url ?? null,
        payload.observacoes ?? null,
        plan.id,
        plan.codigo === "FREE"
          ? "PENDENTE"
          : (String(payload.status_pagamento || "").toUpperCase() === "APROVADO" ? "EM_ANALISE" : "AGUARDANDO_PAGAMENTO"),
        plan.codigo === "FREE"
          ? "NAO_APLICAVEL"
          : (String(payload.status_pagamento || "").toUpperCase() === "APROVADO" ? "APROVADO" : "PENDENTE")
      ]
    );

    return meta.insertId;
  }

  async findExistingOwnerUser({ email = null, telefone = null, whatsapp = null }) {
    const candidates = [email, telefone, whatsapp]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    if (!candidates.length) {
      return null;
    }

    const placeholders = candidates.map(() => "?").join(", ");
    const [rows] = await this.db.execute(
      `
        SELECT id, email, telefone, whatsapp
        FROM usuarios
        WHERE email IN (${placeholders})
           OR COALESCE(telefone, '') IN (${placeholders})
           OR COALESCE(whatsapp, '') IN (${placeholders})
        LIMIT 1
      `,
      candidates.concat(candidates, candidates)
    );

    return rows[0] || null;
  }

  async freeLeads() {
    const [rows] = await this.db.query(`
      SELECT sc.*, p.codigo AS plano_codigo
      FROM solicitacoes_cadastro sc
      INNER JOIN planos p ON p.id = sc.plano_id
      WHERE p.codigo = 'FREE'
      ORDER BY sc.created_at DESC, sc.id DESC
    `);
    return rows;
  }

  async paidLeads() {
    const [rows] = await this.db.query(`
      SELECT sc.*, p.codigo AS plano_codigo
      FROM solicitacoes_cadastro sc
      INNER JOIN planos p ON p.id = sc.plano_id
      WHERE p.codigo = 'PRO'
      ORDER BY sc.created_at DESC, sc.id DESC
    `);
    return rows;
  }

  async createPaidLeadWithPendingAccount(connection, payload, plan) {
    const existingUser = await this.findExistingOwnerUser({
      email: payload.email,
      telefone: payload.telefone,
      whatsapp: payload.whatsapp
    });

    if (existingUser) {
      throw new ApiError("Ja existe uma conta cadastrada com este e-mail ou telefone.", 409);
    }

    const normalizedEmail = payload.email?.trim().toLowerCase() || `${protocol("USR").toLowerCase()}@temnaarea.local`;
    const normalizedPhone = payload.telefone?.trim() || payload.whatsapp?.trim() || null;
    const normalizedWhatsapp = payload.whatsapp?.trim() || normalizedPhone;
    const passwordHash = crypto.createHash("sha256").update(String(payload.senha)).digest("hex");

    const [userRows, userMeta] = await connection.execute(
      `
        INSERT INTO usuarios (
          uuid, nome, email, telefone, whatsapp, senha_hash, tipo_usuario, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'DONO_LOJA', 'PENDENTE')
        RETURNING id
      `,
      [
        uuid(),
        payload.nome_responsavel || payload.nome_empresa,
        normalizedEmail,
        normalizedPhone,
        normalizedWhatsapp,
        passwordHash
      ]
    );
    const userId = getInsertedId(userRows, userMeta);

    const [ownerRows, ownerMeta] = await connection.execute(
      `
        INSERT INTO donos_loja (usuario_id, nome_fantasia, razao_social, cpf_cnpj, data_adesao)
        VALUES (?, ?, ?, ?, NOW())
        RETURNING id
      `,
      [userId, payload.nome_empresa, payload.nome_empresa, payload.cpf_cnpj ?? null]
    );
    const ownerId = getInsertedId(ownerRows, ownerMeta);

    const [leadRows, leadMeta] = await connection.execute(
      `
        INSERT INTO solicitacoes_cadastro (
          protocolo, tipo_solicitacao, nome_empresa, nome_responsavel, email, telefone, whatsapp,
          cpf_cnpj, categoria_principal, descricao_resumida, cidade, estado, endereco_logradouro,
          endereco_numero, endereco_bairro, endereco_complemento, cep, horario_funcionamento,
          logo_url, capa_url, observacoes, plano_id, usuario_id, dono_loja_id,
          status_solicitacao, status_pagamento
        ) VALUES (?, 'LOJA_PAGA', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EM_ANALISE', 'APROVADO')
        RETURNING id
      `,
      [
        protocol("SOL"),
        payload.nome_empresa,
        payload.nome_responsavel || payload.nome_empresa,
        normalizedEmail,
        normalizedPhone,
        normalizedWhatsapp,
        payload.cpf_cnpj ?? null,
        payload.categoria_principal,
        payload.descricao_resumida ?? null,
        payload.cidade ?? null,
        payload.estado ?? null,
        payload.endereco_logradouro ?? null,
        payload.endereco_numero ?? null,
        payload.endereco_bairro ?? null,
        payload.endereco_complemento ?? null,
        payload.cep ?? null,
        payload.horario_funcionamento ?? null,
        payload.logo_url ?? null,
        payload.capa_url ?? null,
        payload.observacoes ?? null,
        plan.id,
        userId,
        ownerId
      ]
    );
    const leadId = getInsertedId(leadRows, leadMeta);

    const slugBase = slugify(payload.nome_empresa);
    let slug = slugBase;
    let counter = 2;
    while (await this.slugExists(slug)) {
      slug = `${slugBase}-${counter}`;
      counter += 1;
    }

    const [storeRows, storeMeta] = await connection.execute(
      `
        INSERT INTO lojas (
          uuid, dono_loja_id, plano_id, solicitacao_cadastro_id, nome, slug, categoria_principal,
          descricao_curta, email_contato, telefone, whatsapp, logo_url, capa_url,
          endereco_cep, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado,
          horario_funcionamento, modo_operacao, status_loja, destaque_home, aceita_pedidos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'LOJA_COMPLETA', 'PENDENTE', FALSE, FALSE)
        RETURNING id
      `,
      [
        uuid(),
        ownerId,
        plan.id,
        leadId,
        payload.nome_empresa,
        slug,
        payload.categoria_principal,
        payload.descricao_resumida ?? "Loja completa aguardando aprovacao do admin.",
        normalizedEmail,
        normalizedPhone,
        normalizedWhatsapp,
        payload.logo_url ?? null,
        payload.capa_url ?? null,
        payload.cep ?? null,
        payload.endereco_logradouro ?? null,
        payload.endereco_numero ?? null,
        payload.endereco_bairro ?? null,
        payload.cidade ?? null,
        payload.estado ?? null,
        payload.horario_funcionamento ?? null
      ]
    );
    const storeId = getInsertedId(storeRows, storeMeta);

    await connection.execute(
      `
        INSERT INTO configuracoes_loja (
          loja_id, taxa_entrega_padrao, pedido_minimo, aceita_retirada, aceita_entrega, exibir_produtos_esgotados, exibir_whatsapp
        ) VALUES (?, 0, 0, TRUE, TRUE, FALSE, TRUE)
      `,
      [storeId]
    );

    return {
      lead_id: leadId,
      store_id: storeId,
      user_id: userId,
      slug
    };
  }

  async findLead(leadId) {
    const [rows] = await this.db.execute(
      `
        SELECT sc.*, p.codigo AS plano_codigo
        FROM solicitacoes_cadastro sc
        INNER JOIN planos p ON p.id = sc.plano_id
        WHERE sc.id = ?
        LIMIT 1
      `,
      [leadId]
    );

    return rows[0] || null;
  }

  async slugExists(slug) {
    const [rows] = await this.db.execute("SELECT id FROM lojas WHERE slug = ? LIMIT 1", [slug]);
    return Boolean(rows[0]);
  }


  async approveFreeLead(connection, leadId, adminId) {
    const [leadRows] = await connection.execute(
      `
        SELECT sc.*, p.codigo AS plano_codigo
        FROM solicitacoes_cadastro sc
        INNER JOIN planos p ON p.id = sc.plano_id
        WHERE sc.id = ?
        LIMIT 1
      `,
      [leadId]
    );
    const lead = leadRows[0];
    if (!lead || lead.plano_codigo !== "FREE") {
      return null;
    }

    // Ao aprovar um lead gratis, a API cria a cadeia minima usuario > dono > loja.
    let ownerUserId = lead.usuario_id ? Number(lead.usuario_id) : null;
    if (!ownerUserId) {
      const [userRows, userMeta] = await connection.execute(
        `
          INSERT INTO usuarios (
            uuid, nome, email, telefone, whatsapp, senha_hash, tipo_usuario, status,
            email_verificado_em, telefone_verificado_em
          ) VALUES (?, ?, ?, ?, ?, ?, 'DONO_LOJA', 'ATIVO', NOW(), NOW())
          RETURNING id
        `,
        [
          uuid(),
          lead.nome_responsavel || lead.nome_empresa,
          lead.email || `lead-${leadId}@temnaarea.local`,
          lead.telefone || lead.whatsapp,
          lead.whatsapp,
          crypto.createHash("sha256").update(protocol("TMP")).digest("hex")
        ]
      );
      ownerUserId = getInsertedId(userRows, userMeta);
    }

    if (!ownerUserId) {
      throw new Error("Falha ao criar o usuario do responsavel para este lead.");
    }

    const [ownerRows] = await connection.execute("SELECT id FROM donos_loja WHERE usuario_id = ? LIMIT 1", [ownerUserId]);
    let ownerId = ownerRows[0]?.id || null;
    if (!ownerId) {
      const [ownerRowsInserted, ownerMeta] = await connection.execute(
        `
          INSERT INTO donos_loja (usuario_id, nome_fantasia, razao_social, cpf_cnpj, data_adesao)
          VALUES (?, ?, ?, ?, NOW())
          RETURNING id
        `,
        [ownerUserId, lead.nome_empresa, lead.nome_empresa, lead.cpf_cnpj || null]
      );
      ownerId = getInsertedId(ownerRowsInserted, ownerMeta);
    }

    if (!ownerId) {
      throw new Error("Falha ao criar o cadastro do dono da loja.");
    }

    const slugBase = slugify(lead.nome_empresa);
    let slug = slugBase;
    let counter = 2;
    while (await this.slugExists(slug)) {
      slug = `${slugBase}-${counter}`;
      counter += 1;
    }

    const [storeRows, storeMeta] = await connection.execute(
      `
        INSERT INTO lojas (
          uuid, dono_loja_id, plano_id, solicitacao_cadastro_id, nome, slug, categoria_principal,
          descricao_curta, email_contato, telefone, whatsapp, logo_url, capa_url,
          endereco_cep, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado,
          horario_funcionamento, modo_operacao, status_loja, destaque_home, aceita_pedidos,
          aprovado_por_admin_id, aprovado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WHATSAPP_ONLY', 'ATIVA', FALSE, FALSE, ?, NOW())
        RETURNING id
      `,
      [
        uuid(),
        ownerId,
        lead.plano_id,
        leadId,
        lead.nome_empresa,
        slug,
        lead.categoria_principal,
        lead.descricao_resumida || "Atendimento direto pelo WhatsApp.",
        lead.email || null,
        lead.telefone || lead.whatsapp,
        lead.whatsapp,
        lead.logo_url || null,
        lead.capa_url || null,
        lead.cep || null,
        lead.endereco_logradouro || null,
        lead.endereco_numero || null,
        lead.endereco_bairro || null,
        lead.cidade || null,
        lead.estado || null,
        lead.horario_funcionamento || "Atendimento por WhatsApp",
        adminId
      ]
    );
    const storeId = getInsertedId(storeRows, storeMeta);

    if (!storeId) {
      throw new Error("Falha ao criar a loja ao aprovar o lead.");
    }

    await connection.execute(
      `
        INSERT INTO cards_home (
          loja_id, titulo_exibicao, subtitulo_exibicao, descricao_curta, imagem_url,
          botao_label, link_destino, tipo_card, ordem_exibicao, ativo, data_inicio
        ) VALUES (?, ?, ?, ?, ?, 'Chamar no WhatsApp', ?, 'WHATSAPP', 0, TRUE, NOW())
      `,
      [
        storeId,
        lead.nome_empresa,
        lead.categoria_principal,
        lead.descricao_resumida || "Atendimento local pelo WhatsApp.",
        lead.logo_url || lead.capa_url || null,
        `https://wa.me/55${String(lead.whatsapp || "").replace(/\D+/g, "")}`
      ]
    );

    await connection.execute(
      `
        UPDATE solicitacoes_cadastro
        SET usuario_id = ?, dono_loja_id = ?, status_solicitacao = 'APROVADA',
            analisado_por_admin_id = ?, analisado_em = NOW()
        WHERE id = ?
      `,
      [ownerUserId, ownerId, adminId, leadId]
    );

    return {
      lead_id: leadId,
      store_id: storeId,
      slug
    };
  }

  async confirmPaidLead(connection, leadId, adminId) {
    const lead = await this.findLead(leadId);
    if (!lead || lead.plano_codigo !== "PRO") {
      return null;
    }

    await connection.execute(
      `
        UPDATE solicitacoes_cadastro
        SET status_pagamento = 'APROVADO',
            status_solicitacao = 'EM_ANALISE',
            analisado_por_admin_id = ?,
            analisado_em = NOW()
        WHERE id = ?
      `,
      [adminId, leadId]
    );

    return this.findLead(leadId);
  }

  async approvePaidLead(connection, leadId, adminId) {
    const lead = await this.findLead(leadId);
    if (!lead || lead.plano_codigo !== "PRO") {
      return null;
    }

    const userId = Number(lead.usuario_id || 0);
    const ownerId = Number(lead.dono_loja_id || 0);
    if (!userId || !ownerId) {
      throw new ApiError("Cadastro pago sem conta vinculada para aprovacao.", 422);
    }

    const [storeRows] = await connection.execute(
      "SELECT id FROM lojas WHERE solicitacao_cadastro_id = ? LIMIT 1",
      [leadId]
    );
    const storeId = Number(storeRows[0]?.id || 0);
    if (!storeId) {
      throw new ApiError("Loja vinculada nao encontrada para esta solicitacao.", 404);
    }

    await connection.execute(
      `
        UPDATE usuarios
        SET status = 'ATIVO',
            email_verificado_em = COALESCE(email_verificado_em, NOW()),
            telefone_verificado_em = COALESCE(telefone_verificado_em, NOW())
        WHERE id = ?
      `,
      [userId]
    );

    await connection.execute(
      `
        UPDATE lojas
        SET status_loja = 'ATIVA',
            aceita_pedidos = TRUE,
            aprovado_por_admin_id = ?,
            aprovado_em = NOW()
        WHERE id = ?
      `,
      [adminId, storeId]
    );

    await connection.execute(
      `
        UPDATE solicitacoes_cadastro
        SET status_solicitacao = 'APROVADA',
            status_pagamento = 'APROVADO',
            analisado_por_admin_id = ?,
            analisado_em = NOW()
        WHERE id = ?
      `,
      [adminId, leadId]
    );

    return {
      lead_id: leadId,
      store_id: storeId
    };
  }
}
