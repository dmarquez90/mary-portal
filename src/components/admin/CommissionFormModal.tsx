"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import {
  COMMISSION_STATUSES,
  COMMISSION_STATUS_LABELS,
  type Commission,
  type CommissionStatus,
  type Referral,
} from "@/lib/types";

interface CommissionFormModalProps {
  open: boolean;
  onClose: () => void;
  partnerId: string;
  referrals: Referral[];
  commission?: Commission | null;
}

export default function CommissionFormModal({
  open,
  onClose,
  partnerId,
  referrals,
  commission,
}: CommissionFormModalProps) {
  const router = useRouter();
  const isEdit = Boolean(commission);

  const [referralId, setReferralId] = useState(commission?.referral_id ?? "");
  const [period, setPeriod] = useState(commission?.period ?? "");
  const [amount, setAmount] = useState(String(commission?.amount ?? ""));
  const [status, setStatus] = useState<CommissionStatus>(commission?.status ?? "pending");
  const [payoutRef, setPayoutRef] = useState(commission?.payout_ref ?? "");
  const [notes, setNotes] = useState(commission?.notes ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^\d{4}-\d{2}$/.test(period.trim())) {
      return setError("Period must be in YYYY-MM format, e.g. 2026-06.");
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      return setError("Amount must be a positive number.");
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      partner_id: partnerId,
      referral_id: referralId || null,
      period: period.trim(),
      amount: amountNum,
      status,
      payout_ref: payoutRef.trim() || null,
      notes: notes.trim() || null,
      paid_at: status === "paid" ? (commission?.paid_at ?? new Date().toISOString()) : null,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("commissions_legacy").update(payload).eq("id", commission!.id)
      : await supabase.from("commissions_legacy").insert(payload);

    setLoading(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit commission" : "Add commission"}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cf-period" className="label">Period</label>
            <input id="cf-period" type="text" required value={period} onChange={(e) => setPeriod(e.target.value)} className="input" placeholder="2026-06" />
          </div>
          <div>
            <label htmlFor="cf-amount" className="label">Amount</label>
            <input id="cf-amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="input" placeholder="0.00" />
          </div>
        </div>

        <div>
          <label htmlFor="cf-referral" className="label">Referral <span className="font-normal text-slate-400">(optional)</span></label>
          <select id="cf-referral" value={referralId} onChange={(e) => setReferralId(e.target.value)} className="input">
            <option value="">—</option>
            {referrals.map((r) => (
              <option key={r.id} value={r.id}>{r.company_name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cf-status" className="label">Status</label>
            <select id="cf-status" value={status} onChange={(e) => setStatus(e.target.value as CommissionStatus)} className="input">
              {COMMISSION_STATUSES.map((s) => (
                <option key={s} value={s}>{COMMISSION_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cf-payoutref" className="label">Payout reference</label>
            <input id="cf-payoutref" type="text" value={payoutRef} onChange={(e) => setPayoutRef(e.target.value)} className="input" placeholder="e.g. invoice ID" />
          </div>
        </div>

        <div>
          <label htmlFor="cf-notes" className="label">Notes</label>
          <textarea id="cf-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input resize-none" placeholder="—" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving…" : isEdit ? "Save changes" : "Add commission"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
