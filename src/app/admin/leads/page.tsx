import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import LeadsTable from "@/components/admin/LeadsTable";
import type { LeadWithAgent, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const supabase = createServerSupabase();

  const [{ data: leadsData }, { data: agentsData }] = await Promise.all([
    supabase
      .from("leads")
      .select("*, agent:profiles(full_name, ref_code)")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "agent")
      .order("full_name"),
  ]);

  const leads = (leadsData ?? []) as LeadWithAgent[];
  const agents = (agentsData ?? []) as Pick<Profile, "id" | "full_name">[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Leads</h1>
        <p className="mt-1 text-sm text-slate-500">
          All referrals across every agent. New leads appear here in real time.
        </p>
      </div>
      <LeadsTable initialLeads={leads} agents={agents} />
    </div>
  );
}
