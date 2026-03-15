import crypto from "node:crypto";
import { ApiError } from "./api-error.js";

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export class AuthToken {
  constructor(secret) {
    this.secret = secret;
  }

  encode(payload) {
    const header = { alg: "HS256", typ: "JWT" };
    const segments = [
      base64UrlEncode(JSON.stringify(header)),
      base64UrlEncode(JSON.stringify(payload))
    ];
    const signature = crypto
      .createHmac("sha256", this.secret)
      .update(segments.join("."))
      .digest("base64url");
    segments.push(signature);
    return segments.join(".");
  }

  decode(token) {
    const segments = String(token || "").split(".");
    if (segments.length !== 3) {
      throw new ApiError("Token invalido.", 401);
    }

    const [encodedHeader, encodedPayload, encodedSignature] = segments;
    const expected = crypto
      .createHmac("sha256", this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    if (encodedSignature.length !== expected.length) {
      throw new ApiError("Assinatura do token invalida.", 401);
    }

    if (!crypto.timingSafeEqual(Buffer.from(encodedSignature), Buffer.from(expected))) {
      throw new ApiError("Assinatura do token invalida.", 401);
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if ((payload.exp || 0) < Math.floor(Date.now() / 1000)) {
      throw new ApiError("Token expirado.", 401);
    }

    return payload;
  }
}
