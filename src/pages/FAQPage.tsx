import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/AppLayout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, Shield } from 'lucide-react';
import { THEME } from '@/lib/theme';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    id: 'gs-1',
    category: 'Getting Started',
    question: "What is 'name'?",
    answer:
      "Your name is a unique identifier used to represent you on the platform. It helps other users identify you when working together on gigs.",
  },
  {
    id: 'gs-2',
    category: 'Getting Started',
    question: 'Is my data safe?',
    answer:
      'Yes, your data is protected with industry-standard encryption and security measures. We comply with data protection regulations and regularly audit our security systems.',
  },
  {
    id: 'gs-3',
    category: 'Getting Started',
    question: 'Who can use this?',
    answer:
      'Anyone 18 years or older with a valid email address can create an account. Additional verification may be required depending on your role and location.',
  },

  // Payments & Payouts
  {
    id: 'pp-1',
    category: 'Payments & Payouts',
    question: 'How do I fund a deal?',
    answer:
      'You can fund a deal through your account dashboard by adding payment methods like credit/debit cards or bank transfers. Once a gig is accepted, funds are held in escrow.',
  },
  {
    id: 'pp-2',
    category: 'Payments & Payouts',
    question: 'When is money released?',
    answer:
      'Money is released once the gig is marked as complete by both parties or the agreed-upon deadline is reached. You can request early release with mutual consent.',
  },
  {
    id: 'pp-3',
    category: 'Payments & Payouts',
    question: 'What if the currency is different?',
    answer:
      'We automatically convert currencies at real-time exchange rates. Conversion fees may apply depending on your payment method and the currencies involved.',
  },

  // Changes & Modifications
  {
    id: 'cm-1',
    category: 'Changes & Modifications',
    question: 'Can I change terms mid-deal?',
    answer:
      'Yes, you can propose changes to terms during an active deal. Both parties must agree to modifications before they take effect.',
  },
  {
    id: 'cm-2',
    category: 'Changes & Modifications',
    question: "What counts as 'Proof of Delivery'?",
    answer:
      'Proof of delivery can include photos, videos, documents, or any agreed-upon evidence that the work has been completed according to the gig specifications.',
  },
  {
    id: 'cm-3',
    category: 'Changes & Modifications',
    question: 'Can I change terms mid-deal?',
    answer:
      'Yes, both parties must agree to any changes. Submit a modification request, and the other party must approve before changes take effect.',
  },

  // Disputes & Fees
  {
    id: 'df-1',
    category: 'Disputes & Fees',
    question: 'What happens if there is a dispute?',
    answer:
      'If a dispute arises, our resolution team will review the evidence from both parties and make a fair determination. The escrow funds will be released accordingly.',
  },
  {
    id: 'df-2',
    category: 'Disputes & Fees',
    question: 'How much does it cost?',
    answer:
      'We charge a small platform fee (usually 2-3%) on completed gigs. There are no hidden fees, and all charges are clearly displayed before you confirm.',
  },
  {
    id: 'df-3',
    category: 'Disputes & Fees',
    question: 'Who pays the escrow fee?',
    answer:
      'The escrow fee is typically split between both parties or paid by the buyer, depending on the agreement. This is negotiable and should be discussed upfront.',
  },
];

const categories = [
  'Getting Started',
  'Payments & Payouts',
  'Changes & Modifications',
  'Disputes & Fees',
];

export default function FAQPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQ = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return faqData.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const groupedFAQ = useMemo(() => {
    return categories.map((category) => ({
      category,
      items: filteredFAQ.filter((item) => item.category === category),
    }));
  }, [filteredFAQ]);

  const content = (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">FAQs</h1>
        <p className="text-[#c0c0c0]">
          Find answers to common questions about GigHold
        </p>
      </div>

      {/* Search Box */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#c0c0c0]" />
        <Input
          placeholder="Search common questions here"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 bg-[#232c40] border border-[#3a4456] text-white placeholder:text-[#8b95ac] focus:border-[#f5b800] h-11 rounded-lg"
        />
      </div>

      {/* FAQ Sections */}
      <div className="space-y-6">
        {groupedFAQ.map((section) => (
          <div key={section.category} className="bg-[#232c40] border border-[#3a4456] rounded-xl overflow-hidden hover:border-[#f5b800]/50 transition-colors">
            <div className="bg-[#1a2235] px-6 py-4 border-b border-[#3a4456]">
              <h2 className="text-lg font-semibold text-[#f5b800]">
                {section.category}
              </h2>
            </div>
            <div className="px-6 py-4">
              {section.items.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item) => (
                    <AccordionItem key={item.id} value={item.id} className="border-[#3a4456]">
                      <AccordionTrigger className="text-left hover:no-underline text-white hover:text-[#f5b800] transition-colors py-3">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[#c0c0c0] pt-2 pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-[#8b95ac] italic py-4">
                  No questions match your search in this category.
                </p>
              )}
            </div>
          </div>
        ))}

        {filteredFAQ.length === 0 && (
          <div className="bg-[#232c40] border border-[#3a4456] rounded-xl p-8 text-center">
            <p className="text-[#c0c0c0]">
              No results found for "<span className="text-[#f5b800]">{searchQuery}</span>". Try different keywords.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // If user is authenticated, use AppLayout with custom styling
  if (user) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">FAQ</h1>
            <p className="text-muted-foreground">
              Find answers to common questions about GigHold
            </p>
          </div>

          {/* Search Box */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search common questions here"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>

          {/* FAQ Sections */}
          <div className="space-y-6">
            {groupedFAQ.map((section) => (
              <div key={section.category} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
                <div className="bg-muted px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-primary">
                    {section.category}
                  </h2>
                </div>
                <div className="px-6 py-4">
                  {section.items.length > 0 ? (
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
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-4">
                      No questions match your search in this category.
                    </p>
                  )}
                </div>
              </div>
            ))}

            {filteredFAQ.length === 0 && (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground">
                  No results found for "<span className="text-primary">{searchQuery}</span>". Try different keywords.
                </p>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }
const navLinkStyle = "relative hover:text-primary transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-primary before:transition-[width] before:duration-300 hover:before:w-full";
  // For non-authenticated users, use a simple layout with header
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1a2b] to-[#1a2235]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1a2b] border-b border-[#232c40]">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent border border-[#f5b800]">
              <Shield className="h-5 w-5 text-[#f5b800]" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">GigHold</span>
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

          {/* Auth Section */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-[#c0c0c0] hover:text-white hover:bg-[#232c40]">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-[#f5b800] text-[#0f1a2b] hover:bg-yellow-400">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-16">
        {content}
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

