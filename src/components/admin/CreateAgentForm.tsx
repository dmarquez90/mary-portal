"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildReferralUrl } from "@/components/CopyLinkButton";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REF_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/;

export default function CreateAgentForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [commission, setCommission] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<string | null>(null);

  function resetForm() {
    setFullName("");
    setEmail("");
    setPassword("");
    setRefCode("");
    setCommission("1000");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessLink(null);

    if (fullName.trim().length < 2) return setError("Please enter the agent's full name.");
    if (!EMAIL_RE.test(email.trim())) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (!REF_CODE_RE.test(refCode.trim())) {
      return setError(
        "Ref code must be 2–30 characters using letters, numbers, hyphens or underscores (e.g. CARLOS-001).",
      );
    }
    const commissionValue = Number(commission);
    if (!Number.isFinite(commissionValue) || commissionValue < 0) {
      return setError("Commission must be a non-negative number.");
    }

    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke("create-agent", {
      body: {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        ref_code: refCode.trim().toUpperCase(),
        commission_per_contract: commissionValue,
      },
    });
    setLoading(false);

    if (fnError) {
      // FunctionsHttpError carries the JSON body with the real reason.
      let message = "Could not create the agent. Please try again.";
      const context = (fnError as { context?: Response }).context;
      if (context && typeof context.json === "function") {
        try {
          const body = (await context.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // keep generic message
        }
      }
      setError(message);
      return;
    }

    const createdCode =
      (data as { agent?: { ref_code?: string } } | null)?.agent?.ref_code ??
      refCode.trim().toUpperCase();
    setSuccessLink(buildReferralUrl(window.location.origin, createdCode));
    resetForm();
    router.refresh();
  }

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-base font-semibold text-navy-800">
          {open ? "New agent" : "+ Create new agent"}
        </span>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {successLink ? (
        <div className="mx-5 mb-4 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
          <p className="font-semibold">Agent created!</p>
          <p className="mt-1 break-all">
            Referral link: <code className="font-mono text-xs">{successLink}</code>
          </p>
        </div>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="border-t border-slate-200 px-5 py-5" noValidate>
          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="agent-name" className="label">
                Full name *
              </label>
              <input
                id="agent-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="Carlos Ramirez"
              />
            </div>
            <div>
              <label htmlFor="agent-email" className="label">
                Email *
              </label>
              <input
                id="agent-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="carlos@example.com"
              />
            </div>
            <div>
              <label htmlFor="agent-password" className="label">
                Password *
              </label>
              <input
                id="agent-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label htmlFor="agent-refcode" className="label">
                Referral code *
              </label>
              <input
                id="agent-refcode"
                type="text"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                className="input font-mono uppercase"
                placeholder="CARLOS-001"
              />
            </div>
            <div>
              <label htmlFor="agent-commission" className="label">
                Commission per contract (USD) *
              </label>
              <input
                id="agent-commission"
                type="number"
                min="0"
                step="50"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="mt-5">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating agent…
                </>
              ) : (
                "Create agent"
              )}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
