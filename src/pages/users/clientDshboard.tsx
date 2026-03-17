import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth-context";
import { AppLayout } from "../../components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import {
  Loader2, Plus, ArrowRight, Wallet, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, Banknote, ShieldCheck, FileClock,
} from "lucide-react";
import type { Tables } from "../../integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Gig = Tables<"gigs">;

// ─── Status pill (same config as MyGigsPage) ─────────────────────────────────
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("gigs")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Could not load gigs.");
        setGigs(data ?? []);
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

  // ── Derived numbers ────────────────────────────────────────────────────────
  const activeGigs      = gigs.filter(g => ["open", "accepted", "in_progress"].includes(g.status));
  const awaitingConfirm = gigs.filter(g => g.status === "pending_confirmation" && !g.client_confirmed);
  const disputedGigs    = gigs.filter(g => g.status === "disputed");
  const recentGigs      = gigs.slice(0, 5);

  // Money currently locked in escrow (accepted + in_progress)
  const escrowTotal = gigs
    .filter(g => ["accepted", "in_progress", "pending_confirmation"].includes(g.status))
    .reduce((sum, g) => sum + Number(g.pricing_total ?? g.budget), 0);

  // Total spent (completed gigs)
  const totalSpent = gigs
    .filter(g => g.status === "completed")
    .reduce((sum, g) => sum + Number(g.pricing_total ?? g.budget), 0);

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
              Here's what's happening with your gigs today.
            </p>
          </div>
          <Button
            onClick={() => navigate("/post-gig")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 mr-2" /> Post a Gig
          </Button>
        </div>

        {/* ── Wallet + escrow ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 opacity-80">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Wallet Balance</span>
              </div>
              <p className="text-3xl font-extrabold">{zar(Number(profile?.balance ?? 0))}</p>
              <p className="text-xs opacity-70 mt-1">Available to spend</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-medium">In Escrow</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground">{zar(escrowTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">Locked across active gigs</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <Banknote className="h-4 w-4" />
                <span className="text-sm font-medium">Total Spent</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground">{zar(totalSpent)}</p>
              <p className="text-xs text-muted-foreground mt-1">Across completed gigs</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Action required banners ────────────────────────────────────── */}
        {awaitingConfirm.length > 0 && (
          <button
            onClick={() => navigate(`/gig/${awaitingConfirm[0].id}`)}
            className="w-full text-left flex items-center justify-between gap-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 px-5 py-4 hover:bg-blue-500/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileClock className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {awaitingConfirm.length} gig{awaitingConfirm.length > 1 ? "s" : ""} awaiting your confirmation
                </p>
                <p className="text-xs text-muted-foreground">Hustler has marked the work done — release the PIN.</p>
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

        {/* ── Quick stats row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active Gigs",    value: activeGigs.length,   icon: Clock,        color: "text-sky-500"     },
            { label: "Needs Action",   value: awaitingConfirm.length, icon: FileClock, color: "text-blue-500"    },
            { label: "Disputed",       value: disputedGigs.length, icon: AlertTriangle, color: "text-destructive" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Recent gigs ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Gigs</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/my-gigs")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentGigs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No gigs yet.{" "}
                <button onClick={() => navigate("/post-gig")} className="underline text-primary">
                  Post your first one.
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentGigs.map(gig => (
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
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-sm font-semibold text-foreground">{zar(Number(gig.pricing_total ?? gig.budget))}</span>
                      <StatusPill status={gig.status} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}