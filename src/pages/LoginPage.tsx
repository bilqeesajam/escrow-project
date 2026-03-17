import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (profile !== null) {
      if (profile.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (profile.kyc_status === "approved") {
        navigate("/dashboard", { replace: true });
      } else if (
        profile.kyc_status === "rejected" ||
        profile.kyc_status === "pending"
      ) {
        navigate("/kyc", { replace: true });
      }
    }
  }, [profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link to="/" className="inline-block group">
            <h1 className="text-4xl font-bold tracking-tight">
              Gig<span className="text-primary">Hold</span>
            </h1>
          </Link>
          <p className="text-muted-foreground mt-3 text-sm">
            Welcome back! Please enter your details
          </p>
        </div>

        {/* Main Card */}
        <Card className="bg-card border-primary/5 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-primary/10 hover:bg-primary/10 hover:border-primary/40 hover:text-foreground transition-all text-foreground"
              onClick={handleGoogleLogin}
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
            <div className="relative my-6">
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
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  disabled={loading}
                  className="h-11 border-primary/10 bg-primary/[0.02] focus:border-primary/30 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  disabled={loading}
                  className="h-11 border-primary/10 bg-primary/[0.02] focus:border-primary/30 transition-colors"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-5 bg-primary/[0.02] border-t border-primary/5">
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </Card>

        {/* Terms */}
        <p className="text-xs text-center text-muted-foreground/60 mt-6">
          By signing in, you agree to our{" "}
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