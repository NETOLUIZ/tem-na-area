import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { ApiError } from "./lib/api-error.js";
import { sendError } from "./lib/http.js";
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
import { registerAdminRoutes } from "./routes/admin-routes.js";
import { registerAuthRoutes } from "./routes/auth-routes.js";
import { registerHealthRoutes } from "./routes/health-routes.js";
import { registerMerchantRoutes } from "./routes/merchant-routes.js";
import { registerPublicRoutes } from "./routes/public-routes.js";

// A aplicacao preserva os contratos da API atual para reduzir impacto no frontend.
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

const corsOrigin = env.corsOrigin.trim() === "*"
  ? true
  : env.corsOrigin.split(",").map((item) => item.trim());

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

registerHealthRoutes(app);
registerAuthRoutes(app, { authService });
registerPublicRoutes(app, {
  storeRepository,
  catalogRepository,
  optionGroupRepository,
  registrationService,
  orderService
});
registerMerchantRoutes(app, {
  auth,
  storeRepository,
  catalogRepository,
  orderRepository,
  optionGroupRepository,
  promotionRepository,
  catalogService,
  orderService
});
registerAdminRoutes(app, {
  auth,
  pool,
  adminRepository,
  registrationRepository,
  storeRepository,
  adminService
});

app.use((req, _res, next) => {
  next(new ApiError(`Rota nao encontrada: ${req.method} ${req.originalUrl}`, 404));
});

app.use((error, _req, res, _next) => {
  sendError(res, error);
});
