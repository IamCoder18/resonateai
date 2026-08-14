import { NextRequest, NextResponse } from "next/server";
import { desc, eq, lt, and, type SQL } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { audioFile } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = isAdminEmail(session.user.email);

  const url = new URL(req.url);
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT,
    MAX_LIMIT,
  );
  const cursor = url.searchParams.get("cursor");
  const cursorDate = cursor ? new Date(cursor) : null;
  const cursorValid = !!(cursorDate && !isNaN(cursorDate.getTime()));

  const baseSelect = {
    id: audioFile.id,
    userId: audioFile.userId,
    userEmail: audioFile.userEmail,
    userName: audioFile.userName,
    filename: audioFile.originalFilename,
    convertedFilename: audioFile.convertedFilename,
    mimeType: audioFile.originalMimeType,
    convertedMimeType: audioFile.convertedMimeType,
    sizeBytes: audioFile.originalSizeBytes,
    convertedSizeBytes: audioFile.convertedSizeBytes,
    cleanedFilename: audioFile.cleanedFilename,
    cleanedMimeType: audioFile.cleanedMimeType,
    cleanedSizeBytes: audioFile.cleanedSizeBytes,
    status: audioFile.status,
    uploadedAt: audioFile.uploadedAt,
    finishedAt: audioFile.finishedAt,
  };

  const conditions: SQL[] = [];
  if (!isAdmin) {
    conditions.push(eq(audioFile.userId, session.user.id));
  }
  if (cursorValid) {
    conditions.push(lt(audioFile.uploadedAt, cursorDate!));
  }

  const baseQuery = db.select(baseSelect).from(audioFile);
  const filtered = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
  const rows = await filtered.orderBy(desc(audioFile.uploadedAt)).limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1].uploadedAt : null;
  const files = page.map((r) => ({ ...r, adminCanDownload: isAdmin }));

  return NextResponse.json({ files, nextCursor, isAdmin });
}
