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
import { THEME } from "@/lib/theme";

export default function PricingPage() {
  const pricingTiers = [
    { from: "R0.00", to: "R20,000.00", percentage: "1.5%" },
    { from: "R20,001.00", to: "R50,000.00", percentage: "1.25%" },
    { from: "R50,001.00", to: "R100,000.00", percentage: "1%" },
    { from: "R100,001.00", to: "R500,000.00", percentage: "0.75%" },
    { from: "R500,001.00", to: "R1,000,000.00", percentage: "0.5%" },
  ];

  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const ThemeToggle = () => (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );

  const navLinkClass =
    "relative hover:text-primary transition-colors before:absolute before:bottom-[-4px] before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full";

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
const navLinkStyle = "relative hover:text-primary transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full";
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
        <div className="max-w-5xl mx-auto space-y-12">
 
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Our Fees</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Transparent, tiered pricing that rewards higher-value transactions. No hidden fees, no surprises.
            </p>
          </div>
 
          {/* Pricing Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-muted/40 px-6 md:px-8 py-6 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground">Pricing</h2>
              <p className="text-muted-foreground mt-2">GigHold platform fee structure based on transaction value</p>
            </div>
 
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 md:px-8 py-4 text-left text-primary font-semibold bg-muted/20">FROM</th>
                    <th className="px-6 md:px-8 py-4 text-left text-primary font-semibold bg-muted/20">TO</th>
                    <th className="px-6 md:px-8 py-4 text-left text-primary font-semibold bg-muted/20">PERCENTAGE</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingTiers.map((tier, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 md:px-8 py-5 text-muted-foreground">{tier.from}</td>
                      <td className="px-6 md:px-8 py-5 text-muted-foreground">{tier.to}</td>
                      <td className="px-6 md:px-8 py-5 text-primary font-semibold">{tier.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
 
            <div className="px-6 md:px-8 py-6 bg-muted/20 border-t border-border">
              <p className="text-muted-foreground text-sm">
                <span className="font-semibold text-foreground">💡 Tip:</span> The higher your transaction value, the lower the percentage fee. This encourages larger, more confident deals.
              </p>
            </div>
          </div>
 
          {/* Pricing FAQ */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary">Pricing FAQ</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Who pays the fee?",
                  a: "The fee is charged to the service provider (hustler) upon successful completion and release of funds. Clients pay the full agreed amount upfront, and it's held in escrow.",
                },
                {
                  q: "Are there additional fees?",
                  a: "No. The platform fee shown above is the only charge. There are no hidden fees, processing fees, or surprise charges. What you see is what you pay.",
                },
                {
                  q: "How is the fee calculated?",
                  a: "The fee is calculated as a percentage of the agreed transaction amount. For example, a R50,000 transaction would be charged 1.25%, which equals R625.00.",
                },
                {
                  q: "When is the fee deducted?",
                  a: "The fee is deducted when you release the funds after confirming the work is complete. If the deal doesn't complete, no fee is charged.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{q}</h3>
                  <p className="text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </div>
 
          {/* CTA */}
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center space-y-6 shadow-sm">
            <h2 className="text-3xl font-bold text-primary">Ready to start earning with transparent fees?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join GigHold today and experience a platform where fees are fair, transparent, and rewarding for all parties.
            </p>
            <Button asChild size="lg" className="px-8 h-12 font-semibold">
              <Link to="/signup">Get Started Now</Link>
            </Button>
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
