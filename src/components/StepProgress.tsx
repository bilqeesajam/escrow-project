import { Check } from "lucide-react";

interface Step {
  label: string;
  completed: boolean;
  active: boolean;
}

interface StepProgressProps {
  steps: Step[];
}

const StepProgress = ({ steps }: StepProgressProps) => {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step.completed
                  ? "bg-accent text-accent-foreground"
                  : step.active
                  ? "bg-accent/20 text-accent border-2 border-accent"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.completed ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap ${step.active ? "text-accent" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mt-[-18px] ${step.completed ? "bg-accent" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepProgress;
