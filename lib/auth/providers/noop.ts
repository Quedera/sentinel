import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  AuthProvider,
  AuthenticatedUser,
  AuthSession,
} from "../types";

/**
 * NoOpAuthProvider — Tier 2 dev / scaffold mode.
 *
 * Accepts any email + any non-empty password. Tokens are formatted as
 * `email:role` (the role is optional; defaults to CONSULTANT).
 *
 * **DB-aware**: resolveSession / signInWithToken / registerUser look up
 * the user by email and create a stub record if missing. This makes the
 * dev flow self-bootstrapping — no separate seed step needed for audit
 * FK references.
 *
 * NOT FOR PRODUCTION. Tier 2 must swap to NoOpAuthProvider → NextAuth/Entra.
 */
export class NoOpAuthProvider implements AuthProvider {
  readonly name = "noop";

  async signInWithPassword(
    email: string,
    password: string
  ): Promise<AuthenticatedUser | null> {
    if (!email || !password) return null;
    return this.lookupOrCreate(email);
  }

  async signInWithToken(
    token: string
  ): Promise<AuthenticatedUser | null> {
    if (!token) return null;
    const [email, role] = token.split(":");
    if (!email) return null;
    return this.lookupOrCreate(email, (role as UserRole) ?? "CONSULTANT");
  }

  async resolveSession(
    token: string | undefined
  ): Promise<AuthenticatedUser | null> {
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
    return this.lookupOrCreate(input.email, input.role);
  }

  /**
   * Look up user by email; create a stub record if missing.
   * Dev-only — real auth providers would 401 an unknown user.
   */
  private async lookupOrCreate(
    email: string,
    role: UserRole = "CONSULTANT"
  ): Promise<AuthenticatedUser> {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: "noop",
          role,
          emailVerified: new Date(),
        },
      });
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: email.split("@")[0],
    };
  }
}
