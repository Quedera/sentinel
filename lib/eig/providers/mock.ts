import { randomUUID } from "crypto";
import type {
  EigProvider,
  SendForSigningRequest,
  SendForSigningResult,
  EnvelopeStatusResult,
  EigWebhookEvent,
} from "../types";

/**
 * Mock e-sig provider for dev / scaffold mode.
 *
 * Typed-name only (same shape as Tier 1's typed-name placeholder). No real
 * signature capture — the envelope is auto-marked sent and can be queried
 * via getEnvelopeStatus for downstream state-machine testing.
 *
 * Select with: EIG_PROVIDER=mock (default).
 *
 * In-memory envelope store — not persistent across process restarts.
 * Acceptable for dev; never use in production.
 */
export class MockEigProvider implements EigProvider {
  private envelopes = new Map<
    string,
    {
      status: "sent" | "completed" | "declined";
      signedAt?: Date;
      declinedAt?: Date;
      declinedReason?: string;
      signerEmail: string;
      signerName: string;
    }
  >();

  async sendForSigning(
    req: SendForSigningRequest
  ): Promise<SendForSigningResult> {
    const envelopeId = `mock-${randomUUID()}`;
    this.envelopes.set(envelopeId, {
      status: "sent",
      signerEmail: req.signerEmail,
      signerName: req.signerName,
    });
    return {
      envelopeId,
      status: "sent",
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    };
  }

  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResult> {
    const env = this.envelopes.get(envelopeId);
    if (!env) {
      return { envelopeId, status: "voided" };
    }
    return {
      envelopeId,
      status: env.status,
      signedAt: env.signedAt,
      declinedAt: env.declinedAt,
      declinedReason: env.declinedReason,
      signerEmail: env.signerEmail,
    };
  }

  verifyAndParseWebhook(
    rawBody: string,
    _signature: string
  ): EigWebhookEvent | null {
    // Mock: trust all webhooks, parse JSON
    try {
      const parsed = JSON.parse(rawBody);
      return {
        envelopeId: parsed.envelopeId,
        event: parsed.event ?? "sent",
        timestamp: new Date(parsed.timestamp ?? Date.now()),
        signerEmail: parsed.signerEmail,
        metadata: parsed.metadata,
      };
    } catch {
      return null;
    }
  }

  async downloadSignedDocument(envelopeId: string): Promise<Buffer> {
    const env = this.envelopes.get(envelopeId);
    const status = env?.status ?? "unknown";
    // Minimal placeholder PDF — not a real signed document
    const body = `%PDF-1.4\n% Mock signed document\n% Envelope: ${envelopeId}\n% Status: ${status}\n%%EOF\n`;
    return Buffer.from(body);
  }

  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    this.envelopes.set(envelopeId, {
      status: "declined",
      declinedAt: new Date(),
      declinedReason: reason,
      signerEmail: "",
      signerName: "",
    });
  }
}
