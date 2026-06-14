"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PromoStatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import type { Partner, PromoCode } from "@/lib/types";
import PromoCodeFormModal from "@/components/admin/PromoCodeFormModal";

export default function PromoCodesTable({
  promoCodes,
  partners,
}: {
  promoCodes: PromoCode[];
  partners: Partner[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const partnerMap = new Map(partners.map((p) => [p.id, p]));

  async function handleDeactivate(promo: PromoCode) {
    if (!window.confirm(`Deactivate code ${promo.code}? It will no longer be usable in Stripe.`)) {
      return;
    }
    setDeactivatingId(promo.id);
    const supabase = createClient();
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      setDeactivatingId(null);
      window.alert("Your session expired. Please sign in again.");
      return;
    }

    const { error: fnError } = await supabase.functions.invoke("manage-promo-code", {
      body: { action: "deactivate", id: promo.id },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setDeactivatingId(null);

    if (fnError) {
      let message = "Could not deactivate the code.";
      const context = (fnError as { context?: Response }).context;
      if (context && typeof context.json === "function") {
        try {
          const errBody = (await context.json()) as { error?: string };
          if (errBody.error) message = errBody.error;
        } catch {
          // keep generic message
        }
      }
      window.alert(message);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-navy-800">Promo codes</h2>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New code
        </button>
      </div>

      {promoCodes.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">No promo codes yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Create discount codes that sync automatically with Stripe.
          </p>
        </div>
      ) : (
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Agent</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Uses</th>
                  <th className="px-4 py-3 font-semibold">Valid</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promoCodes.map((promo) => {
                  const partner = promo.partner_id ? partnerMap.get(promo.partner_id) : undefined;
                  return (
                    <tr key={promo.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-navy-700">
                          {promo.code}
                        </code>
                        {promo.is_public ? (
                          <span className="ml-2 text-xs text-slate-400">Public</span>
                        ) : null}
                        {promo.description ? (
                          <p className="mt-1 text-xs text-slate-400">{promo.description}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {partner ? partner.full_name : promo.is_public ? "Any agent" : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {promo.discount_type === "percent"
                          ? `${promo.discount_value}% off`
                          : `$${promo.discount_value} off`}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {promo.uses_count}{promo.max_uses ? ` / ${promo.max_uses}` : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {promo.valid_from ? formatDate(promo.valid_from) : "—"}
                        {promo.valid_until ? ` – ${formatDate(promo.valid_until)}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <PromoStatusBadge status={promo.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {promo.status === "active" ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(promo)}
                            disabled={deactivatingId === promo.id}
                            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {deactivatingId === promo.id ? "Deactivating…" : "Deactivate"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PromoCodeFormModal open={modalOpen} onClose={() => setModalOpen(false)} partners={partners} />
    </>
  );
}
