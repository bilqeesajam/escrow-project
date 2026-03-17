import { Check, AlertCircle } from "lucide-react";

interface FormFieldValidationProps {
  label: string;
  value: string;
  maxLength: number;
  required?: boolean;
  isValid?: boolean;
}

export function FormFieldValidation({
  label,
  value,
  maxLength,
  required = true,
  isValid,
}: FormFieldValidationProps) {
  const length = value.length;
  const isEmpty = length === 0;
  const isFull = length >= maxLength * 0.9;
  const isComplete = required ? length > 0 : true;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {isComplete && !isEmpty && (
          <div className="flex items-center gap-1">
            {isValid !== false && <Check className="h-3.5 w-3.5 text-accent" />}
            {isValid === false && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
          </div>
        )}
        <span className={`text-xs ${isFull ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
          {length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
