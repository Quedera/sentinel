"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getConsultant } from "@/lib/mock-data";

export default function ClientContractUploadPage({ params }: { params: { id: string } }) {
  const c = getConsultant(params.id)!;
  const [file, setFile] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div>
      <PageHeader
        title="CONTRACT"
        subtitle="Stage 2 — Upload contract"
        badge="Engagement #e1"
      />
      <div className="container mx-auto px-4 max-w-xl">
        <div className="card">
          <h3 className="label">Upload contract</h3>
          <div className="border-2 border-dashed border-quedera-surface rounded-lg p-12 text-center mb-6">
            {file ? (
              <div className="bg-quedera-emerald/10 p-4 rounded text-left">
                <p className="font-semibold text-quedera-navy">{file}</p>
                <button className="btn-outline text-xs py-1 px-3 mt-2">
                  VIEW CONTRACT
                </button>
              </div>
            ) : (
              <div>
                <p className="text-quedera-navy/50 mb-4">
                  Drag & drop contract here
                </p>
                <p className="text-sm text-quedera-navy/40 mb-4">or</p>
                <label className="btn-outline cursor-pointer inline-block">
                  CHOOSE FILE
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0]?.name || null)}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="bg-quedera-surface border border-quedera-amber rounded p-4 mb-4">
            <p className="text-xs text-quedera-navy/50">Consultant confirmation deadline:</p>
            <p className="text-sm font-bold text-quedera-navy">
              19 August 2026, 17:00
            </p>
            <p className="text-xs text-quedera-navy/50 mt-1">
              The consultant will have 5 days to respond.
            </p>
          </div>

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-4 w-4 text-quedera-emerald focus:ring-quedera-emerald border-quedera-surface rounded"
            />
            <span className="text-sm text-quedera-navy">
              I confirm I have authority to submit this contract.
            </span>
          </label>

          <div className="flex justify-between pt-4">
            <Link href={`/client/hire/${params.id}`} className="btn-outline">
              BACK
            </Link>
            <Link
              href="/client/dashboard"
              className="btn-primary"
              aria-disabled={!file || !confirmed}
            >
              <span className={!file || !confirmed ? "opacity-50" : ""}>
                SEND TO CONSULTANT
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
