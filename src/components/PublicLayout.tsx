import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Shield, Moon, Sun, ArrowRight } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/theme-context";
import { NavAvatar } from "../components/NavAvatar";
import { ReactNode } from "react";

export const navLinkClass =
  "relative hover:text-primary transition-colors before:absolute before:bottom-[-4px] before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Floating pill navbar ──────────────────────────────────────── */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <nav className="
          group pointer-events-auto
          flex items-center justify-between
          bg-background/90 backdrop-blur-xl
          border border-border rounded-2xl shadow-lg
          px-4 h-12
          transition-all duration-500 ease-in-out
          w-[62%] hover:w-[88%] overflow-hidden
        ">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/25">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              Gig<span className="text-primary">Hold</span>
            </span>
          </Link>

          <div className="
            hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground
            opacity-0 group-hover:opacity-100
            translate-x-4 group-hover:translate-x-0
            transition-all duration-400 ease-in-out
            pointer-events-none group-hover:pointer-events-auto whitespace-nowrap
          ">
            <Link to="/#how-it-works" className={`${navLinkClass} text-xs`}>How it works</Link>
            <Link to="/#features"     className={`${navLinkClass} text-xs`}>Features</Link>
            <Link to="/#faq"          className={`${navLinkClass} text-xs`}>FAQ</Link>
            <Link to="/pricing"       className={`${navLinkClass} text-xs`}>Pricing</Link>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={toggleTheme} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-muted-foreground" /> : <Moon className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>

            {user ? (
              <>
                <Button asChild size="sm" className="h-7 text-xs rounded-lg px-3 hidden sm:inline-flex">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <NavAvatar />
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

      <main className="pt-24">{children}</main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card/60 mt-20">
        <div className="container mx-auto px-6 py-14">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-foreground text-sm">Gig<span className="text-primary">Hold</span></span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">Secure escrow infrastructure for every gig transaction in South Africa.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Product</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <Link to="/#features"     className="hover:text-foreground transition-colors">Features</Link>
                <Link to="/#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
                <Link to="/#faq"          className="hover:text-foreground transition-colors">FAQ</Link>
                <Link to="/pricing"       className="hover:text-foreground transition-colors">Pricing</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Company</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <Link to="/contact" onClick={() => window.scrollTo(0,0)} className="hover:text-foreground transition-colors">Contact Us</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Legal</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <Link to="/terms"   onClick={() => window.scrollTo(0,0)} className="hover:text-foreground transition-colors">Terms of Service</Link>
                <Link to="/privacy" onClick={() => window.scrollTo(0,0)} className="hover:text-foreground transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} GigHold. All rights reserved.</span>
            <Button asChild size="sm" variant="ghost" className="text-xs rounded-lg">
              <Link to="/signup">Get started free <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}