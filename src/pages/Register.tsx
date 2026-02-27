import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, User, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const Register = () => {
  const [role, setRole] = useState<"buyer" | "seller" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(160_55%_40%/0.12),transparent_60%)]" />
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
            <Shield className="w-9 h-9 text-accent-foreground" />
          </div>
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-3">Join EscrowSA</h2>
          <p className="text-primary-foreground/55 max-w-sm">Start transacting safely with buyers and sellers across South Africa.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">EscrowSA</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1 mb-6">Choose your role and get started</p>

          {/* Role selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: "buyer" as const, icon: ShoppingBag, label: "Buyer", desc: "Purchase safely" },
              { value: "seller" as const, icon: User, label: "Seller", desc: "Get paid securely" },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  role === r.value
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/30"
                }`}
              >
                <r.icon className={`w-5 h-5 mx-auto mb-1.5 ${role === r.value ? "text-accent" : "text-muted-foreground"}`} />
                <div className="font-display font-semibold text-sm text-foreground">{r.label}</div>
                <div className="text-[10px] text-muted-foreground">{r.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="address">Home Address</Label>
              <Input id="address" placeholder="123 Main St, Johannesburg" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" required />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={!role}>
              Create Account
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By registering, you agree to our{" "}
            <Link to="/terms" className="text-accent hover:underline">Terms</Link> and{" "}
            <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
          </p>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
