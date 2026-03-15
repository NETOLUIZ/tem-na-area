import { ApiError } from "../lib/api-error.js";
import { asyncHandler } from "../lib/async-handler.js";
import { sendData } from "../lib/http.js";
import { runInTransaction } from "../lib/transactions.js";
import { requireFields } from "../lib/validators.js";

export function registerAdminRoutes(app, dependencies) {
  const {
    auth,
    pool,
    adminRepository,
    registrationRepository,
    storeRepository,
    adminService
  } = dependencies;

  app.get("/api/v1/admin/dashboard", auth.requireRole("admin"), asyncHandler(async (_req, res) => {
    sendData(res, await adminRepository.dashboard());
  }));

  app.get("/api/v1/admin/stores", auth.requireRole("admin"), asyncHandler(async (req, res) => {
    sendData(res, {
      stores: await storeRepository.adminStores(req.query.status || null)
    });
  }));

  app.patch("/api/v1/admin/stores/:id/status", auth.requireRole("admin"), asyncHandler(async (req, res) => {
    requireFields(req.body, ["status"]);
    sendData(res, {
      store: await adminService.updateStoreStatus(
        Number(req.params.id),
        req.body.status,
        req.auth.admin_id ? Number(req.auth.admin_id) : null,
        req.body.motivo ?? null
      )
    });
  }));

  app.get("/api/v1/admin/logs", auth.requireRole("admin"), asyncHandler(async (_req, res) => {
    sendData(res, { logs: await adminRepository.logs() });
  }));

  app.get("/api/v1/admin/leads", auth.requireRole("admin"), asyncHandler(async (_req, res) => {
    sendData(res, { leads: await registrationRepository.freeLeads() });
  }));

  app.patch("/api/v1/admin/leads/:id/approve", auth.requireRole("admin"), asyncHandler(async (req, res) => {
    const approval = await runInTransaction(pool, async (connection) => {
      const result = await registrationRepository.approveFreeLead(connection, Number(req.params.id), Number(req.auth.admin_id || 0));
      if (!result) {
        throw new ApiError("Lead nao encontrado ou invalido.", 404);
      }
      return result;
    });

    sendData(res, {
      approval,
      leads: await registrationRepository.freeLeads(),
      stores: await storeRepository.adminStores()
    });
  }));
}
