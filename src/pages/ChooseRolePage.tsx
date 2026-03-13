import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Briefcase, ShoppingBag, Loader2 } from "lucide-react";

export default function ChooseRolePage() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const selectRole = async (role: "client" | "hustler") => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, role });
    if (error) {
      toast.error(error.message);
    } else {
      // Also insert into user_roles table
      await supabase.from("user_roles").upsert({ user_id: user.id, role });
      await refreshProfile();
      navigate("/kyc");
    }
    setLoading(false);
  };

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
            disabled={loading}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
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
            disabled={loading}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="rounded-full bg-primary/10 p-4">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Hustler</p>
              <p className="text-xs text-muted-foreground">Find gigs & earn money</p>
            </div>
          </button>
          {loading && <Loader2 className="h-6 w-6 animate-spin mx-auto col-span-2 text-primary" />}
        </CardContent>
      </Card>
    </div>
  );
}
