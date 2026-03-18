import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  MailCheck,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Zap,
  Sparkles,
} from "lucide-react";

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

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        role: role,
        kyc_status: "pending",
        balance: 0,
      });
    }

    setLoading(false);
    setShowVerificationModal(true);
  };

  const handleGoogleSignup = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Verification Modal */}
      <Dialog open={showVerificationModal}>
        <DialogContent className="sm:max-w-md border-primary/10 bg-card shadow-xl">
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2 text-center">
              <DialogTitle className="text-xl">Check your email</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                We've sent a verification link to{" "}
                <span className="font-medium text-foreground block mt-1">
                  {email}
                </span>
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={resending}
              className="border-primary/20 hover:bg-primary/5 hover:border-primary/30"
            >
              {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resending ? "Sending..." : "Resend verification email"}
            </Button>
            <Link to="/login">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Back to sign in
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-full max-w-4xl">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link to="/" className="inline-block group">
            <h1 className="text-4xl font-bold tracking-tight">
              Gig<span className="text-primary">Hold</span>
            </h1>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">
            Join thousands of professionals already on the platform
          </p>
        </div>

        {/* Main Card - Horizontal Layout */}
        <Card className="bg-card border-primary/5 shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left Column - Benefits/Info */}
            <div className="md:w-2/5 bg-primary/[0.02] p-8 border-b md:border-b-0 md:border-r border-primary/5">
              <div className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">
                      Start your journey today
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">For Clients</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Post projects and find talented freelancers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">For Hustlers</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Showcase your skills and earn money
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Secure payments</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Your earnings are always protected
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-primary/5">
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Signup Form */}
            <div className="md:w-3/5 p-8">
              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-primary/10 hover:bg-primary/10 hover:border-primary/40 hover:text-foreground transition-all text-foreground"
                onClick={handleGoogleSignup}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </Button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary/5" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground uppercase">
                    Or
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-medium">
                      Full name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="John Doe"
                      disabled={loading}
                      className="h-10 text-sm border-primary/10 bg-primary/[0.02] focus:border-primary/30 transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="john@example.com"
                      disabled={loading}
                      className="h-10 text-sm border-primary/10 bg-primary/[0.02] focus:border-primary/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Password - Full Width */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Create a password (min. 6 characters)"
                    disabled={loading}
                    className="h-10 text-sm border-primary/10 bg-primary/[0.02] focus:border-primary/30 transition-colors"
                  />
                </div>

                {/* Role Selection - Horizontal */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    I want to join as
                  </Label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("client")}
                      disabled={loading}
                      className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        role === "client"
                          ? "border-primary bg-primary/5"
                          : "border-primary/5 bg-primary/[0.02] hover:border-primary/20"
                      }`}
                    >
                      <ShoppingBag
                        className={`h-4 w-4 ${role === "client" ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span
                        className={`text-xs font-medium ${role === "client" ? "text-primary" : "text-muted-foreground"}`}
                      >
                        Client
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("hustler")}
                      disabled={loading}
                      className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        role === "hustler"
                          ? "border-primary bg-primary/5"
                          : "border-primary/5 bg-primary/[0.02] hover:border-primary/20"
                      }`}
                    >
                      <Zap
                        className={`h-4 w-4 ${role === "hustler" ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span
                        className={`text-xs font-medium ${role === "hustler" ? "text-primary" : "text-muted-foreground"}`}
                      >
                        Hustler
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all mt-2"
                  disabled={loading || !role}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </Card>

        {/* Terms */}
        <p className="text-xs text-center text-muted-foreground/60 mt-5">
          By creating an account, you agree to our{" "}
          <Link
            to="/terms"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}