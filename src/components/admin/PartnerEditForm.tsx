"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ONBOARDING_STATUSES,
  ONBOARDING_STATUS_LABELS,
  PARTNER_LEVELS,
  PARTNER_LEVEL_LABELS,
  PARTNER_STATUSES,
  PARTNER_TYPES,
  type OnboardingStatus,
  type Partner,
  type PartnerLevel,
  type PartnerStatus,
  type PartnerType,
} from "@/lib/types";

const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  agent: "Agent",
  reseller: "Reseller",
};

const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
};

export default function PartnerEditForm({ partner }: { partner: Partner }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState(partner.full_name);
  const [company, setCompany] = useState(partner.company ?? "");
  const [country, setCountry] = useState(partner.country ?? "");
  const [phone, setPhone] = useState(partner.phone ?? "");
  const [notes, setNotes] = useState(partner.notes ?? "");
  const [partnerType, setPartnerType] = useState<PartnerType>(partner.partner_type);
  const [level, setLevel] = useState<PartnerLevel>(partner.level);
  const [commissionPct, setCommissionPct] = useState(String(partner.commission_pct));
  const [status, setStatus] = useState<PartnerStatus>(partner.status);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(
    partner.onboarding_status,
  );
  const [refCode, setRefCode] = useState(partner.ref_code ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (fullName.trim().length < 2) return setError("Please enter a full name.");
    const pct = Number(commissionPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return setError("Commission must be a number between 0 and 100.");
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("partners")
      .update({
        full_name: fullName.trim(),
        company: company.trim() || null,
        country: country.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        partner_type: partnerType,
        level,
        commission_pct: pct,
        status,
        onboarding_status: onboardingStatus,
        ref_code: refCode.trim() ? refCode.trim().toUpperCase() : null,
      })
      .eq("id", partner.id);
    setSaving(false);

    if (updateError) {
      setError(
        updateError.code === "23505"
          ? "This referral code is already in use by another partner."
          : updateError.message,
      );
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6" noValidate>
      <h2 className="text-base font-semibold text-navy-800">Partner details</h2>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700" role="status">
          Changes saved.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pe-name" className="label">Full name</label>
          <input id="pe-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="pe-email" className="label">Email</label>
          <input id="pe-email" type="email" value={partner.email} disabled className="input bg-slate-50 text-slate-500" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pe-company" className="label">Company</label>
          <input id="pe-company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="input" placeholder="—" />
        </div>
        <div>
          <label htmlFor="pe-country" className="label">Country</label>
          <input id="pe-country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="input" placeholder="—" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pe-phone" className="label">Phone</label>
          <input id="pe-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="—" />
        </div>
        <div>
          <label htmlFor="pe-refcode" className="label">Referral code</label>
          <input id="pe-refcode" type="text" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} className="input uppercase" placeholder="e.g. MATH01" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="pe-type" className="label">Partner type</label>
          <select id="pe-type" value={partnerType} onChange={(e) => setPartnerType(e.target.value as PartnerType)} className="input">
            {PARTNER_TYPES.map((t) => (
              <option key={t} value={t}>{PARTNER_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pe-level" className="label">Level</label>
          <select id="pe-level" value={level} onChange={(e) => setLevel(e.target.value as PartnerLevel)} className="input">
            {PARTNER_LEVELS.map((l) => (
              <option key={l} value={l}>{PARTNER_LEVEL_LABELS[l]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pe-commission" className="label">Commission %</label>
          <input id="pe-commission" type="number" min="0" max="100" step="0.5" value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} className="input" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pe-status" className="label">Account status</label>
          <select id="pe-status" value={status} onChange={(e) => setStatus(e.target.value as PartnerStatus)} className="input">
            {PARTNER_STATUSES.map((s) => (
              <option key={s} value={s}>{PARTNER_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pe-onboarding" className="label">Onboarding status</label>
          <select id="pe-onboarding" value={onboardingStatus} onChange={(e) => setOnboardingStatus(e.target.value as OnboardingStatus)} className="input">
            {ONBOARDING_STATUSES.map((o) => (
              <option key={o} value={o}>{ONBOARDING_STATUS_LABELS[o]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="pe-notes" className="label">Internal notes</label>
        <textarea
          id="pe-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="input resize-none"
          placeholder="Internal notes about this partner (not visible to them)…"
        />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
