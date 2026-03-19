export class OptionGroupRepository {
  constructor(db) {
    this.db = db;
  }

  async byStore(storeId) {
    const [groups] = await this.db.execute(
      `
        SELECT *
        FROM product_option_groups
        WHERE loja_id = ?
        ORDER BY ordem_exibicao ASC, id DESC
      `,
      [storeId]
    );

    for (const group of groups) {
      const [options] = await this.db.execute(
        `
          SELECT *
          FROM product_option_items
          WHERE group_id = ?
          ORDER BY ordem_exibicao ASC, id ASC
        `,
        [group.id]
      );
      const [links] = await this.db.execute(
        `
          SELECT pgl.*, p.nome AS produto_nome
          FROM product_group_links pgl
          INNER JOIN produtos p ON p.id = pgl.product_id
          WHERE pgl.group_id = ?
          ORDER BY pgl.ordem_exibicao ASC, pgl.id ASC
        `,
        [group.id]
      );

      group.options = options;
      group.links = links;
    }

    return groups;
  }

  async upsert(storeId, payload, groupId = null) {
    const groupParams = [
      payload.name,
      payload.description ?? null,
      payload.type ?? "single",
      payload.required ?? false,
      payload.min_select ?? 0,
      payload.max_select ?? 1,
      payload.sort_order ?? 0,
      payload.active ?? true
    ];

    if (groupId) {
      await this.db.execute(
        `
          UPDATE product_option_groups
          SET nome = ?, descricao = ?, tipo = ?, obrigatorio = ?, minimo_selecoes = ?,
              maximo_selecoes = ?, ordem_exibicao = ?, ativo = ?
          WHERE id = ? AND loja_id = ?
        `,
        groupParams.concat([groupId, storeId])
      );
    } else {
      const [, meta] = await this.db.execute(
        `
          INSERT INTO product_option_groups (
            loja_id, nome, descricao, tipo, obrigatorio, minimo_selecoes, maximo_selecoes, ordem_exibicao, ativo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [storeId].concat(groupParams)
      );
      groupId = meta.insertId;
    }

    await this.db.execute("DELETE FROM product_option_items WHERE group_id = ?", [groupId]);
    await this.db.execute("DELETE FROM product_group_links WHERE group_id = ?", [groupId]);

    for (const option of payload.options || []) {
      await this.db.execute(
        `
          INSERT INTO product_option_items (group_id, nome, descricao, preco_adicional, ordem_exibicao, ativo)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          groupId,
          option.name,
          option.description ?? null,
          option.price_delta ?? 0,
          option.sort_order ?? 0,
          option.active ?? true
        ]
      );
    }

    for (const [index, productId] of (payload.product_ids || []).entries()) {
      await this.db.execute(
        `
          INSERT INTO product_group_links (product_id, group_id, ordem_exibicao)
          VALUES (?, ?, ?)
        `,
        [productId, groupId, index + 1]
      );
    }

    return groupId;
  }

  async delete(storeId, groupId) {
    await this.db.execute(
      `
        DELETE FROM product_option_groups
        WHERE id = ?
          AND loja_id = ?
      `,
      [groupId, storeId]
    );
  }
}
