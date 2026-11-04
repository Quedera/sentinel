// QUEDERA SENTINEL — notification events (decision #7)
//
// High-level helpers: build the message, send it through the configured
// provider, and record the outcome in the audit trail.
//
// Every helper returns the send result rather than throwing. A failed email
// must never roll back a contractual state change — the engagement move and
// the notification are deliberately decoupled. The audit event records the
// failure so an operator can retry.

import { prisma } from "@/lib/db";
import { notificationProvider } from "./index";
import type { NotificationMessage } from "./types";

export interface NotifyResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a notification and record it in the audit trail.
 *
 * @param actorId  The user whose action triggered the notification.
 * @param recipientEmail Address to notify.
 * @param message   The rendered message.
 */
export async function notify(
  actorId: string,
  recipientEmail: string,
  message: NotificationMessage
): Promise<NotifyResult> {
  const result = await notificationProvider.send({
    ...message,
    to: recipientEmail,
  });

  try {
    await prisma.auditEvent.create({
      data: {
        actorId,
        action: "NOTIFICATION_SENT",
        resourceType: "notification",
        resourceId: message.template,
        details: result.ok
          ? "to=" + recipientEmail + ";template=" + message.template
          : "to=" +
            recipientEmail +
            ";template=" +
            message.template +
            ";FAILED=" +
            (result.error ?? "unknown"),
      },
    });
  } catch (err) {
    // Never let an audit write failure mask the notification outcome.
    console.error("[notify] audit write failed:", err);
  }

  return result;
}

/**
 * Notify a user by their own email, using a message built for them.
 *
 * @param actorId    Who triggered it.
 * @param recipient  The user to notify.
 * @param build      Builds the message given the recipient's display name.
 */
export async function notifyUser(
  actorId: string,
  recipient: { id: string; email: string; displayName?: string | null },
  build: (displayName: string) => NotificationMessage
): Promise<NotifyResult> {
  const displayName = recipient.displayName ?? recipient.email;
  return notify(actorId, recipient.email, build(displayName));
}
