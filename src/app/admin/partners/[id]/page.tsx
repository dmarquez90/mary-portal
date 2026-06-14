import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import { formatCurrency } from "@/lib/format";
import type { Partner } from "@/lib/types";
import PartnerEditForm from "@/components/admin/PartnerEditForm";

export const metadata: Metadata = { title: "Agent details" };
export const dynamic = "force-dynamic";

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const { data: partnerData } = await supabase
    .from("partners")
    .select("*")
    .eq("id", id)
    .eq("role", "partner")
    .single();

  if (!partnerData) notFound();
  const partner = partnerData as Partner;

  const [{ count: totalReferrals }, { count: activeReferrals }, { data: commissions }] =
    await Promise.all([
      supabase.from("referrals").select("id", { count: "exact", head: true }).eq("partner_id", partner.id),
      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partner.id)
        .eq("status", "active"),
      supabase.from("commissions_legacy").select("amount, status").eq("partner_id", partner.id),
    ]);

  const commissionRows = commissions ?? [];
  const pendingCommissions = commissionRows
    .filter((c) => c.status === "pending" || c.status === "approved")
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const paidCommissions = commissionRows
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/partners" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Agents
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy-800">{partner.full_name}</h1>
        <p className="mt-1 text-sm text-slate-500">{partner.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Referrals" value={String(totalReferrals ?? 0)} />
        <StatCard label="Active Referrals" value={String(activeReferrals ?? 0)} accent />
        <StatCard label="Commissions Pending" value={formatCurrency(pendingCommissions)} />
        <StatCard label="Commissions Paid" value={formatCurrency(paidCommissions)} />
      </div>

      <PartnerEditForm partner={partner} />
    </div>
  );
}
