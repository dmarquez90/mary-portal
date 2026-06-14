import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Payouts" };

export default function PartnerPayoutsPage() {
  return (
    <ComingSoon
      title="Payouts"
      description="Request payouts and track your payment history."
    />
  );
}
