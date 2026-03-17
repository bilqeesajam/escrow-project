import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth-context";
import { AppLayout } from "../../components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import {
  Loader2, ArrowRight, Wallet, Briefcase, ChevronRight,
  AlertTriangle, Banknote, Star, MapPin, Zap, CheckCircle2,
} from "lucide-react";
import type { Tables } from "../../integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Gig = Tables<"gigs">;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open:                 { label: "Pending Placement",    className: "bg-amber-500/10  text-amber-500   border border-amber-500/20"  },
  pending_confirmation: { label: "Pending Confirmation", className: "bg-blue-500/10   text-blue-500    border border-blue-500/20"   },
  accepted:             { label: "Funds Secured",        className: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
  in_progress:          { label: "In Progress",          className: "bg-sky-500/10    text-sky-500     border border-sky-500/20"    },
  completed:            { label: "Completed",            className: "bg-green-500/10  text-green-500   border border-green-500/20"  },
  disputed:             { label: "Disputed",             className: "bg-red-500/10    text-red-500     border border-red-500/20"    },
  cancelled:            { label: "Cancelled",            className: "bg-zinc-500/10   text-zinc-400    border border-zinc-500/20"   },
};
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground border border-border" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

export default function HustlerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [myGigs, setMyGigs]       = useState<Gig[]>([]);
  const [openGigs, setOpenGigs]   = useState<Gig[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      // Gigs this hustler has accepted
      supabase
        .from("gigs")
        .select("*")
        .eq("hustler_id", user.id)
        .order("created_at", { ascending: false }),
      // Open marketplace gigs (not yet taken)
      supabase
        .from("gigs")
        .select("*")
        .eq("status", "open")
        .is("hustler_id", null)
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([mine, open]) => {
      if (mine.error) toast.error("Could not load your gigs.");
      setMyGigs(mine.data ?? []);
      setOpenGigs(open.data ?? []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeGigs   = myGigs.filter(g => ["accepted", "in_progress"].includes(g.status));
  const pendingPin   = myGigs.filter(g => g.status === "pending_confirmation" && g.client_confirmed);
  const disputedGigs = myGigs.filter(g => g.status === "disputed");
  const completedGigs = myGigs.filter(g => g.status === "completed");

  // Total earned across completed gigs (net of fee if available)
  const totalEarned = completedGigs.reduce((sum, g) => {
    const fee = g.pricing_fee ?? 0;
    const total = Number(g.pricing_total ?? g.budget);
    return sum + (total - Number(fee));
  }, 0);

  // Pending payout: in-flight gigs
  const pendingPayout = activeGigs.reduce((sum, g) => sum + Number(g.pricing_total ?? g.budget), 0);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-10">

        {/* ── Greeting ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">
              Hey, {firstName} 
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ready to hustle? Here's your overview.
            </p>
          </div>
          <Button
            onClick={() => navigate("/marketplace")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 self-start sm:self-auto"
          >
            <Zap className="h-4 w-4 mr-2" /> Browse Gigs
          </Button>
        </div>

        {/* ── Earnings cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 opacity-80">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Wallet Balance</span>
              </div>
              <p className="text-3xl font-extrabold">{zar(Number(profile?.balance ?? 0))}</p>
              <p className="text-xs opacity-70 mt-1">Available to withdraw</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <Banknote className="h-4 w-4" />
                <span className="text-sm font-medium">Total Earned</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground">{zar(totalEarned)}</p>
              <p className="text-xs text-muted-foreground mt-1">From {completedGigs.length} completed gig{completedGigs.length !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">Pending Payout</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground">{zar(pendingPayout)}</p>
              <p className="text-xs text-muted-foreground mt-1">Across {activeGigs.length} active gig{activeGigs.length !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Action required: PIN waiting ───────────────────────────────── */}
        {pendingPin.length > 0 && (
          <button
            onClick={() => navigate(`/gig/${pendingPin[0].id}`)}
            className="w-full text-left flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4 hover:bg-emerald-500/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {pendingPin.length} gig{pendingPin.length > 1 ? "s" : ""} ready for PIN entry
                </p>
                <p className="text-xs text-muted-foreground">Client has released the PIN — enter it to collect your payment.</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        )}

        {disputedGigs.length > 0 && (
          <button
            onClick={() => navigate("/my-gigs")}
            className="w-full text-left flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 px-5 py-4 hover:bg-red-500/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {disputedGigs.length} active dispute{disputedGigs.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">Admin is reviewing — check your notifications for updates.</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        )}

        {/* ── Two-column: active gigs + marketplace preview ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Active gigs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> My Active Gigs
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-gigs")} className="text-xs text-muted-foreground">
                View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {activeGigs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10 px-4">
                  No active gigs.{" "}
                  <button onClick={() => navigate("/marketplace")} className="underline text-primary">Browse the marketplace.</button>
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {activeGigs.slice(0, 4).map(gig => (
                    <button
                      key={gig.id}
                      onClick={() => navigate(`/gig/${gig.id}`)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate capitalize">{gig.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {gig.created_at ? formatDistanceToNow(new Date(gig.created_at), { addSuffix: true }) : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <StatusPill status={gig.status} />
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open marketplace gigs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" /> Open Gigs Near You
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/marketplace")} className="text-xs text-muted-foreground">
                Browse all <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {openGigs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10 px-4">No open gigs right now. Check back soon.</p>
              ) : (
                <div className="divide-y divide-border">
                  {openGigs.map(gig => (
                    <button
                      key={gig.id}
                      onClick={() => navigate(`/gig/${gig.id}`)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate capitalize">{gig.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {gig.location ?? "No location"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-sm font-bold text-foreground">{zar(Number(gig.pricing_total ?? gig.budget))}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}