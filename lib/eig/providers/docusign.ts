import * as docusign from "docusign-esign";
import { createHmac, timingSafeEqual } from "crypto";
import type {
  EigProvider,
  SendForSigningRequest,
  SendForSigningResult,
  EnvelopeStatusResult,
  EigWebhookEvent,
  EigEnvelopeStatus,
  EigEvent,
} from "../types";

/**
 * DocuSign e-sig provider using JWT Grant flow.
 *
 * Required env vars (set EIG_PROVIDER=docusign):
 *   DOCUSIGN_INTEGRATION_KEY  — Integration Key (client ID) from DocuSign admin
 *   DOCUSIGN_USER_ID          — User ID we're impersonating via JWT
 *   DOCUSIGN_ACCOUNT_ID       — API Account ID
 *   DOCUSIGN_RSA_PRIVATE_KEY  — RSA private key contents (PEM)
 *
 * Optional:
 *   DOCUSIGN_BASE_PATH        — default 'https://demo.docusign.net/restapi' (sandbox)
 *   DOCUSIGN_AUTH_SERVER      — default 'account-d.docusign.com' (sandbox OAuth host)
 *   DOCUSIGN_WEBHOOK_HMAC_KEY — HMAC secret for Connect webhook verification
 *
 * One-time setup:
 *   1. Create a Developer sandbox account at https://developers.docusign.com/
 *   2. Create an Integration Key, add a Service Integration user
 *   3. Generate an RSA keypair (openssl genrsa); upload public key to DocuSign admin
 *   4. Grant consent once via browser:
 *      https://account-d.docusign.com/oauth/auth?response_type=code
 *        &scope=signature%20impersonation
 *        &client_id=INTEGRATION_KEY
 *        &redirect_uri=http://localhost
 *   5. Drop creds into env (file-on-NAS pattern)
 *
 * For production: swap DOCUSIGN_BASE_PATH and DOCUSIGN_AUTH_SERVER to the
 * DocuSign production endpoints and re-issue the consent grant.
 *
 * Note: docusign-esign's @types package exposes all data shapes as interfaces
 * (not classes) — so we use plain object literals, not `new`/`constructFromObject`.
 */
export class DocusignProvider implements EigProvider {
  private readonly apiClient: docusign.ApiClient;
  private readonly integrationKey: string;
  private readonly userId: string;
  private readonly accountId: string;
  private readonly webhookHmacKey?: string;

  constructor() {
    this.integrationKey = required("DOCUSIGN_INTEGRATION_KEY");
    this.userId = required("DOCUSIGN_USER_ID");
    this.accountId = required("DOCUSIGN_ACCOUNT_ID");
    this.webhookHmacKey = process.env.DOCUSIGN_WEBHOOK_HMAC_KEY;

    this.apiClient = new docusign.ApiClient();
    this.apiClient.setBasePath(
      process.env.DOCUSIGN_BASE_PATH ?? "https://demo.docusign.net/restapi"
    );
  }

  /** Authenticate via JWT and cache the access token on the API client. */
  private async authenticate(): Promise<void> {
    const privateKey = required("DOCUSIGN_RSA_PRIVATE_KEY");

    const result = await this.apiClient.requestJWTUserToken(
      this.integrationKey,
      this.userId,
      ["signature", "impersonation"],
      Buffer.from(privateKey),
      3600
    );

    const accessToken = result.body.access_token;
    this.apiClient.addDefaultHeader("Authorization", `Bearer ${accessToken}`);
  }

