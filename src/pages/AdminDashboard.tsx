import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCents, type Transaction } from '@/types/escrow';
import { DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, buyer:profiles!transactions_buyer_id_fkey(*), seller:profiles!transactions_seller_id_fkey(*)')
      .order('created_at', { ascending: false });
    setTransactions(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('admin-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchAll();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const metrics = [
    { label: 'Total', value: transactions.length, icon: Clock, color: 'text-primary' },
    { label: 'Funded', value: transactions.filter(t => t.status === 'funded').length, icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Disputed', value: transactions.filter(t => t.status === 'dispute_open').length, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Released', value: transactions.filter(t => ['released', 'dispute_resolved_release'].includes(t.status)).length, icon: CheckCircle, color: 'text-green-600' },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/admin/disputes" className="text-sm text-primary hover:underline">Disputes</Link>
          <Link to="/admin/users" className="text-sm text-primary hover:underline">Users</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <m.icon className={`h-8 w-8 ${m.color}`} />
              <div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="grid gap-3">
          {transactions.map(t => (
            <Link key={t.id} to={`/transactions/${t.id}`}>
              <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{t.title}</h3>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t.buyer?.display_name} → {t.seller?.display_name || t.seller_email_invited}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCents(t.amount_cents)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
