import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { LeadStatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDateTime, startOfMonthISO } from "@/lib/format";
import type { Commission, LeadWithAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createServerSupabase();

  const [
    { count: totalLeads },
    { count: leadsThisMonth },
    { count: contractsSigned },
    { data: commissionsData },
    { data: recentLeadsData },
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonthISO()),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "contract_signed"),
    supabase.from("commissions").select("amount, status"),
    supabase
      .from("leads")
      .select("*, agent:profiles(full_name, ref_code)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const commissions = (commissionsData ?? []) as Pick<Commission, "amount" | "status">[];
  const pendingTotal = commissions
    .filter((c) => c.status === "pending" || c.status === "approved")
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const paidTotal = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const recentLeads = (recentLeadsData ?? []) as LeadWithAgent[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of referrals, contracts and commissions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Leads" value={String(totalLeads ?? 0)} />
        <StatCard label="Leads This Month" value={String(leadsThisMonth ?? 0)} />
        <StatCard label="Contracts Signed" value={String(contractsSigned ?? 0)} accent />
        <StatCard
          label="Commissions Pending"
          value={formatCurrency(pendingTotal)}
          hint="Pending + approved, not yet paid"
        />
        <StatCard label="Commissions Paid" value={formatCurrency(paidTotal)} accent />
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-navy-800">Latest leads</h2>
          <Link
            href="/admin/leads"
            className="text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            View all →
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <EmptyState
            title="No leads yet"
            hint="Leads appear here as soon as a prospect submits a referral form."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th">Prospect</th>
                  <th className="table-th">Agent</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="table-td">
                      <p className="font-medium text-slate-900">{lead.full_name}</p>
                      <p className="text-xs text-slate-400">{lead.email}</p>
                    </td>
                    <td className="table-td">
                      {lead.agent?.full_name ?? "—"}
                      <span className="ml-1.5 text-xs text-slate-400">({lead.ref_code})</span>
                    </td>
                    <td className="table-td">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="table-td whitespace-nowrap">{formatDateTime(lead.created_at)}</td>
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
