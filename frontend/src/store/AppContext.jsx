import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildSelectionSummary, serializeSelectionSignature, sumOptionPrices } from "../utils/customization";
import { uid } from "../utils/helpers";
import { api } from "../services/api";

const AppContext = createContext(null);

const SESSION_KEY = "temnaarea_sessions_v2";
const CART_KEY = "temnaarea_cart_v2";

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initialState() {
  return {
    stores: [],
    items: [],
    orders: [],
    logs: [],
    homePromotions: [],
    productOptionGroups: [],
    contactLeads: [],
    adminStores: [],
    adminSummary: null,
    adminRecentRequests: [],
    cart: loadJson(CART_KEY, { storeId: null, items: [] }),
    sessions: {
      merchantToken: null,
      merchantStoreId: null,
      merchantUser: null,
      superAdminToken: null,
      superAdmin: false,
      adminUser: null,
      ...loadJson(SESSION_KEY, {})
    }
  };
}

function toNumber(value) {
  return Number(value || 0);
}

function mapStore(store) {
  const city = store.endereco_cidade || store.cidade || "";
  const state = store.endereco_estado || store.estado || "";
  const street = store.endereco_logradouro || store.endereco_rua || "";
  const number = store.endereco_numero || "";

  return {
    id: String(store.id),
    slug: store.slug || null,
    nome: store.nome || store.loja_nome || "",
    categoria: store.categoria_principal || store.categoria || "",
    descricaoCurta: store.descricao_curta || "",
    whatsapp: store.whatsapp || "",
    telefone: store.telefone || store.responsavel_telefone || "",
    email: store.email_contato || store.responsavel_email || "",
    horarioFuncionamento: store.horario_funcionamento || "",
    status: store.status_loja || store.status || "PENDENTE",
    cardMode: store.modo_operacao || "LOJA_COMPLETA",
    planType: store.plano_codigo || "",
    metrics: {
      cliquesWhatsapp: 0,
      cliquesSite: 0,
      visitasPagina: 0
    },
    rating: {
      total: 0,
      count: 0,
      average: 0
    },
    endereco: {
      rua: [street, number].filter(Boolean).join(", "),
      bairro: store.endereco_bairro || "",
      cidade: city,
      estado: state
    },
    imagens: {
      logo: store.logo_url || "",
      capa: store.capa_url || ""
    },
    config: {
      taxaEntregaPadrao: toNumber(store.taxa_entrega_padrao),
      pedidoMinimo: toNumber(store.pedido_minimo),
      tempoMedioPreparoMinutos: Number(store.tempo_medio_preparo_minutos || 0)
    },
    createdAt: store.created_at || new Date().toISOString()
  };
}

function mapProduct(product) {
  const promotionalPrice = product.preco_promocional == null ? null : toNumber(product.preco_promocional);
  const regularPrice = toNumber(product.preco);

  return {
    id: String(product.id),
    storeId: String(product.loja_id || product.store_id),
    nome: product.nome,
    categoria: product.categoria_nome || product.categoria || "Outros",
    descricao: product.descricao || product.descricao_curta || "",
    preco: promotionalPrice ?? regularPrice,
    precoAntigo: promotionalPrice != null ? regularPrice : null,
    imagem: product.imagem_url || "",
    tags: product.destaque_home ? ["Destaque"] : [],
    ativo: product.status_produto === "ATIVO",
    createdAt: product.created_at || new Date().toISOString()
  };
}

