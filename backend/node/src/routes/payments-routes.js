import { asyncHandler } from "../lib/async-handler.js";

export function registerPaymentsRoutes(app, { auth, paymentsController }) {
  app.get("/api/v1/payments", auth.requireRole("merchant", "admin"), asyncHandler(paymentsController.index));
}
