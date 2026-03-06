import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import {
  FaLock,
  FaBalanceScale,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaCreditCard,
  FaHandshake,
  FaTruck,
  FaSearch,
  FaMoneyBillWave,
} from "react-icons/fa";
import Hero from "@/components/Hero";

const stats = [
  { value: "256-bit", label: "Encryption standard" },
  { value: "100%", label: "Transparent timeline" },
  { value: "24/7", label: "Dispute support" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#0f1a2b] sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent border border-white">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              EscrowShield
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white">
            <a href="#how-it-works" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-white before:transition-[width] before:duration-300 hover:before:w-full">
              How it works
            </a>
            <a href="#features" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-white before:transition-[width] before:duration-300 hover:before:w-full">
              Features
            </a>
            <Link to="/about" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-white before:transition-[width] before:duration-300 hover:before:w-full">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-white">
              <Link to="/auth?tab=login">Log In</Link>
            </Button>
            <Button asChild size="sm" className="bg-[#f5b800] text-black hover:bg-[#d4a000]">
              <Link to="/auth?tab=signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <Hero />

      {/* Features */}
      <section id="features" className="w-full bg-[#0f1a2b] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f5b800]">Why choose EscrowShield?</h2>
            <p className="mt-3 max-w-2xl mx-auto text-[#c0c0c0]">
              Every feature is designed to protect both parties and keep deals moving forward.
            </p>
          </div>
          <div className="grid lg:grid-cols-5 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
  {
    title: "Guaranteed Payment Security",
    description: "Funds securely held until conditions are met.",
    hoverText:
      "Funds are held safely by an independent escrow until both parties fulfil the agreement.",
    icon: <FaLock />,
  },
  {
    title: "Fair Dispute Resolution",
    description: "Neutral third-parties for fair outcomes.",
    hoverText:
      "Our impartial mediators help you reach a fair resolution without bias.",
    icon: <FaBalanceScale />,
  },
  {
    title: "Verified and Secure Profiles",
    description: "Thoroughly vetted users, for peace of mind.",
    hoverText: "Every user is checked and approved to prevent fraud.",
    icon: <FaCheckCircle />,
  },
  {
    title: "Transparent Tracking",
    description: "Real-time updates for complete visibility.",
    hoverText: "Track progress at every stage of the transaction.",
    icon: <FaMapMarkerAlt />,
  },
  {
    title: "Seamless PayFast Integration",
    description: "Smooth and reliable payment processing.",
    hoverText: "Payments processed instantly through PayFast.",
    icon: <FaCreditCard />,
  }
          ].map(({ icon, title, description }) => (
            <div
              key={title}
              className="bg-[#1a2235] border border-[#232c40] rounded-2xl p-8 hover:border-[#706cff] transition-colors"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#232c40] mb-4 border border-[#706cff]">
                <span className="text-[#706cff]">{icon}</span>
              </div>
              <h3 className="text-lg bold mb-2 text-white">{title}</h3>
              <p className="text-sm text-[#c0c0c0] leading-relaxed">{description}</p>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="w-full bg-[#1a2836] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f5b800]">
                How it works
              </h2>
              <p className="mt-3 max-w-lg mx-auto text-[#c0c0c0]">
                Four simple steps from agreement to payment. Both sides stay informed at every stage.
              </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              {[
                  {
    title: "1. Agree to Terms",
    description:
      "Buyer and Seller agree to the terms. Buyer funds the escrow account, and both parties commit.",
    icon: <FaHandshake />,
    link: "/terms",
  },
  {
    title: "2. Buyer Pays",
    description:
      "The Buyer deposits payment via PayFast, where it’s held securely by the escrow service.",
    icon: <FaCreditCard />,
    link: "/payment-info",
  },
  {
    title: "3. Seller Delivers",
    description:
      "When payment is confirmed, Seller delivers goods or services as per the deal.",
    icon: <FaTruck />,
    link: "/delivery-info",
  },
  {
    title: "4. Buyer Inspects",
    description:
      "Buyer inspects the product to ensure it meets the agreed terms.",
    icon: <FaSearch />,
    link: "/inspection",
  },
  {
    title: "5. Funds Released",
    description:
      "Once approved, funds are released from escrow to the Seller’s account.",
    icon: <FaMoneyBillWave />,
    link: "/release-info",
  },
              ].map(({ icon, title, description, link }, idx) => (
                <div key={title} className="bg-[#1a2235] border border-[#232c40] rounded-2xl p-8 hover:border-[#706cff] transition-colors relative">
                  <span className="text-5xl font-bold text-primary/10 absolute top-4 right-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {idx + 1}
                  </span>
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#232c40] mb-4 border border-[#706cff]">
                    <span className="text-[#706cff]">{icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
                  <p className="text-sm text-[#c0c0c0] leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div><br /><br />
      </section>

      {/* CTA */}
      <section className="w-full bg-[#0f1a2b] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[#f5b800]">
              Ready to make your next deal safer?
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto text-[#c0c0c0]">
              Create your first escrow transaction in minutes. No complexity, no fine print.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="text-base px-8 h-12 bg-[#f5b800] hover:bg-[#f5b800]/90 text-black">
                <Link to="/auth">
                  Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8 h-12 bg-white text-black">
                <Link to="/about">
                  Read the full guide
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-[#0f1a2b]">
        <div className="container mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} EscrowShield. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/auth" className="hover:text-white transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
