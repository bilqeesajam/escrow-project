import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Loader2, User, Search, X, Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Gig = Tables<"gigs">;

// --- Internal GigCard Component ---
const ExactGigCard = ({ gig, onClick }: { gig: Gig; onClick: () => void }) => {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: "Action Triggered",
      description: `"${action}" clicked.`,
    });
  };

  const getStatusDisplay = () => {
    switch (gig.status) {
      case "open":
        return <p className="text-sm text-primary font-semibold">Status: Pending Placement</p>;
      case "accepted":
        return (
          <p className="text-sm text-foreground">
            Status:{" "}
            <span className="text-primary font-semibold">Funds Secured</span>{" "}
            <span className="text-muted-foreground font-normal">(Awaiting Delivery)</span>
          </p>
        );
      case "disputed":
        return (
          <p className="text-sm text-foreground">
            Status: <span className="text-primary font-semibold">Dispute in Progress</span>
          </p>
        );
      case "completed":
        return (
          <p className="text-sm text-foreground">
            Status:{" "}
            <span className="text-primary font-semibold">Delivered</span>{" "}
            <span className="text-muted-foreground font-normal">(Under Review)</span>
          </p>
        );
      default:
        return <p className="text-sm text-muted-foreground uppercase tracking-tight">Status: {gig.status}</p>;
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border transition-colors">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-bold text-card-foreground tracking-tight">{gig.title}</h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">#{gig.id.slice(0, 6)}</span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-xl font-bold text-card-foreground">R{gig.budget}</div>
          <div className="text-[11px] text-muted-foreground">
            Funded on: {new Date(gig.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="text-sm text-foreground">
          Seller: <span className="font-medium text-card-foreground">LC Studio</span>
        </div>
        {getStatusDisplay()}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onClick}
          className="border-border bg-transparent text-foreground hover:bg-muted"
        >
          View Details
        </Button>
        <Button
          onClick={() => handleAction(gig.status === "disputed" ? "Dispute Resolution" : "Message Seller")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
        >
          {gig.status === "disputed" ? "Dispute Resolution" : "Message Seller"}
        </Button>
      </div>
    </div>
  );
};

export default function MyGigsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("gigs")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setGigs(data || []);
        setLoading(false);
      });
  }, [user]);

  const filteredGigs = gigs.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sections = [
    { key: "all",       label: "All",       items: filteredGigs },
    { key: "pending",   label: "Pending",   items: filteredGigs.filter((g) => g.status === "open") },
    { key: "active",    label: "Active",    items: filteredGigs.filter((g) => ["accepted", "in_progress"].includes(g.status)) },
    { key: "completed", label: "Completed", items: filteredGigs.filter((g) => g.status === "completed") },
    { key: "disputed",  label: "Disputed",  items: filteredGigs.filter((g) => g.status === "disputed") },
  ];

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">

        {/* HEADER */}
        <div className="w-full px-6 pt-10 pb-6 text-center">
          <h2 className="text-4xl font-extrabold text-foreground mb-2">My Transactions</h2>
          <p className="text-muted-foreground mb-8">Manage and track your active and past gigs</p>
        </div>

        <div className="w-full px-6">
          <Tabs defaultValue="all" className="w-full">

            {/* TOOLBAR: Tabs + Search + Post Gig */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-muted/40 p-2 rounded-2xl border border-border backdrop-blur-sm">

              {/* TABS */}
              <TabsList className="bg-transparent gap-1 h-auto p-0 border-none flex flex-wrap">
                {sections.map((s) => (
                  <TabsTrigger
                    key={s.key}
                    value={s.key}
                    className="rounded-xl px-5 py-2 text-muted-foreground font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                  >
                    {s.label}{" "}
                    <span className="ml-1 opacity-50 text-xs">({s.items.length})</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* SEARCH & ADD */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border text-foreground pl-9 pr-8 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Button
                  onClick={() => navigate("/post-gig")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-4"
                >
                  <Plus className="h-5 w-5 mr-1" />
                  Post Gig
                </Button>
              </div>
            </div>

            {/* TAB CONTENT */}
            {sections.map((s) => (
              <TabsContent
                key={s.key}
                value={s.key}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {s.items.length === 0 ? (
                  <div className="col-span-full py-24 text-center">
                    <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Briefcase className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Transactions Found</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                      {searchQuery
                        ? `We couldn't find any results for "${searchQuery}"`
                        : `You don't have any gigs in the ${s.label} category yet.`}
                    </p>
                    <Button
                      onClick={() => navigate("/post-gig")}
                      variant="outline"
                      className="border-border"
                    >
                      Create your first gig
                    </Button>
                  </div>
                ) : (
                  s.items.map((gig) => (
                    <ExactGigCard
                      key={gig.id}
                      gig={gig}
                      onClick={() => navigate(`/gig/${gig.id}`)}
                    />
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}