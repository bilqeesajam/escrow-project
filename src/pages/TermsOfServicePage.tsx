import { THEME } from "@/lib/theme";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Shield,
  ArrowRight,
  Lock,
  Zap,
  CheckCircle,
  MapPin,
  Handshake,
  Truck,
  Mail,
  Phone,
  Search,
  Banknote,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

export default function TermsOfServicePage() {
  const navLinkStyle = "relative hover:text-primary transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full";

  const navLinkClass =
    "relative hover:text-primary transition-colors before:absolute before:bottom-[-4px] before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full";
  
    const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const ThemeToggle = () => (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );

  const UserMenu = () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signOut} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              Gig<span className="text-primary">Hold</span>
            </span>
          </Link>
 
          {/* Desktop Nav — links to index.tsx sections via /#id */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link to="/#how-it-works" className={navLinkClass}>
              How it works
            </Link>
            <Link to="/#features" className={navLinkClass}>
              Features
            </Link>
            <Link to="/#faq" className={navLinkClass}>
              FAQ
            </Link>
          </nav>
 
          {/* Auth & Theme */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-3xl mx-auto space-y-12">
 
          {/* Page Header */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">Legal & Compliance</h1>
            <p className="text-muted-foreground text-lg">Last updated: March 4, 2026</p>
          </div>
 
          <div className="space-y-8">
 
            {/* Terms of Service */}
            <div>
              <h2 className="text-3xl font-bold text-primary mb-6">Terms of Service</h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Neutral Third Party",
                    body: '"GigHold" acts as a neutral intermediary. Funds are secured via escrow and only released upon fulfillment of agreed contract terms. Both parties must adhere to the specified terms and conditions of their agreement.',
                  },
                  {
                    title: "Transaction Finality",
                    body: 'Once the Buyer selects "Release Funds," the transaction is considered complete and irreversible. This ensures finality and prevents disputes regarding payment after completion.',
                  },
                  {
                    title: "Dispute Mediation",
                    body: 'In the event of a disagreement, "GigHold" will review uploaded evidence to provide an impartial resolution or refund. Our resolution team operates with strict neutrality to ensure fairness.',
                  },
                  {
                    title: "User Accountability",
                    body: "Users must maintain verified profiles and utilize 2FA to ensure account security. Account holders are responsible for all activities conducted under their credentials.",
                  },
                ].map(({ title, body }) => (
                  <div key={title}>
                    <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Privacy Policy */}
            <div>
              <h2 className="text-3xl font-bold text-primary mb-6">Privacy Policy</h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Data Collection",
                    body: "We collect essential financial and identity verification data to comply with global standards for financial security and anti-money laundering regulations. Only the minimum required information is collected.",
                  },
                  {
                    title: "Encryption",
                    body: "All personal and financial data is protected with industry-leading SSL/TLS encryption. Data in transit and at rest is secured using modern cryptography standards.",
                  },
                  {
                    title: "Third-Party Sharing",
                    body: "Financial transactions are processed through PayFast. We do not sell your personal data to third parties. Any sharing is limited to payment processors and compliance authorities as required by law.",
                  },
                  {
                    title: "Cookie Policy",
                    body: "We use tracking (Google Analytics/Plausible) to improve user experience and perform A/B testing on our service flow. You may opt-out through your browser settings.",
                  },
                ].map(({ title, body }) => (
                  <div key={title}>
                    <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Data Retention */}
            <div>
              <h2 className="text-3xl font-bold text-primary mb-6">Data Retention & Compliance</h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Seven-Year Policy",
                    body: "In accordance with financial regulations, all transaction records and evidence are retained for a period of 7 years. This ensures compliance with tax and regulatory authorities.",
                  },
                  {
                    title: "Unmodifiable Records",
                    body: "Historical transaction data cannot be modified or deleted once a deal is finalized. This ensures transparency and prevents tampering with evidence.",
                  },
                  {
                    title: "Audit Trails",
                    body: "Every report generated includes an encrypted audit trail for tax and accounting purposes. This provides complete transaction history and accountability.",
                  },
                ].map(({ title, body }) => (
                  <div key={title}>
                    <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
 
          {/* Footer Note */}
          <div className="bg-card border border-border rounded-xl p-6 text-center shadow-sm">
            <p className="text-muted-foreground text-sm">
              Last Updated: March 4, 2026 | Current Version: v2.4.0
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-foreground">
                  Gig<span className="text-primary">Hold</span>
                </span>
              </Link>
              <p className="text-muted-foreground text-sm">Secure escrow for every gig transaction.</p>
            </div>
 
            {/* Product — all link to index.tsx sections via /#id */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
                <Link to="/#features" className="hover:text-primary transition-colors">Features</Link>
                <Link to="/#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
                <Link to="/#faq" className="hover:text-primary transition-colors">FAQ</Link>
                <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
              </div>
            </div>
 
            {/* Company */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
                <Link to="/contact" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
 
            {/* Legal */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
                <Link to="/terms" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <Link to="/privacy" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
 
          {/* Bottom Bar */}
          <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} GigHold. All rights reserved.</span>
            <Link to="/signup" className={navLinkClass}>
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
