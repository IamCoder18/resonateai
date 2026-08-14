import crypto from "node:crypto";

export const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

let cachedAdminEmail: string | null | undefined;
export function getAdminEmail(): string {
  if (cachedAdminEmail !== undefined) return cachedAdminEmail as string;
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL is not configured");
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new Error("ADMIN_EMAIL is not a valid email address");
  }
  cachedAdminEmail = normalized;
  return cachedAdminEmail;
}

let cachedSecret: string | null | undefined;
function getSecret(): string {
  if (cachedSecret !== undefined) return cachedSecret as string;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET is required and must be at least 32 characters");
  }
  cachedSecret = secret;
  return cachedSecret;
}

function getBaseUrl(): string {
  return (
    process.env.PUBLIC_BASE_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function buildPayload(
  blobKey: string,
  expiresAt: number,
  email: string,
): string {
  return `${blobKey}|${expiresAt}|${email.toLowerCase()}`;
}

function signPayload(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export interface SignOpts {
  blobKey: string;
  email: string;
  ttlSeconds?: number;
}

export function signDownloadUrl(opts: SignOpts): {
  url: string;
  expiresAt: number;
} {
  if (!opts.email) throw new Error("email is required for signed URL");
  const expiresAt =
    Math.floor(Date.now() / 1000) + (opts.ttlSeconds || DEFAULT_TTL_SECONDS);
  const payload = buildPayload(opts.blobKey, expiresAt, opts.email);
  const signature = signPayload(payload);
  const params = new URLSearchParams({
    key: opts.blobKey,
    exp: String(expiresAt),
    email: opts.email.toLowerCase(),
    sig: signature,
  });
  return {
    url: `${getBaseUrl()}/api/admin/download?${params.toString()}`,
    expiresAt,
  };
}

export type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; status: number; reason: string };

export function verifyDownloadParams(
  blobKey: string,
  expiresAtRaw: string,
  emailRaw: string,
  signature: string,
): VerifyResult {
  const email = (emailRaw || "").toLowerCase();
  if (!email) return { ok: false, status: 400, reason: "missing email" };
  const expiresAt = parseInt(expiresAtRaw, 10);
  if (!Number.isFinite(expiresAt)) {
    return { ok: false, status: 400, reason: "invalid expiry" };
  }
  if (expiresAt < Math.floor(Date.now() / 1000)) {
    return { ok: false, status: 410, reason: "link expired" };
  }
  const payload = buildPayload(blobKey, expiresAt, email);
  const expected = signPayload(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || "");
  if (a.length !== b.length) {
    return { ok: false, status: 403, reason: "invalid signature" };
  }
  if (!crypto.timingSafeEqual(a, b)) {
    return { ok: false, status: 403, reason: "invalid signature" };
  }
  return { ok: true, email };
}

export function canSignedInEmailAccess(
  signedInEmailRaw: string,
  urlEmail: string,
): boolean {
  const signedIn = (signedInEmailRaw || "").toLowerCase();
  if (!signedIn) return false;
  if (signedIn === urlEmail.toLowerCase()) return true;
  const adminEmail = getAdminEmail();
  if (signedIn === adminEmail) return true;
  return false;
}

export function isAdminEmailValue(email: string | null | undefined): boolean {
  if (!email) return false;
  try {
    return email.toLowerCase() === getAdminEmail();
  } catch {
    return false;
  }
}

export function validateSignedUrlConfig(): void {
  getSecret();
  getAdminEmail();
}

validateSignedUrlConfig();