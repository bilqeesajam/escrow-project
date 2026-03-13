import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Gig = Tables<"gigs">;

const statuses = ["all", "open", "accepted", "in_progress", "pending_confirmation", "completed", "disputed", "cancelled"];

export default function AdminGigsPage() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    supabase.from("gigs").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setGigs(data || []); setLoading(false); });
  }, []);

  const filtered = gigs
    .filter((g) => statusFilter === "all" || g.status === statusFilter)
    .filter((g) => !search || g.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <AppLayout><div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold mb-6">All Gigs</h2>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All Statuses" : s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => (
                <TableRow key={g.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/gig/${g.id}`)}>
                  <TableCell className="font-medium">{g.title}</TableCell>
                  <TableCell className="font-mono">R{g.budget.toFixed(2)}</TableCell>
                  <TableCell><StatusBadge status={g.status} /></TableCell>
                  <TableCell className="capitalize">{g.category}</TableCell>
                  <TableCell>{g.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
