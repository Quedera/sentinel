// QUEDERA SENTINEL — invoicing (decision #4)
//
// Locked 2026-10-18: money flow is "invoicing".
//
// All money is handled as integer PENCE. Floating point pounds accumulate
// rounding error across a ledger, so every amount in this module and in the
// Invoice model is pence.

/**
 * UK standard VAT rate (20%).
 *
 * LOCKED 2026-11-04 (delegated to TACbot): 20%, invoiced GROSS — VAT is
 * added on top of the subtotal on the invoice. If the consultant is a VAT
 * registered supplier and should invoice net, change this one constant.
 */
export const VAT_RATE = 0.2;

/** Payment terms in days. LOCKED 2026-11-04 (delegated to TACbot): 14 days. */
export const DEFAULT_PAYMENT_TERMS_DAYS = 14;

export interface InvoiceDraft {
  engagementId: string;
  clientId: string;
  consultantId: string;
  /** Day rate in pence. */
  dayRatePence: number;
  /** Days being invoiced. */
  days: number;
  /** Description of the work being billed. */
  description: string;
  currency?: string;
  vatRate?: number;
  issuedAt?: Date;
  dueAt?: Date;
}

export interface InvoiceAmounts {
  subtotalPence: number;
  vatPence: number;
  totalPence: number;
  currency: string;
}

/**
 * Build the amounts for an invoice from pence-based inputs.
 */
export function buildInvoiceAmounts(
  dayRatePence: number,
  days: number,
  vatRate: number = VAT_RATE
): InvoiceAmounts {
  const subtotalPence = Math.round(dayRatePence * days);
  const vatPence = Math.round(subtotalPence * vatRate);
  return {
    subtotalPence,
    vatPence,
    totalPence: subtotalPence + vatPence,
    currency: "GBP",
  };
}

/**
 * Period key for invoice numbering — YYYYMM in UTC.
 */
export function invoicePeriod(issuedAt: Date = new Date()): string {
  const yyyy = issuedAt.getUTCFullYear();
  const mm = String(issuedAt.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}${mm}`;
}

/**
 * Extract the sequence from an invoice number, or null if it does not match
 * the expected <prefix>-<YYYYMM>-<NNN> shape.
 */
export function parseInvoiceSequence(
  number: string,
  prefix = "SENT"
): { period: string; sequence: number } | null {
  // Parsed by hand rather than by regex.
  //
  // A regex needs a doubled backslash to match digits, and that backslash is
  // fragile: it can be silently eaten by a shell heredoc, a Python string or
  // a JS template literal on the way to disk, leaving the pattern matching a
  // literal letter "d" instead of digits. That failure is invisible — the
  // regex simply never matches, the sequence stays at zero, and every
  // invoice collides on the same number.
  //
  // Comparing character codes cannot be mangled on the way to disk.
  const head = prefix + "-";
  if (!number.startsWith(head)) return null;

  const rest = number.slice(head.length);
  const dash = rest.lastIndexOf("-");
  if (dash <= 0) return null;

  const period = rest.slice(0, dash);
  const sequenceText = rest.slice(dash + 1);

  if (!isAllDigits(period) || !isAllDigits(sequenceText)) return null;

  return { period, sequence: Number(sequenceText) };
}

/**
 * True when every character is an ASCII digit. Deliberately avoids a regex.
 */
function isAllDigits(value: string): boolean {
  if (value.length === 0) return false;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 48 || code > 57) return false;
  }
  return true;
}

/**
 * Generate the next invoice number for a period.
 *
 * Format: SENT-<YYYYMM>-<sequential>. Sequential within a month so the
 * client can reference "invoice 003" unambiguously.
 *
 * IMPORTANT: the sequence is derived from the HIGHEST number already issued
 * in that period, NOT from a count of invoices. A count breaks the moment an
 * invoice is deleted or voided — the counter drops and the next invoice
 * collides with an existing number (Prisma P2002). Taking the max is
 * collision-safe against deletion.
 *
 * @param existingNumbers All invoice numbers currently in the system.
 */
export function nextInvoiceNumber(
  existingNumbers: string[],
  issuedAt: Date = new Date(),
  prefix = "SENT"
): string {
  const period = invoicePeriod(issuedAt);

  let highest = 0;
  for (const number of existingNumbers) {
    const parsed = parseInvoiceSequence(number, prefix);
    if (!parsed || parsed.period !== period) continue;
    if (parsed.sequence > highest) highest = parsed.sequence;
  }

  return `${prefix}-${period}-${String(highest + 1).padStart(3, "0")}`;
}

/**
 * Whether an engagement is in a state where an invoice may be raised.
 *
 * Billing only starts once the contract is signed and confirmed — an
 * engagement that expired or was declined is never billable.
 */
export function isInvoiceable(status: string): boolean {
  return ["CONFIRMED", "ACTIVE", "COMPLETED"].includes(status);
}

/**
 * Build a full invoice draft from an engagement.
 */
export function buildInvoiceDraft(
  engagement: {
    id: string;
    clientId: string;
    consultantId: string;
    dayRate: number;
    estimatedDays: number;
    role: string;
  },
  now: Date = new Date()
): Omit<InvoiceDraft, "issuedAt" | "dueAt"> & {
  issuedAt: Date;
  dueAt: Date;
} {
  const issuedAt = now;
  const dueAt = new Date(now.getTime() + DEFAULT_PAYMENT_TERMS_DAYS * 24 * 60 * 60 * 1000);
  return {
    engagementId: engagement.id,
    clientId: engagement.clientId,
    consultantId: engagement.consultantId,
    dayRatePence: engagement.dayRate * 100, // £ to pence
    days: engagement.estimatedDays,
    description: `Consulting engagement — ${engagement.role}`,
    currency: "GBP",
    issuedAt,
    dueAt,
  };
}
