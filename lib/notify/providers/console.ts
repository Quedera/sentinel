import type {
  NotificationMessage,
  NotificationProvider,
  NotificationResult,
} from "../types";

/**
 * ConsoleNotificationProvider — local development / audit transport.
 *
 * Writes the full rendered message to stdout. This is the default so that
 * local development never needs SMTP credentials and so the audit trail can
 * be eyeballed while exercising the engagement workflow.
 *
 * Deliberately not a "silent no-op": every notification that SENTINEL
 * believes it has sent is printed, so a mis-wired flow is visible.
 */
export class ConsoleNotificationProvider implements NotificationProvider {
  readonly name = "console";

  async send(message: NotificationMessage): Promise<NotificationResult> {
    const stamp = new Date().toISOString();
    console.log(
      [
        `[notify:${this.name}] ${stamp}`,
        `  template: ${message.template}`,
        `  to:      ${message.toName ? `${message.toName} <${message.to}>` : message.to}`,
        `  subject: ${message.subject}`,
        "  body:",
        ...message.body.split("\n").map((line) => `    | ${line}`),
      ].join("\n")
    );
    return { ok: true, messageId: `console-${Date.now()}` };
  }
}
