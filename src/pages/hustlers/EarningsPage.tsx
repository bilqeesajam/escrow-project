import { useState, useEffect } from "react";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../lib/auth-context";
import { AppLayout } from "../../components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../../components/ui/dialog";
import { EmptyState } from "../../components/EmptyState";
import { toast } from "sonner";
import {
  Banknote, Loader2, TrendingUp, Wallet, Minus, ArrowUpRight,
} from "lucide-react";
import type { Tables } from "../../integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Gig = Tables<"gigs">;

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

export default function EarningsPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [completedGigs, setCompletedGigs] = useState<Gig[]>([]);
  const [loading, setLoading]             = useState(true);
  const [withdrawOpen, setWithdrawOpen]   = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("gigs")
      .select("*")
      .eq("hustler_id", user.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setCompletedGigs(data ?? []);
        setLoading(false);
      });
  }, [user]);

  // Net pay per gig = total - fee (or subtotal if no fee data)
  const gigPay = (gig: Gig) => {
    const total = Number(gig.pricing_total ?? gig.budget);
    const fee   = Number(gig.pricing_fee   ?? 0);
    return total - fee;
  };

  const totalEarned   = completedGigs.reduce((sum, g) => sum + gigPay(g), 0);
  const currentBalance = Number(profile?.balance ?? 0);

  // ── Withdraw ────────────────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0)     { toast.error("Enter a valid amount.");  return; }
    if (amt > currentBalance) { toast.error("Insufficient balance.");  return; }
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
      type: "refund" as const,   // swap to "withdraw" once enum is extended
      note: "Earnings withdrawal — PayFast integration pending",
    });

    await refreshProfile();
    setWithdrawAmount("");
    setWithdrawOpen(false);
    setSubmitting(false);
    toast.success(`${zar(amt)} withdrawal processed.`);
  };

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
        <h2 className="text-2xl font-bold text-foreground">Earnings</h2>

        {/* ── Stat cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Total Earned</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground font-mono">
                {zar(totalEarned)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {completedGigs.length} completed gig{completedGigs.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3 opacity-75">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Wallet Balance</span>
              </div>
              <p className="text-2xl font-extrabold font-mono">
                {zar(currentBalance)}
              </p>
              <p className="text-xs opacity-70 mt-1">Available to withdraw</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Withdraw button ─────────────────────────────────────────────── */}
        <Button
          onClick={() => setWithdrawOpen(true)}
          disabled={currentBalance <= 0}
          variant="outline"
          className="w-full border-border font-semibold"
        >
          <Minus className="h-4 w-4 mr-2" />
          Withdraw Funds
        </Button>

        {/* ── Completed jobs ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {completedGigs.length === 0 ? (
              <div className="py-10">
                <EmptyState icon={Banknote} message="No completed jobs yet" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {completedGigs.map((gig) => {
                  const net = gigPay(gig);
                  const fee = Number(gig.pricing_fee ?? 0);
                  return (
                    <div key={gig.id} className="flex items-start justify-between px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground capitalize truncate">{gig.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {gig.updated_at
                            ? formatDistanceToNow(new Date(gig.updated_at), { addSuffix: true })
                            : ""}
                        </p>
                        {fee > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Platform fee: {zar(fee)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="font-mono font-semibold text-sm text-emerald-500">
                          {zar(net)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Withdraw dialog ────────────────────────────────────────────────── */}
      <Dialog open={withdrawOpen} onOpenChange={(o) => { if (!o) { setWithdrawOpen(false); setWithdrawAmount(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Earnings</DialogTitle>
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
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="50.00"
                onKeyDown={(e) => e.key === "Enter" && handleWithdraw()}
              />
              {withdrawAmount && parseFloat(withdrawAmount) > currentBalance && (
                <p className="text-xs text-destructive">Amount exceeds your balance.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PayFast integration coming soon — your balance will be deducted immediately for now.
            </p>
            <Button
              onClick={handleWithdraw}
              disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) > currentBalance}
              className="w-full"
              variant="destructive"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Withdraw {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) ? zar(parseFloat(withdrawAmount)) : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}