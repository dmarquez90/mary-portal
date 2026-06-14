"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/EmptyState";
import { formatDateTime } from "@/lib/format";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type Lead,
  type LeadStatus,
  type LeadWithAgent,
  type Profile,
} from "@/lib/types";

interface LeadsTableProps {
  initialLeads: LeadWithAgent[];
  agents: Pick<Profile, "id" | "full_name">[];
}

interface Notice {
  kind: "success" | "error" | "info";
  text: string;
}

export default function LeadsTable({ initialLeads, agents }: LeadsTableProps) {
  const supabase = useMemo(() => createClient(), []);
  const [leads, setLeads] = useState<LeadWithAgent[]>(initialLeads);
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showNotice(next: Notice) {
    setNotice(next);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  }

  // Realtime: stream new leads into the table without a refresh.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function subscribeToLeads() {
      // Realtime evaluates RLS per subscriber, so the socket must carry
      // the admin's JWT (not just the anon key).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      // Unique topic per mount so React Strict Mode's mount/unmount cycle
      // can't tear down the live subscription.
      channel = supabase
        .channel(`admin-leads-${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "leads" },
          async (payload) => {
            const newLead = payload.new as Lead;
            const { data: agent } = await supabase
              .from("profiles")
              .select("full_name, ref_code")
              .eq("id", newLead.agent_id)
              .single();

            setLeads((prev) => {
              if (prev.some((l) => l.id === newLead.id)) return prev;
              return [{ ...newLead, agent: agent ?? null }, ...prev];
            });
            setHighlighted((prev) => new Set(prev).add(newLead.id));
            showNotice({ kind: "info", text: `New lead received: ${newLead.full_name}` });
            setTimeout(() => {
              setHighlighted((prev) => {
                const next = new Set(prev);
                next.delete(newLead.id);
                return next;
              });
            }, 6000);
          },
        )
        .subscribe();
    }

    void subscribeToLeads();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await res.json()) as {
        error?: string;
        warning?: string;
        commissionCreated?: boolean;
      };

      if (!res.ok) {
        showNotice({ kind: "error", text: payload.error ?? "Could not update lead status." });
        return;
      }

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status } : l)),
      );

      if (payload.warning) {
        showNotice({ kind: "error", text: payload.warning });
      } else if (payload.commissionCreated) {
        showNotice({
          kind: "success",
          text: "Contract signed — commission created for the agent.",
        });
      } else {
        showNotice({ kind: "success", text: "Lead status updated." });
      }
    } catch {
      showNotice({ kind: "error", text: "Network error — please try again." });
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = leads.filter(
    (lead) =>
      (statusFilter === "all" || lead.status === statusFilter) &&
      (agentFilter === "all" || lead.agent_id === agentFilter),
  );

  const noticeStyles: Record<Notice["kind"], string> = {
    success: "border-accent-200 bg-accent-50 text-accent-800",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className="space-y-4">
      {notice ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${noticeStyles[notice.kind]}`}
          role="status"
        >
          {notice.text}
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-56">
          <label htmlFor="filter-status" className="label">
            Filter by status
          </label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | LeadStatus)}
            className="input"
          >
            <option value="all">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-56">
          <label htmlFor="filter-agent" className="label">
            Filter by agent
          </label>
          <select
            id="filter-agent"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="input"
          >
            <option value="all">All agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState
            title={leads.length === 0 ? "No leads yet" : "No leads match these filters"}
            hint={
              leads.length === 0
                ? "Leads appear here in real time when prospects submit a referral form."
                : "Try clearing the status or agent filter."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th">Prospect</th>
                  <th className="table-th">Contact</th>
                  <th className="table-th">Company</th>
                  <th className="table-th">Agent</th>
                  <th className="table-th">Received</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`transition-colors ${
                      highlighted.has(lead.id) ? "bg-accent-50" : ""
                    }`}
                  >
                    <td className="table-td">
                      <p className="font-medium text-slate-900">{lead.full_name}</p>
                      {lead.message ? (
                        <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-400" title={lead.message}>
                          “{lead.message}”
                        </p>
                      ) : null}
                    </td>
                    <td className="table-td">
                      <p>{lead.email}</p>
                      <p className="text-xs text-slate-400">{lead.phone}</p>
                    </td>
                    <td className="table-td max-w-[220px]">
                      <p className="truncate" title={lead.company_name}>
                        {lead.company_name}
                      </p>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      {lead.agent?.full_name ?? "—"}
                      <p className="text-xs text-slate-400">{lead.ref_code}</p>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      {formatDateTime(lead.created_at)}
                    </td>
                    <td className="table-td">
                      <select
                        value={lead.status}
                        disabled={updatingId === lead.id}
                        onChange={(e) =>
                          handleStatusChange(lead.id, e.target.value as LeadStatus)
                        }
                        className="input w-44 py-1.5 text-xs"
                        aria-label={`Status for ${lead.full_name}`}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {LEAD_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
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
