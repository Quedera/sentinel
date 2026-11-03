"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-2xl font-bold text-quedera-navy mb-2">LOGIN</h1>
      <p className="text-sm text-quedera-navy/50 mb-8">
        Sign in to your QUEDERA SENTINEL account.
      </p>
      <form className="card space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          SIGN IN
        </button>
      </form>
      <p className="text-sm text-quedera-navy/50 mt-6 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/register/consultant" className="text-quedera-emerald font-semibold">
          Register as consultant
        </Link>{" "}
        or{" "}
        <Link href="/register/client" className="text-quedera-emerald font-semibold">
          Register as client
        </Link>
      </p>
    </div>
  );
}
