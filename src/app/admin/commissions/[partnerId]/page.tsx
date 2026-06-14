import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import { formatCurrency } from "@/lib/format";
import type { Commission, Partner, Referral } from "@/lib/types";
import CommissionsTable from "@/components/admin/CommissionsTable";

export const metadata: Metadata = { title: "Agent commissions" };
export const dynamic = "force-dynamic";

export default async function AdminAgentCommissionsPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = await params;
  const supabase = createServerSupabase();

  const { data: partnerData } = await supabase
    .from("partners")
    .select("*")
    .eq("id", partnerId)
    .eq("role", "partner")
    .single();

  if (!partnerData) notFound();
  const partner = partnerData as Partner;

  const [{ data: commissionsData }, { data: referralsData }] = await Promise.all([
    supabase
      .from("commissions_legacy")
      .select("*")
      .eq("partner_id", partner.id)
      .order("period", { ascending: false }),
    supabase.from("referrals").select("*").eq("partner_id", partner.id),
  ]);

  const commissions = (commissionsData ?? []) as Commission[];
  const referrals = (referralsData ?? []) as Referral[];

  const totals = { pending: 0, approved: 0, paid: 0 };
  for (const c of commissions) {
    const amount = Number(c.amount);
    if (c.status === "pending") totals.pending += amount;
    if (c.status === "approved") totals.approved += amount;
    if (c.status === "paid") totals.paid += amount;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/commissions" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Commissions
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy-800">{partner.full_name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {partner.email} · {partner.commission_pct}% commission
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={formatCurrency(totals.pending)} />
        <StatCard label="Approved" value={formatCurrency(totals.approved)} />
        <StatCard label="Paid" value={formatCurrency(totals.paid)} accent />
      </div>

      <CommissionsTable partnerId={partner.id} commissions={commissions} referrals={referrals} />
    </div>
  );
}
