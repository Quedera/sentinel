"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();

      if (!payload.ok) {
        setError(payload.error?.message ?? "Sign in failed");
        setBusy(false);
        return;
      }

      // The session cookie is set by the route; land the user somewhere
      // that matches their role.
      const role = payload.data?.role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "CLIENT") router.push("/client/dashboard");
      else router.push("/consultant/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach SENTINEL");
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-2xl font-bold text-quedera-navy mb-2">LOGIN</h1>
      <p className="text-sm text-quedera-navy/50 mb-8">
        Sign in to your QUEDERA SENTINEL account.
      </p>
      <form className="card space-y-4" onSubmit={onSubmit}>
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
            placeholder="........"
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-quedera-amber" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "SIGNING IN..." : "SIGN IN"}
        </button>
      </form>
      <p className="text-sm text-quedera-navy/50 mt-6 text-center">
        Don&apos;t have an account?{" "}
        <Link
          href="/register/consultant"
          className="text-quedera-emerald font-semibold"
        >
          Register as consultant
        </Link>{" "}
        or{" "}
        <Link
          href="/register/client"
          className="text-quedera-emerald font-semibold"
        >
          Register as client
        </Link>
      </p>
    </div>
  );
}
