const TECHNICAL_PATTERNS = [
  "cannot find module",
  "require stack",
  "stack trace",
  "syntaxerror:",
  "typeerror:",
  "referenceerror:",
  "raw-body",
  "iconv-lite",
  "node_modules",
  "failed to fetch",
  "networkerror",
  "load failed",
  "fetch failed",
  "unexpected token",
  "internal server error",
  "ecconnrefused",
  "econnrefused"
];

function normalizeMessage(message) {
  return String(message || "").replace(/\s+/g, " ").trim();
}

export function getUserErrorMessage(error, fallback = "Nao foi possivel concluir a operacao agora.") {
  const message = normalizeMessage(error?.message || error);
  const lowerMessage = message.toLowerCase();

  if (!message) {
    return fallback;
  }

  if (TECHNICAL_PATTERNS.some((pattern) => lowerMessage.includes(pattern))) {
    return fallback;
  }

  if (message.length > 180) {
    return fallback;
  }

  return message;
}
