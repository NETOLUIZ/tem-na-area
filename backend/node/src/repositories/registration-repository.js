import { protocol, slugify, uuid } from "../lib/strings.js";
import crypto from "node:crypto";

export class RegistrationRepository {
  constructor(db) {
    this.db = db;
  }

  async planByCode(code) {
    const [rows] = await this.db.execute("SELECT * FROM planos WHERE codigo = ? AND ativo = 1 LIMIT 1", [code]);
    return rows[0] || null;
  }

  async createLead(payload, plan) {
    const [result] = await this.db.execute(
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
        plan.codigo === "FREE" ? "PENDENTE" : "AGUARDANDO_PAGAMENTO",
        plan.codigo === "FREE" ? "NAO_APLICAVEL" : "PENDENTE"
      ]
    );

    return result.insertId;
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
      const [userResult] = await connection.execute(
        `
          INSERT INTO usuarios (
            uuid, nome, email, telefone, whatsapp, senha_hash, tipo_usuario, status,
            email_verificado_em, telefone_verificado_em
          ) VALUES (?, ?, ?, ?, ?, ?, 'DONO_LOJA', 'ATIVO', NOW(), NOW())
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
      ownerUserId = userResult.insertId;
    }

    const [ownerRows] = await connection.execute("SELECT id FROM donos_loja WHERE usuario_id = ? LIMIT 1", [ownerUserId]);
    let ownerId = ownerRows[0]?.id || null;
    if (!ownerId) {
      const [ownerResult] = await connection.execute(
        `
          INSERT INTO donos_loja (usuario_id, nome_fantasia, razao_social, cpf_cnpj, data_adesao)
          VALUES (?, ?, ?, ?, NOW())
        `,
        [ownerUserId, lead.nome_empresa, lead.nome_empresa, lead.cpf_cnpj || null]
      );
      ownerId = ownerResult.insertId;
    }

    const slugBase = slugify(lead.nome_empresa);
    let slug = slugBase;
    let counter = 2;
    while (await this.slugExists(slug)) {
      slug = `${slugBase}-${counter}`;
      counter += 1;
    }

    const [storeResult] = await connection.execute(
      `
        INSERT INTO lojas (
          uuid, dono_loja_id, plano_id, solicitacao_cadastro_id, nome, slug, categoria_principal,
          descricao_curta, email_contato, telefone, whatsapp, logo_url, capa_url,
          endereco_cep, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado,
          horario_funcionamento, modo_operacao, status_loja, destaque_home, aceita_pedidos,
          aprovado_por_admin_id, aprovado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WHATSAPP_ONLY', 'ATIVA', 0, 0, ?, NOW())
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
    const storeId = storeResult.insertId;

    await connection.execute(
      `
        INSERT INTO cards_home (
          loja_id, titulo_exibicao, subtitulo_exibicao, descricao_curta, imagem_url,
          botao_label, link_destino, tipo_card, ordem_exibicao, ativo, data_inicio
        ) VALUES (?, ?, ?, ?, ?, 'Chamar no WhatsApp', ?, 'WHATSAPP', 0, 1, NOW())
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
}
