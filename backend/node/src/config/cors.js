import { ApiError } from "../lib/api-error.js";
import { env } from "./env.js";

function splitOrigins(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const allowedCorsOrigins = splitOrigins(env.corsOrigin);

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedCorsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new ApiError("Origem nao permitida pelo CORS.", 403, { origin }));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
  credentials: false,
  maxAge: 86400
};
