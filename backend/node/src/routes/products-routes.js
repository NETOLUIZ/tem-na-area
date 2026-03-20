import { asyncHandler } from "../lib/async-handler.js";

export function registerProductsRoutes(app, { productsController }) {
  app.get("/api/v1/products", asyncHandler(productsController.index));
}
