import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import { formatCurrency } from "@/lib/format";
import type { Partner, PayoutRequest } from "@/lib/types";
import PayoutsTable from "@/components/admin/PayoutsTable";

export const metadata: Metadata = { title: "Agent payouts" };
export const dynamic = "force-dynamic";

export default async function AdminAgentPayoutsPage({
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

  const { data: payoutsData } = await supabase
    .from("payout_requests")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  const payouts = (payoutsData ?? []) as PayoutRequest[];

  const totals = { pending: 0, processing: 0, paid: 0 };
  for (const p of payouts) {
    const amount = Number(p.amount);
    if (p.status === "pending") totals.pending += amount;
    if (p.status === "processing") totals.processing += amount;
    if (p.status === "paid") totals.paid += amount;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/payouts" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Payouts
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy-800">{partner.full_name}</h1>
        <p className="mt-1 text-sm text-slate-500">{partner.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={formatCurrency(totals.pending)} />
        <StatCard label="Processing" value={formatCurrency(totals.processing)} />
        <StatCard label="Paid" value={formatCurrency(totals.paid)} accent />
      </div>

      <PayoutsTable partnerId={partner.id} payouts={payouts} />
    </div>
  );
}
