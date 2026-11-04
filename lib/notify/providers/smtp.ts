import nodemailer, { type Transporter } from "nodemailer";
import type {
  NotificationMessage,
  NotificationProvider,
  NotificationResult,
} from "../types";

/**
 * SmtpNotificationProvider — real email over SMTP.
 *
 * Activated with NOTIFY_PROVIDER=smtp. Reads standard SMTP env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD,
 *   NOTIFY_FROM
 *
 * A send failure is returned as { ok: false } rather than thrown, so a
 * transient mail outage cannot roll back a contractual state change. The
 * engagement transition and the notification are deliberately decoupled —
 * losing an email must never lose a signed contract.
 */
export class SmtpNotificationProvider implements NotificationProvider {
  readonly name = "smtp";
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
    });
  }

  async send(message: NotificationMessage): Promise<NotificationResult> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.NOTIFY_FROM ?? "SENTINEL <no-reply@sentinel.quedera.local>",
        to: message.toName ? `"${message.toName}" <${message.to}>` : message.to,
        subject: message.subject,
        text: message.body,
      });
      return { ok: true, messageId: info.messageId };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[notify:smtp] send failed for ${message.to}: ${error}`);
      return { ok: false, error };
    }
  }
}
