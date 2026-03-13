import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { DollarSign, Loader2, TrendingUp } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Gig = Tables<"gigs">;

export default function EarningsPage() {
  const { user, profile } = useAuth();
  const [completedGigs, setCompletedGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("gigs")
      .select("*")
      .eq("hustler_id", user.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .then(({ data }) => { setCompletedGigs(data || []); setLoading(false); });
  }, [user]);

  const totalEarnings = completedGigs.reduce((sum, g: any) => sum + (g.pricing_subtotal ?? g.budget), 0);

  if (loading) return <AppLayout><div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold">Earnings</h2>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-3"><DollarSign className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <p className="text-xl font-bold font-mono">R{totalEarnings.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-xl font-bold font-mono">R{(profile?.balance || 0).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Completed Jobs</CardTitle></CardHeader>
          <CardContent>
            {completedGigs.length === 0 ? (
              <EmptyState icon={DollarSign} message="No completed jobs yet" />
            ) : (
              <div className="space-y-3">
                {completedGigs.map((gig) => (
                  <div key={gig.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{gig.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {gig.updated_at ? formatDistanceToNow(new Date(gig.updated_at), { addSuffix: true }) : ""}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-success text-sm">+R{((gig as any).pricing_subtotal ?? gig.budget).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
