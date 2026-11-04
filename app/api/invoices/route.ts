import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authProvider } from "@/lib/auth";
import { notifyUser } from "@/lib/notify/events";
import { invoiceIssued } from "@/lib/notify/templates";
import {
  buildInvoiceAmounts,
  buildInvoiceDraft,
  isInvoiceable,
  nextInvoiceNumber,
  type InvoiceAmounts,
} from "@/lib/invoicing";
import type {
  ApiResult,
  CreateInvoiceRequest,
  InvoiceResponse,
} from "@/lib/api/contract";

/**
 * GET /api/invoices
 *
 * Decision #4 (locked 2026-10-18): money flow is invoicing.
 *
 * Lists invoices visible to the caller:
 *   - CLIENT    -> invoices raised against their company
 *   - CONSULTANT-> invoices raised against them
 *   - ADMIN     -> every invoice
 *
 * POST /api/invoices
 *
 * Raises an invoice against an engagement. Only ADMIN or the client on the
 * engagement may raise one, and only once the engagement is CONFIRMED,
 * ACTIVE or COMPLETED — an expired or declined engagement is never billable.
 */
export async function GET(request: Request) {
  const session = await authProvider.resolveSession(extractToken(request));
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      } satisfies ApiResult<never>,
      { status: 401 }
    );
  }

  const where = await invoiceScope(session.id, session.role);
  if (!where) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "FORBIDDEN", message: "Not permitted" },
      } satisfies ApiResult<never>,
      { status: 403 }
    );
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const data: InvoiceResponse[] = invoices.map(toResponse);
  return NextResponse.json({ ok: true, data } satisfies ApiResult<InvoiceResponse[]>);
}

export async function POST(request: Request) {
  const session = await authProvider.resolveSession(extractToken(request));
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      } satisfies ApiResult<never>,
      { status: 401 }
    );
  }

  let body: CreateInvoiceRequest;
  try {
    body = (await request.json()) as CreateInvoiceRequest;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Invalid JSON body" },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: body.engagementId },
    include: {
      client: { include: { user: true } },
      consultant: { include: { user: true } },
    },
  });
  if (!engagement) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "NOT_FOUND", message: "Engagement not found" },
      } satisfies ApiResult<never>,
      { status: 404 }
    );
  }

  // ADMIN or the client on the engagement may raise the invoice.
  const isClient = engagement.client.userId === session.id;
  if (session.role !== "ADMIN" && !isClient) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "FORBIDDEN", message: "Only the client or an admin may raise an invoice" },
      } satisfies ApiResult<never>,
      { status: 403 }
    );
  }

  if (!isInvoiceable(engagement.status)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_STATE",
          message: "Cannot invoice an engagement in state " + engagement.status,
        },
      } satisfies ApiResult<never>,
      { status: 409 }
    );
  }

  const existing = await prisma.invoice.findFirst({
    where: { engagementId: engagement.id, status: { not: "VOID" } },
  });
  if (existing) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ALREADY_EXISTS",
          message: "An invoice already exists for this engagement",
        },
      } satisfies ApiResult<never>,
      { status: 409 }
    );
  }

  const draft = buildInvoiceDraft(engagement);
  const days = body.days ?? draft.days;
  const amounts = buildInvoiceAmounts(draft.dayRatePence, days);

  // The sequence is derived from the HIGHEST number already issued in the
  // period, not from a count. A count collides (Prisma P2002) as soon as an
  // invoice is deleted or voided — the counter drops and the next number
  // duplicates an existing one.
  const invoice = await createInvoiceWithRetry({
    engagementId: engagement.id,
    clientId: engagement.clientId,
    consultantId: engagement.consultantId,
    amounts,
    days,
    actorId: session.id,
    issuedAt: draft.issuedAt,
    dueAt: draft.dueAt,
  });
  const number = invoice.number;

  await notifyUser(session.id, engagement.client.user, (name) =>
    invoiceIssued(name, invoice.number, invoice.total, invoice.dueAt!.toISOString())
  );

  return NextResponse.json(
    { ok: true, data: toResponse(invoice) } satisfies ApiResult<InvoiceResponse>,
    { status: 201 }
  );
}

/**
 * Create an invoice, retrying on a number collision.
 *
 * Two concurrent requests can pick the same next sequence. The unique
 * constraint on `number` catches that, and the retry re-reads the current
 * maximum and tries again.
 */
async function createInvoiceWithRetry(args: {
  engagementId: string;
  clientId: string;
  consultantId: string;
  amounts: InvoiceAmounts;
  days: number;
  actorId: string;
  issuedAt: Date;
  dueAt: Date;
}): Promise<{
  id: string;
  number: string;
  engagementId: string;
  clientId: string;
  consultantId: string;
  status: string;
  currency: string;
  subtotal: number;
  vat: number;
  total: number;
  issuedAt: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;
}> {
  const ATTEMPTS = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const existingNumbers = await prisma.invoice.findMany({
      select: { number: true },
    });
    const number = nextInvoiceNumber(
      existingNumbers.map((i) => i.number),
      args.issuedAt
    );

    try {
      return await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: {
            number,
            engagementId: args.engagementId,
            clientId: args.clientId,
            consultantId: args.consultantId,
            status: "ISSUED",
            currency: args.amounts.currency,
            subtotal: args.amounts.subtotalPence,
            vat: args.amounts.vatPence,
            total: args.amounts.totalPence,
            issuedAt: args.issuedAt,
            dueAt: args.dueAt,
          },
        });

        await tx.auditEvent.create({
          data: {
            actorId: args.actorId,
            engagementId: args.engagementId,
            action: "INVOICE_ISSUED",
            resourceType: "invoice",
            resourceId: invoice.id,
            details:
              "number=" +
              invoice.number +
              ";days=" +
              args.days +
              ";total=" +
              args.amounts.totalPence +
              "p",
          },
        });

        return invoice;
      });
    } catch (err) {
      // P2002 = unique constraint on `number`. Another request took this
      // sequence; recompute and try again.
      const code = (err as { code?: string })?.code;
      if (code !== "P2002") throw err;
      lastError = err;
    }
  }

  throw lastError;
}

function toResponse(invoice: {
  id: string;
  number: string;
  engagementId: string;
  clientId: string;
  consultantId: string;
  status: string;
  currency: string;
  subtotal: number;
  vat: number;
  total: number;
  issuedAt: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;
}): InvoiceResponse {
  return {
    id: invoice.id,
    number: invoice.number,
    engagementId: invoice.engagementId,
    clientId: invoice.clientId,
    consultantId: invoice.consultantId,
    status: invoice.status,
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    vat: invoice.vat,
    total: invoice.total,
    issuedAt: invoice.issuedAt?.toISOString(),
    dueAt: invoice.dueAt?.toISOString(),
    paidAt: invoice.paidAt?.toISOString(),
  };
}

/**
 * Build the Prisma where clause limiting invoices to what the caller may see.
 * Returns null when the caller has no business seeing invoices at all.
 */
async function invoiceScope(userId: string, role: string) {
  if (role === "ADMIN") return {};
  if (role === "CLIENT") {
    const client = await prisma.client.findUnique({ where: { userId } });
    return client ? { clientId: client.id } : { id: "__none__" };
  }
  if (role === "CONSULTANT") {
    const consultant = await prisma.consultant.findUnique({ where: { userId } });
    return consultant ? { consultantId: consultant.id } : { id: "__none__" };
  }
  return null;
}

function extractToken(request: Request): string | undefined {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const cookie = request.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}
