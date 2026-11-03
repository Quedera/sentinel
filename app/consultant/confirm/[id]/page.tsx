import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getEngagement, getConsultant, getClient } from "@/lib/mock-data";

export default function ConfirmationPage({ params }: { params: { id: string } }) {
  const engagement = getEngagement(params.id);
  if (!engagement) return notFound();
  const consultant = getConsultant(engagement.consultantId);
  const client = getClient(engagement.clientId);

  return (
    <div>
      <PageHeader
        title="ENGAGEMENT CONFIRMED"
        subtitle={`${consultant?.fullName} has accepted and signed the contract.`}
      />
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="card text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-quedera-emerald/10 flex items-center justify-center text-quedera-emerald text-3xl font-bold mb-6">
            ✓
          </div>
          <dl className="text-left max-w-md mx-auto space-y-3 mb-8">
            <div className="flex justify-between border-b border-quedera-surface pb-2">
              <dt className="text-sm text-quedera-navy/50">CLIENT</dt>
              <dd className="text-sm font-semibold text-quedera-navy">
                {client?.companyName}
              </dd>
            </div>
            <div className="flex justify-between border-b border-quedera-surface pb-2">
              <dt className="text-sm text-quedera-navy/50">CONSULTANT</dt>
              <dd className="text-sm font-semibold text-quedera-navy">
                {consultant?.fullName}
              </dd>
            </div>
            <div className="flex justify-between border-b border-quedera-surface pb-2">
              <dt className="text-sm text-quedera-navy/50">START DATE</dt>
              <dd className="text-sm font-semibold text-quedera-navy">
                {engagement.startDate}
              </dd>
            </div>
            <div className="flex justify-between border-b border-quedera-surface pb-2">
              <dt className="text-sm text-quedera-navy/50">END DATE</dt>
              <dd className="text-sm font-semibold text-quedera-navy">
                {engagement.endDate}
              </dd>
            </div>
            <div className="flex justify-between pt-2">
              <dt className="text-sm text-quedera-navy/50">STATUS</dt>
              <dd>
                <ul className="text-sm text-quedera-navy text-right space-y-1">
                  <li className="text-quedera-emerald">✓ Contract signed</li>
                  <li className="text-quedera-emerald">✓ Client notified</li>
                  <li className="text-quedera-emerald">✓ Consultant notified</li>
                </ul>
              </dd>
            </div>
          </dl>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="btn-outline">VIEW CONTRACT</button>
            <Link href="/consultant/dashboard" className="btn-primary">
              VIEW ENGAGEMENT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
