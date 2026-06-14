import type { PartnerStatus } from "@/lib/types";

const STYLES: Record<PartnerStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  active: "bg-accent-50 text-accent-700 ring-accent-600/20",
  suspended: "bg-red-50 text-red-700 ring-red-600/20",
};

const LABELS: Record<PartnerStatus, string> = {
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
};

export default function PartnerStatusPill({ status }: { status: PartnerStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
