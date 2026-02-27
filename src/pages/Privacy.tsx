import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/85">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">We collect personal information you provide during registration (name, email, address) and transaction data necessary to facilitate escrow services.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Your data is used to provide escrow services, process payments, communicate transaction updates, resolve disputes, and comply with legal obligations.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">3. Data Protection (POPIA Compliance)</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">We comply fully with the Protection of Personal Information Act (POPIA). Your data is processed lawfully, stored securely with encryption, and retained only as long as necessary.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">4. Data Sharing</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">We share data only with payment processors (PayFast) for transaction processing and with law enforcement when legally required. We never sell your personal data.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">5. Your Rights</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">You have the right to access, correct, or delete your personal information. Contact us at privacy@escrowsa.co.za to exercise your rights under POPIA.</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">6. Security</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">We use industry-standard security measures including SSL/TLS encryption, secure password hashing, and regular security audits to protect your data.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
