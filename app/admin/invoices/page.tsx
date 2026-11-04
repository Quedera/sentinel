import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";

// Admin invoice register — decision #4 (invoicing).
//
// Backed by the live database rather than mock data, so the money figures
// shown here are the same figures the client and consultant see.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-quedera-surface text-quedera-navy/80",
  ISSUED: "bg-quedera-cyan/10 text-quedera-cyan",
  PAID: "bg-quedera-emerald/10 text-quedera-emerald",
  OVERDUE: "bg-quedera-amber/10 text-quedera-amber",
  VOID: "bg-quedera-surface text-quedera-navy/50",
};

function gbp(pence: number): string {
  return "£" + (pence / 100).toLocaleString("en-GB");
}

export default async function AdminInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { companyName: true } },
      consultant: { select: { fullName: true } },
    },
  });

  const totals = invoices.reduce(
    (acc, i) => {
      if (i.status === "VOID") return acc;
      acc.outstanding += i.status === "PAID" ? 0 : i.total;
      acc.paid += i.status === "PAID" ? i.total : 0;
      return acc;
    },
    { outstanding: 0, paid: 0 }
  );

  return (
    <div>
      <PageHeader
        title="INVOICES"
        subtitle="Money raised against confirmed engagements"
        badge="Admin"
        action={
          <Link href="/admin" className="btn-outline text-sm">
            BACK
          </Link>
        }
      />
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="card">
            <p className="text-xs text-quedera-navy/50">Outstanding</p>
            <p className="text-3xl font-bold text-quedera-amber">
              {gbp(totals.outstanding)}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-quedera-navy/50">Paid</p>
            <p className="text-3xl font-bold text-quedera-emerald">
              {gbp(totals.paid)}
            </p>
          </div>
        </div>

        <div className="card">
          {invoices.length === 0 ? (
            <p className="text-sm text-quedera-navy/50">No invoices raised yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-quedera-navy/50 border-b border-quedera-surface">
                  <th className="py-2">Number</th>
                  <th className="py-2">Client</th>
                  <th className="py-2">Consultant</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-quedera-surface">
                    <td className="py-3 font-semibold text-quedera-navy">
                      {inv.number}
                    </td>
                    <td className="py-3 text-quedera-navy/70">
                      {inv.client.companyName}
                    </td>
                    <td className="py-3 text-quedera-navy/70">
                      {inv.consultant.fullName}
                    </td>
                    <td className="py-3">
                      <span className={"badge " + (STATUS_STYLES[inv.status] ?? "")}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-quedera-navy">
                      {gbp(inv.total)}
                    </td>
                    <td className="py-3 text-right text-quedera-navy/70">
                      {inv.dueAt ? inv.dueAt.toISOString().split("T")[0] : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-xs text-quedera-navy/50 mt-4">
          All amounts are stored in pence and shown in GBP. VAT is applied at
          the rate configured in lib/invoicing.ts.
        </p>
      </div>
    </div>
  );
}
