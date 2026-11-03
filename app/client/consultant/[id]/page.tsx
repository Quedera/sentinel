import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { getConsultant } from "@/lib/mock-data";

export default function ClientConsultantProfilePage({ params }: { params: { id: string } }) {
  const c = getConsultant(params.id);
  if (!c) return notFound();

  return (
    <div>
      <PageHeader
        title={c.fullName.toUpperCase()}
        subtitle={c.title}
        badge={c.verified ? "✓ Verified Profile" : undefined}
      />
      <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <p className="text-sm text-quedera-navy/50 mb-2">
              {c.yearsExperience}+ years experience · {c.location}
            </p>
            <p className="text-2xl font-bold text-quedera-navy mb-6">
              £{c.dayRate.toLocaleString()} / day
            </p>
            <section className="mb-6">
              <h3 className="label">PROFESSIONAL SUMMARY</h3>
              <p className="text-sm text-quedera-navy/80">{c.professionalSummary}</p>
            </section>
            <section className="mb-6">
              <h3 className="label">SKILLS</h3>
              <div className="flex flex-wrap gap-2">
                {c.skills.map((s) => (
                  <span key={s} className="badge bg-quedera-emerald/10 text-quedera-emerald">
                    {s}
                  </span>
                ))}
              </div>
            </section>
            <section className="mb-6">
              <h3 className="label">EXPERIENCE</h3>
              <p className="text-sm text-quedera-navy/80">
                {c.yearsExperience}+ years across {c.primarySector.toLowerCase()}, transformation
                and operational change. Detailed project history available after
                selection.
              </p>
            </section>
            <section>
              <h3 className="label">REFERENCES</h3>
              <p className="text-sm text-quedera-emerald">
                ✓ References supplied (full details available after selection)
              </p>
            </section>
          </div>
          <div className="bg-quedera-emerald/10 border border-quedera-emerald-light rounded-lg p-4">
            <p className="text-xs text-quedera-emerald">
              <strong>Information access:</strong> Additional consultant details
              (expanded CV, detailed experience, references) become available
              after you select this consultant for engagement.
            </p>
          </div>
        </div>

        <aside>
          <div className="card">
            <h3 className="label">AVAILABILITY</h3>
            <AvailabilityCalendar availability={c.availability} month="2026-09" />
            <Link
              href={`/client/hire/${c.id}`}
              className="btn-primary w-full mt-6"
            >
              HIRE THIS CONSULTANT
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
