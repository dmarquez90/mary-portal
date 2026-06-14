import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Referrals" };

export default function AdminReferralsPage() {
  return (
    <ComingSoon
      title="Referrals"
      description="Track companies referred by partners and their subscription status."
    />
  );
}
