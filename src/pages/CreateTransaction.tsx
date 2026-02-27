import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";

const CreateTransaction = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground">Create Escrow Transaction</h1>
            <p className="text-sm text-muted-foreground mt-1">Set up a new secure transaction with a seller</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-display font-semibold text-foreground">Transaction Details</h2>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g., Website Development" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the goods or services in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (ZAR)</Label>
                  <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" min="1" required />
                </div>
                <div>
                  <Label htmlFor="delivery">Delivery Timeline (days)</Label>
                  <Input id="delivery" type="number" placeholder="14" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} className="mt-1" min="1" required />
                </div>
              </div>

              <div>
                <Label htmlFor="seller">Seller Email</Label>
                <Input id="seller" type="email" placeholder="seller@example.com" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} className="mt-1" required />
              </div>
            </div>

            {/* Terms */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display font-semibold text-foreground mb-3">Terms of Agreement</h2>
              <div className="text-xs text-muted-foreground space-y-2 mb-4 max-h-40 overflow-y-auto bg-secondary/50 rounded-lg p-4">
                <p>1. The Buyer agrees to fund the escrow with the specified amount.</p>
                <p>2. Funds will be held securely by EscrowSA until both parties confirm transaction completion.</p>
                <p>3. The Seller must deliver the goods/services as described within the specified timeline.</p>
                <p>4. The Buyer must confirm receipt and satisfaction within 48 hours of delivery notification.</p>
                <p>5. Either party may open a dispute if terms are not met. Disputes will be reviewed by an admin mediator.</p>
                <p>6. Funds will only be released when both parties confirm, or by admin decision in case of dispute.</p>
                <p>7. EscrowSA is not liable for the quality of goods/services exchanged between parties.</p>
                <p>8. All transactions are subject to South African law and POPIA regulations.</p>
                <p>9. By proceeding, both parties agree to these terms and the full <Link to="/terms" className="text-accent hover:underline">Terms & Conditions</Link>.</p>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-accent"
                />
                <span className="text-sm text-foreground">
                  I agree to the escrow terms and <Link to="/terms" className="text-accent hover:underline">Terms & Conditions</Link>
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/5 border border-accent/20 rounded-lg p-3">
              <Shield className="w-4 h-4 text-accent flex-shrink-0" />
              <span>Your funds are protected by EscrowSA. Payment is processed securely via PayFast.</span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" className="flex-1" disabled={!agreed}>
                Create & Send to Seller
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateTransaction;
