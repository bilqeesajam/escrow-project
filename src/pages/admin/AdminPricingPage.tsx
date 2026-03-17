import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../../components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2, ChevronDown, ChevronUp, Save, History,
  Percent, MapPin, Clock, TrendingUp, DollarSign,
  RotateCcw, CheckCircle2,
} from "lucide-react";
import { backendRequest } from "../../lib/backend";
import { formatDistanceToNow } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

const CATEGORIES = ["errand", "pickup", "delivery", "shopping", "other"] as const;
type Category = typeof CATEGORIES[number];

type PricingConfig = {
  id: string;
  category: string;
  base_hourly_rate: string;
  per_km_rate: string;
  platform_fee_percentage: string;
  min_budget: string;
  max_budget: string;
  suggested_band_pct: string;
  complexity_multipliers: Record<string, number>;
};

type PricingHistory = {
  id: string;
  category: string;
  change_type: string;
  changed_by: string | null;
  change_reason: string;
  created_at: string;
};

// ─── Category colours ─────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { accent: string; bg: string; border: string }> = {
  errand:   { accent: "text-amber-500",   bg: "bg-amber-500/5",   border: "border-amber-500/20"   },
  pickup:   { accent: "text-sky-500",     bg: "bg-sky-500/5",     border: "border-sky-500/20"     },
  delivery: { accent: "text-violet-500",  bg: "bg-violet-500/5",  border: "border-violet-500/20"  },
  shopping: { accent: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
  other:    { accent: "text-zinc-400",    bg: "bg-zinc-500/5",    border: "border-zinc-500/20"    },
};

const zar = (v: string | number) => `R ${Number(v).toFixed(2)}`;

// ─── Derived summary pills from a row ────────────────────────────────────────