function mapOrder(order) {
  return {
    id: String(order.id),
    codigo: order.codigo || String(order.id),
    storeId: String(order.loja_id),
    total: toNumber(order.total),
    subtotal: toNumber(order.subtotal),
    desconto: toNumber(order.desconto),
    taxaEntrega: toNumber(order.taxa_entrega),
    status: order.status_pedido,
    paymentStatus: order.status_pagamento,
    createdAt: order.created_at || new Date().toISOString(),
    cliente: {
      nome: order.nome_cliente || "",
      telefone: order.telefone_cliente || "",
      enderecoEntrega: [
        order.endereco_entrega_logradouro,
        order.endereco_entrega_numero,
        order.endereco_entrega_bairro,
        order.endereco_entrega_cidade
      ].filter(Boolean).join(", "),
      observacoes: order.observacoes_cliente || ""
    },
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          id: String(item.id),
          itemId: String(item.produto_id),
          nome: item.produto_nome,
          quantidade: Number(item.quantidade || 1),
          unitPrice: toNumber(item.preco_unitario),
          selectedGroups: [],
          customerNote: item.observacoes || ""
        }))
      : []
  };
}

function mapPromotion(promotion, fallbackStoreId = null) {
  return {
    id: String(promotion.id),
    storeId: String(promotion.loja_id || fallbackStoreId || ""),
    itemId: String(promotion.produto_id || promotion.link_destino || ""),
    title: promotion.titulo_exibicao || "",
    subtitle: promotion.subtitulo_exibicao || "",
    badge: promotion.botao_label || "Destaque",
    active: typeof promotion.ativo === "boolean" ? promotion.ativo : Number(promotion.ativo ?? 1) === 1,
    createdAt: promotion.created_at || new Date().toISOString(),
    expiresAt: promotion.data_fim || new Date(Date.now() + 172800000).toISOString(),
    item: promotion.produto_id
      ? {
          id: String(promotion.produto_id),
          nome: promotion.produto_nome,
          imagem: promotion.produto_imagem_url || "",
          preco: toNumber(promotion.preco_promocional ?? promotion.preco),
          precoAntigo: promotion.preco_promocional != null ? toNumber(promotion.preco) : null
        }
      : null
  };
}

function mapOptionGroup(group) {
  return {
    id: String(group.id),
    storeId: String(group.loja_id),
    name: group.nome,
    description: group.descricao || "",
    type: group.tipo,
    required: typeof group.obrigatorio === "boolean" ? group.obrigatorio : Number(group.obrigatorio || 0) === 1,
    minSelect: Number(group.minimo_selecoes || 0),
    maxSelect: Number(group.maximo_selecoes || 1),
    sortOrder: Number(group.ordem_exibicao || 0),
    active: typeof group.ativo === "boolean" ? group.ativo : Number(group.ativo || 0) === 1,
    productIds: Array.isArray(group.links) ? group.links.map((link) => String(link.product_id)) : [],
    options: Array.isArray(group.options)
      ? group.options.map((option) => ({
          id: String(option.id),
          groupId: String(option.group_id),
          name: option.nome,
          description: option.descricao || "",
          priceDelta: toNumber(option.preco_adicional),
          sortOrder: Number(option.ordem_exibicao || 0),
          active: typeof option.ativo === "boolean" ? option.ativo : Number(option.ativo || 0) === 1
        }))
      : []
  };
}

function mapLead(lead) {
  return {
    id: String(lead.id),
    nome: lead.nome_empresa,
    categoria: lead.categoria_principal || "",
    cidade: lead.cidade || "",
    whatsapp: lead.whatsapp || "",
    status: lead.status_solicitacao,
    publishedAsCard: lead.status_solicitacao === "APROVADA",
    createdAt: lead.created_at || new Date().toISOString()
  };
}

function uniqueById(items) {
  const map = new Map();
  items.forEach((item) => {
    map.set(String(item.id), item);
  });
  return [...map.values()];
}

