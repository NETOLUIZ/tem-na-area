export function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

export function buildWhatsAppUrl(value) {
  const digits = normalizePhone(value);
  if (!digits) return null;

  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountryCode}`;
}
