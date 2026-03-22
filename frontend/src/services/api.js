import { emitAuthInvalidated } from "../lib/auth-events";

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
    if (response.status === 401 && options.authScope) {
      emitAuthInvalidated({
        scope: options.authScope,
        reason: message
      });
    }

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
  pdvBootstrap(token) {
    return request("/pdv/bootstrap", { token, authScope: "merchant" });
  },
  pdvProducts(token) {
    return request("/pdv/products", { token, authScope: "merchant" });
  },
  pdvCustomers(token, search = "", limit = 20) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (limit) query.set("limit", String(limit));
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/pdv/customers${suffix}`, { token, authScope: "merchant" });
  },
  createPdvCustomer(token, body) {
    return request("/pdv/customers", {
      method: "POST",
      token,
      authScope: "merchant",
      body
    });
  },
  pdvOrders(token, status) {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/pdv/orders${suffix}`, { token, authScope: "merchant" });
  },
  createPdvOrder(token, body) {
    return request("/pdv/orders", {
      method: "POST",
      token,
      authScope: "merchant",
      body
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
    return request("/merchant/dashboard", { token, authScope: "merchant" });
  },
  merchantOrders(token, status) {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/merchant/orders${suffix}`, { token, authScope: "merchant" });
  },
  merchantCustomers(token, search = "", limit = 24) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (limit) query.set("limit", String(limit));
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/merchant/customers${suffix}`, { token, authScope: "merchant" });
  },
  merchantCustomerDetail(token, customerId) {
    return request(`/merchant/customers/${customerId}`, { token, authScope: "merchant" });
  },
  merchantCashRegister(token) {
    return request("/merchant/cash-register", { token, authScope: "merchant" });
  },
  merchantInventory(token) {
    return request("/merchant/inventory", { token, authScope: "merchant" });
  },
  merchantReports(token, params = {}) {
    const query = new URLSearchParams();
    if (params.start) query.set("start", params.start);
    if (params.end) query.set("end", params.end);
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/merchant/reports${suffix}`, { token, authScope: "merchant" });
  },
  merchantInventoryMovements(token, productId, limit = 12) {
    const query = new URLSearchParams();
    if (limit) query.set("limit", String(limit));
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/merchant/inventory/${productId}/movements${suffix}`, { token, authScope: "merchant" });
  },
  createMerchantInventoryMovement(token, productId, body) {
    return request(`/merchant/inventory/${productId}/movements`, {
      method: "POST",
      token,
      authScope: "merchant",
      body
    });
  },
  openMerchantCashRegister(token, body) {
    return request("/merchant/cash-register/open", {
      method: "POST",
      token,
      authScope: "merchant",
      body
    });
  },
  createMerchantCashMovement(token, sessionId, body) {
    return request(`/merchant/cash-register/${sessionId}/movements`, {
      method: "POST",
      token,
      authScope: "merchant",
      body
    });
  },
  closeMerchantCashRegister(token, sessionId, body) {
    return request(`/merchant/cash-register/${sessionId}/close`, {
      method: "POST",
      token,
      authScope: "merchant",
      body
    });
  },
  createMerchantCustomer(token, body) {
    return request("/merchant/customers", {
      method: "POST",
      token,
      authScope: "merchant",
      body
    });
  },
  updateMerchantCustomer(token, customerId, body) {
    return request(`/merchant/customers/${customerId}`, {
      method: "PUT",
      token,
      authScope: "merchant",
      body
    });
  },
  merchantProducts(token) {
    return request("/merchant/products", { token, authScope: "merchant" });
  },
  merchantSettings(token) {
    return request("/merchant/settings", { token, authScope: "merchant" });
  },
  merchantOptionGroups(token) {
    return request("/merchant/option-groups", { token, authScope: "merchant" });
  },
  createMerchantOptionGroup(token, body) {
    return request("/merchant/option-groups", {
      method: "POST",
      token,
      authScope: "merchant",
      body
    });
  },
  updateMerchantOptionGroup(token, id, body) {
    return request(`/merchant/option-groups/${id}`, {
      method: "PUT",
      token,
      authScope: "merchant",
      body
    });
  },
  deleteMerchantOptionGroup(token, id) {
    return request(`/merchant/option-groups/${id}`, {
      method: "DELETE",
      token,
      authScope: "merchant"
    });
  },
  merchantPromotions(token) {
    return request("/merchant/promotions", { token, authScope: "merchant" });
  },
  createMerchantPromotion(token, body) {
    return request("/merchant/promotions", {
      method: "POST",
      token,
      authScope: "merchant",
      body
    });
  },
  updateMerchantPromotion(token, id, body) {
    return request(`/merchant/promotions/${id}`, {
      method: "PUT",
      token,
      authScope: "merchant",
      body
    });
  },
  deleteMerchantPromotion(token, id) {
    return request(`/merchant/promotions/${id}`, {
      method: "DELETE",
      token,
      authScope: "merchant"
    });
  },
  updateMerchantSettings(token, body) {
    return request("/merchant/settings", {
      method: "PUT",
      token,
      authScope: "merchant",
      body
    });
  },
  createMerchantProduct(token, body) {
    return request("/merchant/products", {
      method: "POST",
      token,
      authScope: "merchant",
      body
    });
  },
  updateMerchantProduct(token, id, body) {
    return request(`/merchant/products/${id}`, {
      method: "PUT",
      token,
      authScope: "merchant",
      body
    });
  },
  deleteMerchantProduct(token, id) {
    return request(`/merchant/products/${id}`, {
      method: "DELETE",
      token,
      authScope: "merchant"
    });
  },
  updateMerchantOrderStatus(token, id, status, reason = null) {
    return request(`/merchant/orders/${id}/status`, {
      method: "PATCH",
      token,
      authScope: "merchant",
      body: { status, reason }
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
    return request("/admin/dashboard", { token, authScope: "admin" });
  },
  adminStores(token, status) {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/admin/stores${suffix}`, { token, authScope: "admin" });
  },
  adminLogs(token) {
    return request("/admin/logs", { token, authScope: "admin" });
  },
  adminLeads(token) {
    return request("/admin/leads", { token, authScope: "admin" });
  },
  adminPaidLeads(token) {
    return request("/admin/leads/paid", { token, authScope: "admin" });
  },
  approveAdminLead(token, id) {
    return request(`/admin/leads/${id}/approve`, {
      method: "PATCH",
      token,
      authScope: "admin",
      body: {}
    });
  },
  confirmAdminPaidLead(token, id) {
    return request(`/admin/leads/${id}/confirm-payment`, {
      method: "PATCH",
      token,
      authScope: "admin",
      body: {}
    });
  },
  approveAdminPaidLead(token, id) {
    return request(`/admin/leads/${id}/approve-paid`, {
      method: "PATCH",
      token,
      authScope: "admin",
      body: {}
    });
  },
  updateAdminStoreStatus(token, id, status, motivo) {
    return request(`/admin/stores/${id}/status`, {
      method: "PATCH",
      token,
      authScope: "admin",
      body: { status, motivo }
    });
  }
};
