import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Shield,
  ArrowRight,
  Lock,
  Users,
  CheckCircle,
  BadgeCheck,
  Clock3,
  FileText,
  Gavel,
  ChevronRight,
  Banknote,
  Eye,
} from "lucide-react";

const stats = [
  { value: "256-bit", label: "Encryption standard" },
  { value: "100%", label: "Transparent timeline" },
  { value: "24/7", label: "Dispute support" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-border">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-primary tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              EscrowShield
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-[100px]" />
          </div>

          <div className="relative px-6 py-20 md:px-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
                <Shield className="h-4 w-4" />
                Trusted escrow for modern business
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
                Transactions built on
                <span className="text-primary"> trust and clarity</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                EscrowShield holds funds securely until both buyer and seller confirm the deal is done. 
                Clear terms, full visibility, built-in dispute resolution.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto text-base px-8 h-12">
                  <Link to="/auth">
                    Start a Transaction <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12">
                  <Link to="/about">
                    Learn more <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-6 rounded-2xl bg-card border border-border">
              <p className="text-2xl md:text-3xl font-bold text-primary" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Why choose EscrowShield?</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Every feature is designed to protect both parties and keep deals moving forward.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Lock,
              title: "Funds held securely",
              desc: "Payments sit safely in escrow until delivery is confirmed. No one gets burned.",
            },
            {
              icon: Users,
              title: "Buyer and seller protection",
              desc: "Both parties agree to the same terms with full visibility and a clean paper trail.",
            },
            {
              icon: Eye,
              title: "Complete transparency",
              desc: "Every action is logged on a timeline. Both sides always know what happened and what comes next.",
            },
            {
              icon: Gavel,
              title: "Fair dispute resolution",
              desc: "If something goes wrong, open a dispute with evidence. An admin resolves it fairly.",
            },
            {
              icon: Banknote,
              title: "Simple payment flow",
              desc: "Fund with confidence. Money only moves when the deal is confirmed by both parties.",
            },
            {
              icon: CheckCircle,
              title: "Guided workflow",
              desc: "Create, fund, deliver, confirm, release. Clear steps with no confusion or back-and-forth.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-colors"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4 border border-primary/20">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                How it works
              </h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Four simple steps from agreement to payment. Both sides stay informed at every stage.
              </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {[
                {
                  icon: FileText,
                  step: "01",
                  title: "Set the terms",
                  desc: "Buyer creates a transaction with price, delivery details, and expectations.",
                },
                {
                  icon: Users,
                  step: "02",
                  title: "Seller accepts",
                  desc: "Seller reviews the terms and confirms before any funding happens.",
                },
                {
                  icon: Clock3,
                  step: "03",
                  title: "Track delivery",
                  desc: "Mark as delivered, share proof, and keep everything visible on the timeline.",
                },
                {
                  icon: BadgeCheck,
                  step: "04",
                  title: "Release funds",
                  desc: "Buyer confirms receipt and funds are released to the seller.",
                },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div key={title} className="relative rounded-2xl border border-border bg-background p-8">
                  <span className="text-5xl font-bold text-primary/10 absolute top-4 right-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {step}
                  </span>
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4 border border-primary/20">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to make your next deal safer?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Create your first escrow transaction in minutes. No complexity, no fine print.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-base px-8 h-12">
              <Link to="/auth">
                Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 h-12">
              <Link to="/about">
                Read the full guide
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="container mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} EscrowShield. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}