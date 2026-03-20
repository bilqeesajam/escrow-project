import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth-context";
import { AppLayout } from "../../components/AppLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import {
  ShoppingBag, Loader2, Search, X, SlidersHorizontal,
  ArrowUpDown, MapPin, Clock, ChevronRight,
} from "lucide-react";
import type { Tables } from "../../integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Gig = Tables<"gigs">;
type GigCategory = "errand" | "pickup" | "delivery" | "shopping" | "other";
type SortKey = "date_desc" | "date_asc" | "price_desc" | "price_asc";

const CATEGORIES: { value: GigCategory | "all"; label: string; emoji: string }[] = [
  { value: "all",      label: "All",      emoji: "🌐" },
  { value: "errand",   label: "Errand",   emoji: "🏃" },
  { value: "pickup",   label: "Pickup",   emoji: "📦" },
  { value: "delivery", label: "Delivery", emoji: "🚚" },
  { value: "shopping", label: "Shopping", emoji: "🛒" },
  { value: "other",    label: "Other",    emoji: "✨" },
];

const PRICE_RANGES: { label: string; min: number; max: number }[] = [
  { label: "Any price",    min: 0,    max: Infinity },
  { label: "Under R100",   min: 0,    max: 100      },
  { label: "R100 – R300",  min: 100,  max: 300      },
  { label: "R300 – R500",  min: 300,  max: 500      },
  { label: "Over R500",    min: 500,  max: Infinity },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc",  label: "Newest first"      },
  { value: "date_asc",   label: "Oldest first"      },
  { value: "price_desc", label: "Price: high → low" },
  { value: "price_asc",  label: "Price: low → high" },
];

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

const CATEGORY_STYLE: Record<string, string> = {
  errand:   "bg-amber-500/10  text-amber-500  border-amber-500/20",
  pickup:   "bg-sky-500/10    text-sky-500    border-sky-500/20",
  delivery: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  shopping: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  other:    "bg-zinc-500/10   text-zinc-400   border-zinc-500/20",
};

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLE[category] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${style} capitalize`}>
      {category}
    </span>
  );
}

interface GigCardProps {
  gig: Gig;
  onAccept: () => void;
  onView: () => void;
  accepting: boolean;
}

function MarketplaceGigCard({ gig, onAccept, onView, accepting }: GigCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-card-foreground capitalize truncate">{gig.title}</h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <CategoryBadge category={gig.category} />
            {gig.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {gig.location}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-extrabold text-foreground">{zar(Number(gig.pricing_total ?? gig.budget))}</p>
          <p className="text-[10px] text-muted-foreground font-mono">#{gig.id.slice(0, 6)}</p>
        </div>
      </div>

      {gig.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{gig.description}</p>
      )}

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
            className="border-border text-foreground hover:bg-muted rounded-xl px-4"
          >
            Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            disabled={accepting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-4"
          >
            {accepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Accept Gig"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [gigs, setGigs]               = useState<Gig[]>([]);
  const [loading, setLoading]         = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const [search, setSearch]             = useState("");
  const [category, setCategory]         = useState<GigCategory | "all">("all");
  const [priceRange, setPriceRange]     = useState(0);
  const [sort, setSort]                 = useState<SortKey>("date_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    supabase
      .from("gigs")
      .select("*")
      .eq("status", "open")
      .is("hustler_id", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Could not load gigs.");
        setGigs(data ?? []);
        setLoading(false);
      });
  }, []);

  // ── Accept gig — updates Supabase directly then calls backend to create transaction ──
  const handleAccept = async (gig: Gig) => {
    if (!user) return;
    setAcceptingId(gig.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast.error("Not authenticated."); setAcceptingId(null); return; }

      // Step 1 — Update gig status in Supabase directly
      const { error: gigError } = await supabase
        .from("gigs")
        .update({ hustler_id: user.id, status: "accepted" as any })
        .eq("id", gig.id);

      if (gigError) {
        toast.error("Could not accept gig.");
        setAcceptingId(null);
        return;
      }

      // Step 2 — Call backend to create the escrow transaction
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/transactions/create-from-gig/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gig_id: gig.id,
            client_id: gig.client_id,
            amount: Number(gig.pricing_total ?? gig.budget),
          }),
        }
      );

      const data = await response.json();

      // Step 3 — Notify client
      await supabase.from("notifications").insert({
        user_id: gig.client_id,
        message: `Your gig "${gig.title}" was accepted. Please fund escrow to get started.`,
        gig_id: gig.id,
      });

      if (data.transaction_id) {
        toast.success("Gig accepted! Client can now fund escrow.");
      } else {
        toast.success("Gig accepted!");
      }

      setGigs(prev => prev.filter(g => g.id !== gig.id));

    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }

    setAcceptingId(null);
  };

  const results = useMemo(() => {
    const range = PRICE_RANGES[priceRange];
    let list = gigs.filter(g => {
      const price  = Number(g.pricing_total ?? g.budget);
      const catOk  = category === "all" || g.category === category;
      const priceOk = price >= range.min && price <= range.max;
      const q       = search.toLowerCase();
      const searchOk = !q
        || g.title.toLowerCase().includes(q)
        || (g.location ?? "").toLowerCase().includes(q)
        || (g.description ?? "").toLowerCase().includes(q);
      return catOk && priceOk && searchOk;
    });

    list.sort((a, b) => {
      const pa = Number(a.pricing_total ?? a.budget);
      const pb = Number(b.pricing_total ?? b.budget);
      const da = new Date(a.created_at ?? 0).getTime();
      const db = new Date(b.created_at ?? 0).getTime();
      if (sort === "date_desc")  return db - da;
      if (sort === "date_asc")   return da - db;
      if (sort === "price_desc") return pb - pa;
      if (sort === "price_asc")  return pa - pb;
      return 0;
    });

    return list;
  }, [gigs, category, priceRange, search, sort]);

  const activeFilters =
    (category !== "all" ? 1 : 0) +
    (priceRange !== 0 ? 1 : 0) +
    (sort !== "date_desc" ? 1 : 0);

  const clearAll = () => { setCategory("all"); setPriceRange(0); setSort("date_desc"); setSearch(""); };

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto pb-10 space-y-6">

        <div className="pt-2">
          <h1 className="text-3xl font-extrabold text-foreground">Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {gigs.length} open gig{gigs.length !== 1 ? "s" : ""} available right now
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 pr-9 bg-background rounded-xl"
            placeholder="Search by title, location or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors
                ${category === c.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 flex-wrap">
            {PRICE_RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setPriceRange(i)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors
                  ${priceRange === i
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="relative ml-auto">
            <button
              onClick={() => setShowSortMenu(v => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
                ${sort !== "date_desc"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30"
                }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {SORT_OPTIONS.find(s => s.value === sort)?.label}
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-44">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors
                        ${sort === opt.value ? "text-primary font-medium" : "text-foreground"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {activeFilters > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>

        {(search || activeFilters > 0) && (
          <p className="text-sm text-muted-foreground -mt-2">
            {results.length} result{results.length !== 1 ? "s" : ""}
            {search ? ` for "${search}"` : ""}
          </p>
        )}

        {results.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-9 w-9 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No gigs found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search || activeFilters > 0 ? "Try adjusting your filters." : "No open gigs right now — check back later!"}
            </p>
            {activeFilters > 0 && (
              <Button variant="outline" onClick={clearAll}>Clear filters</Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {results.map(gig => (
              <MarketplaceGigCard
                key={gig.id}
                gig={gig}
                onView={() => navigate(`/gig/${gig.id}`)}
                onAccept={() => handleAccept(gig)}
                accepting={acceptingId === gig.id}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}