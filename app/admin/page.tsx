import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";

// Admin overview — backed by the live database, not mock data.
export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [pending, active, suspended, pendingVerification, invoiceCount] =
    await Promise.all([
      prisma.consultant.count({ where: { profileComplete: false } }),
      prisma.consultant.count({ where: { verified: true, profileComplete: true } }),
      prisma.consultant.count({ where: { verified: false } }),
      prisma.user.count({
        where: { verificationStatus: "SERVICE_CONFIRMATION_SIGNED" },
      }),
      prisma.invoice.count({ where: { status: { not: "VOID" } } }),
    ]);

  return (
    <div>
      <PageHeader
        title="QUEDERA SENTINEL — ADMINISTRATION"
        subtitle="Back-office oversight"
        badge="Admin"
        action={
          <Link href="/admin/audit" className="btn-outline text-sm">
            VIEW AUDIT
          </Link>
        }
      />
      <div className="container mx-auto px-4">
        <p className="text-xs text-quedera-navy/50 mb-6">
          <Link href="/admin/consultants" className="text-quedera-emerald font-semibold">
            CONSULTANTS
          </Link>{" "}
          ·{" "}
          <Link href="/admin/verifications" className="text-quedera-emerald font-semibold">
            VERIFICATIONS
          </Link>{" "}
          ·{" "}
          <Link href="/admin/invoices" className="text-quedera-emerald font-semibold">
            INVOICES
          </Link>{" "}
          ·{" "}
          <Link href="/admin/audit" className="text-quedera-emerald font-semibold">
            AUDIT
          </Link>
        </p>

        <h2 className="text-sm font-bold text-quedera-navy tracking-wider mb-3">
          CONSULTANTS
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <p className="text-xs text-quedera-navy/50">Pending approval</p>
            <p className="text-3xl font-bold text-quedera-amber">{pending}</p>
          </div>
          <div className="card">
            <p className="text-xs text-quedera-navy/50">Active</p>
            <p className="text-3xl font-bold text-quedera-emerald">{active}</p>
          </div>
          <div className="card">
            <p className="text-xs text-quedera-navy/50">Unverified</p>
            <p className="text-3xl font-bold text-quedera-navy">{suspended}</p>
          </div>
        </div>

        <h2 className="text-sm font-bold text-quedera-navy tracking-wider mb-3">
          PLATFORM
        </h2>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="card">
            <p className="text-xs text-quedera-navy/50">Awaiting verification</p>
            <p className="text-3xl font-bold text-quedera-navy">
              {pendingVerification}
            </p>
            <Link
              href="/admin/verifications"
              className="text-sm text-quedera-emerald font-semibold"
            >
              Review now →
            </Link>
          </div>
          <div className="card">
            <p className="text-xs text-quedera-navy/50">Invoices raised</p>
            <p className="text-3xl font-bold text-quedera-navy">{invoiceCount}</p>
            <Link
              href="/admin/invoices"
              className="text-sm text-quedera-emerald font-semibold"
            >
              Open register →
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-quedera-navy mb-4">
            Recent activity
          </h2>
          <p className="text-sm text-quedera-navy/50">
            {pending} consultant{pending === 1 ? "" : "s"} awaiting review.{" "}
            <Link
              href="/admin/consultants"
              className="text-quedera-emerald font-semibold"
            >
              Review now →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
