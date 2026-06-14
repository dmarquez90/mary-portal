import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Training" };

export default function AdminTrainingPage() {
  return (
    <ComingSoon
      title="Training"
      description="Schedule onboarding training sessions for new agents."
    />
  );
}
