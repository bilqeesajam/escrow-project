import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { PriceEstimatePanel } from "./PriceEstimatePanel";
import type { PriceCalculationResult } from "@/lib/price-calculator";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobilePriceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: PriceCalculationResult | null;
  isLoading?: boolean;
  userBudget?: number;
  belowMinimumAcknowledged?: boolean;
  onAcceptSuggested?: () => void;
}

export function MobilePriceSheet({
  open,
  onOpenChange,
  result,
  isLoading = false,
  userBudget,
  belowMinimumAcknowledged = false,
  onAcceptSuggested,
}: MobilePriceSheetProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Price Estimate</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
          <PriceEstimatePanel
            result={result}
            isLoading={isLoading}
            userBudget={userBudget}
            belowMinimumAcknowledged={belowMinimumAcknowledged}
            onAcceptSuggested={onAcceptSuggested}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
