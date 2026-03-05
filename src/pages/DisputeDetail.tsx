import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { formatCents, type Dispute, type Transaction } from '@/types/escrow';

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('disputes')
        .select('*, opened_by:profiles!disputes_opened_by_profile_id_fkey(*), transaction:transactions(*)')
        .eq('id', id)
        .single();
      setDispute(data as Dispute | null);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Layout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  if (!dispute) return <Layout><p className="text-center py-12 text-muted-foreground">Dispute not found</p></Layout>;

  const statusColor = dispute.status === 'open' ? 'bg-red-100 text-red-800' : dispute.status === 'under_review' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/transactions/${dispute.transaction_id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Transaction</Link>
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>Dispute</CardTitle>
              <Badge className={`${statusColor} border-0`}>{dispute.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Reason</p>
              <p className="font-medium">{dispute.reason}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{dispute.description}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Opened By</p>
              <p className="text-sm">{dispute.opened_by?.display_name}</p>
            </div>
            {dispute.transaction && (
              <div>
                <p className="text-sm text-muted-foreground">Transaction</p>
                <p className="text-sm">{dispute.transaction.title} - {formatCents(dispute.transaction.amount_cents)}</p>
                <StatusBadge status={dispute.transaction.status} />
              </div>
            )}
            {dispute.resolution && (
              <div>
                <p className="text-sm text-muted-foreground">Resolution</p>
                <p className="font-medium capitalize">{dispute.resolution}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
