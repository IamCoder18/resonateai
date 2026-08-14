#!/usr/bin/env node
// Bootstraps Garage: assigns layout, creates the bucket, creates an access key.
// Idempotent — re-running it leaves an existing layout/bucket in place.
// Credentials are persisted to $SHARED_DIR/garage.env on first creation so
// subsequent runs (or web restarts) reuse the same access key.

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const SHARED_DIR = process.env.SHARED_DIR || "/shared";
const CRED_FILE = `${SHARED_DIR}/garage.env`;
const BUCKET = process.env.BUCKET || "audio";
const KEY_NAME = process.env.KEY_NAME || "resonateai-web";
const ZONE = process.env.ZONE || "dc1";
const CAPACITY = parseInt(process.env.CAPACITY || "1000000", 10);
const ADMIN_BASE = "http://garage:3903";
const TOKEN = process.env.GARAGE_ADMIN_TOKEN;
if (!TOKEN) {
  console.error("GARAGE_ADMIN_TOKEN env var is required");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function call(method, path, body) {
  const res = await fetch(`${ADMIN_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(
      `garage admin ${method} ${path} -> ${res.status}: ${text}`,
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function waitForReady() {
  for (let i = 0; i < 60; i++) {
    try {
      await call("GET", "/health");
      return;
    } catch {}
    await sleep(1000);
  }
  throw new Error("garage admin API did not become ready");
}

async function getNodeId() {
  const status = await call("GET", "/v1/status");
  if (!status?.node) {
    throw new Error("could not read node id from /v1/status");
  }
  return status.node;
}

async function ensureLayout(nodeId) {
  const layout = await call("GET", "/v1/layout");
  if (layout?.roles?.some((r) => r.id === nodeId)) {
    console.log(
      `[init] layout already configured (version ${layout.version}); skipping assign`,
    );
    return;
  }
  console.log(
    `[init] assigning layout: node=${nodeId} zone=${ZONE} capacity=${CAPACITY}`,
  );
  const staged = await call("POST", "/v1/layout", [
    {
      id: nodeId,
      zone: ZONE,
      capacity: CAPACITY,
      tags: [],
    },
  ]);
  const nextVersion = (layout?.version || 0) + 1;
  await call("POST", "/v1/layout/apply", { version: nextVersion });
  console.log(
    `[init] layout applied (now version ${staged.version || nextVersion})`,
  );
}

async function ensureBucket() {
  const list = await call("GET", "/v1/bucket");
  const existing = (Array.isArray(list) ? list : []).find((b) =>
    b.globalAliases?.includes(BUCKET),
  );
  if (existing) {
    console.log(`[init] bucket exists: ${BUCKET} (${existing.id})`);
    return existing.id;
  }
  console.log(`[init] creating bucket: ${BUCKET}`);
  const created = await call("POST", "/v1/bucket", { globalAlias: BUCKET });
  console.log(`[init] bucket created: ${created.id}`);
  return created.id;
}

async function findBucketId() {
  const list = await call("GET", "/v1/bucket");
  const existing = (Array.isArray(list) ? list : []).find((b) =>
    b.globalAliases?.includes(BUCKET),
  );
  return existing?.id || null;
}

async function findKeyByName() {
  const list = await call("GET", "/v1/key");
  const items = Array.isArray(list) ? list : list?.keys || [];
  return items.find((k) => k.name === KEY_NAME) || null;
}

async function ensureKeyAndCredentials() {
  mkdirSync(SHARED_DIR, { recursive: true });
  if (existsSync(CRED_FILE)) {
    console.log(`[init] credentials file present at ${CRED_FILE}; reusing`);
    return;
  }
  const existing = await findKeyByName();
  let accessKeyId, secretAccessKey;
  if (existing?.accessKeyId) {
    console.log(
      `[init] key "${KEY_NAME}" already exists as ${existing.accessKeyId}; secret is not retrievable`,
    );
    console.log(
      "[init] deleting existing key and creating a fresh one so we can capture the secret",
    );
    await call("DELETE", `/v1/key?id=${encodeURIComponent(existing.accessKeyId)}`);
  }
  const created = await call("POST", "/v1/key", { name: KEY_NAME });
  accessKeyId = created.accessKeyId;
  secretAccessKey = created.secretAccessKey;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("failed to obtain S3 credentials from /v1/key response");
  }
  const payload = [
    `S3_ENDPOINT=http://garage:3900`,
    `S3_REGION=garage`,
    `S3_BUCKET=${BUCKET}`,
    `S3_ACCESS_KEY=${accessKeyId}`,
    `S3_SECRET_KEY=${secretAccessKey}`,
    `S3_FORCE_PATH_STYLE=true`,
    ``,
  ].join("\n");
  writeFileSync(CRED_FILE, payload, { mode: 0o644 });
  console.log(`[init] wrote credentials to ${CRED_FILE}`);
}

async function allowKeyOnBucket(bucketId) {
  const creds = parseCredFile();
  if (!creds) {
    console.log("[init] no credentials yet; skipping bucket allow");
    return;
  }
  const bucketInfo = await call("GET", `/v1/bucket?id=${encodeURIComponent(bucketId)}`);
  const already = bucketInfo?.keys?.some(
    (k) => k.accessKeyId === creds.S3_ACCESS_KEY,
  );
  if (already) {
    console.log("[init] key already allowed on bucket");
    return;
  }
  await call("POST", "/v1/bucket/allow", {
    bucketId,
    accessKeyId: creds.S3_ACCESS_KEY,
    permissions: { read: true, write: true, owner: true },
  });
  console.log("[init] key allowed on bucket");
}

function parseCredFile() {
  if (!existsSync(CRED_FILE)) return null;
  const out = {};
  for (const line of readFileSync(CRED_FILE, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function main() {
  await waitForReady();
  const nodeId = await getNodeId();
  await ensureLayout(nodeId);
  await ensureKeyAndCredentials();
  const bucketId = (await findBucketId()) || (await ensureBucket());
  await allowKeyOnBucket(bucketId);
  console.log("[init] garage bootstrap complete");
}

main().catch((err) => {
  console.error("[init] failed:", err);
  process.exit(1);
});
