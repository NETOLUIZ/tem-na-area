import { asyncHandler } from "../lib/async-handler.js";

export function registerOrdersRoutes(app, { auth, ordersController }) {
  app.get("/api/v1/orders", auth.requireRole("merchant", "admin"), asyncHandler(ordersController.index));
  app.post("/api/v1/orders", asyncHandler(ordersController.create));
  app.patch("/api/v1/orders/:id/status", auth.requireRole("merchant", "admin"), asyncHandler(ordersController.updateStatus));
}
