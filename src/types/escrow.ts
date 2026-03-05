export type TransactionStatus =
  | 'draft'
  | 'awaiting_seller_acceptance'
  | 'awaiting_payment'
  | 'payment_processing'
  | 'funded'
  | 'in_delivery'
  | 'buyer_confirmed'
  | 'released'
  | 'dispute_open'
  | 'dispute_resolved_refund'
  | 'dispute_resolved_release'
  | 'cancelled';

export type PaymentMethod = 'card' | 'eft' | 'wallet';
export type PaymentStatus = 'PENDING' | 'COMPLETE' | 'FAILED';
export type DisputeStatus = 'open' | 'under_review' | 'resolved';
export type InvitationStatus = 'pending' | 'accepted' | 'expired';
export type AppRole = 'buyer' | 'seller' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Transaction {
  id: string;
  buyer_id: string;
  seller_id: string | null;
  seller_email_invited: string;
  title: string;
  description: string;
  amount_cents: number;
  currency: string;
  status: TransactionStatus;
  delivery_terms: string;
  due_date: string | null;
  buyer_confirmed_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
  buyer?: Profile;
  seller?: Profile;
}

export interface TransactionEvent {
  id: string;
  transaction_id: string;
  actor_profile_id: string | null;
  event_type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile;
}

export interface Payment {
  id: string;
  transaction_id: string;
  provider: string;
  method: PaymentMethod;
  simulated_reference: string;
  payment_status: PaymentStatus;
  amount_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  transaction_id: string;
  invited_email: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  transaction_id: string;
  opened_by_profile_id: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution: string | null;
  resolved_by_admin_profile_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  opened_by?: Profile;
  transaction?: Transaction;
}

export interface Notification {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  draft: 'Draft',
  awaiting_seller_acceptance: 'Awaiting Seller',
  awaiting_payment: 'Awaiting Payment',
  payment_processing: 'Processing Payment',
  funded: 'Funded',
  in_delivery: 'In Delivery',
  buyer_confirmed: 'Buyer Confirmed',
  released: 'Released',
  dispute_open: 'Dispute Open',
  dispute_resolved_refund: 'Refunded',
  dispute_resolved_release: 'Released (Dispute)',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<TransactionStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  awaiting_seller_acceptance: 'bg-amber-100 text-amber-800',
  awaiting_payment: 'bg-orange-100 text-orange-800',
  payment_processing: 'bg-blue-100 text-blue-800',
  funded: 'bg-emerald-100 text-emerald-800',
  in_delivery: 'bg-indigo-100 text-indigo-800',
  buyer_confirmed: 'bg-teal-100 text-teal-800',
  released: 'bg-green-100 text-green-800',
  dispute_open: 'bg-red-100 text-red-800',
  dispute_resolved_refund: 'bg-rose-100 text-rose-800',
  dispute_resolved_release: 'bg-lime-100 text-lime-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export function formatCents(cents: number, currency = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
