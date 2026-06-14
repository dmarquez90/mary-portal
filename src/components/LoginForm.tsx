"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (signInError || !signInData.user) {
      setError(
        signInError?.message === "Invalid login credentials"
          ? "Invalid email or password."
          : signInError?.message ?? "Could not sign in. Please try again.",
      );
      setLoading(false);
      return;
    }

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("role, status")
      .eq("user_id", signInData.user.id)
      .single();

    if (partnerError || !partner) {
      await supabase.auth.signOut();
      setError("No agent profile found for this account. Contact your administrator.");
      setLoading(false);
      return;
    }

    if (partner.status === "suspended") {
      await supabase.auth.signOut();
      setError("Your account has been suspended. Contact your administrator.");
      setLoading(false);
      return;
    }

    router.push(partner.role === "admin" ? "/admin" : "/portal");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
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
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
