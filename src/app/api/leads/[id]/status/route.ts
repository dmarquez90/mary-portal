import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/leads/:id/status
 *
 * Admin-only. Updates a lead's status. When the new status is
 * `contract_signed`, automatically creates the agent's commission —
 * exactly once per lead (guarded both here and by a unique index on
 * commissions.lead_id).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can update lead status" },
      { status: 403 },
    );
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = body.status as LeadStatus | undefined;
  if (!status || !LEAD_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${LEAD_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const { data: lead, error: updateError } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", params.id)
    .select("id, agent_id, ref_code, status")
    .single();

  if (updateError || !lead) {
    return NextResponse.json(
      { error: updateError?.message ?? "Lead not found" },
      { status: 404 },
    );
  }

  let commissionCreated = false;

  if (status === "contract_signed") {
    const { data: existing } = await supabase
      .from("commissions")
      .select("id")
      .eq("lead_id", lead.id)
      .maybeSingle();

    if (!existing) {
      const { data: agentProfile, error: agentError } = await supabase
        .from("profiles")
        .select("commission_per_contract")
        .eq("id", lead.agent_id)
        .single();

      if (agentError || !agentProfile) {
        return NextResponse.json(
          { lead, commissionCreated, warning: "Lead updated, but the agent profile could not be read to create the commission." },
          { status: 200 },
        );
      }

      const { error: insertError } = await supabase.from("commissions").insert({
        agent_id: lead.agent_id,
        lead_id: lead.id,
        amount: agentProfile.commission_per_contract,
        status: "pending",
      });

      if (!insertError) {
        commissionCreated = true;
      } else if (insertError.code !== "23505") {
        // 23505 = unique_violation: a concurrent request already created it.
        return NextResponse.json(
          { lead, commissionCreated, warning: `Lead updated, but commission creation failed: ${insertError.message}` },
          { status: 200 },
        );
      }
    }
  }

  return NextResponse.json({ lead, commissionCreated });
}
