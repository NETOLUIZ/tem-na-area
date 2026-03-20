import { asyncHandler } from "../lib/async-handler.js";

export function registerSalesRoutes(app, { auth, salesController }) {
  app.get("/api/v1/sales", auth.requireRole("merchant", "admin"), asyncHandler(salesController.index));
}
