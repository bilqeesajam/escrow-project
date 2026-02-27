import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, ArrowRight, Users, FileCheck, Banknote, CheckCircle2, Eye, Zap } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(160_55%_40%/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(160_55%_40%/0.08),transparent_50%)]" />
        <div className="container mx-auto px-4 pt-28 pb-20 md:pt-36 md:pb-28 relative">
          <motion.div
            className="max-w-2xl"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-accent/15 border border-accent/25 rounded-full px-3 py-1 mb-6">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium text-accent">South Africa's Trusted Escrow Platform</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Protect Every
              <br />
              <span className="text-accent">Transaction</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mt-5 text-primary-foreground/65 text-lg max-w-lg leading-relaxed">
              Secure escrow for freelancers, product sales, and service contracts. Funds are held safely until both parties are satisfied.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/register">
                  Start Transacting
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/login">Log In</Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="mt-12 flex items-center gap-6 text-primary-foreground/50 text-xs">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> 256-bit encryption</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> POPIA compliant</span>
              <span className="flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5" /> PayFast secured</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              How It Works
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mt-3 max-w-md mx-auto">
              Four simple steps to secure any transaction
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: FileCheck, title: "Create Escrow", desc: "Buyer sets up the transaction with terms and price." },
              { icon: Banknote, title: "Fund Payment", desc: "Buyer pays securely via PayFast. Funds held in escrow." },
              { icon: CheckCircle2, title: "Deliver & Confirm", desc: "Seller delivers. Buyer confirms satisfaction." },
              { icon: Users, title: "Release Funds", desc: "Both parties agree, funds are released to seller." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative bg-card border border-border rounded-xl p-6 text-center hover:shadow-md hover:border-accent/30 transition-all group"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <step.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Built for Trust
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mt-3 max-w-md mx-auto">
              Every feature designed to protect your money and your peace of mind
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Dispute Resolution", desc: "Fair, transparent dispute process with admin mediation when needed." },
              { icon: Lock, title: "Bank-Grade Security", desc: "End-to-end encryption, secure webhooks, and HTTPS enforcement." },
              { icon: Eye, title: "Full Transparency", desc: "Real-time transaction tracking with complete audit trail." },
              { icon: Zap, title: "Instant Notifications", desc: "Email and in-app alerts at every step of the transaction." },
              { icon: FileCheck, title: "Digital Agreements", desc: "Signed terms stored as PDF for legal protection." },
              { icon: Banknote, title: "PayFast Integration", desc: "Secure payments through South Africa's trusted payment gateway." },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-md hover:border-accent/30 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <feat.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to Transact Safely?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-primary-foreground/60 mt-3 max-w-md mx-auto">
              Join thousands of South Africans who trust EscrowSA for secure transactions.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-8">
              <Button variant="hero" size="lg" asChild>
                <Link to="/register">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
