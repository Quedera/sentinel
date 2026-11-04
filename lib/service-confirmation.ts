// QUEDERA SENTINEL — Sentinel Service Confirmation (decision #3)
//
// Locked 2026-10-18: "Profile verification should be when user or client
// registration when they sign the Sentinel Service Confirmation when
// subscribing to the service."
//
// So verification is not a separate KYC step — it happens at subscription.
// The user signs the Service Confirmation, which moves their verification
// status from PENDING to SERVICE_CONFIRMATION_SIGNED. A QUEDERA
// administrator then promotes them to VERIFIED.
//
// The signed record is retained so the audit trail can evidence consent.

/**
 * Current Service Confirmation document version.
 *
 * DECISION REQUIRED — the legal text and its version scheme need sign-off
 * from whoever owns the QUEDERA service terms. Bump this when the document
 * changes so the retained signature records which version was agreed to.
 */
export const CURRENT_SERVICE_CONFIRMATION_VERSION = "2026-11-01";

/**
 * The Service Confirmation text shown to the user at sign-up.
 *
 * Kept here so the version and the text move together — a version bump
 * without a text change would be a false record.
 */
export const SERVICE_CONFIRMATION_TEXT = [
  "SENTINEL SERVICE CONFIRMATION",
  "",
  "By signing, you confirm that the information you provide to QUEDERA",
  "SENTINEL is accurate and that you will keep it current.",
  "",
  "You confirm you have read and accept the QUEDERA SENTINEL service terms,",
  "the engagement process and the fee schedule. You understand that your",
  "professional profile, references and availability are held within the",
  "QUEDERA-controlled SENTINEL environment and are disclosed to clients",
  "according to your permission level rather than universally.",
  "",
  "You confirm that where you are a consultant, you are engaged on a",
  "contractual basis and that engagements are subject to the termination",
  "and penalty terms set out in the engagement contract.",
].join("\n");
