"use client";

import Link from "next/link";
import { useState } from "react";
import { StepIndicator } from "@/components/StepIndicator";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";

const STEPS = [
  "Personal details",
  "Professional profile",
  "CV & references",
  "Skills & experience",
  "Availability & pricing",
  "Review & submit",
];

export default function AvailabilityStepPage() {
  const [dayRate, setDayRate] = useState(1250);
  const [availability, setAvailability] = useState<{ [d: string]: "available" | "unavailable" }>({
    "2026-09-01": "available",
    "2026-09-02": "available",
    "2026-09-03": "available",
    "2026-09-04": "available",
    "2026-09-15": "unavailable",
    "2026-09-16": "unavailable",
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="grid md:grid-cols-4 gap-8">
        <aside>
          <h2 className="text-lg font-bold text-quedera-navy mb-6">
            AVAILABILITY & DAY RATE
          </h2>
          <StepIndicator steps={STEPS} currentStep={4} />
        </aside>
        <div className="md:col-span-3 space-y-6">
          <div className="card">
            <h3 className="label">DAY RATE</h3>
            <div className="flex items-center gap-3">
              <span className="text-lg">£</span>
              <input
                type="number"
                className="input max-w-[200px]"
                value={dayRate}
                onChange={(e) => setDayRate(Number(e.target.value))}
              />
              <span className="text-sm text-gray-500">/ day</span>
            </div>
          </div>

          <div className="card">
            <h3 className="label">AVAILABILITY</h3>
            <AvailabilityCalendar availability={availability} month="2026-09" />
            <div className="flex gap-3 mt-6">
              <button className="btn-outline">MARK AVAILABLE</button>
              <button className="btn-outline">MARK UNAVAILABLE</button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              You can specify full day, half day, multiple consecutive days,
              recurring availability, holiday/unavailable periods, and booked
              periods.
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-between pt-8 max-w-5xl mx-auto">
        <Link href="/register/consultant/skills" className="btn-outline">
          BACK
        </Link>
        <Link href="/register/consultant/review" className="btn-primary">
          SAVE AVAILABILITY
        </Link>
      </div>
    </div>
  );
}
