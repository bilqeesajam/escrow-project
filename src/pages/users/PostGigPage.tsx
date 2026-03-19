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
  Loader2, Zap, DollarSign, MapPin, Clock, ShoppingCart,
  CheckCircle2, AlertTriangle, Ruler, Info,
  ArrowRight, Sparkles, Package, Store, Shield, CreditCard,
} from "lucide-react";
import { backendRequest } from "../../lib/backend";
import { initiatePayFastPayment, getHoldTransactionForGig } from "../../lib/payfast";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["errand", "pickup", "delivery", "shopping", "other"] as const;
type Category = typeof CATEGORIES[number];
type Mode     = "fixed" | "smart";
type Step     = "form" | "fund";

const CATEGORY_META: Record<Category, {
  icon: React.ElementType; label: string; needsCart: boolean;
  locationType: "single" | "dual" | "dual-optional";
  fromLabel?: string; toLabel?: string;
}> = {
  errand:   { icon: Clock,        label: "Errand",   needsCart: false, locationType: "single",        fromLabel: "Location"          },
  pickup:   { icon: Store,        label: "Pickup",   needsCart: false, locationType: "dual",          fromLabel: "Pickup location",    toLabel: "Drop-off location" },
  delivery: { icon: Package,      label: "Delivery", needsCart: false, locationType: "dual",          fromLabel: "Pickup location",    toLabel: "Delivery location" },
  shopping: { icon: ShoppingCart, label: "Shopping", needsCart: true,  locationType: "single",        fromLabel: "Delivery location"  },
  other:    { icon: Zap,          label: "Other",    needsCart: false, locationType: "dual-optional", fromLabel: "From",              toLabel: "To (optional)"     },
};

const zar = (n: number) => `R ${n.toFixed(2)}`;

interface Quote {
  subtotal: number; fee: number; total: number;
  bandMin: number; bandMax: number;
  complexityOptions: { key: string; multiplier: number }[];
}

