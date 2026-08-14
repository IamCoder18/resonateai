import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { audioFile } from "@/db/schema";
import { putObject, BLOB_BUCKET, deleteObject } from "@/lib/blob";
import { signDownloadUrl } from "@/lib/signed-urls";
import { sendFinishedNotification, FinishedFileEntry } from "@/lib/email";
import { isAdminEmail } from "@/lib/admin";
import { AUDIO_EXT, VIDEO_EXT } from "@/lib/convert";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILES = 10;
const MAX_BYTES = 500 * 1024 * 1024;
const CONCURRENCY = 3;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileIds = form
    .getAll("fileId")
    .map((v) => (typeof v === "string" ? v : ""))
    .filter(Boolean);
  const cleanedFiles = form
    .getAll("cleanedFile")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (fileIds.length === 0 || cleanedFiles.length === 0) {
    return NextResponse.json(
      { error: "fileId and cleanedFile are required" },
      { status: 400 },
    );
  }
  if (fileIds.length !== cleanedFiles.length) {
    return NextResponse.json(
      { error: "fileId/cleanedFile count mismatch" },
      { status: 400 },
    );
  }
  if (fileIds.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES})` },
      { status: 400 },
    );
  }

  interface Upsert {
    id: string;
    userEmail: string;
    userName: string;
    originalFilename: string;
    entry: FinishedFileEntry;
  }

  const upserts: Upsert[] = [];
  const errors: Array<{ fileId: string; error: string }> = [];

  const items = cleanedFiles.map((file, i) => ({ file, fileId: fileIds[i] }));
  await runWithConcurrency(items, CONCURRENCY, async ({ file, fileId }) => {
    try {
      if (file.size > MAX_BYTES) {
        errors.push({ fileId, error: `${file.name} exceeds 500 MB` });
        return;
      }
      const ext = (file.name.split(".").pop() || "mp3").toLowerCase();
      if (!isSupportedCleaned(ext, file.type || "")) {
        errors.push({ fileId, error: `${file.name}: unsupported format` });
        return;
      }

      const existing = await db
        .select()
        .from(audioFile)
        .where(eq(audioFile.id, fileId))
        .limit(1);
      if (existing.length === 0) {
        errors.push({ fileId, error: `submission ${fileId} not found` });
        return;
      }
      const record = existing[0];

      const existingCleanedKey = record.cleanedBlobId
        ? record.cleanedBlobId.replace(/^[^/]+\//, "")
        : null;

      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const cleanedKey = `${record.userId}/${record.id}/cleaned_${safeName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await putObject(cleanedKey, buffer, file.type || "application/octet-stream");

      const signed = signDownloadUrl({
        blobKey: cleanedKey,
        email: record.userEmail,
      });

      const now = new Date();
      await db
        .update(audioFile)
        .set({
          cleanedFilename: file.name,
          cleanedMimeType: file.type || "application/octet-stream",
          cleanedSizeBytes: buffer.length,
          cleanedBlobId: `${BLOB_BUCKET}/${cleanedKey}`,
          status: "ready",
          finishedAt: now,
        })
        .where(eq(audioFile.id, record.id));

      if (existingCleanedKey && existingCleanedKey !== cleanedKey) {
        deleteObject(existingCleanedKey).catch((err) =>
          console.error("[admin/finish] orphan cleaned blob delete failed", err),
        );
      }

      upserts.push({
        id: record.id,
        userEmail: record.userEmail,
        userName: record.userName,
        originalFilename: record.originalFilename,
        entry: {
          filename: record.originalFilename,
          cleanedFilename: file.name,
          cleanedSizeBytes: buffer.length,
          downloadUrl: signed.url,
          downloadExpiresAt: signed.expiresAt,
        },
      });
    } catch (err) {
      console.error("[admin/finish] item failed", fileId, err);
      errors.push({
        fileId,
        error: err instanceof Error ? err.message : "failed",
      });
    }
  });

  const grouped = new Map<string, FinishedFileEntry[]>();
  const groupedMeta = new Map<string, { userEmail: string; userName: string }>();
  for (const u of upserts) {
    if (!grouped.has(u.userEmail)) {
      grouped.set(u.userEmail, []);
      groupedMeta.set(u.userEmail, { userEmail: u.userEmail, userName: u.userName });
    }
    grouped.get(u.userEmail)!.push(u.entry);
  }

  const results: Array<{ userEmail: string; ok: boolean; error?: string }> = [];
  const emailSuccessIds: string[] = [];
  for (const [email, entries] of grouped) {
    const meta = groupedMeta.get(email)!;
    try {
      await sendFinishedNotification({
        userEmail: email,
        userName: meta.userName,
        count: entries.length,
        files: entries,
      });
      results.push({ userEmail: email, ok: true });
      for (const u of upserts) {
        if (u.userEmail === email) emailSuccessIds.push(u.id);
      }
    } catch (err) {
      console.error("[admin/finish] email send failed", err);
      results.push({
        userEmail: email,
        ok: false,
        error: "email send failed",
      });
    }
  }

  if (emailSuccessIds.length > 0) {
    try {
      await db
        .update(audioFile)
        .set({ emailSentAt: new Date() })
        .where(inArray(audioFile.id, emailSuccessIds));
    } catch (err) {
      console.error("[admin/finish] emailSentAt update failed", err);
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    finished: upserts.length,
    errors,
    emails: results,
  });
}

function isSupportedCleaned(ext: string, mimeType: string): boolean {
  if (AUDIO_EXT.has(ext) || VIDEO_EXT.has(ext)) return true;
  if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) return true;
  return false;
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = items.slice();
  const runners: Promise<void>[] = [];
  for (let i = 0; i < Math.min(limit, queue.length); i++) {
    runners.push(
      (async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) return;
          await worker(next);
        }
      })(),
    );
  }
  await Promise.all(runners);
}
