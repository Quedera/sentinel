import { NextResponse } from "next/server";
import type { AuditAction, EngagementStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { eigProvider } from "@/lib/eig";
import { canTransition } from "@/lib/api/contract";
import type { ApiResult } from "@/lib/api/contract";

// POST /api/webhooks/docusign
//
// DocuSign Connect webhook handler. Verifies HMAC signature (if configured
// via DOCUSIGN_WEBHOOK_HMAC_KEY), parses the event, looks up the
// engagement by the `engagement_id` custom field, and transitions state.
//
// Event → Status mapping (per wireframe brief §15):
//   delivered → VIEWED     (consultant opened the envelope)
//   completed → SIGNED     (consultant signed)
//   declined → DECLINED
//   voided    → DECLINED   (treat same as declined; reason captured in audit)
//   sent      → (ignored — already AWAITING_CONSULTANT after send-for-signing)
//
// Configure DocuSign Connect to POST JSON to this URL.

export async function POST(request: Request) {
  // 1. Read raw body (HMAC verification needs the exact bytes)
  const rawBody = await request.text();
  const signature = request.headers.get("X-DocuSign-Signature-1") ?? "";

  // 2. Verify + parse via the EigProvider
  const event = eigProvider.verifyAndParseWebhook(rawBody, signature);
  if (!event) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_SIGNATURE",
          message: "Webhook signature verification failed",
        },
      } satisfies ApiResult<never>,
      { status: 401 }
    );
  }

  // 3. Look up engagement by custom field 'engagement_id'
  const engagementId = event.metadata?.engagement_id;
  if (!engagementId) {
    return NextResponse.json(
      {
        ok: true,
        data: { ignored: true, reason: "no engagement_id in webhook metadata" },
      } satisfies ApiResult<{ ignored: boolean; reason: string }>
    );
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
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

  // 4. Map DocuSign event to our state machine
  const targetStatus = mapEventToStatus(event.event);
  const targetAction = mapEventToAuditAction(event.event);
  if (!targetStatus || !targetAction) {
    return NextResponse.json(
      {
        ok: true,
        data: { ignored: true, reason: `event '${event.event}' has no state mapping` },
      } satisfies ApiResult<{ ignored: boolean; reason: string }>
    );
  }

  // 5. Validate transition
  if (!canTransition(engagement.status, targetStatus)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_STATE",
          message: `Cannot transition from ${engagement.status} to ${targetStatus}`,
        },
      } satisfies ApiResult<never>,
      { status: 409 }
    );
  }

  // 6. Atomic transaction: state transition + audit
  const now = event.timestamp ?? new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const eng = await tx.engagement.update({
      where: { id: engagementId },
      data: {
        status: targetStatus,
        ...(targetStatus === "SIGNED" && { signedAt: now }),
        ...(targetStatus === "DECLINED" && { declinedAt: now }),
      },
    });
    await tx.auditEvent.create({
      data: {
        // Actor is the consultant whose envelope this is — DocuSign
        // doesn't tell us who triggered the event, but we have the
        // consultant userId from the engagement. For more precise
        // attribution we'd add a system user (DOCUSIGN_SERVICE_USER_ID).
        actorId: engagement.consultantId,
        engagementId: eng.id,
        action: targetAction,
        resourceType: "engagement",
        resourceId: eng.id,
        details: `envelopeId=${event.envelopeId}; signerEmail=${event.signerEmail ?? "n/a"}`,
      },
    });
    return eng;
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        engagementId: updated.id,
        newStatus: updated.status as EngagementStatus,
      },
    } satisfies ApiResult<{
      engagementId: string;
      newStatus: EngagementStatus;
    }>
  );
}

function mapEventToStatus(
  event: string
): EngagementStatus | null {
  switch (event) {
    case "delivered":
      return "VIEWED";
    case "completed":
      return "SIGNED";
    case "declined":
    case "voided":
      return "DECLINED";
    default:
      return null;
  }
}

function mapEventToAuditAction(event: string): AuditAction | null {
  switch (event) {
    case "delivered":
      return "CONTRACT_VIEWED";
    case "completed":
      return "SIGNED";
    case "declined":
      return "DECLINED";
    case "voided":
      return "ENGAGEMENT_EXPIRED"; // closest match; consider adding ENVELOPE_VOIDED to enum
    default:
      return null;
  }
}
