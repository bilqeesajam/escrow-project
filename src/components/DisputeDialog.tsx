import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

interface Props {
  transactionId: string;
  profileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function DisputeDialog({ transactionId, profileId, open, onOpenChange, onComplete }: Props) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim() || !description.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await supabase.from('disputes').insert({
        transaction_id: transactionId,
        opened_by_profile_id: profileId,
        reason,
        description,
        status: 'open',
      });
      await supabase.from('transactions').update({ status: 'dispute_open' }).eq('id', transactionId);
      await supabase.from('transaction_events').insert({
        transaction_id: transactionId,
        actor_profile_id: profileId,
        event_type: 'dispute_opened',
        message: `Dispute opened: ${reason}`,
      });
      toast({ title: 'Dispute opened' });
      setReason('');
      setDescription('');
      onComplete();
      onOpenChange(false);
    } catch {
      toast({ title: 'Error opening dispute', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Dispute</DialogTitle>
          <DialogDescription>Describe the issue with this transaction</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Item not as described" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details..." rows={4} />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Dispute'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
