import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface BelowMinimumWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedPrice: number;
  userBudget: number;
  onConfirm: (acknowledged: boolean) => void;
  isLoading?: boolean;
}

export function BelowMinimumWarningDialog({
  open,
  onOpenChange,
  suggestedPrice,
  userBudget,
  onConfirm,
  isLoading = false,
}: BelowMinimumWarningDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConfirm = () => {
    onConfirm(acknowledged);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertDialogTitle>Budget Below Recommended</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <div>
              <p className="font-medium text-foreground">
                Your budget (R{userBudget.toFixed(2)}) is below the recommended minimum of R{suggestedPrice.toFixed(2)}.
              </p>
            </div>
            <div className="text-sm">
              <p className="mb-2">Setting a lower budget may result in:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Fewer available hustlers to bid on your gig</li>
                <li>Lower quality proposals</li>
                <li>Longer wait times to get the work done</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border">
              <Checkbox
                id="acknowledge-risk"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
              />
              <Label
                htmlFor="acknowledge-risk"
                className="text-xs cursor-pointer font-medium"
              >
                I understand the risk. Proceed anyway.
              </Label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 mt-4">
          <AlertDialogCancel disabled={isLoading}>Change Budget</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!acknowledged || isLoading}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isLoading ? "Posting..." : "Post Gig Anyway"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
