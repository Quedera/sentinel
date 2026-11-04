import { NextResponse } from "next/server";
import { authProvider } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { LoginRequest, ApiResult, AuthResponse } from "@/lib/api/contract";

// POST /api/auth/login
// Body: { email, password }
// Returns: { ok, data: AuthResponse } | { ok: false, error }
//
// Also sets an HTTP-only `session` cookie.
//
// That cookie is what makes the rest of the app work: every API route and
// every server action authenticates by reading it (see extractToken in the
// route handlers and cookies() in the admin server action). Without it the
// cookie path was dead code and server-rendered controls could never
// identify the acting user - which is why the admin APPROVE/REJECT buttons
// returned 200 while silently changing nothing.
//
// COOKIE_SECURE controls the Secure attribute. It defaults to false because
// the local stack is served over plain HTTP; set it to "true" behind TLS.
export async function POST(request: Request) {
  let body: LoginRequest;
  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_INPUT", message: "Invalid JSON body" },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_INPUT", message: "email and password are required" },
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  // Tier 1 (NoOpAuthProvider) accepts any non-empty credentials.
  // Tier 2 (NextAuth / Entra) will hit a real identity store.
  const user = await authProvider.signInWithPassword(body.email, body.password);
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
      } satisfies ApiResult<never>,
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

  try {
    await prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "USER_LOGGED_IN",
        resourceType: "user",
        resourceId: user.id,
        details: "provider=" + authProvider.name,
      },
    });
  } catch {
    // Never fail a login because the audit write failed.
  }

  const maxAge = Math.max(
    60,
    Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
  );

  const result = NextResponse.json(response, { status: 200 });
  result.cookies.set("session", session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge,
  });
  return result;
}
