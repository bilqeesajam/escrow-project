import jsPDF from "jspdf";
import type { Tables } from "../integrations/supabase/types";

type Gig     = Tables<"gigs">;
type Profile = Tables<"profiles">;

interface ReceiptData {
  gig:            Gig;
  hustlerProfile: Profile | null;
  clientProfile:  Profile | null;
}

/** Formats a number as ZAR, e.g. "R 120.00" */
const zar = (n: number | null | undefined) =>
  n != null ? `R ${Number(n).toFixed(2)}` : "—";

/** Draws a thin horizontal rule */
const rule = (doc: jsPDF, y: number) => {
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
};

export function generateReceipt({ gig, hustlerProfile, clientProfile }: ReceiptData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Palette ───────────────────────────────────────────────────────────────
  const PRIMARY   = [79, 70, 229] as const;   // indigo-600
  const DARK      = [15, 15, 20]  as const;
  const MID       = [100, 100, 110] as const;
  const LIGHT_BG  = [248, 248, 250] as const;

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Receipt", 20, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("GigHold  •  gighold.app", 20, 23);
  doc.text(`Receipt ID: ${gig.id}`, 20, 29);

  // ── Date + Status badge ───────────────────────────────────────────────────
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-ZA")}`,
    190, 10, { align: "right" }
  );
  doc.text(
    `Gig date:  ${new Date(gig.created_at).toLocaleDateString("en-ZA")}`,
    190, 16, { align: "right" }
  );

  const statusLabel = (gig.status ?? "unknown").replace(/_/g, " ").toUpperCase();
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(152, 22, 38, 8, 2, 2, "F");
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(statusLabel, 171, 27.5, { align: "center" });

  let y = 46;

  // ── Gig summary ───────────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT_BG);
  doc.rect(20, y, 170, 22, "F");

  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  // Capitalize first letter of each word
  const gigTitle = gig.title
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  doc.text(gigTitle, 25, y + 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID);
  const meta = [
    gig.category ? `Category: ${gig.category}` : null,
    gig.location  ? `Location: ${gig.location}`  : null,
  ]
    .filter(Boolean)
    .join("   |   ");
  doc.text(meta, 25, y + 15);

  y += 30;

  // ── Parties ───────────────────────────────────────────────────────────────
  const col2 = 110;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MID);
  doc.text("CLIENT", 20, y);
  doc.text("SELLER (HUSTLER)", col2, y);
  y += 5;

  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(clientProfile?.full_name  ?? "Unknown", 20,    y);
  doc.text(hustlerProfile?.full_name ?? "Unassigned", col2, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MID);
  doc.text(`KYC: ${clientProfile?.kyc_status  ?? "—"}`, 20,    y);
  doc.text(`KYC: ${hustlerProfile?.kyc_status ?? "—"}`, col2, y);

  y += 10;
  rule(doc, y);
  y += 8;

  // ── Pricing breakdown ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MID);
  doc.text("PAYMENT BREAKDOWN", 20, y);
  y += 6;

  const rows: [string, string][] = [];

  // Use pricing fields when available, fall back to budget
  const subtotal   = gig.pricing_subtotal   ?? gig.budget;
  const feeAmt     = gig.pricing_fee        ?? null;
  const total      = gig.pricing_total      ?? gig.budget;
  const feePct     = gig.platform_fee_percentage ?? null;
  const adjPct     = gig.pricing_adjustment_pct ?? null;
  const complexity = gig.pricing_complexity_multiplier ?? null;

  rows.push(["Subtotal", zar(subtotal)]);
  if (adjPct != null && adjPct !== 0)
    rows.push([`Pricing adjustment (${adjPct > 0 ? "+" : ""}${adjPct}%)`, "—"]);
  if (complexity != null && complexity !== 1)
    rows.push([`Complexity multiplier`, `×${Number(complexity).toFixed(2)}`]);
  if (feeAmt != null)
    rows.push([`Platform fee${feePct != null ? ` (${feePct}%)` : ""}`, zar(feeAmt)]);
  rows.push(["TOTAL CHARGED", zar(total)]);

  rows.forEach(([label, value], i) => {
    const isTotal = label.startsWith("TOTAL");
    if (isTotal) {
      doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    } else if (i % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
    }
    doc.rect(20, y - 4, 170, 7, "F");

    doc.setTextColor(isTotal ? 255 : DARK[0], isTotal ? 255 : DARK[1], isTotal ? 255 : DARK[2]);
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(isTotal ? 10 : 9);
    doc.text(label, 25, y + 0.5);
    doc.text(value, 185, y + 0.5, { align: "right" });
    y += 7;
  });

  y += 6;
  rule(doc, y);
  y += 8;

  // ── What the hustler receives ─────────────────────────────────────────────
  const hustlerPay = feeAmt != null ? total - feeAmt : subtotal;

  doc.setFillColor(...LIGHT_BG);
  doc.rect(20, y, 170, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MID);
  doc.text("HUSTLER PAYOUT", 25, y + 5);
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text(zar(hustlerPay), 185, y + 5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MID);
  doc.text("Amount credited to hustler wallet upon completion", 25, y + 11);

  y += 22;

  // ── Notes ────────────────────────────────────────────────────────────────
  if (gig.description) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MID);
    doc.text("GIG DESCRIPTION", 20, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(gig.description, 170) as string[];
    doc.text(lines, 20, y);
    y += lines.length * 4 + 4;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(...PRIMARY);
  doc.rect(0, pageH - 14, 210, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("This receipt is auto-generated by Hustlr. For disputes contact support@hustlr.app", 105, pageH - 6, { align: "center" });

  // ── Save ──────────────────────────────────────────────────────────────────
  const filename = `receipt-${gig.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}