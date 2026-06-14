import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Commissions" };

export default function AdminCommissionsPage() {
  return (
    <ComingSoon
      title="Commissions"
      description="Review and approve commissions earned by agents."
    />
  );
}
