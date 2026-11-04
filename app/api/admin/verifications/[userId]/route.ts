import { NextResponse } from "next/server";
import { authProvider } from "@/lib/auth";
import { decideVerification } from "@/lib/verification";
import type { ApiResult } from "@/lib/api/contract";

/**
 * POST /api/admin/verifications/[userId]
 *
 * Decision #3 — Sentinel Service Confirmation.
 *
 * Body: { action: "grant" | "reject", notes?: string }
 *
 * The decision logic lives in lib/verification.ts and is shared with the
 * admin page's server action, so the API and the UI cannot drift apart.
 */
export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await authProvider.resolveSession(extractToken(request));
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      } satisfies ApiResult<never>,
      { status: 401 }
    );
  }

  if (session.role !== "ADMIN") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "FORBIDDEN", message: "Administrator access required" },
      } satisfies ApiResult<never>,
      { status: 403 }
    );
  }

  let body: { action?: "grant" | "reject"; notes?: string };
  try {
    body = (await request.json()) as { action?: "grant" | "reject"; notes?: string };
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Invalid JSON body" },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  if (body.action !== "grant" && body.action !== "reject") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "action must be 'grant' or 'reject'",
        },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  const result = await decideVerification(
    session.id,
    params.userId,
    body.action,
    body.notes
  );

  if (!result.ok) {
    const status =
      result.error.code === "NOT_FOUND" ? 404 : result.error.code === "INVALID_STATE" ? 409 : 400;
    return NextResponse.json(
      { ok: false, error: result.error } satisfies ApiResult<never>,
      { status }
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}

function extractToken(request: Request): string | undefined {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const cookie = request.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}
