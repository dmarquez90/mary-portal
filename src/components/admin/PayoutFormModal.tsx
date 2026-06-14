"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import {
  PAYOUT_STATUSES,
  PAYOUT_STATUS_LABELS,
  type PayoutRequest,
  type PayoutStatus,
} from "@/lib/types";

interface PayoutFormModalProps {
  open: boolean;
  onClose: () => void;
  partnerId: string;
  payout?: PayoutRequest | null;
}

export default function PayoutFormModal({ open, onClose, partnerId, payout }: PayoutFormModalProps) {
  const router = useRouter();
  const isEdit = Boolean(payout);

  const [period, setPeriod] = useState(payout?.period ?? "");
  const [amount, setAmount] = useState(String(payout?.amount ?? ""));
  const [method, setMethod] = useState(payout?.method ?? "");
  const [status, setStatus] = useState<PayoutStatus>(payout?.status ?? "pending");
  const [payoutRef, setPayoutRef] = useState(payout?.payout_ref ?? "");
  const [adminNotes, setAdminNotes] = useState(payout?.admin_notes ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return setError("Amount must be a positive number.");
    }
    if (period.trim() && !/^\d{4}-\d{2}$/.test(period.trim())) {
      return setError("Period must be in YYYY-MM format, e.g. 2026-06.");
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      partner_id: partnerId,
      amount: amountNum,
      period: period.trim() || null,
      method: method.trim() || null,
      status,
      payout_ref: payoutRef.trim() || null,
      admin_notes: adminNotes.trim() || null,
      paid_at: status === "paid" ? (payout?.paid_at ?? new Date().toISOString()) : null,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("payout_requests").update(payload).eq("id", payout!.id)
      : await supabase.from("payout_requests").insert(payload);

    setLoading(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit payout request" : "New payout request"}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        {payout?.payout_details ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Agent-provided details</p>
            <pre className="whitespace-pre-wrap break-words text-xs text-slate-600">
              {JSON.stringify(payout.payout_details, null, 2)}
            </pre>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-amount" className="label">Amount</label>
            <input id="pf-amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="input" placeholder="0.00" />
          </div>
          <div>
            <label htmlFor="pf-period" className="label">Period <span className="font-normal text-slate-400">(optional)</span></label>
            <input id="pf-period" type="text" value={period} onChange={(e) => setPeriod(e.target.value)} className="input" placeholder="2026-06" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-method" className="label">Method</label>
            <input id="pf-method" type="text" value={method} onChange={(e) => setMethod(e.target.value)} className="input" placeholder="e.g. Bank transfer, PayPal" />
          </div>
          <div>
            <label htmlFor="pf-status" className="label">Status</label>
            <select id="pf-status" value={status} onChange={(e) => setStatus(e.target.value as PayoutStatus)} className="input">
              {PAYOUT_STATUSES.map((s) => (
                <option key={s} value={s}>{PAYOUT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="pf-payoutref" className="label">Payout reference</label>
          <input id="pf-payoutref" type="text" value={payoutRef} onChange={(e) => setPayoutRef(e.target.value)} className="input" placeholder="e.g. transaction ID" />
        </div>

        <div>
          <label htmlFor="pf-notes" className="label">Admin notes</label>
          <textarea id="pf-notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="input resize-none" placeholder="—" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving…" : isEdit ? "Save changes" : "Add payout"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
