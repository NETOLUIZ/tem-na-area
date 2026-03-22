import cors from "cors";
import express from "express";
import { StoresController } from "./controllers/stores-controller.js";
import { ProductsController } from "./controllers/products-controller.js";
import { OrdersController } from "./controllers/orders-controller.js";
import { PaymentsController } from "./controllers/payments-controller.js";
import { SalesController } from "./controllers/sales-controller.js";
import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { ApiError } from "./lib/api-error.js";
import { sendError } from "./lib/http.js";
import { AuthToken } from "./lib/token.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { securityHeaders } from "./middleware/security.js";
import { AdminRepository } from "./repositories/admin-repository.js";
import { AuthRepository } from "./repositories/auth-repository.js";
import { CatalogRepository } from "./repositories/catalog-repository.js";
import { CashRegisterRepository } from "./repositories/cash-register-repository.js";
import { CommerceRepository } from "./repositories/commerce-repository.js";
import { CustomerRepository } from "./repositories/customer-repository.js";
import { InventoryRepository } from "./repositories/inventory-repository.js";
import { OptionGroupRepository } from "./repositories/option-group-repository.js";
import { OrderRepository } from "./repositories/order-repository.js";
import { PaymentRecordRepository } from "./repositories/payment-record-repository.js";
import { PromotionRepository } from "./repositories/promotion-repository.js";
import { RegistrationRepository } from "./repositories/registration-repository.js";
import { ReportsRepository } from "./repositories/reports-repository.js";
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
import { registerOrdersRoutes } from "./routes/orders-routes.js";
import { registerPdvRoutes } from "./routes/pdv-routes.js";
import { registerPaymentsRoutes } from "./routes/payments-routes.js";
import { registerProductsRoutes } from "./routes/products-routes.js";
import { registerPublicRoutes } from "./routes/public-routes.js";
import { registerSalesRoutes } from "./routes/sales-routes.js";
import { registerStoresRoutes } from "./routes/stores-routes.js";

// A aplicacao preserva os contratos da API atual para reduzir impacto no frontend.
const authToken = new AuthToken(env.appKey);
const auth = createAuthMiddleware(authToken);

const authRepository = new AuthRepository(pool);
const storeRepository = new StoreRepository(pool);
const catalogRepository = new CatalogRepository(pool);
const customerRepository = new CustomerRepository(pool);
const cashRegisterRepository = new CashRegisterRepository(pool);
const inventoryRepository = new InventoryRepository(pool);
const orderRepository = new OrderRepository(pool);
const reportsRepository = new ReportsRepository(pool);
const paymentRecordRepository = new PaymentRecordRepository(pool);
const optionGroupRepository = new OptionGroupRepository(pool);
const promotionRepository = new PromotionRepository(pool);
const registrationRepository = new RegistrationRepository(pool);
const adminRepository = new AdminRepository(pool);
const commerceRepository = new CommerceRepository(pool);

const authService = new AuthService(authRepository, authToken);
const catalogService = new CatalogService(catalogRepository);
const orderService = new OrderService(pool, storeRepository, catalogRepository, orderRepository, paymentRecordRepository);
const registrationService = new RegistrationService(registrationRepository, pool);
const adminService = new AdminService(storeRepository);
const storesController = new StoresController(commerceRepository);
const productsController = new ProductsController(commerceRepository);
const ordersController = new OrdersController(commerceRepository, orderService);
const paymentsController = new PaymentsController(commerceRepository);
const salesController = new SalesController(commerceRepository);

export const app = express();
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(securityHeaders);
app.use(express.json());

// Netlify encaminha a API por /api/* via redirect para a function.
app.set("trust proxy", 1);

registerHealthRoutes(app, { pool });
registerAuthRoutes(app, { auth, authService });
registerStoresRoutes(app, { storesController });
registerProductsRoutes(app, { productsController });
registerOrdersRoutes(app, { auth, ordersController });
registerPaymentsRoutes(app, { auth, paymentsController });
registerSalesRoutes(app, { auth, salesController });
registerPublicRoutes(app, {
  storeRepository,
  catalogRepository,
  optionGroupRepository,
  registrationService,
  orderService
});
registerPdvRoutes(app, {
  auth,
  authService,
  pool,
  storeRepository,
  catalogRepository,
  orderRepository,
  customerRepository,
  orderService
});
registerMerchantRoutes(app, {
  auth,
  pool,
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
