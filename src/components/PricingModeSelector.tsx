import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PricingModeSelectorProps {
  mode: "fixed" | "smart";
  onModeChange: (mode: "fixed" | "smart") => void;
  configAvailable: boolean;
}

export function PricingModeSelector({
  mode,
  onModeChange,
  configAvailable,
}: PricingModeSelectorProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg">Pricing Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "fixed" ? "default" : "outline"}
            onClick={() => onModeChange("fixed")}
            className="flex-1"
          >
            Fixed Price
          </Button>
          <Button
            type="button"
            variant={mode === "smart" ? "default" : "outline"}
            onClick={() => onModeChange("smart")}
            className="flex-1"
            disabled={!configAvailable}
            title={configAvailable ? "" : "Pricing config unavailable"}
          >
            Smart Price
          </Button>
        </div>
        {!configAvailable && (
          <p className="text-xs text-muted-foreground mt-2">
            Smart Price mode is temporarily unavailable. Using Fixed Price mode.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
