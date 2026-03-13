import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface PINInputProps {
  onComplete: (pin: string) => void;
  disabled?: boolean;
}

export function PINInput({ onComplete, disabled }: PINInputProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground font-medium">Enter 6-digit completion PIN</p>
      <InputOTP maxLength={6} onComplete={onComplete} disabled={disabled}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
