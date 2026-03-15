export class CatalogRepository {
  constructor(db) {
    this.db = db;
  }

  async productsByStore(storeId, onlyActive = false) {
    let sql = `
      SELECT
        p.*,
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

    sql += " ORDER BY c.ordem_exibicao ASC, p.nome ASC";
    const [rows] = await this.db.execute(sql, [storeId]);
    return rows;
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
    const params = [
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
      payload.controla_estoque ?? 1,
      payload.permite_venda_sem_estoque ?? 0,
      payload.destaque_home ?? 0,
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
        params.concat([productId, storeId])
      );

      return productId;
    }

    const [result] = await this.db.execute(
      `
        INSERT INTO produtos (
          loja_id, categoria_id, cardapio_id, sku, nome, slug, descricao, descricao_curta, imagem_url,
          preco, preco_promocional, custo, estoque_atual, estoque_minimo, controla_estoque,
          permite_venda_sem_estoque, destaque_home, peso_gramas, status_produto
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [storeId].concat(params)
    );

    return result.insertId;
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
