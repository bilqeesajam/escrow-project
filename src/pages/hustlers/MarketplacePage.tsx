import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { GigCard } from "@/components/GigCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Loader2, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Gig = Tables<"gigs">;
const categories = ["all", "errand", "pickup", "delivery", "shopping", "other"];

export default function MarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("gigs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setGigs(data || []); setLoading(false); });
  }, []);

  const handleAccept = async (gig: Gig) => {
    if (!user) return;
    await supabase.from("gigs").update({ hustler_id: user.id, status: "accepted" as any }).eq("id", gig.id);
    await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Your gig "${gig.title}" was accepted.`, gig_id: gig.id });
    toast.success("Gig accepted!");
    setGigs((prev) => prev.filter((g) => g.id !== gig.id));
  };

  const filtered = gigs
    .filter((g) => category === "all" || g.category === category)
    .filter((g) => !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.location.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <AppLayout><div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold mb-6">Marketplace</h2>
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search gigs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c === "all" ? "All Categories" : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={ShoppingBag} message="No open gigs right now. Check back later!" />
        ) : (
          <div className="space-y-4">
            {filtered.map((gig) => (
              <GigCard key={gig.id} gig={gig} actionLabel="Accept" onAction={() => handleAccept(gig)} onClick={() => navigate(`/gig/${gig.id}`)} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
