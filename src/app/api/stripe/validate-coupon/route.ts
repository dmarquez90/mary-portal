import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/env";
import type { PromoCode } from "@/lib/types";

// This endpoint is called by external apps (e.g. MARY App's checkout) to
// validate a discount code before subscribing. It is intentionally public
// (no auth) but only ever returns the minimal fields needed to apply the
// Stripe promotion code at checkout.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return json({ valid: false, error: "Missing code" }, 400);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ valid: false, error: "Server is not configured" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    return json({ valid: false });
  }

  const promo = data as PromoCode;

  if (promo.status !== "active" || !promo.stripe_promo_id) {
    return json({ valid: false });
  }

  const now = new Date();
  if (promo.valid_from && now < new Date(promo.valid_from)) {
    return json({ valid: false });
  }
  if (promo.valid_until && now > new Date(`${promo.valid_until}T23:59:59Z`)) {
    return json({ valid: false });
  }
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return json({ valid: false });
  }

  return json({
    valid: true,
    promo_code_id: promo.stripe_promo_id,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    name: promo.code,
  });
}
