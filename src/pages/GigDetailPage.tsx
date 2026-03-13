import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { PINInput } from "@/components/PINInput";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, MapPin, DollarSign, Clock, AlertTriangle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { Timeline, TimelineEvent } from "@/components/Timeline";

type Gig = Tables<"gigs">;

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
  const [hustlerProfile, setHustlerProfile] = useState<Tables<"profiles"> | null>(null);

  const fetchGig = async () => {
    if (!id) return;
    const { data } = await supabase.from("gigs").select("*").eq("id", id).single();
    setGig(data);
    if (data?.hustler_id) {
      const { data: hp } = await supabase.from("profiles").select("*").eq("id", data.hustler_id).single();
      setHustlerProfile(hp);
    }
    setLoading(false);
  };

  const fetchTimeline = async () => {
    if (!id) return;

    const events: TimelineEvent[] = [];

    // Fetch gig
    const { data: gigData } = await supabase.from("gigs").select("*").eq("id", id).single();
    if (!gigData) return;

    // Gig creation
    events.push({ id: gigData.id, event_type: "created", message: "Gig created", created_at: gigData.created_at });

    // Status-based events
    if (gigData.hustler_id) {
      events.push({ id: `${gigData.id}-accepted`, event_type: "seller_accepted", message: "Hustler accepted the gig", created_at: gigData.updated_at });
    }
    if (gigData.status === "in_progress") {
      events.push({ id: `${gigData.id}-started`, event_type: "marked_delivered", message: "Gig in progress", created_at: gigData.updated_at });
    }
    if (gigData.status === "pending_confirmation" && gigData.client_confirmed) {
      events.push({ id: `${gigData.id}-pending`, event_type: "buyer_confirmed", message: "Client confirmed", created_at: gigData.updated_at });
    }
    if (gigData.status === "completed") {
      events.push({ id: `${gigData.id}-completed`, event_type: "released", message: "Funds released", created_at: gigData.updated_at });
    }
    if (gigData.status === "disputed") {
      events.push({ id: `${gigData.id}-disputed`, event_type: "dispute_opened", message: "Dispute opened", created_at: gigData.updated_at });
    }
    if (gigData.status === "cancelled") {
      events.push({ id: `${gigData.id}-cancelled`, event_type: "cancelled", message: "Gig cancelled", created_at: gigData.updated_at });
    }

    // Transactions
    const { data: txns } = await supabase.from("transactions").select("*").eq("gig_id", id).order("created_at", { ascending: true });
    txns?.forEach(t => {
      events.push({
        id: t.id,
        event_type: t.type,
        message: `R${t.amount.toFixed(2)} ${t.type}`,
        created_at: t.created_at,
      });
    });

    // Disputes
    const { data: disputes } = await supabase.from("disputes").select("*").eq("gig_id", id).order("created_at", { ascending: true });
    disputes?.forEach(d => {
      events.push({
        id: d.id,
        event_type: d.status === "open" ? "dispute_opened" : "dispute_resolved",
        message: d.reason,
        created_at: d.created_at,
      });
    });

    // Sort by date
    events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    setEvents(events);
  };

  useEffect(() => {
    fetchGig();
    fetchTimeline(); // fetch timeline events too
  }, [id]);

  if (loading) return <AppLayout><div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  if (!gig) return <AppLayout><p className="text-center text-muted-foreground py-16">Gig not found</p></AppLayout>;

  const isClient = user?.id === gig.client_id;
  const isHustler = user?.id === gig.hustler_id;

  // Client: Confirm & release PIN
  const handleConfirmRelease = async () => {
    setActionLoading(true);
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from("gigs").update({ client_confirmed: true, completion_pin: pin }).eq("id", gig.id);
    // Notify hustler
    if (gig.hustler_id) {
      await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `PIN issued for "${gig.title}". Enter the PIN to complete the gig.`, gig_id: gig.id });
    }
    toast.success(`Your completion PIN is: ${pin}. Share it with the hustler.`);
    setActionLoading(false);
    fetchGig();
  };

  // Hustler: Accept gig
  const handleAccept = async () => {
    if (!user) return;
    setActionLoading(true);
    await supabase.from("gigs").update({ hustler_id: user.id, status: "accepted" as any }).eq("id", gig.id);
    // Notify client
    await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Your gig "${gig.title}" was accepted by a hustler.`, gig_id: gig.id });
    toast.success("Gig accepted!");
    setActionLoading(false);
    fetchGig();
  };

  // Hustler: Mark started
  const handleStart = async () => {
    setActionLoading(true);
    await supabase.from("gigs").update({ status: "in_progress" as any }).eq("id", gig.id);
    toast.success("Marked as started");
    setActionLoading(false);
    fetchGig();
  };

  // Hustler: Mark done
  const handleDone = async () => {
    setActionLoading(true);
    await supabase.from("gigs").update({ status: "pending_confirmation" as any, hustler_confirmed: true }).eq("id", gig.id);
    // Notify client
    await supabase.from("notifications").insert({ user_id: gig.client_id, message: `Hustler marked "${gig.title}" as done. Please confirm & release PIN.`, gig_id: gig.id });
    toast.success("Marked as done. Waiting for client confirmation.");
    setActionLoading(false);
    fetchGig();
  };

  // Hustler: Enter PIN
  const handlePIN = async (pin: string) => {
    if (pin !== gig.completion_pin) {
      toast.error("Invalid PIN. Please try again.");
      return;
    }
    setActionLoading(true);
    // Release funds to hustler
    await supabase.from("gigs").update({ status: "completed" as any, hustler_confirmed: true }).eq("id", gig.id);
    // Credit hustler
    if (gig.hustler_id) {
      const { data: hProfile } = await supabase.from("profiles").select("balance").eq("id", gig.hustler_id).single();
      await supabase.from("profiles").update({ balance: (hProfile?.balance || 0) + gig.budget }).eq("id", gig.hustler_id);
      await supabase.from("transactions").insert({ gig_id: gig.id, to_user_id: gig.hustler_id, from_user_id: gig.client_id, amount: gig.budget, type: "release" as const });
      await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `R${gig.budget.toFixed(2)} released for "${gig.title}".`, gig_id: gig.id });
      await supabase.from("notifications").insert({ user_id: gig.client_id, message: `"${gig.title}" completed. Funds released.`, gig_id: gig.id });
    }
    await refreshProfile();
    toast.success("Gig completed! Funds released.");
    setActionLoading(false);
    fetchGig();
  };

  // Dispute
  const handleDispute = async () => {
    if (!disputeReason.trim() || !user) return;
    setActionLoading(true);
    await supabase.from("gigs").update({ status: "disputed" as any }).eq("id", gig.id);
    await supabase.from("disputes").insert({ gig_id: gig.id, raised_by: user.id, reason: disputeReason.trim() });
    // Notify both
    const otherId = isClient ? gig.hustler_id : gig.client_id;
    if (otherId) await supabase.from("notifications").insert({ user_id: otherId, message: `A dispute was opened on "${gig.title}".`, gig_id: gig.id });
    toast.success("Dispute raised. Admin will review.");
    setShowDispute(false);
    setDisputeReason("");
    setActionLoading(false);
    fetchGig();
  };

  // Client cancel
  const handleCancel = async () => {
    setActionLoading(true);
    if (gig.status === "open") {
      // Free cancel — refund
      await supabase.from("gigs").update({ status: "cancelled" as any }).eq("id", gig.id);
      const { data: cProfile } = await supabase.from("profiles").select("balance").eq("id", gig.client_id).single();
      await supabase.from("profiles").update({ balance: (cProfile?.balance || 0) + gig.budget }).eq("id", gig.client_id);
      await supabase.from("transactions").insert({ gig_id: gig.id, to_user_id: gig.client_id, amount: gig.budget, type: "refund" as const });
      await refreshProfile();
      toast.success("Gig cancelled. Funds refunded.");
    } else {
      // Auto-dispute
      await supabase.from("gigs").update({ status: "disputed" as any }).eq("id", gig.id);
      await supabase.from("disputes").insert({ gig_id: gig.id, raised_by: user!.id, reason: "Client initiated cancellation after acceptance." });
      if (gig.hustler_id) await supabase.from("notifications").insert({ user_id: gig.hustler_id, message: `Client cancelled "${gig.title}". Dispute opened.`, gig_id: gig.id });
      toast.info("Dispute opened. Admin will decide fund allocation.");
    }
    setShowCancel(false);
    setActionLoading(false);
    fetchGig();
  };

  const canDispute = (isClient || isHustler) && ["accepted", "in_progress", "pending_confirmation"].includes(gig.status);
  const canCancel = isClient && ["open", "accepted", "in_progress"].includes(gig.status);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">← Back</Button>

        <CardTitle className="flex items-center justify-between w-full">
          <p className="text-base font-medium">Transactions</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full text-xs px-4 py-1">Email</Button>
            <Button variant="outline" size="sm" className="rounded-full text-xs px-4 py-1">PDF</Button>
          </div>
        </CardTitle>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-2xl text-transform: capitalize">{gig.title}</CardTitle>
              <StatusBadge status={gig.status || "Completed"} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-8">
              <div>
                <p className="text-muted-foreground">Description</p>
                <p>{gig.description}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Date</p>
                <span className="flex items-center gap-1">
                  {gig.created_at
                    ? formatDistanceToNow(new Date(gig.created_at), { addSuffix: true })
                    : ""}
                </span>
              </div>

              <div>
                <p className="text-muted-foreground">Address</p>
                <span className="flex items-center gap-1">{gig.location}</span>
              </div>

              <div>
                <p className="text-muted-foreground">Category</p>
                <span className="flex items-center gap-1">{gig.category}</span>
              </div>
            </div>
            <div>
              <div>
                <p className="text-muted-foreground">Paid Amount</p>
                <span className="flex items-center gap-1">R {gig.budget.toFixed(2)}
                </span>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <p className="text-muted-foreground">% Fee</p>
                <span className="flex items-center gap-1">R {gig.budget.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                {hustlerProfile && (
                  <div>
                    <p className="text-muted-foreground">Hustler Pay</p>
                    <p>R 80.00</p>
                  </div>
                )}
                {hustlerProfile && (
                  <div>
                    <p className="text-muted-foreground">Hustler</p>
                    <p>giveusjobs@gmail.com</p>
                  </div>
                )}
              </div>


            </div>


            {/* Client actions */}
            {isClient && gig.status === "pending_confirmation" && !gig.client_confirmed && (
              <Button onClick={handleConfirmRelease} disabled={actionLoading} className="w-full">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm & Release PIN
              </Button>
            )}
            {isClient && gig.client_confirmed && gig.completion_pin && gig.status === "pending_confirmation" && (
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">Completion PIN: <span className="font-mono text-lg font-bold">{gig.completion_pin}</span></p>
                  <p className="text-xs text-muted-foreground">Share this PIN with the hustler to finalize.</p>
                </CardContent>
              </Card>
            )}

            {/* Hustler actions */}
            {isHustler && gig.status === "accepted" && (
              <Button onClick={handleStart} disabled={actionLoading} className="w-full">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Mark as Started
              </Button>
            )}
            {isHustler && gig.status === "in_progress" && (
              <Button onClick={handleDone} disabled={actionLoading} className="w-full">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                I'm Done
              </Button>
            )}
            {isHustler && gig.status === "pending_confirmation" && gig.client_confirmed && (
              <PINInput onComplete={handlePIN} disabled={actionLoading} />
            )}

            {/* Accept (for marketplace hustlers viewing the detail) */}
            {!isClient && !isHustler && profile?.role === "hustler" && gig.status === "open" && (
              <Button onClick={handleAccept} disabled={actionLoading} className="w-full">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Accept Gig
              </Button>
            )}

            {/* Dispute & Cancel */}
            <div className="flex gap-2 pt-2">
              {canDispute && gig.status !== "disputed" && (
                <Button variant="destructive" size="sm" onClick={() => setShowDispute(true)}>
                  <AlertTriangle className="h-4 w-4" /> Raise Dispute
                </Button>
              )}
              {canCancel && gig.status !== "disputed" && (
                <Button variant="outline" size="sm" onClick={() => setShowCancel(true)}>Cancel Gig</Button>
              )}
            </div>
          </CardContent>
          
        </Card>
        <CardTitle>
          <p className="text-base font-medium">Timeline</p>
        </CardTitle>
        <Card>
          <CardContent className="mt-7">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              <Timeline events={events} />
            )}
          </CardContent>
        </Card>

        {/* Dispute dialog */}
        <Dialog open={showDispute} onOpenChange={setShowDispute}>
          <DialogContent>
            <DialogHeader><DialogTitle>Raise a Dispute</DialogTitle></DialogHeader>
            <Textarea placeholder="Explain your reason..." value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} maxLength={500} />
            <Button onClick={handleDispute} disabled={actionLoading || !disputeReason.trim()} className="w-full">
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Dispute
            </Button>
          </DialogContent>
        </Dialog>

        {/* Cancel confirm */}
        <ConfirmModal
          open={showCancel}
          title="Cancel Gig?"
          description={gig.status === "open"
            ? "The budget will be refunded to your wallet."
            : "This will open a dispute. Admin will decide fund allocation."}
          onConfirm={handleCancel}
          onCancel={() => setShowCancel(false)}
          confirmLabel="Cancel Gig"
          destructive
        />
      </div>
    </AppLayout>
  );
}