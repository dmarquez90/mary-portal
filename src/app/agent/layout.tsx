import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import PortalShell from "@/components/PortalShell";
import SignOutButton from "@/components/SignOutButton";

export default async function AgentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, status")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  if (profile.status === "inactive") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-800 px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-navy-800">Account deactivated</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Your agent account is currently inactive. Please contact your
            administrator to regain access.
          </p>
          <div className="mt-6 flex justify-center">
            <SignOutButton className="btn-outline" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PortalShell variant="agent" userName={profile.full_name}>
      {children}
    </PortalShell>
  );
}
