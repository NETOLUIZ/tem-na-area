import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { ApiError } from "./lib/api-error.js";
import { asyncHandler } from "./lib/async-handler.js";
import { sendData, sendError } from "./lib/http.js";
import { AuthToken } from "./lib/token.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { AdminRepository } from "./repositories/admin-repository.js";
import { AuthRepository } from "./repositories/auth-repository.js";
import { CatalogRepository } from "./repositories/catalog-repository.js";
import { OptionGroupRepository } from "./repositories/option-group-repository.js";
import { OrderRepository } from "./repositories/order-repository.js";
import { PromotionRepository } from "./repositories/promotion-repository.js";
import { RegistrationRepository } from "./repositories/registration-repository.js";
import { StoreRepository } from "./repositories/store-repository.js";
import { AdminService } from "./services/admin-service.js";
import { AuthService } from "./services/auth-service.js";
import { CatalogService } from "./services/catalog-service.js";
import { OrderService } from "./services/order-service.js";
import { RegistrationService } from "./services/registration-service.js";

// A aplicacao usa os mesmos contratos do backend PHP para reduzir impacto no frontend.
const authToken = new AuthToken(env.appKey);
const auth = createAuthMiddleware(authToken);

const authRepository = new AuthRepository(pool);
const storeRepository = new StoreRepository(pool);
const catalogRepository = new CatalogRepository(pool);
const orderRepository = new OrderRepository(pool);
const optionGroupRepository = new OptionGroupRepository(pool);
const promotionRepository = new PromotionRepository(pool);
const registrationRepository = new RegistrationRepository(pool);
const adminRepository = new AdminRepository(pool);

const authService = new AuthService(authRepository, authToken);
const catalogService = new CatalogService(catalogRepository);
const orderService = new OrderService(pool, storeRepository, catalogRepository, orderRepository);
const registrationService = new RegistrationService(registrationRepository);
const adminService = new AdminService(storeRepository);

export const app = express();

app.use(cors({ origin: env.corsOrigin.split(",").map((item) => item.trim()) }));
app.use(express.json());

function requireFields(payload, fields) {
  const missing = fields.filter((field) => payload[field] === undefined || payload[field] === "");
  if (missing.length > 0) {
    throw new ApiError("Campos obrigatorios ausentes.", 422, { missing });
  }
}

app.get("/", (_req, res) => sendData(res, { status: "ok", service: "tem-na-area-node-api" }));
app.get("/health", (_req, res) => sendData(res, { status: "ok", service: "tem-na-area-node-api" }));
app.get("/api/v1/health", (_req, res) => sendData(res, { status: "ok", service: "tem-na-area-node-api" }));

app.post("/api/v1/auth/merchant/login", asyncHandler(async (req, res) => {
  requireFields(req.body, ["login", "senha"]);
  sendData(res, await authService.merchantLogin(req.body.login, req.body.senha));
}));

app.post("/api/v1/auth/admin/login", asyncHandler(async (req, res) => {
  requireFields(req.body, ["login", "senha"]);
  sendData(res, await authService.adminLogin(req.body.login, req.body.senha));
}));

app.get("/api/v1/public/home", asyncHandler(async (_req, res) => {
  sendData(res, {
    plans: await storeRepository.findPlans(),
    cards: await storeRepository.homeCards(),
    stores: await storeRepository.activeStores()
  });
}));

app.get("/api/v1/public/stores", asyncHandler(async (req, res) => {
  sendData(res, {
    stores: await storeRepository.activeStores(req.query.categoria || null, req.query.busca || null)
  });
}));

app.get("/api/v1/public/stores/:slug", asyncHandler(async (req, res) => {
  const store = await storeRepository.findStoreBySlug(req.params.slug);
  if (!store) {
    throw new ApiError("Loja nao encontrada.", 404);
  }

  sendData(res, {
    store,
    products: await catalogRepository.productsByStore(Number(store.id), true),
    option_groups: await optionGroupRepository.byStore(Number(store.id))
  });
}));

app.get("/api/v1/public/stores/:slug/products", asyncHandler(async (req, res) => {
  const store = await storeRepository.findStoreBySlug(req.params.slug);
  if (!store) {
    throw new ApiError("Loja nao encontrada.", 404);
  }

  sendData(res, {
    store,
    products: await catalogRepository.productsByStore(Number(store.id), true),
    option_groups: await optionGroupRepository.byStore(Number(store.id))
  });
}));

app.post("/api/v1/public/leads/free", asyncHandler(async (req, res) => {
  sendData(res, await registrationService.createLead(req.body, "FREE"));
}));

app.post("/api/v1/public/leads/paid", asyncHandler(async (req, res) => {
  sendData(res, await registrationService.createLead(req.body, "PRO"));
}));

app.post("/api/v1/public/orders", asyncHandler(async (req, res) => {
  sendData(res, { order: await orderService.create(req.body) }, 201);
}));

app.get("/api/v1/merchant/dashboard", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  const storeId = Number(req.auth.store_id || 0);
  if (storeId <= 0) {
    throw new ApiError("Usuario sem loja vinculada.", 403);
  }

  sendData(res, await storeRepository.merchantDashboard(storeId));
}));

app.get("/api/v1/merchant/orders", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  sendData(res, {
    orders: await orderRepository.ordersByStore(Number(req.auth.store_id || 0), req.query.status || null)
  });
}));

