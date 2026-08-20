import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { mockConsultants } from "@/lib/mock-data";

export default function AdminConsultantsPage() {
  return (
    <div>
      <PageHeader
        title="CONSULTANTS"
        subtitle="Review and approve consultant profiles"
        badge="Admin"
      />
      <div className="container mx-auto px-4">
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2">Name</th>
                <th className="py-2">Title</th>
                <th className="py-2">Profile</th>
                <th className="py-2">CV</th>
                <th className="py-2">References</th>
                <th className="py-2">Verification</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockConsultants.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-3 font-semibold text-quedera-navy">
                    {c.fullName}
                  </td>
                  <td className="py-3 text-gray-600">{c.title}</td>
                  <td className="py-3 text-gray-600">
                    {c.profileComplete ? "COMPLETE" : "INCOMPLETE"}
                  </td>
                  <td className="py-3">{c.cvFile ? "✓" : "—"}</td>
                  <td className="py-3">
                    {c.references.length > 0 ? `✓ (${c.references.length})` : "—"}
                  </td>
                  <td className="py-3">
                    {c.verified ? (
                      <span className="badge bg-sentinel-tint text-sentinel-dark">
                        VERIFIED
                      </span>
                    ) : (
                      <span className="badge bg-yellow-100 text-yellow-700">
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <button className="btn-outline text-xs py-1 px-3 mr-2">
                      REVIEW
                    </button>
                    <button className="btn-primary text-xs py-1 px-3">
                      {c.verified ? "SUSPEND" : "APPROVE"}
                    </button>
                    <button className="btn-outline text-xs py-1 px-3 ml-2">
                      REJECT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-6">
          Every action is recorded in the audit trail.{" "}
          <Link href="/admin/audit" className="text-sentinel font-semibold">
            View audit →
          </Link>
        </p>
      </div>
    </div>
  );
}
