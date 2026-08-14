import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { audioFile } from "@/db/schema";
import { signDownloadUrl } from "@/lib/signed-urls";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { fileId, kind } = await req.json().catch(() => ({} as any));
  if (!fileId || !kind) {
    return NextResponse.json({ error: "fileId and kind required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(audioFile)
    .where(eq(audioFile.id, fileId))
    .limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const r = rows[0];

  let blobId: string | null = null;
  if (kind === "original") {
    blobId = r.originalBlobId;
  } else if (kind === "converted") {
    blobId = r.convertedBlobId;
  } else if (kind === "cleaned") {
    if (!r.cleanedBlobId) {
      return NextResponse.json({ error: "no cleaned file yet" }, { status: 404 });
    }
    blobId = r.cleanedBlobId;
  } else {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  const blobKey = blobId.replace(/^[^/]+\//, "");

  const signed = signDownloadUrl({
    blobKey,
    email: session.user.email,
    ttlSeconds: 60 * 60,
  });
  return NextResponse.json({ url: signed.url, expiresAt: signed.expiresAt });
}
