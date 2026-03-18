import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { AppLayout } from "../../components/AppLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2, Zap, DollarSign, MapPin, Clock,
  ShoppingCart, CheckCircle2, AlertTriangle, Ruler, Info,
  ArrowRight, Sparkles, Package, Store, Home
} from "lucide-react";
import { backendRequest } from "../../lib/backend";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["errand", "pickup", "delivery", "shopping", "other"] as const;
type Category = typeof CATEGORIES[number];
type Mode = "fixed" | "smart";

type LocationType = "single" | "dual" | "dual-optional";

const CATEGORY_META: Record<Category, {
  icon: React.ElementType;
  label: string;
  needsCart: boolean;
  locationType: LocationType;
  fromLabel?: string;
  toLabel?: string;
}> = {
  errand:   { icon: Clock,        label: "Errand",   needsCart: false, locationType: "single", fromLabel: "Location" },
  pickup:   { icon: Store,        label: "Pickup",   needsCart: false, locationType: "dual",  fromLabel: "Pickup location", toLabel: "Drop-off location" },
  delivery: { icon: Package,      label: "Delivery", needsCart: false, locationType: "dual",  fromLabel: "Pickup location", toLabel: "Delivery location" },
  shopping: { icon: ShoppingCart, label: "Shopping", needsCart: true,  locationType: "single", fromLabel: "Delivery location" },
  other:    { icon: Zap,          label: "Other",    needsCart: false, locationType: "dual-optional", fromLabel: "From", toLabel: "To (optional)" },
};

const zar = (n: number) => `R ${n.toFixed(2)}`;

