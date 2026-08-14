import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { audioFile } from "@/db/schema";
import { signDownloadUrl } from "@/lib/signed-urls";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await ctx.params;
  const fileId = params.id;
  if (!fileId) {
    return NextResponse.json({ error: "file id required" }, { status: 400 });
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

  if (r.userId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!r.cleanedBlobId) {
    return NextResponse.json({ error: "no cleaned file yet" }, { status: 404 });
  }

  const blobKey = r.cleanedBlobId.replace(/^[^/]+\//, "");
  const signed = signDownloadUrl({
    blobKey,
    email: session.user.email,
  });
  return NextResponse.json({ url: signed.url, expiresAt: signed.expiresAt });
}
