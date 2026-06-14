import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Commissions" };

export default function PartnerCommissionsPage() {
  return (
    <ComingSoon
      title="Commissions"
      description="Your commission history and payment status."
    />
  );
}
