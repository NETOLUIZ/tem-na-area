import { asyncHandler } from "../lib/async-handler.js";
import { sendData } from "../lib/http.js";
import { merchantStoreId, requireFields } from "../lib/validators.js";

export function registerMerchantRoutes(app, dependencies) {
  const {
    auth,
    storeRepository,
    catalogRepository,
    orderRepository,
    optionGroupRepository,
    promotionRepository,
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

  app.patch("/api/v1/merchant/orders/:id/status", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
    requireFields(req.body, ["status"]);
    sendData(res, {
      order: await orderService.updateStatus(
        merchantStoreId(req.auth),
        Number(req.params.id),
        req.body.status,
        Number(req.auth.sub)
      )
    });
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
