import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createServerSupabase();

  const [{ count: totalPartners }, { count: activePartners }, { count: pendingPartners }, { data: commissions }, { count: activeReferrals }] =
    await Promise.all([
      supabase.from("partners").select("id", { count: "exact", head: true }).eq("role", "partner"),
      supabase
        .from("partners")
        .select("id", { count: "exact", head: true })
        .eq("role", "partner")
        .eq("status", "active"),
      supabase
        .from("partners")
        .select("id", { count: "exact", head: true })
        .eq("role", "partner")
        .eq("status", "pending"),
      supabase.from("commissions_legacy").select("amount, status"),
      supabase.from("referrals").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

  const commissionRows = commissions ?? [];
  const pendingCommissions = commissionRows
    .filter((c) => c.status === "pending" || c.status === "approved")
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const paidCommissions = commissionRows
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of agents, referrals, and commissions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Agents" value={String(totalPartners ?? 0)} />
        <StatCard label="Active Agents" value={String(activePartners ?? 0)} accent />
        <StatCard label="Pending Approval" value={String(pendingPartners ?? 0)} />
        <StatCard label="Active Referrals" value={String(activeReferrals ?? 0)} />
        <StatCard
          label="Commissions Pending"
          value={formatCurrency(pendingCommissions)}
          hint="Pending + approved, not yet paid"
        />
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-navy-800">Commissions paid to date</h2>
        <p className="mt-2 text-3xl font-bold text-accent-600">{formatCurrency(paidCommissions)}</p>
      </div>
    </div>
  );
}
