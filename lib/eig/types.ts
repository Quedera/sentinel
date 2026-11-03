// QUEDERA SENTINEL — E-signature provider interface
//
// Pluggable interface so DocuSign / Adobe Sign / Dropbox Sign / mock all
// drop in via the EIG_PROVIDER env var. Mirrors the AuthProvider pattern
// (lib/auth/index.ts).
//
// The interface is shaped around our engagement state machine (§15 of the
// wireframe brief):
//
//   CONTRACT_UPLOADED → AWAITING_CONSULTANT → VIEWED → SIGNED → CONFIRMED
//   Branches: any state in [CONTRACT_UPLOADED, AWAITING_CONSULTANT, VIEWED]
//             can move to DECLINED or EXPIRED
//
// sendForSigning        — moves CONTRACT_UPLOADED → AWAITING_CONSULTANT
// verifyAndParseWebhook — reacts to VIEWED / SIGNED / DECLINED / VOIDED
// downloadSignedDocument — retrieves the executed PDF for audit storage
// voidEnvelope          — moves any pre-CONFIRMED state → DECLINED branch

export type EigEnvelopeStatus =
  | "created"
  | "sent"
  | "delivered"
  | "completed"
  | "declined"
  | "voided";

export interface SendForSigningRequest {
  /** The contract PDF as a Buffer (will be base64-encoded for the provider) */
  contractPdf: Buffer;
  /** Email of the signer (consultant in SENTINEL's flow) */
  signerEmail: string;
  /** Display name of the signer */
  signerName: string;
  /** Internal reference for our own mapping (e.g., engagement ID) */
  signerReference?: string;
  /** Subject line for the signer's email */
  emailSubject: string;
  /** Optional email body text */
  emailBlurb?: string;
}

export interface SendForSigningResult {
  /** Provider's envelope ID — store on the engagement for tracking */
  envelopeId: string;
  /** Initial status (typically 'sent') */
  status: EigEnvelopeStatus;
  /** Optional expiry timestamp; SENTINEL's policy is 5 days */
  expiresAt?: Date;
}

export interface EnvelopeStatusResult {
  envelopeId: string;
  status: EigEnvelopeStatus;
  signedAt?: Date;
  declinedAt?: Date;
  declinedReason?: string;
  signerEmail?: string;
}

export type EigEvent =
  | "sent"
  | "delivered"
  | "completed"
  | "declined"
  | "voided";

export interface EigWebhookEvent {
  envelopeId: string;
  event: EigEvent;
  timestamp: Date;
  signerEmail?: string;
  metadata?: Record<string, string>;
}

export interface EigProvider {
  /**
   * Send a contract PDF to a single signer for signature.
   * Returns an envelope handle we can track through to completion.
   *
   * The envelope expires per the provider's policy; SENTINEL's policy is
   * 5 days (matches the EXPIRED branch in our state machine).
   */
  sendForSigning(req: SendForSigningRequest): Promise<SendForSigningResult>;

  /**
   * Poll-style fetch of envelope status.
   * Useful as a fallback to webhook delivery (which is the primary signal).
   */
  getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResult>;

  /**
   * Verify the signature and parse an inbound webhook.
   * Returns null if the signature is invalid — caller should reject the webhook.
   */
  verifyAndParseWebhook(rawBody: string, signature: string): EigWebhookEvent | null;

  /**
   * Download the executed PDF (with signature applied).
   * Used for audit storage and customer-facing access post-CONFIRMED.
   */
  downloadSignedDocument(envelopeId: string): Promise<Buffer>;

  /**
   * Void the envelope (decline / cancel).
   * Moves the engagement to the DECLINED branch.
   */
  voidEnvelope(envelopeId: string, reason: string): Promise<void>;
}
