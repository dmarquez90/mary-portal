import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import CopyLinkButton from "@/components/CopyLinkButton";
import { formatCurrency, startOfMonthISO } from "@/lib/format";
import type { Commission } from "@/lib/types";

export const metadata: Metadata = { title: "Agent Dashboard" };
export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, ref_code")
    .eq("id", user.id)
    .single();

  // RLS scopes every query below to this agent's own rows.
  const [
    { count: totalLeads },
    { count: leadsThisMonth },
    { count: contractsSigned },
    { data: commissionsData },
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
  ]);

  const commissions = (commissionsData ?? []) as Pick<Commission, "amount" | "status">[];
  const pendingTotal = commissions
    .filter((c) => c.status === "pending" || c.status === "approved")
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const paidTotal = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Share your link, track your referrals, get paid.
        </p>
      </div>

      {/* Referral link */}
      <div className="rounded-xl bg-navy-800 p-6 sm:p-8">
        <h2 className="text-base font-semibold text-white">My referral link</h2>
        <p className="mb-4 mt-1 text-sm text-navy-200">
          Anyone who submits the consultation form through this link is
          automatically recorded as your referral.
        </p>
        {profile?.ref_code ? (
          <CopyLinkButton refCode={profile.ref_code} showLink />
        ) : (
          <p className="text-sm text-navy-200">
            No referral code assigned yet — contact your administrator.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="My Leads" value={String(totalLeads ?? 0)} />
        <StatCard label="Leads This Month" value={String(leadsThisMonth ?? 0)} />
        <StatCard label="Contracts Signed" value={String(contractsSigned ?? 0)} accent />
        <StatCard
          label="Commissions Pending"
          value={formatCurrency(pendingTotal)}
          hint="Pending + approved, not yet paid"
        />
        <StatCard label="Commissions Paid" value={formatCurrency(paidTotal)} accent />
      </div>
    </div>
  );
}
