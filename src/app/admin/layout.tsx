import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import PortalShell from "@/components/PortalShell";

export default async function AdminLayout({
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

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "agent" ? "/agent" : "/login");
  }

  return (
    <PortalShell variant="admin" userName={profile.full_name}>
      {children}
    </PortalShell>
  );
}
