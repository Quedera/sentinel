import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { mockAuditEvents } from "@/lib/mock-data";

export default function AdminAuditPage() {
  return (
    <div>
      <PageHeader
        title="AUDIT TRAIL"
        subtitle="Every state change is logged"
        badge="Compliance"
      />
      <div className="container mx-auto px-4">
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-quedera-navy/50 border-b border-quedera-surface">
                <th className="py-2">Timestamp</th>
                <th className="py-2">Actor</th>
                <th className="py-2">Action</th>
                <th className="py-2">Resource</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {mockAuditEvents.map((e) => (
                <tr key={e.id} className="border-b border-quedera-surface">
                  <td className="py-3 text-quedera-navy/50 font-mono text-xs">
                    {e.timestamp}
                  </td>
                  <td className="py-3 text-quedera-navy">{e.actor}</td>
                  <td className="py-3">
                    <span className="badge bg-quedera-surface text-quedera-navy/80 font-mono">
                      {e.action}
                    </span>
                  </td>
                  <td className="py-3 text-quedera-navy/70">
                    {e.resourceType}#{e.resourceId}
                  </td>
                  <td className="py-3 text-quedera-navy/50 text-xs">{e.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-quedera-navy/50 mt-6">
          The audit trail is critical for compliance given the contractual nature
          of SENTINEL. Every state change affecting profile, CV, references,
          rate, availability, search, hire, contract views, signature events,
          accept/decline, notifications, and 5-day expiry is captured here.
        </p>
        <p className="text-xs text-quedera-navy/50 mt-3">
          <Link href="/admin" className="text-quedera-emerald font-semibold">
            ← Back to admin home
          </Link>
        </p>
      </div>
    </div>
  );
}
