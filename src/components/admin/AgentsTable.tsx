"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/EmptyState";
import CopyLinkButton from "@/components/CopyLinkButton";
import { formatCurrency } from "@/lib/format";
import type { AgentWithStats } from "@/lib/types";

interface AgentsTableProps {
  initialAgents: AgentWithStats[];
}

export default function AgentsTable({ initialAgents }: AgentsTableProps) {
  const supabase = useMemo(() => createClient(), []);
  const [agents, setAgents] = useState(initialAgents);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus(agent: AgentWithStats) {
    const nextStatus = agent.status === "active" ? "inactive" : "active";
    setUpdatingId(agent.id);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", agent.id);
    setUpdatingId(null);

    if (updateError) {
      setError(`Could not update agent: ${updateError.message}`);
      return;
    }
    setAgents((prev) =>
      prev.map((a) => (a.id === agent.id ? { ...a, status: nextStatus } : a)),
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card">
        {agents.length === 0 ? (
          <EmptyState
            title="No agents yet"
            hint="Create your first agent above — they'll get a unique referral link to share."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th">Agent</th>
                  <th className="table-th">Ref code</th>
                  <th className="table-th">Leads</th>
                  <th className="table-th">Contracts</th>
                  <th className="table-th">Earned</th>
                  <th className="table-th">Paid</th>
                  <th className="table-th">Per contract</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => (
                  <tr key={agent.id} className={agent.status === "inactive" ? "opacity-60" : ""}>
                    <td className="table-td">
                      <p className="font-medium text-slate-900">{agent.full_name}</p>
                      <p className="text-xs text-slate-400">{agent.email}</p>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-navy-800">
                        {agent.ref_code}
                      </code>
                    </td>
                    <td className="table-td">{agent.total_leads}</td>
                    <td className="table-td">{agent.contracts_signed}</td>
                    <td className="table-td whitespace-nowrap font-semibold text-navy-800">
                      {formatCurrency(agent.commissions_earned)}
                    </td>
                    <td className="table-td whitespace-nowrap text-accent-700">
                      {formatCurrency(agent.commissions_paid)}
                    </td>
                    <td className="table-td whitespace-nowrap">
                      {formatCurrency(Number(agent.commission_per_contract))}
                    </td>
                    <td className="table-td">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          agent.status === "active"
                            ? "bg-accent-50 text-accent-700 ring-accent-600/20"
                            : "bg-slate-100 text-slate-500 ring-slate-500/20"
                        }`}
                      >
                        {agent.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {agent.ref_code ? <CopyLinkButton refCode={agent.ref_code} /> : null}
                        <button
                          type="button"
                          disabled={updatingId === agent.id}
                          onClick={() => toggleStatus(agent)}
                          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                            agent.status === "active"
                              ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                              : "border border-accent-300 bg-white text-accent-700 hover:bg-accent-50"
                          }`}
                        >
                          {updatingId === agent.id
                            ? "Saving…"
                            : agent.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400">
        Deactivating an agent disables their referral link and portal access.
        Their historical leads and commissions are kept.
      </p>
    </div>
  );
}
