import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    return NextResponse.json(
      { status: "degraded", error: "database unavailable" },
      { status: 503 },
    );
  }
  return NextResponse.json({ status: "ok" });
}
