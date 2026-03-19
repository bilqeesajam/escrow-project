import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth-context";
import { AppLayout } from "../../components/AppLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import {
  Briefcase, Loader2, Search, X, Plus, ChevronRight,
  PlayCircle, CheckCircle2, AlertTriangle, MapPin, Clock,
  KeyRound,
} from "lucide-react";
import type { Tables } from "../../integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

const TAB_STATUSES: Record<string, string[]> = {
  all:       [],
  active:    ["accepted", "in_progress"],
  pending:   ["pending_confirmation"],
  completed: ["completed"],
  disputed:  ["disputed", "cancelled"],
};
const TAB_LABELS: Record<string, string> = {
  all:       "All",
  active:    "Active",
  pending:   "Needs Action",
  completed: "Completed",
  disputed:  "Disputed",
};

// ─── Inline PIN entry for job cards ──────────────────────────────────────────
function InlinePINEntry({
  onSubmit,
  loading,
}: {
  onSubmit: (pin: string) => void;
  loading: boolean;
}) {
  const [pin,   setPin]   = useState("");
  const [error, setError] = useState(false);

  const handleChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setPin(clean);
    setError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) { setError(true); return; }
    onSubmit(pin);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2"
      onClick={e => e.stopPropagation()}
    >
      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
        <KeyRound className="h-3.5 w-3.5" /> Enter the 6-digit PIN from the client
      </p>
      <div className="flex gap-2 items-start">
        <div className="flex-1 space-y-1">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={e => handleChange(e.target.value)}
            placeholder="000000"
            className={`h-9 rounded-xl font-mono text-center text-lg tracking-[0.4em] ${error ? "border-destructive" : ""}`}
            disabled={loading}
            autoFocus
          />
          {error && <p className="text-[10px] text-destructive">PIN must be exactly 6 digits.</p>}
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={loading || pin.length !== 6}
          className="h-9 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 px-4"
        >
          {loading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm</>}
        </Button>
      </div>
    </form>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────────────
interface JobCardProps {
  gig: Gig;
  onView: () => void;
  onStart: () => void;
  onDone: () => void;
  onPIN: (pin: string) => void;
  actionLoading: boolean;
}

