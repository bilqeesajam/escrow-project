import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  open: "bg-success/10 text-success border-success/20",
  accepted: "bg-info/10 text-info border-info/20",
  in_progress: "bg-info/10 text-info border-info/20",
  pending_confirmation: "bg-warning/10 text-warning border-warning/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  approved: "bg-success/10 text-success border-success/20",
  disputed: "bg-destructive/10 text-destructive border-destructive/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  under_review: "bg-warning/10 text-warning border-warning/20",
  resolved_client: "bg-success/10 text-success border-success/20",
  resolved_hustler: "bg-success/10 text-success border-success/20",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  accepted: "Accepted",
  in_progress: "In Progress",
  pending_confirmation: "Pending Confirmation",
  pending: "Pending",
  completed: "Completed",
  approved: "Approved",
  disputed: "Disputed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  under_review: "Under Review",
  resolved_client: "Resolved (Client)",
  resolved_hustler: "Resolved (Hustler)",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      statusStyles[status] || "bg-muted text-muted-foreground border-border"
    )}>
      {statusLabels[status] || status}
    </span>
  );
}
