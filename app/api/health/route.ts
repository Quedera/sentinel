import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/health
//
// Liveness + readiness for the container healthcheck. Reports whether the
// app is up AND whether the database is reachable, because "the process is
// running" and "the app can actually serve data" are different things.
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let database: "up" | "down" = "down";

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    database = "up";
  } catch {
    database = "down";
  }

  const healthy = database === "up";

  return NextResponse.json(
    {
      ok: healthy,
      service: "sentinel",
      database,
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
