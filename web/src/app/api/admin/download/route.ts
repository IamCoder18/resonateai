import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadParams, canSignedInEmailAccess } from "@/lib/signed-urls";
import { getObject } from "@/lib/blob";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const exp = url.searchParams.get("exp");
  const email = url.searchParams.get("email");
  const sig = url.searchParams.get("sig");

  const session = await getSession();
  const signedInEmail = session?.user?.email || "";

  if (!signedInEmail) {
    const publicOrigin = (
      process.env.PUBLIC_BASE_URL ||
      process.env.BETTER_AUTH_URL ||
      url.origin
    ).replace(/\/$/, "");
    const signIn = new URL("/sign-in", publicOrigin);
    signIn.searchParams.set("next", url.pathname + url.search);
    return NextResponse.redirect(signIn, { status: 302 });
  }

  if (!key || !exp || !email || !sig) {
    return NextResponse.json(
      { error: "missing parameters" },
      { status: 400 },
    );
  }

  const result = verifyDownloadParams(key, exp, email, sig);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: result.status },
    );
  }

  if (!canSignedInEmailAccess(signedInEmail, result.email)) {
    return NextResponse.json(
      { error: "forbidden: signed-in email is not authorized for this link" },
      { status: 403 },
    );
  }

  let object;
  try {
    object = await getObject(key);
  } catch (err) {
    console.error("[admin/download] blob fetch failed", err);
    return NextResponse.json(
      { error: "storage unavailable" },
      { status: 502 },
    );
  }

  if (!object) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const filename = key.split("/").pop() || "download";

  const headers = new Headers();
  headers.set("Content-Type", object.contentType || "application/octet-stream");
  if (object.size > 0) headers.set("Content-Length", String(object.size));
  headers.set(
    "Content-Disposition",
    `attachment; filename="${filename.replace(/"/g, "")}"`,
  );
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(object.body as unknown as ReadableStream<Uint8Array>, { status: 200, headers });
}
