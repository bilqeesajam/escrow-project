import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Percent, ArrowRight, HelpCircle } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";

const pricingTiers = [
  { from: "R0",          to: "R20,000",       pct: "1.50%", highlight: false },
  { from: "R20,001",     to: "R50,000",       pct: "1.25%", highlight: false },
  { from: "R50,001",     to: "R100,000",      pct: "1.00%", highlight: true  },
  { from: "R100,001",    to: "R500,000",      pct: "0.75%", highlight: false },
  { from: "R500,001",    to: "R1,000,000",    pct: "0.50%", highlight: false },
];

const pricingFAQ = [
  {
    q: "Who pays the fee?",
    a: "The fee is deducted from the gig budget on release. Clients fund the full amount upfront; hustlers receive the net payout after the platform fee.",
  },
  {
    q: "Are there additional charges?",
    a: "No. The percentage shown is the only charge. No hidden fees, no subscription costs, no processing surcharges.",
  },
  {
    q: "How is the fee calculated?",
    a: "Fee = agreed gig budget × tier percentage. For example, a R50,000 gig at 1.25% = R625 platform fee; hustler receives R49,375.",
  },
  {
    q: "When is the fee deducted?",
    a: "Only on successful completion — when the client releases funds with the PIN. If a gig is cancelled or refunded before completion, no fee is charged.",
  },
];

export default function PricingPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="text-center space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Transparent Fees</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Simple, tiered pricing
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              The higher the transaction value, the lower the fee. No surprises — ever.
            </p>
          </div>

          {/* ── Pricing table ────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-6 py-5 border-b border-border flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Percent className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Platform Fee Structure</h2>
                <p className="text-xs text-muted-foreground">Based on total gig transaction value</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Example (R100k gig)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pricingTiers.map((tier, i) => {
                    // example fee on R100k for illustration
                    const exampleBase = 100000;
                    const pctNum = parseFloat(tier.pct) / 100;
                    const exampleFee = (exampleBase * pctNum).toLocaleString("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
                    return (
                      <tr
                        key={i}
                        className={`transition-colors hover:bg-muted/30 ${tier.highlight ? "bg-primary/5" : ""}`}
                      >
                        <td className="px-6 py-4 text-muted-foreground">{tier.from}</td>
                        <td className="px-6 py-4 text-muted-foreground">{tier.to}</td>
                        <td className="px-6 py-4">
                          <span className={`font-bold text-base ${tier.highlight ? "text-primary" : "text-foreground"}`}>
                            {tier.pct}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">{exampleFee}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Higher-value transactions attract lower rates — rewarding larger, more confident deals.
                Fee is only charged on successful completion.
              </p>
            </div>
          </div>

          {/* ── Pricing FAQ ──────────────────────────────────────────────── */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Pricing FAQ</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {pricingFAQ.map(({ q, a }) => (
                <div key={q} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
                  <h3 className="text-sm font-semibold text-foreground mb-2">{q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA ──────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-8 py-10 text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Ready to transact with confidence?</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Join GigHold — fair fees, full escrow protection, verified users.
            </p>
            <Button asChild size="lg" className="rounded-xl px-8 h-11 font-semibold">
              <Link to="/signup">Get Started Free <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}