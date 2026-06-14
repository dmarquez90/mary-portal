"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (!EMAIL_RE.test(email.trim())) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    const supabase = createClient();
    const { data, error: fnError } = await supabase.functions.invoke("signup-agent", {
      body: {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      },
    });
    setLoading(false);

    if (fnError) {
      let message = "Could not create your account. Please try again.";
      const context = (fnError as { context?: Response }).context;
      if (context && typeof context.json === "function") {
        try {
          const errBody = (await context.json()) as { error?: string };
          if (errBody.error) message = errBody.error;
        } catch {
          // keep generic message
        }
      }
      setError(message);
      return;
    }

    void data;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
          <svg className="h-8 w-8 text-accent-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-navy-800">Request received!</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          Thanks, {fullName.split(" ")[0] || "there"}. Your account is pending
          approval. An administrator will review your request and activate
          your access — you&apos;ll be able to sign in once that&apos;s done.
        </p>
        <div className="mt-6">
          <Link href="/login" className="btn-outline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <div>
        <label htmlFor="signup-name" className="label">
          Full name
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
          placeholder="Jane Smith"
        />
      </div>

      <div>
        <label htmlFor="signup-email" className="label">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="label">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="Min. 8 characters"
        />
      </div>

      <div>
        <label htmlFor="signup-confirm-password" className="label">
          Confirm password
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Submitting…
          </>
        ) : (
          "Create account"
        )}
      </button>
    </form>
  );
}
