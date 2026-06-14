import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Partners" };

export default function AdminPartnersPage() {
  return (
    <ComingSoon
      title="Partners"
      description="Manage partner accounts, levels, commission rates, and onboarding."
    />
  );
}
