import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import TransactionCard from "@/components/TransactionCard";
import { mockTransactions } from "@/data/mockData";
import { Plus, Banknote, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { TransactionStatus } from "@/components/StatusBadge";

const statusFilters: { label: string; value: "all" | TransactionStatus }[] = [
  { label: "All", value: "all" },
  { label: "In Escrow", value: "funded" },
  { label: "Delivered", value: "delivered" },
  { label: "Completed", value: "completed" },
  { label: "Disputed", value: "disputed" },
  { label: "Draft", value: "draft" },
];

const Dashboard = () => {
  const [filter, setFilter] = useState<"all" | TransactionStatus>("all");

  const filtered = filter === "all" ? mockTransactions : mockTransactions.filter((t) => t.status === filter);

  const stats = [
    { label: "In Escrow", value: "R45,000", icon: Banknote, color: "text-accent" },
    { label: "Pending", value: "2", icon: Clock, color: "text-info" },
    { label: "Disputed", value: "1", icon: AlertTriangle, color: "text-warning" },
    { label: "Completed", value: "1", icon: CheckCircle2, color: "text-success" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Welcome back, James</p>
            </div>
            <Button variant="default" asChild>
              <Link to="/transactions/new">
                <Plus className="w-4 h-4 mr-1" />
                New Transaction
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <div className="font-display text-xl font-bold text-foreground">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Transaction list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No transactions found</p>
              </div>
            ) : (
              filtered.map((t) => <TransactionCard key={t.id} transaction={t} />)
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
