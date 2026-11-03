import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { EngagementRow } from "@/components/EngagementRow";
import { getEngagementsForClient, getClient } from "@/lib/mock-data";

export default function ClientDashboardPage() {
  const client = getClient("cl1")!;
  const engagements = getEngagementsForClient(client.id);

  const active = engagements.filter((e) =>
    ["CONFIRMED", "ACTIVE", "AWAITING_CONSULTANT", "VIEWED", "SIGNED"].includes(e.status)
  );
  const pending = engagements.filter((e) => e.status === "AWAITING_CONSULTANT");

  return (
    <div>
      <PageHeader
        title="DASHBOARD"
        subtitle={client.companyName}
        badge="Client"
      />
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-xs font-semibold text-quedera-navy/60 tracking-widest mb-1">
              ACTIVE ENGAGEMENTS
            </p>
            <p className="text-3xl font-bold text-quedera-navy">
              {active.length}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs font-semibold text-quedera-navy/60 tracking-widest mb-1">
              PENDING REQUESTS
            </p>
            <p className="text-3xl font-bold text-quedera-navy">{pending.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs font-semibold text-quedera-navy/60 tracking-widest mb-1">
              SAVED
            </p>
            <p className="text-3xl font-bold text-quedera-navy">7</p>
          </div>
        </div>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-quedera-navy">
              Active engagements
            </h2>
            <Link href="/client/search" className="btn-primary">
              FIND A CONSULTANT
            </Link>
          </div>
          <div className="card">
            {engagements.length > 0 ? (
              engagements.map((e) => (
                <EngagementRow key={e.id} engagement={e} />
              ))
            ) : (
              <p className="text-sm text-quedera-navy/50 py-4">
                No active engagements.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