function validateConfiguration(product, groups, configuration = {}) {
  const errors = [];
  const selectedGroups = [];
  const selections = configuration.selections || {};

  groups.forEach((group) => {
    if (group.type === "text") {
      const value = String(selections[group.id]?.textValue || "").trim();
      if (group.required && !value) {
        errors.push(`Preencha "${group.name}".`);
      }
      if (value) {
        selectedGroups.push({
          groupId: group.id,
          name: group.name,
          type: group.type,
          textValue: value,
          selectedOptions: []
        });
      }
      return;
    }

    const selectedIds = Array.isArray(selections[group.id]?.selectedOptionIds)
      ? selections[group.id].selectedOptionIds
      : [];

    const selectedOptions = group.options.filter((option) => selectedIds.includes(option.id));
    const count = selectedOptions.length;
    const min = group.required ? Math.max(1, Number(group.minSelect || 0)) : Number(group.minSelect || 0);
    const max = Number(group.maxSelect || (group.type === "single" ? 1 : group.options.length || 99));

    if (count < min) errors.push(`Selecione ao menos ${min} opcao(oes) em "${group.name}".`);
    if (count > max) errors.push(`Selecione no maximo ${max} opcao(oes) em "${group.name}".`);

    if (count) {
      selectedGroups.push({
        groupId: group.id,
        name: group.name,
        type: group.type,
        textValue: "",
        selectedOptions: selectedOptions.map((option) => ({
          optionId: option.id,
          name: option.name,
          description: option.description,
          priceDelta: Number(option.priceDelta || 0)
        }))
      });
    }
  });

  const quantity = Math.max(1, Number(configuration.quantidade || 1));
  const customerNote = String(configuration.customerNote || "").trim();
  const optionPrice = sumOptionPrices(selectedGroups);
  const basePrice = Number(product.preco || 0);

  return {
    ok: !errors.length,
    errors,
    cartItem: {
      id: uid("cart"),
      itemId: product.id,
      quantidade: quantity,
      basePrice,
      unitPrice: basePrice + optionPrice,
      selectedGroups,
      customerNote,
      signature: serializeSelectionSignature(selectedGroups, customerNote),
      createdAt: new Date().toISOString()
    }
  };
}

