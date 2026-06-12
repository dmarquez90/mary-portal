// Supabase Edge Function: create-agent
// Deployed to the Mary-Portal project. Admin-only: creates the auth user
// and the agent profile atomically (rolls back the user if the profile
// insert fails). The service role key is injected by Supabase at runtime —
// it never touches the Next.js app or the browser.
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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Identify the caller from their JWT and require the admin role.
  const authHeader = req.headers.get("Authorization") ?? "";
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();
  if (userError || !user) {
    return json({ error: "Not authenticated" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (callerProfile?.role !== "admin") {
    return json({ error: "Only admins can create agents" }, 403);
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
  const refCodeRaw = typeof body.ref_code === "string" ? body.ref_code.trim() : "";
  const commission = Number(body.commission_per_contract ?? 1000);

  if (!fullName) return json({ error: "Full name is required" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "A valid email is required" }, 400);
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/.test(refCodeRaw)) {
    return json(
      { error: "Ref code must be 2-30 characters: letters, numbers, hyphens or underscores" },
      400,
    );
  }
  if (!Number.isFinite(commission) || commission < 0) {
    return json({ error: "Commission must be a non-negative number" }, 400);
  }

  const refCode = refCodeRaw.toUpperCase();

  // Friendly pre-check (the unique constraint is the hard guarantee).
  const { data: existingCode } = await admin
    .from("profiles")
    .select("id")
    .eq("ref_code", refCode)
    .maybeSingle();
  if (existingCode) {
    return json({ error: `Referral code ${refCode} is already in use` }, 409);
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

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      id: created.user.id,
      full_name: fullName,
      email,
      role: "agent",
      ref_code: refCode,
      commission_per_contract: commission,
      status: "active",
    })
    .select()
    .single();

  if (profileError) {
    // Roll back the auth user so the operation stays atomic.
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: `Could not create agent profile: ${profileError.message}` }, 400);
  }

  return json({ agent: profile }, 201);
});
