"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatTime } from "@/lib/format";
import type { TrainingSlot } from "@/lib/types";
import TrainingSlotFormModal from "@/components/admin/TrainingSlotFormModal";

export default function TrainingSlotsTable({ slots }: { slots: TrainingSlot[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(slot: TrainingSlot) {
    if (slot.booked_count > 0) {
      window.alert("This slot has bookings and cannot be deleted. Cancel the bookings first or mark the slot inactive.");
      return;
    }
    if (!window.confirm(`Delete the training slot on ${formatDate(slot.date)} at ${formatTime(slot.time)}?`)) {
      return;
    }
    setDeletingId(slot.id);
    const supabase = createClient();
    const { error } = await supabase.from("training_slots").delete().eq("id", slot.id);
    setDeletingId(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-navy-800">Training slots</h2>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New slot
        </button>
      </div>

      {slots.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">No training slots yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Create onboarding training sessions for agents to book.
          </p>
        </div>
      ) : (
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Duration</th>
                  <th className="px-4 py-3 font-semibold">Platform</th>
                  <th className="px-4 py-3 font-semibold">Attendees</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/training/${slot.id}`} className="font-semibold text-navy-800 hover:text-accent-600">
                        {formatDate(slot.date)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatTime(slot.time)}</td>
                    <td className="px-4 py-3 text-slate-600">{slot.duration_min} min</td>
                    <td className="px-4 py-3 text-slate-600">{slot.platform}</td>
                    <td className="px-4 py-3 text-slate-600">{slot.booked_count} / {slot.max_attendees}</td>
                    <td className="px-4 py-3">
                      {slot.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700 ring-1 ring-inset ring-accent-600/20">Active</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-500/20">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link href={`/admin/training/${slot.id}`} className="text-sm font-medium text-accent-600 hover:text-accent-700">
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(slot)}
                          disabled={deletingId === slot.id}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingId === slot.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TrainingSlotFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
