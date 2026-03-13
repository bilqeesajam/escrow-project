import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireKyc?: boolean;
  requireRole?: "admin" | "client" | "hustler";
}

export function ProtectedRoute({ children, requireKyc = true, requireRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // No profile yet — need to choose role
  if (!profile?.role) return <Navigate to="/choose-role" replace />;

  // KYC not submitted yet
  if (requireKyc && !profile.kyc_status) return <Navigate to="/kyc" replace />;

  // KYC pending/rejected
  if (requireKyc && profile.kyc_status !== "approved" && profile.role !== "admin") {
    return <Navigate to="/kyc-pending" replace />;
  }

  // Role gate
  if (requireRole && profile.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
