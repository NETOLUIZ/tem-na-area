import { asyncHandler } from "../lib/async-handler.js";

export function registerStoresRoutes(app, { storesController }) {
  app.get("/api/v1/stores", asyncHandler(storesController.index));
}
