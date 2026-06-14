import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import PortalShell from "@/components/PortalShell";
import SignOutButton from "@/components/SignOutButton";
import { OnboardingStatusBadge } from "@/components/StatusBadge";
import { ONBOARDING_STATUS_LABELS, type OnboardingStatus } from "@/lib/types";

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: partner } = await supabase
    .from("partners")
    .select("full_name, role, status, onboarding_status")
    .eq("user_id", user.id)
    .single();

  if (!partner) redirect("/login");
  if (partner.role === "admin") redirect("/admin");

  if (partner.status === "suspended") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-800 px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-navy-800">Account suspended</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Your partner account has been suspended. Please contact your
            administrator for more information.
          </p>
          <div className="mt-6 flex justify-center">
            <SignOutButton className="btn-outline" />
          </div>
        </div>
      </div>
    );
  }

  if (partner.onboarding_status !== "active") {
    const status = partner.onboarding_status as OnboardingStatus;
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-800 px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-navy-800">Onboarding in progress</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Your account is being onboarded. We&apos;ll unlock your full
            partner dashboard once this step is complete.
          </p>
          <div className="mt-4 flex justify-center">
            <OnboardingStatusBadge status={status} />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Current step: {ONBOARDING_STATUS_LABELS[status]}
          </p>
          <div className="mt-6 flex justify-center">
            <SignOutButton className="btn-outline" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PortalShell variant="partner" userName={partner.full_name}>
      {children}
    </PortalShell>
  );
}
