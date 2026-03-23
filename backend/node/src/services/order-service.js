import { ApiError } from "../lib/api-error.js";
import { orderCode } from "../lib/strings.js";

const ALLOWED_STATUS_FLOW = {
  NOVO: ["ACEITO", "CANCELADO", "RECUSADO"],
  ACEITO: ["EM_PREPARO", "CANCELADO"],
  EM_PREPARO: ["SAIU_PARA_ENTREGA", "CONCLUIDO", "CANCELADO"],
  SAIU_PARA_ENTREGA: ["CONCLUIDO", "CANCELADO"]
};

const PAYMENT_METHODS = new Set(["DINHEIRO", "PIX", "DEBITO", "CREDITO", "OUTRO"]);
const PAYMENT_STATUSES = new Set(["PENDENTE", "PAGO", "PARCIAL", "CANCELADO", "ESTORNADO"]);

export class OrderService {
  constructor(pool, storeRepository, catalogRepository, orderRepository, paymentRecordRepository, optionGroupRepository) {
    this.pool = pool;
    this.storeRepository = storeRepository;
    this.catalogRepository = catalogRepository;
    this.orderRepository = orderRepository;
    this.paymentRecordRepository = paymentRecordRepository;
    this.optionGroupRepository = optionGroupRepository;
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
    const optionGroups = await this.optionGroupRepository.byStore(Number(store.id));
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

      const customization = this.resolveItemCustomization(
        item,
        optionGroups.filter((group) => {
          const active = typeof group.ativo === "boolean" ? group.ativo : Number(group.ativo || 0) === 1;
          const productIds = Array.isArray(group.links) ? group.links.map((link) => Number(link.product_id)) : [];
          return active && productIds.includes(productId);
        })
      );

      const baseUnitPrice = product.preco_promocional !== null && product.preco_promocional !== undefined
        ? Number(product.preco_promocional)
        : Number(product.preco);
      const unitPrice = Number((baseUnitPrice + customization.extraPrice).toFixed(2));
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
        observacoes: customization.summaryText || item.observacoes || null
      });
    }

    const discount = Number(payload.desconto ?? 0);
    const deliveryFee = Number(payload.taxa_entrega ?? store.taxa_entrega_padrao ?? 0);
    const sequence = await this.orderRepository.nextStoreSequence(Number(store.id));
    const total = Number((subtotal - discount + deliveryFee).toFixed(2));
    const payments = this.normalizePayments(payload.pagamentos, total);
    const paymentStatus = this.resolveOrderPaymentStatus(payments, total, payload.status_pagamento);

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
          status_pagamento: paymentStatus,
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

      if (payments.length) {
        await this.paymentRecordRepository.createMany(connection, Number(store.id), orderId, payments);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw new ApiError("Falha ao criar pedido.", 500, { exception: error.message });
    } finally {
      connection.release();
    }

    return this.orderRepository.findOrder(Number(store.id), orderId);
  }

  async updateStatus(storeId, orderId, nextStatus, userId, reason = null) {
    const order = await this.orderRepository.findOrder(storeId, orderId);
    if (!order) {
      throw new ApiError("Pedido nao encontrado.", 404);
    }

    const current = order.status_pedido;
    const allowed = ALLOWED_STATUS_FLOW[current] || [];
    if (nextStatus !== current && !allowed.includes(nextStatus)) {
      throw new ApiError("Transicao de status invalida.", 422, { current, allowed });
    }

    if (["CANCELADO", "RECUSADO"].includes(nextStatus) && !String(reason || "").trim()) {
      throw new ApiError("Informe o motivo ao cancelar ou recusar o pedido.", 422);
    }

    await this.orderRepository.updateStatus(storeId, orderId, nextStatus, userId, reason);
    return this.orderRepository.findOrder(storeId, orderId);
  }

  normalizePayments(rawPayments, orderTotal) {
    if (!Array.isArray(rawPayments) || rawPayments.length === 0) {
      return [];
    }

    return rawPayments
      .map((entry) => {
        const method = String(entry?.metodo_pagamento || entry?.method || "DINHEIRO").trim().toUpperCase();
        const status = String(entry?.status_pagamento || entry?.status || "PAGO").trim().toUpperCase();
        const amount = Number(entry?.valor ?? entry?.amount ?? 0);
        const amountReceived = entry?.valor_recebido ?? entry?.amountReceived ?? null;
        const normalizedAmountReceived = amountReceived === null || amountReceived === "" ? null : Number(amountReceived);
        const change = entry?.troco ?? entry?.change ?? null;
        const normalizedChange = change === null || change === "" ? null : Number(change);
        const reference = entry?.referencia_externa ?? entry?.reference ?? null;
        const notes = entry?.observacoes ?? entry?.notes ?? null;

        if (!PAYMENT_METHODS.has(method)) {
          throw new ApiError("Metodo de pagamento invalido.", 422, { method });
        }

        if (!PAYMENT_STATUSES.has(status)) {
          throw new ApiError("Status de pagamento invalido.", 422, { status });
        }

        if (!Number.isFinite(amount) || amount < 0) {
          throw new ApiError("Valor de pagamento invalido.", 422, { amount });
        }

        if (normalizedAmountReceived !== null && (!Number.isFinite(normalizedAmountReceived) || normalizedAmountReceived < 0)) {
          throw new ApiError("Valor recebido invalido.", 422, { amountReceived: normalizedAmountReceived });
        }

        if (normalizedChange !== null && (!Number.isFinite(normalizedChange) || normalizedChange < 0)) {
          throw new ApiError("Troco invalido.", 422, { change: normalizedChange });
        }

        if (status === "PAGO" && amount === 0 && Number(orderTotal || 0) > 0) {
          throw new ApiError("Pagamentos pagos precisam ter valor maior que zero.", 422);
        }

        if (method === "DINHEIRO" && normalizedAmountReceived !== null && normalizedAmountReceived < amount) {
          throw new ApiError("Valor recebido em dinheiro nao pode ser menor que o valor do pagamento.", 422);
        }

        return {
          method,
          status,
          amount: Number(amount.toFixed(2)),
          amountReceived: normalizedAmountReceived === null ? null : Number(normalizedAmountReceived.toFixed(2)),
          change: normalizedChange === null ? null : Number(normalizedChange.toFixed(2)),
          reference: reference ? String(reference).trim() : null,
          notes: notes ? String(notes).trim() : null
        };
      })
      .filter((payment) => payment.amount > 0 || payment.status !== "PAGO");
  }

  resolveOrderPaymentStatus(payments, orderTotal, fallbackStatus = null) {
    const normalizedFallback = String(fallbackStatus || "").trim().toUpperCase();

    if (!payments.length) {
      return PAYMENT_STATUSES.has(normalizedFallback) ? normalizedFallback : "PENDENTE";
    }

    const activePayments = payments.filter((entry) => !["CANCELADO", "ESTORNADO"].includes(entry.status));

    if (!activePayments.length) {
      if (payments.every((entry) => entry.status === "ESTORNADO")) {
        return "ESTORNADO";
      }

      if (payments.every((entry) => entry.status === "CANCELADO")) {
        return "CANCELADO";
      }
    }

    if (normalizedFallback && PAYMENT_STATUSES.has(normalizedFallback) && ["CANCELADO", "ESTORNADO"].includes(normalizedFallback)) {
      return normalizedFallback;
    }

    const paidAmount = activePayments
      .filter((entry) => ["PAGO", "PARCIAL"].includes(entry.status))
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    if (paidAmount <= 0) {
      return "PENDENTE";
    }

    if (paidAmount + 0.009 >= Number(orderTotal || 0)) {
      return "PAGO";
    }

    return "PARCIAL";
  }

  resolveItemCustomization(item, groups) {
    const selectedGroups = Array.isArray(item?.selected_groups) ? item.selected_groups : [];
    const customerNote = String(item?.customer_note || "").trim();
    const groupMap = new Map(groups.map((group) => [Number(group.id), group]));
    const normalizedGroups = [];
    let extraPrice = 0;

    for (const group of groups) {
      const incoming = selectedGroups.find((entry) => Number(entry.groupId) === Number(group.id));
      const type = String(group.tipo || "single");
      const required = typeof group.obrigatorio === "boolean" ? group.obrigatorio : Number(group.obrigatorio || 0) === 1;

      if (type === "text") {
        const textValue = String(incoming?.textValue || "").trim();
        if (required && !textValue) {
          throw new ApiError(`Preencha "${group.nome}".`, 422);
        }
        if (textValue) {
          normalizedGroups.push({
            name: group.nome,
            type,
            textValue,
            selectedOptions: []
          });
        }
        continue;
      }

      const selectedOptionIds = Array.isArray(incoming?.selectedOptions)
        ? incoming.selectedOptions.map((option) => Number(option.optionId))
        : [];
      const activeOptions = Array.isArray(group.options)
        ? group.options.filter((option) => (typeof option.ativo === "boolean" ? option.ativo : Number(option.ativo || 0) === 1))
        : [];
      const chosenOptions = activeOptions.filter((option) => selectedOptionIds.includes(Number(option.id)));
      const min = required ? Math.max(1, Number(group.minimo_selecoes || 0)) : Number(group.minimo_selecoes || 0);
      const max = Number(group.maximo_selecoes || (type === "single" ? 1 : activeOptions.length || 99));

      if (chosenOptions.length < min) {
        throw new ApiError(`Selecione ao menos ${min} opcao(oes) em "${group.nome}".`, 422);
      }

      if (chosenOptions.length > max) {
        throw new ApiError(`Selecione no maximo ${max} opcao(oes) em "${group.nome}".`, 422);
      }

      if (chosenOptions.length !== selectedOptionIds.length) {
        throw new ApiError(`Revise as opcoes escolhidas em "${group.nome}".`, 422);
      }

      if (chosenOptions.length) {
        const selectedOptions = chosenOptions.map((option) => {
          const priceDelta = Number(option.preco_adicional || 0);
          extraPrice += priceDelta;
          return {
            name: option.nome,
            priceDelta
          };
        });

        normalizedGroups.push({
          name: group.nome,
          type,
          textValue: "",
          selectedOptions
        });
      }
    }

    for (const incoming of selectedGroups) {
      if (!groupMap.has(Number(incoming.groupId))) {
        throw new ApiError("Grupo de personalizacao invalido para este produto.", 422);
      }
    }

    const summaryText = this.buildCustomizationSummary(normalizedGroups, customerNote).join(" | ");
    return {
      extraPrice: Number(extraPrice.toFixed(2)),
      summaryText: summaryText || null
    };
  }

  buildCustomizationSummary(selectedGroups, customerNote) {
    const lines = [];

    for (const group of selectedGroups) {
      if (group.type === "text") {
        if (group.textValue) {
          lines.push(`${group.name}: ${group.textValue}`);
        }
        continue;
      }

      if (!Array.isArray(group.selectedOptions) || !group.selectedOptions.length) {
        continue;
      }

      const value = group.selectedOptions
        .map((option) => option.priceDelta > 0 ? `${option.name} (+${option.priceDelta.toFixed(2)})` : option.name)
        .join(", ");

      lines.push(`${group.name}: ${value}`);
    }

    if (customerNote) {
      lines.push(`Observacao: ${customerNote}`);
    }

    return lines;
  }
}
