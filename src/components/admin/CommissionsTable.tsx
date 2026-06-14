"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CommissionStatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Commission, Referral } from "@/lib/types";
import CommissionFormModal from "@/components/admin/CommissionFormModal";

export default function CommissionsTable({
  partnerId,
  commissions,
  referrals,
}: {
  partnerId: string;
  commissions: Commission[];
  referrals: Referral[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Commission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const referralMap = new Map(referrals.map((r) => [r.id, r.company_name]));

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(commission: Commission) {
    setEditing(commission);
    setModalOpen(true);
  }

  async function handleDelete(commission: Commission) {
    if (!window.confirm(`Delete this ${commission.period} commission of ${formatCurrency(Number(commission.amount))}?`)) {
      return;
    }
    setDeletingId(commission.id);
    const supabase = createClient();
    const { error } = await supabase.from("commissions_legacy").delete().eq("id", commission.id);
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
        <h2 className="text-base font-semibold text-navy-800">Commissions</h2>
        <button type="button" onClick={openCreate} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add commission
        </button>
      </div>

      {commissions.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">No commissions yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Record commissions earned by this agent for each billing period.
          </p>
        </div>
      ) : (
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 font-semibold">Referral</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Paid</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-navy-800">{commission.period}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {commission.referral_id ? referralMap.get(commission.referral_id) ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-navy-800">{formatCurrency(Number(commission.amount))}</td>
                    <td className="px-4 py-3">
                      <CommissionStatusBadge status={commission.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {commission.paid_at ? formatDate(commission.paid_at) : "—"}
                      {commission.payout_ref ? (
                        <p className="text-xs text-slate-400">{commission.payout_ref}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(commission)}
                          className="text-sm font-medium text-accent-600 hover:text-accent-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(commission)}
                          disabled={deletingId === commission.id}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingId === commission.id ? "Deleting…" : "Delete"}
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

      <CommissionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        partnerId={partnerId}
        referrals={referrals}
        commission={editing}
      />
    </>
  );
}
