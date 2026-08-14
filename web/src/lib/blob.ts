import { Readable } from "node:stream";
import { readFileSync, existsSync } from "node:fs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

function loadCredentialsFile() {
  const file = process.env.S3_CREDENTIALS_FILE;
  if (!file || !existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadCredentialsFile();

function getConfig() {
  const endpoint = process.env.S3_ENDPOINT || "http://localhost:3900";
  const region = process.env.S3_REGION || "garage";
  const bucket = process.env.S3_BUCKET || "audio";
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY are required",
    );
  }
  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}

let cached: { client: S3Client; bucket: string } | null = null;

function client(): { client: S3Client; bucket: string } {
  if (cached) return cached;
  const cfg = getConfig();
  cached = {
    bucket: cfg.bucket,
    client: new S3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    }),
  };
  return cached;
}

export const BLOB_BUCKET = process.env.S3_BUCKET || "audio";

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<{ bucket: string; key: string; size: number }> {
  const c = client();
  await c.client.send(
    new PutObjectCommand({
      Bucket: c.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { bucket: c.bucket, key, size: body.length };
}

export async function putObjectStream(
  key: string,
  stream: Readable,
  contentType: string,
  size: number,
): Promise<{ bucket: string; key: string; size: number }> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buf =
      typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk);
    chunks.push(buf);
    total += buf.length;
  }
  const body = Buffer.concat(chunks, total);
  const c = client();
  await c.client.send(
    new PutObjectCommand({
      Bucket: c.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: size,
    }),
  );
  return { bucket: c.bucket, key, size };
}

export interface StoredObject {
  body: Readable;
  contentType: string;
  size: number;
}

export async function getObject(key: string): Promise<StoredObject | null> {
  const c = client();
  try {
    const res = await c.client.send(
      new GetObjectCommand({ Bucket: c.bucket, Key: key }),
    );
    if (!res.Body) {
      throw new Error("S3 get returned empty body");
    }
    const body = res.Body as unknown as Readable;
    return {
      body,
      contentType: res.ContentType || "application/octet-stream",
      size: res.ContentLength ?? 0,
    };
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw err;
  }
}

export async function objectExists(key: string): Promise<boolean> {
  const c = client();
  try {
    await c.client.send(new HeadObjectCommand({ Bucket: c.bucket, Key: key }));
    return true;
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    if (status === 404) return false;
    throw err;
  }
}

export async function deleteObject(key: string): Promise<boolean> {
  const c = client();
  try {
    await c.client.send(new DeleteObjectCommand({ Bucket: c.bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}
