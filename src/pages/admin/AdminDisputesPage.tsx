import { useState, useEffect } from "react";
import { supabase } from "../../integrations/supabase/client";
import { AppLayout } from "../../components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertTriangle, ArrowUpDown, CheckCircle2, Clock, LayoutList } from "lucide-react";
import type { Tables } from "../../integrations/supabase/types";
import { backendRequest } from "../../lib/backend";

// ─── Types ────────────────────────────────────────────────────────────────────

type Dispute = Tables<"disputes">;
type Gig     = Tables<"gigs">;

type PricingOverride = {
  id: string;
  gig_id: string | null;
  client_id: string;
  category: string;
  requested_budget: string;
  suggested_budget: string;
  adjustment_pct: string;
  reason: string | null;
  reason_category: string | null;
  status: string;
  created_at: string;
  admin_note?: string | null;
  gig?: Gig | null;
};

type UnifiedItem =
  | { kind: "dispute";  data: Dispute & { gig?: Gig } }
  | { kind: "override"; data: PricingOverride };

// ─── Constants ────────────────────────────────────────────────────────────────

const OVERRIDE_CATEGORY_LABELS: Record<string, string> = {
  overpricing:  "Overpricing",
  underpricing: "Underpricing",
  too_much_kms: "Too Much KMs",
  other:        "Other",
};

const OVERRIDE_CATEGORY_OPTIONS = [
  { value: "all",          label: "All Categories" },
  { value: "overpricing",  label: "Overpricing"    },
  { value: "underpricing", label: "Underpricing"   },
  { value: "too_much_kms", label: "Too Much KMs"   },
  { value: "other",        label: "Other"          },
];

const TYPE_OPTIONS = [
  { value: "all",      label: "All Types"         },
  { value: "dispute",  label: "Disputes"           },
  { value: "override", label: "Pricing Overrides"  },
];

const PENDING_STATUSES  = new Set(["open", "under_review", "pending"]);
const RESOLVED_STATUSES = new Set(["resolved_client", "resolved_hustler", "approved", "rejected", "cancelled"]);

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOverrideCategoryLabel(o: PricingOverride): string {
  if (o.reason_category && OVERRIDE_CATEGORY_LABELS[o.reason_category])
    return OVERRIDE_CATEGORY_LABELS[o.reason_category];
  const r = (o.reason ?? "").toLowerCase();
  if (r.includes("km") || r.includes("kms") || r.includes("kilometer"))
    return OVERRIDE_CATEGORY_LABELS.too_much_kms;
  const req = parseFloat(o.requested_budget), sug = parseFloat(o.suggested_budget);
  if (!isNaN(req) && !isNaN(sug)) {
    if (req > sug) return OVERRIDE_CATEGORY_LABELS.overpricing;
    if (req < sug) return OVERRIDE_CATEGORY_LABELS.underpricing;
  }
  return OVERRIDE_CATEGORY_LABELS.other;
}

function normalizedCategory(o: PricingOverride): string {
  return getOverrideCategoryLabel(o).toLowerCase().replace(/\s+/g, "_");
}

function itemStatus(item: UnifiedItem): string {
  return item.data.status;
}

function isPending(item: UnifiedItem)  { return PENDING_STATUSES.has(itemStatus(item));  }
function isResolved(item: UnifiedItem) { return RESOLVED_STATUSES.has(itemStatus(item)); }

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  open:              "bg-amber-500/10 text-amber-600 border-amber-500/25",
  under_review:      "bg-sky-500/10   text-sky-600   border-sky-500/25",
  pending:           "bg-amber-500/10 text-amber-600 border-amber-500/25",
  resolved_client:   "bg-green-500/10 text-green-600 border-green-500/25",
  resolved_hustler:  "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  approved:          "bg-green-500/10 text-green-600 border-green-500/25",
  rejected:          "bg-red-500/10   text-red-600   border-red-500/25",
  cancelled:         "bg-zinc-500/10  text-zinc-500  border-zinc-500/25",
};
const STATUS_LABEL: Record<string, string> = {
  open:             "Open",
  under_review:     "Under Review",
  pending:          "Pending",
  resolved_client:  "Resolved — Client",
  resolved_hustler: "Resolved — Hustler",
  approved:         "Approved",
  rejected:         "Rejected",
  cancelled:        "Cancelled",
};

function StatusPill({ status }: { status: string }) {
  const cls   = STATUS_STYLE[status]  ?? "bg-muted text-muted-foreground border-border";
  const label = STATUS_LABEL[status]  ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ kind }: { kind: "dispute" | "override" }) {
  return kind === "dispute" ? (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
      Dispute
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20">
      Pricing Override
    </span>
  );
}

// ─── Dispute card ─────────────────────────────────────────────────────────────