app.patch("/api/v1/merchant/orders/:id/status", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  requireFields(req.body, ["status"]);
  sendData(res, {
    order: await orderService.updateStatus(Number(req.auth.store_id || 0), Number(req.params.id), req.body.status, Number(req.auth.sub))
  });
}));

app.get("/api/v1/merchant/products", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  sendData(res, {
    products: await catalogRepository.productsByStore(Number(req.auth.store_id || 0))
  });
}));

app.post("/api/v1/merchant/products", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  sendData(res, {
    product: await catalogService.saveProduct(Number(req.auth.store_id || 0), req.body)
  }, 201);
}));

app.put("/api/v1/merchant/products/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  sendData(res, {
    product: await catalogService.saveProduct(Number(req.auth.store_id || 0), req.body, Number(req.params.id))
  });
}));

app.delete("/api/v1/merchant/products/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  await catalogRepository.deleteProduct(Number(req.auth.store_id || 0), Number(req.params.id));
  sendData(res, { deleted: true });
}));

app.get("/api/v1/merchant/settings", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  sendData(res, {
    store: await storeRepository.merchantSettings(Number(req.auth.store_id || 0))
  });
}));

app.put("/api/v1/merchant/settings", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  const storeId = Number(req.auth.store_id || 0);
  await storeRepository.upsertSettings(storeId, req.body);
  sendData(res, {
    store: await storeRepository.merchantSettings(storeId)
  });
}));

app.get("/api/v1/merchant/option-groups", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  const storeId = Number(req.auth.store_id || 0);
  sendData(res, { groups: await optionGroupRepository.byStore(storeId) });
}));

app.post("/api/v1/merchant/option-groups", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  const storeId = Number(req.auth.store_id || 0);
  const groupId = await optionGroupRepository.upsert(storeId, req.body);
  sendData(res, {
    group_id: groupId,
    groups: await optionGroupRepository.byStore(storeId)
  }, 201);
}));

app.put("/api/v1/merchant/option-groups/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  const storeId = Number(req.auth.store_id || 0);
  const groupId = await optionGroupRepository.upsert(storeId, req.body, Number(req.params.id));
  sendData(res, {
    group_id: groupId,
    groups: await optionGroupRepository.byStore(storeId)
  });
}));

app.delete("/api/v1/merchant/option-groups/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  const storeId = Number(req.auth.store_id || 0);
  await optionGroupRepository.delete(storeId, Number(req.params.id));
  sendData(res, {
    deleted: true,
    groups: await optionGroupRepository.byStore(storeId)
  });
}));

app.get("/api/v1/merchant/promotions", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  const storeId = Number(req.auth.store_id || 0);
  sendData(res, { promotions: await promotionRepository.byStore(storeId) });
}));

app.post("/api/v1/merchant/promotions", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  const storeId = Number(req.auth.store_id || 0);
  const promotionId = await promotionRepository.upsert(storeId, req.body);
  sendData(res, {
    promotion_id: promotionId,
    promotions: await promotionRepository.byStore(storeId)
  }, 201);
}));

app.put("/api/v1/merchant/promotions/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  const storeId = Number(req.auth.store_id || 0);
  const promotionId = await promotionRepository.upsert(storeId, req.body, Number(req.params.id));
  sendData(res, {
    promotion_id: promotionId,
    promotions: await promotionRepository.byStore(storeId)
  });
}));

app.delete("/api/v1/merchant/promotions/:id", auth.requireRole("merchant"), asyncHandler(async (req, res) => {
  const storeId = Number(req.auth.store_id || 0);
  await promotionRepository.delete(storeId, Number(req.params.id));
  sendData(res, {
    deleted: true,
    promotions: await promotionRepository.byStore(storeId)
  });
}));

app.get("/api/v1/admin/dashboard", auth.requireRole("admin"), asyncHandler(async (_req, res) => {
  sendData(res, await adminRepository.dashboard());
}));

app.get("/api/v1/admin/stores", auth.requireRole("admin"), asyncHandler(async (req, res) => {
  sendData(res, {
    stores: await storeRepository.adminStores(req.query.status || null)
  });
}));

app.patch("/api/v1/admin/stores/:id/status", auth.requireRole("admin"), asyncHandler(async (req, res) => {
  requireFields(req.body, ["status"]);
  sendData(res, {
    store: await adminService.updateStoreStatus(
      Number(req.params.id),
      req.body.status,
      req.auth.admin_id ? Number(req.auth.admin_id) : null,
      req.body.motivo ?? null
    )
  });
}));

app.get("/api/v1/admin/logs", auth.requireRole("admin"), asyncHandler(async (_req, res) => {
  sendData(res, { logs: await adminRepository.logs() });
}));

app.get("/api/v1/admin/leads", auth.requireRole("admin"), asyncHandler(async (_req, res) => {
  sendData(res, { leads: await registrationRepository.freeLeads() });
}));

app.patch("/api/v1/admin/leads/:id/approve", auth.requireRole("admin"), asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();
  let approval = null;

  try {
    await connection.beginTransaction();
    approval = await registrationRepository.approveFreeLead(connection, Number(req.params.id), Number(req.auth.admin_id || 0));
    if (!approval) {
      throw new ApiError("Lead nao encontrado ou invalido.", 404);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  sendData(res, {
    approval,
    leads: await registrationRepository.freeLeads(),
    stores: await storeRepository.adminStores()
  });
}));

app.use((req, _res, next) => {
  next(new ApiError(`Rota nao encontrada: ${req.method} ${req.originalUrl}`, 404));
});

app.use((error, _req, res, _next) => {
  sendError(res, error);
});
