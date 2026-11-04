import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authProvider } from "@/lib/auth";
import { notifyUser } from "@/lib/notify/events";
import { serviceConfirmationSigned } from "@/lib/notify/templates";
import { CURRENT_SERVICE_CONFIRMATION_VERSION } from "@/lib/service-confirmation";
import type {
  ApiResult,
  ServiceConfirmationResponse,
  SignServiceConfirmationRequest,
} from "@/lib/api/contract";

/**
 * POST /api/service-confirmation/sign
 *
 * Decision #3 (locked 2026-10-18): "Profile verification should be when user
 * or client registration when they sign the Sentinel Service Confirmation
 * when subscribing to the service."
 *
 * So verification is NOT a separate KYC step — it happens at subscription.
 * The user signs the Service Confirmation, which moves their verification
 * status from PENDING to SERVICE_CONFIRMATION_SIGNED. A QUEDERA
 * administrator then promotes it to VERIFIED.
 *
 * The signed record is retained so the audit trail can evidence consent.
 */
export async function POST(request: Request) {
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

  let body: SignServiceConfirmationRequest;
  try {
    body = (await request.json()) as SignServiceConfirmationRequest;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Invalid JSON body" },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  if (!body.accepted) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "NOT_ACCEPTED",
          message: "The Service Confirmation must be accepted before signing",
        },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  const signedName = (body.signedName ?? "").trim();
  if (!signedName) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "signedName is required" },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  const version =
    (body.version ?? "").trim() || CURRENT_SERVICE_CONFIRMATION_VERSION;

  // One active confirmation per user. Re-signing supersedes rather than
  // stacking — the audit trail keeps the history.
  const existing = await prisma.serviceConfirmation.findFirst({
    where: { userId: session.id },
    orderBy: { signedAt: "desc" },
  });

  const confirmation = await prisma.$transaction(async (tx) => {
    const confirmation = await tx.serviceConfirmation.create({
      data: {
        userId: session.id,
        version,
        signedName,
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    await tx.user.update({
      where: { id: session.id },
      data: { verificationStatus: "SERVICE_CONFIRMATION_SIGNED" },
    });

    await tx.auditEvent.create({
      data: {
        actorId: session.id,
        action: "SERVICE_CONFIRMATION_SIGNED",
        resourceType: "user",
        resourceId: session.id,
        details:
          "version=" + version + ";signedName=" + signedName + ";supersedes=" + (existing?.id ?? "none"),
      },
    });

    return confirmation;
  });

  await notifyUser(session.id, { id: session.id, email: session.email }, (name) =>
    serviceConfirmationSigned(name, version)
  );

  const response: ServiceConfirmationResponse = {
    id: confirmation.id,
    version: confirmation.version,
    signedName: confirmation.signedName,
    signedAt: confirmation.signedAt.toISOString(),
    verificationStatus: "SERVICE_CONFIRMATION_SIGNED",
  };

  return NextResponse.json(
    { ok: true, data: response } satisfies ApiResult<ServiceConfirmationResponse>
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
