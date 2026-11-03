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

export default function ConsultantRegistrationPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    telephone: "",
    location: "",
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-xs font-semibold text-quedera-navy/60 tracking-widest mb-2">
        QUEDERA / SENTINEL
      </div>
      <h1 className="text-2xl font-bold text-quedera-navy mb-8">
        CONSULTANT REGISTRATION
      </h1>
      <div className="grid md:grid-cols-3 gap-8">
        <aside>
          <div className="text-xs font-semibold text-quedera-navy/60 tracking-widest mb-2">
            Consultant Setup
          </div>
          <h2 className="text-lg font-bold text-quedera-navy mb-6">
            CREATE YOUR CONSULTANT PROFILE
          </h2>
          <StepIndicator steps={STEPS} currentStep={0} />
        </aside>
        <div className="md:col-span-2">
          <div className="card">
            <h3 className="text-lg font-bold text-quedera-navy mb-6">
              Personal details
            </h3>
            <form className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input
                  className="input"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane.smith@example.com"
                  required
                />
              </div>
              <div>
                <label className="label">Telephone</label>
                <input
                  className="input"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+44 7700 900123"
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="London / Remote"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Link href="/register/consultant/profile" className="btn-primary">
                  SAVE & CONTINUE
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
