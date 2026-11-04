import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { EngagementRow } from "@/components/EngagementRow";
import { getConsultant, getEngagementsForConsultant } from "@/lib/mock-data";
import { computeCompleteness } from "@/lib/completeness";

export default function ConsultantDashboardPage() {
  const consultant = getConsultant("c1")!;
  const engagements = getEngagementsForConsultant(consultant.id);

  // Decision #6 — weighted completeness. A soft nudge, not a gate:
  // nothing here blocks the consultant, it just shows what is worth
  // finishing next. Weights live in lib/completeness.ts.
  const completeness = computeCompleteness({
    hasCv: !!consultant.cvFile,
    referenceCount: consultant.references.length,
    skillCount: consultant.skills.length,
    dayRate: consultant.dayRate,
    hasSummary: consultant.professionalSummary.length > 0,
  });

  const checklist = completeness.fields;
  const completionPct = completeness.percent;
  const outgoingContract = engagements.find((e) => e.status === "AWAITING_CONSULTANT");

  return (
    <div>
      <PageHeader
        title="YOUR PROFILE"
        subtitle={`Welcome back, ${consultant.fullName}`}
        badge="Consultant"
      />
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-bold text-quedera-navy mb-4">
                Profile completeness
              </h2>
              <div className="w-full bg-quedera-surface rounded-full h-2 mb-3">
                <div
                  className="bg-quedera-emerald h-2 rounded-full transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="text-sm text-quedera-navy/50 mb-6">{completionPct}% complete</p>
              <ul className="space-y-2">
                {checklist.map((c) => (
                  <li key={c.label} className="flex items-center gap-2 text-sm">
                    <span
                      className={
                        c.done ? "text-quedera-emerald" : "text-quedera-navy/40"
                      }
                    >
                      {c.done ? "✓" : "○"}
                    </span>
                    <span className={c.done ? "text-quedera-navy" : "text-quedera-navy/50"}>
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="card">
              <h2 className="text-lg font-bold text-quedera-navy mb-4">
                Contract requests
              </h2>
              {outgoingContract ? (
                <div>
                  <p className="text-sm text-quedera-navy/50 mb-1">
                    {outgoingContract.role}
                  </p>
                  <p className="text-2xl font-bold text-quedera-navy mb-2">
                    £{outgoingContract.estimatedValue.toLocaleString()}
                  </p>
                  <Link
                    href={`/consultant/contract/${outgoingContract.id}`}
                    className="btn-outline text-xs py-1 px-3 mb-2 inline-block"
                  >
                    REVIEW & SIGN
                  </Link>
                  <p className="text-xs text-quedera-navy">
                    Response deadline:{" "}
                    {outgoingContract.consultantDeadline?.split("T")[0] || "5 days"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-quedera-navy/50">No contract requests.</p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-quedera-navy mb-4">
            Recent engagements
          </h2>
          <div className="card">
            {engagements.length > 0 ? (
              engagements.map((e) => (
                <EngagementRow key={e.id} engagement={e} />
              ))
            ) : (
              <p className="text-sm text-quedera-navy/50 py-4">No engagements yet.</p>
            )}
          </div>
        </section>

        <nav className="mt-8 flex gap-4 border-t border-quedera-surface pt-6">
          <Link href="/register/consultant/profile" className="btn-outline text-sm">
            PROFILE
          </Link>
          <Link href="/register/consultant/availability" className="btn-outline text-sm">
            AVAILABILITY
          </Link>
          <Link href="/consultant/contract/e1" className="btn-outline text-sm">
            CONTRACTS
          </Link>
          <Link href="/" className="btn-outline text-sm">
            SETTINGS
          </Link>
        </nav>
      </div>
    </div>
  );
}
