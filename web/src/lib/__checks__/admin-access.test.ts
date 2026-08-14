process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-32";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

import {
  signDownloadUrl,
  verifyDownloadParams,
  canSignedInEmailAccess,
  getAdminEmail,
} from "../signed-urls";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error("assertion failed: " + msg);
}

const admin = getAdminEmail();
assert(admin === "admin@example.com", "admin email lowercased");

const userEmail = "user@example.com";
const operatorEmail = "ops@example.com";

const linkForUser = signDownloadUrl({ blobKey: "u/abc/cleaned.mp3", email: userEmail });
const linkForOps = signDownloadUrl({ blobKey: "u/abc/original.wav", email: operatorEmail });
const linkForAdmin = signDownloadUrl({ blobKey: "u/abc/converted.mp3", email: admin });

function parsed(url: string) {
  const qs = new URL(url).searchParams;
  return {
    key: qs.get("key")!,
    exp: qs.get("exp")!,
    email: qs.get("email")!,
    sig: qs.get("sig")!,
  };
}

const userParams = parsed(linkForUser.url);
const opsParams = parsed(linkForOps.url);
const adminParams = parsed(linkForAdmin.url);

assert(verifyDownloadParams(userParams.key, userParams.exp, userParams.email, userParams.sig).ok, "user link verifies");
assert(verifyDownloadParams(opsParams.key, opsParams.exp, opsParams.email, opsParams.sig).ok, "ops link verifies");
assert(verifyDownloadParams(adminParams.key, adminParams.exp, adminParams.email, adminParams.sig).ok, "admin link verifies");

assert(canSignedInEmailAccess(admin, userEmail), "admin can access user-bound link");
assert(canSignedInEmailAccess(admin, operatorEmail), "admin can access ops-bound link");
assert(canSignedInEmailAccess(admin, admin), "admin can access admin-bound link");
assert(canSignedInEmailAccess(userEmail, userEmail), "user can access own link");
assert(!canSignedInEmailAccess(userEmail, operatorEmail), "user cannot access ops link");
assert(!canSignedInEmailAccess("", userEmail), "empty email cannot access anything");

console.log("OK: admin can access every signed download link flavor");
