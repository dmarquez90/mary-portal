import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Payouts" };

export default function AdminPayoutsPage() {
  return (
    <ComingSoon
      title="Payouts"
      description="Review and process agent payout requests."
    />
  );
}
