import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function AdminKYCPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("kyc_status", "pending").order("created_at", { ascending: true });
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (profileId: string, action: "approved" | "rejected") => {
    await supabase.from("profiles").update({ kyc_status: action }).eq("id", profileId);
    await supabase.from("notifications").insert({ user_id: profileId, message: `Your KYC verification was ${action}.` });
    toast.success(`User ${action}`);
    fetchPending();
  };

  if (loading) return <AppLayout><div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold mb-6">KYC Queue</h2>
        {profiles.length === 0 ? (
          <EmptyState icon={Shield} message="No pending KYC submissions" />
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                    <TableCell>{p.phone || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{p.id_number || "—"}</TableCell>
                    <TableCell className="capitalize">{p.role || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAction(p.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(p.id, "rejected")}>Reject</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
