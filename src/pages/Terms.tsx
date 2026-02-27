import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/85">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">1. Introduction</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">EscrowSA provides a secure escrow service for transactions between buyers and sellers in South Africa. By using our platform, you agree to these Terms & Conditions in full.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">2. Escrow Services</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">EscrowSA acts as a neutral third party holding funds in trust. Funds are released only upon mutual confirmation by both buyer and seller, or by admin decision in the case of a dispute.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">3. User Obligations</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Users must provide accurate information, comply with South African law, and use the platform in good faith. Any fraudulent activity will result in immediate account suspension.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">4. Payment Processing</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Payments are processed through PayFast, a PCI DSS compliant payment gateway. EscrowSA does not store credit card information directly.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">5. Dispute Resolution</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Either party may open a dispute. Our admin team will review evidence from both parties and make a fair resolution. Dispute decisions are final and binding.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">6. Data Protection (POPIA)</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">We comply with the Protection of Personal Information Act (POPIA). Your personal data is processed lawfully and stored securely. See our Privacy Policy for full details.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">EscrowSA is not liable for the quality of goods or services exchanged between parties. Our liability is limited to the secure holding and release of escrowed funds.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