function SummaryPills({ row }: { row: any }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {[
        { icon: Clock,    label: `${zar(row.base_hourly_rate)}/hr`    },
        { icon: MapPin,   label: `${zar(row.per_km_rate)}/km`          },
        { icon: Percent,  label: `${row.platform_fee_percentage}% fee`  },
        { icon: TrendingUp, label: `±${row.suggested_band_pct}% band`  },
        { icon: DollarSign, label: `${zar(row.min_budget)} – ${zar(row.max_budget)}` },
      ].map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-muted border border-border text-muted-foreground">
          <Icon className="h-3 w-3" /> {label}
        </span>
      ))}
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, suffix, hint,
}: {
  label: string; value: string; onChange: (v: string) => void; suffix?: string; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div className="relative">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          type="number"
          min="0"
          className="h-9 text-sm rounded-xl pr-10 bg-background border-border"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({
  row,
  onChange,
  onSave,
  saving,
  lastSaved,
}: {
  row: any;
  onChange: (cat: string, field: string, value: string) => void;
  onSave: (cat: string) => Promise<void>;
  saving: boolean;
  lastSaved: string | null;
}) {
  const [open, setOpen] = useState(false);
  const style = CATEGORY_STYLE[row.category] ?? CATEGORY_STYLE.other;

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} overflow-hidden`}>

      {/* ── Header row — always visible ─────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-base font-bold capitalize ${style.accent}`}>{row.category}</span>
            {lastSaved && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500">
                <CheckCircle2 className="h-3 w-3" /> saved
              </span>
            )}
          </div>
          {!open && <SummaryPills row={row} />}
        </div>
        <div className="shrink-0 ml-4">
          {open
            ? <ChevronUp  className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* ── Expanded editor ─────────────────────────────────────────── */}
      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-border/60">

          {/* Rate fields */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-3">Rate Configuration</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Base Hourly Rate"   value={row.base_hourly_rate}         suffix="R/hr"   onChange={v => onChange(row.category, "base_hourly_rate",         v)} />
              <Field label="Per KM Rate"        value={row.per_km_rate}              suffix="R/km"   onChange={v => onChange(row.category, "per_km_rate",              v)} />
              <Field label="Platform Fee"       value={row.platform_fee_percentage}  suffix="%"      onChange={v => onChange(row.category, "platform_fee_percentage",  v)} hint="Deducted from payout on completion" />
              <Field label="Min Budget"         value={row.min_budget}               suffix="R"      onChange={v => onChange(row.category, "min_budget",               v)} />
              <Field label="Max Budget"         value={row.max_budget}               suffix="R"      onChange={v => onChange(row.category, "max_budget",               v)} />
              <Field label="Suggested Band"     value={row.suggested_band_pct}       suffix="±%"     onChange={v => onChange(row.category, "suggested_band_pct",       v)} hint="Acceptable variance around suggested price" />
            </div>
          </div>

          {/* Complexity multipliers */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Complexity Multipliers</p>
            <Textarea
              value={row.complexity_json}
              onChange={e => onChange(row.category, "complexity_json", e.target.value)}
              rows={3}
              className="font-mono text-xs rounded-xl bg-background border-border resize-none"
              placeholder='{ "weekend": 1.5, "urgent": 1.2 }'
            />
            <p className="text-[10px] text-muted-foreground mt-1">JSON object — keys are labels, values are multipliers (e.g. 1.5 = +50%)</p>
          </div>

          {/* Change reason + save */}
          <div className="flex gap-3 items-end pt-1 border-t border-border/60">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Change Reason <span className="text-destructive">*</span></Label>
              <Input
                value={row.change_reason}
                onChange={e => onChange(row.category, "change_reason", e.target.value)}
                placeholder="Describe why this is being changed…"
                className="h-9 text-sm rounded-xl bg-background border-border"
              />
            </div>
            <Button
              onClick={() => onSave(row.category)}
              disabled={saving || !row.change_reason?.trim()}
              className="h-9 rounded-xl font-semibold shrink-0 gap-2"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4" /> Save Changes</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPricingPage() {
  const [configs,   setConfigs]   = useState<PricingConfig[]>([]);
  const [history,   setHistory]   = useState<PricingHistory[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState<string | null>(null);
  const [seeding,   setSeeding]   = useState(false);
  const [seeded,    setSeeded]    = useState(false);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);

  const seedDefaults = async (missing: string[]) => {
    if (!missing.length) return;
    setSeeding(true);
    try {
      const defaults = { base_hourly_rate: "80", per_km_rate: "5", platform_fee_percentage: "10", min_budget: "50", max_budget: "500", suggested_band_pct: "20", complexity_multipliers: { weekend: 1.5, urgent: 1.2 } };
      await Promise.all(missing.map(category => backendRequest("/api/pricing/config/", { body: { change_reason: "Initial seed", config: { category, ...defaults } } })));
      toast.success("Default pricing configs created.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to seed default pricing configs.");
    } finally { setSeeding(false); setSeeded(true); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, historyRes] = await Promise.all([
        backendRequest<{ data: PricingConfig[] }>("/api/pricing/config/",  { method: "GET" }),
        backendRequest<{ data: PricingHistory[] }>("/api/pricing/history/", { method: "GET" }),
      ]);
      setConfigs(configRes.data ?? []);
      setHistory(historyRes.data ?? []);

      const initial: Record<string, any> = {};
      (configRes.data ?? []).forEach(cfg => {
        initial[cfg.category] = { ...cfg, change_reason: "", complexity_json: JSON.stringify(cfg.complexity_multipliers ?? {}, null, 2) };
      });
      CATEGORIES.forEach(cat => {
        if (!initial[cat]) initial[cat] = { category: cat, base_hourly_rate: "0", per_km_rate: "0", platform_fee_percentage: "10", min_budget: "0", max_budget: "0", suggested_band_pct: "20", complexity_json: "{}", change_reason: "" };
      });
      setFormState(initial);

      if (!seeded) {
        const missing = CATEGORIES.filter(cat => !(configRes.data ?? []).some(c => c.category === cat));
        if (missing.length) { await seedDefaults(missing); await fetchData(); return; }
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load pricing config.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (category: string, field: string, value: string) => {
    setFormState(prev => ({ ...prev, [category]: { ...prev[category], [field]: value } }));
  };

  const handleSave = async (category: string) => {
    const current = formState[category];
    if (!current?.change_reason?.trim()) { toast.error("Change reason is required."); return; }
    let complexity: Record<string, number>;
    try { complexity = JSON.parse(current.complexity_json || "{}"); }
    catch { toast.error("Complexity multipliers must be valid JSON."); return; }

    setSaving(category);
    try {
      await backendRequest("/api/pricing/config/", {
        body: { change_reason: current.change_reason, config: { category, base_hourly_rate: current.base_hourly_rate, per_km_rate: current.per_km_rate, platform_fee_percentage: current.platform_fee_percentage, min_budget: current.min_budget, max_budget: current.max_budget, suggested_band_pct: current.suggested_band_pct, complexity_multipliers: complexity } },
      });
      toast.success(`${category} pricing updated.`);
      setLastSaved(prev => ({ ...prev, [category]: new Date().toISOString() }));
      setFormState(prev => ({ ...prev, [category]: { ...prev[category], change_reason: "" } }));
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message ?? "Update failed.");
    } finally { setSaving(null); }
  };

  const rows = useMemo(() => CATEGORIES.map(cat => formState[cat]).filter(Boolean), [formState]);

  if (loading || seeding) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {seeding && <p className="text-sm text-muted-foreground">Seeding default pricing configs…</p>}
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-fade-in">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Admin</p>
            <h1 className="text-2xl font-extrabold text-foreground">Pricing Configuration</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Set rate limits for the automatic gig pricing engine</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl h-8 gap-1.5 text-xs" onClick={() => fetchData()}>
              <RotateCcw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl h-8 gap-1.5 text-xs" onClick={() => setShowHistory(v => !v)}>
              <History className="h-3.5 w-3.5" /> {showHistory ? "Hide" : "Show"} History
            </Button>
          </div>
        </div>

        {/* ── Summary stat strip ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {rows.map((row: any) => {
            const style = CATEGORY_STYLE[row.category] ?? CATEGORY_STYLE.other;
            return (
              <div key={row.category} className={`rounded-2xl border ${style.border} ${style.bg} px-4 py-3 text-center`}>
                <p className={`text-xs font-bold capitalize ${style.accent}`}>{row.category}</p>
                <p className="text-lg font-extrabold text-foreground mt-1">{row.platform_fee_percentage}%</p>
                <p className="text-[10px] text-muted-foreground">platform fee</p>
              </div>
            );
          })}
        </div>

        {/* ── Category cards ───────────────────────────────────────────── */}
        <div className="space-y-3">
          {rows.map((row: any) => (
            <CategoryCard
              key={row.category}
              row={row}
              onChange={handleChange}
              onSave={handleSave}
              saving={saving === row.category}
              lastSaved={lastSaved[row.category] ?? null}
            />
          ))}
        </div>

        {/* ── History ──────────────────────────────────────────────────── */}
        {showHistory && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
              <History className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Change History</h2>
              <span className="ml-auto text-xs text-muted-foreground font-mono">{history.length} entries</span>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No history yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {history.slice(0, 20).map(item => {
                  const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.other;
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${style.border} ${style.bg} ${style.accent} capitalize shrink-0`}>
                          {item.category}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground capitalize">{item.change_type}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.change_reason}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}