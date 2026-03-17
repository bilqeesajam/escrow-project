import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Zap } from "lucide-react";

interface GigPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gig: {
    title: string;
    description: string;
    category: string;
    location: string;
    budget: number;
    pricingMode: "fixed" | "smart";
    hustlerReceives?: number;
  };
  onConfirm: () => void;
  isLoading?: boolean;
}

export function GigPreviewDialog({
  open,
  onOpenChange,
  gig,
  onConfirm,
  isLoading = false,
}: GigPreviewDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Review Your Gig</AlertDialogTitle>
          <AlertDialogDescription>
            Make sure everything looks good before posting
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Title</p>
            <h3 className="text-lg font-semibold">{gig.title}</h3>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm line-clamp-3">{gig.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Category</p>
              <Badge variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                {gig.category.charAt(0).toUpperCase() + gig.category.slice(1)}
              </Badge>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Location</p>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{gig.location}</span>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Budget</span>
              <span className="text-lg font-bold text-accent">R{gig.budget.toFixed(2)}</span>
            </div>
            {gig.pricingMode === "smart" && gig.hustlerReceives !== undefined && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Hustler Receives</span>
                <span className="text-sm font-semibold">R{gig.hustlerReceives.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Pricing Mode */}
          <div className="text-xs text-muted-foreground">
            Pricing Mode: <span className="font-semibold capitalize">{gig.pricingMode}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <AlertDialogCancel disabled={isLoading}>Edit</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isLoading ? "Posting..." : "Post Gig"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
