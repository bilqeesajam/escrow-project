import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Loader2, Search, X, Plus, Bell } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Gig = Tables<"gigs">;

// Supabase join: gigs + hustler profile
type GigWithHustler = Gig & {
  hustler: Pick<Tables<"profiles">, "id" | "full_name"> | null;
};

// ─── Status config (single source of truth for labels + colours) ──────────────

type GigStatus = Gig["status"];

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  open:                 { label: "Pending Placement",   className: "bg-amber-500/10  text-amber-500  border border-amber-500/20"  },
  pending_confirmation: { label: "Pending Confirmation", className: "bg-blue-500/10   text-blue-500   border border-blue-500/20"   },
  accepted:             { label: "Funds Secured",        className: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
  in_progress:          { label: "In Progress",          className: "bg-sky-500/10    text-sky-500    border border-sky-500/20"    },
  completed:            { label: "Completed",            className: "bg-green-500/10  text-green-500  border border-green-500/20"  },
  disputed:             { label: "Disputed",             className: "bg-red-500/10    text-red-500    border border-red-500/20"    },
  cancelled:            { label: "Cancelled",            className: "bg-zinc-500/10   text-zinc-400   border border-zinc-500/20"   },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ─── Tab section definitions ──────────────────────────────────────────────────

// Maps each logical tab to the DB status values it contains
const TAB_STATUSES: Record<string, string[]> = {
  all:       [],   // handled separately (all items)
  pending:   ["open", "pending_confirmation"],
  active:    ["accepted", "in_progress"],
  completed: ["completed"],
  disputed:  ["disputed", "cancelled"],
};

const TAB_LABELS: Record<string, string> = {
  all:       "All",
  pending:   "Pending",
  active:    "Active",
  completed: "Completed",
  disputed:  "Disputed",
};

// ─── GigCard ──────────────────────────────────────────────────────────────────

interface GigCardProps {
  gig: GigWithHustler;
  currentUserId: string;
  onViewDetails: () => void;
  onNotifySeller: () => void;
  onGoToDispute: () => void;
}

const GigCard = ({ gig, currentUserId, onViewDetails, onNotifySeller, onGoToDispute }: GigCardProps) => {
  const isDisputed = gig.status === "disputed";
  const hustlerName = gig.hustler?.full_name ?? "Unassigned";

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col gap-5 transition-colors hover:border-primary/30">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-card-foreground truncate capitalize">{gig.title}</h3>
          <span className="text-[10px] font-mono text-muted-foreground">#{gig.id.slice(0, 8)}</span>
        </div>
        <StatusPill status={gig.status} />
      </div>

      {/* Body */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-semibold text-card-foreground">R{Number(gig.budget).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Seller</span>
          <span className="font-medium text-card-foreground">{hustlerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Posted</span>
          <span className="text-card-foreground">{new Date(gig.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mt-auto pt-1">
        <Button
          variant="outline"
          onClick={onViewDetails}
          className="border-border bg-transparent text-foreground hover:bg-muted"
        >
          View Details
        </Button>

        {isDisputed ? (
          <Button
            onClick={onGoToDispute}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
          >
            Dispute Resolution
          </Button>
        ) : gig.hustler_id ? (
          <Button
            onClick={onNotifySeller}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Bell className="h-4 w-4 mr-1.5" />
            Notify Seller
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled
            className="opacity-50 cursor-not-allowed"
          >
            No Seller Yet
          </Button>
        )}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyGigsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [gigs, setGigs] = useState<GigWithHustler[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifyingGigId, setNotifyingGigId] = useState<string | null>(null);

  // ── Fetch gigs joined with hustler profile ──────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from("gigs")
      .select("*, hustler:profiles!gigs_hustler_id_fkey(id, full_name)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching gigs:", error);
          toast({ title: "Error", description: "Could not load your gigs.", variant: "destructive" });
        }
        setGigs((data as GigWithHustler[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  // ── Search: title, budget (as string), hustler name ─────────────────────────
  const q = searchQuery.toLowerCase().trim();
  const filteredGigs = gigs.filter((g) => {
    if (!q) return true;
    const titleMatch   = g.title.toLowerCase().includes(q);
    const budgetMatch  = String(g.budget).includes(q);
    const sellerMatch  = (g.hustler?.full_name ?? "").toLowerCase().includes(q);
    return titleMatch || budgetMatch || sellerMatch;
  });

  // ── Tab items ────────────────────────────────────────────────────────────────
  const getTabItems = (key: string) => {
    if (key === "all") return filteredGigs;
    return filteredGigs.filter((g) => TAB_STATUSES[key]?.includes(g.status));
  };

  // ── Notify Seller: insert a notification for the hustler ────────────────────
  const handleNotifySeller = async (gig: GigWithHustler) => {
    if (!gig.hustler_id) return;
    setNotifyingGigId(gig.id);
    const { error } = await supabase.from("notifications").insert({
      user_id: gig.hustler_id,
      message: `The client wants to get in touch regarding your gig: "${gig.title}". Please check in.`,
      gig_id: gig.id,
    });
    setNotifyingGigId(null);
    if (error) {
      toast({ title: "Error", description: "Could not send notification.", variant: "destructive" });
    } else {
      toast({ title: "Seller Notified", description: `A notification was sent to ${gig.hustler?.full_name ?? "the seller"}.` });
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">

        {/* HEADER */}
        <div className="w-full px-6 pt-10 pb-6 text-center">
          <h2 className="text-4xl font-extrabold text-foreground mb-2">My Transactions</h2>
          <p className="text-muted-foreground mb-8">Manage and track your active and past gigs</p>
        </div>

        <div className="w-full px-6">
          <Tabs defaultValue="all" className="w-full">

            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-muted/40 p-2 rounded-2xl border border-border backdrop-blur-sm">

              {/* TABS */}
              <TabsList className="bg-transparent gap-1 h-auto p-0 border-none flex flex-wrap">
                {Object.keys(TAB_LABELS).map((key) => {
                  const count = getTabItems(key).length;
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="rounded-xl px-5 py-2 text-muted-foreground font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                    >
                      {TAB_LABELS[key]}
                      <span className="ml-1 opacity-50 text-xs">({count})</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* SEARCH + POST GIG */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search title, budget or seller…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border text-foreground pl-9 pr-8 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Button
                  onClick={() => navigate("/post-gig")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-4"
                >
                  <Plus className="h-5 w-5 mr-1" />
                  Post Gig
                </Button>
              </div>
            </div>

            {/* TAB CONTENT */}
            {Object.keys(TAB_LABELS).map((key) => {
              const items = getTabItems(key);
              return (
                <TabsContent
                  key={key}
                  value={key}
                  className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  {items.length === 0 ? (
                    <div className="py-24 text-center">
                      <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Briefcase className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Transactions Found</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                        {searchQuery
                          ? `No results for "${searchQuery}"`
                          : `No gigs in the ${TAB_LABELS[key]} category yet.`}
                      </p>
                      <Button
                        onClick={() => navigate("/post-gig")}
                        variant="outline"
                        className="border-border"
                      >
                        Create your first gig
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((gig) => (
                        <GigCard
                          key={gig.id}
                          gig={gig}
                          currentUserId={user?.id ?? ""}
                          onViewDetails={() => navigate(`/gig/${gig.id}`)}
                          onNotifySeller={() => handleNotifySeller(gig)}
                          onGoToDispute={() => navigate(`/gig/${gig.id}`)}
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