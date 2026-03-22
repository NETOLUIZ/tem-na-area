export const MERCHANT_PERMISSION_PRESETS = {
  ADMIN: [
    "dashboard:view",
    "orders:view",
    "orders:update",
    "orders:cancel",
    "customers:view",
    "customers:manage",
    "pdv:access",
    "products:view",
    "products:manage",
    "settings:view",
    "settings:manage",
    "cash_register:view",
    "cash_register:manage",
    "inventory:view",
    "inventory:manage",
    "reports:view"
  ],
  GERENTE: [
    "dashboard:view",
    "orders:view",
    "orders:update",
    "orders:cancel",
    "customers:view",
    "customers:manage",
    "pdv:access",
    "products:view",
    "products:manage",
    "settings:view",
    "cash_register:view",
    "cash_register:manage",
    "inventory:view",
    "inventory:manage",
    "reports:view"
  ],
  OPERADOR: [
    "dashboard:view",
    "orders:view",
    "orders:update",
    "customers:view",
    "pdv:access",
    "products:view",
    "cash_register:view",
    "cash_register:manage",
    "inventory:view"
  ],
  COZINHA: [
    "dashboard:view",
    "orders:view",
    "orders:update"
  ],
  ENTREGADOR: [
    "orders:view"
  ]
};

export function merchantPermissionsForProfile(profile = "ADMIN") {
  const normalized = String(profile || "ADMIN").trim().toUpperCase();
  return MERCHANT_PERMISSION_PRESETS[normalized] || MERCHANT_PERMISSION_PRESETS.ADMIN;
}
