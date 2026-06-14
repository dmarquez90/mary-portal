"use client";

import { useState } from "react";
import { TrainingBookingStatusBadge } from "@/components/StatusBadge";
import type { Partner, TrainingBooking } from "@/lib/types";
import BookingFormModal from "@/components/admin/BookingFormModal";

export default function SlotBookingsTable({
  bookings,
  partners,
}: {
  bookings: TrainingBooking[];
  partners: Partner[];
}) {
  const [editing, setEditing] = useState<TrainingBooking | null>(null);
  const partnerMap = new Map(partners.map((p) => [p.id, p]));

  return (
    <>
      <h2 className="text-base font-semibold text-navy-800">Bookings</h2>

      {bookings.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-700">No bookings yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Agents will appear here once they book this slot.
          </p>
        </div>
      ) : (
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Agent</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Meeting link</th>
                  <th className="px-4 py-3 font-semibold">Admin notes</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => {
                  const partner = partnerMap.get(booking.partner_id);
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-navy-800">{partner?.full_name ?? "Unknown agent"}</p>
                        {partner?.email ? <p className="text-xs text-slate-400">{partner.email}</p> : null}
                      </td>
                      <td className="px-4 py-3">
                        <TrainingBookingStatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {booking.meeting_link ? (
                          <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="text-accent-600 hover:underline">
                            Link
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{booking.admin_notes ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditing(booking)}
                          className="text-sm font-medium text-accent-600 hover:text-accent-700"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BookingFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        booking={editing}
        partner={editing ? partnerMap.get(editing.partner_id) : undefined}
      />
    </>
  );
}
