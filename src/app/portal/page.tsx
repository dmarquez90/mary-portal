import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import CopyLinkButton from "@/components/CopyLinkButton";
import { formatCurrency } from "@/lib/format";
import { PARTNER_LEVEL_LABELS, type Partner } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: partnerData } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .single();

  const partner = partnerData as Partner | null;

  const [{ count: totalReferrals }, { count: activeReferrals }, { data: commissions }] =
    await Promise.all([
      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partner?.id ?? ""),
      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partner?.id ?? "")
        .eq("status", "active"),
      supabase.from("commissions_legacy").select("amount, status").eq("partner_id", partner?.id ?? ""),
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
          Welcome back, {partner?.full_name?.split(" ")[0] ?? "agent"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Your Level"
          value={partner ? PARTNER_LEVEL_LABELS[partner.level] : "—"}
          hint={partner ? `${partner.commission_pct}% commission` : undefined}
        />
        <StatCard label="Total Referrals" value={String(totalReferrals ?? 0)} />
        <StatCard label="Active Referrals" value={String(activeReferrals ?? 0)} accent />
        <StatCard label="Commissions Pending" value={formatCurrency(pendingCommissions)} />
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-navy-800">Commissions paid to date</h2>
        <p className="mt-2 text-3xl font-bold text-accent-600">{formatCurrency(paidCommissions)}</p>
      </div>

      {partner?.ref_code ? (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-navy-800">Your referral link</h2>
          <p className="mt-1 text-sm text-slate-500">
            Share this link with companies interested in MARY.
          </p>
          <div className="mt-4">
            <CopyLinkButton refCode={partner.ref_code} showLink />
          </div>
        </div>
      ) : null}
    </div>
  );
}
