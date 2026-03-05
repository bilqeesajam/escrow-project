import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/lib/supabaseClient';
import { formatCents, type PaymentMethod, type Transaction } from '@/types/escrow';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Building2, Wallet, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  buyerProfileId: string;
}

type Stage = 'select' | 'processing' | 'success' | 'failure';

export function CheckoutModal({ transaction, open, onOpenChange, onComplete, buyerProfileId }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [forceSuccess, setForceSuccess] = useState(false);
  const [stage, setStage] = useState<Stage>('select');

  const handlePay = async () => {
    setStage('processing');

    // Set transaction to payment_processing
    await supabase.from('transactions').update({ status: 'payment_processing' }).eq('id', transaction.id);
    await supabase.from('transaction_events').insert({
      transaction_id: transaction.id,
      actor_profile_id: buyerProfileId,
      event_type: 'payment_initiated',
      message: `Payment initiated via ${method}`,
    });

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 2500));

    const success = forceSuccess || Math.random() > 0.3;
    const ref = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    if (success) {
      await supabase.from('payments').insert({
        transaction_id: transaction.id,
        provider: 'simulated',
        method,
        simulated_reference: ref,
        payment_status: 'COMPLETE',
        amount_cents: transaction.amount_cents,
      });
      await supabase.from('transactions').update({ status: 'funded' }).eq('id', transaction.id);
      await supabase.from('transaction_events').insert({
        transaction_id: transaction.id,
        actor_profile_id: buyerProfileId,
        event_type: 'payment_success',
        message: `Payment of ${formatCents(transaction.amount_cents)} completed (Ref: ${ref})`,
        metadata: { method, reference: ref },
      });
      // Notify seller
      if (transaction.seller_id) {
        const { data: sellerProfile } = await supabase.from('profiles').select('id').eq('id', transaction.seller_id).single();
        if (sellerProfile) {
          await supabase.from('notifications').insert({
            profile_id: sellerProfile.id,
            type: 'payment_success',
            title: 'Transaction Funded',
            body: `"${transaction.title}" has been funded (${formatCents(transaction.amount_cents)}).`,
          });
        }
      }
      setStage('success');
      toast({ title: 'Payment Successful', description: `Reference: ${ref}` });
    } else {
      await supabase.from('payments').insert({
        transaction_id: transaction.id,
        provider: 'simulated',
        method,
        simulated_reference: ref,
        payment_status: 'FAILED',
        amount_cents: transaction.amount_cents,
      });
      await supabase.from('transactions').update({ status: 'awaiting_payment' }).eq('id', transaction.id);
      await supabase.from('transaction_events').insert({
        transaction_id: transaction.id,
        actor_profile_id: buyerProfileId,
        event_type: 'payment_failed',
        message: `Payment attempt failed (Ref: ${ref})`,
        metadata: { method, reference: ref },
      });
      setStage('failure');
      toast({ title: 'Payment Failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleClose = () => {
    if (stage === 'success' || stage === 'failure') {
      onComplete();
    }
    setStage('select');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fund Transaction</DialogTitle>
          <DialogDescription>Simulated payment for "{transaction.title}"</DialogDescription>
        </DialogHeader>

        {stage === 'select' && (
          <div className="space-y-5">
            <div className="text-center py-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">{formatCents(transaction.amount_cents, transaction.currency)}</p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Method</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} className="grid grid-cols-3 gap-2">
                {[
                  { value: 'card', label: 'Card', icon: CreditCard },
                  { value: 'eft', label: 'EFT', icon: Building2 },
                  { value: 'wallet', label: 'Wallet', icon: Wallet },
                ].map(({ value, label, icon: Icon }) => (
                  <Label
                    key={value}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      method === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="force-success" className="text-sm">Force success (testing)</Label>
              <Switch id="force-success" checked={forceSuccess} onCheckedChange={setForceSuccess} />
            </div>

            <Button onClick={handlePay} className="w-full">Pay Now</Button>
          </div>
        )}

        {stage === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-medium">Processing payment...</p>
            <p className="text-xs text-muted-foreground">Please wait while we verify your payment</p>
          </div>
        )}

        {stage === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-lg font-semibold">Payment Successful</p>
            <p className="text-sm text-muted-foreground">Funds are now held in escrow</p>
            <Button onClick={handleClose} className="mt-2">Done</Button>
          </div>
        )}

        {stage === 'failure' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-semibold">Payment Failed</p>
            <p className="text-sm text-muted-foreground">Your payment could not be processed</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={handleClose}>Close</Button>
              <Button onClick={() => setStage('select')}>Try Again</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
