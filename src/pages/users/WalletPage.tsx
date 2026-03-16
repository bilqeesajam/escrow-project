import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Loader2, Plus, Minus,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Transaction = Tables<"transactions">;

// ─── Type labels ─────────────────────────────────────────────────────────────
const TXN_LABEL: Record<string, string> = {
  top_up:   "Top Up",
  release:  "Payment Released",
  refund:   "Refund",
  hold:     "Funds Held",
  withdraw: "Withdrawal",
};

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { profile, user, refreshProfile } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns]   = useState(true);

  // Dialog state
  const [dialog, setDialog]     = useState<"topup" | "withdraw" | null>(null);
  const [amount, setAmount]     = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => { fetchTransactions(); }, [user]);

  const currentBalance = Number(profile?.balance ?? 0);

  // ── Top Up ────────────────────────────────────────────────────────────────
  const handleTopUp = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount."); return; }
    if (!user) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({ balance: currentBalance + amt })
      .eq("id", user.id);

    if (error) { toast.error(error.message); setSubmitting(false); return; }

    await supabase.from("transactions").insert({
      to_user_id: user.id,
      amount: amt,
      type: "top_up" as const,
      note: "Manual wallet top-up",
    });

    await refreshProfile();
    await fetchTransactions();
    setAmount("");
    setDialog(null);
    setSubmitting(false);
    toast.success(`${zar(amt)} added to your wallet.`);
  };

  // ── Withdraw ──────────────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0)          { toast.error("Enter a valid amount.");                    return; }
    if (amt > currentBalance)      { toast.error("Insufficient balance.");                    return; }
    if (!user) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({ balance: currentBalance - amt })
      .eq("id", user.id);

    if (error) { toast.error(error.message); setSubmitting(false); return; }

    await supabase.from("transactions").insert({
      from_user_id: user.id,
      amount: amt,
      type: "refund" as const,   // closest existing txn_type; swap to "withdraw" once enum is added
      note: "Withdrawal — PayFast integration pending",
    });

    await refreshProfile();
    await fetchTransactions();
    setAmount("");
    setDialog(null);
    setSubmitting(false);
    toast.success(`${zar(amt)} withdrawal processed.`);
  };

  const closeDialog = () => { setDialog(null); setAmount(""); };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">

        {/* ── Balance card ───────────────────────────────────────────────── */}
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm opacity-75 mb-1">Available Balance</p>
                <p className="text-4xl font-extrabold font-mono tracking-tight">
                  {zar(currentBalance)}
                </p>
              </div>
              <div className="rounded-2xl bg-primary-foreground/10 p-3">
                <Wallet className="h-7 w-7" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 font-semibold"
                onClick={() => setDialog("topup")}
              >
                <Plus className="h-4 w-4 mr-2" /> Top Up
              </Button>
              <Button
                variant="secondary"
                className="flex-1 font-semibold"
                onClick={() => setDialog("withdraw")}
                disabled={currentBalance <= 0}
              >
                <Minus className="h-4 w-4 mr-2" /> Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Transaction history ────────────────────────────────────────── */}
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
                {transactions.map((txn) => {
                  const isIncoming = txn.to_user_id === user?.id;
                  const label      = TXN_LABEL[txn.type] ?? txn.type.replace(/_/g, " ");
                  return (
                    <div key={txn.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 shrink-0 ${isIncoming ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                          {isIncoming
                            ? <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                            : <ArrowUpRight  className="h-4 w-4 text-destructive"  />}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize text-foreground">{label}</p>
                          {txn.note && (
                            <p className="text-xs text-muted-foreground">{txn.note}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {txn.created_at
                              ? formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })
                              : ""}
                          </p>
                        </div>
                      </div>
                      <span className={`font-mono font-semibold text-sm ${isIncoming ? "text-emerald-500" : "text-destructive"}`}>
                        {isIncoming ? "+" : "−"}{zar(Number(txn.amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Up dialog ──────────────────────────────────────────────────── */}
      <Dialog open={dialog === "topup"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Amount (R)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
                onKeyDown={(e) => e.key === "Enter" && handleTopUp()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              PayFast integration coming soon — funds will be added directly for now.
            </p>
            <Button onClick={handleTopUp} disabled={submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Funds
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Withdraw dialog ────────────────────────────────────────────────── */}
      <Dialog open={dialog === "withdraw"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
              Available: <span className="font-bold text-foreground">{zar(currentBalance)}</span>
            </div>
            <div className="space-y-2">
              <Label>Amount (R)</Label>
              <Input
                type="number"
                min="1"
                max={currentBalance}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50.00"
                onKeyDown={(e) => e.key === "Enter" && handleWithdraw()}
              />
              {amount && parseFloat(amount) > currentBalance && (
                <p className="text-xs text-destructive">Amount exceeds your balance.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PayFast integration coming soon — balance will be deducted immediately for now.
            </p>
            <Button
              onClick={handleWithdraw}
              disabled={submitting || !amount || parseFloat(amount) > currentBalance}
              className="w-full"
              variant="destructive"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Withdraw {amount && !isNaN(parseFloat(amount)) ? zar(parseFloat(amount)) : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}