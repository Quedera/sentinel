import type {
  AuthProvider,
  AuthenticatedUser,
  AuthSession,
} from "../types";
import type { UserRole } from "@/lib/types";

/**
 * NextAuthProvider — Tier 2 / 3 stub.
 *
 * Drop-in shape for NextAuth.js (Auth.js) with the Credentials provider +
 * Prisma adapter. NOT YET WIRED — this is the contract Tier 2 will implement.
 *
 * Wiring plan (when Craig green-lights):
 *   1. `npm install next-auth @auth/prisma-adapter`
 *   2. Add NextAuth route at app/api/auth/[...nextauth]/route.ts
 *   3. Add NextAuth schema fields to prisma/schema.prisma (Account, Session,
 *      VerificationToken — see NextAuth docs)
 *   4. Implement the methods below using `bcrypt` for password hashing
 *   5. Flip AUTH_PROVIDER=nextauth in env
 */
export class NextAuthProvider implements AuthProvider {
  readonly name = "nextauth";

  async signInWithPassword(
    _email: string,
    _password: string
  ): Promise<AuthenticatedUser | null> {
    throw new Error("NextAuthProvider not yet wired — see Tier 2 wiring plan");
  }

  async signInWithToken(_token: string): Promise<AuthenticatedUser | null> {
    throw new Error("NextAuthProvider not yet wired — see Tier 2 wiring plan");
  }

  async resolveSession(_token: string | undefined): Promise<AuthenticatedUser | null> {
    throw new Error("NextAuthProvider not yet wired — see Tier 2 wiring plan");
  }

  async issueSession(_user: AuthenticatedUser): Promise<AuthSession> {
    throw new Error("NextAuthProvider not yet wired — see Tier 2 wiring plan");
  }

  async hashPassword(_password: string): Promise<string> {
    throw new Error("NextAuthProvider not yet wired — see Tier 2 wiring plan");
  }

  async verifyPassword(_password: string, _hash: string): Promise<boolean> {
    throw new Error("NextAuthProvider not yet wired — see Tier 2 wiring plan");
  }

  async registerUser(_input: {
    email: string;
    password: string;
    role: UserRole;
  }): Promise<AuthenticatedUser> {
    throw new Error("NextAuthProvider not yet wired — see Tier 2 wiring plan");
  }
}