export function AppProvider({ children }) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    saveJson(SESSION_KEY, state.sessions);
  }, [state.sessions]);

  useEffect(() => {
    saveJson(CART_KEY, state.cart);
  }, [state.cart]);

  async function loadHome() {
    const data = await api.publicHome();
    const stores = (data.stores || []).map(mapStore);
    const homePromotions = (data.cards || [])
      .filter((card) => card.tipo_card === "PROMOCAO")
      .map((card) => mapPromotion(card, card.loja_id));

    setState((prev) => ({
      ...prev,
      stores,
      homePromotions
    }));

    return stores;
  }

  async function loadStoreBySlug(slug) {
    const data = await api.publicStore(slug);
    const mappedStore = mapStore(data.store);
    const mappedProducts = (data.products || []).map(mapProduct);
    const productOptionGroups = (data.option_groups || []).map(mapOptionGroup);

    setState((prev) => ({
      ...prev,
      stores: uniqueById([...prev.stores.filter((item) => item.id !== mappedStore.id), mappedStore]),
      productOptionGroups: [
        ...prev.productOptionGroups.filter((entry) => entry.storeId !== mappedStore.id),
        ...productOptionGroups
      ],
      items: uniqueById([
        ...prev.items.filter((item) => item.storeId !== mappedStore.id),
        ...mappedProducts
      ])
    }));

    return {
      store: mappedStore,
      products: mappedProducts,
      optionGroups: productOptionGroups
    };
  }

  async function hydrateMerchantSession(token) {
    const [dashboard, ordersPayload, productsPayload, settingsPayload, groupsPayload, promotionsPayload] = await Promise.all([
      api.merchantDashboard(token),
      api.merchantOrders(token),
      api.merchantProducts(token),
      api.merchantSettings(token),
      api.merchantOptionGroups(token),
      api.merchantPromotions(token)
    ]);

    const store = mapStore(settingsPayload.store || dashboard.store || {});
    const items = (productsPayload.products || []).map(mapProduct);
    const orders = (ordersPayload.orders || []).map(mapOrder);
    const productOptionGroups = (groupsPayload.groups || []).map(mapOptionGroup);
    const homePromotions = (promotionsPayload.promotions || []).map((promotion) => mapPromotion(promotion, store.id));

    setState((prev) => ({
      ...prev,
      stores: uniqueById([...prev.stores.filter((entry) => entry.id !== store.id), store]),
      items: uniqueById([...prev.items.filter((entry) => entry.storeId !== store.id), ...items]),
      orders: uniqueById([...prev.orders.filter((entry) => entry.storeId !== store.id), ...orders]),
      productOptionGroups: [
        ...prev.productOptionGroups.filter((entry) => entry.storeId !== store.id),
        ...productOptionGroups
      ],
      homePromotions: [
        ...prev.homePromotions.filter((entry) => entry.storeId !== store.id),
        ...homePromotions
      ],
      sessions: {
        ...prev.sessions,
        merchantToken: token,
        merchantStoreId: store.id
      }
    }));

    return { store, orders, items, dashboard, productOptionGroups, homePromotions };
  }

  async function hydrateAdminSession(token) {
    const [dashboard, storesPayload, logsPayload, leadsPayload] = await Promise.all([
      api.adminDashboard(token),
      api.adminStores(token),
      api.adminLogs(token),
      api.adminLeads(token)
    ]);

    const adminStores = (storesPayload.stores || []).map(mapStore);
    const logs = (logsPayload.logs || []).map((log) => ({
      id: String(log.id),
      actionType: log.tipo,
      storeId: log.entidade,
      storeName: log.entidade,
      motivo: log.descricao || "",
      createdAt: log.created_at
    }));

    setState((prev) => ({
      ...prev,
      adminStores,
      adminSummary: dashboard.summary || null,
      adminRecentRequests: dashboard.recent_requests || [],
      logs,
      contactLeads: (leadsPayload.leads || []).map(mapLead),
      sessions: {
        ...prev.sessions,
        superAdminToken: token,
        superAdmin: true
      }
    }));
  }

  useEffect(() => {
    loadHome().catch(() => {});

    if (state.sessions.merchantToken) {
      hydrateMerchantSession(state.sessions.merchantToken).catch(() => {
        setState((prev) => ({
          ...prev,
          sessions: {
            ...prev.sessions,
            merchantToken: null,
            merchantStoreId: null,
            merchantUser: null
          }
        }));
      });
    }

    if (state.sessions.superAdminToken) {
      hydrateAdminSession(state.sessions.superAdminToken).catch(() => {
        setState((prev) => ({
          ...prev,
          sessions: {
            ...prev.sessions,
            superAdminToken: null,
            superAdmin: false,
            adminUser: null
          }
        }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = useMemo(() => ({
    async refreshHome() {
      return loadHome();
    },

    async fetchStoreBySlug(slug) {
      return loadStoreBySlug(slug);
    },

    incrementMetric() {
      return null;
    },

    rateStore() {
      return null;
    },

    addToCart(storeId, itemId, configuration = {}) {
      let result = { ok: false, message: "Não foi possível adicionar o item." };

      setState((prev) => {
        const incomingStore = prev.stores.find((store) => store.id === storeId);
        const product = prev.items.find((item) => item.id === itemId && item.storeId === storeId);

        if (!incomingStore || incomingStore.status !== "ATIVA" || !product || !product.ativo) {
          result = { ok: false, message: "Produto indisponivel." };
          return prev;
        }

        const groups = prev.productOptionGroups.filter((group) => group.productIds.includes(String(itemId)) && group.active);
        const validated = validateConfiguration(product, groups, configuration);
        if (!validated.ok) {
          result = { ok: false, message: validated.errors[0] || "Revise a montagem do pedido." };
          return prev;
        }

        const isSameStore = !prev.cart.storeId || prev.cart.storeId === storeId;
        const nextItems = isSameStore ? [...prev.cart.items] : [];
        const line = validated.cartItem;
        const found = nextItems.find((item) => item.itemId === itemId && item.signature === line.signature);

        if (found) {
          found.quantidade += line.quantidade;
        } else {
          nextItems.unshift(line);
        }

        result = { ok: true, cartItemId: found?.id || line.id };

        return {
          ...prev,
          cart: {
            storeId,
            items: nextItems
          }
        };
      });

      return result;
    },

    setCartQuantity(cartItemId, quantidade) {
      setState((prev) => {
        const next = prev.cart.items
          .map((item) => (item.id === cartItemId ? { ...item, quantidade } : item))
          .filter((item) => item.quantidade > 0);

        return {
          ...prev,
          cart: {
            storeId: next.length ? prev.cart.storeId : null,
            items: next
          }
        };
      });
    },

    clearCart() {
      setState((prev) => ({
        ...prev,
        cart: { storeId: null, items: [] }
      }));
    },

    async createOrder(payload) {
      const cart = state.cart;
      const store = state.stores.find((entry) => entry.id === cart.storeId);
      if (!store || !cart.items.length) {
        return null;
      }

      const customerId = 1;
      const [logradouro = "", numero = "", bairro = "", cidade = ""] = String(payload.enderecoEntrega || "").split(",").map((item) => item.trim());

      const orderPayload = {
        store_slug: store.slug,
        cliente_id: customerId,
        nome_cliente: payload.nome,
        telefone_cliente: payload.telefone,
        tipo_entrega: "ENTREGA",
        logradouro,
        numero,
        bairro,
        cidade,
        estado: "SP",
        observacoes_cliente: payload.observacoes || "",
        itens: cart.items.map((item) => ({
          produto_id: Number(item.itemId),
          quantidade: Number(item.quantidade),
          observacoes: item.customerNote || ""
        }))
      };

      const result = await api.createOrder(orderPayload);
      const createdOrder = mapOrder(result.order || result);

      setState((prev) => ({
        ...prev,
        orders: [createdOrder, ...prev.orders],
        cart: { storeId: null, items: [] }
      }));

      return createdOrder;
    },

    async registerStore(payload) {
      const result = await api.createPaidLead({
        nome_empresa: payload.nome,
        nome_responsavel: payload.nome,
        email: payload.email,
        telefone: payload.telefone,
        whatsapp: payload.whatsapp,
        categoria_principal: payload.categoria,
        descricao_resumida: payload.descricaoCurta,
        cidade: payload.endereco?.cidade,
        endereco_logradouro: payload.endereco?.rua,
        horario_funcionamento: payload.horarioFuncionamento,
        logo_url: payload.logo,
        capa_url: payload.capa,
        observacoes: payload.observacoes || ""
      });

      return {
        ok: true,
        id: result.id
      };
    },

    async registerContactLead(payload) {
      const result = await api.createFreeLead({
        nome_empresa: payload.nome,
        nome_responsavel: payload.nome,
        whatsapp: payload.whatsapp,
        categoria_principal: payload.categoria || "servico",
        cidade: payload.cidade,
        observacoes: payload.observacoes || ""
      });

      const lead = {
        id: String(result.id),
        nome: payload.nome,
        categoria: payload.categoria || "",
        cidade: payload.cidade || "",
        whatsapp: payload.whatsapp,
        status: result.status_solicitacao,
        publishedAsCard: false,
        createdAt: new Date().toISOString()
      };

      setState((prev) => ({
        ...prev,
        contactLeads: [lead, ...(prev.contactLeads || [])]
      }));

      return lead;
    },

    async approveFreePlanLead(leadId) {
      const token = state.sessions.superAdminToken;
      if (!token) return { ok: false, message: "Sessão do admin não encontrada." };

      await api.approveAdminLead(token, leadId);
      await hydrateAdminSession(token);
      return { ok: true };
    },

    async loginMerchant(login, senha) {
      try {
        const result = await api.merchantLogin(login, senha);
        await hydrateMerchantSession(result.token);

        setState((prev) => ({
          ...prev,
          sessions: {
            ...prev.sessions,
            merchantToken: result.token,
            merchantStoreId: String(result.store.id),
            merchantUser: result.user
          }
        }));

        return {
          ok: true,
          store: {
            id: String(result.store.id)
          }
        };
      } catch (error) {
        return {
          ok: false,
          message: error.message
        };
      }
    },

    logoutMerchant() {
      setState((prev) => ({
        ...prev,
        sessions: {
          ...prev.sessions,
          merchantToken: null,
          merchantStoreId: null,
          merchantUser: null
        }
      }));
    },

    async updateMerchantStoreProfile(storeId, payload) {
      const token = state.sessions.merchantToken;
      if (!token) throw new Error("Sessão do lojista não encontrada.");

      await api.updateMerchantSettings(token, {
        whatsapp: payload.whatsapp,
        capa_url: payload.capa,
        telefone: payload.telefone || "",
        email_contato: payload.email || "",
        descricao_curta: payload.descricaoCurta || "",
        horario_funcionamento: payload.horarioFuncionamento || ""
      });

      await hydrateMerchantSession(token);
    },

    async upsertHomePromotion(storeId, payload, promotionId = null) {
      const token = state.sessions.merchantToken;
      if (!token) return { ok: false, message: "Sessão do lojista não encontrada." };

      const body = {
        title: payload.title,
        subtitle: payload.subtitle,
        button_label: payload.badge,
        product_id: Number(payload.itemId),
        active: payload.active
      };

      if (promotionId) {
        await api.updateMerchantPromotion(token, promotionId, body);
      } else {
        await api.createMerchantPromotion(token, body);
      }

      await hydrateMerchantSession(token);
      return { ok: true, message: promotionId ? "Propaganda atualizada com sucesso." : "Propaganda publicada com sucesso." };
    },

    async deleteHomePromotion(promotionId) {
      const token = state.sessions.merchantToken;
      if (!token) return { ok: false, message: "Sessão do lojista não encontrada." };

      await api.deleteMerchantPromotion(token, promotionId);
      await hydrateMerchantSession(token);
      return { ok: true };
    },

    async upsertMenuItem(storeId, payload, itemId = null) {
      const token = state.sessions.merchantToken;
      if (!token) throw new Error("Sessão do lojista não encontrada.");

      const body = {
        nome: payload.nome,
        descricao: payload.descricao,
        preco: Number(payload.preco),
        imagem_url: payload.imagem,
        status_produto: payload.ativo ? "ATIVO" : "INATIVO"
      };

      if (itemId) {
        await api.updateMerchantProduct(token, itemId, body);
      } else {
        await api.createMerchantProduct(token, body);
      }

      await hydrateMerchantSession(token);
    },

    async deleteMenuItem(itemId) {
      const token = state.sessions.merchantToken;
      if (!token) throw new Error("Sessão do lojista não encontrada.");

      await api.deleteMerchantProduct(token, itemId);
      await hydrateMerchantSession(token);
    },

    async upsertOptionGroup(storeId, payload, groupId = null) {
      const token = state.sessions.merchantToken;
      if (!token) return { ok: false, message: "Sessão do lojista não encontrada." };

      const body = {
        name: payload.name,
        description: payload.description,
        type: payload.type,
        required: payload.required,
        min_select: Number(payload.minSelect || 0),
        max_select: Number(payload.maxSelect || 1),
        sort_order: Number(payload.sortOrder || 0),
        active: payload.active,
        product_ids: (payload.productIds || []).map((id) => Number(id)),
        options: (payload.options || []).map((option, index) => ({
          name: option.name,
          description: option.description,
          price_delta: Number(option.priceDelta || 0),
          sort_order: Number(option.sortOrder || index + 1),
          active: option.active
        }))
      };

      if (groupId) {
        await api.updateMerchantOptionGroup(token, groupId, body);
      } else {
        await api.createMerchantOptionGroup(token, body);
      }

      await hydrateMerchantSession(token);
      return { ok: true };
    },

    async deleteOptionGroup(groupId) {
      const token = state.sessions.merchantToken;
      if (!token) return { ok: false, message: "Sessão do lojista não encontrada." };

      await api.deleteMerchantOptionGroup(token, groupId);
      await hydrateMerchantSession(token);
      return { ok: true };
    },

    async updateOrderStatus(storeId, orderId, nextStatus) {
      const token = state.sessions.merchantToken;
      if (!token) return;

      const result = await api.updateMerchantOrderStatus(token, orderId, nextStatus);
      const order = mapOrder(result.order);

      setState((prev) => ({
        ...prev,
        orders: uniqueById(prev.orders.map((entry) => (entry.id === order.id ? order : entry)))
      }));
    },

    async loginSuperAdmin(login, senha) {
      try {
        const result = await api.adminLogin(login, senha);
        await hydrateAdminSession(result.token);

        setState((prev) => ({
          ...prev,
          sessions: {
            ...prev.sessions,
            superAdminToken: result.token,
            superAdmin: true,
            adminUser: result.user
          }
        }));

        return true;
      } catch {
        return false;
      }
    },

    logoutSuperAdmin() {
      setState((prev) => ({
        ...prev,
        adminStores: [],
        adminSummary: null,
        adminRecentRequests: [],
        logs: [],
        sessions: {
          ...prev.sessions,
          superAdminToken: null,
          superAdmin: false,
          adminUser: null
        }
      }));
    },

    async superAdminAction(actionType, storeId, motivo = "") {
      const token = state.sessions.superAdminToken;
      if (!token) return;

      const mappedStatus = {
        APROVAR: "ATIVA",
        BLOQUEAR: "BLOQUEADA",
        DESBLOQUEAR: "ATIVA"
      }[actionType];

      if (!mappedStatus) return;

      await api.updateAdminStoreStatus(token, storeId, mappedStatus, motivo);
      await hydrateAdminSession(token);
    }
  }), [state]);

  const selectors = useMemo(() => ({
    activeStores: state.stores.filter((store) => store.status === "ATIVA"),
    storeBySlug(slug) {
      return state.stores.find((store) => store.slug === slug) || null;
    },
    itemsByStore(storeId) {
      return state.items.filter((item) => item.storeId === storeId && item.ativo);
    },
    allItemsByStore(storeId) {
      return state.items.filter((item) => item.storeId === storeId);
    },
    optionGroupsByStore(storeId) {
      return state.productOptionGroups
        .filter((group) => group.storeId === storeId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    optionGroupsByProduct(productId) {
      return state.productOptionGroups
        .filter((group) => group.productIds.includes(String(productId)) && group.active)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    homePromotionsByStore(storeId) {
      return state.homePromotions.filter((promotion) => promotion.storeId === storeId);
    },
    activeHomePromotions() {
      return state.homePromotions
        .filter((promotion) => promotion.active)
        .map((promotion) => {
          const store = state.stores.find((entry) => entry.id === promotion.storeId);
          const item = promotion.item || state.items.find((entry) => entry.id === promotion.itemId);
          if (!store || !item) return null;

          return {
            ...promotion,
            store,
            item
          };
        })
        .filter(Boolean);
    },
    ordersByStore(storeId) {
      return state.orders.filter((order) => order.storeId === storeId);
    },
    cartDetailed() {
      const store = state.stores.find((item) => item.id === state.cart.storeId) || null;
      const items = state.cart.items
        .map((row) => {
          const item = state.items.find((product) => product.id === row.itemId);
          if (!item) return null;

          const unitPrice = Number(row.unitPrice ?? item.preco);
          return {
            ...row,
            item,
            unitPrice,
            subtotal: unitPrice * row.quantidade,
            summaryLines: buildSelectionSummary(row.selectedGroups, row.customerNote)
          };
        })
        .filter(Boolean);

      return {
        storeId: state.cart.storeId,
        store,
        items,
        total: items.reduce((sum, row) => sum + row.subtotal, 0)
      };
    }
  }), [state]);

  return <AppContext.Provider value={{ state, actions, selectors }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp deve ser usado dentro de AppProvider");
  }
  return context;
}
