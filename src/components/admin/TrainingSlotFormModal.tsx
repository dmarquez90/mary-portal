"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import type { TrainingSlot } from "@/lib/types";

const PLATFORMS: TrainingSlot["platform"][] = ["Zoom", "Google Meet", "Microsoft Teams"];

interface TrainingSlotFormModalProps {
  open: boolean;
  onClose: () => void;
  slot?: TrainingSlot | null;
}

export default function TrainingSlotFormModal({ open, onClose, slot }: TrainingSlotFormModalProps) {
  const router = useRouter();
  const isEdit = Boolean(slot);

  const [date, setDate] = useState(slot?.date ?? "");
  const [time, setTime] = useState(slot?.time?.slice(0, 5) ?? "");
  const [durationMin, setDurationMin] = useState(String(slot?.duration_min ?? 60));
  const [platform, setPlatform] = useState<TrainingSlot["platform"]>(slot?.platform ?? "Zoom");
  const [maxAttendees, setMaxAttendees] = useState(String(slot?.max_attendees ?? 1));
  const [isActive, setIsActive] = useState(slot?.is_active ?? true);
  const [notes, setNotes] = useState(slot?.notes ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setDate("");
    setTime("");
    setDurationMin("60");
    setPlatform("Zoom");
    setMaxAttendees("1");
    setIsActive(true);
    setNotes("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!date) return setError("Please select a date.");
    if (!time) return setError("Please select a time.");
    const duration = Number(durationMin);
    if (!Number.isInteger(duration) || duration <= 0) {
      return setError("Duration must be a positive whole number of minutes.");
    }
    const maxAtt = Number(maxAttendees);
    if (!Number.isInteger(maxAtt) || maxAtt <= 0) {
      return setError("Max attendees must be a positive whole number.");
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      date,
      time,
      duration_min: duration,
      platform,
      max_attendees: maxAtt,
      is_active: isActive,
      notes: notes.trim() || null,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("training_slots").update(payload).eq("id", slot!.id)
      : await supabase.from("training_slots").insert(payload);

    setLoading(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    if (!isEdit) resetForm();
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isEdit) resetForm();
        onClose();
      }}
      title={isEdit ? "Edit training slot" : "New training slot"}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ts-date" className="label">Date</label>
            <input id="ts-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="ts-time" className="label">Time</label>
            <input id="ts-time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="input" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ts-duration" className="label">Duration (minutes)</label>
            <input id="ts-duration" type="number" min="1" step="1" required value={durationMin} onChange={(e) => setDurationMin(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="ts-platform" className="label">Platform</label>
            <select id="ts-platform" value={platform} onChange={(e) => setPlatform(e.target.value as TrainingSlot["platform"])} className="input">
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ts-maxattendees" className="label">Max attendees</label>
            <input id="ts-maxattendees" type="number" min="1" step="1" required value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} className="input" />
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500" />
              Active (visible for agents to book)
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="ts-notes" className="label">Notes</label>
          <textarea id="ts-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input resize-none" placeholder="—" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (!isEdit) resetForm();
              onClose();
            }}
            className="btn-outline"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving…" : isEdit ? "Save changes" : "Create slot"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
