import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatCents, type Dispute } from '@/types/escrow';

export default function AdminDisputes() {
  const { profile } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = async () => {
    const { data } = await supabase
      .from('disputes')
      .select('*, opened_by:profiles!disputes_opened_by_profile_id_fkey(*), transaction:transactions(*)')
      .order('created_at', { ascending: false });
    setDisputes(data as Dispute[] ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();

    const channel = supabase
      .channel('admin-disputes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, () => {
        fetchDisputes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleResolve = async (dispute: Dispute, resolution: 'refund' | 'release') => {
    if (!profile) return;
    const newStatus = resolution === 'refund' ? 'dispute_resolved_refund' : 'dispute_resolved_release';

    await supabase.from('disputes').update({
      status: 'resolved',
      resolution,
      resolved_by_admin_profile_id: profile.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', dispute.id);

    await supabase.from('transactions').update({ status: newStatus }).eq('id', dispute.transaction_id);

    await supabase.from('transaction_events').insert({
      transaction_id: dispute.transaction_id,
      actor_profile_id: profile.id,
      event_type: 'dispute_resolved',
      message: `Dispute resolved: ${resolution}`,
      metadata: { resolution },
    });

    // Notify both parties
    if (dispute.transaction) {
      const partyIds = [dispute.transaction.buyer_id, dispute.transaction.seller_id].filter(Boolean);
      for (const pid of partyIds) {
        await supabase.from('notifications').insert({
          profile_id: pid,
          type: 'dispute_resolved',
          title: 'Dispute Resolved',
          body: `Dispute for "${dispute.transaction.title}" resolved with ${resolution}.`,
        });
      }
    }

    toast({ title: `Dispute resolved: ${resolution}` });
    fetchDisputes();
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Manage Disputes</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : disputes.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No disputes</p>
      ) : (
        <div className="grid gap-4">
          {disputes.map(d => (
            <Card key={d.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{d.reason}</h3>
                    <p className="text-sm text-muted-foreground">{d.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Opened by: {d.opened_by?.display_name} | Transaction: {d.transaction?.title} ({formatCents(d.transaction?.amount_cents ?? 0)})
                    </p>
                  </div>
                  <Badge className={d.status === 'open' ? 'bg-red-100 text-red-800 border-0' : d.status === 'resolved' ? 'bg-green-100 text-green-800 border-0' : 'bg-amber-100 text-amber-800 border-0'}>
                    {d.status}
                  </Badge>
                </div>
                {d.status !== 'resolved' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleResolve(d, 'refund')}>Refund Buyer</Button>
                    <Button size="sm" onClick={() => handleResolve(d, 'release')}>Release to Seller</Button>
                  </div>
                )}
                {d.resolution && <p className="text-sm font-medium">Resolution: {d.resolution}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
