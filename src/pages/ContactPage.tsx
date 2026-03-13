import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useState } from "react";
import { toast } from "sonner";
import { THEME } from "@/lib/theme";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Message sent successfully!");
      setFormData({ name: "", phone: "", email: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const navLinkStyle = "relative hover:text-primary transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full";

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
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Get in Touch with Our Team</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Our support specialists are available 24/7 to ensure your deal runs smoothly.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-primary mb-6">Lets Chat</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Name" name="name" value={formData.name} onChange={handleInputChange} required className="bg-background border-border focus:border-primary h-11" />
                <Input placeholder="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required className="bg-background border-border focus:border-primary h-11" />
                <Input placeholder="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} required className="bg-background border-border focus:border-primary h-11" />
                <textarea placeholder="Enter your message ..." name="message" value={formData.message} onChange={handleInputChange} required rows={5} className="w-full bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none rounded-lg px-4 py-3 resize-none transition-colors" />
                <Button type="submit" disabled={loading} className="w-full md:w-auto px-8 h-11 font-semibold">{loading ? "Sending..." : "Submit"}</Button>
              </form>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary mb-6">Our Contact Details</h3>
              <div className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-sm uppercase tracking-wide mb-1">Phone</p>
                    <a href="tel:+27777777" className="text-foreground text-lg font-semibold hover:text-primary transition-colors">+27 777 7777</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-sm uppercase tracking-wide mb-1">Email</p>
                    <a href="mailto:support@gighold.com" className="text-foreground text-lg font-semibold hover:text-primary transition-colors">support@gighold.com</a>
                  </div>
                </div>
              </div>
              <div className="bg-accent/50 border border-border rounded-2xl p-6">
                <h4 className="text-primary font-semibold mb-3">Response Time</h4>
                <p className="text-muted-foreground">We aim to respond to all inquiries within 24 hours. For urgent matters, call us directly at the number above.</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-primary">Support Hours</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div><p className="text-muted-foreground mb-2">Chat Support</p><p className="text-foreground font-semibold">24/7 Available</p></div>
              <div><p className="text-muted-foreground mb-2">Phone Support</p><p className="text-foreground font-semibold">9 AM - 6 PM (GMT+2)</p></div>
              <div><p className="text-muted-foreground mb-2">Email Support</p><p className="text-foreground font-semibold">Within 24 Hours</p></div>
            </div>
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