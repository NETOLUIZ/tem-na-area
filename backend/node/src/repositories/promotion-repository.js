export class PromotionRepository {
  constructor(db) {
    this.db = db;
  }

  async byStore(storeId) {
    const [rows] = await this.db.execute(
      `
        SELECT
          ch.*,
          p.id AS produto_id,
          p.nome AS produto_nome,
          p.imagem_url AS produto_imagem_url,
          p.preco,
          p.preco_promocional
        FROM cards_home ch
        LEFT JOIN produtos p
          ON p.id = CASE
            WHEN ch.link_destino ~ '^[0-9]+$' THEN CAST(ch.link_destino AS BIGINT)
            ELSE NULL
          END
        WHERE ch.loja_id = ?
          AND ch.tipo_card = 'PROMOCAO'
        ORDER BY ch.created_at DESC, ch.id DESC
      `,
      [storeId]
    );

    return rows;
  }

  async upsert(storeId, payload, promotionId = null) {
    const params = [
      payload.title,
      payload.subtitle ?? null,
      payload.description ?? null,
      payload.image_url ?? null,
      payload.button_label ?? "Ver oferta",
      String(payload.product_id),
      payload.sort_order ?? 0,
      payload.active ?? true,
      payload.date_start ?? new Date(),
      payload.date_end ?? new Date(Date.now() + 172800000)
    ];

    if (promotionId) {
      await this.db.execute(
        `
          UPDATE cards_home
          SET titulo_exibicao = ?, subtitulo_exibicao = ?, descricao_curta = ?, imagem_url = ?, botao_label = ?,
              link_destino = ?, ordem_exibicao = ?, ativo = ?, data_inicio = ?, data_fim = ?
          WHERE id = ? AND loja_id = ? AND tipo_card = 'PROMOCAO'
        `,
        params.concat([promotionId, storeId])
      );

      return promotionId;
    }

    const [, meta] = await this.db.execute(
      `
        INSERT INTO cards_home (
          loja_id, titulo_exibicao, subtitulo_exibicao, descricao_curta, imagem_url,
          botao_label, link_destino, tipo_card, ordem_exibicao, ativo, data_inicio, data_fim
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PROMOCAO', ?, ?, ?, ?)
      `,
      [storeId].concat(params)
    );

    return meta.insertId;
  }

  async delete(storeId, promotionId) {
    await this.db.execute(
      `
        DELETE FROM cards_home
        WHERE id = ?
          AND loja_id = ?
          AND tipo_card = 'PROMOCAO'
      `,
      [promotionId, storeId]
    );
  }
}
