import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";
import { CommissionStatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CommissionWithJoins } from "@/lib/types";

export const metadata: Metadata = { title: "My Commissions" };
export const dynamic = "force-dynamic";

export default async function AgentCommissionsPage() {
  const supabase = createServerSupabase();

  // RLS returns only this agent's commissions.
  const { data } = await supabase
    .from("commissions")
    .select("*, lead:leads(full_name, company_name)")
    .order("created_at", { ascending: false });

  const commissions = (data ?? []) as CommissionWithJoins[];
  const total = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">My Commissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            One commission per signed contract from your referrals.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          Lifetime total:{" "}
          <span className="font-semibold text-navy-800">{formatCurrency(total)}</span>
        </p>
      </div>

      <div className="card">
        {commissions.length === 0 ? (
          <EmptyState
            title="No commissions yet"
            hint="When one of your referrals signs a contract, your commission appears here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th">Lead</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Created</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((commission) => (
                  <tr key={commission.id}>
                    <td className="table-td">
                      <p className="font-medium text-slate-900">
                        {commission.lead?.full_name ?? "—"}
                      </p>
                      <p className="max-w-[260px] truncate text-xs text-slate-400">
                        {commission.lead?.company_name ?? ""}
                      </p>
                    </td>
                    <td className="table-td whitespace-nowrap font-semibold text-navy-800">
                      {formatCurrency(Number(commission.amount))}
                    </td>
                    <td className="table-td whitespace-nowrap">
                      {formatDate(commission.created_at)}
                    </td>
                    <td className="table-td">
                      <CommissionStatusBadge status={commission.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
