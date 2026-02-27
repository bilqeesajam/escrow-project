import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import StepProgress from "@/components/StepProgress";
import { mockTransactions } from "@/data/mockData";
import { ArrowLeft, Banknote, Calendar, User, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const TransactionDetail = () => {
  const { id } = useParams();
  const transaction = mockTransactions.find((t) => t.id === id) || mockTransactions[0];
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const statusIndex = { draft: 0, funded: 1, delivered: 2, completed: 3, disputed: -1, cancelled: -1 };
  const currentStep = statusIndex[transaction.status] ?? 0;

  const steps = [
    { label: "Created", completed: currentStep >= 0, active: currentStep === 0 },
    { label: "Funded", completed: currentStep >= 1, active: currentStep === 1 },
    { label: "Delivered", completed: currentStep >= 2, active: currentStep === 2 },
    { label: "Completed", completed: currentStep >= 3, active: currentStep === 3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{transaction.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
            </div>
            <StatusBadge status={transaction.status} />
          </div>

          {/* Progress */}
          {transaction.status !== "disputed" && transaction.status !== "cancelled" && (
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <StepProgress steps={steps} />
            </div>
          )}

          {/* Disputed banner */}
          {transaction.status === "disputed" && (
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-5 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm">Transaction Disputed</h3>
                <p className="text-xs text-muted-foreground mt-1">This transaction is under review by an admin. Funds remain securely held in escrow until resolution.</p>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-display font-semibold text-foreground text-sm">Transaction Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5" /> Amount</span>
                  <span className="font-semibold text-foreground">R{transaction.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Created</span>
                  <span className="text-foreground">{transaction.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Delivery Due</span>
                  <span className="text-foreground">{transaction.deliveryDate}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-display font-semibold text-foreground text-sm">Parties</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Buyer</span>
                  <span className="text-foreground">{transaction.buyer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Seller</span>
                  <span className="text-foreground">{transaction.seller}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Escrow badge */}
          {transaction.status === "funded" && (
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <Banknote className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm">Funds Secured in Escrow</h3>
                <p className="text-xs text-muted-foreground">R{transaction.amount.toLocaleString()} is safely held and will be released upon mutual confirmation.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {transaction.status === "funded" && (
              <Button variant="default">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Confirm Delivery
              </Button>
            )}
            {transaction.status === "delivered" && (
              <Button variant="default">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Confirm & Release Funds
              </Button>
            )}
            {transaction.status === "draft" && (
              <Button variant="default">
                <Banknote className="w-4 h-4 mr-1" />
                Pay via PayFast
              </Button>
            )}
            {(transaction.status === "funded" || transaction.status === "delivered") && (
              <Button variant="outline" onClick={() => setShowDispute(!showDispute)}>
                <AlertTriangle className="w-4 h-4 mr-1" />
                Open Dispute
              </Button>
            )}
          </div>

          {/* Dispute form */}
          {showDispute && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 bg-card border border-border rounded-xl p-5"
            >
              <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                Open a Dispute
              </h3>
              <textarea
                placeholder="Describe the issue in detail..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2 mt-3">
                <Button variant="destructive" size="sm">Submit Dispute</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowDispute(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TransactionDetail;
