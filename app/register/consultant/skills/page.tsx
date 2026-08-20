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

const SKILL_OPTIONS = [
  "Programme Management",
  "Transformation",
  "Strategy",
  "Technology",
  "Finance",
  "Cyber Security",
  "PMO",
  "Change",
  "Risk",
  "Compliance",
  "ERP",
];

export default function SkillsStepPage() {
  const [selected, setSelected] = useState<string[]>([
    "Programme Management",
    "Transformation",
    "Strategy",
  ]);

  const toggle = (skill: string) => {
    setSelected((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="grid md:grid-cols-3 gap-8">
        <aside>
          <h2 className="text-lg font-bold text-quedera-navy mb-6">
            KEY SKILLS
          </h2>
          <StepIndicator steps={STEPS} currentStep={3} />
        </aside>
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex flex-wrap gap-2 mb-4">
              {selected.map((skill) => (
                <span
                  key={skill}
                  className="badge bg-sentinel-tint text-sentinel-dark"
                >
                  {skill}
                  <button
                    onClick={() => toggle(skill)}
                    className="ml-2 text-sentinel-dark hover:text-red-600"
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button className="btn-outline text-xs py-1 px-3">
                + Add Skill
              </button>
            </div>
            <div className="space-y-2 mt-6">
              {SKILL_OPTIONS.map((skill) => (
                <label
                  key={skill}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(skill)}
                    onChange={() => toggle(skill)}
                    className="h-4 w-4 text-sentinel focus:ring-sentinel border-gray-300 rounded"
                  />
                  <span className="text-sm text-quedera-ink">{skill}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-between pt-6">
            <Link href="/register/consultant/documents" className="btn-outline">
              BACK
            </Link>
            <Link href="/register/consultant/availability" className="btn-primary">
              CONTINUE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
