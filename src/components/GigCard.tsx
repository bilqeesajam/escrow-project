import { MapPin, DollarSign, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Gig = Tables<"gigs">;

interface GigCardProps {
  gig: Gig;
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
  hustlerName?: string;
}

export function GigCard({ gig, actionLabel, onAction, onClick, hustlerName }: GigCardProps) {
  return (
    <Card className="glass-card hover:shadow-md transition-shadow cursor-pointer animate-fade-in" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-1">{gig.title}</CardTitle>
          <StatusBadge status={gig.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{gig.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">R{gig.budget.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {gig.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {gig.created_at ? formatDistanceToNow(new Date(gig.created_at), { addSuffix: true }) : ""}
          </span>
        </div>
        {hustlerName && (
          <p className="text-xs text-muted-foreground">Assigned to: <span className="font-medium text-foreground">{hustlerName}</span></p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{gig.category}</span>
        </div>
        {actionLabel && onAction && (
          <Button size="sm" className="w-full mt-2" onClick={(e) => { e.stopPropagation(); onAction(); }}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
