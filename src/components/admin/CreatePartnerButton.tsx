"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import {
  ONBOARDING_STATUSES,
  ONBOARDING_STATUS_LABELS,
  PARTNER_LEVELS,
  PARTNER_LEVEL_LABELS,
  PARTNER_STATUSES,
  PARTNER_TYPES,
  type OnboardingStatus,
  type PartnerLevel,
  type PartnerStatus,
  type PartnerType,
} from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  agent: "Agent",
  reseller: "Reseller",
};

const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
};

export default function CreatePartnerButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [partnerType, setPartnerType] = useState<PartnerType>("agent");
  const [level, setLevel] = useState<PartnerLevel>("bronze");
  const [commissionPct, setCommissionPct] = useState("15");
  const [status, setStatus] = useState<PartnerStatus>("active");
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>("active");
  const [refCode, setRefCode] = useState("");

  function resetForm() {
    setFullName("");
    setEmail("");
    setPassword("");
    setCompany("");
    setCountry("");
    setPhone("");
    setPartnerType("agent");
    setLevel("bronze");
    setCommissionPct("15");
    setStatus("active");
    setOnboardingStatus("active");
    setRefCode("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) return setError("Please enter a full name.");
    if (!EMAIL_RE.test(email.trim())) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    const pct = Number(commissionPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return setError("Commission must be a number between 0 and 100.");
    }

    setLoading(true);
    const supabase = createClient();
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      setLoading(false);
      setError("Your session expired. Please sign in again.");
      return;
    }

    const { data, error: fnError } = await supabase.functions.invoke("admin-create-partner", {
      body: {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        company: company.trim(),
        country: country.trim(),
        phone: phone.trim(),
        partner_type: partnerType,
        level,
        commission_pct: pct,
        status,
        onboarding_status: onboardingStatus,
        ref_code: refCode.trim(),
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setLoading(false);

    if (fnError) {
      let message = "Could not create the agent. Please try again.";
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
    setOpen(false);
    resetForm();
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        New agent
      </button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Create agent"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cp-name" className="label">Full name</label>
              <input id="cp-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Jane Smith" />
            </div>
            <div>
              <label htmlFor="cp-email" className="label">Email</label>
              <input id="cp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="jane@example.com" />
            </div>
          </div>

          <div>
            <label htmlFor="cp-password" className="label">Temporary password</label>
            <input id="cp-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Min. 8 characters" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cp-company" className="label">Company <span className="font-normal text-slate-400">(optional)</span></label>
              <input id="cp-company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="input" placeholder="Acme Inc." />
            </div>
            <div>
              <label htmlFor="cp-country" className="label">Country <span className="font-normal text-slate-400">(optional)</span></label>
              <input id="cp-country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="input" placeholder="United States" />
            </div>
          </div>

          <div>
            <label htmlFor="cp-phone" className="label">Phone <span className="font-normal text-slate-400">(optional)</span></label>
            <input id="cp-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="(555) 123-4567" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cp-type" className="label">Account type</label>
              <select id="cp-type" value={partnerType} onChange={(e) => setPartnerType(e.target.value as PartnerType)} className="input">
                {PARTNER_TYPES.map((t) => (
                  <option key={t} value={t}>{PARTNER_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cp-level" className="label">Level</label>
              <select id="cp-level" value={level} onChange={(e) => setLevel(e.target.value as PartnerLevel)} className="input">
                {PARTNER_LEVELS.map((l) => (
                  <option key={l} value={l}>{PARTNER_LEVEL_LABELS[l]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cp-commission" className="label">Commission %</label>
              <input id="cp-commission" type="number" min="0" max="100" step="0.5" value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="cp-refcode" className="label">Referral code <span className="font-normal text-slate-400">(optional)</span></label>
              <input id="cp-refcode" type="text" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} className="input uppercase" placeholder="MATH01" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cp-status" className="label">Account status</label>
              <select id="cp-status" value={status} onChange={(e) => setStatus(e.target.value as PartnerStatus)} className="input">
                {PARTNER_STATUSES.map((s) => (
                  <option key={s} value={s}>{PARTNER_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cp-onboarding" className="label">Onboarding</label>
              <select id="cp-onboarding" value={onboardingStatus} onChange={(e) => setOnboardingStatus(e.target.value as OnboardingStatus)} className="input">
                {ONBOARDING_STATUSES.map((o) => (
                  <option key={o} value={o}>{ONBOARDING_STATUS_LABELS[o]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="btn-outline"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating…" : "Create agent"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
