/**
 * lib/payfast.ts
 * Utility for redirecting the browser to the PayFast payment page
 * via the Django backend's fund_escrow endpoint.
 *
 * The backend returns an HTML page with a self-submitting form that
 * redirects the user to PayFast. We fetch it with the JWT token and
 * write it directly to the document so the browser follows the redirect.
 *
 * Usage:
 *   import { initiatePayFastPayment } from '@/lib/payfast';
 *   await initiatePayFastPayment(transactionId);
 */

import { supabase } from '@/integrations/supabase/client';

const BASE = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000').replace(/\/$/, '');

// ─── Redirect browser to PayFast ─────────────────────────────────────────────
export async function initiatePayFastPayment(transactionId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated. Please sign in again.');

  const res = await fetch(`${BASE}/api/transactions/${transactionId}/fund/`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      Accept:         'text/html',
    },
  });

  if (!res.ok) {
    // Try to parse JSON error first, fall back to text
    let msg = 'Payment initiation failed.';
    try { msg = (await res.json()).error ?? msg; }
    catch { msg = await res.text() || msg; }
    throw new Error(msg);
  }

  // The backend returns HTML with a self-submitting form → PayFast
  const html = await res.text();
  document.open();
  document.write(html);
  document.close();
}

// ─── Look up the hold transaction for a gig ──────────────────────────────────
// After PostGigPage creates a gig, we need the Django-managed transaction ID
// (stored in Supabase) so we can call fund_escrow.
export async function getHoldTransactionForGig(gigId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('gig_id', gigId)
    .eq('type', 'hold')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.id;
}

// ─── Check if a transaction has been confirmed by PayFast ────────────────────
// A hold transaction is "funded" once the PayFast webhook fires and sets
// payfast_payment_id on the Django Transaction model.
// We detect this by checking the transactions table for the payfast_payment_id
// stored in the note field (our current approach since payfast_payment_id is
// a Django-only column not in the Supabase schema).
// As an alternative, poll the backend:
export async function checkPaymentStatus(transactionId: string): Promise<'funded' | 'pending' | 'unknown'> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return 'unknown';

  try {
    const res = await fetch(`${BASE}/api/my-transactions/`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return 'unknown';
    const { transactions } = await res.json();
    const txn = transactions.find((t: any) => t.id === transactionId);
    if (!txn) return 'unknown';
    // If it's in the list and type is 'hold', it has been funded
    return txn.type === 'hold' ? 'funded' : 'pending';
  } catch {
    return 'unknown';
  }
}