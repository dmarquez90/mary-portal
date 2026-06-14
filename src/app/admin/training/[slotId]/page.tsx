import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/format";
import type { Partner, TrainingBooking, TrainingSlot } from "@/lib/types";
import SlotBookingsTable from "@/components/admin/SlotBookingsTable";
import SlotDetailHeader from "@/components/admin/SlotDetailHeader";

export const metadata: Metadata = { title: "Training slot" };
export const dynamic = "force-dynamic";

export default async function AdminTrainingSlotPage({
  params,
}: {
  params: Promise<{ slotId: string }>;
}) {
  const { slotId } = await params;
  const supabase = createServerSupabase();

  const { data: slotData } = await supabase
    .from("training_slots")
    .select("*")
    .eq("id", slotId)
    .single();

  if (!slotData) notFound();
  const slot = slotData as TrainingSlot;

  const [{ data: bookingsData }, { data: partnersData }] = await Promise.all([
    supabase.from("training_bookings").select("*").eq("slot_id", slot.id).order("created_at"),
    supabase.from("partners").select("*").eq("role", "partner"),
  ]);

  const bookings = (bookingsData ?? []) as TrainingBooking[];
  const partners = (partnersData ?? []) as Partner[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/training" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Training
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy-800">
          {formatDate(slot.date)} at {formatTime(slot.time)}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {slot.duration_min} min · {slot.platform} · {slot.booked_count}/{slot.max_attendees} attendees
        </p>
      </div>

      <SlotDetailHeader slot={slot} />

      <SlotBookingsTable bookings={bookings} partners={partners} />
    </div>
  );
}
