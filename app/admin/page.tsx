import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { mockConsultants } from "@/lib/mock-data";

export default function AdminHomePage() {
  const pending = mockConsultants.filter((c) => !c.verified).length;
  const active = mockConsultants.filter((c) => c.verified).length;
  const suspended = 0;

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
          <Link href="/admin" className="text-quedera-emerald font-semibold">
            CLIENTS
          </Link>{" "}
          ·{" "}
          <Link href="/admin" className="text-quedera-emerald font-semibold">
            CONTRACTS
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
            <p className="text-xs text-quedera-navy/50">Suspended</p>
            <p className="text-3xl font-bold text-quedera-navy">{suspended}</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-quedera-navy mb-4">
            Recent activity
          </h2>
          <p className="text-sm text-quedera-navy/50">
            {pending} consultant{pending === 1 ? "" : "s"} awaiting review.{" "}
            <Link href="/admin/consultants" className="text-quedera-emerald font-semibold">
              Review now →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
