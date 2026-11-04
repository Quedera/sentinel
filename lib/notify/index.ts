import { ConsoleNotificationProvider } from "./providers/console";
import { SmtpNotificationProvider } from "./providers/smtp";
import type { NotificationProvider } from "./types";

/**
 * Pluggable notification provider selector.
 *
 * Reads NOTIFY_PROVIDER from env at module load and instantiates the
 * matching provider. Default is `console` so local development needs no
 * SMTP credentials and every notification is visible in the logs.
 *
 * Application code should ALWAYS import `notificationProvider` from this
 * file, never a concrete class — that way the transport is one env change.
 *
 * Set NOTIFY_PROVIDER=smtp for real delivery.
 */
const which = (process.env.NOTIFY_PROVIDER ?? "console").toLowerCase();

let instance: NotificationProvider;

switch (which) {
  case "smtp":
    instance = new SmtpNotificationProvider();
    break;
  case "console":
  default:
    instance = new ConsoleNotificationProvider();
    break;
}

export const notificationProvider: NotificationProvider = instance;

export type {
  NotificationMessage,
  NotificationProvider,
  NotificationResult,
  NotificationTemplate,
} from "./types";
