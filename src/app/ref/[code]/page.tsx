import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import LeadForm from "@/components/LeadForm";

export const metadata: Metadata = { title: "Free Mary Sales Consultation" };
export const dynamic = "force-dynamic";

interface ReferralPageProps {
  params: { code: string };
}

interface AgentLookup {
  agent_id: string;
  agent_name: string;
  agent_ref_code: string;
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const code = decodeURIComponent(params.code);
  const supabase = createServerSupabase();

  const { data, error } = await supabase.rpc("get_agent_by_ref_code", {
    lookup_code: code,
  });

  const agent: AgentLookup | undefined = (data as AgentLookup[] | null)?.[0];

  if (error || !agent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-800 px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy-800">Invalid referral link</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            This referral link is not valid or is no longer active. Please
            double-check the link you received, or ask your referral partner
            for a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-800">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
        {/* Pitch */}
        <div className="text-center lg:text-left">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent-500/40 bg-accent-500/10 px-4 py-1.5 text-xs font-semibold text-accent-300">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            You were referred by {agent.agent_name}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Request your <span className="text-accent-400">free Mary Sales consultation</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-navy-200 lg:mx-0">
            Thinking about streamlining your business with MARY? Tell us a
            little about your business and our team will reach out to
            schedule a free, no-obligation consultation.
          </p>
          <ul className="mx-auto mt-7 max-w-md space-y-3 text-left text-sm text-navy-100 lg:mx-0">
            {[
              "Free walkthrough tailored to your business",
              "Setup, onboarding and migration guidance",
              "Clear pricing — no surprises",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Capture form */}
        <div className="card p-6 sm:p-8">
          <LeadForm
            agentId={agent.agent_id}
            agentName={agent.agent_name}
            refCode={agent.agent_ref_code}
          />
        </div>
      </div>
    </div>
  );
}
