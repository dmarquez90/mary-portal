// Supabase Edge Function: signup-partner
// Public endpoint: lets a prospective sales partner apply for access.
// Creates the auth user and a "pending" partners row (no ref_code yet —
// assigned by an admin during onboarding approval).
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

  if (!fullName) return json({ error: "Full name is required" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "A valid email is required" }, 400);
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400);
  }

  // Friendly pre-check (the unique constraint on partners.email is the hard guarantee).
  const { data: existing } = await admin
    .from("partners")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return json({ error: "An account with this email already exists" }, 409);
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

  const { error: partnerError } = await admin.from("partners").insert({
    user_id: created.user.id,
    role: "partner",
    full_name: fullName,
    email,
    company: company || null,
    country: country || null,
    phone: phone || null,
    partner_type: "agent",
    status: "pending",
    onboarding_status: "pending",
    ref_code: null,
    commission_pct: 15,
    level: "bronze",
  });

  if (partnerError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: `Could not create partner profile: ${partnerError.message}` }, 400);
  }

  return json({ ok: true }, 201);
});
