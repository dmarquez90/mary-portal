import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Training" };

export default function PartnerTrainingPage() {
  return (
    <ComingSoon
      title="Training"
      description="Book onboarding training sessions with the Mary team."
    />
  );
}
