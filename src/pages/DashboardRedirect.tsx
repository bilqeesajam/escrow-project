import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";

export default function DashboardRedirect() {
  const { profile } = useAuth();
  if (profile?.role === "admin") return <Navigate to="/admin" replace />;
  if (profile?.role === "hustler") return <Navigate to="/marketplace" replace />;
  return <Navigate to="/my-gigs" replace />;
}
