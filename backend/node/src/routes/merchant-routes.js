import { ApiError } from "../lib/api-error.js";
import { asyncHandler } from "../lib/async-handler.js";
import { sendData } from "../lib/http.js";
import { merchantStoreId, requireFields, requireIntegerId } from "../lib/validators.js";
import { runInTransaction } from "../lib/transactions.js";

export function registerMerchantRoutes(app, dependencies) {
  const {
    auth,
    storeRepository,
    catalogRepository,
    orderRepository,
    customerRepository,
    cashRegisterRepository,
    inventoryRepository,
    optionGroupRepository,
    promotionRepository,
    reportsRepository,
    catalogService,
    orderService
  } = dependencies;

  app.get("/api/v1/merchant/dashboard", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, await storeRepository.merchantDashboard(merchantStoreId(req.auth)));
  }));

  app.get("/api/v1/merchant/orders", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, {
      orders: await orderRepository.ordersByStore(merchantStoreId(req.auth), req.query.status || null)
    });
  }));

  app.get("/api/v1/merchant/customers", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    sendData(res, {
      customers: await customerRepository.searchByStore(storeId, req.query.search || req.query.busca || "", req.query.limit || 24)
    });
  }));

  app.get("/api/v1/merchant/customers/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    const customer = await customerRepository.detailByStore(storeId, requireIntegerId(req.params.id));
    if (!customer) {
      sendData(res, { customer: null });
      return;
    }

    sendData(res, { customer });
  }));

  app.post("/api/v1/merchant/customers", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
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

  app.put("/api/v1/merchant/customers/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    requireFields(req.body, ["nome"]);
    const customerId = requireIntegerId(req.params.id);
    const customer = await runInTransaction(dependencies.pool, async (connection) => customerRepository.update(connection, customerId, req.body));
    if (!customer) {
      throw new ApiError("Cliente nao encontrado.", 404);
    }
    sendData(res, { customer });
  }));

  app.patch("/api/v1/merchant/orders/:id/status", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    requireFields(req.body, ["status"]);
    sendData(res, {
      order: await orderService.updateStatus(
        merchantStoreId(req.auth),
        Number(req.params.id),
        req.body.status,
        Number(req.auth.sub),
        req.body.reason || req.body.motivo || null
      )
    });
  }));

  app.get("/api/v1/merchant/cash-register", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    sendData(res, {
      current: await cashRegisterRepository.currentByStore(storeId),
      history: await cashRegisterRepository.historyByStore(storeId, 8)
    });
  }));

  app.get("/api/v1/merchant/inventory", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, await inventoryRepository.overviewByStore(merchantStoreId(req.auth)));
  }));

  app.get("/api/v1/merchant/inventory/:id/movements", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, {
      movements: await inventoryRepository.productMovements(
        merchantStoreId(req.auth),
        requireIntegerId(req.params.id),
        req.query.limit || 12
      )
    });
  }));

  app.post("/api/v1/merchant/inventory/:id/movements", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    requireFields(req.body, ["tipo_movimentacao", "quantidade"]);
    const product = await runInTransaction(dependencies.pool, async (connection) => (
      inventoryRepository.createMovement(
        connection,
        merchantStoreId(req.auth),
        requireIntegerId(req.params.id),
        Number(req.auth.sub),
        req.body
      )
    ));
    sendData(res, { product });
  }));

  app.get("/api/v1/merchant/reports", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, await reportsRepository.byStore(
      merchantStoreId(req.auth),
      req.query.start || null,
      req.query.end || null
    ));
  }));

  app.post("/api/v1/merchant/cash-register/open", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    requireFields(req.body, ["valor_inicial"]);
    const session = await runInTransaction(dependencies.pool, async (connection) => (
      cashRegisterRepository.open(connection, storeId, Number(req.auth.sub), req.body)
    ));
    sendData(res, { session }, 201);
  }));

  app.post("/api/v1/merchant/cash-register/:id/movements", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    requireFields(req.body, ["tipo_movimentacao", "valor"]);
    const session = await runInTransaction(dependencies.pool, async (connection) => (
      cashRegisterRepository.createMovement(
        connection,
        merchantStoreId(req.auth),
        requireIntegerId(req.params.id),
        Number(req.auth.sub),
        req.body
      )
    ));
    sendData(res, { session });
  }));

  app.post("/api/v1/merchant/cash-register/:id/close", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    requireFields(req.body, ["valor_real"]);
    const session = await runInTransaction(dependencies.pool, async (connection) => (
      cashRegisterRepository.close(
        connection,
        merchantStoreId(req.auth),
        requireIntegerId(req.params.id),
        req.body
      )
    ));
    sendData(res, { session });
  }));

  app.get("/api/v1/merchant/products", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, {
      products: await catalogRepository.productsByStore(merchantStoreId(req.auth))
    });
  }));

  app.post("/api/v1/merchant/products", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, {
      product: await catalogService.saveProduct(merchantStoreId(req.auth), req.body)
    }, 201);
  }));

  app.put("/api/v1/merchant/products/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, {
      product: await catalogService.saveProduct(merchantStoreId(req.auth), req.body, Number(req.params.id))
    });
  }));

  app.delete("/api/v1/merchant/products/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    await catalogRepository.deleteProduct(merchantStoreId(req.auth), Number(req.params.id));
    sendData(res, { deleted: true });
  }));

  app.get("/api/v1/merchant/settings", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    sendData(res, {
      store: await storeRepository.merchantSettings(merchantStoreId(req.auth))
    });
  }));

  app.put("/api/v1/merchant/settings", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    await storeRepository.upsertSettings(storeId, req.body);
    sendData(res, {
      store: await storeRepository.merchantSettings(storeId)
    });
  }));

  app.get("/api/v1/merchant/option-groups", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    sendData(res, { groups: await optionGroupRepository.byStore(storeId) });
  }));

  app.post("/api/v1/merchant/option-groups", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    const groupId = await optionGroupRepository.upsert(storeId, req.body);
    sendData(res, {
      group_id: groupId,
      groups: await optionGroupRepository.byStore(storeId)
    }, 201);
  }));

  app.put("/api/v1/merchant/option-groups/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    const groupId = await optionGroupRepository.upsert(storeId, req.body, Number(req.params.id));
    sendData(res, {
      group_id: groupId,
      groups: await optionGroupRepository.byStore(storeId)
    });
  }));

  app.delete("/api/v1/merchant/option-groups/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    await optionGroupRepository.delete(storeId, Number(req.params.id));
    sendData(res, {
      deleted: true,
      groups: await optionGroupRepository.byStore(storeId)
    });
  }));

  app.get("/api/v1/merchant/promotions", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    sendData(res, { promotions: await promotionRepository.byStore(storeId) });
  }));

  app.post("/api/v1/merchant/promotions", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    const promotionId = await promotionRepository.upsert(storeId, req.body);
    sendData(res, {
      promotion_id: promotionId,
      promotions: await promotionRepository.byStore(storeId)
    }, 201);
  }));

  app.put("/api/v1/merchant/promotions/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    const promotionId = await promotionRepository.upsert(storeId, req.body, Number(req.params.id));
    sendData(res, {
      promotion_id: promotionId,
      promotions: await promotionRepository.byStore(storeId)
    });
  }));

  app.delete("/api/v1/merchant/promotions/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    const storeId = merchantStoreId(req.auth);
    await promotionRepository.delete(storeId, Number(req.params.id));
    sendData(res, {
      deleted: true,
      promotions: await promotionRepository.byStore(storeId)
    });
  }));
}
