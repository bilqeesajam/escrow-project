import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AUTH_ROUTES = new Set(["/auth", "/auth/callback"]);

export function AuthHistoryGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;

    // Keep the current authenticated page pinned in history
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      const currentPath = window.location.pathname;

      // If browser tries to go back to auth pages, force dashboard
      if (AUTH_ROUTES.has(currentPath)) {
        window.location.replace("/dashboard");
        return;
      }

      // Re-pin history and keep authenticated users inside the app
      window.history.pushState(null, "", window.location.href);

      if (currentPath !== "/dashboard") {
        navigate("/dashboard", { replace: true });
      } else {
        window.location.replace("/dashboard");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [user, loading, location.pathname, navigate]);

  useEffect(() => {
    if (loading) return;

    // Extra protection: authenticated users may never stay on auth routes
    if (user && AUTH_ROUTES.has(location.pathname)) {
      window.location.replace("/dashboard");
    }
  }, [user, loading, location.pathname]);

  return null;
}