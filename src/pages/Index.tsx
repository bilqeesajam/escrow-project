import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Shield,
  ArrowRight,
  Lock,
  Zap,
  CheckCircle,
  MapPin,
  Handshake,
  Truck,
  Search,
  Banknote,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useState, useMemo } from "react";

export default function Index() {
  const navLinkStyle = "relative hover:text-primary transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full";

  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const ThemeToggle = () => (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );

  const faqData = [
    { id: 'gs-1', category: 'Getting Started', question: "What is 'name'?", answer: "Your name is a unique identifier used to represent you on the platform. It helps other users identify you when working together on gigs." },
    { id: 'gs-2', category: 'Getting Started', question: 'Is my data safe?', answer: 'Yes, your data is protected with industry-standard encryption and security measures. We comply with data protection regulations and regularly audit our security systems.' },
    { id: 'gs-3', category: 'Getting Started', question: 'Who can use this?', answer: 'Anyone 18 years or older with a valid email address can create an account. Additional verification may be required depending on your role and location.' },
    { id: 'pp-1', category: 'Payments & Payouts', question: 'How do I fund a deal?', answer: 'You can fund a deal through your account dashboard by adding payment methods like credit/debit cards or bank transfers. Once a gig is accepted, funds are held in escrow.' },
    { id: 'pp-2', category: 'Payments & Payouts', question: 'When is money released?', answer: 'Money is released once the gig is marked as complete by both parties or the agreed-upon deadline is reached. You can request early release with mutual consent.' },
    { id: 'pp-3', category: 'Payments & Payouts', question: 'What if the currency is different?', answer: 'We automatically convert currencies at real-time exchange rates. Conversion fees may apply depending on your payment method and the currencies involved.' },
    { id: 'cm-1', category: 'Changes & Modifications', question: 'Can I change terms mid-deal?', answer: 'Yes, you can propose changes to terms during an active deal. Both parties must agree to modifications before they take effect.' },
    { id: 'cm-2', category: 'Changes & Modifications', question: "What counts as 'Proof of Delivery'?", answer: 'Proof of delivery can include photos, videos, documents, or any agreed-upon evidence that the work has been completed according to the gig specifications.' },
    { id: 'cm-3', category: 'Changes & Modifications', question: 'Can I change terms mid-deal?', answer: 'Yes, both parties must agree to any changes. Submit a modification request, and the other party must approve before changes take effect.' },
    { id: 'df-1', category: 'Disputes & Fees', question: 'What happens if there is a dispute?', answer: 'If a dispute arises, our resolution team will review the evidence from both parties and make a fair determination. The escrow funds will be released accordingly.' },
    { id: 'df-2', category: 'Disputes & Fees', question: 'How much does it cost?', answer: 'We charge a small platform fee (usually 2-3%) on completed gigs. There are no hidden fees, and all charges are clearly displayed before you confirm.' },
    { id: 'df-3', category: 'Disputes & Fees', question: 'Who pays the escrow fee?', answer: 'The escrow fee is typically split between both parties or paid by the buyer, depending on the agreement. This is negotiable and should be discussed upfront.' },
  ];

  const faqCategories = ['Getting Started', 'Payments & Payouts', 'Changes & Modifications', 'Disputes & Fees'];

  const filteredFAQ = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return faqData.filter((item) => item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query));
  }, [searchQuery]);

  const groupedFAQ = useMemo(() => {
    return faqCategories.map((category) => ({ category, items: filteredFAQ.filter((item) => item.category === category) }));
  }, [filteredFAQ]);

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              Gig<span className="text-primary">Hold</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="relative hover:text-primary transition-colors before:absolute before:bottom-[-4px] before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full">
              How it works
            </a>
            <a href="#features" className="relative hover:text-primary transition-colors before:absolute before:bottom-[-4px] before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full">
              Features
            </a>
            <a href="#faq" className="relative hover:text-primary transition-colors before:absolute before:bottom-[-4px] before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full">
              FAQ
            </a>
          </nav>

          {/* Auth & Theme Section */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {user ? (
              <>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>

        <section className="container py-20 md:py-32 text-center max-w-3xl mx-auto animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            The Service Marketplace<br />
            <span className="text-primary">With Built-In Escrow</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Post tasks, hire hustlers, and pay securely. Funds are held until the job is verified complete — protecting both parties.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/signup">Start for Free <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="container pb-20">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Lock, title: "Escrow Protection", desc: "Funds are held securely until the job is verified complete with a PIN." },
              { icon: Zap, title: "Fast Matching", desc: "Post a task and get matched with hustlers in your area instantly." },
              { icon: Shield, title: "Verified Users", desc: "All users go through KYC verification before accessing the platform." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-6 text-center space-y-3">
                <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="container py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-4">
                How it works
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Simple steps from agreement to payment. Both sides stay informed at every stage.
              </p>
            </div>

            <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-4 md:gap-6">
              {[
                {
                  title: "1. Post a Task",
                  description: "Create your gig with clear terms, budget, and timeline. Both parties agree to the conditions.",
                  Icon: Handshake,
                },
                {
                  title: "2. Hustler Accepts",
                  description: "A verified hustler accepts your task and confirms they're ready to deliver.",
                  Icon: CheckCircle,
                },
                {
                  title: "3. Payment Locked",
                  description: "You deposit payment via secure checkout. Funds are held safely by escrow until completion.",
                  Icon: Lock,
                },
                {
                  title: "4. Work Delivered",
                  description: "Hustler completes the work and delivers as agreed in the task terms.",
                  Icon: Truck,
                },
                {
                  title: "5. Funds Released",
                  description: "Review and approve the work, then release funds with a secure PIN. Done!",
                  Icon: Banknote,
                },
              ].map(({ Icon, title, description }, idx) => (
                <div key={title} className="rounded-xl border bg-card p-6 hover:border-primary transition-colors">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="container py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Find answers to common questions about GigHold
              </p>
              {/* Search Box */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search common questions here"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 bg-background border border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none h-11 rounded-lg transition-colors"
                />
              </div>
            </div>

            {/* FAQ Sections */}
            <div className="space-y-6">
              {groupedFAQ.map((section) => (
                section.items.length > 0 && (
                  <div key={section.category} className="border bg-card rounded-xl overflow-hidden hover:border-primary transition-colors">
                    <div className="bg-muted px-6 py-4 border-b">
                      <h3 className="text-lg font-semibold text-primary">
                        {section.category}
                      </h3>
                    </div>
                    <div className="px-6 py-4">
                      <Accordion type="single" collapsible className="w-full">
                        {section.items.map((item) => (
                          <AccordionItem key={item.id} value={item.id} className="border-border">
                            <AccordionTrigger className="text-left hover:no-underline hover:text-primary transition-colors py-3">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pt-2 pb-4">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                )
              ))}

              {filteredFAQ.length === 0 && (
                <div className="border bg-card rounded-xl p-8 text-center">
                  <p className="text-muted-foreground">
                    No results found for "<span className="text-primary">{searchQuery}</span>". Try different keywords.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-foreground">
                  Gig<span className="text-primary">Hold</span>
                </span>
              </Link>
              <p className="text-muted-foreground text-sm">
                Secure escrow for every gig transaction.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
                <a href="#features" className="hover:text-primary transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
                <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
                <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
                <Link to="/contact" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
                <Link to="/terms" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <Link to="/privacy" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} GigHold. All rights reserved.</span>
            <Link 
              to="/signup" 
              className={navLinkStyle}
            >
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
