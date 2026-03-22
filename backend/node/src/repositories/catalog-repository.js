export class CatalogRepository {
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

  buildProductParams(payload) {
    return [
      payload.categoria_id ?? null,
      payload.cardapio_id ?? null,
      payload.sku ?? null,
      payload.nome,
      payload.slug,
      payload.descricao ?? null,
      payload.descricao_curta ?? null,
      payload.imagem_url ?? null,
      payload.preco,
      payload.preco_promocional ?? null,
      payload.custo ?? null,
      payload.estoque_atual ?? 0,
      payload.estoque_minimo ?? 0,
      this.normalizeBoolean(payload.controla_estoque, true),
      this.normalizeBoolean(payload.permite_venda_sem_estoque, false),
      this.normalizeBoolean(payload.destaque_home, false),
      this.normalizeBoolean(payload.destaque_cardapio, false),
      payload.tipo_produto ?? "PADRAO",
      payload.ordem_exibicao ?? 0,
      payload.disponivel_inicio ?? null,
      payload.disponivel_fim ?? null,
      payload.peso_gramas ?? null,
      payload.status_produto ?? "ATIVO"
    ];
  }

  async productsByStore(storeId, onlyActive = false) {
    const buildSql = (includeExtended = true) => {
      const extended = includeExtended ? `
        p.destaque_cardapio,
        p.tipo_produto,
        p.ordem_exibicao,
        p.disponivel_inicio,
        p.disponivel_fim,
      ` : "";

      let sql = `
        SELECT
          p.*,
          ${extended}
          c.nome AS categoria_nome,
          ca.nome AS cardapio_nome
        FROM produtos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        LEFT JOIN cardapios ca ON ca.id = p.cardapio_id
        WHERE p.loja_id = ?
          AND p.deleted_at IS NULL
      `;

      if (onlyActive) {
        sql += " AND p.status_produto = 'ATIVO'";
      }

      sql += includeExtended
        ? " ORDER BY COALESCE(p.ordem_exibicao, 0) ASC, c.ordem_exibicao ASC, p.nome ASC"
        : " ORDER BY c.ordem_exibicao ASC, p.nome ASC";

      return sql;
    };

    try {
      const [rows] = await this.db.execute(buildSql(true), [storeId]);
      return rows;
    } catch (error) {
      if (error?.code !== "42703") {
        throw error;
      }

      const [rows] = await this.db.execute(buildSql(false), [storeId]);
      return rows;
    }
  }

  async findProduct(storeId, productId) {
    const [rows] = await this.db.execute(
      `
        SELECT *
        FROM produtos
        WHERE id = ?
          AND loja_id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [productId, storeId]
    );

    return rows[0] || null;
  }

  async upsertProduct(storeId, payload, productId = null) {
    const params = this.buildProductParams(payload);

    try {
      if (productId) {
        await this.db.execute(
          `
            UPDATE produtos
            SET categoria_id = ?, cardapio_id = ?, sku = ?, nome = ?, slug = ?, descricao = ?, descricao_curta = ?,
                imagem_url = ?, preco = ?, preco_promocional = ?, custo = ?, estoque_atual = ?, estoque_minimo = ?,
                controla_estoque = ?, permite_venda_sem_estoque = ?, destaque_home = ?, destaque_cardapio = ?,
                tipo_produto = ?, ordem_exibicao = ?, disponivel_inicio = ?, disponivel_fim = ?, peso_gramas = ?,
                status_produto = ?
            WHERE id = ? AND loja_id = ?
          `,
          params.concat([productId, storeId])
        );

        return productId;
      }

      const [, meta] = await this.db.execute(
        `
          INSERT INTO produtos (
            loja_id, categoria_id, cardapio_id, sku, nome, slug, descricao, descricao_curta, imagem_url,
            preco, preco_promocional, custo, estoque_atual, estoque_minimo, controla_estoque,
            permite_venda_sem_estoque, destaque_home, destaque_cardapio, tipo_produto, ordem_exibicao,
            disponivel_inicio, disponivel_fim, peso_gramas, status_produto
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [storeId].concat(params)
      );

      return meta.insertId;
    } catch (error) {
      if (error?.code !== "42703") {
        throw error;
      }

      const fallbackParams = [
        payload.categoria_id ?? null,
        payload.cardapio_id ?? null,
        payload.sku ?? null,
        payload.nome,
        payload.slug,
        payload.descricao ?? null,
        payload.descricao_curta ?? null,
        payload.imagem_url ?? null,
        payload.preco,
        payload.preco_promocional ?? null,
        payload.custo ?? null,
        payload.estoque_atual ?? 0,
        payload.estoque_minimo ?? 0,
        this.normalizeBoolean(payload.controla_estoque, true),
        this.normalizeBoolean(payload.permite_venda_sem_estoque, false),
        this.normalizeBoolean(payload.destaque_home, false),
        payload.peso_gramas ?? null,
        payload.status_produto ?? "ATIVO"
      ];

      if (productId) {
        await this.db.execute(
          `
            UPDATE produtos
            SET categoria_id = ?, cardapio_id = ?, sku = ?, nome = ?, slug = ?, descricao = ?, descricao_curta = ?,
                imagem_url = ?, preco = ?, preco_promocional = ?, custo = ?, estoque_atual = ?, estoque_minimo = ?,
                controla_estoque = ?, permite_venda_sem_estoque = ?, destaque_home = ?, peso_gramas = ?, status_produto = ?
            WHERE id = ? AND loja_id = ?
          `,
          fallbackParams.concat([productId, storeId])
        );

        return productId;
      }

      const [, meta] = await this.db.execute(
        `
          INSERT INTO produtos (
            loja_id, categoria_id, cardapio_id, sku, nome, slug, descricao, descricao_curta, imagem_url,
            preco, preco_promocional, custo, estoque_atual, estoque_minimo, controla_estoque,
            permite_venda_sem_estoque, destaque_home, peso_gramas, status_produto
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [storeId].concat(fallbackParams)
      );

      return meta.insertId;
    }
  }

  async deleteProduct(storeId, productId) {
    await this.db.execute(
      `
        UPDATE produtos
        SET deleted_at = NOW(), status_produto = 'INATIVO'
        WHERE id = ? AND loja_id = ?
      `,
      [productId, storeId]
    );
  }
}
