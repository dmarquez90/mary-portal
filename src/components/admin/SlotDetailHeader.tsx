"use client";

import { useState } from "react";
import type { TrainingSlot } from "@/lib/types";
import TrainingSlotFormModal from "@/components/admin/TrainingSlotFormModal";

export default function SlotDetailHeader({ slot }: { slot: TrainingSlot }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          {slot.is_active ? (
            <span className="inline-flex items-center rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700 ring-1 ring-inset ring-accent-600/20">Active</span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-500/20">Inactive</span>
          )}
        </div>
        {slot.notes ? (
          <p className="mt-2 text-sm text-slate-500">{slot.notes}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No notes for this slot.</p>
        )}
      </div>
      <button type="button" onClick={() => setModalOpen(true)} className="btn-outline shrink-0">
        Edit slot
      </button>

      <TrainingSlotFormModal open={modalOpen} onClose={() => setModalOpen(false)} slot={slot} />
    </div>
  );
}
