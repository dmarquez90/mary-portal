"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import { PROMO_DISCOUNT_TYPES, type Partner, type PromoDiscountType } from "@/lib/types";

const DISCOUNT_TYPE_LABELS: Record<PromoDiscountType, string> = {
  percent: "Percent off",
  fixed: "Fixed amount off (USD)",
};

interface PromoCodeFormModalProps {
  open: boolean;
  onClose: () => void;
  partners: Partner[];
}

export default function PromoCodeFormModal({ open, onClose, partners }: PromoCodeFormModalProps) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [discountType, setDiscountType] = useState<PromoDiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setCode("");
    setPartnerId("");
    setDiscountType("percent");
    setDiscountValue("");
    setMaxUses("");
    setValidFrom("");
    setValidUntil("");
    setDescription("");
    setIsPublic(false);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^[A-Za-z0-9_-]{3,40}$/.test(code.trim())) {
      return setError("Code must be 3-40 characters: letters, numbers, hyphens, or underscores.");
    }
    const value = Number(discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      return setError("Discount value must be a positive number.");
    }
    if (discountType === "percent" && value > 100) {
      return setError("Percent discount cannot exceed 100.");
    }

    setLoading(true);
    const supabase = createClient();
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      setLoading(false);
      setError("Your session expired. Please sign in again.");
      return;
    }

    const { data, error: fnError } = await supabase.functions.invoke("manage-promo-code", {
      body: {
        action: "create",
        code: code.trim(),
        partner_id: partnerId || null,
        discount_type: discountType,
        discount_value: value,
        max_uses: maxUses.trim() ? Number(maxUses) : null,
        valid_from: validFrom || null,
        valid_until: validUntil || null,
        description: description.trim(),
        is_public: isPublic,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setLoading(false);

    if (fnError) {
      let message = "Could not create the promo code. Please try again.";
      const context = (fnError as { context?: Response }).context;
      if (context && typeof context.json === "function") {
        try {
          const errBody = (await context.json()) as { error?: string };
          if (errBody.error) message = errBody.error;
        } catch {
          // keep generic message
        }
      }
      setError(message);
      return;
    }

    void data;
    resetForm();
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Create promo code"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div>
          <label htmlFor="pc-code" className="label">Code</label>
          <input id="pc-code" type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input uppercase" placeholder="MARY20" />
          <p className="mt-1 text-xs text-slate-400">This will be created as a coupon and promotion code in Stripe.</p>
        </div>

        <div>
          <label htmlFor="pc-partner" className="label">Assign to agent <span className="font-normal text-slate-400">(optional)</span></label>
          <select id="pc-partner" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="input">
            <option value="">— None —</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}{p.ref_code ? ` (${p.ref_code})` : ""}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pc-type" className="label">Discount type</label>
            <select id="pc-type" value={discountType} onChange={(e) => setDiscountType(e.target.value as PromoDiscountType)} className="input">
              {PROMO_DISCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>{DISCOUNT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pc-value" className="label">
              {discountType === "percent" ? "Percent off" : "Amount off (USD)"}
            </label>
            <input id="pc-value" type="number" min="0" step={discountType === "percent" ? "1" : "0.01"} required value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="input" placeholder={discountType === "percent" ? "20" : "10.00"} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="pc-maxuses" className="label">Max uses <span className="font-normal text-slate-400">(optional)</span></label>
            <input id="pc-maxuses" type="number" min="1" step="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="input" placeholder="∞" />
          </div>
          <div>
            <label htmlFor="pc-validfrom" className="label">Valid from</label>
            <input id="pc-validfrom" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="pc-validuntil" className="label">Valid until</label>
            <input id="pc-validuntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="input" />
          </div>
        </div>

        <div>
          <label htmlFor="pc-description" className="label">Description</label>
          <textarea id="pc-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input resize-none" placeholder="—" />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500" />
          Public code (visible to all agents, not just the assigned one)
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="btn-outline"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating…" : "Create code"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
