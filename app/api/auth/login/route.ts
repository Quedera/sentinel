import { NextResponse } from "next/server";
import { authProvider } from "@/lib/auth";
import type { LoginRequest, ApiResult, AuthResponse } from "@/lib/api/contract";

// POST /api/auth/login
// Body: { email, password }
// Returns: { ok, data: AuthResponse } | { ok: false, error }

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequest;

  if (!body.email || !body.password) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_INPUT", message: "email and password are required" } } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  // Tier 1 (NoOpAuthProvider) accepts any non-empty credentials.
  // Tier 2 (NextAuth / Entra) will hit a real identity store.
  const user = await authProvider.signInWithPassword(body.email, body.password);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } } satisfies ApiResult<never>,
      { status: 401 }
    );
  }

  const session = await authProvider.issueSession(user);
  const response: ApiResult<AuthResponse> = {
    ok: true,
    data: {
      userId: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
    },
  };

  // TODO Tier 2: set HTTP-only cookie, set CSRF token, log USER_LOGGED_IN audit event
  return NextResponse.json(response, { status: 200 });
}
