import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { AppLayout } from "../../components/AppLayout";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Loader2, Search, X, FileDown, ChevronRight } from "lucide-react";
import type { Tables } from "../../integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { generateReceipt } from "../../lib/generateReceipt";

type Gig     = Tables<"gigs">;
type Profile = Tables<"profiles">;
type Dispute = Tables<"disputes"> & { resolver?: Profile | null };

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open:                 { label: "Open",      className: "bg-amber-500/10  text-amber-500   border border-amber-500/20"  },
  pending_confirmation: { label: "Pending",   className: "bg-blue-500/10   text-blue-500    border border-blue-500/20"   },
  accepted:             { label: "Accepted",  className: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
  in_progress:          { label: "Active",    className: "bg-sky-500/10    text-sky-500     border border-sky-500/20"    },
  completed:            { label: "Done",      className: "bg-green-500/10  text-green-500   border border-green-500/20"  },
  disputed:             { label: "Disputed",  className: "bg-red-500/10    text-red-500     border border-red-500/20"    },
  cancelled:            { label: "Cancelled", className: "bg-zinc-500/10   text-zinc-400    border border-zinc-500/20"   },
};
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground border border-border" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

const ALL_STATUSES = ["open","accepted","in_progress","pending_confirmation","completed","disputed","cancelled"];
const CATEGORIES   = ["errand","pickup","delivery","shopping","other"];
const PRICE_RANGES = [
  { label: "Any",       min: 0,   max: Infinity },
  { label: "< R100",    min: 0,   max: 100      },
  { label: "R100–R300", min: 100, max: 300      },
  { label: "R300–R500", min: 300, max: 500      },
  { label: "> R500",    min: 500, max: Infinity },
];

type GigRow = Gig & {
  client:  Profile | null;
  hustler: Profile | null;
  dispute: Dispute | null;
};

export default function AdminGigsPage() {
  const navigate  = useNavigate();
  const [rows, setRows]         = useState<GigRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter]       = useState("all");
  const [priceIdx, setPriceIdx]         = useState(0);

  useEffect(() => {
    supabase
      .from("gigs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const gigs = data ?? [];
        // Batch fetch profiles + disputes
        const profileIds = [...new Set([
          ...gigs.map(g => g.client_id),
          ...gigs.map(g => g.hustler_id).filter(Boolean),
        ])] as string[];

        const [{ data: profiles }, { data: disputes }] = await Promise.all([
          supabase.from("profiles").select("*").in("id", profileIds),
          supabase.from("disputes").select("*, resolver:profiles!disputes_raised_by_fkey(*)").in("gig_id", gigs.map(g => g.id)),
        ]);

        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
        const disputeMap = Object.fromEntries((disputes ?? []).map(d => [d.gig_id, d]));

        setRows(gigs.map(g => ({
          ...g,
          client:  profileMap[g.client_id]  ?? null,
          hustler: g.hustler_id ? (profileMap[g.hustler_id] ?? null) : null,
          dispute: disputeMap[g.id] ?? null,
        })));
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const range = PRICE_RANGES[priceIdx];
    return rows.filter(g => {
      const price  = Number(g.pricing_total ?? g.budget);
      const q      = search.toLowerCase();
      return (
        (statusFilter === "all" || g.status === statusFilter) &&
        (catFilter === "all" || g.category === catFilter) &&
        price >= range.min && price <= range.max &&
        (!q || g.title.toLowerCase().includes(q) ||
          (g.client?.full_name ?? "").toLowerCase().includes(q) ||
          (g.hustler?.full_name ?? "").toLowerCase().includes(q) ||
          (g.location ?? "").toLowerCase().includes(q))
      );
    });
  }, [rows, search, statusFilter, catFilter, priceIdx]);

  const activeFilters = (statusFilter !== "all" ? 1 : 0) + (catFilter !== "all" ? 1 : 0) + (priceIdx !== 0 ? 1 : 0);
  const clearAll = () => { setStatusFilter("all"); setCatFilter("all"); setPriceIdx(0); setSearch(""); };

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto pb-10 animate-fade-in">
        <div className="pt-2 mb-6">
          <h1 className="text-3xl font-extrabold text-foreground">All Gigs</h1>
          <p className="text-muted-foreground text-sm mt-1">{rows.length} total · {filtered.length} shown</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 pr-9 rounded-xl"
            placeholder="Search title, client, hustler or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Status */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${statusFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
            >All statuses</button>
            {ALL_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
              >{s.replace(/_/g, " ")}</button>
            ))}
          </div>

          <div className="w-px bg-border self-stretch mx-1" />

          {/* Category */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCatFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${catFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
            >All categories</button>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize ${catFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
              >{c}</button>
            ))}
          </div>

          <div className="w-px bg-border self-stretch mx-1" />

          {/* Price */}
          <div className="flex gap-1.5 flex-wrap">
            {PRICE_RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setPriceIdx(i)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${priceIdx === i ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:border-primary/30"}`}
              >{r.label}</button>
            ))}
          </div>

          {activeFilters > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Title", "Client", "Hustler", "Budget", "Status", "Category", "Date", "Dispute Resolved By", "Receipt"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-sm text-muted-foreground">No gigs match your filters.</td>
                  </tr>
                ) : filtered.map(g => (
                  <tr
                    key={g.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/gig/${g.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground capitalize truncate max-w-[160px]">{g.title}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">#{g.id.slice(0,6)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{g.client?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{g.hustler?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-foreground whitespace-nowrap">{zar(Number(g.pricing_total ?? g.budget))}</td>
                    <td className="px-4 py-3"><StatusPill status={g.status} /></td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{g.category}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {g.created_at ? formatDistanceToNow(new Date(g.created_at), { addSuffix: true }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {g.status === "disputed" || g.status === "cancelled"
                        ? (g.dispute as any)?.resolver?.full_name ?? "Pending"
                        : "—"}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        title="Download receipt"
                        onClick={() => generateReceipt({ gig: g, hustlerProfile: g.hustler, clientProfile: g.client })}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}