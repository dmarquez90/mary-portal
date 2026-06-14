"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ReferralStatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/format";
import type { Referral } from "@/lib/types";
import ReferralFormModal from "@/components/admin/ReferralFormModal";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default function ReferralsTable({
  partnerId,
  referrals,
}: {
  partnerId: string;
  referrals: Referral[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Referral | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(referral: Referral) {
    setEditing(referral);
    setModalOpen(true);
  }

  async function handleDelete(referral: Referral) {
    if (!window.confirm(`Remove ${referral.company_name} from this agent's referrals?`)) {
      return;
    }
    setDeletingId(referral.id);
    const supabase = createClient();
    const { error } = await supabase.from("referrals").delete().eq("id", referral.id);
    setDeletingId(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-navy-800">Referrals</h2>
        <button type="button" onClick={openCreate} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add referral
        </button>
      </div>

      {referrals.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">No referrals yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Add companies this agent has referred to MARY.
          </p>
        </div>
      ) : (
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Monthly value</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy-800">{referral.company_name}</p>
                      {referral.stripe_customer_id ? (
                        <p className="text-xs text-slate-400">{referral.stripe_customer_id}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {referral.contact_name ?? "—"}
                      {referral.contact_email ? (
                        <p className="text-xs text-slate-400">{referral.contact_email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {referral.plan ? PLAN_LABELS[referral.plan] : "—"}
                      {referral.billing_type ? (
                        <span className="text-xs text-slate-400"> · {referral.billing_type}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <ReferralStatusBadge status={referral.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(referral.monthly_value))}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(referral)}
                          className="text-sm font-medium text-accent-600 hover:text-accent-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(referral)}
                          disabled={deletingId === referral.id}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingId === referral.id ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ReferralFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        partnerId={partnerId}
        referral={editing}
      />
    </>
  );
}
