import { ApiError } from "../lib/api-error.js";
import { asyncHandler } from "../lib/async-handler.js";
import { sendData } from "../lib/http.js";

async function loadStorePayload(storeRepository, catalogRepository, optionGroupRepository, slug) {
  const store = await storeRepository.findStoreBySlug(slug);
  if (!store) {
    throw new ApiError("Loja nao encontrada.", 404);
  }

  const storeId = Number(store.id);
  return {
    store,
    products: await catalogRepository.productsByStore(storeId, true),
    option_groups: await optionGroupRepository.byStore(storeId)
  };
}

export function registerPublicRoutes(app, dependencies) {
  const {
    storeRepository,
    catalogRepository,
    optionGroupRepository,
    registrationService,
    orderService
  } = dependencies;

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
    sendData(res, await loadStorePayload(
      storeRepository,
      catalogRepository,
      optionGroupRepository,
      req.params.slug
    ));
  }));

  app.get("/api/v1/public/stores/:slug/products", asyncHandler(async (req, res) => {
    sendData(res, await loadStorePayload(
      storeRepository,
      catalogRepository,
      optionGroupRepository,
      req.params.slug
    ));
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
}
