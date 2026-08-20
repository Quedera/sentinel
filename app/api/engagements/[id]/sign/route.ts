import { NextResponse } from "next/server";
import { getEngagement } from "@/lib/mock-data";
import { canTransition } from "@/lib/api/contract";
import type { SignEngagementRequest, ApiResult, EngagementResponse } from "@/lib/api/contract";

// POST /api/engagements/[id]/sign
// Body: { agreed, signature }
// Auth: requires the consultant on the engagement (validated server-side)
// Side effect: transitions engagement VIEWED → SIGNED → CONFIRMED
// Audit: SIGNATURE_ATTEMPTED, SIGNED

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = (await request.json()) as SignEngagementRequest;

  // TODO Tier 2: resolve session from cookie via authProvider.resolveSession,
  //              verify the user owns this engagement, verify signature with
  //              the e-sig provider (DocuSign / Adobe Sign / etc.)

  const engagement = getEngagement(params.id);
  if (!engagement) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Engagement not found" } } satisfies ApiResult<never>,
      { status: 404 }
    );
  }

  if (!body.agreed || !body.signature) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_INPUT", message: "Agreement and signature are required" } } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  // Tier 1 mock: auto-advance from whatever state into CONFIRMED.
  // Tier 2 must enforce the state machine explicitly:
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

  // TODO Tier 2: replace mock update with Prisma transaction that:
  //   1. Updates engagement.status to SIGNED, sets signedAt
  //   2. Writes SIGNATURE_ATTEMPTED audit event
  //   3. Auto-advances to CONFIRMED (or waits for client confirm — depends on flow)
  //   4. Writes SIGNED + NOTIFICATION_SENT audit events
  //   5. Notifies both parties (email + in-app)

  const updated: EngagementResponse = {
    id: engagement.id,
    consultantId: engagement.consultantId,
    clientId: engagement.clientId,
    role: engagement.role,
    startDate: engagement.startDate,
    endDate: engagement.endDate,
    estimatedDays: engagement.estimatedDays,
    dayRate: engagement.dayRate,
    estimatedValue: engagement.estimatedValue,
    status: "CONFIRMED",
    signedAt: new Date().toISOString(),
    consultantDeadline: engagement.consultantDeadline,
  };

  return NextResponse.json({ ok: true, data: updated } satisfies ApiResult<EngagementResponse>);
}
