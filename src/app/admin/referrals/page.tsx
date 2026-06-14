import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import type { Partner, Referral } from "@/lib/types";

export const metadata: Metadata = { title: "Referrals" };
export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  const supabase = createServerSupabase();

  const [{ data: partners }, { data: referrals }] = await Promise.all([
    supabase.from("partners").select("*").eq("role", "partner").order("full_name"),
    supabase.from("referrals").select("*"),
  ]);

  const partnerRows = (partners ?? []) as Partner[];
  const referralRows = (referrals ?? []) as Referral[];

  const stats = new Map<
    string,
    { total: number; active: number; monthlyValue: number }
  >();
  for (const ref of referralRows) {
    const key = ref.partner_id ?? "unassigned";
    const entry = stats.get(key) ?? { total: 0, active: 0, monthlyValue: 0 };
    entry.total += 1;
    if (ref.status === "active") {
      entry.active += 1;
      entry.monthlyValue += Number(ref.monthly_value);
    }
    stats.set(key, entry);
  }

  const unassigned = stats.get("unassigned");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Referrals</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track companies referred by agents and their subscription status.
        </p>
      </div>

      {partnerRows.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">No agents yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Add agents first, then assign referrals to them.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Agent</th>
                  <th className="px-4 py-3 font-semibold">Ref. Code</th>
                  <th className="px-4 py-3 font-semibold">Total Referrals</th>
                  <th className="px-4 py-3 font-semibold">Active</th>
                  <th className="px-4 py-3 font-semibold">Active MRR</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partnerRows.map((partner) => {
                  const entry = stats.get(partner.id) ?? { total: 0, active: 0, monthlyValue: 0 };
                  return (
                    <tr key={partner.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/referrals/${partner.id}`}
                          className="font-semibold text-navy-800 hover:text-accent-600"
                        >
                          {partner.full_name}
                        </Link>
                        {partner.company ? (
                          <p className="text-xs text-slate-400">{partner.company}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {partner.ref_code ? (
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-navy-700">
                            {partner.ref_code}
                          </code>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{entry.total}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.active}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(entry.monthlyValue)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/referrals/${partner.id}`}
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

      {unassigned ? (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-navy-800">Unassigned referrals</h2>
          <p className="mt-1 text-sm text-slate-500">
            {unassigned.total} referral{unassigned.total === 1 ? "" : "s"} not linked to any agent.
          </p>
        </div>
      ) : null}
    </div>
  );
}
