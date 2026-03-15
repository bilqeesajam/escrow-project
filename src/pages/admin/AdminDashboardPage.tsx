import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2, Users, Briefcase, AlertTriangle, Shield,
  ArrowRight, ChevronRight, TrendingUp, Banknote,
  Clock, CheckCircle2, XCircle, Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Profile     = Tables<"profiles">;
type Gig         = Tables<"gigs">;
type Dispute     = Tables<"disputes">;
type Transaction = Tables<"transactions">;

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

// ─── Status pill ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open:                 { label: "Open",      className: "bg-amber-500/10  text-amber-500  border border-amber-500/20"  },
  pending_confirmation: { label: "Pending",   className: "bg-blue-500/10   text-blue-500   border border-blue-500/20"   },
  accepted:             { label: "Accepted",  className: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
  in_progress:          { label: "Active",    className: "bg-sky-500/10    text-sky-500    border border-sky-500/20"    },
  completed:            { label: "Done",      className: "bg-green-500/10  text-green-500  border border-green-500/20"  },
  disputed:             { label: "Disputed",  className: "bg-red-500/10    text-red-500    border border-red-500/20"    },
  cancelled:            { label: "Cancelled", className: "bg-zinc-500/10   text-zinc-400   border border-zinc-500/20"   },
};
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground border border-border" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// KYC pill
const KYC_CONFIG: Record<string, string> = {
  pending:  "bg-amber-500/10 text-amber-500  border border-amber-500/20",
  approved: "bg-green-500/10 text-green-500  border border-green-500/20",
  rejected: "bg-red-500/10   text-red-500    border border-red-500/20",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Counts
  const [counts, setCounts] = useState({
    users: 0, pendingKyc: 0, openGigs: 0, disputes: 0, completedGigs: 0, cancelledGigs: 0,
  });

  // Platform revenue (sum of fee_amount from completed transactions)
  const [revenue, setRevenue] = useState(0);

  // Recent data for feeds
  const [recentKyc, setRecentKyc]         = useState<Profile[]>([]);
  const [recentDisputes, setRecentDisputes] = useState<Dispute[]>([]);
  const [recentGigs, setRecentGigs]         = useState<Gig[]>([]);
  const [recentTxns, setRecentTxns]         = useState<Transaction[]>([]);

  useEffect(() => {
    Promise.all([
      // Counts
      supabase.from("profiles").select("id",   { count: "exact", head: true }),
      supabase.from("profiles").select("id",   { count: "exact", head: true }).eq("kyc_status", "pending"),
      supabase.from("gigs")   .select("id",   { count: "exact", head: true }).eq("status", "open"),
      supabase.from("disputes").select("id",   { count: "exact", head: true }).eq("status", "open"),
      supabase.from("gigs")   .select("id",   { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("gigs")   .select("id",   { count: "exact", head: true }).eq("status", "cancelled"),
      // Revenue: sum fee_amount from all release transactions
      supabase.from("transactions").select("fee_amount").eq("type", "release"),
      // Recent feeds
      supabase.from("profiles").select("*").eq("kyc_status", "pending").order("created_at", { ascending: false }).limit(5),
      supabase.from("disputes").select("*").eq("status", "open").order("created_at",       { ascending: false }).limit(5),
      supabase.from("gigs")   .select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(6),
    ]).then(([u, k, g, d, comp, canc, txns, kycFeed, dispFeed, gigFeed, txnFeed]) => {
      setCounts({
        users:         u.count    ?? 0,
        pendingKyc:    k.count    ?? 0,
        openGigs:      g.count    ?? 0,
        disputes:      d.count    ?? 0,
        completedGigs: comp.count ?? 0,
        cancelledGigs: canc.count ?? 0,
      });

      const totalRevenue = (txns.data ?? []).reduce(
        (sum, t) => sum + Number(t.fee_amount ?? 0), 0
      );
      setRevenue(totalRevenue);

      setRecentKyc(kycFeed.data       ?? []);
      setRecentDisputes(dispFeed.data  ?? []);
      setRecentGigs(gigFeed.data       ?? []);
      setRecentTxns(txnFeed.data       ?? []);

      setLoading(false);
    }).catch(() => {
      toast.error("Failed to load dashboard data.");
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-10 animate-fade-in">

        {/* ── Title ──────────────────────────────────────────────────────── */}
        <div className="pt-2">
          <h1 className="text-3xl font-extrabold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform overview — all data live from Supabase.</p>
        </div>

        {/* ── Top stat cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users",       value: counts.users,         icon: Users,         color: "text-primary",     route: "/admin/users"     },
            { label: "Pending KYC",       value: counts.pendingKyc,    icon: Shield,        color: "text-amber-500",   route: "/admin/kyc"       },
            { label: "Open Gigs",         value: counts.openGigs,      icon: Briefcase,     color: "text-sky-500",     route: "/admin/gigs"      },
            { label: "Open Disputes",     value: counts.disputes,      icon: AlertTriangle, color: "text-destructive", route: "/admin/disputes"  },
          ].map(({ label, value, icon: Icon, color, route }) => (
            <Card
              key={label}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => navigate(route)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <p className="text-3xl font-extrabold text-foreground">{value}</p>
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Revenue + gig pipeline ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 opacity-80">
                <Banknote className="h-4 w-4" />
                <span className="text-sm font-medium">Platform Revenue</span>
              </div>
              <p className="text-3xl font-extrabold">{zar(revenue)}</p>
              <p className="text-xs opacity-70 mt-1">Total fees collected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Completed Gigs</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground">{counts.completedGigs}</p>
              <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Cancelled Gigs</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground">{counts.cancelledGigs}</p>
              <p className="text-xs text-muted-foreground mt-1">Refunded or disputed out</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Three feeds ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* KYC queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" /> KYC Queue
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/kyc")} className="text-xs text-muted-foreground h-7 px-2">
                Review <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentKyc.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No pending KYC submissions.</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentKyc.map(u => (
                    <button
                      key={u.id}
                      onClick={() => navigate("/admin/kyc")}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.full_name ?? "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{u.phone ?? "No phone"}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${KYC_CONFIG[u.kyc_status ?? "pending"]}`}>
                        {u.kyc_status ?? "pending"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open disputes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Open Disputes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/disputes")} className="text-xs text-muted-foreground h-7 px-2">
                Resolve <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentDisputes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No open disputes. 🎉</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentDisputes.map(d => (
                    <button
                      key={d.id}
                      onClick={() => navigate(`/admin/disputes`)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-1">{d.reason}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {d.created_at ? formatDistanceToNow(new Date(d.created_at), { addSuffix: true }) : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentTxns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentTxns.map(t => (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground capitalize">{t.type}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.created_at ? formatDistanceToNow(new Date(t.created_at), { addSuffix: true }) : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-bold text-foreground">{zar(Number(t.amount))}</p>
                        {t.fee_amount != null && (
                          <p className="text-[10px] text-muted-foreground">fee: {zar(Number(t.fee_amount))}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Latest gigs full-width ─────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" /> Latest Gigs
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/gigs")} className="text-xs text-muted-foreground h-7 px-2">
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentGigs.map(gig => (
                <button
                  key={gig.id}
                  onClick={() => navigate(`/gig/${gig.id}`)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate capitalize">{gig.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{gig.category}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-sm font-semibold text-foreground">{zar(Number(gig.pricing_total ?? gig.budget))}</span>
                    <StatusPill status={gig.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}