  async sendForSigning(
    req: SendForSigningRequest
  ): Promise<SendForSigningResult> {
    await this.authenticate();

    const envelopeApi = new docusign.EnvelopesApi(this.apiClient);

    const document: docusign.Document = {
      documentBase64: req.contractPdf.toString("base64"),
      name: "Engagement Contract",
      fileExtension: "pdf",
      documentId: "1",
    };

    const signHere: docusign.SignHere = {
      anchorString: "/sn1/",
      anchorYOffset: "10",
      anchorUnits: "pixels",
      anchorXOffset: "20",
    };

    const signer: docusign.Signer = {
      email: req.signerEmail,
      name: req.signerName,
      recipientId: "1",
      routingOrder: "1",
      tabs: { signHereTabs: [signHere] },
    };

    const recipients: docusign.Recipients = {
      signers: [signer],
    };

    const envelopeDefinition: docusign.EnvelopeDefinition = {
      emailSubject: req.emailSubject,
      emailBlurb: req.emailBlurb,
      documents: [document],
      recipients,
      status: "sent",
    };

    if (req.signerReference) {
      envelopeDefinition.customFields = {
        textCustomFields: [
          {
            name: "engagement_id",
            value: req.signerReference,
            required: "false",
            show: "false",
          },
        ],
      };
    }

    const result = await envelopeApi.createEnvelope(this.accountId, {
      envelopeDefinition,
    });

    return {
      envelopeId: result.envelopeId!,
      status: mapStatus(result.status!),
    };
  }

  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResult> {
    await this.authenticate();

    const envelopeApi = new docusign.EnvelopesApi(this.apiClient);
    const envelope = await envelopeApi.getEnvelope(
      this.accountId,
      envelopeId,
      {}
    );

    return {
      envelopeId,
      status: mapStatus(envelope.status!),
      signedAt: envelope.completedDateTime
        ? new Date(envelope.completedDateTime)
        : undefined,
      declinedAt: envelope.declinedDateTime
        ? new Date(envelope.declinedDateTime)
        : undefined,
      // declinedReason lives on the Recipient, not the Envelope —
      // surfaced via webhook or `getRecipients()` when needed.
    };
  }

  verifyAndParseWebhook(
    rawBody: string,
    signature: string
  ): EigWebhookEvent | null {
    if (this.webhookHmacKey) {
      const expected = computeHmac(this.webhookHmacKey, rawBody);
      if (!timingSafeEqualValues(expected, signature)) {
        return null;
      }
    }

    try {
      const parsed = JSON.parse(rawBody);
      return {
        envelopeId: parsed.data?.envelopeId ?? parsed.envelopeId,
        event: (parsed.event ?? "sent") as EigEvent,
        timestamp: new Date(
          parsed.generatedDateTime ?? parsed.timestamp ?? Date.now()
        ),
        signerEmail: parsed.data?.recipientEmail ?? parsed.signerEmail,
        metadata: parsed.data?.customFields?.textCustomFields
          ? Object.fromEntries(
              parsed.data.customFields.textCustomFields.map(
                (f: { name: string; value: string }) => [f.name, f.value]
              )
            )
          : undefined,
      };
    } catch {
      return null;
    }
  }

  async downloadSignedDocument(envelopeId: string): Promise<Buffer> {
    await this.authenticate();

    const envelopeApi = new docusign.EnvelopesApi(this.apiClient);
    const result = await envelopeApi.getDocument(
      this.accountId,
      envelopeId,
      "combined", // signed PDF with all docs combined
      {}
    );

    return Buffer.isBuffer(result)
      ? result
      : Buffer.from(result as string, "binary");
  }

  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    await this.authenticate();

    const envelopeApi = new docusign.EnvelopesApi(this.apiClient);

    const envelope: docusign.Envelope = {
      status: "voided",
      voidedReason: reason,
    };

    await envelopeApi.update(this.accountId, envelopeId, { envelope });
  }
}

function mapStatus(docuSignStatus: string): EigEnvelopeStatus {
  switch (docuSignStatus) {
    case "created":
      return "created";
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "completed":
      return "completed";
    case "declined":
      return "declined";
    case "voided":
      return "voided";
    default:
      return "sent";
  }
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`[DocusignProvider] Missing required env var: ${name}`);
  }
  return v;
}

function computeHmac(key: string, body: string): string {
  return createHmac("sha256", key).update(body).digest("base64");
}

function timingSafeEqualValues(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
