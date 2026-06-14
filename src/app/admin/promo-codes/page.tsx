import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Promo Codes" };

export default function AdminPromoCodesPage() {
  return (
    <ComingSoon
      title="Promo Codes"
      description="Create and manage discount codes for partners to share."
    />
  );
}
