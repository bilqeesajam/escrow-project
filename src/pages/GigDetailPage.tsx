import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../lib/auth-context";
import { AppLayout } from "../components/AppLayout";
import { PINInput } from "../components/PINInput";
import { ConfirmModal } from "../components/ConfirmModal";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2, MapPin, Clock, AlertTriangle,
  FileDown, Mail,
} from "lucide-react";
import type { Tables } from "../integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { Timeline, TimelineEvent } from "../components/Timeline";
import { generateReceipt } from "../lib/generateReceipt";

// ─── Types ────────────────────────────────────────────────────────────────────

type Gig     = Tables<"gigs">;
type Profile = Tables<"profiles">;

// ─── Status styling (matches MyGigsPage) ─────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open:                 { label: "Pending Placement",    className: "bg-amber-500/10  text-amber-500   border border-amber-500/20"  },
  pending_confirmation: { label: "Pending Confirmation", className: "bg-blue-500/10   text-blue-500    border border-blue-500/20"   },
  accepted:             { label: "Funds Secured",        className: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
  in_progress:          { label: "In Progress",          className: "bg-sky-500/10    text-sky-500     border border-sky-500/20"    },
  completed:            { label: "Completed",            className: "bg-green-500/10  text-green-500   border border-green-500/20"  },
  disputed:             { label: "Disputed",             className: "bg-red-500/10    text-red-500     border border-red-500/20"    },
  cancelled:            { label: "Cancelled",            className: "bg-zinc-500/10   text-zinc-400    border border-zinc-500/20"   },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const zar = (n: number | null | undefined) =>
  n != null ? `R ${Number(n).toFixed(2)}` : "—";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GigDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [hustlerProfile, setHustlerProfile] = useState<Profile | null>(null);
  const [clientProfile, setClientProfile] = useState<Profile | null>(null);

  // ── Fetch gig + both profiles ─────────────────────────────────────────────
  const fetchGig = async () => {
    if (!id) return;
    const { data } = await supabase.from("gigs").select("*").eq("id", id).single();
    setGig(data);

    if (data?.hustler_id) {
      const { data: hp } = await supabase
        .from("profiles").select("*").eq("id", data.hustler_id).single();
      setHustlerProfile(hp ?? null);
    } else {
      setHustlerProfile(null);
    }

    if (data?.client_id) {
      const { data: cp } = await supabase
        .from("profiles").select("*").eq("id", data.client_id).single();
      setClientProfile(cp ?? null);
    }

    setLoading(false);
  };

  // ── Build timeline ────────────────────────────────────────────────────────
  const fetchTimeline = async () => {
    if (!id) return;
    const evts: TimelineEvent[] = [];

    const { data: gigData } = await supabase.from("gigs").select("*").eq("id", id).single();
    if (!gigData) return;

    evts.push({ id: gigData.id, event_type: "created", message: "Gig created", created_at: gigData.created_at });
    if (gigData.hustler_id)
      evts.push({ id: `${gigData.id}-accepted`, event_type: "seller_accepted", message: "Hustler accepted the gig", created_at: gigData.updated_at });
    if (gigData.status === "in_progress")
      evts.push({ id: `${gigData.id}-started`, event_type: "marked_delivered", message: "Gig in progress", created_at: gigData.updated_at });
    if (gigData.status === "pending_confirmation" && gigData.client_confirmed)
      evts.push({ id: `${gigData.id}-pending`, event_type: "buyer_confirmed", message: "Client confirmed", created_at: gigData.updated_at });
    if (gigData.status === "completed")
      evts.push({ id: `${gigData.id}-completed`, event_type: "released", message: "Funds released", created_at: gigData.updated_at });
    if (gigData.status === "disputed")
      evts.push({ id: `${gigData.id}-disputed`, event_type: "dispute_opened", message: "Dispute opened", created_at: gigData.updated_at });
    if (gigData.status === "cancelled")
      evts.push({ id: `${gigData.id}-cancelled`, event_type: "cancelled", message: "Gig cancelled", created_at: gigData.updated_at });

    const { data: txns } = await supabase
      .from("transactions").select("*").eq("gig_id", id).order("created_at", { ascending: true });
    txns?.forEach(t =>
      evts.push({ id: t.id, event_type: t.type, message: `${zar(t.amount)} ${t.type}`, created_at: t.created_at })
    );

    const { data: disputes } = await supabase
      .from("disputes").select("*").eq("gig_id", id).order("created_at", { ascending: true });
    disputes?.forEach(d =>
      evts.push({
        id: d.id,
        event_type: d.status === "open" ? "dispute_opened" : "dispute_resolved",
        message: d.reason,
        created_at: d.created_at,
      })
    );

    evts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setEvents(evts);
  };

  useEffect(() => {
    fetchGig();
    fetchTimeline();
  }, [id]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );
  if (!gig) return (
    <AppLayout>
      <p className="text-center text-muted-foreground py-16">Gig not found</p>
    </AppLayout>
  );

  const isClient  = user?.id === gig.client_id;
  const isHustler = user?.id === gig.hustler_id;

  // ── Derived pricing (real fields, no hardcoding) ──────────────────────────
  const subtotal   = gig.pricing_subtotal   ?? gig.budget;
  const feeAmt     = gig.pricing_fee        ?? null;
  const total      = gig.pricing_total      ?? gig.budget;
  const feePct     = gig.platform_fee_percentage ?? null;
  const hustlerPay = feeAmt != null ? total - feeAmt : subtotal;

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleConfirmRelease = async () => {
    setActionLoading(true);
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from("gigs").update({ client_confirmed: true, completion_pin: pin }).eq("id", gig.id);
    if (gig.hustler_id)
      await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `PIN issued for "${gig.title}". Enter the PIN to complete the gig.`, gig_id: gig.id });
    toast.success(`Your completion PIN is: ${pin}. Share it with the hustler.`);
    setActionLoading(false);
    fetchGig();
  };

  const handleAccept = async () => {
    if (!user) return;
    setActionLoading(true);
    await supabase.from("gigs").update({ hustler_id: user.id, status: "accepted" as any }).eq("id", gig.id);
    await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Your gig "${gig.title}" was accepted by a hustler.`, gig_id: gig.id });
    toast.success("Gig accepted!");
    setActionLoading(false);
    fetchGig();
  };

  const handleStart = async () => {
    setActionLoading(true);
    await supabase.from("gigs").update({ status: "in_progress" as any }).eq("id", gig.id);
    toast.success("Marked as started");
    setActionLoading(false);
    fetchGig();
  };

  const handleDone = async () => {
    setActionLoading(true);
    await supabase.from("gigs").update({ status: "pending_confirmation" as any, hustler_confirmed: true }).eq("id", gig.id);
    await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Hustler marked "${gig.title}" as done. Please confirm & release PIN.`, gig_id: gig.id });
    toast.success("Marked as done. Waiting for client confirmation.");
    setActionLoading(false);
    fetchGig();
  };

  const handlePIN = async (pin: string) => {
    if (pin !== gig.completion_pin) { toast.error("Invalid PIN. Please try again."); return; }
    setActionLoading(true);
    await supabase.from("gigs").update({ status: "completed" as any, hustler_confirmed: true }).eq("id", gig.id);
    if (gig.hustler_id) {
      const { data: hProfile } = await supabase.from("profiles").select("balance").eq("id", gig.hustler_id).single();
      // Credit hustler with their net pay (budget minus platform fee)
      const payout = feeAmt != null ? Number(gig.pricing_total ?? gig.budget) - feeAmt : Number(gig.budget);
      await supabase.from("profiles").update({ balance: (hProfile?.balance ?? 0) + payout }).eq("id", gig.hustler_id);
      await supabase.from("transactions").insert({
        gig_id:           gig.id,
        to_user_id:       gig.hustler_id,
        from_user_id:     gig.client_id,
        amount:           payout,
        type:             "release" as const,
        fee_amount:       feeAmt,
        fee_percentage:   feePct,
        subtotal_amount:  subtotal,
        total_amount:     total,
      });
      await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `${zar(payout)} released for "${gig.title}".`, gig_id: gig.id });
      await supabase.from("notifications").insert({ user_id: gig.client_id,  message: `"${gig.title}" completed. Funds released.`,          gig_id: gig.id });
    }
    await refreshProfile();
    toast.success("Gig completed! Funds released.");
    setActionLoading(false);
    fetchGig();
  };

  const handleDispute = async () => {
    if (!disputeReason.trim() || !user) return;
    setActionLoading(true);
    await supabase.from("gigs").update({ status: "disputed" as any }).eq("id", gig.id);
    await supabase.from("disputes").insert({ gig_id: gig.id, raised_by: user.id, reason: disputeReason.trim() });
    const otherId = isClient ? gig.hustler_id : gig.client_id;
    if (otherId)
      await supabase.from("notifications").insert({ user_id: otherId, message: `A dispute was opened on "${gig.title}".`, gig_id: gig.id });
    toast.success("Dispute raised. Admin will review.");
    setShowDispute(false);
    setDisputeReason("");
    setActionLoading(false);
    fetchGig();
  };

  const handleCancel = async () => {
    setActionLoading(true);
    if (gig.status === "open") {
      await supabase.from("gigs").update({ status: "cancelled" as any }).eq("id", gig.id);
      const { data: cProfile } = await supabase.from("profiles").select("balance").eq("id", gig.client_id).single();
      const refundAmt = Number(gig.pricing_total ?? gig.budget);
      await supabase.from("profiles").update({ balance: (cProfile?.balance ?? 0) + refundAmt }).eq("id", gig.client_id);
      await supabase.from("transactions").insert({ gig_id: gig.id, to_user_id: gig.client_id, amount: refundAmt, type: "refund" as const });
      await refreshProfile();
      toast.success(`Gig cancelled. ${zar(refundAmt)} refunded.`);
    } else {
      await supabase.from("gigs").update({ status: "disputed" as any }).eq("id", gig.id);
      await supabase.from("disputes").insert({ gig_id: gig.id, raised_by: user!.id, reason: "Client initiated cancellation after acceptance." });
      if (gig.hustler_id)
        await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `Client cancelled "${gig.title}". Dispute opened.`, gig_id: gig.id });
      toast.info("Dispute opened. Admin will decide fund allocation.");
    }
    setShowCancel(false);
    setActionLoading(false);
    fetchGig();
  };

  // ── Email receipt: compose mailto with gig summary ────────────────────────
  const handleEmailReceipt = () => {
    const subject = encodeURIComponent(`Hustlr Receipt – ${gig.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease find below a summary for your gig.\n\n` +
      `Title:    ${gig.title}\n` +
      `Status:   ${STATUS_CONFIG[gig.status]?.label ?? gig.status}\n` +
      `Subtotal: ${zar(subtotal)}\n` +
      (feeAmt != null ? `Platform fee (${feePct ?? ""}%): ${zar(feeAmt)}\n` : "") +
      `Total:    ${zar(total)}\n\n` +
      `Gig ID: ${gig.id}\n` +
      `Date: ${new Date(gig.created_at).toLocaleDateString("en-ZA")}\n\n` +
      `For a full PDF receipt, please log in to your Hustlr dashboard.\n\nThanks`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const canDispute = (isClient || isHustler) && ["accepted", "in_progress", "pending_confirmation"].includes(gig.status);
  const canCancel  = isClient && ["open", "accepted", "in_progress"].includes(gig.status);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">← Back</Button>

        {/* ── Header row ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between w-full">
          <p className="text-base font-semibold text-foreground">Transaction</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              title="Email receipt"
              onClick={handleEmailReceipt}
              className="rounded-full border-border"
            >
              <Mail className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Download PDF receipt"
              onClick={() => generateReceipt({ gig, hustlerProfile, clientProfile })}
              className="rounded-full border-border"
            >
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Main gig card ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-2xl capitalize">{gig.title}</CardTitle>
              <StatusPill status={gig.status} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-0.5">Description</p>
                <p className="text-foreground">{gig.description ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Date</p>
                <p className="flex items-center gap-1 text-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {gig.created_at ? formatDistanceToNow(new Date(gig.created_at), { addSuffix: true }) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Address</p>
                <p className="flex items-center gap-1 text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {gig.location ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Category</p>
                <p className="capitalize text-foreground">{gig.category}</p>
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="rounded-xl border border-border overflow-hidden text-sm">
              <div className="bg-muted/40 px-4 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                Payment Breakdown
              </div>

              <div className="divide-y divide-border">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{zar(subtotal)}</span>
                </div>

                {feeAmt != null && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-muted-foreground">
                      Platform fee{feePct != null ? ` (${feePct}%)` : ""}
                    </span>
                    <span className="font-medium text-foreground">{zar(feeAmt)}</span>
                  </div>
                )}

                <div className="flex justify-between px-4 py-2.5 bg-primary/5 font-semibold">
                  <span className="text-foreground">Total charged</span>
                  <span className="text-foreground">{zar(total)}</span>
                </div>

                {hustlerProfile && (
                  <>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">Hustler payout</span>
                      <span className="font-medium text-foreground">{zar(hustlerPay)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">Hustler</span>
                      <span className="font-medium text-foreground">{hustlerProfile.full_name ?? "—"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Client actions ─────────────────────────────────────────── */}
            {isClient && gig.status === "pending_confirmation" && !gig.client_confirmed && (
              <Button onClick={handleConfirmRelease} disabled={actionLoading} className="w-full">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirm & Release PIN
              </Button>
            )}
            {isClient && gig.client_confirmed && gig.completion_pin && gig.status === "pending_confirmation" && (
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">
                    Completion PIN:{" "}
                    <span className="font-mono text-lg font-bold">{gig.completion_pin}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Share this PIN with the hustler to finalise.</p>
                </CardContent>
              </Card>
            )}

            {/* ── Hustler actions ────────────────────────────────────────── */}
            {isHustler && gig.status === "accepted" && (
              <Button onClick={handleStart} disabled={actionLoading} className="w-full">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Mark as Started
              </Button>
            )}
            {isHustler && gig.status === "in_progress" && (
              <Button onClick={handleDone} disabled={actionLoading} className="w-full">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                I'm Done
              </Button>
            )}
            {isHustler && gig.status === "pending_confirmation" && gig.client_confirmed && (
              <PINInput onComplete={handlePIN} disabled={actionLoading} />
            )}

            {/* ── Marketplace accept (hustler browsing) ─────────────────── */}
            {!isClient && !isHustler && profile?.role === "hustler" && gig.status === "open" && (
              <Button onClick={handleAccept} disabled={actionLoading} className="w-full">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Accept Gig
              </Button>
            )}

            {/* ── Dispute & Cancel ───────────────────────────────────────── */}
            <div className="flex gap-2 pt-2">
              {canDispute && gig.status !== "disputed" && (
                <Button variant="destructive" size="sm" onClick={() => setShowDispute(true)}>
                  <AlertTriangle className="h-4 w-4 mr-1.5" /> Raise Dispute
                </Button>
              )}
              {canCancel && gig.status !== "disputed" && (
                <Button variant="outline" size="sm" onClick={() => setShowCancel(true)}>
                  Cancel Gig
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Timeline card ─────────────────────────────────────────────────── */}
        <p className="text-base font-semibold text-foreground">Timeline</p>
        <Card>
          <CardContent className="mt-7">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              <Timeline events={events} />
            )}
          </CardContent>
        </Card>

        {/* ── Dispute dialog ────────────────────────────────────────────────── */}
        <Dialog open={showDispute} onOpenChange={setShowDispute}>
          <DialogContent>
            <DialogHeader><DialogTitle>Raise a Dispute</DialogTitle></DialogHeader>
            <Textarea
              placeholder="Explain your reason…"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              maxLength={500}
            />
            <Button
              onClick={handleDispute}
              disabled={actionLoading || !disputeReason.trim()}
              className="w-full"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Dispute
            </Button>
          </DialogContent>
        </Dialog>

        {/* ── Cancel confirm ────────────────────────────────────────────────── */}
        <ConfirmModal
          open={showCancel}
          title="Cancel Gig?"
          description={
            gig.status === "open"
              ? `${zar(gig.pricing_total ?? gig.budget)} will be refunded to your wallet.`
              : "This will open a dispute. Admin will decide fund allocation."
          }
          onConfirm={handleCancel}
          onCancel={() => setShowCancel(false)}
          confirmLabel="Cancel Gig"
          destructive
        />
      </div>
    </AppLayout>
  );
}