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
    <div className="card hover:border-sentinel hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3 gap-2">
        <div>
          <h3 className="text-lg font-bold text-quedera-navy leading-tight">
            {consultant.fullName}
          </h3>
          <p className="text-sm text-quedera-slate">{consultant.title}</p>
        </div>
        {consultant.verified && (
          <span className="badge bg-sentinel-tint text-sentinel-dark whitespace-nowrap">
            ✓ Verified
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4">
        {consultant.skills.slice(0, 3).join(" • ")} • {consultant.yearsExperience}+ years
      </p>
      <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100">
        <span className="text-gray-500">
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
