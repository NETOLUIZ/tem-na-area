import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export async function verifyPassword(plainPassword, storedHash) {
  if (!storedHash) {
    return false;
  }

  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    return crypto.createHash("sha256").update(String(plainPassword)).digest("hex") === String(storedHash).toLowerCase();
  }

  return bcrypt.compare(String(plainPassword), String(storedHash));
}
