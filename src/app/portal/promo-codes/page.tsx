import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Promo Codes" };

export default function PartnerPromoCodesPage() {
  return (
    <ComingSoon
      title="Promo Codes"
      description="Discount codes you can offer to your referrals."
    />
  );
}