interface CreatedGig {
  gigId: string;
  transactionId: string | null;
  title: string;
  total: number;
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

// ─── PayFast funding step ─────────────────────────────────────────────────────
function FundStep({
  gig, onPay, onSkip, paying,
}: {
  gig: CreatedGig; onPay: () => void; onSkip: () => void; paying: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Success banner */}
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 shrink-0">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <p className="font-bold text-foreground text-sm">Gig created successfully!</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground capitalize">{gig.title}</span> is ready — complete your payment to activate it.
          </p>
        </div>
      </div>

      {/* Payment summary */}
      <div className="rounded-2xl border-2 border-primary/25 overflow-hidden">
        <div className="bg-primary/8 px-4 py-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wide text-primary">Escrow Payment</span>
        </div>
        <div className="divide-y divide-border">
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Amount to hold in escrow</span>
            <span className="font-mono font-bold text-foreground">{zar(gig.total)}</span>
          </div>
          <div className="px-4 py-3 text-xs text-muted-foreground">
            Funds are held securely by GigHold and only released to the hustler when you confirm the work is complete.
          </div>
        </div>
      </div>

      {/* PayFast button */}
      {gig.transactionId ? (
        <Button
          onClick={onPay}
          disabled={paying}
          className="w-full h-12 rounded-xl font-bold text-base bg-primary hover:bg-primary/90"
        >
          {paying
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirecting to PayFast…</>
            : <><CreditCard className="h-5 w-5 mr-2" /> Pay {zar(gig.total)} via PayFast</>}
        </Button>
      ) : (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Could not find the payment transaction. Your gig was created but payment is pending.
            Go to your wallet to complete the payment.
          </span>
        </div>
      )}

      {/* Test card hint */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">PayFast Sandbox Test Card</p>
        <div className="grid grid-cols-3 gap-2 text-xs font-mono text-foreground">
          <span>4000 0000 0000 0002</span>
          <span>Any future date</span>
          <span>Any 3 digits</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        Skip for now — pay from wallet later
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PostGigPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step,          setStep]          = useState<Step>("form");
  const [createdGig,    setCreatedGig]    = useState<CreatedGig | null>(null);
  const [paying,        setPaying]        = useState(false);

  const [mode,           setMode]           = useState<Mode>("fixed");
  const [title,          setTitle]          = useState("");
  const [description,    setDescription]    = useState("");
  const [fromLocation,   setFromLocation]   = useState("");
  const [toLocation,     setToLocation]     = useState("");
  const [category,       setCategory]       = useState<Category>("errand");
  const [hours,          setHours]          = useState("1");
  const [distanceKm,     setDistanceKm]     = useState("0");
  const [cartValue,      setCartValue]      = useState("");
  const [complexityKeys, setComplexityKeys] = useState<string[]>([]);
  const [budget,         setBudget]         = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [quote,          setQuote]          = useState<Quote | null>(null);
  const [quoteLoading,   setQuoteLoading]   = useState(false);
  const [loading,        setLoading]        = useState(false);

  useEffect(() => { setComplexityKeys([]); setOverrideReason(""); setQuote(null); }, [category]);
  useEffect(() => { setQuote(null); setOverrideReason(""); }, [mode]);

  // Smart mode quote
  useEffect(() => {
    if (mode !== "smart") return;
    const h = parseFloat(hours), d = parseFloat(distanceKm);
    if (!h || h <= 0 || isNaN(d) || d < 0) return;
    const controller = new AbortController();
    setQuoteLoading(true);
    backendRequest<{ subtotal: string; fee: string; total: string; band_min: string; band_max: string; complexity_options: { key: string; multiplier: number }[] }>(
      "/api/pricing/quote/", { body: { category, hours: h, distance_km: d, complexity_keys: complexityKeys } }
    )
      .then(data => { if (!controller.signal.aborted) setQuote({ subtotal: parseFloat(data.subtotal), fee: parseFloat(data.fee), total: parseFloat(data.total), bandMin: parseFloat(data.band_min), bandMax: parseFloat(data.band_max), complexityOptions: data.complexity_options || [] }); })
      .catch(err  => { if (!controller.signal.aborted) toast.error(err?.message ?? "Failed to fetch quote"); })
      .finally(()  => { if (!controller.signal.aborted) setQuoteLoading(false); });
    return () => controller.abort();
  }, [mode, category, hours, distanceKm, complexityKeys.join("|")]);

  // Fixed mode band
  useEffect(() => {
    if (mode !== "fixed") return;
    const controller = new AbortController();
    setQuoteLoading(true);
    backendRequest<{ subtotal: string; fee: string; total: string; band_min: string; band_max: string; complexity_options: { key: string; multiplier: number }[] }>(
      "/api/pricing/quote/", { body: { category, hours: 1, distance_km: 0, complexity_keys: [] } }
    )
      .then(data => { if (!controller.signal.aborted) setQuote({ subtotal: parseFloat(data.subtotal), fee: parseFloat(data.fee), total: parseFloat(data.total), bandMin: parseFloat(data.band_min), bandMax: parseFloat(data.band_max), complexityOptions: data.complexity_options || [] }); })
      .catch(() => {})
      .finally(()  => { if (!controller.signal.aborted) setQuoteLoading(false); });
    return () => controller.abort();
  }, [mode, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    if (!title.trim())        { toast.error("Title is required.");           return; }
    if (!description.trim())  { toast.error("Description is required.");     return; }
    if (!fromLocation.trim()) { toast.error("Pickup location is required."); return; }

    const locType = CATEGORY_META[category].locationType;
    if (locType === "dual" && !toLocation.trim()) { toast.error("Drop-off location is required for this category."); return; }

    const locationStr = toLocation.trim()
      ? `${fromLocation.trim()} → ${toLocation.trim()}`
      : fromLocation.trim();

    const balance = Number(profile.balance ?? 0);

    setLoading(true);
    try {
      let requestedTotal: number;
      let bodyExtras: Record<string, any> = {};

      if (mode === "smart") {
        const h = parseFloat(hours), d = parseFloat(distanceKm);
        if (!h || h <= 0)      { toast.error("Enter valid hours.");    setLoading(false); return; }
        if (isNaN(d) || d < 0) { toast.error("Enter valid distance."); setLoading(false); return; }
        if (!quote)            { toast.error("Wait for price calculation."); setLoading(false); return; }
        requestedTotal = quote.total;
        bodyExtras = { hours: h, distance_km: d, cart_value: cartValue ? parseFloat(cartValue) : null, complexity_keys: complexityKeys, override_reason: "" };
      } else {
        const budgetNum = parseFloat(budget);
        if (!budgetNum || budgetNum <= 0) { toast.error("Enter a valid budget."); setLoading(false); return; }
        const outOfBand = quote && (budgetNum < quote.bandMin || budgetNum > quote.bandMax);
        if (outOfBand && !overrideReason.trim()) { toast.error("A reason is required when outside the suggested range."); setLoading(false); return; }
        requestedTotal = budgetNum;
        bodyExtras = { hours: 1, distance_km: 0, cart_value: null, complexity_keys: [], override_reason: overrideReason.trim() };
      }

      // Note: the backend deducts from Supabase balance; PayFast is the actual payment
      // For now balance check is kept as a guard, but PayFast will be the source of truth
      if (balance < requestedTotal) {
        toast.error(`Insufficient balance. Need ${zar(requestedTotal)}.`);
        setLoading(false);
        return;
      }

      const res = await backendRequest<{ gig_id: string; total: string; requires_approval: boolean }>(
        "/api/gigs/create/", {
          body: { title: title.trim(), description: description.trim(), location: locationStr, category, requested_total: requestedTotal, ...bodyExtras },
        }
      );

      await refreshProfile();

      // Look up the hold transaction so we can redirect to PayFast
      const txnId = await getHoldTransactionForGig(res.gig_id);

      setCreatedGig({ gigId: res.gig_id, transactionId: txnId, title: title.trim(), total: requestedTotal });
      setStep("fund");

      if (res.requires_approval) {
        toast.info("Gig submitted for admin review — complete payment to activate it.");
      } else {
        toast.success("Gig created! Complete payment to go live.");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to post gig.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayFast = async () => {
    if (!createdGig?.transactionId) return;
    setPaying(true);
    try {
      await initiatePayFastPayment(createdGig.transactionId);
      // Browser redirects to PayFast — execution stops here
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to redirect to PayFast.");
      setPaying(false);
    }
  };

  const balance      = Number(profile?.balance ?? 0);
  const budgetNum    = parseFloat(budget);
  const costToClient = mode === "smart" ? (quote?.total ?? 0) : (!isNaN(budgetNum) ? budgetNum : 0);
  const outOfBand    = mode === "fixed" && quote && !isNaN(budgetNum) && (budgetNum < quote.bandMin || budgetNum > quote.bandMax);
  const insufficient = costToClient > 0 && costToClient > balance;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pb-10 animate-fade-in">

        {/* Header */}
        <div className="w-full pt-6 pb-5 text-center">
          <h2 className="text-4xl font-extrabold text-foreground mb-1">Post a Gig</h2>
          <p className="text-muted-foreground text-sm">
            Wallet: <span className="font-mono font-semibold text-foreground">{zar(balance)}</span>
          </p>
        </div>

        {/* ── Fund step ─────────────────────────────────────────────────── */}
        {step === "fund" && createdGig && (
          <FundStep
            gig={createdGig}
            onPay={handlePayFast}
            onSkip={() => navigate("/my-gigs")}
            paying={paying}
          />
        )}

        {/* ── Form step ─────────────────────────────────────────────────── */}
        {step === "form" && (
          <>
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button type="button" onClick={() => setMode("fixed")}
                className={`relative flex flex-col gap-2 p-4 rounded-2xl border-2 text-left transition-all ${mode === "fixed" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${mode === "fixed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <DollarSign className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${mode === "fixed" ? "text-foreground" : "text-muted-foreground"}`}>Fixed Price</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">You set the budget — must stay within the allowed range.</p>
                </div>
                {mode === "fixed" && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />}
              </button>

              <button type="button" onClick={() => setMode("smart")}
                className={`relative flex flex-col gap-2 p-4 rounded-2xl border-2 text-left transition-all ${mode === "smart" ? "border-emerald-500 bg-emerald-500/5" : "border-border bg-card hover:border-emerald-500/30"}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${mode === "smart" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${mode === "smart" ? "text-foreground" : "text-muted-foreground"}`}>Smart Price</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Tell us the job details — we calculate a fair price for you.</p>
                </div>
                {mode === "smart" && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500" />}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Gig details */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <Field label="Title">
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Pick up documents from CBD" maxLength={100} className="rounded-xl h-9" />
                </Field>
                <Field label="Description">
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what needs to be done…" maxLength={1000} rows={2} className="rounded-xl resize-none text-sm" />
                </Field>

                <Field label="Category">
                  <div className="grid grid-cols-5 gap-1.5">
                    {CATEGORIES.map(cat => {
                      const meta = CATEGORY_META[cat]; const Icon = meta.icon;
                      return (
                        <button key={cat} type="button" onClick={() => setCategory(cat)}
                          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all ${category === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-[9px] font-semibold capitalize">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Location */}
                <div className={CATEGORY_META[category].locationType === "single" ? "grid grid-cols-1" : "grid grid-cols-2 gap-3"}>
                  <Field label={CATEGORY_META[category].fromLabel || "From"}>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input value={fromLocation} onChange={e => setFromLocation(e.target.value)} placeholder={CATEGORY_META[category].fromLabel || "Pickup location"} maxLength={200} className="rounded-xl h-9 pl-8 text-sm" />
                    </div>
                  </Field>
                  {CATEGORY_META[category].locationType !== "single" && (
                    <Field label={CATEGORY_META[category].toLabel || "To"} hint={CATEGORY_META[category].locationType === "dual-optional" ? "Optional" : undefined}>
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                        <Input value={toLocation} onChange={e => setToLocation(e.target.value)} placeholder={CATEGORY_META[category].toLabel || "Drop-off location"} maxLength={200} className="rounded-xl h-9 pl-8 text-sm" />
                      </div>
                    </Field>
                  )}
                </div>
              </div>

              {/* Smart mode */}
              {mode === "smart" && (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.03] p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Job Estimate</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Hours">
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input type="number" min="0.5" step="0.5" value={hours} onChange={e => setHours(e.target.value)} className="rounded-xl h-9 pl-8 text-sm" />
                      </div>
                    </Field>
                    <Field label="Distance (km)">
                      <div className="relative">
                        <Ruler className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input type="number" min="0" step="0.1" value={distanceKm} onChange={e => setDistanceKm(e.target.value)} className="rounded-xl h-9 pl-8 text-sm" />
                      </div>
                    </Field>
                  </div>
                  {CATEGORY_META[category].needsCart && (
                    <Field label="Cart value (R)">
                      <div className="relative">
                        <ShoppingCart className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input type="number" min="0" step="0.01" value={cartValue} onChange={e => setCartValue(e.target.value)} placeholder="0.00" className="rounded-xl h-9 pl-8 text-sm" />
                      </div>
                    </Field>
                  )}
                  {quote && quote.complexityOptions.length > 0 && (
                    <Field label="Complexity factors">
                      <div className="grid grid-cols-2 gap-1.5">
                        {quote.complexityOptions.map(opt => {
                          const checked = complexityKeys.includes(opt.key);
                          return (
                            <button key={opt.key} type="button" onClick={() => setComplexityKeys(prev => checked ? prev.filter(k => k !== opt.key) : [...prev, opt.key])}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-xl border-2 text-xs transition-all ${checked ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-border text-muted-foreground hover:border-emerald-500/40"}`}
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

              {/* Fixed mode */}
              {mode === "fixed" && (
                <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Your Budget</p>
                  <Field label="Budget (R)" hint="Held in escrow until you confirm the work is complete">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">R</span>
                      <Input type="number" min="1" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0.00" className="rounded-xl h-9 pl-7 text-sm" />
                    </div>
                  </Field>
                  {quote && !quoteLoading && (
                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs border ${outOfBand ? "bg-amber-500/5 border-amber-500/25 text-amber-600 dark:text-amber-400" : "bg-muted/40 border-border text-muted-foreground"}`}>
                      {outOfBand ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <Info className="h-3.5 w-3.5 shrink-0" />}
                      Suggested range: <span className="font-mono font-semibold ml-1">{zar(quote.bandMin)} – {zar(quote.bandMax)}</span>
                    </div>
                  )}
                  {outOfBand && (
                    <Field label="Reason for custom budget">
                      <Textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="Explain why this budget is appropriate…" rows={2} className="rounded-xl resize-none text-sm" />
                    </Field>
                  )}
                </div>
              )}

              {/* Price summary */}
              {(quoteLoading || quote) && (
                <div className={`rounded-2xl border-2 overflow-hidden ${mode === "smart" ? "border-emerald-500/40" : "border-primary/30"}`}>
                  <div className={`px-4 py-2.5 flex items-center gap-2 ${mode === "smart" ? "bg-emerald-500/10" : "bg-primary/8"}`}>
                    {mode === "smart" ? <Sparkles className="h-4 w-4 text-emerald-500" /> : <DollarSign className="h-4 w-4 text-primary" />}
                    <span className={`text-xs font-bold uppercase tracking-wide ${mode === "smart" ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>
                      {mode === "smart" ? "Your Price" : "Pricing Breakdown"}
                    </span>
                  </div>
                  {quoteLoading ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
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
                      <div className={`flex justify-between px-4 py-3 font-bold ${mode === "smart" ? "bg-emerald-500/8" : "bg-primary/5"}`}>
                        <span className="text-foreground">{mode === "smart" ? "Total" : "Suggested total"}</span>
                        <span className={`font-mono text-xl ${mode === "smart" ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>
                          {zar(mode === "smart" ? quote.total : (!isNaN(budgetNum) ? budgetNum : quote.total))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {insufficient && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 px-3 py-2.5 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Insufficient balance.{" "}
                  <button type="button" onClick={() => navigate("/wallet")} className="underline font-semibold">Top up →</button>
                </div>
              )}

              <Button type="submit" className={`w-full rounded-xl font-bold h-11 ${mode === "smart" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`} disabled={loading || quoteLoading || insufficient || (mode === "smart" && !quote)}>
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating gig…</>
                  : mode === "smart"
                    ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Create Gig — {quote ? zar(quote.total) : "…"}</>
                    : <><ArrowRight className="h-4 w-4 mr-2" /> Continue to Payment{!isNaN(budgetNum) && budgetNum > 0 ? ` — ${zar(budgetNum)}` : ""}</>
                }
              </Button>

              <p className="text-[11px] text-center text-muted-foreground">
                Funds are held in escrow via PayFast and only released when you confirm work is complete.
              </p>
            </form>
          </>
        )}
      </div>
    </AppLayout>
  );
}