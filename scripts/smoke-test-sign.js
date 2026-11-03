// Smoke test for the SENTINEL sign flow.
// Verifies the vertical slice works end-to-end against the local Postgres
// + mock EigProvider + NoOp auth.
//
// Idempotent: cleanup runs in a finally block so a crash mid-test doesn't
// leave orphans in the DB.
//
// Run AFTER starting the Next.js production server on a free port:
//   DATABASE_URL=... AUTH_PROVIDER=noop EIG_PROVIDER=mock \
//     npx next start -p 3002 &
//   DATABASE_URL=... BASE_URL=http://localhost:3002 \
//     node scripts/smoke-test-sign.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const BASE = process.env.BASE_URL || "http://localhost:3001";

const SMOKE_CONSULTANT_EMAIL = "smoke-consultant@quedera.local";
const SMOKE_CLIENT_EMAIL = "smoke-client@quedera.local";

async function main() {
  console.log("=== SENTINEL smoke test: sign flow ===\n");

  let consultantUser, consultant, clientUser, client, engagement;

  try {
    // 1. Pre-clean: wipe any leftovers from a previous failed run
    await preClean();

    // 2. Create test data
    console.log("Creating test users + consultant + client + engagement...");
    consultantUser = await prisma.user.create({
      data: {
        email: SMOKE_CONSULTANT_EMAIL,
        passwordHash: "noop",
        role: "CONSULTANT",
        emailVerified: new Date(),
      },
    });

    consultant = await prisma.consultant.create({
      data: {
        userId: consultantUser.id,
        fullName: "Smoke Test Consultant",
        phone: "+44 7000 000001",
        location: "London",
        title: "Senior Service Architect",
        yearsExperience: 10,
        primarySector: "TECHNOLOGY",
        professionalSummary: "Smoke test consultant.",
        skills: ["ITIL", "Service Transition"],
        dayRate: 450,
        verified: true,
        profileComplete: true,
      },
    });

    clientUser = await prisma.user.create({
      data: {
        email: SMOKE_CLIENT_EMAIL,
        passwordHash: "noop",
        role: "CLIENT",
        emailVerified: new Date(),
      },
    });

    client = await prisma.client.create({
      data: {
        userId: clientUser.id,
        companyName: "Smoke Test Co",
        contactName: "Smoke Test Buyer",
      },
    });

    engagement = await prisma.engagement.create({
      data: {
        consultantId: consultant.id,
        clientId: client.id,
        role: "Service Transition Lead",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-12-31"),
        estimatedDays: 60,
        dayRate: 450,
        estimatedValue: 27000,
        status: "VIEWED",
        consultantDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`  engagement ${engagement.id} in state VIEWED`);

    // 3. Call the sign endpoint with a NoOp-style token
    const token = `${SMOKE_CONSULTANT_EMAIL}:CONSULTANT`;
    console.log(`\nCalling POST /api/engagements/${engagement.id}/sign ...`);

    const response = await fetch(
      `${BASE}/api/engagements/${engagement.id}/sign`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agreed: true,
          signature: "Smoke Test Signature",
        }),
      }
    );

    const responseText = await response.text();
    console.log(`  HTTP ${response.status}`);
    console.log(`  body: ${responseText}`);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${responseText}`);
    }

    const responseData = JSON.parse(responseText);
    if (responseData.data?.status !== "CONFIRMED") {
      throw new Error(
        `Expected status CONFIRMED, got ${responseData.data?.status}`
      );
    }
    if (!responseData.data?.signedAt) {
      throw new Error("Expected signedAt to be set");
    }
    console.log("  ✅ Engagement transitioned to CONFIRMED");

    // 4. Verify audit events
    const auditEvents = await prisma.auditEvent.findMany({
      where: { engagementId: engagement.id },
      orderBy: { timestamp: "asc" },
    });

    console.log(`\n  Audit events written: ${auditEvents.length}`);
    for (const e of auditEvents) {
      console.log(`    - ${e.action} (${e.timestamp.toISOString()})`);
    }

    const expectedActions = [
      "SIGNATURE_ATTEMPTED",
      "SIGNED",
      "NOTIFICATION_SENT",
    ];
    for (const action of expectedActions) {
      if (!auditEvents.some((e) => e.action === action)) {
        throw new Error(`Missing audit event: ${action}`);
      }
    }
    console.log("  ✅ All 3 expected audit events present");

    // 5. Verify FK references the real User.id from the session
    const auditUserIds = auditEvents.map((e) => e.actorId);
    if (!auditUserIds.every((id) => id === consultantUser.id)) {
      throw new Error(
        `Audit actor IDs do not all reference the consultant user (got ${auditUserIds.join(", ")})`
      );
    }
    console.log("  ✅ Audit events reference the consultant's real User.id");

    console.log("\n✅✅✅ Smoke test PASSED\n");
  } catch (err) {
    console.error("\n❌ Smoke test FAILED:", err.message);
    throw err;
  } finally {
    // Always clean up — best effort
    console.log("\nCleaning up...");
    try {
      if (engagement) {
        await prisma.auditEvent.deleteMany({
          where: { engagementId: engagement.id },
        });
        await prisma.engagement.delete({ where: { id: engagement.id } });
        console.log("  ✓ engagement + audit events");
      }
      if (consultant) {
        await prisma.consultant.delete({ where: { id: consultant.id } });
        console.log("  ✓ consultant (cascades to consultant user)");
      }
      if (client) {
        await prisma.client.delete({ where: { id: client.id } });
        console.log("  ✓ client (cascades to client user)");
      }
      // Skip explicit user deletes — cascade handled them
    } catch (cleanupErr) {
      console.error(
        "  Cleanup error (non-fatal):",
        cleanupErr.message
      );
    }
  }
}

/** Wipe any smoke-test leftovers from previous runs. */
async function preClean() {
  const existingConsultant = await prisma.user.findUnique({
    where: { email: SMOKE_CONSULTANT_EMAIL },
  });
  if (existingConsultant) {
    const consultantProfile = await prisma.consultant.findUnique({
      where: { userId: existingConsultant.id },
    });
    if (consultantProfile) {
      const engagements = await prisma.engagement.findMany({
        where: { consultantId: consultantProfile.id },
      });
      for (const eng of engagements) {
        await prisma.auditEvent.deleteMany({
          where: { engagementId: eng.id },
        });
        await prisma.engagement.delete({ where: { id: eng.id } });
      }
      await prisma.consultant.delete({
        where: { id: consultantProfile.id },
      });
    }
    await prisma.user.delete({ where: { id: existingConsultant.id } });
  }

  const existingClient = await prisma.user.findUnique({
    where: { email: SMOKE_CLIENT_EMAIL },
  });
  if (existingClient) {
    const clientProfile = await prisma.client.findUnique({
      where: { userId: existingClient.id },
    });
    if (clientProfile) {
      const engagements = await prisma.engagement.findMany({
        where: { clientId: clientProfile.id },
      });
      for (const eng of engagements) {
        await prisma.auditEvent.deleteMany({
          where: { engagementId: eng.id },
        });
        await prisma.engagement.delete({ where: { id: eng.id } });
      }
      await prisma.client.delete({ where: { id: clientProfile.id } });
    }
    await prisma.user.delete({ where: { id: existingClient.id } });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err.stack || err);
    try {
      await prisma.$disconnect();
    } catch {}
    process.exit(1);
  });