function DisputeCard({
  item: d,
  onResolve,
  resolving,
}: {
  item: Dispute & { gig?: Gig };
  onResolve: (d: Dispute & { gig?: Gig }, res: "resolved_client" | "resolved_hustler", notes: string) => Promise<void>;
  resolving: boolean;
}) {
  const [resolution, setResolution] = useState<"resolved_client" | "resolved_hustler">("resolved_client");
  const [notes, setNotes] = useState("");
  const canResolve = d.status === "open" || d.status === "under_review";

  return (
    <Card className="border-border hover:border-primary/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <TypeBadge kind="dispute" />
              <StatusPill status={d.status} />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground truncate">
              {d.gig?.title || "Unknown Gig"}
            </CardTitle>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
            {timeAgo(d.created_at)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Financials */}
        {d.gig && (
          <div className="flex gap-4 p-3 rounded-xl bg-muted/40 border border-border text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Budget</p>
              <p className="font-mono font-bold text-foreground">{zar(Number(d.gig.budget))}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Category</p>
              <p className="font-semibold text-foreground capitalize">{d.gig.category}</p>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground self-end ml-auto">
              #{d.gig.id.slice(0, 8)}
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed">{d.reason}</p>

        {d.admin_notes && (
          <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2 text-xs text-foreground">
            <span className="font-semibold text-primary">Admin note:</span> {d.admin_notes}
          </div>
        )}

        {canResolve && (
          <div className="space-y-3 pt-3 border-t border-border">
            <Select value={resolution} onValueChange={(v: any) => setResolution(v)}>
              <SelectTrigger className="h-9 text-sm rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="resolved_client">Client Wins — Refund</SelectItem>
                <SelectItem value="resolved_hustler">Hustler Wins — Release</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Admin notes (optional)…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={500}
              className="rounded-xl text-sm min-h-[70px]"
            />
            <Button
              size="sm"
              onClick={() => onResolve(d, resolution, notes)}
              disabled={resolving}
              className="rounded-xl font-semibold"
            >
              {resolving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Resolve Dispute
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Override card ────────────────────────────────────────────────────────────

function OverrideCard({
  item,
  note,
  onNoteChange,
  onAction,
  acting,
}: {
  item: PricingOverride;
  note: string;
  onNoteChange: (v: string) => void;
  onAction: (a: "approve" | "reject") => Promise<void>;
  acting: boolean;
}) {
  const inputs  = (item.gig as any)?.pricing_inputs ?? {};
  const reqNum  = Number(item.requested_budget);
  const sugNum  = Number(item.suggested_budget);
  const reqFmt  = isFinite(reqNum) ? zar(reqNum) : item.requested_budget;
  const sugFmt  = isFinite(sugNum) ? zar(sugNum) : item.suggested_budget;
  const diff    = isFinite(reqNum) && isFinite(sugNum) ? reqNum - sugNum : null;
  const diffPct = isFinite(reqNum) && isFinite(sugNum) && sugNum > 0
    ? ((reqNum - sugNum) / sugNum * 100).toFixed(1)
    : null;

  return (
    <Card className="border-border hover:border-primary/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <TypeBadge kind="override" />
              <StatusPill status={item.status} />
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                {getOverrideCategoryLabel(item)}
              </span>
            </div>
            <CardTitle className="text-sm font-semibold text-foreground truncate">
              {item.gig?.title || "Unknown Gig"}
            </CardTitle>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
            {timeAgo(item.created_at)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Budget comparison */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Requested",  value: reqFmt                                    },
            { label: "Suggested",  value: sugFmt                                    },
            { label: "Difference", value: diff !== null ? zar(Math.abs(diff)) : "—" },
            { label: "Variance",   value: diffPct !== null ? `${diffPct}%` : "—"    },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-muted/40 border border-border px-3 py-2 text-xs">
              <p className="text-muted-foreground mb-0.5">{label}</p>
              <p className="font-mono font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Inputs row */}
        {(inputs.hours !== undefined || inputs.distance_km !== undefined || item.category) && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {item.category && (
              <span>Gig type: <span className="font-semibold text-foreground capitalize">{item.category}</span></span>
            )}
            {inputs.hours       !== undefined && <span>Hours: <span className="font-mono font-semibold text-foreground">{inputs.hours}</span></span>}
            {inputs.distance_km !== undefined && <span>Distance: <span className="font-mono font-semibold text-foreground">{inputs.distance_km} km</span></span>}
          </div>
        )}

        {item.reason && (
          <p className="text-sm text-muted-foreground leading-relaxed">{item.reason}</p>
        )}

        {item.admin_note && (
          <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2 text-xs text-foreground">
            <span className="font-semibold text-primary">Admin note:</span> {item.admin_note}
          </div>
        )}

        {item.status === "pending" && (
          <div className="space-y-3 pt-3 border-t border-border">
            <Input
              placeholder="Admin note (optional)…"
              value={note}
              onChange={e => onNoteChange(e.target.value)}
              className="h-9 rounded-xl text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAction("approve")}
                disabled={acting}
                className="rounded-xl font-semibold"
              >
                {acting && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onAction("reject")}
                disabled={acting}
                className="rounded-xl font-semibold"
              >
                {acting && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <AlertTriangle className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── List renderer ────────────────────────────────────────────────────────────

function ItemList({
  items,
  resolvingId,
  overrideActing,
  overrideNotes,
  setOverrideNotes,
  handleResolve,
  handleOverrideAction,
}: {
  items: UnifiedItem[];
  resolvingId: string | null;
  overrideActing: string | null;
  overrideNotes: Record<string, string>;
  setOverrideNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleResolve: (d: Dispute & { gig?: Gig }, res: "resolved_client" | "resolved_hustler", notes: string) => Promise<void>;
  handleOverrideAction: (id: string, action: "approve" | "reject") => Promise<void>;
}) {
  if (items.length === 0) return <Empty message="Nothing here yet." />;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map(item =>
        item.kind === "dispute" ? (
          <DisputeCard
            key={`d-${item.data.id}`}
            item={item.data}
            onResolve={handleResolve}
            resolving={resolvingId === item.data.id}
          />
        ) : (
          <OverrideCard
            key={`o-${item.data.id}`}
            item={item.data}
            note={overrideNotes[item.data.id] ?? ""}
            onNoteChange={v => setOverrideNotes(p => ({ ...p, [item.data.id]: v }))}
            onAction={a => handleOverrideAction(item.data.id, a)}
            acting={overrideActing === item.data.id}
          />
        )
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDisputesPage() {
  const [disputes,         setDisputes]         = useState<(Dispute & { gig?: Gig })[]>([]);
  const [overrides,        setOverrides]        = useState<PricingOverride[]>([]);
  const [disputesLoading,  setDisputesLoading]  = useState(true);
  const [overridesLoading, setOverridesLoading] = useState(true);
  const [resolvingId,      setResolvingId]      = useState<string | null>(null);
  const [overrideActing,   setOverrideActing]   = useState<string | null>(null);
  const [overrideNotes,    setOverrideNotes]    = useState<Record<string, string>>({});

  // Filters
  const [typeFilter,     setTypeFilter]     = useState("all");
  const [catFilter,      setCatFilter]      = useState("all");
  const [sortDir,        setSortDir]        = useState<"asc" | "desc">("desc");

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchDisputes = async () => {
    setDisputesLoading(true);
    const { data } = await supabase.from("disputes").select("*").order("created_at", { ascending: false });
    if (data) {
      const gigIds = [...new Set(data.map(d => d.gig_id).filter(Boolean))] as string[];
      const gigMap: Record<string, Gig> = {};
      if (gigIds.length) {
        const { data: gigs } = await supabase.from("gigs").select("*").in("id", gigIds);
        (gigs ?? []).forEach(g => { gigMap[g.id] = g; });
      }
      setDisputes(data.map(d => ({ ...d, gig: d.gig_id ? gigMap[d.gig_id] : undefined })));
    }
    setDisputesLoading(false);
  };

  const fetchOverrides = async () => {
    setOverridesLoading(true);
    try {
      const res = await backendRequest<{ data: PricingOverride[] }>("/api/pricing/overrides/", { method: "GET" });
      setOverrides(res.data ?? []);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load pricing overrides.");
    } finally {
      setOverridesLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); fetchOverrides(); }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleResolve = async (
    d: Dispute & { gig?: Gig },
    resolution: "resolved_client" | "resolved_hustler",
    notes: string,
  ) => {
    if (!d.gig) return;
    setResolvingId(d.id);
    const gig      = d.gig as any;
    const total    = gig.pricing_total    ?? gig.budget;
    const subtotal = gig.pricing_subtotal ?? gig.budget;
    const fee      = gig.pricing_fee      ?? 0;

    await supabase.from("disputes").update({ status: resolution, admin_notes: notes || null, resolved_at: new Date().toISOString() }).eq("id", d.id);

    if (resolution === "resolved_client") {
      const { data: cp } = await supabase.from("profiles").select("balance").eq("id", gig.client_id).single();
      await supabase.from("profiles").update({ balance: (cp?.balance ?? 0) + total }).eq("id", gig.client_id);
      await supabase.from("transactions").insert({ gig_id: gig.id, to_user_id: gig.client_id, amount: total, subtotal_amount: subtotal, fee_amount: fee, total_amount: total, type: "refund" as const });
      await supabase.from("gigs").update({ status: "cancelled" as any }).eq("id", gig.id);
      await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Dispute on "${gig.title}" resolved in your favor. Funds refunded.`, gig_id: gig.id });
      if (gig.hustler_id) await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `Dispute on "${gig.title}" resolved. Funds returned to client.`, gig_id: gig.id });
    } else if (gig.hustler_id) {
      const { data: hp } = await supabase.from("profiles").select("balance").eq("id", gig.hustler_id).single();
      await supabase.from("profiles").update({ balance: (hp?.balance ?? 0) + subtotal }).eq("id", gig.hustler_id);
      await supabase.from("transactions").insert({ gig_id: gig.id, to_user_id: gig.hustler_id, from_user_id: gig.client_id, amount: subtotal, subtotal_amount: subtotal, fee_amount: fee, total_amount: total, type: "release" as const });
      await supabase.from("gigs").update({ status: "completed" as any }).eq("id", gig.id);
      await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `Dispute on "${gig.title}" resolved in your favor. Funds released.`, gig_id: gig.id });
      await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Dispute on "${gig.title}" resolved. Funds released to hustler.`, gig_id: gig.id });
    }

    toast.success("Dispute resolved.");
    setResolvingId(null);
    fetchDisputes();
  };

  const handleOverrideAction = async (overrideId: string, action: "approve" | "reject") => {
    setOverrideActing(overrideId);
    try {
      await backendRequest("/api/pricing/overrides/decision/", {
        body: { override_id: overrideId, action, admin_note: overrideNotes[overrideId] ?? "" },
      });
      toast.success(`Override ${action}d.`);
      await fetchOverrides();
    } catch (err: any) {
      toast.error(err?.message ?? "Action failed.");
    } finally {
      setOverrideActing(null);
    }
  };

  // ── Build unified list ───────────────────────────────────────────────────────

  const overrideGigIds = new Set(overrides.map(o => o.gig_id).filter(Boolean));

  const unified: UnifiedItem[] = [
    ...disputes
      .filter(d => !overrideGigIds.has(d.gig_id))
      .map(d => ({ kind: "dispute" as const, data: d })),
    ...overrides.map(o => ({ kind: "override" as const, data: o })),
  ];

  // Apply type + category filters then sort
  const applyFilters = (items: UnifiedItem[]) => items
    .filter(i => typeFilter === "all" || i.kind === typeFilter)
    .filter(i => {
      if (catFilter === "all") return true;
      if (i.kind !== "override") return true;
      return normalizedCategory(i.data) === catFilter;
    })
    .sort((a, b) => {
      const da = new Date(a.data.created_at ?? 0).getTime();
      const db = new Date(b.data.created_at ?? 0).getTime();
      return sortDir === "desc" ? db - da : da - db;
    });

  const allItems      = applyFilters(unified);
  const pendingItems  = applyFilters(unified.filter(isPending));
  const resolvedItems = applyFilters(unified.filter(isResolved));

  const totalPending = unified.filter(isPending).length;

  const loading = disputesLoading && overridesLoading;

  const sharedListProps = {
    resolvingId, overrideActing, overrideNotes, setOverrideNotes, handleResolve, handleOverrideAction,
  };

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-fade-in">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Admin</p>
            <h1 className="text-2xl font-extrabold text-foreground">Disputes & Overrides</h1>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-40 text-xs rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {(typeFilter === "all" || typeFilter === "override") && (
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="h-8 w-44 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OVERRIDE_CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 rounded-xl"
              onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortDir === "desc" ? "Newest" : "Oldest"}
            </Button>
          </div>
        </div>

        {/* ── Stat strip ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",    value: unified.length,                     color: "text-foreground"   },
            { label: "Pending",  value: unified.filter(isPending).length,   color: "text-amber-500"    },
            { label: "Resolved", value: unified.filter(isResolved).length,  color: "text-emerald-500"  },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-muted/50 border border-border rounded-xl p-1 h-auto gap-1 mb-6">
            {[
              { value: "all",      label: "All",      icon: LayoutList,   count: allItems.length      },
              { value: "pending",  label: "Pending",  icon: Clock,        count: pendingItems.length,  badge: totalPending > 0 },
              { value: "resolved", label: "Resolved", icon: CheckCircle2, count: resolvedItems.length },
            ].map(({ value, label, icon: Icon, count, badge }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badge ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <ItemList items={allItems} {...sharedListProps} />
          </TabsContent>

          <TabsContent value="pending">
            <ItemList items={pendingItems} {...sharedListProps} />
          </TabsContent>

          <TabsContent value="resolved">
            <ItemList items={resolvedItems} {...sharedListProps} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}