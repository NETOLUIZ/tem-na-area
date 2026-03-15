import { sendData } from "../lib/http.js";

export function registerHealthRoutes(app) {
  const payload = { status: "ok", service: "tem-na-area-node-api" };

  app.get("/", (_req, res) => sendData(res, payload));
  app.get("/health", (_req, res) => sendData(res, payload));
  app.get("/api/v1/health", (_req, res) => sendData(res, payload));
}
