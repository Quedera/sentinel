import type {
  AuthProvider,
  AuthenticatedUser,
  AuthSession,
} from "../types";
import type { UserRole } from "@/lib/types";

/**
 * NoOpAuthProvider — Tier 1 / scaffold-only.
 *
 * Accepts any email + any non-empty password. Returns a deterministic stub user.
 * NOT FOR PRODUCTION. Tier 2 must replace with NoOpAuthProvider → real auth.
 */
export class NoOpAuthProvider implements AuthProvider {
  readonly name = "noop";

  async signInWithPassword(
    email: string,
    password: string
  ): Promise<AuthenticatedUser | null> {
    if (!email || !password) return null;
    return this.stubUser(email);
  }

  async signInWithToken(token: string): Promise<AuthenticatedUser | null> {
    if (!token) return null;
    // Token format: "email:role"
    const [email, role] = token.split(":");
    if (!email || !role) return null;
    return this.stubUser(email, role as UserRole);
  }

  async resolveSession(token: string | undefined): Promise<AuthenticatedUser | null> {
    if (!token) return null;
    return this.signInWithToken(token);
  }

  async issueSession(user: AuthenticatedUser): Promise<AuthSession> {
    return {
      user,
      token: `${user.email}:${user.role}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    };
  }

  async hashPassword(_password: string): Promise<string> {
    return "noop-hash";
  }

  async verifyPassword(_password: string, _hash: string): Promise<boolean> {
    return true;
  }

  async registerUser(input: {
    email: string;
    password: string;
    role: UserRole;
  }): Promise<AuthenticatedUser> {
    return this.stubUser(input.email, input.role);
  }

  private stubUser(email: string, role: UserRole = "CONSULTANT"): AuthenticatedUser {
    return {
      id: `noop-${Buffer.from(email).toString("hex").slice(0, 12)}`,
      email,
      role,
      displayName: email.split("@")[0],
    };
  }
}
