import Link from "next/link";
import type { Consultant } from "@/lib/types";

interface ConsultantCardProps {
  consultant: Consultant;
  href?: string;
}

export function ConsultantCard({ consultant, href }: ConsultantCardProps) {
  const availableDays = Object.values(consultant.availability).filter(
    (a) => a === "available"
  ).length;

  const card = (
    <div className="card hover:border-quedera-emerald hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3 gap-2">
        <div>
          <h3 className="text-lg font-bold text-quedera-navy leading-tight">
            {consultant.fullName}
          </h3>
          <p className="text-sm text-quedera-navy/60">{consultant.title}</p>
        </div>
        {consultant.verified && (
          <span className="badge bg-quedera-emerald/10 text-quedera-emerald whitespace-nowrap">
            ✓ Verified
          </span>
        )}
      </div>
      <p className="text-sm text-quedera-navy/70 mb-4">
        {consultant.skills.slice(0, 3).join(" • ")} • {consultant.yearsExperience}+ years
      </p>
      <div className="flex justify-between items-center text-sm pt-3 border-t border-quedera-surface">
        <span className="text-quedera-navy/50">
          Available: {availableDays > 0 ? `${availableDays} days` : "—"}
        </span>
        <span className="font-bold text-quedera-navy">
          £{consultant.dayRate.toLocaleString()} / day
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}
