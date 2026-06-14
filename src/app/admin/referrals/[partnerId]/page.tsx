import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import { formatCurrency } from "@/lib/format";
import type { Partner, Referral } from "@/lib/types";
import ReferralsTable from "@/components/admin/ReferralsTable";

export const metadata: Metadata = { title: "Agent referrals" };
export const dynamic = "force-dynamic";

export default async function AdminAgentReferralsPage({
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

  const { data: referralsData } = await supabase
    .from("referrals")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  const referrals = (referralsData ?? []) as Referral[];
  const activeReferrals = referrals.filter((r) => r.status === "active");
  const activeMrr = activeReferrals.reduce((sum, r) => sum + Number(r.monthly_value), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/referrals" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Referrals
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy-800">{partner.full_name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {partner.email}
          {partner.ref_code ? (
            <>
              {" "}· <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-navy-700">{partner.ref_code}</code>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Referrals" value={String(referrals.length)} />
        <StatCard label="Active Referrals" value={String(activeReferrals.length)} accent />
        <StatCard label="Active MRR" value={formatCurrency(activeMrr)} />
      </div>

      <ReferralsTable partnerId={partner.id} referrals={referrals} />
    </div>
  );
}
