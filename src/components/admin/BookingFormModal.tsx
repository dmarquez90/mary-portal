"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import {
  TRAINING_BOOKING_STATUSES,
  type Partner,
  type TrainingBooking,
  type TrainingBookingStatus,
} from "@/lib/types";

const STATUS_LABELS: Record<TrainingBookingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

interface BookingFormModalProps {
  open: boolean;
  onClose: () => void;
  booking: TrainingBooking | null;
  partner?: Partner;
}

export default function BookingFormModal({ open, onClose, booking, partner }: BookingFormModalProps) {
  const router = useRouter();

  const [status, setStatus] = useState<TrainingBookingStatus>(booking?.status ?? "scheduled");
  const [meetingLink, setMeetingLink] = useState(booking?.meeting_link ?? "");
  const [adminNotes, setAdminNotes] = useState(booking?.admin_notes ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!booking) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const payload = {
      status,
      meeting_link: meetingLink.trim() || null,
      admin_notes: adminNotes.trim() || null,
      completed_at:
        status === "completed" ? (booking.completed_at ?? new Date().toISOString()) : null,
    };

    const { error: dbError } = await supabase
      .from("training_bookings")
      .update(payload)
      .eq("id", booking.id);

    setLoading(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    onClose();
    router.refresh();
  }

  if (!booking) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Booking: ${partner?.full_name ?? "Agent"}`}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div>
          <label htmlFor="bf-status" className="label">Status</label>
          <select id="bf-status" value={status} onChange={(e) => setStatus(e.target.value as TrainingBookingStatus)} className="input">
            {TRAINING_BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bf-link" className="label">Meeting link</label>
          <input id="bf-link" type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className="input" placeholder="https://zoom.us/j/..." />
        </div>

        <div>
          <label htmlFor="bf-notes" className="label">Admin notes</label>
          <textarea id="bf-notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="input resize-none" placeholder="—" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
