import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { Timeline } from '@/components/Timeline';
import { CheckoutModal } from '@/components/CheckoutModal';
import { DisputeDialog } from '@/components/DisputeDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { formatCents, type Transaction, type TransactionEvent } from '@/types/escrow';
import { ArrowLeft, CreditCard, Truck, ThumbsUp, AlertTriangle, UserCheck } from 'lucide-react';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [events, setEvents] = useState<TransactionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    const [txnRes, eventsRes] = await Promise.all([
      supabase.from('transactions')
        .select('*, buyer:profiles!transactions_buyer_id_fkey(*), seller:profiles!transactions_seller_id_fkey(*)')
        .eq('id', id).single(),
      supabase.from('transaction_events')
        .select('*')
        .eq('transaction_id', id)
        .order('created_at', { ascending: true }),
    ]);
    setTxn(txnRes.data as Transaction | null);
    setEvents(eventsRes.data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();

    if (!id) return;
    const channel = supabase
      .channel(`txn-detail-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `id=eq.${id}` }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transaction_events', filter: `transaction_id=eq.${id}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData, id]);

  if (loading) {
    return <Layout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  }
  if (!txn || !profile) {
    return <Layout><p className="text-center py-12 text-muted-foreground">Transaction not found</p></Layout>;
  }

  const isBuyer = txn.buyer_id === profile.id;
  const isSeller = txn.seller_id === profile.id || txn.seller_email_invited === profile.email;

  const handleSellerAccept = async () => {
    // Link seller profile and update status
    await supabase.from('transactions').update({
      seller_id: profile.id,
      status: 'awaiting_payment',
    }).eq('id', txn.id);

    // Accept invitation
    await supabase.from('invitations')
      .update({ status: 'accepted' })
      .eq('transaction_id', txn.id)
      .eq('invited_email', profile.email);

    // Add seller role
    await supabase.from('user_roles').upsert({
      user_id: profile.user_id,
      role: 'seller',
    }, { onConflict: 'user_id,role' });

    await supabase.from('transaction_events').insert({
      transaction_id: txn.id,
      actor_profile_id: profile.id,
      event_type: 'seller_accepted',
      message: `${profile.display_name} accepted the transaction`,
    });

    await supabase.from('notifications').insert({
      profile_id: txn.buyer_id,
      type: 'seller_accepted',
      title: 'Seller Accepted',
      body: `${profile.display_name} accepted "${txn.title}". You can now fund the transaction.`,
    });

    toast({ title: 'Transaction accepted' });
    fetchData();
  };

  const handleMarkDelivered = async () => {
    await supabase.from('transactions').update({ status: 'in_delivery' }).eq('id', txn.id);
    await supabase.from('transaction_events').insert({
      transaction_id: txn.id,
      actor_profile_id: profile.id,
      event_type: 'marked_delivered',
      message: `${profile.display_name} marked the transaction as delivered`,
    });
    await supabase.from('notifications').insert({
      profile_id: txn.buyer_id,
      type: 'delivery',
      title: 'Delivery Update',
      body: `"${txn.title}" has been marked as delivered. Please confirm receipt.`,
    });
    toast({ title: 'Marked as delivered' });
    fetchData();
  };

  const handleConfirmReceipt = async () => {
    const now = new Date().toISOString();
    await supabase.from('transactions').update({
      status: 'released',
      buyer_confirmed_at: now,
      released_at: now,
    }).eq('id', txn.id);
    await supabase.from('transaction_events').insert([
      { transaction_id: txn.id, actor_profile_id: profile.id, event_type: 'buyer_confirmed', message: `${profile.display_name} confirmed receipt` },
      { transaction_id: txn.id, actor_profile_id: profile.id, event_type: 'released', message: 'Funds released to seller' },
    ]);
    if (txn.seller_id) {
      await supabase.from('notifications').insert({
        profile_id: txn.seller_id,
        type: 'released',
        title: 'Funds Released',
        body: `Funds for "${txn.title}" (${formatCents(txn.amount_cents)}) have been released.`,
      });
    }
    toast({ title: 'Receipt confirmed and funds released' });
    fetchData();
  };

  const canDispute = (isBuyer || isSeller) && ['funded', 'in_delivery'].includes(txn.status);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{txn.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{txn.description}</p>
              </div>
              <StatusBadge status={txn.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-semibold text-lg">{formatCents(txn.amount_cents, txn.currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Due Date</p>
                <p className="font-medium">{txn.due_date ? new Date(txn.due_date).toLocaleDateString() : 'None'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Buyer</p>
                <p className="font-medium">{txn.buyer?.display_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Seller</p>
                <p className="font-medium">{txn.seller?.display_name || txn.seller_email_invited}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Delivery Terms</p>
              <p className="text-sm mt-1">{txn.delivery_terms}</p>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {isSeller && txn.status === 'awaiting_seller_acceptance' && (
                <Button onClick={handleSellerAccept}>
                  <UserCheck className="h-4 w-4 mr-1" /> Accept Transaction
                </Button>
              )}
              {isBuyer && txn.status === 'awaiting_payment' && (
                <Button onClick={() => setCheckoutOpen(true)}>
                  <CreditCard className="h-4 w-4 mr-1" /> Fund Transaction
                </Button>
              )}
              {isSeller && txn.status === 'funded' && (
                <Button onClick={handleMarkDelivered}>
                  <Truck className="h-4 w-4 mr-1" /> Mark Delivered
                </Button>
              )}
              {isBuyer && txn.status === 'in_delivery' && (
                <Button onClick={handleConfirmReceipt}>
                  <ThumbsUp className="h-4 w-4 mr-1" /> Confirm Receipt
                </Button>
              )}
              {canDispute && (
                <Button variant="destructive" onClick={() => setDisputeOpen(true)}>
                  <AlertTriangle className="h-4 w-4 mr-1" /> Open Dispute
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              <Timeline events={events} />
            )}
          </CardContent>
        </Card>
      </div>

      <CheckoutModal
        transaction={txn}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onComplete={fetchData}
        buyerProfileId={profile.id}
      />
      <DisputeDialog
        transactionId={txn.id}
        profileId={profile.id}
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        onComplete={fetchData}
      />
    </Layout>
  );
}
