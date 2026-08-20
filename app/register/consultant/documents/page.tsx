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

interface Reference {
  name: string;
  organisation: string;
  position: string;
  email: string;
  phone: string;
}

const emptyRef: Reference = { name: "", organisation: "", position: "", email: "", phone: "" };

export default function DocumentsStepPage() {
  const [references, setReferences] = useState<Reference[]>([
    { ...emptyRef },
    { ...emptyRef },
  ]);
  const [cvUploaded, setCvUploaded] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="grid md:grid-cols-3 gap-8">
        <aside>
          <h2 className="text-lg font-bold text-quedera-navy mb-6">
            DOCUMENTS & REFERENCES
          </h2>
          <StepIndicator steps={STEPS} currentStep={2} />
        </aside>
        <div className="md:col-span-2">
          <div className="card space-y-6">
            <div>
              <h3 className="label">CV</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {cvUploaded ? (
                  <div className="flex justify-between items-center bg-sentinel-tint rounded p-3">
                    <div className="text-left">
                      <p className="font-semibold text-quedera-navy">consultant_cv.pdf</p>
                      <p className="text-xs text-gray-500">Uploaded: 12 Aug 2026</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-outline text-xs py-1 px-3">VIEW</button>
                      <button className="btn-outline text-xs py-1 px-3">REPLACE</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCvUploaded(true)}
                    className="btn-outline"
                  >
                    CHOOSE FILE
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="label !mb-0">References</h3>
                <button
                  className="text-xs text-sentinel font-semibold"
                  onClick={() => setReferences([...references, { ...emptyRef }])}
                >
                  + ADD REFERENCE
                </button>
              </div>
              <div className="space-y-4">
                {references.map((ref, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold text-quedera-slate tracking-wider">
                      REFERENCE {idx + 1}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        className="input"
                        placeholder="Name"
                        value={ref.name}
                        onChange={(e) => {
                          const next = [...references];
                          next[idx] = { ...ref, name: e.target.value };
                          setReferences(next);
                        }}
                      />
                      <input
                        className="input"
                        placeholder="Organisation"
                        value={ref.organisation}
                        onChange={(e) => {
                          const next = [...references];
                          next[idx] = { ...ref, organisation: e.target.value };
                          setReferences(next);
                        }}
                      />
                      <input
                        className="input"
                        placeholder="Position"
                        value={ref.position}
                        onChange={(e) => {
                          const next = [...references];
                          next[idx] = { ...ref, position: e.target.value };
                          setReferences(next);
                        }}
                      />
                      <input
                        className="input"
                        placeholder="Email"
                        type="email"
                        value={ref.email}
                        onChange={(e) => {
                          const next = [...references];
                          next[idx] = { ...ref, email: e.target.value };
                          setReferences(next);
                        }}
                      />
                      <input
                        className="input col-span-2"
                        placeholder="Telephone"
                        value={ref.phone}
                        onChange={(e) => {
                          const next = [...references];
                          next[idx] = { ...ref, phone: e.target.value };
                          setReferences(next);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              Your information is securely held within QUEDERA SENTINEL.
            </p>
          </div>

          <div className="flex justify-between pt-6">
            <Link href="/register/consultant/profile" className="btn-outline">
              BACK
            </Link>
            <Link href="/register/consultant/skills" className="btn-primary">
              SAVE & CONTINUE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
