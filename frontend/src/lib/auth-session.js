function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const decoded = atob(`${normalized}${padding}`);

  return decodeURIComponent(
    decoded
      .split("")
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("")
  );
}

export function parseJwtPayload(token) {
  try {
    const [, payload] = String(token || "").split(".");
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  return Number(payload.exp) <= Math.floor(Date.now() / 1000);
}

export function isMerchantSessionValid(session) {
  return Boolean(
    session?.merchantToken
    && session?.merchantStoreId
    && !isTokenExpired(session.merchantToken)
  );
}

export function merchantProfileFromSession(session) {
  if (!session?.merchantToken) {
    return "ADMIN";
  }

  const payload = parseJwtPayload(session.merchantToken);
  return String(payload?.merchant_profile || session?.merchantProfile || "ADMIN").toUpperCase();
}

export function merchantPermissionsFromSession(session) {
  const payload = parseJwtPayload(session?.merchantToken);
  if (Array.isArray(payload?.permissions)) {
    return payload.permissions;
  }

  if (Array.isArray(session?.merchantPermissions)) {
    return session.merchantPermissions;
  }

  return [];
}

export function hasMerchantPermission(session, permission) {
  const permissions = merchantPermissionsFromSession(session);
  if (permissions.includes(permission)) {
    return true;
  }

  return merchantProfileFromSession(session) === "ADMIN";
}

export function isAdminSessionValid(session) {
  return Boolean(session?.superAdminToken && !isTokenExpired(session.superAdminToken));
}

export function isAuthFailure(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("token")
    || message.includes("sessao")
    || message.includes("sessão")
    || message.includes("nao informado")
    || message.includes("não informado")
    || message.includes("permissao")
    || message.includes("permissão")
  );
}
