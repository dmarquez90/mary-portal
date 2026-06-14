import {
  COMMISSION_STATUS_LABELS,
  ONBOARDING_STATUS_LABELS,
  PAYOUT_STATUS_LABELS,
  REFERRAL_STATUS_LABELS,
  type CommissionStatus,
  type OnboardingStatus,
  type PayoutStatus,
  type PromoStatus,
  type ReferralStatus,
} from "@/lib/types";

const ONBOARDING_STYLES: Record<OnboardingStatus, string> = {
  pending: "bg-slate-100 text-slate-500 ring-slate-500/20",
  approved: "bg-blue-50 text-blue-700 ring-blue-600/20",
  training_scheduled: "bg-violet-50 text-violet-700 ring-violet-600/20",
  training_completed: "bg-amber-50 text-amber-700 ring-amber-600/20",
  active: "bg-accent-50 text-accent-700 ring-accent-600/20",
};

const REFERRAL_STYLES: Record<ReferralStatus, string> = {
  lead: "bg-slate-100 text-slate-500 ring-slate-500/20",
  trial: "bg-blue-50 text-blue-700 ring-blue-600/20",
  active: "bg-accent-50 text-accent-700 ring-accent-600/20",
  churned: "bg-red-50 text-red-700 ring-red-600/20",
  lost: "bg-slate-100 text-slate-400 ring-slate-400/20",
};

const COMMISSION_STYLES: Record<CommissionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-blue-50 text-blue-700 ring-blue-600/20",
  paid: "bg-accent-50 text-accent-700 ring-accent-600/20",
};

const PAYOUT_STYLES: Record<PayoutStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  processing: "bg-blue-50 text-blue-700 ring-blue-600/20",
  paid: "bg-accent-50 text-accent-700 ring-accent-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
};

const PROMO_STYLES: Record<PromoStatus, string> = {
  pending: "bg-slate-100 text-slate-500 ring-slate-500/20",
  active: "bg-accent-50 text-accent-700 ring-accent-600/20",
  paused: "bg-amber-50 text-amber-700 ring-amber-600/20",
  expired: "bg-red-50 text-red-700 ring-red-600/20",
};

const PROMO_STATUS_LABELS: Record<PromoStatus, string> = {
  pending: "Pending",
  active: "Active",
  paused: "Paused",
  expired: "Expired",
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export function OnboardingStatusBadge({ status }: { status: OnboardingStatus }) {
  return <Badge className={ONBOARDING_STYLES[status]}>{ONBOARDING_STATUS_LABELS[status]}</Badge>;
}

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  return <Badge className={REFERRAL_STYLES[status]}>{REFERRAL_STATUS_LABELS[status]}</Badge>;
}

export function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  return <Badge className={COMMISSION_STYLES[status]}>{COMMISSION_STATUS_LABELS[status]}</Badge>;
}

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return <Badge className={PAYOUT_STYLES[status]}>{PAYOUT_STATUS_LABELS[status]}</Badge>;
}

export function PromoStatusBadge({ status }: { status: PromoStatus }) {
  return <Badge className={PROMO_STYLES[status]}>{PROMO_STATUS_LABELS[status]}</Badge>;
}
