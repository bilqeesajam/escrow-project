import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { GigCard } from "@/components/GigCard";
import { EmptyState } from "@/components/EmptyState";
import { Briefcase, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Gig = Tables<"gigs">;

export default function MyJobsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("gigs")
      .select("*")
      .eq("hustler_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setGigs(data || []); setLoading(false); });
  }, [user]);

  if (loading) return <AppLayout><div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold mb-6">My Jobs</h2>
        {gigs.length === 0 ? (
          <EmptyState icon={Briefcase} message="No jobs yet. Browse the marketplace to find gigs!" cta="Browse Marketplace" onAction={() => navigate("/marketplace")} />
        ) : (
          <div className="space-y-4">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} onClick={() => navigate(`/gig/${gig.id}`)} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
