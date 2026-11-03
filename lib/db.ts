import { PrismaClient } from "@prisma/client";

// Singleton pattern: avoid creating multiple PrismaClient instances in dev
// (Next.js hot reload would otherwise create a new instance per HMR pass,
// exhausting database connections).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
