import { ApiError } from "./api-error.js";

export function requireFields(payload = {}, fields = []) {
  const missing = fields.filter((field) => payload[field] === undefined || payload[field] === "");
  if (missing.length > 0) {
    throw new ApiError("Campos obrigatorios ausentes.", 422, { missing });
  }
}

export function merchantStoreId(auth) {
  const storeId = Number(auth?.store_id || 0);
  if (storeId <= 0) {
    throw new ApiError("Usuario sem loja vinculada.", 403);
  }

  return storeId;
}

export function requireIntegerId(value, field = "id") {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new ApiError(`${field} invalido.`, 422, { [field]: value });
  }

  return normalized;
}
