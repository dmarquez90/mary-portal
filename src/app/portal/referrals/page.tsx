import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Referrals" };

export default function PartnerReferralsPage() {
  return (
    <ComingSoon
      title="Referrals"
      description="Companies you've referred and their subscription status."
    />
  );
}
