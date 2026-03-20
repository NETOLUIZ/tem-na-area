import { ApiError } from "../lib/api-error.js";
import { asyncHandler } from "../lib/async-handler.js";
import { sendData } from "../lib/http.js";
import { merchantStoreId, requireFields, requireIntegerId } from "../lib/validators.js";
import { runInTransaction } from "../lib/transactions.js";

async function loadStoreAndCustomer(storeRepository, customerRepository, storeId, payload) {
  const store = await storeRepository.merchantSettings(storeId);
  if (!store) {
    throw new ApiError("Loja nao encontrada para o operador.", 404);
  }

  if (!payload.cliente_id) {
    throw new ApiError("cliente_id e obrigatorio para pedidos do PDV.", 422);
  }

  const customer = await customerRepository.findById(requireIntegerId(payload.cliente_id, "cliente_id"));
  if (!customer) {
    throw new ApiError("Cliente nao encontrado.", 404);
  }

  return { store, customer };
}

export function registerPdvRoutes(app, dependencies) {
  const {
    auth,
    authService,
    storeRepository,
    catalogRepository,
    orderRepository,
    customerRepository,
    orderService
  } = dependencies;

  app.post("/api/v1/pdv/auth/login", asyncHandler(async (req, res) => {
    requireFields(req.body, ["login", "senha"]);
    sendData(res, await authService.merchantLogin(req.body.login, req.body.senha));
  }));

  app.get("/api/v1/pdv/bootstrap", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    sendData(res, {
      store: await storeRepository.merchantSettings(storeId),
      dashboard: await storeRepository.merchantDashboard(storeId),
      products: await catalogRepository.productsByStore(storeId, true),
      recent_orders: await orderRepository.ordersByStore(storeId, req.query.status || null)
    });
  }));

  app.get("/api/v1/pdv/products", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, {
      products: await catalogRepository.productsByStore(merchantStoreId(req.auth), true)
    });
  }));

  app.get("/api/v1/pdv/customers", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, {
      customers: await customerRepository.search(req.query.search || req.query.busca || "", req.query.limit || 20)
    });
  }));

  app.post("/api/v1/pdv/customers", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    requireFields(req.body, ["nome", "telefone"]);

    const existing = await customerRepository.findByContact({
      telefone: req.body.telefone,
      whatsapp: req.body.whatsapp,
      email: req.body.email
    });
    if (existing) {
      sendData(res, { customer: existing, reused: true });
      return;
    }

    const customer = await runInTransaction(dependencies.pool, async (connection) => customerRepository.create(connection, req.body));
    sendData(res, { customer, reused: false }, 201);
  }));

  app.get("/api/v1/pdv/orders", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, {
      orders: await orderRepository.ordersByStore(merchantStoreId(req.auth), req.query.status || null)
    });
  }));

  app.get("/api/v1/pdv/orders/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const order = await orderRepository.findOrder(
      merchantStoreId(req.auth),
      requireIntegerId(req.params.id)
    );

    if (!order) {
      throw new ApiError("Pedido nao encontrado.", 404);
    }

    sendData(res, { order });
  }));

  app.post("/api/v1/pdv/orders", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    requireFields(req.body, ["cliente_id", "itens"]);

    const storeId = merchantStoreId(req.auth);
    const { store, customer } = await loadStoreAndCustomer(storeRepository, customerRepository, storeId, req.body);

    const order = await orderService.create({
      ...req.body,
      store_slug: store.slug,
      cliente_id: customer.id,
      nome_cliente: req.body.nome_cliente || customer.nome,
      telefone_cliente: req.body.telefone_cliente || customer.whatsapp || customer.telefone,
      email_cliente: req.body.email_cliente || customer.email,
      cep: req.body.cep || customer.endereco.cep,
      logradouro: req.body.logradouro || customer.endereco.logradouro,
      numero: req.body.numero || customer.endereco.numero,
      complemento: req.body.complemento || customer.endereco.complemento,
      bairro: req.body.bairro || customer.endereco.bairro,
      cidade: req.body.cidade || customer.endereco.cidade,
      estado: req.body.estado || customer.endereco.estado,
      referencia: req.body.referencia || customer.endereco.referencia,
      canal_venda: req.body.canal_venda || "PDV"
    });

    sendData(res, { order }, 201);
  }));

  app.patch("/api/v1/pdv/orders/:id/status", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    requireFields(req.body, ["status"]);
    sendData(res, {
      order: await orderService.updateStatus(
        merchantStoreId(req.auth),
        requireIntegerId(req.params.id),
        req.body.status,
        Number(req.auth.sub)
      )
    });
  }));
}
