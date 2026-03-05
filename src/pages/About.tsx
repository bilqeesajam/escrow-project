import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ArrowRight,
  UserPlus,
  FileText,
  Handshake,
  CreditCard,
  Truck,
  CheckCircle2,
  Banknote,
  AlertTriangle,
  Scale,
  ChevronRight,
} from "lucide-react";

const workflowSteps = [
  {
    icon: UserPlus,
    title: "1. Create your account",
    who: "Both buyer and seller",
    description:
      "Sign up with your email address. You will get a personal dashboard where all your transactions live. Think of it like your deal inbox.",
    detail:
      "Once you sign up, you are automatically set up as a buyer. When someone invites you to a deal as a seller, that role is added for you.",
  },
  {
    icon: FileText,
    title: "2. Buyer creates a transaction",
    who: "Buyer",
    description:
      "The buyer starts a new deal by filling in what they are buying, how much it costs, and any delivery details. They also enter the seller's email address so the seller gets notified.",
    detail:
      "This is like writing up a simple agreement. Both sides will be able to see exactly what was agreed on. No hidden terms.",
  },
  {
    icon: Handshake,
    title: "3. Seller reviews and accepts",
    who: "Seller",
    description:
      "The seller receives a notification and can see the full terms of the deal. If everything looks right, they accept. If not, they can discuss changes with the buyer before accepting.",
    detail:
      "Nothing moves forward until the seller agrees. This protects sellers from being locked into deals they did not approve.",
  },
  {
    icon: CreditCard,
    title: "4. Buyer funds the escrow",
    who: "Buyer",
    description:
      "Once the seller accepts, the buyer sends the payment. The money is held securely in escrow. It is not sent to the seller yet. Think of it like putting money in a safe that neither side can open alone.",
    detail:
      "This protects both sides. The seller knows the money is there, and the buyer knows it will not be released until they confirm delivery.",
  },
  {
    icon: Truck,
    title: "5. Seller delivers the goods or service",
    who: "Seller",
    description:
      "The seller fulfils their part of the deal, whether that is shipping a product, completing a service, or delivering files. They mark the transaction as 'delivered' and can add proof (photos, tracking numbers, documents).",
    detail:
      "Everything is recorded on the transaction timeline. Both parties can see when delivery was marked and what evidence was provided.",
  },
  {
    icon: CheckCircle2,
    title: "6. Buyer confirms receipt",
    who: "Buyer",
    description:
      "The buyer checks what was delivered. If they are satisfied, they confirm receipt. This is the green light that the deal went well.",
    detail:
      "This step exists to make sure the buyer actually received what they paid for before any money changes hands.",
  },
  {
    icon: Banknote,
    title: "7. Funds are released to the seller",
    who: "Automatic",
    description:
      "Once the buyer confirms, the funds are released from escrow to the seller. The deal is complete. Both sides can see the final status and the full timeline of everything that happened.",
    detail:
      "This is the end of a successful transaction. The money is only released when both sides are satisfied.",
  },
];

const disputeSteps = [
  {
    icon: AlertTriangle,
    title: "Buyer opens a dispute",
    description:
      "If the buyer is not happy with what was delivered (wrong item, poor quality, never arrived), they can open a dispute instead of confirming receipt. They describe the problem and can upload evidence like photos or screenshots.",
  },
  {
    icon: Scale,
    title: "Admin reviews the case",
    description:
      "An EscrowShield admin reviews the dispute, looking at the transaction terms, the delivery evidence, and the buyer's complaint. They may ask either party for more information.",
  },
  {
    icon: Banknote,
    title: "Resolution",
    description:
      "The admin makes a decision: either release the funds to the seller (if delivery was correct) or refund the buyer (if the seller did not fulfil their obligations). The decision is recorded on the timeline for full transparency.",
  },
];

export default function About() {
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
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#disputes" className="hover:text-foreground transition-colors">Disputes</a>
          </nav>

          <div className="flex items-center gap-2">
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
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
            <FileText className="h-4 w-4" />
            Complete guide
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-[1.1]">
            How EscrowShield works,
            <span className="text-primary"> step by step</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            This guide walks you through the entire escrow process, from creating an account to receiving payment. No jargon, no confusion. Just the plain steps.
          </p>
        </div>
      </section>

      {/* What is Escrow */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
            What is escrow?
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <p>
              Escrow is a way to protect both the buyer and the seller in a transaction. Instead of sending money directly to the seller and hoping for the best, the buyer's payment is held by a trusted third party (EscrowShield) until the deal is complete.
            </p>
            <p>
              <strong className="text-foreground">For buyers:</strong> Your money is safe. It only goes to the seller after you confirm you received what you paid for.
            </p>
            <p>
              <strong className="text-foreground">For sellers:</strong> You know the money is real and waiting. Once you deliver, the funds are released to you.
            </p>
            <p>
              <strong className="text-foreground">If something goes wrong:</strong> Either side can open a dispute. An admin reviews the evidence and makes a fair decision.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                The full workflow
              </h2>
              <p className="text-muted-foreground mt-3">
                Here is exactly what happens at each stage of a transaction.
              </p>
            </div>

            <div className="space-y-6">
              {workflowSteps.map(({ icon: Icon, title, who, description, detail }, i) => (
                <div key={title} className="relative rounded-2xl border border-border bg-background p-8">
                  <div className="flex items-start gap-5">
                    <div className="shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 mt-1">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {who}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {description}
                      </p>
                      <p className="text-sm text-muted-foreground/80 leading-relaxed border-l-2 border-primary/20 pl-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {detail}
                      </p>
                    </div>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center">
                        <ChevronRight className="h-4 w-4 text-primary rotate-90" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Disputes */}
      <section id="disputes" className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              What happens if there is a problem?
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Disputes are rare, but when they happen, EscrowShield handles them fairly and transparently.
            </p>
          </div>

          <div className="space-y-6">
            {disputeSteps.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-8">
                <div className="flex items-start gap-5">
                  <div className="shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-destructive/10 border border-destructive/20 mt-1">
                    <Icon className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ-like tips */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
            Tips for a smooth transaction
          </h2>
          <div className="space-y-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {[
              "Be specific in your transaction terms. The clearer the expectations, the fewer disputes.",
              "Sellers: always upload proof of delivery (tracking numbers, screenshots, photos).",
              "Buyers: review the delivered goods promptly. Delays hold up the seller's payment.",
              "If you are unsure about something, open a conversation before escalating to a dispute.",
              "Both parties can see the full timeline of every action. Transparency builds trust.",
            ].map((tip, i) => (
              <div key={i} className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <p className="text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to try it yourself?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Create your account and start your first secure transaction in minutes.
          </p>
          <Button asChild size="lg" className="text-base px-8 h-12">
            <Link to="/auth">
              Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="container mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} EscrowShield. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
