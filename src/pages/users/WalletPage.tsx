import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wallet, ArrowUpRight, ArrowDownLeft, Loader2, Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Transaction = Tables<"transactions">;

export default function WalletPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (data) setTransactions(data);
  };

  useEffect(() => { fetchTransactions(); }, [user]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0 || !user) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    // Update balance
    const { error: balanceError } = await supabase.from("profiles").update({
      balance: (profile?.balance || 0) + amount,
    }).eq("id", user.id);
    if (balanceError) { toast.error(balanceError.message); setLoading(false); return; }

    // Record transaction
    await supabase.from("transactions").insert({
      to_user_id: user.id,
      amount,
      type: "top_up" as const,
    });

    await refreshProfile();
    await fetchTransactions();
    setTopUpAmount("");
    setDialogOpen(false);
    setLoading(false);
    toast.success(`R${amount.toFixed(2)} added to your wallet`);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Available Balance</p>
                <p className="text-3xl font-bold font-mono">R{(profile?.balance || 0).toFixed(2)}</p>
              </div>
              <div className="rounded-full bg-primary-foreground/10 p-3">
                <Wallet className="h-8 w-8" />
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="mt-4">
                  <Plus className="h-4 w-4" /> Top Up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Top Up Wallet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount (R)</Label>
                    <Input type="number" min="1" step="0.01" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} placeholder="100.00" />
                  </div>
                  <Button onClick={handleTopUp} disabled={loading} className="w-full">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Add Funds
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="mt-4">
                  <Plus className="h-4 w-4" /> Top Up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Top Up Wallet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount (R)</Label>
                    <Input type="number" min="1" step="0.01" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} placeholder="100.00" />
                  </div>
                  <Button onClick={handleTopUp} disabled={loading} className="w-full">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Add Funds
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((txn) => {
                  const isIncoming = txn.to_user_id === user?.id;
                  return (
                    <div key={txn.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${isIncoming ? "bg-success/10" : "bg-destructive/10"}`}>
                          {isIncoming ? <ArrowDownLeft className="h-4 w-4 text-success" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{txn.type.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            {txn.created_at ? formatDistanceToNow(new Date(txn.created_at), { addSuffix: true }) : ""}
                          </p>
                        </div>
                      </div>
                      <span className={`font-mono font-semibold text-sm ${isIncoming ? "text-success" : "text-destructive"}`}>
                        {isIncoming ? "+" : "-"}R{txn.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
