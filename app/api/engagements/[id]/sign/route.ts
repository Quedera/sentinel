import { NextResponse } from "next/server";
import type { EngagementStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authProvider } from "@/lib/auth";
import { canTransition } from "@/lib/api/contract";
import type {
  SignEngagementRequest,
  ApiResult,
  EngagementResponse,
} from "@/lib/api/contract";

// POST /api/engagements/[id]/sign
// Auth: requires the consultant on the engagement (validated server-side)
//
// Behaviour by provider:
//   EIG_PROVIDER=mock (default):
//     Body: { agreed: true, signature: string }
//     Side effect: atomic transaction — transitions VIEWED → SIGNED → CONFIRMED
//     Audit: SIGNATURE_ATTEMPTED + SIGNED + NOTIFICATION_SENT
//
//   EIG_PROVIDER=docusign:
//     Side effect: none (returns 202)
//     Real signing happens via DocuSign UI + webhook callback at /api/webhooks/docusign

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Resolve session token from cookie or Authorization header
  const token = extractToken(request);
  const session = await authProvider.resolveSession(token);
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      } satisfies ApiResult<never>,
      { status: 401 }
    );
  }

  // 2. Load engagement with relations (consultant + client users for auth check)
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

  // 3. Verify the caller is the consultant on this engagement
  if (engagement.consultant.userId !== session.id) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Only the consultant on this engagement can sign",
        },
      } satisfies ApiResult<never>,
      { status: 403 }
    );
  }

  // 4. DocuSign path — signing happens via DocuSign UI + webhook
  if (process.env.EIG_PROVIDER === "docusign") {
    return NextResponse.json(
      {
        ok: true,
        data: {
          message:
            "Signing happens via DocuSign. Check the email we sent — the state machine updates on webhook callback.",
          status: engagement.status as EngagementStatus,
        },
      } satisfies ApiResult<{
        message: string;
        status: EngagementStatus;
      }>,
      { status: 202 }
    );
  }

  // 5. Mock path — typed-name flow
  const body = (await request.json()) as SignEngagementRequest;
  if (!body.agreed || !body.signature) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_INPUT",
          message: "Agreement and signature are required",
        },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  if (!canTransition(engagement.status, "SIGNED")) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_STATE",
          message: `Cannot sign from state ${engagement.status}`,
        },
      } satisfies ApiResult<never>,
      { status: 409 }
    );
  }

  // 6. Atomic transaction: state transition + audit events
  const updated = await prisma.$transaction(async (tx) => {
    const eng = await tx.engagement.update({
      where: { id: params.id },
      data: {
        status: "CONFIRMED", // mock auto-advances SIGNED → CONFIRMED
        signedAt: new Date(),
      },
    });
    await tx.auditEvent.createMany({
      data: [
        {
          actorId: session.id,
          engagementId: eng.id,
          action: "SIGNATURE_ATTEMPTED",
          resourceType: "engagement",
          resourceId: eng.id,
          details: `signature=${body.signature}`,
        },
        {
          actorId: session.id,
          engagementId: eng.id,
          action: "SIGNED",
          resourceType: "engagement",
          resourceId: eng.id,
        },
        {
          actorId: session.id,
          engagementId: eng.id,
          action: "NOTIFICATION_SENT",
          resourceType: "engagement",
          resourceId: eng.id,
          details: "notified both parties (mock)",
        },
      ],
    });
    return eng;
  });

  const response: EngagementResponse = {
    id: updated.id,
    consultantId: updated.consultantId,
    clientId: updated.clientId,
    role: updated.role,
    startDate: updated.startDate.toISOString().split("T")[0],
    endDate: updated.endDate.toISOString().split("T")[0],
    estimatedDays: updated.estimatedDays,
    dayRate: updated.dayRate,
    estimatedValue: updated.estimatedValue,
    status: updated.status as EngagementStatus,
    signedAt: updated.signedAt?.toISOString(),
    declinedAt: updated.declinedAt?.toISOString(),
    expiredAt: updated.expiredAt?.toISOString(),
    consultantDeadline: updated.consultantDeadline?.toISOString(),
  };

  return NextResponse.json(
    { ok: true, data: response } satisfies ApiResult<EngagementResponse>
  );
}

/** Extract the session token from cookie or Authorization header. */
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
