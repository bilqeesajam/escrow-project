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

export default function PrivacyPolicyPage() {
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

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto space-y-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">Last updated: March 4, 2026</p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold text-primary mb-6">1. Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We collect the following types of information:</p>
                <ul className="list-disc list-inside space-y-2 marker:text-primary">
                  <li>Personal identification information (name, email, phone number)</li>
                  <li>Financial information (bank account and payment card details)</li>
                  <li>Identity verification documents (ID, proof of address)</li>
                  <li>Transaction history and dispute resolution records</li>
                  <li>Device information and usage analytics</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-6">2. How We Use Your Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We use the information we collect for the following purposes:</p>
                <ul className="list-disc list-inside space-y-2 marker:text-primary">
                  <li>To process and manage transactions and escrow payments</li>
                  <li>To verify user identity and prevent fraud</li>
                  <li>To provide customer support and resolve disputes</li>
                  <li>To comply with legal and regulatory requirements</li>
                  <li>To improve our services and user experience</li>
                  <li>To send important notifications about your account</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-6">3. Data Security</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>We implement comprehensive security measures to protect your personal data:</p>
                <ul className="list-disc list-inside space-y-2 marker:text-primary">
                  <li>256-bit SSL/TLS encryption for all data in transit</li>
                  <li>Encrypted storage for data at rest</li>
                  <li>Two-factor authentication (2FA) for account access</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Limited employee access to sensitive data</li>
                  <li>Secure data disposal procedures</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-6">4. Third-Party Disclosure</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We do not sell, trade, or rent your personal information to third parties. We only share information:</p>
                <ul className="list-disc list-inside space-y-2 marker:text-primary">
                  <li>With payment processors (PayFast) to complete transactions</li>
                  <li>With legal authorities when required by law</li>
                  <li>With dispute resolution specialists when needed</li>
                  <li>With service providers who assist in our operations (all under confidentiality agreements)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-6">5. Data Retention</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>We retain user data in accordance with legal requirements:</p>
                <ul className="list-disc list-inside space-y-2 marker:text-primary">
                  <li>Transaction records and evidence: 7 years (regulatory requirement)</li>
                  <li>Account information: For the duration of your account plus 2 years</li>
                  <li>Communication logs: 2 years</li>
                  <li>Marketing data: Until you opt-out</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-6">6. Your Rights</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>You have the right to access your personal data, request corrections, or request deletion of your account (subject to legal holds).</p>
                <ul className="list-disc list-inside space-y-2 marker:text-primary">
                  <li>Access your personal data</li>
                  <li>Request corrections to inaccurate information</li>
                  <li>Request deletion of your account</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Port your data to another service</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-primary mb-6">10. Contact Us</h2>
              <div className="bg-accent/30 rounded-xl p-6 text-muted-foreground space-y-2 border border-border">
                <p><span className="text-foreground font-semibold">Email:</span> privacy@gighold.com</p>
                <p><span className="text-foreground font-semibold">Phone:</span> +27 777 7777</p>
                <p><span className="text-foreground font-semibold">Address:</span> GigHold Support, South Africa</p>
              </div>
            </section>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">Last Updated: March 4, 2026 | Current Version: v2.4.0</p>
          </div>
        </div>
      </main>

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