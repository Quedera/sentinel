"use client";

import Link from "next/link";
import { useState } from "react";
import { StepIndicator } from "@/components/StepIndicator";

const STEPS = [
  "Personal details",
  "Professional profile",
  "CV & references",
  "Skills & experience",
  "Availability & pricing",
  "Review & submit",
];

export default function ProfileStepPage() {
  const [form, setForm] = useState({
    title: "",
    years: "",
    sector: "Financial Services",
    summary: "",
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="grid md:grid-cols-3 gap-8">
        <aside>
          <h2 className="text-lg font-bold text-quedera-navy mb-6">
            PROFESSIONAL PROFILE
          </h2>
          <StepIndicator steps={STEPS} currentStep={1} />
        </aside>
        <div className="md:col-span-2">
          <div className="card">
            <div className="space-y-4">
              <div>
                <label className="label">Professional title</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Transformation Consultant"
                />
              </div>
              <div>
                <label className="label">Years of experience</label>
                <input
                  className="input"
                  value={form.years}
                  onChange={(e) => setForm({ ...form, years: e.target.value })}
                  placeholder="15"
                  type="number"
                />
              </div>
              <div>
                <label className="label">Primary sector</label>
                <select
                  className="input"
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                >
                  <option>Financial Services</option>
                  <option>Technology</option>
                  <option>Defence</option>
                  <option>Government</option>
                  <option>Healthcare</option>
                  <option>Energy</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Professional summary</label>
                <textarea
                  className="input min-h-[140px]"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Experienced transformation leader specialising in..."
                />
              </div>
            </div>
            <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
              <Link href="/register/consultant" className="btn-outline">
                BACK
              </Link>
              <Link href="/register/consultant/documents" className="btn-primary">
                CONTINUE
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
