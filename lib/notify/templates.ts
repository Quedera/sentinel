// QUEDERA SENTINEL — notification templates (decision #7)
//
// One builder per event. Kept separate from the transport so the copy can
// be reviewed without touching provider code, and so every notification
// SENTINEL sends has a defined subject and body.

import type { NotificationMessage } from "./types";

const PLATFORM = "QUEDERA SENTINEL";
const TAGLINE = "Trusted expertise. Controlled engagement.";

function footer(): string {
  return [
    "",
    "--",
    PLATFORM,
    TAGLINE,
    "",
    "This message was sent because you have an active SENTINEL account.",
    "If you believe you should not have received it, contact your QUEDERA administrator.",
  ].join("\n");
}

function day(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString().slice(0, 10);
}

function gbp(pence: number): string {
  return (pence / 100).toLocaleString("en-GB");
}

export interface HireRequestedContext {
  consultantName: string;
  clientName: string;
  role: string;
  startDate: string;
  endDate: string;
  days: number;
  dayRate: number;
  estimatedValue: number;
  responseDeadline: string;
}

export function hireRequested(ctx: HireRequestedContext): NotificationMessage {
  return {
    to: "",
    toName: ctx.consultantName,
    subject: "New consulting engagement request — " + ctx.role,
    template: "hire_requested",
    body:
      [
        "Hello " + ctx.consultantName + ",",
        "",
        "You have received a new consulting engagement request.",
        "",
        "  Client:     " + ctx.clientName,
        "  Role:       " + ctx.role,
        "  Start:      " + ctx.startDate,
        "  End:        " + ctx.endDate,
        "  Duration:   " + ctx.days + " days",
        "  Day rate:   £" + ctx.dayRate.toLocaleString("en-GB"),
        "  Value:      £" + ctx.estimatedValue.toLocaleString("en-GB"),
        "",
        "A contract has been provided for your review. You have until " +
          day(ctx.responseDeadline) +
          " to respond.",
        "",
        "Sign in to SENTINEL to review the contract and accept, or decline the request.",
      ].join("\n") + footer(),
  };
}

export function contractUploaded(
  consultantName: string,
  role: string,
  responseDeadline: string
): NotificationMessage {
  return {
    to: "",
    toName: consultantName,
    subject: "Contract ready for your review — " + role,
    template: "contract_uploaded",
    body:
      [
        "Hello " + consultantName + ",",
        "",
        'The contract for "' + role + '" is now available in SENTINEL.',
        "",
        "YOU HAVE 5 DAYS TO RESPOND. Response required by: " + day(responseDeadline),
        "",
        "Sign in to SENTINEL to review the contract and accept, or decline the request.",
      ].join("\n") + footer(),
  };
}

export function contractSigned(
  recipientName: string,
  otherParty: string,
  role: string,
  startDate: string
): NotificationMessage {
  return {
    to: "",
    toName: recipientName,
    subject: "Engagement confirmed — " + role,
    template: "contract_signed",
    body:
      [
        "Hello " + recipientName + ",",
        "",
        "Engagement confirmed.",
        "",
        "The contract has been signed and both parties have been notified.",
        "Your engagement is now recorded within QUEDERA SENTINEL.",
        "",
        "  Engagement:   " + role,
        "  Counterparty: " + otherParty,
        "  Start date:   " + startDate,
      ].join("\n") + footer(),
  };
}

export function engagementDeclined(
  recipientName: string,
  role: string,
  reason?: string
): NotificationMessage {
  const reasonLine = reason ? "\nReason given: " + reason + "\n" : "\n";
  return {
    to: "",
    toName: recipientName,
    subject: "Engagement request declined — " + role,
    template: "engagement_declined",
    body:
      [
        "Hello " + recipientName + ",",
        "",
        'The consulting engagement request for "' + role + '" has been declined.',
        reasonLine,
        "No further action is required.",
      ].join("\n") + footer(),
  };
}

export function engagementExpired(
  recipientName: string,
  role: string
): NotificationMessage {
  return {
    to: "",
    toName: recipientName,
    subject: "Engagement request expired — " + role,
    template: "engagement_expired",
    body:
      [
        "Hello " + recipientName + ",",
        "",
        'The consulting engagement request for "' + role + '" has expired.',
        "The 5-day response window passed without a response.",
        "No further action is required.",
      ].join("\n") + footer(),
  };
}

export function serviceConfirmationSigned(
  recipientName: string,
  version: string
): NotificationMessage {
  return {
    to: "",
    toName: recipientName,
    subject: "Your Sentinel Service Confirmation has been signed",
    template: "service_confirmation_signed",
    body:
      [
        "Hello " + recipientName + ",",
        "",
        "You have signed the Sentinel Service Confirmation (version " + version + ").",
        "",
        "Your account is now awaiting QUEDERA administrator verification.",
        "You can browse and register your profile while verification is pending.",
      ].join("\n") + footer(),
  };
}

export function invoiceIssued(
  recipientName: string,
  number: string,
  totalPence: number,
  dueAt: string
): NotificationMessage {
  return {
    to: "",
    toName: recipientName,
    subject: "Invoice " + number + " — £" + gbp(totalPence),
    template: "invoice_issued",
    body:
      [
        "Hello " + recipientName + ",",
        "",
        "Invoice " + number + " has been issued.",
        "",
        "  Amount due: £" + gbp(totalPence),
        "  Due date:   " + day(dueAt),
        "",
        "Sign in to SENTINEL to view the invoice.",
      ].join("\n") + footer(),
  };
}

export function engagementTerminated(
  recipientName: string,
  role: string,
  reason: string,
  penaltyPence: number,
  effectiveDate: string
): NotificationMessage {
  return {
    to: "",
    toName: recipientName,
    subject: "Engagement terminated — " + role,
    template: "engagement_terminated",
    body:
      [
        "Hello " + recipientName + ",",
        "",
        'The consulting engagement "' + role + '" has been terminated.',
        "",
        "  Reason:    " + reason,
        "  Penalty:   £" + gbp(penaltyPence),
        "  Effective: " + day(effectiveDate),
        "",
        "Sign in to SENTINEL for the full termination record.",
      ].join("\n") + footer(),
  };
}
