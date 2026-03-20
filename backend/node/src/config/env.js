import dotenv from "dotenv";

dotenv.config();

const defaultCorsOrigins = [
  "https://temnaarea.site",
  "https://www.temnaarea.site",
  "https://pdv.temnaarea.site"
].join(",");

export const env = {
  appEnv: process.env.TEM_NA_AREA_APP_ENV || "local",
  siteUrl: process.env.TEM_NA_AREA_SITE_URL || "https://temnaarea.site",
  siteWwwUrl: process.env.TEM_NA_AREA_SITE_WWW_URL || "https://www.temnaarea.site",
  pdvUrl: process.env.TEM_NA_AREA_PDV_URL || "https://pdv.temnaarea.site",
  apiUrl: process.env.TEM_NA_AREA_API_URL || "https://api.temnaarea.site",
  appUrl: process.env.TEM_NA_AREA_APP_URL
    || (process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : "http://127.0.0.1:3001"),
  appKey: process.env.TEM_NA_AREA_APP_KEY || "troque-esta-chave",
  databaseUrl: process.env.DATABASE_URL || null,
  dbSslMode: process.env.TEM_NA_AREA_DB_SSLMODE || null,
  dbSslRejectUnauthorized: process.env.TEM_NA_AREA_DB_SSL_REJECT_UNAUTHORIZED !== "false",
  dbHost: process.env.TEM_NA_AREA_DB_HOST || "127.0.0.1",
  dbPort: Number(process.env.TEM_NA_AREA_DB_PORT || 5432),
  dbName: process.env.TEM_NA_AREA_DB_NAME || "tem_na_area",
  dbUser: process.env.TEM_NA_AREA_DB_USER || "postgres",
  dbPass: process.env.TEM_NA_AREA_DB_PASS || "",
  port: Number(process.env.PORT || process.env.TEM_NA_AREA_PORT || 3001),
  corsOrigin: process.env.CORS_ORIGIN || defaultCorsOrigins,
  bootstrapDatabase: process.env.TEM_NA_AREA_BOOTSTRAP_DB !== "false"
};
