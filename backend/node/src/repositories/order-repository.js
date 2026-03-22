export class OrderRepository {
  constructor(db) {
    this.db = db;
  }

  async loadPayments(orderId) {
    try {
      const [payments] = await this.db.execute(
        "SELECT * FROM pedido_pagamentos WHERE pedido_id = ? ORDER BY created_at ASC, id ASC",
        [orderId]
      );
      return payments;
    } catch (error) {
      if (error?.code === "42P01") {
        return [];
      }

      throw error;
    }
  }

  async findCustomer(customerId) {
    const [rows] = await this.db.execute("SELECT * FROM clientes WHERE id = ? LIMIT 1", [customerId]);
    return rows[0] || null;
  }

  async nextStoreSequence(storeId) {
    const [rows] = await this.db.execute(
      "SELECT COALESCE(MAX(numero_pedido_loja), 0) + 1 AS next_number FROM pedidos WHERE loja_id = ?",
      [storeId]
    );
    return rows[0]?.next_number || 1;
  }

  async createOrder(connection, payload, items) {
    const [result] = await connection.execute(
      `
        INSERT INTO pedidos (
          codigo, carrinho_id, loja_id, cliente_id, numero_pedido_loja, status_pedido, status_pagamento,
          tipo_entrega, canal_venda, nome_cliente, telefone_cliente, email_cliente,
          endereco_entrega_cep, endereco_entrega_logradouro, endereco_entrega_numero, endereco_entrega_complemento,
          endereco_entrega_bairro, endereco_entrega_cidade, endereco_entrega_estado, referencia_entrega,
          observacoes_cliente, subtotal, desconto, taxa_entrega, total, data_confirmacao
        ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        payload.codigo,
        payload.loja_id,
        payload.cliente_id,
        payload.numero_pedido_loja,
        payload.status_pedido,
        payload.status_pagamento,
        payload.tipo_entrega,
        payload.canal_venda,
        payload.nome_cliente,
        payload.telefone_cliente,
        payload.email_cliente,
        payload.cep,
        payload.logradouro,
        payload.numero,
        payload.complemento,
        payload.bairro,
        payload.cidade,
        payload.estado,
        payload.referencia,
        payload.observacoes_cliente,
        payload.subtotal,
        payload.desconto,
        payload.taxa_entrega,
        payload.total
      ]
    );

    const orderId = result.insertId;

    for (const item of items) {
      await connection.execute(
        `
          INSERT INTO itens_pedido (
            pedido_id, produto_id, produto_nome, sku_produto, quantidade, preco_unitario, desconto_unitario, subtotal, observacoes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.produto_id,
          item.produto_nome,
          item.sku_produto,
          item.quantidade,
          item.preco_unitario,
          item.desconto_unitario,
          item.subtotal,
          item.observacoes
        ]
      );
    }

    await this.appendHistory(connection, orderId, null, payload.status_pedido, null, "Pedido criado pela API.");
    return orderId;
  }

  async ordersByStore(storeId, status = null) {
    let sql = "SELECT * FROM pedidos WHERE loja_id = ?";
    const params = [storeId];

    if (status) {
      sql += " AND status_pedido = ?";
      params.push(status);
    }

    sql += " ORDER BY created_at DESC, id DESC";
    const [orders] = await this.db.execute(sql, params);

    for (const order of orders) {
      const [items] = await this.db.execute(
        "SELECT * FROM itens_pedido WHERE pedido_id = ? ORDER BY id ASC",
        [order.id]
      );
      const payments = await this.loadPayments(order.id);
      const [history] = await this.db.execute(
        "SELECT * FROM historico_status_pedido WHERE pedido_id = ? ORDER BY created_at DESC, id DESC",
        [order.id]
      );
      order.items = items;
      order.payments = payments;
      order.history = history;
    }

    return orders;
  }

  async findOrder(storeId, orderId) {
    const [rows] = await this.db.execute(
      "SELECT * FROM pedidos WHERE loja_id = ? AND id = ? LIMIT 1",
      [storeId, orderId]
    );
    const order = rows[0];
    if (!order) {
      return null;
    }

    const [items] = await this.db.execute("SELECT * FROM itens_pedido WHERE pedido_id = ? ORDER BY id ASC", [orderId]);
    const payments = await this.loadPayments(orderId);
    const [history] = await this.db.execute(
      "SELECT * FROM historico_status_pedido WHERE pedido_id = ? ORDER BY created_at DESC, id DESC",
      [orderId]
    );
    order.items = items;
    order.payments = payments;
    order.history = history;
    return order;
  }

  async updateStatus(storeId, orderId, nextStatus, userId, note = null) {
    const current = await this.findOrder(storeId, orderId);
    if (!current) {
      return;
    }

    await this.db.execute(
      `
        UPDATE pedidos
        SET status_pedido = ?,
            data_saida_entrega = CASE WHEN ? = 'SAIU_PARA_ENTREGA' THEN NOW() ELSE data_saida_entrega END,
            data_conclusao = CASE WHEN ? = 'CONCLUIDO' THEN NOW() ELSE data_conclusao END,
            cancelado_em = CASE WHEN ? IN ('CANCELADO', 'RECUSADO') THEN NOW() ELSE cancelado_em END
        WHERE id = ?
          AND loja_id = ?
      `,
      [nextStatus, nextStatus, nextStatus, nextStatus, orderId, storeId]
    );

    await this.appendHistory(
      this.db,
      orderId,
      current.status_pedido,
      nextStatus,
      userId,
      note || "Status alterado pelo painel."
    );
  }

  async appendHistory(executor, orderId, previous, next, userId, note) {
    await executor.execute(
      `
        INSERT INTO historico_status_pedido (pedido_id, status_anterior, status_novo, alterado_por_usuario_id, observacao)
        VALUES (?, ?, ?, ?, ?)
      `,
      [orderId, previous, next, userId, note]
    );
  }
}
