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
          <div className="mx-auto w-16 h-16 rounded-full bg-sentinel-tint flex items-center justify-center text-sentinel text-3xl font-bold mb-6">
            ✓
          </div>
          <dl className="text-left max-w-md mx-auto space-y-3 mb-8">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">CLIENT</dt>
              <dd className="text-sm font-semibold text-quedera-ink">
                {client?.companyName}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">CONSULTANT</dt>
              <dd className="text-sm font-semibold text-quedera-ink">
                {consultant?.fullName}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">START DATE</dt>
              <dd className="text-sm font-semibold text-quedera-ink">
                {engagement.startDate}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">END DATE</dt>
              <dd className="text-sm font-semibold text-quedera-ink">
                {engagement.endDate}
              </dd>
            </div>
            <div className="flex justify-between pt-2">
              <dt className="text-sm text-gray-500">STATUS</dt>
              <dd>
                <ul className="text-sm text-quedera-ink text-right space-y-1">
                  <li className="text-sentinel-dark">✓ Contract signed</li>
                  <li className="text-sentinel-dark">✓ Client notified</li>
                  <li className="text-sentinel-dark">✓ Consultant notified</li>
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
