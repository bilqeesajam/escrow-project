import { Badge } from "@/components/ui/badge";

type TransactionStatus = "draft" | "funded" | "delivered" | "completed" | "disputed" | "cancelled";

const statusConfig: Record<TransactionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "escrow" | "funded" }> = {
  draft: { label: "Draft", variant: "secondary" },
  funded: { label: "In Escrow", variant: "funded" },
  delivered: { label: "Delivered", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  disputed: { label: "Disputed", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface StatusBadgeProps {
  status: TransactionStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default StatusBadge;
export type { TransactionStatus };
