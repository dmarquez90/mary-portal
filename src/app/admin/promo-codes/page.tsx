import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Partner, PromoCode } from "@/lib/types";
import PromoCodesTable from "@/components/admin/PromoCodesTable";

export const metadata: Metadata = { title: "Promo Codes" };
export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  const supabase = createServerSupabase();

  const [{ data: promoCodes }, { data: partners }] = await Promise.all([
    supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
    supabase.from("partners").select("*").eq("role", "partner").order("full_name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Promo Codes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create and manage discount codes for agents to share. Codes are synced with Stripe.
        </p>
      </div>

      <PromoCodesTable
        promoCodes={(promoCodes ?? []) as PromoCode[]}
        partners={(partners ?? []) as Partner[]}
      />
    </div>
  );
}
