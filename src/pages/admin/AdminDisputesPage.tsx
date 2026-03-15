import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, AlertTriangle, CheckCircle2, User, BadgeCheck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Dispute = Tables<"disputes">;
type Gig     = Tables<"gigs">;
type Profile = Tables<"profiles">;

type DisputeRow = Dispute & { gig: Gig | null; raiser: Profile | null };

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

// Per-card state so multiple disputes can have different resolution selections
interface CardState { resolution: "resolved_client" | "resolved_hustler"; notes: string }

export default function AdminDisputesPage() {
  const { user } = useAuth();
  const [rows, setRows]         = useState<DisputeRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [cardState, setCardState] = useState<Record<string, CardState>>({});

  const fetchDisputes = async () => {
    const { data } = await supabase
      .from("disputes")
      .select("*")
      .in("status", ["open", "under_review"])
      .order("created_at", { ascending: true });

    if (!data) { setLoading(false); return; }

    const gigIds     = data.map(d => d.gig_id);
    const raiserIds  = data.map(d => d.raised_by);

    const [{ data: gigs }, { data: profiles }] = await Promise.all([
      supabase.from("gigs").select("*").in("id", gigIds),
      supabase.from("profiles").select("*").in("id", raiserIds),
    ]);

    const gigMap     = Object.fromEntries((gigs     ?? []).map(g => [g.id, g]));
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    setRows(data.map(d => ({
      ...d,
      gig:    gigMap[d.gig_id]     ?? null,
      raiser: profileMap[d.raised_by] ?? null,
    })));

    // Seed card state for new rows
    setCardState(prev => {
      const next = { ...prev };
      data.forEach(d => { if (!next[d.id]) next[d.id] = { resolution: "resolved_client", notes: "" }; });
      return next;
    });

    setLoading(false);
  };

  useEffect(() => { fetchDisputes(); }, []);

  const setState = (id: string, patch: Partial<CardState>) =>
    setCardState(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleResolve = async (row: DisputeRow) => {
    if (!row.gig || !user) return;
    const cs = cardState[row.id];
    setResolving(row.id);

    const gig            = row.gig as any;
    const pricingTotal   = Number(gig.pricing_total   ?? gig.budget);
    const pricingSubtotal = Number(gig.pricing_subtotal ?? gig.budget);
    const pricingFee     = Number(gig.pricing_fee      ?? 0);

    // Mark dispute resolved with admin reference
    await supabase.from("disputes").update({
      status:      cs.resolution,
      admin_notes: cs.notes || `Resolved by admin ${user.id}`,
      resolved_at: new Date().toISOString(),
    }).eq("id", row.id);

    if (cs.resolution === "resolved_client") {
      const { data: cp } = await supabase.from("profiles").select("balance").eq("id", gig.client_id).single();
      await supabase.from("profiles").update({ balance: (cp?.balance ?? 0) + pricingTotal }).eq("id", gig.client_id);
      await supabase.from("transactions").insert({
        gig_id: gig.id, to_user_id: gig.client_id,
        amount: pricingTotal, subtotal_amount: pricingSubtotal,
        fee_amount: pricingFee, total_amount: pricingTotal, type: "refund" as const,
        note: `Dispute resolved: client refunded by admin`,
      });
      await supabase.from("gigs").update({ status: "cancelled" as any }).eq("id", gig.id);
      await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Dispute on "${gig.title}" resolved in your favor. Funds refunded.`, gig_id: gig.id });
      if (gig.hustler_id) await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `Dispute on "${gig.title}" resolved. Funds returned to client.`, gig_id: gig.id });
    } else {
      if (gig.hustler_id) {
        const { data: hp } = await supabase.from("profiles").select("balance").eq("id", gig.hustler_id).single();
        await supabase.from("profiles").update({ balance: (hp?.balance ?? 0) + pricingSubtotal }).eq("id", gig.hustler_id);
        await supabase.from("transactions").insert({
          gig_id: gig.id, to_user_id: gig.hustler_id, from_user_id: gig.client_id,
          amount: pricingSubtotal, subtotal_amount: pricingSubtotal,
          fee_amount: pricingFee, total_amount: pricingTotal, type: "release" as const,
          note: `Dispute resolved: hustler paid by admin`,
        });
        await supabase.from("gigs").update({ status: "completed" as any }).eq("id", gig.id);
        await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `Dispute on "${gig.title}" resolved in your favor. Funds released.`, gig_id: gig.id });
        await supabase.from("notifications").insert({ user_id: gig.client_id,  message: `Dispute on "${gig.title}" resolved. Funds released to hustler.`,   gig_id: gig.id });
      }
    }

    toast.success("Dispute resolved.");
    setResolving(null);
    fetchDisputes();
  };

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
        <div className="pt-2 mb-6">
          <h1 className="text-3xl font-extrabold text-foreground">Open Disputes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {rows.length} dispute{rows.length !== 1 ? "s" : ""} requiring a decision
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-24">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="h-9 w-9 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">All clear!</h3>
            <p className="text-sm text-muted-foreground">No open disputes.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {rows.map(row => {
              const cs  = cardState[row.id] ?? { resolution: "resolved_client", notes: "" };
              const gig = row.gig;
              const budget = Number(gig?.pricing_total ?? gig?.budget ?? 0);

              return (
                <div key={row.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <h3 className="text-base font-bold text-foreground truncate capitalize">
                          {gig?.title ?? "Unknown Gig"}
                        </h3>
                        <span className="text-sm font-bold text-foreground">{zar(budget)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        {row.raiser && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> Raised by: {row.raiser.full_name ?? "Unknown"}
                          </span>
                        )}
                        <span>
                          {row.created_at ? formatDistanceToNow(new Date(row.created_at), { addSuffix: true }) : ""}
                        </span>
                        <span className="capitalize">{row.status.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="px-5 py-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Reason</p>
                      <p className="text-sm text-foreground leading-relaxed">{row.reason}</p>
                    </div>

                    {/* Resolution selector */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Resolution</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setState(row.id, { resolution: "resolved_client" })}
                          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors text-left
                            ${cs.resolution === "resolved_client"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-semibold">Client Wins</p>
                            <p className="text-xs opacity-70">Refund {zar(budget)}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setState(row.id, { resolution: "resolved_hustler" })}
                          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors text-left
                            ${cs.resolution === "resolved_hustler"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-semibold">Hustler Wins</p>
                            <p className="text-xs opacity-70">Release {zar(budget)}</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Admin Notes (optional)</p>
                      <Textarea
                        placeholder="Document your reasoning…"
                        value={cs.notes}
                        onChange={e => setState(row.id, { notes: e.target.value })}
                        maxLength={500}
                        className="rounded-xl resize-none text-sm"
                        rows={2}
                      />
                    </div>

                    <Button
                      onClick={() => handleResolve(row)}
                      disabled={resolving === row.id}
                      className="w-full font-semibold rounded-xl"
                    >
                      {resolving === row.id
                        ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Resolve Dispute
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}