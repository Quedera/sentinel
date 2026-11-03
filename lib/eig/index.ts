import type { EigProvider } from "./types";
import { MockEigProvider } from "./providers/mock";
import { DocusignProvider } from "./providers/docusign";

/**
 * Pluggable e-sig provider selector.
 *
 * Reads EIG_PROVIDER from env at module load and instantiates the matching
 * provider. Default is `mock` (Tier 1 / dev).
 *
 * For Tier 2+, set EIG_PROVIDER=docusign in `.env.local` (along with the
 * DOCUSIGN_* creds — see `.env.example`).
 *
 * Application code should ALWAYS import `eigProvider` from this file, never
 * a concrete provider class — that way the swap is one env change.
 *
 * Mirrors the AuthProvider pattern (lib/auth/index.ts).
 */
const which = (process.env.EIG_PROVIDER ?? "mock").toLowerCase();

let instance: EigProvider;

switch (which) {
  case "docusign":
    instance = new DocusignProvider();
    break;
  case "mock":
  default:
    instance = new MockEigProvider();
    break;
}

export const eigProvider: EigProvider = instance;

export type {
  EigProvider,
  EigEnvelopeStatus,
  EigEvent,
  EigWebhookEvent,
  SendForSigningRequest,
  SendForSigningResult,
  EnvelopeStatusResult,
} from "./types";
