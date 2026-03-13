const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();

  // TEMP: paste this in and check browser console
  console.log('supabase url:', import.meta.env.VITE_SUPABASE_URL)
  console.log('supabase key:', import.meta.env.VITE_SUPABASE_ANON_KEY)}

import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Zap, MailCheck } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"client" | "hustler" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!role) {
      toast.error("Please select a role before continuing");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Upsert profile (in case trigger doesn't fire immediately)
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          full_name: fullName,
          role: role,
          kyc_status: "pending",
          balance: 0,
        });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
      }
    }

    setLoading(false);
    setShowVerificationModal(true);
  };

  const handleResendEmail = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification email resent!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Verification waiting modal */}
      <Dialog open={showVerificationModal}>
        <DialogContent
          className="max-w-sm text-center"
          // Prevent closing by clicking outside
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <MailCheck className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle>Check your email</DialogTitle>
            <DialogDescription className="text-center">
              We sent a verification link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Click the link to verify your account, then sign in.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Didn't receive it? Check your spam folder or resend below.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={resending}
            >
              {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resending ? "Resending..." : "Resend verification email"}
            </Button>
            <Link to="/login" className="block">
              <Button variant="ghost" className="w-full text-muted-foreground">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signup form */}
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Gig<span className="text-primary">Hold</span>
          </CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Jane Smith"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min 6 characters"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>I want to...</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    role === "client"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <ShoppingBag className="h-6 w-6" />
                  <span className="font-medium text-sm">Post Gigs</span>
                  <span className="text-xs text-muted-foreground text-center">
                    I need tasks done
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("hustler")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    role === "hustler"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Zap className="h-6 w-6" />
                  <span className="font-medium text-sm">Do Gigs</span>
                  <span className="text-xs text-muted-foreground text-center">
                    I want to earn money
                  </span>
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !role}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}