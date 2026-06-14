"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import {
  BILLING_TYPES,
  REFERRAL_PLANS,
  REFERRAL_STATUSES,
  REFERRAL_STATUS_LABELS,
  type BillingType,
  type Referral,
  type ReferralPlan,
  type ReferralStatus,
} from "@/lib/types";

const PLAN_LABELS: Record<ReferralPlan, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  monthly: "Monthly",
  annual: "Annual",
};

interface ReferralFormModalProps {
  open: boolean;
  onClose: () => void;
  partnerId: string;
  referral?: Referral | null;
}

export default function ReferralFormModal({
  open,
  onClose,
  partnerId,
  referral,
}: ReferralFormModalProps) {
  const router = useRouter();
  const isEdit = Boolean(referral);

  const [companyName, setCompanyName] = useState(referral?.company_name ?? "");
  const [contactName, setContactName] = useState(referral?.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(referral?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(referral?.contact_phone ?? "");
  const [plan, setPlan] = useState<ReferralPlan | "">(referral?.plan ?? "");
  const [billingType, setBillingType] = useState<BillingType | "">(referral?.billing_type ?? "");
  const [monthlyValue, setMonthlyValue] = useState(String(referral?.monthly_value ?? 0));
  const [status, setStatus] = useState<ReferralStatus>(referral?.status ?? "lead");
  const [stripeCustomerId, setStripeCustomerId] = useState(referral?.stripe_customer_id ?? "");
  const [notes, setNotes] = useState(referral?.notes ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (companyName.trim().length < 2) return setError("Please enter a company name.");
    const value = Number(monthlyValue);
    if (!Number.isFinite(value) || value < 0) {
      return setError("Monthly value must be a positive number.");
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      partner_id: partnerId,
      company_name: companyName.trim(),
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      plan: plan || null,
      billing_type: billingType || null,
      monthly_value: value,
      status,
      stripe_customer_id: stripeCustomerId.trim() || null,
      notes: notes.trim() || null,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("referrals").update(payload).eq("id", referral!.id)
      : await supabase.from("referrals").insert(payload);

    setLoading(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit referral" : "Add referral"}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div>
          <label htmlFor="rf-company" className="label">Company name</label>
          <input id="rf-company" type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input" placeholder="Acme Inc." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rf-contact-name" className="label">Contact name</label>
            <input id="rf-contact-name" type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className="input" placeholder="—" />
          </div>
          <div>
            <label htmlFor="rf-contact-email" className="label">Contact email</label>
            <input id="rf-contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="input" placeholder="—" />
          </div>
        </div>

        <div>
          <label htmlFor="rf-contact-phone" className="label">Contact phone</label>
          <input id="rf-contact-phone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="input" placeholder="—" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="rf-plan" className="label">Plan</label>
            <select id="rf-plan" value={plan} onChange={(e) => setPlan(e.target.value as ReferralPlan | "")} className="input">
              <option value="">—</option>
              {REFERRAL_PLANS.map((p) => (
                <option key={p} value={p}>{PLAN_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rf-billing" className="label">Billing</label>
            <select id="rf-billing" value={billingType} onChange={(e) => setBillingType(e.target.value as BillingType | "")} className="input">
              <option value="">—</option>
              {BILLING_TYPES.map((b) => (
                <option key={b} value={b}>{BILLING_TYPE_LABELS[b]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rf-value" className="label">Monthly value</label>
            <input id="rf-value" type="number" min="0" step="0.01" value={monthlyValue} onChange={(e) => setMonthlyValue(e.target.value)} className="input" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rf-status" className="label">Status</label>
            <select id="rf-status" value={status} onChange={(e) => setStatus(e.target.value as ReferralStatus)} className="input">
              {REFERRAL_STATUSES.map((s) => (
                <option key={s} value={s}>{REFERRAL_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rf-stripe" className="label">Stripe customer ID</label>
            <input id="rf-stripe" type="text" value={stripeCustomerId} onChange={(e) => setStripeCustomerId(e.target.value)} className="input" placeholder="cus_..." />
          </div>
        </div>

        <div>
          <label htmlFor="rf-notes" className="label">Notes</label>
          <textarea id="rf-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input resize-none" placeholder="—" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving…" : isEdit ? "Save changes" : "Add referral"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
