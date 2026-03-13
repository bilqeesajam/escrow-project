import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  cta?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, message, cta, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-center mb-4">{message}</p>
      {cta && onAction && (
        <Button onClick={onAction}>{cta}</Button>
      )}
    </div>
  );
}
