"use client";

import Link from "next/link";
import { useState } from "react";

export default function ClientSearchPage() {
  const [filters, setFilters] = useState({
    skills: "Programme Management",
    sector: "Financial Services",
    experience: "10+ years",
    availableFrom: "2026-09-01",
    maxDayRate: "",
    location: "UK / Remote",
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-2xl font-bold text-quedera-navy mb-2">
        FIND A CONSULTANT
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Search by skill, sector, experience, availability or day rate.
      </p>
      <form
        action="/client/results"
        className="card space-y-5"
        onSubmit={(e) => {
          // Use querystring for the demo
          e.preventDefault();
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([k, v]) => {
            if (v) params.set(k, String(v));
          });
          window.location.href = `/client/results?${params.toString()}`;
        }}
      >
        <div>
          <label className="label">Skills</label>
          <input
            className="input"
            value={filters.skills}
            onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
            placeholder="Programme Management"
          />
        </div>
        <div>
          <label className="label">Sector</label>
          <select
            className="input"
            value={filters.sector}
            onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
          >
            <option>Financial Services</option>
            <option>Technology</option>
            <option>Defence</option>
            <option>Government</option>
            <option>Healthcare</option>
            <option>Energy</option>
            <option>Any</option>
          </select>
        </div>
        <div>
          <label className="label">Experience</label>
          <select
            className="input"
            value={filters.experience}
            onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
          >
            <option>Any</option>
            <option>5+ years</option>
            <option>10+ years</option>
            <option>15+ years</option>
          </select>
        </div>
        <div>
          <label className="label">Available from</label>
          <input
            type="date"
            className="input"
            value={filters.availableFrom}
            onChange={(e) => setFilters({ ...filters, availableFrom: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Maximum day rate</label>
          <div className="flex items-center gap-3">
            <span>£</span>
            <input
              type="number"
              className="input"
              value={filters.maxDayRate}
              onChange={(e) => setFilters({ ...filters, maxDayRate: e.target.value })}
              placeholder="1500"
            />
          </div>
        </div>
        <div>
          <label className="label">Location</label>
          <select
            className="input"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          >
            <option>UK / Remote</option>
            <option>London</option>
            <option>UK only</option>
            <option>Remote only</option>
            <option>Any</option>
          </select>
        </div>
        <div className="flex justify-between pt-4">
          <Link href="/client/dashboard" className="btn-outline">
            CANCEL
          </Link>
          <button type="submit" className="btn-primary">
            SEARCH
          </button>
        </div>
      </form>
    </div>
  );
}
