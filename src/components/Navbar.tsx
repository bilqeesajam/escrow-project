import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Shield, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { THEME } from "@/lib/theme";

interface NavbarProps {
  showLandingNav?: boolean;
}

export default function Navbar({ showLandingNav = false }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className={`sticky top-0 z-50 border-b`} style={{ 
      backgroundColor: THEME.primary.darkNavy, 
      borderColor: THEME.primary.cardBlue 
    }}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent border" style={{ borderColor: THEME.primary.gold }}>
            <Shield className="h-5 w-5" style={{ color: THEME.primary.gold }} />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">GigHold</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: THEME.text.primary }}>
          {showLandingNav ? (
            <>
              <Link to="/" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:transition-[width] before:duration-300 hover:before:w-full" style={{ '--tw-before-bg-color': THEME.primary.gold } as any}>
                How it works
              </Link>
              <a href="#features" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:transition-[width] before:duration-300 hover:before:w-full" style={{ '--tw-before-bg-color': THEME.primary.gold } as any}>
                Features
              </a>
              <a href="#faq" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:transition-[width] before:duration-300 hover:before:w-full" style={{ '--tw-before-bg-color': THEME.primary.gold } as any}>
                FAQ
              </a>
            </>
          ) : (
            <>
              <Link to="/" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:transition-[width] before:duration-300 hover:before:w-full" style={{ '--tw-before-bg-color': THEME.primary.gold } as any}>
                Home
              </Link>
              <a href="/#how-it-works" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:transition-[width] before:duration-300 hover:before:w-full" style={{ '--tw-before-bg-color': THEME.primary.gold } as any}>
                How it works
              </a>
              <a href="/#features" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:transition-[width] before:duration-300 hover:before:w-full" style={{ '--tw-before-bg-color': THEME.primary.gold } as any}>
                Features
              </a>
              <a href="/#faq" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:transition-[width] before:duration-300 hover:before:w-full" style={{ '--tw-before-bg-color': THEME.primary.gold } as any}>
                FAQ
              </a>
            </>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hover:text-white" style={{ color: THEME.text.primary }}>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" style={{ backgroundColor: THEME.primary.gold, color: THEME.primary.darkNavy }}>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
