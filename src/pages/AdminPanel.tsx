import Navbar from "@/components/Navbar";
import TransactionCard from "@/components/TransactionCard";
import { mockTransactions } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Users, FileText } from "lucide-react";
import { motion } from "framer-motion";

const disputedTransactions = mockTransactions.filter((t) => t.status === "disputed");

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage disputes, users, and audit logs</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-foreground">{disputedTransactions.length}</div>
                <div className="text-xs text-muted-foreground">Active Disputes</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-foreground">128</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-info" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-foreground">342</div>
                <div className="text-xs text-muted-foreground">Audit Entries</div>
              </div>
            </div>
          </div>

          {/* Disputed transactions */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">Disputed Transactions</h2>
              <Badge variant="warning">{disputedTransactions.length}</Badge>
            </div>
            {disputedTransactions.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                No active disputes. All transactions are running smoothly.
              </div>
            ) : (
              <div className="space-y-3">
                {disputedTransactions.map((t) => (
                  <div key={t.id} className="bg-card border border-warning/20 rounded-xl p-5">
                    <TransactionCard transaction={t} />
                    <div className="mt-3 pt-3 border-t border-border flex gap-2">
                      <Button size="sm" variant="default">Review & Resolve</Button>
                      <Button size="sm" variant="outline">Message Parties</Button>
                      <Button size="sm" variant="destructive">Suspend User</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit log preview */}
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Recent Audit Log</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="divide-y divide-border">
                {[
                  { action: "Payment received", user: "James Mokoena", time: "2 hours ago", type: "payment" },
                  { action: "Dispute opened", user: "Thandi Zulu", time: "5 hours ago", type: "dispute" },
                  { action: "Transaction completed", user: "Sarah Ndlovu", time: "1 day ago", type: "complete" },
                  { action: "User registered", user: "Michael Botha", time: "2 days ago", type: "user" },
                ].map((log, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.type === "dispute" ? "bg-warning" :
                        log.type === "payment" ? "bg-accent" :
                        log.type === "complete" ? "bg-success" : "bg-info"
                      }`} />
                      <span className="text-foreground">{log.action}</span>
                      <span className="text-muted-foreground">by {log.user}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
