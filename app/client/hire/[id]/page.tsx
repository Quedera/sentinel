"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getConsultant } from "@/lib/mock-data";

export default function HireRequestPage({ params }: { params: { id: string } }) {
  const consultant = getConsultant(params.id)!;
  const [role, setRole] = useState(consultant.title);
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-09-10");

  const days = Math.max(
    1,
    Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );
  const value = days * consultant.dayRate;

  return (
    <div>
      <PageHeader
        title={`HIRE ${consultant.fullName.toUpperCase()}`}
        subtitle="Stage 1 — Hire request"
      />
      <div className="container mx-auto px-4 max-w-xl">
        <div className="card">
          <div className="bg-gray-50 -m-6 mb-6 p-6 border-b border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Consultant</p>
            <p className="font-semibold text-quedera-navy">{consultant.fullName}</p>
          </div>
          <form className="space-y-4">
            <div>
              <label className="label">Role</label>
              <input
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start date</label>
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label">End date</label>
                <input
                  type="date"
                  className="input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Estimated days</label>
              <input className="input bg-gray-50" value={days} readOnly />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Day rate</label>
                <p className="text-sm text-quedera-ink">
                  £{consultant.dayRate.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="label">Estimated value</label>
                <p className="text-lg font-bold text-sentinel-dark">
                  £{value.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Link href={`/client/consultant/${params.id}`} className="btn-outline">
                BACK
              </Link>
              <Link
                href={`/client/contract/${params.id}`}
                className="btn-primary"
              >
                CONTINUE
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
