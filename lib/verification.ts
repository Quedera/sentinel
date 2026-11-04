// QUEDERA SENTINEL — verification decisions (decision #3)
//
// A user signs the Sentinel Service Confirmation when they subscribe, which
// moves them to SERVICE_CONFIRMATION_SIGNED. A QUEDERA administrator then
// promotes them to VERIFIED, or rejects them.
//
// Without this step verification never completes — everyone would sit at
// SERVICE_CONFIRMATION_SIGNED indefinitely. The brief calls for admin
// control over "profile approval" and "user access", and for every
// significant transaction to be auditable, so both the decision and the
// audit event are recorded here.
//
// Shared by the API route and the admin page's server action, so the two
// paths cannot drift apart.

import { prisma } from "@/lib/db";

export type VerificationDecision = "grant" | "reject";

export type VerificationResult =
  | {
      ok: true;
      data: {
        userId: string;
        email: string;
        verificationStatus: string;
        consultantVerified: boolean | null;
      };
    }
  | { ok: false; error: { code: string; message: string } };

/**
 * Apply an administrator's verification decision.
 *
 * @param actorId  The administrator making the decision.
 * @param userId   The user being verified or rejected.
 * @param decision grant | reject.
 * @param notes    Optional free-text note, recorded in the audit trail.
 */
export async function decideVerification(
  actorId: string,
  userId: string,
  decision: VerificationDecision,
  notes?: string
): Promise<VerificationResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { consultant: true },
  });
  if (!user) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "User not found" },
    };
  }

  if (user.verificationStatus === "VERIFIED" && decision === "grant") {
    return {
      ok: false,
      error: { code: "INVALID_STATE", message: "User is already verified" },
    };
  }

  const nextStatus = decision === "grant" ? "VERIFIED" : "REJECTED";

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: user.id },
      data: { verificationStatus: nextStatus },
    });

    // A consultant's public "Verified Profile" badge follows their account
    // verification.
    if (user.consultant) {
      await tx.consultant.update({
        where: { id: user.consultant.id },
        data: { verified: decision === "grant" },
      });
    }

    await tx.auditEvent.create({
      data: {
        actorId,
        action:
          decision === "grant" ? "VERIFICATION_GRANTED" : "VERIFICATION_REJECTED",
        resourceType: "user",
        resourceId: user.id,
        details:
          "from=" +
          user.verificationStatus +
          ";to=" +
          nextStatus +
          (notes ? ";notes=" + notes : ""),
      },
    });

    return u;
  });

  return {
    ok: true,
    data: {
      userId: updated.id,
      email: updated.email,
      verificationStatus: updated.verificationStatus,
      consultantVerified: user.consultant ? decision === "grant" : null,
    },
  };
}
