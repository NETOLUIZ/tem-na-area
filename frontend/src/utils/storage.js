export const APP_STATE_KEY = "temnaarea_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function sumSelectedOptions(selectedGroups = []) {
  return selectedGroups.reduce((sum, group) => {
    if (!Array.isArray(group.selectedOptions)) return sum;
    return sum + group.selectedOptions.reduce((acc, option) => acc + Number(option.priceDelta || 0), 0);
  }, 0);
}

function normalizeSelectedGroups(selectedGroups = []) {
  return (Array.isArray(selectedGroups) ? selectedGroups : []).map((group) => ({
    groupId: group.groupId,
    name: group.name || "",
    type: group.type || "single",
    textValue: group.textValue || "",
    selectedOptions: Array.isArray(group.selectedOptions)
      ? group.selectedOptions.map((option) => ({
          optionId: option.optionId,
          name: option.name || "",
          description: option.description || "",
          priceDelta: Number(option.priceDelta || 0)
        }))
      : []
  }));
}

function ensurePromotion(promotion) {
  return {
    id: promotion.id,
    storeId: promotion.storeId,
    itemId: promotion.itemId,
    title: promotion.title || "",
    subtitle: promotion.subtitle || "",
    badge: promotion.badge || "Destaque",
    active: promotion.active !== false,
    createdAt: promotion.createdAt || nowIso(),
    expiresAt:
      promotion.expiresAt ||
      new Date(new Date(promotion.createdAt || nowIso()).getTime() + 48 * 60 * 60 * 1000).toISOString()
  };
}

