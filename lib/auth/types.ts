// Pluggable auth provider interface.
// Concrete providers (NoOpAuthProvider, NextAuthProvider, EntraAuthProvider)
// implement this. The application code only ever talks to the interface, so
// swapping providers doesn't ripple through.
//
// To add a new provider: implement AuthProvider in lib/auth/providers/ and
// register it in lib/auth/index.ts.

import type { UserRole } from "@/lib/types";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  // Display name is optional; some providers (Entra) populate it from claims,
  // others (NoOp) might leave it blank.
  displayName?: string;
}

export interface AuthSession {
  user: AuthenticatedUser;
  /** Provider-specific opaque token (cookie value, JWT, etc.). */
  token: string;
  /** Session expiry. */
  expiresAt: Date;
}

export interface AuthProvider {
  /** Provider name for logging / config / display. */
  readonly name: string;

  /**
   * Authenticate with email + password.
   * Returns the authenticated user, or null if credentials don't match.
   * Throws if the account is locked / disabled / unverified.
   */
  signInWithPassword(
    email: string,
    password: string
  ): Promise<AuthenticatedUser | null>;

  /**
   * Authenticate with a one-time / OAuth token.
   * Used by magic links, OAuth callbacks, etc.
   */
  signInWithToken(token: string): Promise<AuthenticatedUser | null>;

  /** Resolve the current user from a session token (cookie value, header). */
  resolveSession(token: string | undefined): Promise<AuthenticatedUser | null>;

  /** Issue a new session for the given user. */
  issueSession(user: AuthenticatedUser): Promise<AuthSession>;

  /** Hash a password at registration. */
  hashPassword(password: string): Promise<string>;

  /** Verify a password against a stored hash. */
  verifyPassword(password: string, hash: string): Promise<boolean>;

  /** Register a new user (email + password). Returns the created user. */
  registerUser(input: {
    email: string;
    password: string;
    role: UserRole;
  }): Promise<AuthenticatedUser>;
}
