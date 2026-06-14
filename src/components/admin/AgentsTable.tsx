"use client";

import { Fragment, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/EmptyState";
import CopyLinkButton from "@/components/CopyLinkButton";
import { formatCurrency } from "@/lib/format";
import type { AgentWithStats } from "@/lib/types";

interface AgentsTableProps {
  initialAgents: AgentWithStats[];
}

const REF_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/;

export default function AgentsTable({ initialAgents }: AgentsTableProps) {
  const supabase = useMemo(() => createClient(), []);
  const [agents, setAgents] = useState(initialAgents);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inline "activate" form state, keyed by agent id.
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [refCodeDraft, setRefCodeDraft] = useState("");
  const [commissionDraft, setCommissionDraft] = useState("1000");

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

  function startActivation(agent: AgentWithStats) {
    setError(null);
    setActivatingId(agent.id);
    setRefCodeDraft("");
    setCommissionDraft("1000");
  }

  async function confirmActivation(agent: AgentWithStats) {
    const refCode = refCodeDraft.trim().toUpperCase();
    if (!REF_CODE_RE.test(refCode)) {
      setError(
        "Ref code must be 2–30 characters using letters, numbers, hyphens or underscores (e.g. CARLOS-001).",
      );
      return;
    }
    const commission = Number(commissionDraft);
    if (!Number.isFinite(commission) || commission < 0) {
      setError("Commission must be a non-negative number.");
      return;
    }

    setUpdatingId(agent.id);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ref_code: refCode,
        commission_per_contract: commission,
        status: "active",
      })
      .eq("id", agent.id);
    setUpdatingId(null);

    if (updateError) {
      const message = updateError.message.includes("duplicate")
        ? `Referral code ${refCode} is already in use.`
        : `Could not activate agent: ${updateError.message}`;
      setError(message);
      return;
    }

    setAgents((prev) =>
      prev.map((a) =>
        a.id === agent.id
          ? { ...a, ref_code: refCode, commission_per_contract: commission, status: "active" }
          : a,
      ),
    );
    setActivatingId(null);
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
                  <Fragment key={agent.id}>
                    <tr className={agent.status === "inactive" ? "opacity-60" : ""}>
                      <td className="table-td">
                        <p className="font-medium text-slate-900">{agent.full_name}</p>
                        <p className="text-xs text-slate-400">{agent.email}</p>
                      </td>
                      <td className="table-td whitespace-nowrap">
                        {agent.ref_code ? (
                          <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-navy-800">
                            {agent.ref_code}
                          </code>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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
                        {agent.status === "pending"
                          ? "—"
                          : formatCurrency(Number(agent.commission_per_contract))}
                      </td>
                      <td className="table-td">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            agent.status === "active"
                              ? "bg-accent-50 text-accent-700 ring-accent-600/20"
                              : agent.status === "pending"
                                ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                : "bg-slate-100 text-slate-500 ring-slate-500/20"
                          }`}
                        >
                          {agent.status === "active"
                            ? "Active"
                            : agent.status === "pending"
                              ? "Pending"
                              : "Inactive"}
                        </span>
                      </td>
                      <td className="table-td whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {agent.ref_code ? <CopyLinkButton refCode={agent.ref_code} /> : null}
                          {agent.status === "pending" ? (
                            <button
                              type="button"
                              disabled={updatingId === agent.id}
                              onClick={() =>
                                activatingId === agent.id
                                  ? setActivatingId(null)
                                  : startActivation(agent)
                              }
                              className="rounded-md border border-accent-300 bg-white px-2.5 py-1.5 text-xs font-medium text-accent-700 transition hover:bg-accent-50 disabled:opacity-60"
                            >
                              {activatingId === agent.id ? "Cancel" : "Activate"}
                            </button>
                          ) : (
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
                          )}
                        </div>
                      </td>
                    </tr>
                    {agent.status === "pending" && activatingId === agent.id ? (
                      <tr key={`${agent.id}-activate`}>
                        <td colSpan={9} className="bg-accent-50/40 px-4 py-4">
                          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                            <div>
                              <label className="label" htmlFor={`refcode-${agent.id}`}>
                                Referral code *
                              </label>
                              <input
                                id={`refcode-${agent.id}`}
                                type="text"
                                value={refCodeDraft}
                                onChange={(e) => setRefCodeDraft(e.target.value.toUpperCase())}
                                className="input font-mono uppercase"
                                placeholder="CARLOS-001"
                              />
                            </div>
                            <div>
                              <label className="label" htmlFor={`commission-${agent.id}`}>
                                Commission per contract (USD) *
                              </label>
                              <input
                                id={`commission-${agent.id}`}
                                type="number"
                                min="0"
                                step="50"
                                value={commissionDraft}
                                onChange={(e) => setCommissionDraft(e.target.value)}
                                className="input"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={updatingId === agent.id}
                              onClick={() => confirmActivation(agent)}
                              className="btn-primary whitespace-nowrap disabled:opacity-60"
                            >
                              {updatingId === agent.id ? "Activating…" : "Confirm activation"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400">
        Pending agents signed up themselves and need a referral code and
        commission rate before they can access the portal. Deactivating an
        agent disables their referral link and portal access — their
        historical leads and commissions are kept.
      </p>
    </div>
  );
}
