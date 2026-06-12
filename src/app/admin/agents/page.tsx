import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import AgentsTable from "@/components/admin/AgentsTable";
import CreateAgentForm from "@/components/admin/CreateAgentForm";
import type { AgentWithStats, Commission, Lead, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Agents" };
export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const supabase = createServerSupabase();

  const [{ data: agentsData }, { data: leadsData }, { data: commissionsData }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "agent")
        .order("created_at", { ascending: false }),
      supabase.from("leads").select("agent_id, status"),
      supabase.from("commissions").select("agent_id, amount, status"),
    ]);

  const agents = (agentsData ?? []) as Profile[];
  const leads = (leadsData ?? []) as Pick<Lead, "agent_id" | "status">[];
  const commissions = (commissionsData ?? []) as Pick<
    Commission,
    "agent_id" | "amount" | "status"
  >[];

  const withStats: AgentWithStats[] = agents.map((agent) => {
    const agentLeads = leads.filter((l) => l.agent_id === agent.id);
    const agentCommissions = commissions.filter((c) => c.agent_id === agent.id);
    return {
      ...agent,
      total_leads: agentLeads.length,
      contracts_signed: agentLeads.filter((l) => l.status === "contract_signed").length,
      commissions_earned: agentCommissions.reduce((sum, c) => sum + Number(c.amount), 0),
      commissions_paid: agentCommissions
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + Number(c.amount), 0),
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Agents</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create referral agents and manage their access.
        </p>
      </div>

      <CreateAgentForm />

      <AgentsTable initialAgents={withStats} />
    </div>
  );
}
