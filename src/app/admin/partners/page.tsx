import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { OnboardingStatusBadge } from "@/components/StatusBadge";
import { PARTNER_LEVEL_LABELS, type Partner } from "@/lib/types";
import CreatePartnerButton from "@/components/admin/CreatePartnerButton";
import PartnerStatusPill from "@/components/admin/PartnerStatusPill";

export const metadata: Metadata = { title: "Agents" };
export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const supabase = createServerSupabase();

  const { data: partners } = await supabase
    .from("partners")
    .select("*")
    .eq("role", "partner")
    .order("created_at", { ascending: false });

  const rows = (partners ?? []) as Partner[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Agents</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage agent and reseller accounts, levels, commission rates, and onboarding.
          </p>
        </div>
        <CreatePartnerButton />
      </div>

      {rows.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">No agents yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Agents who apply via the signup form, or that you create
            manually, will appear here.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Onboarding</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Commission</th>
                  <th className="px-4 py-3 font-semibold">Ref. Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/partners/${partner.id}`}
                        className="font-semibold text-navy-800 hover:text-accent-600"
                      >
                        {partner.full_name}
                      </Link>
                      {partner.company ? (
                        <p className="text-xs text-slate-400">{partner.company}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{partner.email}</td>
                    <td className="px-4 py-3">
                      <PartnerStatusPill status={partner.status} />
                    </td>
                    <td className="px-4 py-3">
                      <OnboardingStatusBadge status={partner.onboarding_status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {PARTNER_LEVEL_LABELS[partner.level]}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{partner.commission_pct}%</td>
                    <td className="px-4 py-3">
                      {partner.ref_code ? (
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-navy-700">
                          {partner.ref_code}
                        </code>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
