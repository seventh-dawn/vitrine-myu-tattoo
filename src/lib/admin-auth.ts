import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "myu_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET n'est pas configuré");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (
    expectedBuf.length !== signatureBuf.length ||
    !timingSafeEqual(expectedBuf, signatureBuf)
  ) {
    return false;
  }

  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}

export function checkPassword(candidate: string): boolean {
  const actual = process.env.ADMIN_PASSWORD;
  if (!actual) return false;
  const candidateBuf = Buffer.from(candidate);
  const actualBuf = Buffer.from(actual);
  if (candidateBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(candidateBuf, actualBuf);
}
