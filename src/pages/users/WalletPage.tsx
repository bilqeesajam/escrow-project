import { useState, useEffect } from "react";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth-context";
import { AppLayout } from "../../components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { toast } from "sonner";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Loader2, Plus, Minus,
  CreditCard, Shield, Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";
import type { Tables } from "../../integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { initiatePayFastPayment } from "../../lib/payfast";
import { backendRequest } from "../../lib/backend";

type Transaction = Tables<"transactions">;

// ─── Backend transaction type (from Django) ───────────────────────────────────
interface DjangoTransaction {
  id: string;
  role: "buyer" | "seller";
  amount: string;
  type: string;
  other_party_id: string;
  created_at: string;
}

// ─── Gig with hold transaction ────────────────────────────────────────────────
interface PendingGig {
  gigId: string;
  transactionId: string;
  gigTitle: string;
  amount: number;
  createdAt: string;
}

const TXN_LABEL: Record<string, string> = {
  top_up:     "Top Up",
  release:    "Payment Released",
  refund:     "Refund",
  hold:       "Funds Held (Escrow)",
  withdraw:   "Withdrawal",
};

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

export default function WalletPage() {
  const { profile, user, refreshProfile } = useAuth();

  const [transactions,   setTransactions]   = useState<Transaction[]>([]);
  const [pendingGigs,    setPendingGigs]     = useState<PendingGig[]>([]);
  const [loadingTxns,    setLoadingTxns]     = useState(true);
  const [loadingPending, setLoadingPending]  = useState(true);
  const [payingGigId,    setPayingGigId]     = useState<string | null>(null);

  const [dialog,     setDialog]     = useState<"topup" | "withdraw" | null>(null);
  const [amount,     setAmount]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch Supabase transactions ───────────────────────────────────────────
  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setTransactions(data ?? []);
    setLoadingTxns(false);
  };

  // ── Fetch pending PayFast payments (gigs not yet paid via PayFast) ────────
  // A hold transaction without a PayFast payment_id is unfunded.
  // We cross-reference gigs to get titles.
  const fetchPendingPayments = async () => {
    if (!user) return;
    setLoadingPending(true);
    try {
      // Get hold transactions for this user (as buyer/from_user)
      const { data: holdTxns } = await supabase
        .from("transactions")
        .select("id, gig_id, amount, created_at, note")
        .eq("from_user_id", user.id)
        .eq("type", "hold")
        .order("created_at", { ascending: false });

      if (!holdTxns?.length) { setPendingGigs([]); setLoadingPending(false); return; }

      // Filter those without "PayFast" in note (proxy for unfunded)
      // In production you'd check payfast_payment_id via the Django API
      const unfunded = holdTxns.filter(t => !t.note?.includes("PayFast") && t.gig_id);

      if (!unfunded.length) { setPendingGigs([]); setLoadingPending(false); return; }

      // Fetch gig titles
      const gigIds = [...new Set(unfunded.map(t => t.gig_id))].filter(Boolean) as string[];
      const { data: gigs } = await supabase
        .from("gigs")
        .select("id, title, status")
        .in("id", gigIds);

      const gigMap = Object.fromEntries((gigs ?? []).map(g => [g.id, g]));

      // Only show gigs that are still open (not yet funded = open, not cancelled)
      const pending: PendingGig[] = unfunded
        .filter(t => {
          const gig = gigMap[t.gig_id!];
          return gig && ["open", "accepted"].includes(gig.status);
        })
        .map(t => ({
          gigId:         t.gig_id!,
          transactionId: t.id,
          gigTitle:      gigMap[t.gig_id!]?.title ?? "Unknown Gig",
          amount:        Number(t.amount),
          createdAt:     t.created_at ?? "",
        }));

      setPendingGigs(pending);
    } catch (err) {
      console.error("Error fetching pending payments:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => { fetchTransactions(); fetchPendingPayments(); }, [user]);

  const currentBalance = Number(profile?.balance ?? 0);

  // ── PayFast redirect ──────────────────────────────────────────────────────
  const handlePayViaPf = async (txnId: string, gigId: string) => {
    setPayingGigId(gigId);
    try {
      await initiatePayFastPayment(txnId);
      // Browser redirects — nothing after this
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to redirect to PayFast.");
      setPayingGigId(null);
    }
  };

  // ── Manual top-up (pre-PayFast, for testing) ──────────────────────────────
  const handleTopUp = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount."); return; }
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("profiles").update({ balance: currentBalance + amt }).eq("id", user.id);
    if (error) { toast.error(error.message); setSubmitting(false); return; }
    await supabase.from("transactions").insert({ to_user_id: user.id, amount: amt, type: "top_up" as const, note: "Manual wallet top-up" });
    await refreshProfile();
    await fetchTransactions();
    setAmount(""); setDialog(null); setSubmitting(false);
    toast.success(`${zar(amt)} added to your wallet.`);
  };

  // ── Withdraw ──────────────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0)     { toast.error("Enter a valid amount.");  return; }
    if (amt > currentBalance) { toast.error("Insufficient balance.");  return; }
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("profiles").update({ balance: currentBalance - amt }).eq("id", user.id);
    if (error) { toast.error(error.message); setSubmitting(false); return; }
    await supabase.from("transactions").insert({ from_user_id: user.id, amount: amt, type: "refund" as const, note: "Withdrawal — PayFast integration pending" });
    await refreshProfile();
    await fetchTransactions();
    setAmount(""); setDialog(null); setSubmitting(false);
    toast.success(`${zar(amt)} withdrawal processed.`);
  };

  const closeDialog = () => { setDialog(null); setAmount(""); };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-10">

        {/* ── Balance card ─────────────────────────────────────────────── */}
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm opacity-75 mb-1">Available Balance</p>
                <p className="text-4xl font-extrabold font-mono tracking-tight">{zar(currentBalance)}</p>
              </div>
              <div className="rounded-2xl bg-primary-foreground/10 p-3">
                <Wallet className="h-7 w-7" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 font-semibold" onClick={() => setDialog("topup")}>
                <Plus className="h-4 w-4 mr-2" /> Top Up
              </Button>
              <Button variant="secondary" className="flex-1 font-semibold" onClick={() => setDialog("withdraw")} disabled={currentBalance <= 0}>
                <Minus className="h-4 w-4 mr-2" /> Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Pending PayFast payments ─────────────────────────────────── */}
        {(loadingPending || pendingGigs.length > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <CardTitle className="text-sm font-semibold text-foreground">Pending Payments</CardTitle>
                {pendingGigs.length > 0 && (
                  <span className="ml-auto text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                    {pendingGigs.length} awaiting
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPending ? (
                <div className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking pending payments…
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingGigs.map(pg => (
                    <div key={pg.transactionId} className="flex items-center justify-between px-5 py-3.5 gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 shrink-0">
                          <Shield className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground capitalize truncate">{pg.gigTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {pg.createdAt ? formatDistanceToNow(new Date(pg.createdAt), { addSuffix: true }) : ""} · {zar(pg.amount)} to escrow
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePayViaPf(pg.transactionId, pg.gigId)}
                        disabled={payingGigId === pg.gigId}
                        className="shrink-0 rounded-xl h-8 text-xs font-semibold gap-1.5"
                      >
                        {payingGigId === pg.gigId
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirecting…</>
                          : <><CreditCard className="h-3.5 w-3.5" /> Pay via PayFast</>}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Transaction history ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingTxns ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No transactions yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map(txn => {
                  const isIncoming = txn.to_user_id === user?.id;
                  const isHold     = txn.type === "hold";
                  const label      = TXN_LABEL[txn.type] ?? txn.type.replace(/_/g, " ");
                  return (
                    <div key={txn.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 shrink-0 ${
                          isHold       ? "bg-amber-500/10" :
                          isIncoming   ? "bg-emerald-500/10" : "bg-destructive/10"
                        }`}>
                          {isHold
                            ? <Shield       className="h-4 w-4 text-amber-500"   />
                            : isIncoming
                              ? <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                              : <ArrowUpRight  className="h-4 w-4 text-destructive"  />}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize text-foreground">{label}</p>
                          {txn.note && <p className="text-xs text-muted-foreground">{txn.note}</p>}
                          <p className="text-xs text-muted-foreground">
                            {txn.created_at ? formatDistanceToNow(new Date(txn.created_at), { addSuffix: true }) : ""}
                          </p>
                        </div>
                      </div>
                      <span className={`font-mono font-semibold text-sm ${
                        isHold     ? "text-amber-500"   :
                        isIncoming ? "text-emerald-500" : "text-destructive"
                      }`}>
                        {isHold ? "" : isIncoming ? "+" : "−"}{zar(Number(txn.amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Up dialog ────────────────────────────────────────────────── */}
      <Dialog open={dialog === "topup"} onOpenChange={o => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Top Up Wallet</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Amount (R)</Label>
              <Input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="100.00" onKeyDown={e => e.key === "Enter" && handleTopUp()} />
            </div>
            <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 text-xs text-muted-foreground">
              PayFast top-up integration coming soon — funds added directly to wallet for now.
            </div>
            <Button onClick={handleTopUp} disabled={submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add Funds
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Withdraw dialog ──────────────────────────────────────────────── */}
      <Dialog open={dialog === "withdraw"} onOpenChange={o => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Withdraw Funds</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
              Available: <span className="font-bold text-foreground">{zar(currentBalance)}</span>
            </div>
            <div className="space-y-2">
              <Label>Amount (R)</Label>
              <Input type="number" min="1" max={currentBalance} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50.00" onKeyDown={e => e.key === "Enter" && handleWithdraw()} />
              {amount && parseFloat(amount) > currentBalance && <p className="text-xs text-destructive">Amount exceeds your balance.</p>}
            </div>
            <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 text-xs text-muted-foreground">
              PayFast payout integration coming soon — balance deducted immediately for now.
            </div>
            <Button onClick={handleWithdraw} disabled={submitting || !amount || parseFloat(amount) > currentBalance} className="w-full" variant="destructive">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Withdraw {amount && !isNaN(parseFloat(amount)) ? zar(parseFloat(amount)) : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}