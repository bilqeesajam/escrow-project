import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Zap, Lock } from "lucide-react";

interface PricingModeExplainerProps {
  mode: "fixed" | "smart";
  configAvailable: boolean;
}

export function PricingModeExplainer({ mode, configAvailable }: PricingModeExplainerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-2"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-semibold">Pricing Modes</h4>

          {/* Fixed Price */}
          <Card className="p-3 bg-muted/50 border-0">
            <div className="flex gap-2">
              <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Fixed Price</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You set the price directly. Full control, but may not attract husslers with fair
                  compensation.
                </p>
              </div>
            </div>
          </Card>

          {/* Smart Price */}
          <Card className={`p-3 border-0 ${configAvailable ? "bg-accent/10" : "bg-muted/50"}`}>
            <div className="flex gap-2">
              <Zap className={`h-5 w-5 flex-shrink-0 mt-0.5 ${configAvailable ? "text-accent" : "text-muted-foreground"}`} />
              <div>
                <p className="font-medium text-sm">Smart Price</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Our algorithm suggests fair pricing based on category, complexity, and market
                  rates. Attracts quality hustlers.
                </p>
                {!configAvailable && (
                  <p className="text-xs text-destructive mt-2">❌ Currently unavailable</p>
                )}
              </div>
            </div>
          </Card>

          <div className="border-t pt-3 text-xs text-muted-foreground space-y-2">
            <p>
              <strong>Pro tip:</strong> Smart Price helps you set prices that attract experienced
              hustlers while staying fair.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
