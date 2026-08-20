import type { AuthProvider } from "./types";
import { NoOpAuthProvider } from "./providers/noop";
import { NextAuthProvider } from "./providers/nextauth";
import { EntraAuthProvider } from "./providers/entra";

/**
 * Pluggable auth provider selector.
 *
 * Reads AUTH_PROVIDER from env at module load and instantiates the matching
 * provider. Default is `noop` (Tier 1 / scaffold).
 *
 * For Tier 2+, set AUTH_PROVIDER=nextauth or AUTH_PROVIDER=entra in `.env`.
 *
 * Application code should ALWAYS import `authProvider` from this file, never
 * a concrete provider class — that way the swap is one env change.
 */

const which = (process.env.AUTH_PROVIDER ?? "noop").toLowerCase();

let instance: AuthProvider;

switch (which) {
  case "nextauth":
    instance = new NextAuthProvider();
    break;
  case "entra":
    instance = new EntraAuthProvider();
    break;
  case "noop":
  default:
    instance = new NoOpAuthProvider();
    break;
}

export const authProvider: AuthProvider = instance;

export type { AuthenticatedUser, AuthSession, AuthProvider } from "./types";
