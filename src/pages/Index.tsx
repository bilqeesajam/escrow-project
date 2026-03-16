import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion, AccordionContent,
  AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Shield, ArrowRight, Lock, Zap, CheckCircle,
  Handshake, Truck, Search, Banknote, User,
  LogOut, Moon, Sun, ChevronRight, MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useState, useMemo } from "react";
import PublicLayout from "@/components/PublicLayout";

// ─── Smooth-scroll with header offset ────────────────────────────────────────
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 80;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const faqData = [
  { id: "gs-1", category: "Getting Started",         question: "Who can use this platform?",        answer: "Anyone 18 years or older with a valid South African ID and email address. Full KYC verification is required before posting or accepting gigs." },
  { id: "gs-2", category: "Getting Started",         question: "Is my data safe?",                  answer: "Yes. All data is protected with industry-standard TLS encryption, stored on SOC-2 compliant infrastructure, and never sold to third parties." },
  { id: "gs-3", category: "Getting Started",         question: "What is KYC and why do I need it?", answer: "KYC (Know Your Customer) is a verification process that confirms your identity. It protects the platform from fraud and ensures every transaction is between verified individuals." },
  { id: "pp-1", category: "Payments & Payouts",      question: "How do I fund a gig?",              answer: "Add funds to your wallet via PayFast. When you post a gig, the budget is held in escrow until the work is verified complete with a PIN." },
  { id: "pp-2", category: "Payments & Payouts",      question: "When are funds released?",          answer: "Funds are released when you confirm the work is done and share a 6-digit PIN with the hustler. Entering the PIN triggers an instant wallet credit." },
  { id: "pp-3", category: "Payments & Payouts",      question: "What is the platform fee?",         answer: "A small percentage fee is applied per completed gig, shown clearly before you confirm. There are no hidden charges or subscription costs." },
  { id: "cm-1", category: "Changes & Modifications", question: "Can I cancel after a hustler accepts?", answer: "Yes, but cancelling after acceptance opens a dispute. An admin will review the situation and allocate escrow funds fairly based on evidence." },
  { id: "cm-2", category: "Changes & Modifications", question: "What counts as proof of delivery?", answer: "Any agreed-upon evidence: photos, videos, documents, or the hustelr marking the gig done from their side. Final release always requires the client PIN." },
  { id: "df-1", category: "Disputes & Fees",         question: "What happens if there is a dispute?", answer: "Our admin team reviews evidence from both parties and makes a fair determination. Escrow funds are released according to the outcome." },
  { id: "df-2", category: "Disputes & Fees",         question: "Who pays the escrow fee?",          answer: "The platform fee is deducted from the gig budget on release. Clients fund the full budget, hustlers receive the net amount after fees." },
];
const faqCategories = ["Getting Started", "Payments & Payouts", "Changes & Modifications", "Disputes & Fees"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQ = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return faqData.filter(item =>
      item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const groupedFAQ = useMemo(() =>
    faqCategories.map(cat => ({ category: cat, items: filteredFAQ.filter(i => i.category === cat) }))
  , [filteredFAQ]);

  const navLinkClass =
    "relative hover:text-primary transition-colors before:absolute before:bottom-[-4px] before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full";


  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ─────────────────────────────────────────────────────────────────────
          NAVBAR — floating pill, expands on hover
      ───────────────────────────────────────────────────────────────────── */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <nav
          className="
            group pointer-events-auto
            flex items-center justify-between
            bg-background/90 backdrop-blur-xl
            border border-border
            rounded-2xl shadow-lg
            px-4 h-12
            transition-all duration-500 ease-in-out
            w-[62%] hover:w-[88%]
            overflow-hidden
          "
        >
          {/* Logo — always visible */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/25">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              Gig<span className="text-primary">Hold</span>
            </span>
          </Link>

          {/* Nav links — hidden by default, fade in on group-hover */}
          <div className="
            hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground
            opacity-0 group-hover:opacity-100
            translate-x-4 group-hover:translate-x-0
            transition-all duration-400 ease-in-out
            pointer-events-none group-hover:pointer-events-auto
            whitespace-nowrap
          ">
            <button onClick={() => scrollTo("how-it-works")} className={navLinkClass}>How it works</button>
            <button onClick={() => scrollTo("features")}     className={navLinkClass}>Features</button>
            <button onClick={() => scrollTo("faq")}          className={navLinkClass}>FAQ</button>
            <Link to="/pricing" className={navLinkClass}>Pricing</Link>
          </div>

          {/* Right side — always visible */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleTheme}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              {theme === "dark"
                ? <Sun  className="h-3.5 w-3.5 text-muted-foreground" />
                : <Moon className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>

            {user ? (
              <>
                <Button asChild size="sm" className="h-7 text-xs rounded-lg px-3 hidden sm:inline-flex">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs rounded-lg px-3 text-muted-foreground hover:text-foreground">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="h-7 text-xs rounded-lg px-3">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>

      <main>
        {/* ─────────────────────────────────────────────────────────────────
            HERO
        ───────────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 overflow-hidden">

          {/* Background grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />

          {/* Radial glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[120px]" />
          </div>

          {/* Trust badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Shield className="h-3 w-3" />
            Escrow-backed · KYC-verified · South Africa
          </div>

          <h1 className="relative text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mt-8 mb-8 max-w-5xl">
            The Service Marketplace
            <br />
            <span className="text-primary">Built on Trust</span>
          </h1>

          <p className="relative text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">
            Post tasks, hire verified hustlers, and pay with confidence.
            Funds are held in escrow and only released when the job is done.
          </p>

          <div className="relative flex flex-col sm:flex-row items-center gap-3 mb-16">
            <Button size="lg" asChild className="rounded-xl px-7 font-semibold h-12">
              <Link to="/signup">Start for Free <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-xl px-7 h-12 border-border">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>

          {/* Stat strip */}
          <div className="relative flex flex-col sm:flex-row items-center gap-8 sm:gap-16 text-center">
            {[
              { value: "100%", label: "Escrow Protected" },
              { value: "KYC",  label: "Verified Users Only" },
              { value: "PIN",  label: "Secure Fund Release" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            FEATURES
        ───────────────────────────────────────────────────────────────── */}
        <section id="features" className="scroll-mt-24 container pb-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to transact safely</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                icon: Lock,
                title: "Escrow Protection",
                desc: "Client funds are locked on gig acceptance. The hustler only gets paid when you release the PIN — no disputes, no chargebacks.",
                accent: "text-primary",
                bg: "bg-primary/5 border-primary/15",
              },
              {
                icon: Zap,
                title: "Instant Matching",
                desc: "Post a gig and get matched with hustlers in your area. Our open marketplace surfaces the right talent fast.",
                accent: "text-amber-500",
                bg: "bg-amber-500/5 border-amber-500/15",
              },
              {
                icon: Shield,
                title: "KYC Verification",
                desc: "Every user is identity-verified before transacting. You always know exactly who you're dealing with.",
                accent: "text-emerald-500",
                bg: "bg-emerald-500/5 border-emerald-500/15",
              },
            ].map(({ icon: Icon, title, desc, accent, bg }) => (
              <div key={title} className={`rounded-2xl border ${bg} p-7 flex flex-col gap-4`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-background border border-border`}>
                  <Icon className={`h-5 w-5 ${accent}`} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            HOW IT WORKS
        ───────────────────────────────────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-24 py-24 border-y border-border bg-muted/20">
          <div className="container max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">The Process</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Five steps. Zero risk.</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                From posting a task to releasing funds — every step is transparent and protected.
              </p>
            </div>

            {/* Steps — horizontal timeline */}
            <div className="relative">
              {/* Connecting line (desktop) */}
              <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-px bg-border" />

              <div className="grid lg:grid-cols-5 gap-6">
                {[
                  { n: "01", icon: Handshake,   title: "Post a Task",       desc: "Define your gig with clear terms, budget, and location." },
                  { n: "02", icon: CheckCircle,  title: "Hustler Accepts",   desc: "A verified hustler picks up your task and confirms." },
                  { n: "03", icon: Lock,         title: "Funds Locked",      desc: "Your payment is held securely in escrow instantly." },
                  { n: "04", icon: Truck,        title: "Work Delivered",    desc: "Hustler completes the job and marks it done." },
                  { n: "05", icon: Banknote,     title: "Funds Released",    desc: "You confirm with a PIN — hustler gets paid." },
                ].map(({ n, icon: Icon, title, desc }) => (
                  <div key={n} className="flex flex-col items-center text-center gap-3">
                    {/* Icon circle — sits on the timeline line */}
                    <div className="relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-card border border-border shadow-sm">
                      <Icon className="h-6 w-6 text-primary" />
                      <span className="text-[10px] font-mono font-bold text-muted-foreground mt-1">{n}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA strip */}
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-primary/20 bg-primary/5 px-8 py-6">
              <div>
                <p className="font-bold text-foreground">Ready to get started?</p>
                <p className="text-sm text-muted-foreground mt-0.5">Create your free account in under 2 minutes.</p>
              </div>
              <Button asChild className="rounded-xl px-6 shrink-0">
                <Link to="/signup">Create Account <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            FAQ
        ───────────────────────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-24 container py-24">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Support</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Everything you need to know about GigHold.
              </p>
              <div className="relative max-w-lg mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search questions…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              {groupedFAQ.map(section => section.items.length > 0 && (
                <div key={section.category} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-6 py-3.5 border-b border-border bg-muted/30">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h3 className="text-sm font-semibold text-foreground">{section.category}</h3>
                    <span className="ml-auto text-xs text-muted-foreground font-mono">{section.items.length}</span>
                  </div>
                  <div className="px-6 py-2">
                    <Accordion type="single" collapsible className="w-full">
                      {section.items.map(item => (
                        <AccordionItem key={item.id} value={item.id} className="border-border">
                          <AccordionTrigger className="text-left text-sm hover:no-underline hover:text-primary transition-colors py-4 font-medium">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              ))}

              {filteredFAQ.length === 0 && (
                <div className="rounded-2xl border border-border bg-card p-10 text-center">
                  <p className="text-muted-foreground text-sm">
                    No results for <span className="text-primary font-medium">"{searchQuery}"</span> — try different keywords.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card/60">
        <div className="container mx-auto px-6 py-14">
          <div className="grid md:grid-cols-4 gap-10 mb-10">

            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-foreground text-sm">
                  Gig<span className="text-primary">Hold</span>
                </span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Secure escrow infrastructure for every gig transaction in South Africa.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Product
              </h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <button
                  onClick={() => scrollTo("features")}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Features
                </button>

                <button
                  onClick={() => scrollTo("how-it-works")}
                  className="hover:text-foreground transition-colors text-left"
                >
                  How it Works
                </button>

                <button
                  onClick={() => scrollTo("faq")}
                  className="hover:text-foreground transition-colors text-left"
                >
                  FAQ
                </button>

                <Link
                  to="/pricing"
                  onClick={() => window.scrollTo(0, 0)}
                  className="hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Company
              </h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <Link
                  to="/contact"
                  onClick={() => window.scrollTo(0, 0)}
                  className="hover:text-foreground transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Legal
              </h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <Link
                  to="/terms"
                  onClick={() => window.scrollTo(0, 0)}
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>

                <Link
                  to="/privacy"
                  onClick={() => window.scrollTo(0, 0)}
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

          </div>

          {/* Bottom */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} GigHold. All rights reserved.</span>

            <Button asChild size="sm" variant="ghost" className="text-xs rounded-lg">
              <Link to="/signup">
                Get started free <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}