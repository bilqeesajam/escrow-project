import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { Mail, Phone, Clock, Send, MessageSquare } from "lucide-react";
import PublicLayout from "../components/PublicLayout";

export default function ContactPage() {
  const [formData, setFormData]     = useState({ name: "", phone: "", email: "", message: "" });
  const [loading, setLoading]       = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success("Message sent! We'll be in touch within 24 hours.");
      setFormData({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* ── Header ────────────────────────────────────────────────── */}
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Support</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Get in Touch
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Our support specialists are here to ensure your deals run smoothly.
            </p>
          </div>

          {/* ── Two-column ───────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* Contact form */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Send a Message</h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                    <Input
                      name="name"
                      placeholder="Jane Smith"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="rounded-xl bg-background border-border focus:border-primary h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="+27 82 000 0000"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="rounded-xl bg-background border-border focus:border-primary h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="rounded-xl bg-background border-border focus:border-primary h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Message</label>
                  <textarea
                    name="message"
                    placeholder="Describe your issue or question…"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-sm resize-none transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl h-10 font-semibold"
                >
                  {loading
                    ? "Sending…"
                    : <><Send className="h-4 w-4 mr-2" /> Send Message</>}
                </Button>
              </form>
            </div>

            {/* Contact details + hours */}
            <div className="space-y-5">

              {/* Direct contacts */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
                  <h3 className="text-sm font-bold text-foreground">Contact Details</h3>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { icon: Phone, label: "Phone",  value: "+27 777 7777",          href: "tel:+27777777"                },
                    { icon: Mail,  label: "Email",  value: "support@gighold.com",   href: "mailto:support@gighold.com"   },
                  ].map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <a
                          href={href}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {value}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support hours */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Support Hours</h3>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { channel: "Chat Support",   hours: "24 / 7",             sub: "Always available"          },
                    { channel: "Phone Support",  hours: "9 AM – 6 PM",        sub: "GMT+2, Mon–Fri"            },
                    { channel: "Email Support",  hours: "Within 24 hours",    sub: "All days"                  },
                  ].map(({ channel, hours, sub }) => (
                    <div key={channel} className="flex items-center justify-between px-6 py-3.5">
                      <p className="text-sm text-muted-foreground">{channel}</p>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{hours}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response time note */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Urgent?</span> Call us directly for the fastest response. All disputes and escrow queries are prioritised.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}