interface Quote {
  subtotal: number;
  fee: number;
  total: number;
  bandMin: number;
  bandMax: number;
  complexityOptions: { key: string; multiplier: number }[];
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PostGigPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("fixed");
  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation,   setToLocation]   = useState("");
  const [category,     setCategory]     = useState<Category>("errand");
  const [hours,        setHours]        = useState("1");
  const [distanceKm,   setDistanceKm]   = useState("0");
  const [cartValue,    setCartValue]    = useState("");
  const [complexityKeys, setComplexityKeys] = useState<string[]>([]);
  const [budget,         setBudget]         = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [quote,          setQuote]          = useState<Quote | null>(null);
  const [quoteLoading,   setQuoteLoading]   = useState(false);
  const [loading,        setLoading]        = useState(false);

  // Reset and adjust location fields when category changes
  useEffect(() => {
    setComplexityKeys([]);
    setOverrideReason("");
    setQuote(null);
    // Clear second location if category uses single location
    const locType = CATEGORY_META[category].locationType;
    if (locType === "single") {
      setToLocation("");
    }
  }, [category]);

  useEffect(() => { setQuote(null); setOverrideReason(""); }, [mode]);

  // Smart mode quote
  useEffect(() => {
    if (mode !== "smart") return;
    const h = parseFloat(hours), d = parseFloat(distanceKm);
    if (!h || h <= 0 || isNaN(d) || d < 0) return;
    const controller = new AbortController();
    setQuoteLoading(true);
    backendRequest<{ subtotal: string; fee: string; total: string; band_min: string; band_max: string; complexity_options: { key: string; multiplier: number }[] }>(
      "/api/pricing/quote/",
      { body: { category, hours: h, distance_km: d, complexity_keys: complexityKeys } }
    )
      .then(data => { if (!controller.signal.aborted) setQuote({ subtotal: parseFloat(data.subtotal), fee: parseFloat(data.fee), total: parseFloat(data.total), bandMin: parseFloat(data.band_min), bandMax: parseFloat(data.band_max), complexityOptions: data.complexity_options || [] }); })
      .catch(err => { if (!controller.signal.aborted) toast.error(err?.message ?? "Failed to fetch quote"); })
      .finally(() => { if (!controller.signal.aborted) setQuoteLoading(false); });
    return () => controller.abort();
  }, [mode, category, hours, distanceKm, complexityKeys.join("|")]);

  // Fixed mode band
  useEffect(() => {
    if (mode !== "fixed") return;
    const controller = new AbortController();
    setQuoteLoading(true);
    backendRequest<{ subtotal: string; fee: string; total: string; band_min: string; band_max: string; complexity_options: { key: string; multiplier: number }[] }>(
      "/api/pricing/quote/",
      { body: { category, hours: 1, distance_km: 0, complexity_keys: [] } }
    )
      .then(data => { if (!controller.signal.aborted) setQuote({ subtotal: parseFloat(data.subtotal), fee: parseFloat(data.fee), total: parseFloat(data.total), bandMin: parseFloat(data.band_min), bandMax: parseFloat(data.band_max), complexityOptions: data.complexity_options || [] }); })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setQuoteLoading(false); });
    return () => controller.abort();
  }, [mode, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    if (!title.trim())        { toast.error("Title is required.");           return; }
    if (!description.trim())  { toast.error("Description is required.");     return; }

    const locType = CATEGORY_META[category].locationType;
    if (!fromLocation.trim()) {
      toast.error("Pickup location is required.");
      return;
    }
    if (locType === "dual" && !toLocation.trim()) {
      toast.error("Drop-off location is required for this category.");
      return;
    }

    const locationStr = toLocation.trim()
      ? `${fromLocation.trim()} → ${toLocation.trim()}`
      : fromLocation.trim();

    const balance = Number(profile.balance ?? 0);

    if (mode === "smart") {
      const h = parseFloat(hours), d = parseFloat(distanceKm);
      if (!h || h <= 0)      { toast.error("Enter valid hours.");    return; }
      if (isNaN(d) || d < 0) { toast.error("Enter valid distance."); return; }
      if (!quote)            { toast.error("Wait for price calculation."); return; }
      if (balance < quote.total) { toast.error(`Insufficient balance. Need ${zar(quote.total)}.`); return; }
      setLoading(true);
      try {
        await backendRequest("/api/gigs/create/", {
          body: {
            title: title.trim(),
            description: description.trim(),
            location: locationStr,
            category,
            hours: h,
            distance_km: d,
            requested_total: quote.total,
            cart_value: cartValue ? parseFloat(cartValue) : null,
            complexity_keys: complexityKeys,
            override_reason: ""
          }
        });
        await refreshProfile();
        toast.success("Gig posted successfully!");
        navigate("/my-gigs");
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to post gig.");
      } finally {
        setLoading(false);
      }
    } else {
      const budgetNum = parseFloat(budget);
      if (!budgetNum || budgetNum <= 0) { toast.error("Enter a valid budget."); return; }
      if (balance < budgetNum)          { toast.error(`Insufficient balance. Need ${zar(budgetNum)}.`); return; }
      const outOfBand = quote && (budgetNum < quote.bandMin || budgetNum > quote.bandMax);
      if (outOfBand && !overrideReason.trim()) {
        toast.error("A reason is required when outside the suggested range.");
        return;
      }
      setLoading(true);
      try {
        await backendRequest("/api/gigs/create/", {
          body: {
            title: title.trim(),
            description: description.trim(),
            location: locationStr,
            category,
            hours: 1,
            distance_km: 0,
            requested_total: budgetNum,
            cart_value: null,
            complexity_keys: [],
            override_reason: overrideReason.trim()
          }
        });
        await refreshProfile();
        toast.success(outOfBand ? "Gig submitted for admin review." : "Gig posted!");
        navigate("/my-gigs");
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to post gig.");
      } finally {
        setLoading(false);
      }
    }
  };

  const balance       = Number(profile?.balance ?? 0);
  const budgetNum     = parseFloat(budget);
  const costToClient  = mode === "smart" ? (quote?.total ?? 0) : (!isNaN(budgetNum) ? budgetNum : 0);
  const outOfBand     = mode === "fixed" && quote && !isNaN(budgetNum) && (budgetNum < quote.bandMin || budgetNum > quote.bandMax);
  const insufficient  = costToClient > 0 && costToClient > balance;

  const locationType = CATEGORY_META[category].locationType;

  return (
    <AppLayout>
      {/* Wider container with responsive padding */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">

        {/* Header */}
        <div className="w-full pb-6 text-center">
          <h2 className="text-4xl font-extrabold text-foreground mb-1">Post a Gig</h2>
          <p className="text-muted-foreground">
            Wallet: <span className="font-mono font-semibold text-foreground">{zar(balance)}</span>
          </p>
        </div>

        {/* Mode toggle — Fixed LEFT, Smart RIGHT */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Fixed Price */}
          <button
            type="button"
            onClick={() => setMode("fixed")}
            className={`relative flex flex-col gap-2 p-4 rounded-2xl border-2 text-left transition-all ${
              mode === "fixed"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${mode === "fixed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <DollarSign className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className={`text-sm font-bold ${mode === "fixed" ? "text-foreground" : "text-muted-foreground"}`}>Fixed Price</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">You decide the budget. Must stay within the allowed range.</p>
            </div>
            {mode === "fixed" && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />}
          </button>

          {/* Smart Price */}
          <button
            type="button"
            onClick={() => setMode("smart")}
            className={`relative flex flex-col gap-2 p-4 rounded-2xl border-2 text-left transition-all ${
              mode === "smart"
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-border bg-card hover:border-emerald-500/30"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${mode === "smart" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className={`text-sm font-bold ${mode === "smart" ? "text-foreground" : "text-muted-foreground"}`}>Smart Price</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Tell us the job details — we calculate a fair price automatically.</p>
            </div>
            {mode === "smart" && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500" />}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Gig details + location */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <Field label="Title">
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Pick up documents from CBD"
                maxLength={100}
                className="rounded-xl h-10"
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what needs to be done…"
                maxLength={1000}
                rows={2}
                className="rounded-xl resize-none text-sm"
              />
            </Field>

            {/* Category */}
            <Field label="Category">
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map(cat => {
                  const meta = CATEGORY_META[cat];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all ${
                        category === cat
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] font-semibold capitalize">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Location — conditional */}
            <div className={locationType === "single" ? "grid grid-cols-1" : "grid grid-cols-2 gap-3"}>
              <Field label={CATEGORY_META[category].fromLabel || "From"}>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={fromLocation}
                    onChange={e => setFromLocation(e.target.value)}
                    placeholder={CATEGORY_META[category].fromLabel || "Pickup location"}
                    maxLength={200}
                    className="rounded-xl h-10 pl-9 text-sm"
                  />
                </div>
              </Field>

              {locationType !== "single" && (
                <Field
                  label={CATEGORY_META[category].toLabel || "To"}
                  hint={locationType === "dual-optional" ? "Optional for this category" : undefined}
                >
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60" />
                    <Input
                      value={toLocation}
                      onChange={e => setToLocation(e.target.value)}
                      placeholder={CATEGORY_META[category].toLabel || "Drop-off location"}
                      maxLength={200}
                      className="rounded-xl h-10 pl-9 text-sm"
                    />
                  </div>
                </Field>
              )}
            </div>
          </div>

          {/* Smart mode: job details */}
          {mode === "smart" && (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.03] p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Job Estimate</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Hours">
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={hours}
                      onChange={e => setHours(e.target.value)}
                      className="rounded-xl h-10 pl-9 text-sm"
                    />
                  </div>
                </Field>
                <Field label="Distance (km)">
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={distanceKm}
                      onChange={e => setDistanceKm(e.target.value)}
                      className="rounded-xl h-10 pl-9 text-sm"
                    />
                  </div>
                </Field>
              </div>

              {CATEGORY_META[category].needsCart && (
                <Field label="Cart value (R)">
                  <div className="relative">
                    <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cartValue}
                      onChange={e => setCartValue(e.target.value)}
                      placeholder="0.00"
                      className="rounded-xl h-10 pl-9 text-sm"
                    />
                  </div>
                </Field>
              )}

              {quote && quote.complexityOptions.length > 0 && (
                <Field label="Complexity factors">
                  <div className="grid grid-cols-2 gap-2">
                    {quote.complexityOptions.map(opt => {
                      const checked = complexityKeys.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setComplexityKeys(prev =>
                            checked ? prev.filter(k => k !== opt.key) : [...prev, opt.key]
                          )}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border-2 text-xs transition-all ${
                            checked
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-border text-muted-foreground hover:border-emerald-500/40"
                          }`}
                        >
                          <span className="capitalize font-medium">{opt.key}</span>
                          <span className="font-mono">×{opt.multiplier}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}
            </div>
          )}

          {/* Fixed mode: budget */}
          {mode === "fixed" && (
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Your Budget</p>
              <Field label="Budget (R)" hint="This amount is held in escrow until the gig is complete">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">R</span>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl h-10 pl-8 text-sm"
                  />
                </div>
              </Field>

              {/* Range hint */}
              {quote && !quoteLoading && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs border ${
                  outOfBand
                    ? "bg-amber-500/5 border-amber-500/25 text-amber-600 dark:text-amber-400"
                    : "bg-muted/40 border-border text-muted-foreground"
                }`}>
                  {outOfBand
                    ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    : <Info className="h-3.5 w-3.5 shrink-0" />
                  }
                  Suggested range: <span className="font-mono font-semibold ml-1">{zar(quote.bandMin)} – {zar(quote.bandMax)}</span>
                </div>
              )}

              {outOfBand && (
                <Field label="Reason for custom budget">
                  <Textarea
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    placeholder="Explain why this budget is appropriate…"
                    rows={2}
                    className="rounded-xl resize-none text-sm"
                  />
                </Field>
              )}
            </div>
          )}

          {/* Price summary */}
          {(quoteLoading || (mode === "smart" && quote) || (mode === "fixed" && quote)) && (
            <div className={`rounded-2xl border-2 overflow-hidden ${
              mode === "smart" ? "border-emerald-500/40" : "border-primary/30"
            }`}>
              <div className={`px-4 py-3 flex items-center gap-2 ${
                mode === "smart" ? "bg-emerald-500/10" : "bg-primary/8"
              }`}>
                {mode === "smart"
                  ? <Sparkles className="h-4 w-4 text-emerald-500" />
                  : <DollarSign className="h-4 w-4 text-primary" />
                }
                <span className={`text-xs font-bold uppercase tracking-wide ${
                  mode === "smart" ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
                }`}>
                  {mode === "smart" ? "Your Price" : "Pricing Breakdown"}
                </span>
              </div>

              {quoteLoading ? (
                <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
                </div>
              ) : quote && (
                <div className="divide-y divide-border">
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono text-foreground">{zar(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-muted-foreground">Platform fee</span>
                    <span className="font-mono text-foreground">{zar(quote.fee)}</span>
                  </div>
                  <div className={`flex justify-between px-4 py-3 font-bold ${
                    mode === "smart" ? "bg-emerald-500/8" : "bg-primary/5"
                  }`}>
                    <span className="text-foreground text-base">
                      {mode === "smart" ? "Total" : "Suggested total"}
                    </span>
                    <span className={`font-mono text-xl ${
                      mode === "smart" ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
                    }`}>
                      {zar(mode === "smart" ? quote.total : (isNaN(budgetNum) ? quote.total : budgetNum))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Insufficient balance warning */}
          {insufficient && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 px-3 py-3 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Insufficient balance.{" "}
              <button type="button" onClick={() => navigate("/wallet")} className="underline font-semibold">Top up →</button>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className={`w-full rounded-xl font-bold h-12 text-base ${
              mode === "smart" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
            disabled={loading || quoteLoading || insufficient || (mode === "smart" && !quote)}
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Posting…</>
              : mode === "smart"
                ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirm & Post — {quote ? zar(quote.total) : "…"}</>
                : <><DollarSign className="h-4 w-4 mr-2" /> Post Gig{!isNaN(budgetNum) && budgetNum > 0 ? ` — ${zar(budgetNum)}` : ""}</>
            }
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Funds are held in escrow and only released when you confirm work is complete.
          </p>
        </form>
      </div>
    </AppLayout>
  );
}