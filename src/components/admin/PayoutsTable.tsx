"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PayoutStatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PayoutRequest } from "@/lib/types";
import PayoutFormModal from "@/components/admin/PayoutFormModal";

export default function PayoutsTable({
  partnerId,
  payouts,
}: {
  partnerId: string;
  payouts: PayoutRequest[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PayoutRequest | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(payout: PayoutRequest) {
    setEditing(payout);
    setModalOpen(true);
  }

  async function handleDelete(payout: PayoutRequest) {
    if (!window.confirm(`Delete this payout request of ${formatCurrency(Number(payout.amount))}?`)) {
      return;
    }
    setDeletingId(payout.id);
    const supabase = createClient();
    const { error } = await supabase.from("payout_requests").delete().eq("id", payout.id);
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
        <h2 className="text-base font-semibold text-navy-800">Payout requests</h2>
        <button type="button" onClick={openCreate} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add payout
        </button>
      </div>

      {payouts.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">No payout requests yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Record payouts owed to this agent and track their status.
          </p>
        </div>
      ) : (
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Paid</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-navy-800">{payout.period ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold text-navy-800">{formatCurrency(Number(payout.amount))}</td>
                    <td className="px-4 py-3 text-slate-500">{payout.method ?? "—"}</td>
                    <td className="px-4 py-3">
                      <PayoutStatusBadge status={payout.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {payout.paid_at ? formatDate(payout.paid_at) : "—"}
                      {payout.payout_ref ? (
                        <p className="text-xs text-slate-400">{payout.payout_ref}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(payout)}
                          className="text-sm font-medium text-accent-600 hover:text-accent-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(payout)}
                          disabled={deletingId === payout.id}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingId === payout.id ? "Deleting…" : "Delete"}
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

      <PayoutFormModal open={modalOpen} onClose={() => setModalOpen(false)} partnerId={partnerId} payout={editing} />
    </>
  );
}
