import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Dispute = Tables<"disputes">;
type Gig = Tables<"gigs">;

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<(Dispute & { gig?: Gig })[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolution, setResolution] = useState<"resolved_client" | "resolved_hustler">("resolved_client");
  const [notes, setNotes] = useState("");

  const fetchDisputes = async () => {
    const { data } = await supabase.from("disputes").select("*").order("created_at", { ascending: false });
    if (data) {
      const withGigs = await Promise.all(data.map(async (d) => {
        const { data: gig } = await supabase.from("gigs").select("*").eq("id", d.gig_id).single();
        return { ...d, gig: gig || undefined };
      }));
      setDisputes(withGigs);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDisputes(); }, []);

  const handleResolve = async (dispute: Dispute & { gig?: Gig }) => {
    if (!dispute.gig) return;
    setResolving(dispute.id);
    const gig = dispute.gig as any;
    const pricingSubtotal = gig.pricing_subtotal ?? gig.budget;
    const pricingTotal = gig.pricing_total ?? gig.budget;
    const pricingFee = gig.pricing_fee ?? 0;

    // Update dispute
    await supabase.from("disputes").update({
      status: resolution,
      admin_notes: notes || null,
      resolved_at: new Date().toISOString(),
    }).eq("id", dispute.id);

    // Handle funds
    if (resolution === "resolved_client") {
      // Refund to client
      const { data: cp } = await supabase.from("profiles").select("balance").eq("id", gig.client_id).single();
      await supabase.from("profiles").update({ balance: (cp?.balance || 0) + pricingTotal }).eq("id", gig.client_id);
      await supabase.from("transactions").insert({
        gig_id: gig.id,
        to_user_id: gig.client_id,
        amount: pricingTotal,
        subtotal_amount: pricingSubtotal,
        fee_amount: pricingFee,
        total_amount: pricingTotal,
        type: "refund" as const,
      });
      await supabase.from("gigs").update({ status: "cancelled" as any }).eq("id", gig.id);
      await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Dispute on "${gig.title}" resolved in your favor. Funds refunded.`, gig_id: gig.id });
      if (gig.hustler_id) await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `Dispute on "${gig.title}" resolved. Funds returned to client.`, gig_id: gig.id });
    } else {
      // Release to hustler
      if (gig.hustler_id) {
        const { data: hp } = await supabase.from("profiles").select("balance").eq("id", gig.hustler_id).single();
        await supabase.from("profiles").update({ balance: (hp?.balance || 0) + pricingSubtotal }).eq("id", gig.hustler_id);
        await supabase.from("transactions").insert({
          gig_id: gig.id,
          to_user_id: gig.hustler_id,
          from_user_id: gig.client_id,
          amount: pricingSubtotal,
          subtotal_amount: pricingSubtotal,
          fee_amount: pricingFee,
          total_amount: pricingTotal,
          type: "release" as const,
        });
        await supabase.from("gigs").update({ status: "completed" as any }).eq("id", gig.id);
        await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `Dispute on "${gig.title}" resolved in your favor. Funds released.`, gig_id: gig.id });
        await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Dispute on "${gig.title}" resolved. Funds released to hustler.`, gig_id: gig.id });
      }
    }

    toast.success("Dispute resolved");
    setResolving(null);
    setNotes("");
    fetchDisputes();
  };

  if (loading) return <AppLayout><div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold mb-6">Disputes</h2>
        {disputes.length === 0 ? (
          <EmptyState icon={AlertTriangle} message="No disputes" />
        ) : (
          <div className="space-y-4">
            {disputes.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{d.gig?.title || "Unknown Gig"}</CardTitle>
                    <StatusBadge status={d.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{d.reason}</p>
                  {d.gig && <p className="text-xs text-muted-foreground">Budget: <span className="font-mono font-semibold">R{d.gig.budget.toFixed(2)}</span></p>}
                  {d.admin_notes && <p className="text-xs bg-muted p-2 rounded">Admin: {d.admin_notes}</p>}
                  {(d.status === "open" || d.status === "under_review") && (
                    <div className="space-y-3 pt-2 border-t">
                      <Select value={resolution} onValueChange={(v: any) => setResolution(v)}>
                        <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resolved_client">Client Wins (Refund)</SelectItem>
                          <SelectItem value="resolved_hustler">Hustler Wins (Release)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea placeholder="Admin notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
                      <Button onClick={() => handleResolve(d)} disabled={resolving === d.id}>
                        {resolving === d.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        Resolve Dispute
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
