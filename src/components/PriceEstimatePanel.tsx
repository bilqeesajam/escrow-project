import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Check, TrendingUp } from "lucide-react";
import type { PriceCalculationResult } from "@/lib/price-calculator";

interface PriceEstimatePanelProps {
  result: PriceCalculationResult | null;
  isLoading?: boolean;
  userBudget?: number;
  belowMinimumAcknowledged?: boolean;
  onAcceptSuggested?: () => void;
}

export function PriceEstimatePanel({
  result,
  isLoading = false,
  userBudget,
  belowMinimumAcknowledged = false,
  onAcceptSuggested,
}: PriceEstimatePanelProps) {
  if (!result || isLoading) {
    return (
      <Card className="border-2 bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Gig Budget Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{isLoading ? "🔄 Calculating smart price..." : "📝 Enter category details to calculate price"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isBelowMinimum = userBudget ? userBudget < result.minimumPrice : false;
  const isAboveMaximum = userBudget ? userBudget > result.maximumPrice : false;
  const isOutOfBand = isBelowMinimum || isAboveMaximum;

  // Calculate position on range
  const range = result.maximumPrice - result.minimumPrice;
  const position = userBudget ? ((userBudget - result.minimumPrice) / range) * 100 : 50;
  const clampedPosition = Math.max(0, Math.min(100, position));
  
  // Determine color based on position
  let statusColor = "text-green-600";
  let barColor = "bg-green-500";
  if (isBelowMinimum) {
    statusColor = "text-orange-600";
    barColor = "bg-orange-500";
  } else if (isAboveMaximum) {
    statusColor = "text-red-600";
    barColor = "bg-red-500";
  }

  return (
    <Card className="border-2 bg-gradient-to-br from-card to-muted/20 sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Gig Budget Estimate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Price Display */}
        <div className="space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium">Suggested Budget</span>
            <span className={`text-3xl font-bold ${statusColor}`}>
              R{result.suggestedBudget.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Price Range Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Min: R{result.minimumPrice.toFixed(2)}</span>
            <span>Max: R{result.maximumPrice.toFixed(2)}</span>
          </div>
          
          {/* Visual Range Bar */}
          <div className="relative h-2 bg-border rounded-full overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-green-500 to-red-500 opacity-20" />
            
            {/* User budget indicator */}
            {userBudget && userBudget > 0 && (
              <div
                className={`absolute h-full ${barColor} rounded-full transition-all duration-300`}
                style={{ width: `${Math.max(5, clampedPosition)}%` }}
              />
            )}
          </div>

          {/* Status indicator */}
          {userBudget && userBudget > 0 && (
            <p className={`text-xs font-medium ${statusColor}`}>
              {isBelowMinimum && "🔻 Below recommended range"}
              {!isBelowMinimum && !isAboveMaximum && "✓ Within recommended range"}
              {isAboveMaximum && "⬆️ Above recommended range"}
            </p>
          )}
        </div>

        {/* Fee Breakdown */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm border border-border">
          <div className="flex justify-between font-medium">
            <span>Your Budget</span>
            <span className="font-mono">R{result.suggestedBudget.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>💰 Platform Fee ({((result.platformFee / result.suggestedBudget) * 100).toFixed(1)}%)</span>
              <span className="font-mono">-R{result.platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>🏦 PayFast Fee ({((result.payfastFee / result.suggestedBudget) * 100).toFixed(1)}%)</span>
              <span className="font-mono">-R{result.payfastFee.toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
            <span>Hustler Receives 🎯</span>
            <span className="font-mono text-accent">R{result.hustlerReceives.toFixed(2)}</span>
          </div>
        </div>

        {/* Warning if below minimum */}
        {isBelowMinimum && !belowMinimumAcknowledged && (
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-600 text-xs">
              Your budget may not attract experienced hustlers. Consider increasing to R{result.minimumPrice.toFixed(2)}.
            </AlertDescription>
          </Alert>
        )}

        {/* Accept Suggested Button */}
        {userBudget !== result.suggestedBudget && onAcceptSuggested && (
          <button
            type="button"
            onClick={onAcceptSuggested}
            className="w-full py-2.5 px-3 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group"
          >
            <Check className="h-4 w-4 group-hover:scale-110 transition-transform" />
            Use Suggested Price
          </button>
        )}

        {/* Out of band acknowledgment */}
        {isOutOfBand && userBudget && belowMinimumAcknowledged && (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Check className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-600 text-xs">
              You've acknowledged the risks of this pricing.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
