"use client";

import Link from "next/link";
import { useState } from "react";

export default function ClientRegistrationPage() {
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    password: "",
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="text-2xl font-bold text-quedera-navy mb-2">
        CLIENT REGISTRATION
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Register your organisation to find and engage consultants.
      </p>
      <form className="card space-y-4">
        <div>
          <label className="label">Company name</label>
          <input
            className="input"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            placeholder="ABC Corporation"
            required
          />
        </div>
        <div>
          <label className="label">Contact name</label>
          <input
            className="input"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            placeholder="Sarah Mitchell"
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
            placeholder="sarah.mitchell@abc-corp.example"
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="flex justify-between pt-4">
          <Link href="/" className="btn-outline">
            CANCEL
          </Link>
          <Link href="/client/search" className="btn-primary">
            CREATE ACCOUNT
          </Link>
        </div>
      </form>
    </div>
  );
}
