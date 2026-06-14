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

  const { data: partner } = await supabase
    .from("partners")
    .select("full_name, role, status")
    .eq("user_id", user.id)
    .single();

  if (!partner || partner.role !== "admin") {
    redirect(partner?.role === "partner" ? "/portal" : "/login");
  }

  return (
    <PortalShell variant="admin" userName={partner.full_name}>
      {children}
    </PortalShell>
  );
}
