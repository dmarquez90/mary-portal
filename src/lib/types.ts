export const PARTNER_ROLES = ["partner", "admin"] as const;
export type PartnerRole = (typeof PARTNER_ROLES)[number];

export const PARTNER_TYPES = ["agent", "reseller"] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_STATUSES = ["pending", "active", "suspended"] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const ONBOARDING_STATUSES = [
  "pending",
  "approved",
  "training_scheduled",
  "training_completed",
  "active",
] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const PARTNER_LEVELS = ["bronze", "silver", "gold", "platinum"] as const;
export type PartnerLevel = (typeof PARTNER_LEVELS)[number];

export const REFERRAL_PLANS = ["starter", "pro", "enterprise"] as const;
export type ReferralPlan = (typeof REFERRAL_PLANS)[number];

export const REFERRAL_STATUSES = ["lead", "trial", "active", "churned", "lost"] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const BILLING_TYPES = ["monthly", "annual"] as const;
export type BillingType = (typeof BILLING_TYPES)[number];

export const COMMISSION_STATUSES = ["pending", "approved", "paid"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const PROMO_DISCOUNT_TYPES = ["percent", "fixed"] as const;
export type PromoDiscountType = (typeof PROMO_DISCOUNT_TYPES)[number];

export const PROMO_STATUSES = ["pending", "active", "paused", "expired"] as const;
export type PromoStatus = (typeof PROMO_STATUSES)[number];

export const PAYOUT_STATUSES = ["pending", "processing", "paid", "rejected"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const TRAINING_BOOKING_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type TrainingBookingStatus = (typeof TRAINING_BOOKING_STATUSES)[number];

export interface Partner {
  id: string;
  user_id: string | null;
  role: PartnerRole;
  full_name: string;
  email: string;
  company: string | null;
  country: string | null;
  partner_type: PartnerType;
  status: PartnerStatus;
  ref_code: string | null;
  commission_pct: number;
  level: PartnerLevel;
  onboarding_status: OnboardingStatus;
  payout_method: string | null;
  payout_details: Record<string, unknown> | null;
  notes: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  partner_id: string | null;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  plan: ReferralPlan | null;
  status: ReferralStatus;
  billing_type: BillingType | null;
  monthly_value: number;
  promo_code_id: string | null;
  stripe_customer_id: string | null;
  started_at: string | null;
  churned_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  partner_id: string | null;
  referral_id: string | null;
  period: string;
  amount: number;
  status: CommissionStatus;
  paid_at: string | null;
  payout_ref: string | null;
  notes: string | null;
  created_at: string;
}

export interface PromoCode {
  id: string;
  partner_id: string | null;
  code: string;
  discount_type: PromoDiscountType;
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  status: PromoStatus;
  description: string | null;
  is_public: boolean;
  stripe_coupon_id: string | null;
  stripe_promo_id: string | null;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  partner_id: string | null;
  amount: number;
  period: string | null;
  status: PayoutStatus;
  method: string | null;
  payout_details: Record<string, unknown> | null;
  admin_notes: string | null;
  paid_at: string | null;
  payout_ref: string | null;
  created_at: string;
}

export interface TrainingSlot {
  id: string;
  date: string;
  time: string;
  duration_min: number;
  platform: "Zoom" | "Google Meet" | "Microsoft Teams";
  max_attendees: number;
  booked_count: number;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface TrainingBooking {
  id: string;
  partner_id: string;
  slot_id: string;
  status: TrainingBookingStatus;
  meeting_link: string | null;
  admin_notes: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface PartnerWithStats extends Partner {
  total_referrals: number;
  active_referrals: number;
  commissions_earned: number;
  commissions_paid: number;
}

export const PARTNER_LEVEL_LABELS: Record<PartnerLevel, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  training_scheduled: "Training Scheduled",
  training_completed: "Training Completed",
  active: "Active",
};

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  lead: "Lead",
  trial: "Trial",
  active: "Active",
  churned: "Churned",
  lost: "Lost",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
};

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  rejected: "Rejected",
};
