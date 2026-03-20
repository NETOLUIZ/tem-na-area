const defaultApiBaseUrl = import.meta.env.DEV ? "http://127.0.0.1:3001/api/v1" : "/api/v1";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/+$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers
    },
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    const message = payload?.error?.message || payload?.message || "Falha na comunicacao com a API.";
    throw new Error(message);
  }

  return payload.data ?? payload;
}

export const api = {
  baseUrl: API_BASE_URL,
  health() {
    return request("/health");
  },
  publicHome() {
    return request("/public/home");
  },
  publicStores(params = {}) {
    const query = new URLSearchParams();
    if (params.categoria) query.set("categoria", params.categoria);
    if (params.busca) query.set("busca", params.busca);
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/public/stores${suffix}`);
  },
  publicStore(slug) {
    return request(`/public/stores/${slug}`);
  },
  merchantLogin(login, senha) {
    return request("/auth/merchant/login", {
      method: "POST",
      body: { login, senha }
    });
  },
  adminLogin(login, senha) {
    return request("/auth/admin/login", {
      method: "POST",
      body: { login, senha }
    });
  },
  createOrder(body) {
    return request("/public/orders", {
      method: "POST",
      body
    });
  },
  merchantDashboard(token) {
    return request("/merchant/dashboard", { token });
  },
  merchantOrders(token, status) {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/merchant/orders${suffix}`, { token });
  },
  merchantProducts(token) {
    return request("/merchant/products", { token });
  },
  merchantSettings(token) {
    return request("/merchant/settings", { token });
  },
  merchantOptionGroups(token) {
    return request("/merchant/option-groups", { token });
  },
  createMerchantOptionGroup(token, body) {
    return request("/merchant/option-groups", {
      method: "POST",
      token,
      body
    });
  },
  updateMerchantOptionGroup(token, id, body) {
    return request(`/merchant/option-groups/${id}`, {
      method: "PUT",
      token,
      body
    });
  },
  deleteMerchantOptionGroup(token, id) {
    return request(`/merchant/option-groups/${id}`, {
      method: "DELETE",
      token
    });
  },
  merchantPromotions(token) {
    return request("/merchant/promotions", { token });
  },
  createMerchantPromotion(token, body) {
    return request("/merchant/promotions", {
      method: "POST",
      token,
      body
    });
  },
  updateMerchantPromotion(token, id, body) {
    return request(`/merchant/promotions/${id}`, {
      method: "PUT",
      token,
      body
    });
  },
  deleteMerchantPromotion(token, id) {
    return request(`/merchant/promotions/${id}`, {
      method: "DELETE",
      token
    });
  },
  updateMerchantSettings(token, body) {
    return request("/merchant/settings", {
      method: "PUT",
      token,
      body
    });
  },
  createMerchantProduct(token, body) {
    return request("/merchant/products", {
      method: "POST",
      token,
      body
    });
  },
  updateMerchantProduct(token, id, body) {
    return request(`/merchant/products/${id}`, {
      method: "PUT",
      token,
      body
    });
  },
  deleteMerchantProduct(token, id) {
    return request(`/merchant/products/${id}`, {
      method: "DELETE",
      token
    });
  },
  updateMerchantOrderStatus(token, id, status) {
    return request(`/merchant/orders/${id}/status`, {
      method: "PATCH",
      token,
      body: { status }
    });
  },
  createFreeLead(body) {
    return request("/public/leads/free", {
      method: "POST",
      body
    });
  },
  createPaidLead(body) {
    return request("/public/leads/paid", {
      method: "POST",
      body
    });
  },
  adminDashboard(token) {
    return request("/admin/dashboard", { token });
  },
  adminStores(token, status) {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/admin/stores${suffix}`, { token });
  },
  adminLogs(token) {
    return request("/admin/logs", { token });
  },
  adminLeads(token) {
    return request("/admin/leads", { token });
  },
  adminPaidLeads(token) {
    return request("/admin/leads/paid", { token });
  },
  approveAdminLead(token, id) {
    return request(`/admin/leads/${id}/approve`, {
      method: "PATCH",
      token,
      body: {}
    });
  },
  confirmAdminPaidLead(token, id) {
    return request(`/admin/leads/${id}/confirm-payment`, {
      method: "PATCH",
      token,
      body: {}
    });
  },
  updateAdminStoreStatus(token, id, status, motivo) {
    return request(`/admin/stores/${id}/status`, {
      method: "PATCH",
      token,
      body: { status, motivo }
    });
  }
};
