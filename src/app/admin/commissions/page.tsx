import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import CommissionsTable from "@/components/admin/CommissionsTable";
import type { CommissionWithJoins } from "@/lib/types";

export const metadata: Metadata = { title: "Commissions" };
export const dynamic = "force-dynamic";

export default async function AdminCommissionsPage() {
  const supabase = createServerSupabase();

  const { data } = await supabase
    .from("commissions")
    .select(
      "*, agent:profiles(full_name, ref_code), lead:leads(full_name, company_name)",
    )
    .order("created_at", { ascending: false });

  const commissions = (data ?? []) as CommissionWithJoins[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Commissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Created automatically when a lead is marked “Contract Signed”.
          Approve them, then mark them paid.
        </p>
      </div>
      <CommissionsTable initialCommissions={commissions} />
    </div>
  );
}
