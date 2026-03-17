import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
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

  // Not authenticated
  if (!user) return <Navigate to="/login" replace />;
 
  // Authenticated but profile row doesn't exist yet (new signup edge case)
  // if (!profile) return <Navigate to="/choose-role" replace />;
 
  // KYC not yet submitted (no kyc_status row value at all — shouldn't normally
  // happen given the DB default of 'pending', but guard anyway)
  if (requireKyc && !profile.kyc_status) return <Navigate to="/kyc" replace />;
 
  // KYC pending or rejected — non-admin users must wait/retry
  if (requireKyc && profile.kyc_status !== "approved" && profile.role !== "admin") {
    return <Navigate to="/kyc-pending" replace />;
  }
 
  // Role gate
  if (requireRole && profile.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
