import { ApiError } from "../lib/api-error.js";
import { orderCode } from "../lib/strings.js";

const ALLOWED_STATUS_FLOW = {
  NOVO: ["ACEITO", "CANCELADO", "RECUSADO"],
  ACEITO: ["EM_PREPARO", "CANCELADO"],
  EM_PREPARO: ["SAIU_PARA_ENTREGA", "CONCLUIDO", "CANCELADO"],
  SAIU_PARA_ENTREGA: ["CONCLUIDO", "CANCELADO"]
};

export class OrderService {
  constructor(pool, storeRepository, catalogRepository, orderRepository) {
    this.pool = pool;
    this.storeRepository = storeRepository;
    this.catalogRepository = catalogRepository;
    this.orderRepository = orderRepository;
  }

  async create(payload) {
    for (const field of ["store_slug", "cliente_id", "nome_cliente", "telefone_cliente", "itens"]) {
      if (payload[field] === undefined || payload[field] === "" || (Array.isArray(payload[field]) && payload[field].length === 0)) {
        throw new ApiError("Campos obrigatorios ausentes.", 422, { missing: [field] });
      }
    }

    if (!Array.isArray(payload.itens) || payload.itens.length === 0) {
      throw new ApiError("Envie ao menos um item no pedido.", 422);
    }

    const store = await this.storeRepository.findStoreBySlug(payload.store_slug);
    if (!store || store.status_loja !== "ATIVA") {
      throw new ApiError("Loja indisponivel para pedidos.", 404);
    }

    const customer = await this.orderRepository.findCustomer(Number(payload.cliente_id));
    if (!customer) {
      throw new ApiError("Cliente nao encontrado.", 404);
    }

    const products = await this.catalogRepository.productsByStore(Number(store.id), true);
    const catalog = new Map(products.map((item) => [Number(item.id), item]));
    const items = [];
    let subtotal = 0;

    for (const item of payload.itens) {
      const productId = Number(item.produto_id || 0);
      const quantity = Math.max(1, Number(item.quantidade || 1));
      const product = catalog.get(productId);
      if (!product) {
        throw new ApiError("Produto invalido ou indisponivel.", 422, { produto_id: productId });
      }

      const unitPrice = product.preco_promocional !== null && product.preco_promocional !== undefined
        ? Number(product.preco_promocional)
        : Number(product.preco);
      const lineSubtotal = Number((unitPrice * quantity).toFixed(2));
      subtotal += lineSubtotal;

      items.push({
        produto_id: productId,
        produto_nome: product.nome,
        sku_produto: product.sku,
        quantidade: quantity,
        preco_unitario: unitPrice,
        desconto_unitario: 0,
        subtotal: lineSubtotal,
        observacoes: item.observacoes ?? null
      });
    }

    const discount = Number(payload.desconto ?? 0);
    const deliveryFee = Number(payload.taxa_entrega ?? store.taxa_entrega_padrao ?? 0);
    const sequence = await this.orderRepository.nextStoreSequence(Number(store.id));
    const total = Number((subtotal - discount + deliveryFee).toFixed(2));

    // Pedido e itens precisam ser persistidos juntos para manter a numeracao e o total consistentes.
    const connection = await this.pool.getConnection();
    let orderId = null;

    try {
      await connection.beginTransaction();
      orderId = await this.orderRepository.createOrder(
        connection,
        {
          codigo: orderCode(sequence),
          loja_id: Number(store.id),
          cliente_id: Number(payload.cliente_id),
          numero_pedido_loja: sequence,
          status_pedido: "NOVO",
          status_pagamento: payload.status_pagamento ?? "PENDENTE",
          tipo_entrega: payload.tipo_entrega ?? "ENTREGA",
          canal_venda: payload.canal_venda ?? "SITE",
          nome_cliente: payload.nome_cliente,
          telefone_cliente: payload.telefone_cliente,
          email_cliente: payload.email_cliente ?? null,
          cep: payload.cep ?? null,
          logradouro: payload.logradouro ?? null,
          numero: payload.numero ?? null,
          complemento: payload.complemento ?? null,
          bairro: payload.bairro ?? null,
          cidade: payload.cidade ?? null,
          estado: payload.estado ?? null,
          referencia: payload.referencia ?? null,
          observacoes_cliente: payload.observacoes_cliente ?? null,
          subtotal: Number(subtotal.toFixed(2)),
          desconto: Number(discount.toFixed(2)),
          taxa_entrega: Number(deliveryFee.toFixed(2)),
          total
        },
        items
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw new ApiError("Falha ao criar pedido.", 500, { exception: error.message });
    } finally {
      connection.release();
    }

    return this.orderRepository.findOrder(Number(store.id), orderId);
  }

  async updateStatus(storeId, orderId, nextStatus, userId) {
    const order = await this.orderRepository.findOrder(storeId, orderId);
    if (!order) {
      throw new ApiError("Pedido nao encontrado.", 404);
    }

    const current = order.status_pedido;
    const allowed = ALLOWED_STATUS_FLOW[current] || [];
    if (nextStatus !== current && !allowed.includes(nextStatus)) {
      throw new ApiError("Transicao de status invalida.", 422, { current, allowed });
    }

    await this.orderRepository.updateStatus(storeId, orderId, nextStatus, userId);
    return this.orderRepository.findOrder(storeId, orderId);
  }
}
