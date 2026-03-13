import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { backendRequest } from "@/lib/backend";

type Override = {
  id: string;
  gig_id: string | null;
  client_id: string;
  category: string;
  requested_budget: string;
  suggested_budget: string;
  adjustment_pct: string;
  reason: string | null;
  status: string;
  created_at: string;
};

export default function AdminPricingOverridesPage() {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  const fetchOverrides = async () => {
    setLoading(true);
    try {
      const data = await backendRequest<{ data: Override[] }>("/api/pricing/overrides/", { method: "GET" });
      setOverrides(data.data ?? []);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to load overrides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverrides();
  }, []);

  const handleAction = async (overrideId: string, action: "approve" | "reject") => {
    setActing(overrideId);
    try {
      await backendRequest("/api/pricing/overrides/decision/", {
        body: {
          override_id: overrideId,
          action,
          admin_note: note[overrideId] ?? "",
        },
      });
      toast.success(`Override ${action}d`);
      await fetchOverrides();
    } catch (error: any) {
      toast.error(error?.message ?? "Action failed");
    } finally {
      setActing(null);
    }
  };

  if (loading) return <AppLayout><div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold">Pricing Overrides</h2>
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending overrides.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Requested (R)</TableHead>
                    <TableHead>Suggested (R)</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Admin Note</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overrides.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="capitalize">{item.category}</TableCell>
                      <TableCell>{item.requested_budget}</TableCell>
                      <TableCell>{item.suggested_budget}</TableCell>
                      <TableCell>{item.reason || "-"}</TableCell>
                      <TableCell>
                        <Input value={note[item.id] ?? ""} onChange={(e) => setNote((prev) => ({ ...prev, [item.id]: e.target.value }))} />
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" onClick={() => handleAction(item.id, "approve")} disabled={acting === item.id}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(item.id, "reject")} disabled={acting === item.id}>Reject</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}