import Link from "next/link";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { authProvider } from "@/lib/auth";
import { decideVerification } from "@/lib/verification";

// Verification queue — decision #3 (Sentinel Service Confirmation).
//
// A user signs the Service Confirmation when they subscribe, which moves
// them to SERVICE_CONFIRMATION_SIGNED. An administrator promotes them to
// VERIFIED (or rejects them) here.
//
// The decision itself is a server action, so no session token is ever
// shipped to the browser. It calls the same lib/verification.ts helper as
// POST /api/admin/verifications/[userId].
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-quedera-surface text-quedera-amber",
  SERVICE_CONFIRMATION_SIGNED: "bg-quedera-cyan/10 text-quedera-cyan",
  VERIFIED: "bg-quedera-emerald/10 text-quedera-emerald",
  REJECTED: "bg-quedera-surface text-quedera-navy",
};

/**
 * Apply a verification decision from the admin console.
 *
 * Auth: reads the session cookie. In local development there is no login
 * flow yet, so it falls back to ADMIN_EMAIL — this is why that env var
 * exists, and why it must never be set in production.
 */
async function decide(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!userId || (decision !== "grant" && decision !== "reject")) return;

  let actorId: string | null = null;

  const token = cookies().get("session")?.value;
  if (token) {
    const session = await authProvider.resolveSession(token);
    if (session && session.role === "ADMIN") actorId = session.id;
  }

  if (!actorId && process.env.NODE_ENV !== "production") {
    const email = process.env.ADMIN_EMAIL;
    if (email) {
      const session = await authProvider.resolveSession(email + ":ADMIN");
      if (session) actorId = session.id;
    }
  }

  if (!actorId) return;

  await decideVerification(actorId, userId, decision);
  revalidatePath("/admin/verifications");
}

export default async function AdminVerificationsPage() {
  const users = await prisma.user.findMany({
    orderBy: [{ verificationStatus: "asc" }, { email: "asc" }],
    include: {
      serviceConfirmations: {
        orderBy: { signedAt: "desc" },
        take: 1,
      },
      consultant: { select: { fullName: true, title: true } },
      client: { select: { companyName: true } },
    },
  });

  const counts = users.reduce(
    (acc, u) => {
      acc[u.verificationStatus] = (acc[u.verificationStatus] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const STATUSES = [
    "PENDING",
    "SERVICE_CONFIRMATION_SIGNED",
    "VERIFIED",
    "REJECTED",
  ] as const;

  return (
    <div>
      <PageHeader
        title="VERIFICATIONS"
        subtitle="Sentinel Service Confirmation queue"
        badge="Admin"
        action={
          <Link href="/admin" className="btn-outline text-sm">
            BACK
          </Link>
        }
      />
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {STATUSES.map((status) => (
            <div key={status} className="card">
              <p className="text-xs text-quedera-navy/50">
                {status === "SERVICE_CONFIRMATION_SIGNED"
                  ? "Confirmation signed"
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </p>
              <p className="text-3xl font-bold text-quedera-navy">
                {counts[status] ?? 0}
              </p>
            </div>
          ))}
        </div>

        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-quedera-navy/50 border-b border-quedera-surface">
                <th className="py-2">Email</th>
                <th className="py-2">Party</th>
                <th className="py-2">Status</th>
                <th className="py-2">Signed</th>
                <th className="py-2">Version</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const conf = u.serviceConfirmations[0];
                const decidable =
                  u.verificationStatus === "SERVICE_CONFIRMATION_SIGNED" ||
                  u.verificationStatus === "PENDING" ||
                  u.verificationStatus === "REJECTED";
                return (
                  <tr key={u.id} className="border-b border-quedera-surface">
                    <td className="py-3 font-semibold text-quedera-navy">
                      {u.email}
                    </td>
                    <td className="py-3 text-quedera-navy/70">
                      {u.consultant?.fullName ??
                        u.client?.companyName ??
                        u.role}
                    </td>
                    <td className="py-3">
                      <span
                        className={
                          "badge " + (STATUS_STYLES[u.verificationStatus] ?? "")
                        }
                      >
                        {u.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 text-quedera-navy/70">
                      {conf ? conf.signedAt.toISOString().split("T")[0] : "—"}
                    </td>
                    <td className="py-3 text-quedera-navy/70">{conf?.version ?? "—"}</td>
                    <td className="py-3">
                      {decidable ? (
                        <div className="flex gap-2 justify-end">
                          <form action={decide}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="decision" value="grant" />
                            <button type="submit" className="btn-outline text-xs">
                              APPROVE
                            </button>
                          </form>
                          <form action={decide}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="decision" value="reject" />
                            <button type="submit" className="btn-outline text-xs">
                              REJECT
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs text-quedera-navy/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
