import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authProvider } from "@/lib/auth";
import { notifyUser } from "@/lib/notify/events";
import { engagementTerminated } from "@/lib/notify/templates";
import { calculateTermination, sideForUser } from "@/lib/termination";
import { canTransition } from "@/lib/api/contract";
import type {
  ApiResult,
  EngagementResponse,
  TerminateEngagementRequest,
  TerminateEngagementResponse,
} from "@/lib/api/contract";

/**
 * POST /api/engagements/[id]/terminate
 *
 * Decision #5 (locked 2026-10-18): "Contracts termination penalty both sides."
 *
 * The penalty is symmetric — it does not matter which party walks away, the
 * same rule applies. The initiating party is charged a percentage of the
 * value of work NOT yet delivered.
 *
 * An engagement can only be terminated once it is contractual (CONFIRMED or
 * ACTIVE). Before that it can still be declined or allowed to expire, which
 * carry no penalty.
 *
 * Admin-initiated terminations must state which side is terminating, since
 * the penalty is charged to that side.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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

  let body: TerminateEngagementRequest & { side?: "CLIENT" | "CONSULTANT" };
  try {
    body = (await request.json()) as TerminateEngagementRequest & {
      side?: "CLIENT" | "CONSULTANT";
    };
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Invalid JSON body" },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  const reason = (body.reason ?? "").trim();
  if (!reason) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "A termination reason is required" },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: params.id },
    include: {
      consultant: { include: { user: true } },
      client: { include: { user: true } },
    },
  });
  if (!engagement) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "NOT_FOUND", message: "Engagement not found" },
      } satisfies ApiResult<never>,
      { status: 404 }
    );
  }

  // Which side is terminating.
  let side = sideForUser(session.id, engagement);
  if (session.role === "ADMIN" && !side) {
    side = body.side ?? null;
  }
  if (!side) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message:
            session.role === "ADMIN"
              ? "Admin terminations must specify which side is terminating"
              : "Only a party to this engagement may terminate it",
        },
      } satisfies ApiResult<never>,
      { status: 403 }
    );
  }

  if (!canTransition(engagement.status, "TERMINATED")) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_STATE",
          message: "Cannot terminate an engagement in state " + engagement.status,
        },
      } satisfies ApiResult<never>,
      { status: 409 }
    );
  }

  // Days elapsed since the engagement start (inclusive).
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const daysElapsed = Math.max(
    0,
    Math.ceil((Date.now() - engagement.startDate.getTime()) / MS_PER_DAY)
  );

  const calc = calculateTermination({
    dayRatePence: engagement.dayRate * 100, // pounds -> pence
    estimatedDays: engagement.estimatedDays,
    daysElapsed,
    side,
    gaveNotice: Boolean(body.gaveNotice),
  });

  const updated = await prisma.$transaction(async (tx) => {
    const eng = await tx.engagement.update({
      where: { id: engagement.id },
      data: {
        status: "TERMINATED",
        terminatedAt: calc.effectiveDate,
        terminationReason: reason,
        terminationPenalty: calc.penaltyPence,
      },
    });

    await tx.termination.create({
      data: {
        engagementId: engagement.id,
        initiatedById: session.id,
        side,
        reason,
        penalty: calc.penaltyPence,
        effectiveDate: calc.effectiveDate,
      },
    });

    await tx.auditEvent.createMany({
      data: [
        {
          actorId: session.id,
          engagementId: engagement.id,
          action: "ENGAGEMENT_TERMINATED",
          resourceType: "engagement",
          resourceId: engagement.id,
          details:
            "side=" +
            side +
            ";reason=" +
            reason +
            ";noticeDays=" +
            calc.noticeDays +
            ";effective=" +
            calc.effectiveDate.toISOString(),
        },
        {
          actorId: session.id,
          engagementId: engagement.id,
          action: "TERMINATION_PENALTY_APPLIED",
          resourceType: "engagement",
          resourceId: engagement.id,
          details:
            "penalty=" +
            calc.penaltyPence +
            "p;remainingValue=" +
            calc.remainingValuePence +
            "p;contractValue=" +
            calc.contractValuePence +
            "p",
        },
      ],
    });

    return eng;
  });

  // Both parties are told.
  await notifyUser(session.id, engagement.consultant.user, (name) =>
    engagementTerminated(name, engagement.role, reason, calc.penaltyPence, calc.effectiveDate.toISOString())
  );
  await notifyUser(session.id, engagement.client.user, (name) =>
    engagementTerminated(name, engagement.role, reason, calc.penaltyPence, calc.effectiveDate.toISOString())
  );

  const data: TerminateEngagementResponse = {
    engagementId: updated.id,
    status: updated.status as EngagementResponse["status"],
    side,
    penalty: updated.terminationPenalty,
    effectiveDate: (updated.terminatedAt ?? calc.effectiveDate).toISOString(),
    noticeDays: calc.noticeDays,
  };

  return NextResponse.json(
    { ok: true, data } satisfies ApiResult<TerminateEngagementResponse>
  );
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
