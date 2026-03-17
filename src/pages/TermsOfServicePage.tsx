import PublicLayout from "../components/PublicLayout";
import { Scale, Banknote, AlertTriangle, UserCheck, Database, ShieldCheck } from "lucide-react";

const termsSections = [
  {
    icon: Scale,
    group: "Terms of Service",
    items: [
      {
        title: "Neutral Third Party",
        body: 'GigHold acts as a neutral intermediary. Funds are secured via escrow and only released upon fulfilment of agreed contract terms. Both parties must adhere to the specified conditions of their agreement.',
      },
      {
        title: "Transaction Finality",
        body: 'Once the client selects "Release Funds" and enters the PIN, the transaction is complete and irreversible. This ensures finality and prevents disputes regarding payment after confirmed completion.',
      },
      {
        title: "Dispute Mediation",
        body: 'In the event of a disagreement, GigHold will review uploaded evidence and provide an impartial resolution. Our admin team operates with strict neutrality to ensure fairness for both parties.',
      },
      {
        title: "User Accountability",
        body: 'Users must maintain verified profiles and pass KYC before transacting. Account holders are fully responsible for all activities conducted under their credentials.',
      },
    ],
  },
  {
    icon: ShieldCheck,
    group: "Privacy Policy",
    items: [
      {
        title: "Data Collection",
        body: 'We collect essential financial and identity verification data to comply with global standards for financial security and anti-money laundering regulations. Only the minimum required information is collected.',
      },
      {
        title: "Encryption",
        body: 'All personal and financial data is protected with 256-bit SSL/TLS encryption. Data in transit and at rest is secured using modern cryptography standards.',
      },
      {
        title: "Third-Party Sharing",
        body: 'Financial transactions are processed through PayFast. We do not sell your personal data. Any sharing is strictly limited to payment processors and compliance authorities as required by law.',
      },
      {
        title: "Cookie Policy",
        body: 'We use analytics (Google Analytics/Plausible) to improve user experience and perform A/B testing on our service flow. You may opt-out through your browser settings.',
      },
    ],
  },
  {
    icon: Database,
    group: "Data Retention & Compliance",
    items: [
      {
        title: "Seven-Year Policy",
        body: 'In accordance with financial regulations, all transaction records and evidence are retained for 7 years. This ensures compliance with tax and regulatory authorities.',
      },
      {
        title: "Unmodifiable Records",
        body: 'Historical transaction data cannot be modified or deleted once a deal is finalised. This ensures transparency and prevents tampering with evidence.',
      },
      {
        title: "Audit Trails",
        body: 'Every receipt generated includes an encrypted audit trail for tax and accounting purposes. This provides a complete, tamper-proof transaction history.',
      },
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Legal</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">Legal & Compliance</h1>
            <p className="text-muted-foreground">Last updated: March 4, 2026</p>
          </div>

          {/* ── Section groups ───────────────────────────────────────────── */}
          <div className="space-y-8">
            {termsSections.map(({ icon: Icon, group, items }) => (
              <div key={group} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Group header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-bold text-foreground">{group}</h2>
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {items.map(({ title, body }) => (
                    <div key={title} className="px-6 py-5">
                      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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