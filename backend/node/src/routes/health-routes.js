import { sendData } from "../lib/http.js";

export function registerHealthRoutes(app, { pool }) {
  const payload = { status: "ok", service: "tem-na-area-node-api" };

  app.get("/", (_req, res) => sendData(res, payload));
  app.get("/health", (_req, res) => sendData(res, payload));
  app.get("/api/v1/health", (_req, res) => sendData(res, payload));

  app.get("/api/v1/health/db", async (_req, res, next) => {
    try {
      const [rows] = await pool.query("SELECT NOW() AS database_time");
      sendData(res, {
        ...payload,
        database: "ok",
        database_time: rows[0]?.database_time || null
      });
    } catch (error) {
      next(error);
    }
  });
}
