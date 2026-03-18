import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { Briefcase, ShoppingBag, Loader2 } from "lucide-react";

export default function ChooseRolePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Once auth is ready, redirect users who already have a role
  useEffect(() => {
    if (loading) return;

    // Not signed in at all — send to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Already has a role — skip this page entirely
    if (profile?.role) {
      if (profile.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (profile.kyc_status === "approved") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/kyc", { replace: true });
      }
    }

    // role is null → stay on this page so they can pick
  }, [user, profile, loading, navigate]);

  const selectRole = async (role: "client" | "hustler") => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, role });

      if (error) throw error;

      // Keep user_roles table in sync
      await supabase.from("user_roles").upsert({ user_id: user.id, role });

      await refreshProfile();
      navigate("/kyc", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Show spinner while auth is resolving or while redirecting existing users
  if (loading || (user && profile?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Choose Your Role</CardTitle>
          <CardDescription>How will you use GigHold?</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <button
            onClick={() => selectRole("client")}
            disabled={saving}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="rounded-full bg-primary/10 p-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Client</p>
              <p className="text-xs text-muted-foreground">Post tasks & hire hustlers</p>
            </div>
          </button>

          <button
            onClick={() => selectRole("hustler")}
            disabled={saving}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="rounded-full bg-primary/10 p-4">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Hustler</p>
              <p className="text-xs text-muted-foreground">Find gigs & earn money</p>
            </div>
          </button>

          {saving && (
            <div className="col-span-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving your role…
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}