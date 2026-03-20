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
}
