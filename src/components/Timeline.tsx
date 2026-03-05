import type { TransactionEvent } from '@/types/escrow';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText, UserCheck, CreditCard, CheckCircle2, XCircle,
  Truck, ThumbsUp, Unlock, AlertTriangle, Gavel, Ban, Clock
} from 'lucide-react';

const EVENT_ICONS: Record<string, React.ElementType> = {
  created: FileText,
  seller_accepted: UserCheck,
  payment_initiated: CreditCard,
  payment_success: CheckCircle2,
  payment_failed: XCircle,
  marked_delivered: Truck,
  buyer_confirmed: ThumbsUp,
  released: Unlock,
  dispute_opened: AlertTriangle,
  dispute_resolved: Gavel,
  cancelled: Ban,
};

export function Timeline({ events }: { events: TransactionEvent[] }) {
  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const Icon = EVENT_ICONS[event.event_type] || Clock;
        const isLast = idx === events.length - 1;
        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {!isLast && <div className="w-px bg-border flex-1 min-h-[24px]" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium">{event.message}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
