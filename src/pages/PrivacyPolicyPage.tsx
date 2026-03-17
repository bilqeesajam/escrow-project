import PublicLayout from "../components/PublicLayout";
import { Lock, Database, Share2, Trash2, UserCheck, Mail } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "1. Information We Collect",
    content: (
      <ul className="space-y-2 text-sm text-muted-foreground list-none">
        {[
          "Personal identification: name, email, phone number",
          "Financial information: bank account and payment card details",
          "Identity verification documents: government-issued ID, proof of address",
          "Transaction history and dispute resolution records",
          "Device information and usage analytics",
        ].map(item => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    icon: UserCheck,
    title: "2. How We Use Your Information",
    content: (
      <ul className="space-y-2 text-sm text-muted-foreground list-none">
        {[
          "Process and manage transactions and escrow payments",
          "Verify user identity and prevent fraud",
          "Provide customer support and resolve disputes",
          "Comply with legal and regulatory requirements",
          "Improve our services and user experience",
          "Send important notifications about your account",
        ].map(item => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    icon: Lock,
    title: "3. Data Security",
    content: (
      <ul className="space-y-2 text-sm text-muted-foreground list-none">
        {[
          "256-bit SSL/TLS encryption for all data in transit",
          "Encrypted storage for data at rest",
          "Two-factor authentication (2FA) for account access",
          "Regular security audits and penetration testing",
          "Limited employee access to sensitive data",
          "Secure data disposal procedures",
        ].map(item => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    icon: Share2,
    title: "4. Third-Party Disclosure",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>We do not sell, trade, or rent your personal information to third parties. We only share information:</p>
        <ul className="space-y-2 list-none">
          {[
            "With PayFast to process payments",
            "With legal authorities when required by law",
            "With dispute resolution specialists when needed",
            "With service providers under strict confidentiality agreements",
          ].map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    icon: Trash2,
    title: "5. Data Retention",
    content: (
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { label: "Transaction records",    period: "7 years (regulatory)" },
          { label: "Account information",    period: "Account duration + 2 years" },
          { label: "Communication logs",     period: "2 years"              },
          { label: "Marketing preferences",  period: "Until opt-out"        },
        ].map(({ label, period }) => (
          <div key={label} className="rounded-xl bg-muted/40 border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-foreground">{period}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: UserCheck,
    title: "6. Your Rights",
    content: (
      <ul className="space-y-2 text-sm text-muted-foreground list-none">
        {[
          "Access your personal data at any time",
          "Request corrections to inaccurate information",
          "Request deletion of your account (subject to legal holds)",
          "Opt-out of marketing communications",
          "Port your data to another service",
        ].map(item => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Legal</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: March 4, 2026</p>
          </div>

          {/* ── Sections ────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {sections.map(({ icon: Icon, title, content }) => (
              <div key={title} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-bold text-foreground">{title}</h2>
                </div>
                <div className="px-6 py-5">{content}</div>
              </div>
            ))}
          </div>

          {/* ── Contact ─────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Contact Us</h2>
            </div>
            <div className="px-6 py-5 grid sm:grid-cols-3 gap-4">
              {[
                { label: "Email",   value: "privacy@gighold.com" },
                { label: "Phone",   value: "+27 777 7777"        },
                { label: "Address", value: "GigHold Support, South Africa" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-muted/40 border border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Version stamp ───────────────────────────────────────────── */}
          <p className="text-center text-xs text-muted-foreground">
            Last Updated: March 4, 2026 · Version 2.4.0
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}