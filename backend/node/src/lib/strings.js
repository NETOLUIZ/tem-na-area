import crypto from "node:crypto";

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uuid() {
  return crypto.randomUUID();
}

export function protocol(prefix = "SOL") {
  const date = new Date();
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0")
  ].join("");
  const random = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `${prefix}-${parts}-${random}`;
}

export function orderCode(storeSequence) {
  return protocol("PED").replace(/-\d{4}$/, `-${String(storeSequence).padStart(4, "0")}`);
}
