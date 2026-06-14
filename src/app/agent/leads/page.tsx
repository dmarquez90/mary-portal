import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";
import { LeadStatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";
import type { Lead } from "@/lib/types";

export const metadata: Metadata = { title: "My Leads" };
export const dynamic = "force-dynamic";

export default async function AgentLeadsPage() {
  const supabase = createServerSupabase();

  // RLS returns only this agent's leads.
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">My Leads</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everyone who submitted the form through your referral link. Status is
          managed by the admin team.
        </p>
      </div>

      <div className="card">
        {leads.length === 0 ? (
          <EmptyState
            title="No leads yet"
            hint="Share your referral link — submissions will show up here automatically."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th">Prospect</th>
                  <th className="table-th">Contact</th>
                  <th className="table-th">Company</th>
                  <th className="table-th">Received</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id}>
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
                    <td className="table-td max-w-[240px]">
                      <p className="truncate" title={lead.company_name}>
                        {lead.company_name}
                      </p>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      {formatDateTime(lead.created_at)}
                    </td>
                    <td className="table-td">
                      <LeadStatusBadge status={lead.status} />
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
