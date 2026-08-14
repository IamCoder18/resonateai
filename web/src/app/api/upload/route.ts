import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/session";
import { putObject, putObjectStream, BLOB_BUCKET } from "@/lib/blob";
import { db } from "@/db";
import { audioFile } from "@/db/schema";
import { sendUploadNotification, UploadFileEntry } from "@/lib/email";
import {
  convertToMp3,
  isSupported,
  checkInputSize,
  cleanupConversion,
} from "@/lib/convert";
import { signDownloadUrl } from "@/lib/signed-urls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILES = 25;
const CONCURRENCY = 3;

interface FileResult {
  id: string;
  originalFilename: string;
  convertedFilename: string;
  originalSizeBytes: number;
  convertedSizeBytes: number;
  status: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES} at once)` },
      { status: 400 },
    );
  }

  const recipientEmail =
    (process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "").toLowerCase();
  if (!recipientEmail) {
    return NextResponse.json(
      { error: "Server is not configured with NOTIFY_EMAIL/ADMIN_EMAIL" },
      { status: 500 },
    );
  }

  const items = files.map((file) => ({ file }));
  const processed: Array<{
    result: FileResult;
    cleanup: () => Promise<void>;
    emailEntry?: UploadFileEntry;
  }> = [];

  await runWithConcurrency(items, CONCURRENCY, async (item) => {
    const { file } = item;
    try {
      checkInputSize(file.size);
      if (!isSupported(file.name, file.type || "")) {
        processed.push({
          result: {
            id: "",
            originalFilename: file.name,
            convertedFilename: "",
            originalSizeBytes: file.size,
            convertedSizeBytes: 0,
            status: "rejected",
            error: "Unsupported format",
          },
          cleanup: async () => {},
        });
        return;
      }

      const id = randomUUID();
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const originalKey = `${session.user.id}/${id}/original_${safeName}`;
      const convertedKey = `${session.user.id}/${id}/converted.mp3`;

      const arrayBuffer = await file.arrayBuffer();
      const originalBuffer = Buffer.from(arrayBuffer);

      const converted = await convertToMp3(
        originalBuffer,
        file.name,
        file.type || "application/octet-stream",
      );

      await putObject(
        originalKey,
        originalBuffer,
        file.type || "application/octet-stream",
      );
      await putObjectStream(
        convertedKey,
        createReadStream(converted.outputPath),
        "audio/mpeg",
        converted.size,
      );

      const record = {
        id,
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name || session.user.email,
        originalFilename: file.name,
        originalMimeType: file.type || "application/octet-stream",
        originalSizeBytes: file.size,
        originalBlobId: `${BLOB_BUCKET}/${originalKey}`,
        convertedFilename: converted.filename,
        convertedMimeType: "audio/mpeg",
        convertedSizeBytes: converted.size,
        convertedBlobId: `${BLOB_BUCKET}/${convertedKey}`,
        status: "processing" as const,
      };

      try {
        await db.insert(audioFile).values(record);
      } catch (dbErr) {
        await Promise.allSettled([
          deleteObjectSafe(originalKey),
          deleteObjectSafe(convertedKey),
        ]);
        throw dbErr;
      }

      const mp3Signed = signDownloadUrl({
        blobKey: convertedKey,
        email: recipientEmail,
      });
      const origSigned = signDownloadUrl({
        blobKey: originalKey,
        email: recipientEmail,
      });

      processed.push({
        result: {
          id,
          originalFilename: record.originalFilename,
          convertedFilename: record.convertedFilename,
          originalSizeBytes: record.originalSizeBytes,
          convertedSizeBytes: record.convertedSizeBytes,
          status: record.status,
        },
        cleanup: async () => {
          await cleanupConversion(converted);
        },
        emailEntry: {
          filename: file.name,
          convertedFilename: converted.filename,
          originalSizeBytes: file.size,
          convertedSizeBytes: converted.size,
          originalBlobKey: originalKey,
          convertedBlobKey: convertedKey,
          downloadUrl: mp3Signed.url,
          originalDownloadUrl: origSigned.url,
          downloadExpiresAt: mp3Signed.expiresAt,
        },
      });
    } catch (err) {
      console.error("[upload] file failed", file.name, err);
      processed.push({
        result: {
          id: "",
          originalFilename: file.name,
          convertedFilename: "",
          originalSizeBytes: file.size,
          convertedSizeBytes: 0,
          status: "failed",
          error: "Conversion failed",
        },
        cleanup: async () => {},
      });
    }
  });

  const results = processed.map((p) => p.result);
  const emailEntries: UploadFileEntry[] = processed
    .map((p) => p.emailEntry)
    .filter((e): e is UploadFileEntry => !!e);

  await Promise.allSettled(processed.map((p) => p.cleanup()));

  const successCount = emailEntries.length;
  if (successCount > 0) {
    try {
      await sendUploadNotification({
        userEmail: session.user.email,
        userName: session.user.name || session.user.email,
        count: successCount,
        files: emailEntries,
      });
    } catch (err) {
      console.error("[upload] email send failed", err);
    }
  }

  return NextResponse.json({
    success: true,
    count: successCount,
    total: files.length,
    files: results,
  });
}

async function deleteObjectSafe(key: string) {
  const { deleteObject } = await import("@/lib/blob");
  return deleteObject(key).catch(() => false);
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
