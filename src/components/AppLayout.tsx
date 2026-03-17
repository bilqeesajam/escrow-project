import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../lib/auth-context";

function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [display, setDisplay] = useState<ReactNode>(children);
  const [phase, setPhase] = useState<"idle" | "exit" | "sweep" | "enter">("idle");
  const prevPath = useRef(location.pathname);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname === prevPath.current) {
      if (display !== children) {
        setDisplay(children);
      }
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
   
    prevPath.current = location.pathname;
    setPhase("exit");

    timers[0] = setTimeout(() => {
      if (isMounted.current) {
        setDisplay(children);
        setPhase("sweep");
      }
    }, 110);

    timers[1] = setTimeout(() => {
      if (isMounted.current) {
        setPhase("enter");
      }
    }, 430);

    timers[2] = setTimeout(() => {
      if (isMounted.current) {
        setPhase("idle");
      }
    }, 590);

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, children]);

  return (
    <div className="relative h-full">
      {/* Ticker sweep line */}
      <div
        aria-hidden
        className="absolute top-0 left-0 h-[2px] rounded-full pointer-events-none z-20"
        style={{
          background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 40%, hsl(var(--primary)/0.4) 80%, transparent 100%)",
          width: phase === "sweep" ? "100%" : "0%",
          opacity: phase === "sweep" ? 1 : 0,
          transition: phase === "sweep"
            ? "width 320ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 60ms ease"
            : "opacity 150ms ease, width 0ms 150ms",
        }}
      />
     
      {/* Content */}
      <div
        style={{
          opacity: phase === "exit" ? 0 : 1,
          transform: phase === "exit" ? "translateY(6px)" : "translateY(0)",
          transition: phase === "exit"
            ? "opacity 100ms ease, transform 100ms ease"
            : "opacity 180ms ease 60ms, transform 180ms ease 60ms",
        }}
      >
        {display}
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth(); // Changed from isLoading to loading

  // Add loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur-md px-4 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                {profile?.full_name || "Welcome"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 h-full">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
