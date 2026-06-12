import {
  COMMISSION_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  type CommissionStatus,
  type LeadStatus,
} from "@/lib/types";

const LEAD_STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-600/20",
  contacted: "bg-amber-50 text-amber-700 ring-amber-600/20",
  in_progress: "bg-violet-50 text-violet-700 ring-violet-600/20",
  contract_signed: "bg-accent-50 text-accent-700 ring-accent-600/20",
  lost: "bg-slate-100 text-slate-500 ring-slate-500/20",
};

const COMMISSION_STYLES: Record<CommissionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-blue-50 text-blue-700 ring-blue-600/20",
  paid: "bg-accent-50 text-accent-700 ring-accent-600/20",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${LEAD_STYLES[status]}`}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

export function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COMMISSION_STYLES[status]}`}
    >
      {COMMISSION_STATUS_LABELS[status]}
    </span>
  );
}