function JobCard({ gig, onView, onStart, onDone, onPIN, actionLoading }: JobCardProps) {
  const showPINEntry  = gig.status === "pending_confirmation";
  const waitingForPIN = gig.status === "pending_confirmation" && !gig.client_confirmed;

  const nextAction = (() => {
    if (gig.status === "accepted")    return { label: "Mark as Started", onClick: onStart, icon: PlayCircle,   variant: "default" as const };
    if (gig.status === "in_progress") return { label: "Mark as Done",    onClick: onDone,  icon: CheckCircle2, variant: "default" as const };
    return null;
  })();

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-card-foreground capitalize truncate">{gig.title}</h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <StatusPill status={gig.status} />
            {gig.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {gig.location}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-extrabold text-foreground">{zar(Number(gig.pricing_total ?? gig.budget))}</p>
          <p className="text-[10px] font-mono text-muted-foreground">#{gig.id.slice(0, 6)}</p>
        </div>
      </div>

      {/* Description */}
      {gig.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{gig.description}</p>
      )}

      {/* Status banners */}
      {waitingForPIN && (
        <div className="flex items-start gap-2 rounded-xl bg-blue-500/5 border border-blue-500/20 px-3 py-2 text-xs text-blue-500">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin mt-0.5" />
          <span>Waiting for the client to confirm. Once they share the PIN with you, enter it below.</span>
        </div>
      )}
      {gig.status === "pending_confirmation" && gig.client_confirmed && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <KeyRound className="h-3.5 w-3.5 shrink-0" />
          Client has released the PIN — enter it below to collect your payment!
        </div>
      )}
      {gig.status === "disputed" && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/20 px-3 py-2 text-xs text-red-500">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Dispute under review — check notifications for updates.
        </div>
      )}

      {/* Footer row */}
      {/* Footer row — View + next action only */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {gig.created_at ? formatDistanceToNow(new Date(gig.created_at), { addSuffix: true }) : ""}
        </span>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="border-border text-foreground hover:bg-muted rounded-xl px-3"
          >
            View <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>

          {nextAction && (
            <Button
              size="sm"
              variant={nextAction.variant}
              onClick={nextAction.onClick}
              disabled={actionLoading}
              className="font-semibold rounded-xl px-3"
            >
              {actionLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <nextAction.icon className="h-3.5 w-3.5 mr-1" />}
              {nextAction.label}
            </Button>
          )}
        </div>
      </div>

      {/* PIN entry — full width below footer, only when PIN is ready */}
      {showPINEntry && (
        <InlinePINEntry onSubmit={onPIN} loading={actionLoading} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyJobsPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [gigs,          setGigs]          = useState<Gig[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [actionGigId,   setActionGigId]   = useState<string | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");

  const fetchGigs = () => {
    if (!user) return;
    supabase
      .from("gigs")
      .select("*")
      .eq("hustler_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Could not load jobs.");
        setGigs(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchGigs(); }, [user]);

  const handleStart = async (gig: Gig) => {
    setActionGigId(gig.id);
    const { error } = await supabase.from("gigs").update({ status: "in_progress" as any }).eq("id", gig.id);
    if (error) toast.error("Could not update gig.");
    else { toast.success("Marked as started."); fetchGigs(); }
    setActionGigId(null);
  };

  const handleDone = async (gig: Gig) => {
    setActionGigId(gig.id);
    const { error } = await supabase.from("gigs").update({ status: "pending_confirmation" as any, hustler_confirmed: true }).eq("id", gig.id);
    if (error) { toast.error("Could not update gig."); setActionGigId(null); return; }
    await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Hustler marked "${gig.title}" as done. Please confirm & release PIN.`, gig_id: gig.id });
    toast.success("Marked as done. Waiting for client to release PIN.");
    fetchGigs();
    setActionGigId(null);
  };

  // ── PIN submission from job card ──────────────────────────────────────────
  const handlePIN = async (gig: Gig, pin: string) => {
    // Re-fetch the gig to get the latest completion_pin
    const { data: freshGig } = await supabase.from("gigs").select("completion_pin, pricing_total, pricing_fee, pricing_subtotal, budget, platform_fee_percentage").eq("id", gig.id).single();
    if (!freshGig) { toast.error("Could not verify PIN. Try again."); return; }
    if (pin !== freshGig.completion_pin) { toast.error("Invalid PIN. Please check with the client."); return; }

    setActionGigId(gig.id);

    const subtotal = freshGig.pricing_subtotal ?? freshGig.budget;
    const feeAmt   = freshGig.pricing_fee ?? null;
    const total    = freshGig.pricing_total ?? freshGig.budget;
    const feePct   = freshGig.platform_fee_percentage ?? null;
    const payout   = feeAmt != null ? Number(total) - feeAmt : Number(freshGig.budget);

    await supabase.from("gigs").update({ status: "completed" as any, hustler_confirmed: true }).eq("id", gig.id);

    const { data: hProfile } = await supabase.from("profiles").select("balance").eq("id", user!.id).single();
    await supabase.from("profiles").update({ balance: (hProfile?.balance ?? 0) + payout }).eq("id", user!.id);

    await supabase.from("transactions").insert({
      gig_id: gig.id, to_user_id: user!.id, from_user_id: gig.client_id,
      amount: payout, type: "release" as const,
      fee_amount: feeAmt, fee_percentage: feePct,
      subtotal_amount: subtotal, total_amount: total,
    });

    await supabase.from("notifications").insert({ user_id: user!.id, message: `R ${payout.toFixed(2)} released for "${gig.title}".`, gig_id: gig.id });
    await supabase.from("notifications").insert({ user_id: gig.client_id, message: `"${gig.title}" completed. Funds released.`, gig_id: gig.id });

    await refreshProfile();
    toast.success(`Gig completed! R ${payout.toFixed(2)} added to your wallet.`);
    setActionGigId(null);
    fetchGigs();
  };

  const q = searchQuery.toLowerCase().trim();
  const filteredGigs = gigs.filter(g =>
    !q || g.title.toLowerCase().includes(q) || (g.location ?? "").toLowerCase().includes(q)
  );
  const getTabItems = (key: string) =>
    key === "all" ? filteredGigs : filteredGigs.filter(g => TAB_STATUSES[key]?.includes(g.status));

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">

        <div className="w-full px-6 pt-10 pb-6 text-center">
          <h2 className="text-4xl font-extrabold text-foreground mb-2">My Jobs</h2>
          <p className="text-muted-foreground mb-8">Track and action your active hustles</p>
        </div>

        <div className="w-full px-6">
          <Tabs defaultValue="all" className="w-full">

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-muted/40 p-2 rounded-2xl border border-border backdrop-blur-sm">
              <TabsList className="bg-transparent gap-1 h-auto p-0 border-none flex flex-wrap">
                {Object.keys(TAB_LABELS).map(key => {
                  const count = getTabItems(key).length;
                  return (
                    <TabsTrigger key={key} value={key}
                      className="rounded-xl px-5 py-2 text-muted-foreground font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                    >
                      {TAB_LABELS[key]}
                      <span className="ml-1 opacity-50 text-xs">({count})</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="Search jobs…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border text-foreground pl-9 pr-8 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button onClick={() => navigate("/marketplace")} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-4">
                  <Plus className="h-5 w-5 mr-1" /> Find Gigs
                </Button>
              </div>
            </div>

            {Object.keys(TAB_LABELS).map(key => {
              const items = getTabItems(key);
              return (
                <TabsContent key={key} value={key} className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {items.length === 0 ? (
                    <div className="py-24 text-center">
                      <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Briefcase className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Jobs Found</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                        {searchQuery ? `No results for "${searchQuery}"` : `No jobs in the ${TAB_LABELS[key]} category yet.`}
                      </p>
                      <Button onClick={() => navigate("/marketplace")} variant="outline" className="border-border">Browse the marketplace</Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {items.map(gig => (
                        <JobCard
                          key={gig.id}
                          gig={gig}
                          onView={() => navigate(`/gig/${gig.id}`)}
                          onStart={() => handleStart(gig)}
                          onDone={() => handleDone(gig)}
                          onPIN={pin => handlePIN(gig, pin)}
                          actionLoading={actionGigId === gig.id}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}