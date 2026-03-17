import { Check } from "lucide-react";

interface FormProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function FormProgressIndicator({
  currentStep,
  totalSteps,
  steps,
}: FormProgressIndicatorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                index + 1 < currentStep
                  ? "bg-accent text-accent-foreground"
                  : index + 1 === currentStep
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1 < currentStep ? <Check className="h-5 w-5" /> : index + 1}
            </div>
            <span className="text-xs mt-2 text-center font-medium text-muted-foreground">
              {step}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 mt-5 rounded-full ${
                  index + 1 < currentStep ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
