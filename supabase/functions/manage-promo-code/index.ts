// Supabase Edge Function: manage-promo-code
// Admin-only endpoint: creates or deactivates a promo code, syncing with
// Stripe (Coupon + Promotion Code). Requires a valid admin JWT.
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

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

const DISCOUNT_TYPES = new Set(["percent", "fixed"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const admin = createClient(supabaseUrl, serviceKey);

  if (!stripeSecretKey) {
    return json({ error: "Stripe is not configured on the server" }, 500);
  }
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

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

  const action = typeof body.action === "string" ? body.action : "create";

  if (action === "deactivate") {
    const promoId = typeof body.id === "string" ? body.id : "";
    if (!promoId) return json({ error: "Missing promo code id" }, 400);

    const { data: existing, error: fetchError } = await admin
      .from("promo_codes")
      .select("*")
      .eq("id", promoId)
      .single();
    if (fetchError || !existing) {
      return json({ error: "Promo code not found" }, 404);
    }

    if (existing.stripe_promo_id) {
      try {
        await stripe.promotionCodes.update(existing.stripe_promo_id, { active: false });
      } catch (err) {
        return json({ error: `Stripe error: ${(err as Error).message}` }, 502);
      }
    }

    const { error: updateError } = await admin
      .from("promo_codes")
      .update({ status: "expired" })
      .eq("id", promoId);
    if (updateError) {
      return json({ error: updateError.message }, 400);
    }

    return json({ ok: true });
  }

  // action === "create"
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const discountType = typeof body.discount_type === "string" ? body.discount_type : "percent";
  const discountValueRaw = body.discount_value;
  const discountValue =
    typeof discountValueRaw === "number"
      ? discountValueRaw
      : typeof discountValueRaw === "string" && discountValueRaw.trim() !== ""
        ? Number(discountValueRaw)
        : NaN;
  const partnerId = typeof body.partner_id === "string" && body.partner_id ? body.partner_id : null;
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const isPublic = Boolean(body.is_public);
  const maxUsesRaw = body.max_uses;
  const maxUses =
    typeof maxUsesRaw === "number"
      ? maxUsesRaw
      : typeof maxUsesRaw === "string" && maxUsesRaw.trim() !== ""
        ? Number(maxUsesRaw)
        : null;
  const validFrom = typeof body.valid_from === "string" && body.valid_from ? body.valid_from : null;
  const validUntil = typeof body.valid_until === "string" && body.valid_until ? body.valid_until : null;

  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
    return json(
      { error: "Code must be 3-40 characters: letters, numbers, hyphens, or underscores" },
      400,
    );
  }
  if (!DISCOUNT_TYPES.has(discountType)) {
    return json({ error: "Invalid discount type" }, 400);
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return json({ error: "Discount value must be a positive number" }, 400);
  }
  if (discountType === "percent" && discountValue > 100) {
    return json({ error: "Percent discount cannot exceed 100" }, 400);
  }
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
    return json({ error: "Max uses must be a positive whole number" }, 400);
  }

  const { data: existingCode } = await admin
    .from("promo_codes")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (existingCode) {
    return json({ error: "This code already exists" }, 409);
  }

  if (partnerId) {
    const { data: partner } = await admin
      .from("partners")
      .select("id")
      .eq("id", partnerId)
      .single();
    if (!partner) {
      return json({ error: "Selected agent not found" }, 400);
    }
  }

  // Create the Stripe coupon (applies to the first invoice/payment only).
  let coupon: Stripe.Coupon;
  try {
    coupon =
      discountType === "percent"
        ? await stripe.coupons.create({
            percent_off: discountValue,
            duration: "once",
            name: code,
          })
        : await stripe.coupons.create({
            amount_off: Math.round(discountValue * 100),
            currency: "usd",
            duration: "once",
            name: code,
          });
  } catch (err) {
    return json({ error: `Stripe error creating coupon: ${(err as Error).message}` }, 502);
  }

  // Create the promotion code (the customer-facing code).
  let promotionCode: Stripe.PromotionCode;
  try {
    const params: Stripe.PromotionCodeCreateParams = {
      coupon: coupon.id,
      code,
    };
    if (maxUses !== null) params.max_redemptions = maxUses;
    if (validUntil) {
      params.expires_at = Math.floor(new Date(`${validUntil}T23:59:59Z`).getTime() / 1000);
    }
    promotionCode = await stripe.promotionCodes.create(params);
  } catch (err) {
    // Roll back the coupon if the promo code creation failed.
    try {
      await stripe.coupons.del(coupon.id);
    } catch {
      // best-effort rollback
    }
    return json({ error: `Stripe error creating promotion code: ${(err as Error).message}` }, 502);
  }

  const { error: insertError } = await admin.from("promo_codes").insert({
    partner_id: partnerId,
    code,
    discount_type: discountType,
    discount_value: discountValue,
    max_uses: maxUses,
    valid_from: validFrom,
    valid_until: validUntil,
    status: "active",
    description: description || null,
    is_public: isPublic,
    stripe_coupon_id: coupon.id,
    stripe_promo_id: promotionCode.id,
  });

  if (insertError) {
    // Roll back Stripe objects if the DB insert failed.
    try {
      await stripe.promotionCodes.update(promotionCode.id, { active: false });
      await stripe.coupons.del(coupon.id);
    } catch {
      // best-effort rollback
    }
    return json({ error: insertError.message }, 400);
  }

  return json({ ok: true }, 201);
});
