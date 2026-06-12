export const LEAD_STATUSES = [
  "new",
  "contacted",
  "in_progress",
  "contract_signed",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const COMMISSION_STATUSES = ["pending", "approved", "paid"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export type Role = "admin" | "agent";
export type ProfileStatus = "active" | "inactive";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  ref_code: string | null;
  commission_per_contract: number;
  status: ProfileStatus;
  created_at: string;
}

export interface Lead {
  id: string;
  agent_id: string;
  ref_code: string;
  full_name: string;
  email: string;
  phone: string;
  property_address: string;
  message: string | null;
  status: LeadStatus;
  created_at: string;
}

export interface Commission {
  id: string;
  agent_id: string;
  lead_id: string;
  amount: number;
  status: CommissionStatus;
  created_at: string;
}

export interface LeadWithAgent extends Lead {
  agent: Pick<Profile, "full_name" | "ref_code"> | null;
}

export interface CommissionWithJoins extends Commission {
  agent: Pick<Profile, "full_name" | "ref_code"> | null;
  lead: Pick<Lead, "full_name" | "property_address"> | null;
}

export interface AgentWithStats extends Profile {
  total_leads: number;
  contracts_signed: number;
  commissions_earned: number;
  commissions_paid: number;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In Progress",
  contract_signed: "Contract Signed",
  lost: "Lost",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
};
