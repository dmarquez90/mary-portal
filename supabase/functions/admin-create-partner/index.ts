// Supabase Edge Function: admin-create-partner
// Admin-only endpoint: creates a partner account directly (e.g. for partners
// onboarded outside the public signup flow). Requires a valid admin JWT.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const PARTNER_TYPES = new Set(["agent", "reseller"]);
const PARTNER_LEVELS = new Set(["bronze", "silver", "gold", "platinum"]);
const PARTNER_STATUSES = new Set(["pending", "active", "suspended"]);
const ONBOARDING_STATUSES = new Set([
  "pending",
  "approved",
  "training_scheduled",
  "training_completed",
  "active",
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Verify the caller is an authenticated admin.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return json({ error: "Missing authorization token" }, 401);
  }

  const { data: callerData, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !callerData.user) {
    return json({ error: "Invalid session" }, 401);
  }

  const { data: callerPartner } = await admin
    .from("partners")
    .select("role")
    .eq("user_id", callerData.user.id)
    .single();

  if (!callerPartner || callerPartner.role !== "admin") {
    return json({ error: "Forbidden" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const country = typeof body.country === "string" ? body.country.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const partnerType = typeof body.partner_type === "string" ? body.partner_type : "agent";
  const level = typeof body.level === "string" ? body.level : "bronze";
  const status = typeof body.status === "string" ? body.status : "active";
  const onboardingStatus =
    typeof body.onboarding_status === "string" ? body.onboarding_status : "active";
  const refCode = typeof body.ref_code === "string" ? body.ref_code.trim().toUpperCase() : "";
  const commissionPctRaw = body.commission_pct;
  const commissionPct =
    typeof commissionPctRaw === "number"
      ? commissionPctRaw
      : typeof commissionPctRaw === "string" && commissionPctRaw.trim() !== ""
        ? Number(commissionPctRaw)
        : 15;

  if (!fullName) return json({ error: "Full name is required" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "A valid email is required" }, 400);
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400);
  }
  if (!PARTNER_TYPES.has(partnerType)) {
    return json({ error: "Invalid partner type" }, 400);
  }
  if (!PARTNER_LEVELS.has(level)) {
    return json({ error: "Invalid level" }, 400);
  }
  if (!PARTNER_STATUSES.has(status)) {
    return json({ error: "Invalid status" }, 400);
  }
  if (!ONBOARDING_STATUSES.has(onboardingStatus)) {
    return json({ error: "Invalid onboarding status" }, 400);
  }
  if (!Number.isFinite(commissionPct) || commissionPct < 0 || commissionPct > 100) {
    return json({ error: "Commission percentage must be between 0 and 100" }, 400);
  }

  const { data: existing } = await admin
    .from("partners")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return json({ error: "An account with this email already exists" }, 409);
  }

  if (refCode) {
    const { data: refExisting } = await admin
      .from("partners")
      .select("id")
      .eq("ref_code", refCode)
      .maybeSingle();
    if (refExisting) {
      return json({ error: "This referral code is already in use" }, 409);
    }
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    return json({ error: createError?.message ?? "Could not create user" }, 400);
  }

  // A database trigger (on_auth_user_created -> handle_new_user) already
  // inserted a base partners row. Fill in the rest here.
  const { error: partnerError } = await admin
    .from("partners")
    .update({
      full_name: fullName,
      company: company || null,
      country: country || null,
      phone: phone || null,
      partner_type: partnerType,
      level,
      status,
      onboarding_status: onboardingStatus,
      commission_pct: commissionPct,
      ref_code: refCode || null,
    })
    .eq("user_id", created.user.id);

  if (partnerError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json(
      { error: `Could not create partner profile: ${partnerError.message}` },
      400,
    );
  }

  return json({ ok: true }, 201);
});