function ensureStoreRating(store) {
  const rating = store.rating || {};
  const total = Number.isFinite(rating.total) ? rating.total : 0;
  const count = Number.isFinite(rating.count) ? rating.count : 0;

  return {
    ...store,
    rating: {
      total,
      count,
      average: count > 0 ? total / count : 0
    }
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function makeStore(id, data, status = "ATIVA") {
  const ratingCount = Math.floor(Math.random() * 32);
  const ratingAverage = ratingCount ? Number((Math.random() * 1.5 + 3.5).toFixed(1)) : 0;

  return {
    id,
    slug: slugify(data.nome),
    nome: data.nome,
    categoria: data.categoria,
    descricaoCurta: data.descricaoCurta,
    whatsapp: data.whatsapp,
    telefone: data.telefone,
    senha: data.senha,
    endereco: data.endereco,
    horarioFuncionamento: data.horarioFuncionamento,
    imagens: {
      logo: data.logo,
      capa: data.capa
    },
    status,
    metrics: {
      cliquesWhatsapp: Math.floor(Math.random() * 50),
      cliquesSite: Math.floor(Math.random() * 120),
      visitasPagina: Math.floor(Math.random() * 300)
    },
    rating: {
      total: Number((ratingAverage * ratingCount).toFixed(1)),
      count: ratingCount,
      average: ratingAverage
    },
    createdAt: nowIso()
  };
}

function buildItemsForStore(storeId, prefix, imageBase) {
  const base = [
    ["Tradicional", "Receita da casa com ingredientes frescos.", 24.9, "Outros"],
    ["Especial", "Versao premium com molho artesanal.", 32.9, "Massas"],
    ["Combo Familia", "Serve ate 3 pessoas.", 69.9, "Outros"],
    ["Promo do Dia", "Oferta por tempo limitado.", 19.9, "Outros"],
    ["Veggie", "Opcao leve e saborosa.", 27.5, "Outros"],
    ["Duplo", "Mais recheio, mais sabor.", 37.9, "Outros"],
    ["Executivo", "Perfeito para o almoco.", 29.9, "Outros"],
    ["Sobremesa da Casa", "Fechamento ideal para o pedido.", 14.9, "Sobremesas"]
  ];

  return base.map((item, index) => ({
    id: `${storeId}-${index + 1}`,
    storeId,
    nome: `${prefix} ${item[0]}`,
    categoria: item[3],
    descricao: item[1],
    preco: item[2],
    precoAntigo: index % 3 === 0 ? item[2] + 6 : null,
    imagem: `${imageBase}&sig=${storeId}${index}`,
    tags: index % 2 === 0 ? ["Promo", "Mais vendido"] : ["Novidade"],
    ativo: true,
    createdAt: nowIso()
  }));
}

function normalizeOptionGroup(group) {
  return {
    id: group.id || randomId("grp"),
    storeId: group.storeId,
    name: group.name || group.nome || "",
    description: group.description || group.descricao || "",
    type: group.type || "single",
    required: group.required === true,
    minSelect: Number(group.minSelect ?? group.minimo ?? 0),
    maxSelect: group.type === "text" ? 1 : Number(group.maxSelect ?? group.maximo ?? 1),
    sortOrder: Number(group.sortOrder ?? group.ordem ?? 0),
    active: group.active !== false,
    createdAt: group.createdAt || nowIso()
  };
}

function normalizeOptionItem(item) {
  return {
    id: item.id || randomId("opt"),
    groupId: item.groupId,
    name: item.name || item.nome || "",
    description: item.description || item.descricao || "",
    priceDelta: Number(item.priceDelta ?? item.precoAdicional ?? 0),
    sortOrder: Number(item.sortOrder ?? item.ordem ?? 0),
    active: item.active !== false
  };
}

function normalizeGroupLink(link) {
  return {
    id: link.id || randomId("lnk"),
    productId: link.productId,
    groupId: link.groupId,
    sortOrder: Number(link.sortOrder ?? 0)
  };
}

function normalizeCartItem(item, products = []) {
  const product = products.find((entry) => entry.id === item.itemId);
  const basePrice = Number(item.basePrice ?? product?.preco ?? 0);
  const selectedGroups = normalizeSelectedGroups(item.selectedGroups || []);
  const customerNote = item.customerNote || "";
  const quantity = Number(item.quantidade || item.quantity || 1);

  return {
    id: item.id || randomId("cart"),
    itemId: item.itemId,
    quantidade: quantity > 0 ? quantity : 1,
    basePrice,
    unitPrice: Number(item.unitPrice ?? basePrice + sumSelectedOptions(selectedGroups)),
    selectedGroups,
    customerNote,
    createdAt: item.createdAt || nowIso()
  };
}

function normalizeOrderItem(item, products = []) {
  const product = products.find((entry) => entry.id === item.itemId);
  const basePrice = Number(item.basePrice ?? item.preco ?? product?.preco ?? 0);
  const selectedGroups = normalizeSelectedGroups(item.selectedGroups || []);

  return {
    id: item.id || randomId("ord"),
    itemId: item.itemId,
    nome: item.nome || product?.nome || "",
    preco: Number(item.preco ?? item.unitPrice ?? basePrice),
    basePrice,
    unitPrice: Number(item.unitPrice ?? item.preco ?? basePrice + sumSelectedOptions(selectedGroups)),
    quantidade: Number(item.quantidade || 1),
    selectedGroups,
    customerNote: item.customerNote || ""
  };
}

export function createSeedState() {
  const stores = [
    makeStore("s1", {
      nome: "Espetinho do Joao",
      categoria: "comida",
      descricaoCurta: "Espetinhos na brasa e porcoes para toda a familia.",
      whatsapp: "11988880001",
      telefone: "1130211001",
      senha: "123456",
      endereco: { rua: "Rua das Palmeiras, 120", bairro: "Centro", cidade: "Sao Paulo" },
      horarioFuncionamento: "Seg-Dom 18h as 00h",
      logo: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=700&q=80",
      capa: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=80"
    }),
    makeStore("s2", {
      nome: "Pizzaria Bella Massa",
      categoria: "comida",
      descricaoCurta: "Pizzas artesanais com fermentacao natural.",
      whatsapp: "11988880002",
      telefone: "1130211002",
      senha: "123456",
      endereco: { rua: "Av. Paulista, 902", bairro: "Bela Vista", cidade: "Sao Paulo" },
      horarioFuncionamento: "Ter-Dom 17h as 23h",
      logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80",
      capa: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=80"
    }),
    makeStore("s3", {
      nome: "Hamburgueria Prime",
      categoria: "comida",
      descricaoCurta: "Burger artesanal com blend exclusivo e batata crocante.",
      whatsapp: "11988880003",
      telefone: "1130211003",
      senha: "123456",
      endereco: { rua: "Rua Augusta, 455", bairro: "Consolacao", cidade: "Sao Paulo" },
      horarioFuncionamento: "Seg-Dom 11h as 23h",
      logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
      capa: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80"
    }),
    makeStore("s4", {
      nome: "Barbearia Imperial",
      categoria: "servico",
      descricaoCurta: "Corte, barba e tratamentos com atendimento premium.",
      whatsapp: "11988880004",
      telefone: "1130211004",
      senha: "123456",
      endereco: { rua: "Rua da Mooca, 88", bairro: "Mooca", cidade: "Sao Paulo" },
      horarioFuncionamento: "Seg-Sab 09h as 20h",
      logo: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=700&q=80",
      capa: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80"
    }),
    makeStore("s5", {
      nome: "Loja Urbana Fit",
      categoria: "loja",
      descricaoCurta: "Moda casual e esportiva com entrega expressa.",
      whatsapp: "11988880005",
      telefone: "1130211005",
      senha: "123456",
      endereco: { rua: "Rua Oscar Freire, 271", bairro: "Jardins", cidade: "Sao Paulo" },
      horarioFuncionamento: "Seg-Sab 10h as 21h",
      logo: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80",
      capa: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
    }),
    makeStore("s6", {
      nome: "Perfumaria Essenza",
      categoria: "loja",
      descricaoCurta: "Perfumes importados e kits exclusivos.",
      whatsapp: "11988880006",
      telefone: "1130211006",
      senha: "123456",
      endereco: { rua: "Av. Faria Lima, 1510", bairro: "Itaim", cidade: "Sao Paulo" },
      horarioFuncionamento: "Seg-Dom 10h as 22h",
      logo: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=80",
      capa: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=80"
    }),
    makeStore(
      "s7",
      {
        nome: "Acai do Bairro",
        categoria: "comida",
        descricaoCurta: "Acai, vitaminas e combos fitness.",
        whatsapp: "11988880007",
        telefone: "1130211007",
        senha: "123456",
        endereco: { rua: "Rua dos Pinheiros, 77", bairro: "Pinheiros", cidade: "Sao Paulo" },
        horarioFuncionamento: "Seg-Dom 12h as 23h",
        logo: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=700&q=80",
        capa: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80"
      },
      "PENDENTE"
    ),
    makeStore(
      "s8",
      {
        nome: "Studio Bela Pele",
        categoria: "servico",
        descricaoCurta: "Estetica facial e corporal por agendamento.",
        whatsapp: "11988880008",
        telefone: "1130211008",
        senha: "123456",
        endereco: { rua: "Rua Vergueiro, 320", bairro: "Vila Mariana", cidade: "Sao Paulo" },
        horarioFuncionamento: "Seg-Sab 09h as 19h",
        logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80",
        capa: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80"
      },
      "PENDENTE"
    )
  ];

  const items = [
    ...buildItemsForStore("s1", "Espeto", "https://images.unsplash.com/photo-1529692236671-f1dc99fe18ae?auto=format&fit=crop&w=900&q=80"),
    ...buildItemsForStore("s2", "Pizza", "https://images.unsplash.com/photo-1548365328-9f547fb0953c?auto=format&fit=crop&w=900&q=80"),
    ...buildItemsForStore("s3", "Burger", "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=900&q=80"),
    ...buildItemsForStore("s4", "Servico", "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=80"),
    ...buildItemsForStore("s5", "Look", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80"),
    ...buildItemsForStore("s6", "Essenza", "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=900&q=80")
  ];

  const homePromotions = [
    {
      id: "promo-s1-1",
      storeId: "s1",
      itemId: "s1-4",
      title: "Promo do dia saindo rapido",
      subtitle: "Espetinho do Joao com oferta especial para hoje.",
      badge: "Oferta local",
      active: true,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "promo-s2-1",
      storeId: "s2",
      itemId: "s2-2",
      title: "Pizza especial em destaque",
      subtitle: "Bella Massa com fermentacao natural e sabor premium.",
      badge: "Mais pedido",
      active: true,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "promo-s3-1",
      storeId: "s3",
      itemId: "s3-1",
      title: "Burger artesanal na home",
      subtitle: "Hamburgueria Prime com blend exclusivo e batata crocante.",
      badge: "Imperdivel",
      active: true,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    }
  ];

  const productOptionGroups = [
    normalizeOptionGroup({ id: "grp-s2-size", storeId: "s2", name: "Escolha o tamanho", type: "single", required: true, minSelect: 1, maxSelect: 1, sortOrder: 1, active: true }),
    normalizeOptionGroup({ id: "grp-s2-flavor", storeId: "s2", name: "Escolha o sabor", type: "single", required: true, minSelect: 1, maxSelect: 1, sortOrder: 2, active: true }),
    normalizeOptionGroup({ id: "grp-s2-crust", storeId: "s2", name: "Escolha a borda", type: "single", required: false, minSelect: 0, maxSelect: 1, sortOrder: 3, active: true }),
    normalizeOptionGroup({ id: "grp-s2-extra", storeId: "s2", name: "Adicionais", type: "multiple", required: false, minSelect: 0, maxSelect: 4, sortOrder: 4, active: true }),
    normalizeOptionGroup({ id: "grp-s3-point", storeId: "s3", name: "Ponto da carne", type: "single", required: true, minSelect: 1, maxSelect: 1, sortOrder: 1, active: true }),
    normalizeOptionGroup({ id: "grp-s3-extra", storeId: "s3", name: "Adicionais", type: "multiple", required: false, minSelect: 0, maxSelect: 3, sortOrder: 2, active: true }),
    normalizeOptionGroup({ id: "grp-s3-note", storeId: "s3", name: "Observacoes para cozinha", type: "text", required: false, minSelect: 0, maxSelect: 1, sortOrder: 3, active: true })
  ];

  const productOptionItems = [
    normalizeOptionItem({ id: "opt-s2-size-p", groupId: "grp-s2-size", name: "Pequena", priceDelta: 0, sortOrder: 1 }),
    normalizeOptionItem({ id: "opt-s2-size-m", groupId: "grp-s2-size", name: "Media", priceDelta: 8, sortOrder: 2 }),
    normalizeOptionItem({ id: "opt-s2-size-g", groupId: "grp-s2-size", name: "Grande", priceDelta: 16, sortOrder: 3 }),
    normalizeOptionItem({ id: "opt-s2-flavor-calabresa", groupId: "grp-s2-flavor", name: "Calabresa", priceDelta: 0, sortOrder: 1 }),
    normalizeOptionItem({ id: "opt-s2-flavor-frango", groupId: "grp-s2-flavor", name: "Frango com catupiry", priceDelta: 2, sortOrder: 2 }),
    normalizeOptionItem({ id: "opt-s2-flavor-mussarela", groupId: "grp-s2-flavor", name: "Mussarela", priceDelta: 0, sortOrder: 3 }),
    normalizeOptionItem({ id: "opt-s2-crust-none", groupId: "grp-s2-crust", name: "Sem borda", priceDelta: 0, sortOrder: 1 }),
    normalizeOptionItem({ id: "opt-s2-crust-cheddar", groupId: "grp-s2-crust", name: "Borda cheddar", priceDelta: 7, sortOrder: 2 }),
    normalizeOptionItem({ id: "opt-s2-crust-catupiry", groupId: "grp-s2-crust", name: "Borda catupiry", priceDelta: 8, sortOrder: 3 }),
    normalizeOptionItem({ id: "opt-s2-extra-bacon", groupId: "grp-s2-extra", name: "Bacon", priceDelta: 5, sortOrder: 1 }),
    normalizeOptionItem({ id: "opt-s2-extra-queijo", groupId: "grp-s2-extra", name: "Queijo extra", priceDelta: 4, sortOrder: 2 }),
    normalizeOptionItem({ id: "opt-s2-extra-cheddar", groupId: "grp-s2-extra", name: "Cheddar", priceDelta: 4, sortOrder: 3 }),
    normalizeOptionItem({ id: "opt-s2-extra-ovo", groupId: "grp-s2-extra", name: "Ovo", priceDelta: 3, sortOrder: 4 }),
    normalizeOptionItem({ id: "opt-s3-point-rare", groupId: "grp-s3-point", name: "Mal passada", priceDelta: 0, sortOrder: 1 }),
    normalizeOptionItem({ id: "opt-s3-point-medium", groupId: "grp-s3-point", name: "Ao ponto", priceDelta: 0, sortOrder: 2 }),
    normalizeOptionItem({ id: "opt-s3-point-well", groupId: "grp-s3-point", name: "Bem passada", priceDelta: 0, sortOrder: 3 }),
    normalizeOptionItem({ id: "opt-s3-extra-bacon", groupId: "grp-s3-extra", name: "Bacon", priceDelta: 4, sortOrder: 1 }),
    normalizeOptionItem({ id: "opt-s3-extra-cheddar", groupId: "grp-s3-extra", name: "Cheddar", priceDelta: 3, sortOrder: 2 }),
    normalizeOptionItem({ id: "opt-s3-extra-onion", groupId: "grp-s3-extra", name: "Cebola crispy", priceDelta: 2, sortOrder: 3 })
  ];

  const productGroupLinks = [
    normalizeGroupLink({ id: "lnk-s2-1-size", productId: "s2-1", groupId: "grp-s2-size", sortOrder: 1 }),
    normalizeGroupLink({ id: "lnk-s2-1-flavor", productId: "s2-1", groupId: "grp-s2-flavor", sortOrder: 2 }),
    normalizeGroupLink({ id: "lnk-s2-1-crust", productId: "s2-1", groupId: "grp-s2-crust", sortOrder: 3 }),
    normalizeGroupLink({ id: "lnk-s2-1-extra", productId: "s2-1", groupId: "grp-s2-extra", sortOrder: 4 }),
    normalizeGroupLink({ id: "lnk-s2-2-size", productId: "s2-2", groupId: "grp-s2-size", sortOrder: 1 }),
    normalizeGroupLink({ id: "lnk-s2-2-flavor", productId: "s2-2", groupId: "grp-s2-flavor", sortOrder: 2 }),
    normalizeGroupLink({ id: "lnk-s2-2-crust", productId: "s2-2", groupId: "grp-s2-crust", sortOrder: 3 }),
    normalizeGroupLink({ id: "lnk-s2-2-extra", productId: "s2-2", groupId: "grp-s2-extra", sortOrder: 4 }),
    normalizeGroupLink({ id: "lnk-s3-1-point", productId: "s3-1", groupId: "grp-s3-point", sortOrder: 1 }),
    normalizeGroupLink({ id: "lnk-s3-1-extra", productId: "s3-1", groupId: "grp-s3-extra", sortOrder: 2 }),
    normalizeGroupLink({ id: "lnk-s3-1-note", productId: "s3-1", groupId: "grp-s3-note", sortOrder: 3 })
  ];

  return {
    stores,
    items,
    homePromotions,
    productOptionGroups,
    productOptionItems,
    productGroupLinks,
    orders: [],
    logs: [],
    contactLeads: [],
    cart: {
      storeId: null,
      items: []
    },
    sessions: {
      merchantStoreId: null,
      superAdmin: false
    },
    meta: {
      orderSequence: 1000,
      logSequence: 1,
      initializedAt: nowIso()
    }
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(state) {
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
}

export function initState() {
  const current = loadState();
  const seeded = createSeedState();

  if (!current) {
    saveState(seeded);
    return seeded;
  }

  const stores = Array.isArray(current.stores)
    ? current.stores.filter((store) => store && typeof store.id === "string" && store.endereco).map(ensureStoreRating)
    : seeded.stores;

  const items = Array.isArray(current.items)
    ? current.items.filter((item) => item && typeof item.id === "string" && typeof item.storeId === "string")
    : seeded.items;

  const productOptionGroups = Array.isArray(current.productOptionGroups)
    ? current.productOptionGroups
        .filter((group) => group && typeof group.storeId === "string")
        .map(normalizeOptionGroup)
    : seeded.productOptionGroups;

  const productOptionItems = Array.isArray(current.productOptionItems)
    ? current.productOptionItems
        .filter((item) => item && typeof item.groupId === "string")
        .map(normalizeOptionItem)
    : seeded.productOptionItems;

  const productGroupLinks = Array.isArray(current.productGroupLinks)
    ? current.productGroupLinks
        .filter((link) => link && typeof link.productId === "string" && typeof link.groupId === "string")
        .map(normalizeGroupLink)
    : seeded.productGroupLinks;

  const cartItems = Array.isArray(current.cart?.items)
    ? current.cart.items
        .filter((item) => item && typeof item.itemId === "string")
        .map((item) => normalizeCartItem(item, items))
    : [];

  const orders = Array.isArray(current.orders)
    ? current.orders.map((order) => ({
        ...order,
        items: Array.isArray(order.items)
          ? order.items
              .filter((item) => item && typeof item.itemId === "string")
              .map((item) => normalizeOrderItem(item, items))
          : []
      }))
    : [];

  return {
    ...seeded,
    ...current,
    stores: stores.length ? stores : seeded.stores,
    items: items.length ? items : seeded.items,
    homePromotions: Array.isArray(current.homePromotions)
      ? current.homePromotions.map(ensurePromotion)
      : seeded.homePromotions.map(ensurePromotion),
    productOptionGroups,
    productOptionItems,
    productGroupLinks,
    orders,
    cart: {
      storeId: current.cart?.storeId || null,
      items: cartItems
    },
    contactLeads: current.contactLeads || [],
    sessions: current.sessions || seeded.sessions,
    meta: current.meta || seeded.meta
  };
}

export function clearState() {
  localStorage.removeItem(APP_STATE_KEY);
}
