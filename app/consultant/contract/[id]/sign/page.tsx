"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getEngagement, getClient } from "@/lib/mock-data";

export default function SignPage({ params }: { params: { id: string } }) {
  const engagement = getEngagement(params.id)!;
  const client = getClient(engagement.clientId)!;
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");

  const isDecline = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("action") === "decline";

  return (
    <div>
      <PageHeader
        title="REVIEW & SIGN"
        subtitle={`${client.companyName} — Consulting Agreement for ${engagement.role}`}
        badge="Engagement #e1"
      />
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="card">
          <div className="border border-quedera-surface rounded p-6 bg-quedera-surface mb-6 min-h-[300px]">
            <h3 className="text-sm font-semibold text-quedera-navy mb-4">
              {client.companyName}
              <br />
              <span className="text-xs text-quedera-navy/50 font-normal">
                Consulting Agreement — {engagement.role}
              </span>
            </h3>
            <div className="text-xs text-quedera-navy/70 space-y-3 font-mono whitespace-pre-wrap">
{`1. ENGAGEMENT
The Consultant agrees to provide services to the Client in the role of
${engagement.role} for the period ${engagement.startDate} to ${engagement.endDate}
(${engagement.estimatedDays} working days).

2. DAY RATE
The Client shall pay the Consultant a day rate of £${engagement.dayRate.toLocaleString()},
giving an estimated total contract value of £${engagement.estimatedValue.toLocaleString()}.

3. CONFIDENTIALITY
The Consultant shall keep all client information confidential and use it
only for the purpose of delivering the engagement.

4. INTELLECTUAL PROPERTY
All deliverable intellectual property created in the course of the engagement
shall be assigned to the Client on completion.

5. TERMINATION
Either party may terminate this agreement with 5 working days' written notice.`}
            </div>
          </div>

          <h3 className="text-sm font-bold text-quedera-navy tracking-wider mb-4">
            SIGNATURE
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Name</label>
              <p className="text-sm text-quedera-navy">Jane Smith</p>
            </div>
            <div>
              <label className="label">Email</label>
              <p className="text-sm text-quedera-navy">jane.smith@example.com</p>
            </div>
          </div>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 text-quedera-emerald focus:ring-quedera-emerald border-quedera-surface rounded"
            />
            <span className="text-sm text-quedera-navy">
              I have reviewed the agreement and agree to its terms.
            </span>
          </label>
          <div className="mb-6">
            <label className="label">Signature</label>
            <div className="border-2 border-quedera-surface rounded-lg h-32 flex items-center justify-center bg-quedera-surface">
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name to sign"
                className="text-center text-2xl font-serif italic text-quedera-navy w-full px-4 focus:outline-none"
                style={{ fontFamily: "'Caveat', cursive" }}
              />
            </div>
          </div>
          <div className="flex justify-between pt-4 border-t border-quedera-surface">
            <Link href={`/consultant/contract/${params.id}`} className="btn-outline">
              BACK
            </Link>
            <Link
              href={`/consultant/confirm/${params.id}`}
              className="btn-primary"
              aria-disabled={!agreed || !signature}
            >
              <span className={!agreed || !signature ? "opacity-50" : ""}>
                SIGN & CONFIRM
              </span>
            </Link>
          </div>
        </div>
        <p className="text-xs text-quedera-navy/50 mt-6">
          For a production system, the electronic-signature mechanism and legal
          requirements should be defined before development rather than simply
          implementing a drawn signature.
        </p>
      </div>
    </div>
  );
}
