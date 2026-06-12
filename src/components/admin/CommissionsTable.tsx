"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/EmptyState";
import { CommissionStatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  COMMISSION_STATUSES,
  COMMISSION_STATUS_LABELS,
  type CommissionStatus,
  type CommissionWithJoins,
} from "@/lib/types";

interface CommissionsTableProps {
  initialCommissions: CommissionWithJoins[];
}

export default function CommissionsTable({ initialCommissions }: CommissionsTableProps) {
  const supabase = useMemo(() => createClient(), []);
  const [commissions, setCommissions] = useState(initialCommissions);
  const [statusFilter, setStatusFilter] = useState<"all" | CommissionStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, status: CommissionStatus) {
    setUpdatingId(id);
    setError(null);
    const { error: updateError } = await supabase
      .from("commissions")
      .update({ status })
      .eq("id", id);
    setUpdatingId(null);

    if (updateError) {
      setError(`Could not update commission: ${updateError.message}`);
      return;
    }
    setCommissions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c)),
    );
  }

  const filtered = commissions.filter(
    (c) => statusFilter === "all" || c.status === statusFilter,
  );

  const totalShown = filtered.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-56">
          <label htmlFor="commission-filter" className="label">
            Filter by status
          </label>
          <select
            id="commission-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | CommissionStatus)}
            className="input"
          >
            <option value="all">All statuses</option>
            {COMMISSION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {COMMISSION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-slate-500">
          {filtered.length} commission{filtered.length === 1 ? "" : "s"} ·{" "}
          <span className="font-semibold text-navy-800">{formatCurrency(totalShown)}</span>
        </p>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState
            title={
              commissions.length === 0
                ? "No commissions yet"
                : "No commissions match this filter"
            }
            hint={
              commissions.length === 0
                ? "Mark a lead as “Contract Signed” and its commission will appear here."
                : "Try a different status filter."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th">Agent</th>
                  <th className="table-th">Lead</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Created</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((commission) => (
                  <tr key={commission.id}>
                    <td className="table-td whitespace-nowrap">
                      <p className="font-medium text-slate-900">
                        {commission.agent?.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {commission.agent?.ref_code ?? ""}
                      </p>
                    </td>
                    <td className="table-td">
                      <p>{commission.lead?.full_name ?? "—"}</p>
                      <p className="max-w-[220px] truncate text-xs text-slate-400">
                        {commission.lead?.property_address ?? ""}
                      </p>
                    </td>
                    <td className="table-td whitespace-nowrap font-semibold text-navy-800">
                      {formatCurrency(Number(commission.amount))}
                    </td>
                    <td className="table-td whitespace-nowrap">
                      {formatDate(commission.created_at)}
                    </td>
                    <td className="table-td">
                      <CommissionStatusBadge status={commission.status} />
                    </td>
                    <td className="table-td whitespace-nowrap">
                      {commission.status === "pending" ? (
                        <button
                          type="button"
                          disabled={updatingId === commission.id}
                          onClick={() => updateStatus(commission.id, "approved")}
                          className="btn-outline px-3 py-1.5 text-xs"
                        >
                          {updatingId === commission.id ? "Saving…" : "Approve"}
                        </button>
                      ) : commission.status === "approved" ? (
                        <button
                          type="button"
                          disabled={updatingId === commission.id}
                          onClick={() => updateStatus(commission.id, "paid")}
                          className="btn-primary px-3 py-1.5 text-xs"
                        >
                          {updatingId === commission.id ? "Saving…" : "Mark paid"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
