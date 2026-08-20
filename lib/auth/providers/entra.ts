import type {
  AuthProvider,
  AuthenticatedUser,
  AuthSession,
} from "../types";
import type { UserRole } from "@/lib/types";

/**
 * EntraAuthProvider — Tier 2 / 3 stub for SENTINEL � DUET infra sharing.
 *
 * Uses Microsoft Entra ID (formerly Azure AD) for SSO. Matches the pattern
 * already used in the DUET backend (see TOOLS.md / MEMORY.md notes on
 * `duet-dev` Entra app registration + client secret in Key Vault).
 *
 * Wiring plan (when Craig green-lights the infra share):
 *   1. `npm install @azure/msal-node`
 *   2. Register `quedera-sentinel-dev` in Entra (mirroring `duet-dev`)
 *   3. Add to Key Vault alongside `duet-entra-client-secret`
 *   4. Implement OIDC code-flow callback at app/api/auth/callback/entra/route.ts
 *   5. Map Entra groups / roles to SENTINEL UserRole
 *   6. Flip AUTH_PROVIDER=entra in env
 */
export class EntraAuthProvider implements AuthProvider {
  readonly name = "entra";

  async signInWithPassword(
    _email: string,
    _password: string
  ): Promise<AuthenticatedUser | null> {
    // Entra doesn't do passwords directly — sign-in happens via OIDC flow.
    throw new Error(
      "EntraAuthProvider does not support password sign-in — use OIDC flow"
    );
  }

  async signInWithToken(_token: string): Promise<AuthenticatedUser | null> {
    throw new Error("EntraAuthProvider not yet wired — see Tier 2 wiring plan");
  }

  async resolveSession(_token: string | undefined): Promise<AuthenticatedUser | null> {
    throw new Error("EntraAuthProvider not yet wired — see Tier 2 wiring plan");
  }

  async issueSession(_user: AuthenticatedUser): Promise<AuthSession> {
    throw new Error("EntraAuthProvider not yet wired — see Tier 2 wiring plan");
  }

  async hashPassword(_password: string): Promise<string> {
    throw new Error("EntraAuthProvider uses OIDC, not passwords");
  }

  async verifyPassword(_password: string, _hash: string): Promise<boolean> {
    throw new Error("EntraAuthProvider uses OIDC, not passwords");
  }

  async registerUser(_input: {
    email: string;
    password: string;
    role: UserRole;
  }): Promise<AuthenticatedUser> {
    // Entra users are provisioned externally — there is no self-service register.
    throw new Error(
      "EntraAuthProvider users are provisioned in Entra, not registered here"
    );
  }
}
