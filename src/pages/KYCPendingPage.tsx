import { Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

export default function KYCPendingPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center animate-fade-in">
        <CardHeader>
          <div className="mx-auto rounded-full bg-warning/10 p-4 mb-2">
            {profile?.kyc_status === "rejected" ? (
              <Shield className="h-10 w-10 text-destructive" />
            ) : (
              <Clock className="h-10 w-10 text-warning" />
            )}
          </div>
          <CardTitle className="text-xl">
            {profile?.kyc_status === "rejected" ? "Verification Rejected" : "Verification Pending"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusBadge status={profile?.kyc_status || "pending"} />
          <p className="text-muted-foreground text-sm">
            {profile?.kyc_status === "rejected"
              ? "Your identity verification was rejected. Please contact support."
              : "Your identity verification is being reviewed. You'll be notified once approved."}
          </p>
          <Button variant="outline" onClick={handleSignOut} className="mt-4">Sign Out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
