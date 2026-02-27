import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors ${isLanding ? "bg-navy/95 backdrop-blur-md" : "bg-card border-b border-border"}`}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className={`font-display font-bold text-lg ${isLanding ? "text-primary-foreground" : "text-foreground"}`}>
            EscrowSA
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {isLanding ? (
            <>
              <a href="#how-it-works" className="px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                How It Works
              </a>
              <a href="#features" className="px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Features
              </a>
              <div className="ml-3 flex gap-2">
                <Button variant="nav" size="sm" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/transactions/new">New Transaction</Link>
              </Button>
              <div className="ml-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/">Log Out</Link>
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className={`w-5 h-5 ${isLanding ? "text-primary-foreground" : "text-foreground"}`} />
          ) : (
            <Menu className={`w-5 h-5 ${isLanding ? "text-primary-foreground" : "text-foreground"}`} />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`md:hidden overflow-hidden ${isLanding ? "bg-navy" : "bg-card"} border-t border-border/20`}
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {isLanding ? (
                <>
                  <a href="#how-it-works" className="py-2 text-primary-foreground/70" onClick={() => setMobileOpen(false)}>How It Works</a>
                  <a href="#features" className="py-2 text-primary-foreground/70" onClick={() => setMobileOpen(false)}>Features</a>
                  <Link to="/login" className="py-2 text-primary-foreground" onClick={() => setMobileOpen(false)}>Log In</Link>
                  <Button variant="hero" size="sm" asChild>
                    <Link to="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="py-2 text-foreground" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link to="/transactions/new" className="py-2 text-foreground" onClick={() => setMobileOpen(false)}>New Transaction</Link>
                  <Link to="/" className="py-2 text-muted-foreground" onClick={() => setMobileOpen(false)}>Log Out</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
