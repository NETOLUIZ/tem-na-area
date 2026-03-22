import { asyncHandler } from "../lib/async-handler.js";
import { sendData } from "../lib/http.js";
import { requireFields } from "../lib/validators.js";

export function registerAuthRoutes(app, { auth, authService }) {
  app.post("/api/v1/auth/merchant/login", asyncHandler(async (req, res) => {
    requireFields(req.body, ["login", "senha"]);
    sendData(res, await authService.merchantLogin(req.body.login, req.body.senha));
  }));

  app.post("/api/v1/auth/admin/login", asyncHandler(async (req, res) => {
    requireFields(req.body, ["login", "senha"]);
    sendData(res, await authService.adminLogin(req.body.login, req.body.senha));
  }));

  app.get("/api/v1/auth/session", auth.requireRole("merchant", "admin"), asyncHandler(async (req, res) => {
    sendData(res, {
      authenticated: true,
      role: req.auth.role,
      user_id: Number(req.auth.sub),
      store_id: req.auth.store_id ? Number(req.auth.store_id) : null,
      access_level: req.auth.access_level || null,
      exp: Number(req.auth.exp || 0)
    });
  }));
}
