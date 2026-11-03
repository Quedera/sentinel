import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ConsultantCard } from "@/components/ConsultantCard";
import { mockConsultants } from "@/lib/mock-data";

export default function SearchResultsPage({
  searchParams,
}: {
  searchParams: { skills?: string; sector?: string };
}) {
  const filtered = mockConsultants.filter((c) => {
    if (searchParams.sector && c.primarySector !== searchParams.sector) return false;
    if (searchParams.skills && !c.skills.includes(searchParams.skills)) return false;
    return c.verified && c.profileComplete;
  });

  return (
    <div>
      <PageHeader
        title="FIND A CONSULTANT"
        subtitle="Search results"
      />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-quedera-navy/50">
            <span className="font-bold text-quedera-navy">{filtered.length}</span> consultants found
          </p>
          <Link href="/client/search" className="text-sm text-quedera-emerald font-semibold">
            Modify search
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <ConsultantCard
              key={c.id}
              consultant={c}
              href={`/client/consultant/${c.id}`}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-quedera-navy/50">
              No consultants match your filters. Try widening your search.
            </p>
            <Link href="/client/search" className="btn-outline mt-4 inline-block">
              MODIFY SEARCH
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
