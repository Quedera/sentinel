import Link from "next/link";
import { StepIndicator } from "@/components/StepIndicator";
import { mockConsultants } from "@/lib/mock-data";

const STEPS = [
  "Personal details",
  "Professional profile",
  "CV & references",
  "Skills & experience",
  "Availability & pricing",
  "Review & submit",
];

export default function ReviewStepPage() {
  const c = mockConsultants[0];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="grid md:grid-cols-3 gap-8">
        <aside>
          <h2 className="text-lg font-bold text-quedera-navy mb-6">
            REVIEW & SUBMIT
          </h2>
          <StepIndicator steps={STEPS} currentStep={5} />
        </aside>
        <div className="md:col-span-2">
          <div className="card space-y-4">
            <div>
              <h3 className="label">Personal details</h3>
              <p className="text-sm text-quedera-navy">{c.fullName}</p>
              <p className="text-sm text-quedera-navy/50">{c.email}</p>
            </div>
            <div>
              <h3 className="label">Professional profile</h3>
              <p className="text-sm text-quedera-navy">{c.title}</p>
              <p className="text-sm text-quedera-navy/50">
                {c.yearsExperience}+ years · {c.primarySector}
              </p>
              <p className="text-sm text-quedera-navy/70 mt-2">{c.professionalSummary}</p>
            </div>
            <div>
              <h3 className="label">CV & references</h3>
              <p className="text-sm text-quedera-navy">✓ {c.cvFile}</p>
              <p className="text-sm text-quedera-navy">
                ✓ {c.references.length} references supplied
              </p>
            </div>
            <div>
              <h3 className="label">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {c.skills.map((s) => (
                  <span key={s} className="badge bg-quedera-emerald/10 text-quedera-emerald">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="label">Day rate</h3>
              <p className="text-lg font-bold text-quedera-navy">
                £{c.dayRate.toLocaleString()} / day
              </p>
            </div>
          </div>
          <p className="text-xs text-quedera-navy/50 mt-4">
            By submitting, your profile will be reviewed by the QUEDERA SENTINEL
            admin team before being published.
          </p>
          <div className="flex justify-between pt-6">
            <Link href="/register/consultant/availability" className="btn-outline">
              BACK
            </Link>
            <Link href="/consultant/dashboard" className="btn-primary">
              SUBMIT FOR APPROVAL
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
