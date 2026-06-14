import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import type { TrainingSlot } from "@/lib/types";
import TrainingSlotsTable from "@/components/admin/TrainingSlotsTable";

export const metadata: Metadata = { title: "Training" };
export const dynamic = "force-dynamic";

export default async function AdminTrainingPage() {
  const supabase = createServerSupabase();

  const { data: slots } = await supabase
    .from("training_slots")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Training</h1>
        <p className="mt-1 text-sm text-slate-500">
          Schedule onboarding training sessions for new agents.
        </p>
      </div>

      <TrainingSlotsTable slots={(slots ?? []) as TrainingSlot[]} />
    </div>
  );
}
