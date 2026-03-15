import dotenv from "dotenv";

dotenv.config();

export const env = {
  appEnv: process.env.TEM_NA_AREA_APP_ENV || "local",
  appUrl: process.env.TEM_NA_AREA_APP_URL || "http://127.0.0.1:3001",
  appKey: process.env.TEM_NA_AREA_APP_KEY || "troque-esta-chave",
  dbHost: process.env.TEM_NA_AREA_DB_HOST || "127.0.0.1",
  dbPort: Number(process.env.TEM_NA_AREA_DB_PORT || 3306),
  dbName: process.env.TEM_NA_AREA_DB_NAME || "tem_na_area",
  dbUser: process.env.TEM_NA_AREA_DB_USER || "root",
  dbPass: process.env.TEM_NA_AREA_DB_PASS || "",
  port: Number(process.env.TEM_NA_AREA_PORT || 3001),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173"
};
