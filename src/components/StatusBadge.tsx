import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS, STATUS_COLORS, type TransactionStatus } from '@/types/escrow';

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Badge className={`${STATUS_COLORS[status]} border-0 font-medium`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
