import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-display font-bold text-lg">EscrowSA</span>
            </div>
            <p className="text-primary-foreground/60 text-sm max-w-sm">
              South Africa's trusted escrow platform. Protecting buyers and sellers with secure, transparent transactions.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 text-sm">Platform</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/60">
              <Link to="/register" className="hover:text-primary-foreground transition-colors">Get Started</Link>
              <a href="#how-it-works" className="hover:text-primary-foreground transition-colors">How It Works</a>
              <a href="#features" className="hover:text-primary-foreground transition-colors">Features</a>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 text-sm">Legal</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/60">
              <Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms & Conditions</Link>
              <Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-xs text-primary-foreground/40 flex flex-col sm:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} EscrowSA. All rights reserved.</p>
          <p>POPIA Compliant · South African Regulations</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
