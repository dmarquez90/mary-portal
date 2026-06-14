import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import type { Commission, Partner } from "@/lib/types";

export const metadata: Metadata = { title: "Commissions" };
export const dynamic = "force-dynamic";

export default async function AdminCommissionsPage() {
  const supabase = createServerSupabase();

  const [{ data: partners }, { data: commissions }] = await Promise.all([
    supabase.from("partners").select("*").eq("role", "partner").order("full_name"),
    supabase.from("commissions_legacy").select("*"),
  ]);

  const partnerRows = (partners ?? []) as Partner[];
  const commissionRows = (commissions ?? []) as Commission[];

  const stats = new Map<
    string,
    { pending: number; approved: number; paid: number; total: number }
  >();
  for (const c of commissionRows) {
    const key = c.partner_id ?? "unassigned";
    const entry = stats.get(key) ?? { pending: 0, approved: 0, paid: 0, total: 0 };
    const amount = Number(c.amount);
    if (c.status === "pending") entry.pending += amount;
    if (c.status === "approved") entry.approved += amount;
    if (c.status === "paid") entry.paid += amount;
    entry.total += amount;
    stats.set(key, entry);
  }

  const totals = { pending: 0, approved: 0, paid: 0 };
  for (const c of commissionRows) {
    const amount = Number(c.amount);
    if (c.status === "pending") totals.pending += amount;
    if (c.status === "approved") totals.approved += amount;
    if (c.status === "paid") totals.paid += amount;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Commissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and approve commissions earned by agents.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending</p>
          <p className="mt-1 text-2xl font-bold text-navy-800">{formatCurrency(totals.pending)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Approved</p>
          <p className="mt-1 text-2xl font-bold text-navy-800">{formatCurrency(totals.approved)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Paid</p>
          <p className="mt-1 text-2xl font-bold text-accent-600">{formatCurrency(totals.paid)}</p>
        </div>
      </div>

      {partnerRows.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">No agents yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Add agents first, then record their commissions.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Agent</th>
                  <th className="px-4 py-3 font-semibold">Pending</th>
                  <th className="px-4 py-3 font-semibold">Approved</th>
                  <th className="px-4 py-3 font-semibold">Paid</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partnerRows.map((partner) => {
                  const entry = stats.get(partner.id) ?? { pending: 0, approved: 0, paid: 0, total: 0 };
                  return (
                    <tr key={partner.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/commissions/${partner.id}`}
                          className="font-semibold text-navy-800 hover:text-accent-600"
                        >
                          {partner.full_name}
                        </Link>
                        {partner.ref_code ? (
                          <p className="text-xs text-slate-400">{partner.ref_code}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(entry.pending)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(entry.approved)}</td>
                      <td className="px-4 py-3 text-accent-600">{formatCurrency(entry.paid)}</td>
                      <td className="px-4 py-3 font-semibold text-navy-800">{formatCurrency(entry.total)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/commissions/${partner.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
                        >
                          View
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
