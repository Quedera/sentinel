// QUEDERA SENTINEL — notification provider contract
//
// Decision #7 (locked 2026-10-18): notifications are delivered by EMAIL.
//
// Follows the same pluggable pattern as lib/auth, lib/eig and lib/storage:
// application code imports the provider from lib/notify/index.ts and never a
// concrete class, so the transport is swapped by env var alone.

export type NotificationTemplate =
  | "consultant_registered"
  | "service_confirmation_signed"
  | "hire_requested"
  | "contract_uploaded"
  | "contract_signed"
  | "engagement_declined"
  | "engagement_expired"
  | "invoice_issued"
  | "engagement_terminated";

export interface NotificationMessage {
  /** Recipient email address. */
  to: string;
  /** Recipient display name, used in the greeting. */
  toName?: string;
  subject: string;
  /** Plain-text body. */
  body: string;
  template: NotificationTemplate;
}

export interface NotificationResult {
  ok: boolean;
  /** Provider-specific id, e.g. the SMTP message id. */
  messageId?: string;
  error?: string;
}

export interface NotificationProvider {
  readonly name: string;
  send(message: NotificationMessage): Promise<NotificationResult>;
}
