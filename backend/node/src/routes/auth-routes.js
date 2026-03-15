import { asyncHandler } from "../lib/async-handler.js";
import { sendData } from "../lib/http.js";
import { requireFields } from "../lib/validators.js";

export function registerAuthRoutes(app, { authService }) {
  app.post("/api/v1/auth/merchant/login", asyncHandler(async (req, res) => {
    requireFields(req.body, ["login", "senha"]);
    sendData(res, await authService.merchantLogin(req.body.login, req.body.senha));
  }));

  app.post("/api/v1/auth/admin/login", asyncHandler(async (req, res) => {
    requireFields(req.body, ["login", "senha"]);
    sendData(res, await authService.adminLogin(req.body.login, req.body.senha));
  }));
}
