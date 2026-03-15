export class AuthRepository {
  constructor(db) {
    this.db = db;
  }

  async findMerchantByLogin(login) {
    const [rows] = await this.db.execute(
      `
        SELECT
          u.id AS usuario_id,
          u.uuid,
          u.nome,
          u.email,
          u.telefone,
          u.whatsapp,
          u.senha_hash,
          u.tipo_usuario,
          u.status,
          dl.id AS dono_loja_id,
          l.id AS loja_id,
          l.nome AS loja_nome,
          l.slug,
          l.status_loja,
          l.modo_operacao
        FROM usuarios u
        INNER JOIN donos_loja dl ON dl.usuario_id = u.id
        LEFT JOIN lojas l ON l.dono_loja_id = dl.id AND l.deleted_at IS NULL
        WHERE (u.email = ? OR u.telefone = ? OR u.whatsapp = ?)
        LIMIT 1
      `,
      [login, login, login]
    );

    return rows[0] || null;
  }

  async findAdminByLogin(login) {
    const [rows] = await this.db.execute(
      `
        SELECT
          u.id AS usuario_id,
          u.uuid,
          u.nome,
          u.email,
          u.telefone,
          u.whatsapp,
          u.senha_hash,
          u.status,
          a.id AS administrador_id,
          a.nivel_acesso
        FROM usuarios u
        INNER JOIN administradores a ON a.usuario_id = u.id
        WHERE (u.email = ? OR u.telefone = ?)
        LIMIT 1
      `,
      [login, login]
    );

    return rows[0] || null;
  }
}
