export class AuthRepository {
  constructor(db) {
    this.db = db;
  }

  async findMerchantByLoginFallback(login) {
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
          l.modo_operacao,
          'ADMIN' AS perfil_loja
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

  async findMerchantByLogin(login) {
    try {
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
            l.modo_operacao,
            COALESCE(ul.perfil_loja, 'ADMIN') AS perfil_loja
          FROM usuarios u
          INNER JOIN donos_loja dl ON dl.usuario_id = u.id
          LEFT JOIN lojas l ON l.dono_loja_id = dl.id AND l.deleted_at IS NULL
          LEFT JOIN usuarios_loja ul ON ul.usuario_id = u.id AND ul.loja_id = l.id AND ul.ativo = TRUE
          WHERE (u.email = ? OR u.telefone = ? OR u.whatsapp = ?)
          LIMIT 1
        `,
        [login, login, login]
      );

      return rows[0] || null;
    } catch (error) {
      if (error?.code !== "42P01") {
        throw error;
      }

      return this.findMerchantByLoginFallback(login);
    }
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
