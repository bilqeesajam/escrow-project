import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { THEME } from "@/lib/theme";

export default function Footer() {
  return (
    <footer style={{ 
      borderTopColor: THEME.primary.cardBlue, 
      backgroundColor: THEME.primary.darkNavy 
    }} className="border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent border" style={{ borderColor: THEME.primary.gold }}>
                <Shield className="h-4 w-4" style={{ color: THEME.primary.gold }} />
              </div>
              <span className="font-bold text-white">GigHold</span>
            </Link>
            <p className="text-sm" style={{ color: THEME.text.primary }}>Secure escrow for every gig transaction.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <div className="space-y-3 text-sm" style={{ color: THEME.text.primary }}>
              <Link to="/#features" className="hover:transition-colors block" style={{ '--tw-text-hover': THEME.primary.gold } as any}>Features</Link>
              <Link to="/#how-it-works" className="block hover:transition-colors" style={{ '--tw-text-hover': THEME.primary.gold } as any}>How it Works</Link>
              <Link to="/#faq" className="block hover:transition-colors" style={{ '--tw-text-hover': THEME.primary.gold } as any}>FAQ</Link>
              <Link to="/pricing" className="block hover:transition-colors" style={{ '--tw-text-hover': THEME.primary.gold } as any}>Pricing</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <div className="space-y-3 text-sm" style={{ color: THEME.text.primary }}>
              <Link to="/contact" onClick={() => window.scrollTo(0, 0)} className="block hover:transition-colors" style={{ '--tw-text-hover': THEME.primary.gold } as any}>Contact Us</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <div className="space-y-3 text-sm" style={{ color: THEME.text.primary }}>
              <Link to="/terms" onClick={() => window.scrollTo(0, 0)} className="block hover:transition-colors" style={{ '--tw-text-hover': THEME.primary.gold } as any}>Terms of Service</Link>
              <Link to="/privacy" onClick={() => window.scrollTo(0, 0)} className="block hover:transition-colors" style={{ '--tw-text-hover': THEME.primary.gold } as any}>Privacy Policy</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTopColor: THEME.primary.cardBlue, color: THEME.text.primary }} className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <span>© {new Date().getFullYear()} GigHold. All rights reserved.</span>
          <Link to="/signup" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:transition-[width] before:duration-300 hover:before:w-full" style={{ '--tw-before-bg-color': THEME.primary.gold } as any}>Get started</Link>
        </div>
      </div>
    </footer>
  );
}
