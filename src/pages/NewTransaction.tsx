import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  amount: z.number().min(1, 'Amount must be positive'),
  delivery_terms: z.string().min(5, 'Delivery terms required'),
  due_date: z.string().optional(),
  seller_email: z.string().email('Valid seller email required'),
});

export default function NewTransaction() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const fd = new FormData(e.currentTarget);
    const raw = {
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      amount: parseFloat(fd.get('amount') as string),
      delivery_terms: fd.get('delivery_terms') as string,
      due_date: (fd.get('due_date') as string) || undefined,
      seller_email: fd.get('seller_email') as string,
    };

    const result = schema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => { fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      // Check if seller already has an account
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', raw.seller_email)
        .single();

      const { data: txn, error } = await supabase.from('transactions').insert({
        buyer_id: profile.id,
        seller_id: sellerProfile?.id ?? null,
        seller_email_invited: raw.seller_email,
        title: raw.title,
        description: raw.description,
        amount_cents: Math.round(raw.amount * 100),
        currency: 'ZAR',
        status: 'awaiting_seller_acceptance',
        delivery_terms: raw.delivery_terms,
        due_date: raw.due_date || null,
      }).select().single();

      if (error) throw error;

      // Create invitation
      await supabase.from('invitations').insert({
        transaction_id: txn.id,
        invited_email: raw.seller_email,
        token: crypto.randomUUID(),
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Create event
      await supabase.from('transaction_events').insert({
        transaction_id: txn.id,
        actor_profile_id: profile.id,
        event_type: 'created',
        message: `Transaction created by ${profile.display_name}`,
      });

      // Notify seller if they have an account
      if (sellerProfile) {
        await supabase.from('notifications').insert({
          profile_id: sellerProfile.id,
          type: 'invitation',
          title: 'New Transaction Invitation',
          body: `You have been invited to "${raw.title}" for ${new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(raw.amount)}.`,
        });
      }

      toast({ title: 'Transaction created' });
      navigate(`/transactions/${txn.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Transaction</CardTitle>
          <CardDescription>Create an escrow transaction and invite a seller</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. Website Development" />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Describe the goods or services..." rows={3} />
              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (ZAR)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="1000.00" />
                {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount}</p>}
              </div>
              <div>
                <Label htmlFor="due_date">Due Date (optional)</Label>
                <Input id="due_date" name="due_date" type="date" />
              </div>
            </div>
            <div>
              <Label htmlFor="delivery_terms">Delivery Terms</Label>
              <Textarea id="delivery_terms" name="delivery_terms" placeholder="Describe delivery expectations..." rows={2} />
              {errors.delivery_terms && <p className="text-xs text-destructive mt-1">{errors.delivery_terms}</p>}
            </div>
            <div>
              <Label htmlFor="seller_email">Seller Email</Label>
              <Input id="seller_email" name="seller_email" type="email" placeholder="seller@example.com" />
              {errors.seller_email && <p className="text-xs text-destructive mt-1">{errors.seller_email}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Transaction'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
}
