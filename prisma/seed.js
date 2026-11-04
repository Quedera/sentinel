/**
 * QUEDERA SENTINEL — local development seed.
 *
 * Populates a fresh Postgres with a demo dataset that exercises:
 *   - every engagement state in the wireframe brief §15 state machine
 *   - every filter the search API supports (skills, sector, experience,
 *     availableFrom, maxDayRate, location)
 *   - the three visibility tiers (verified + profileComplete gate the
 *     public/searchable tier in app/api/search/consultants/route.ts)
 *
 * Run:
 *   npx prisma migrate dev --name init
 *   npm run db:seed
 *
 * Safe to re-run — it wipes the tenant first (FK-safe order).
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/** UTC-midnight Date, safe for @db.Date columns. */
const D = (iso) => new Date(`${iso}T00:00:00.000Z`);

/** Deterministic availability window so seeded data is stable across runs. */
const WINDOW_START = "2026-11-02";

function availabilityFor(days, pattern) {
  const out = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(D(WINDOW_START));
    d.setUTCDate(d.getUTCDate() + i);
    out.push({ date: d, status: pattern[i % pattern.length] });
  }
  return out;
}

const CONSULTANTS = [
  {
    email: "jane.smith@example.com",
    fullName: "Jane Smith",
    phone: "+44 7700 900123",
    location: "UK / Remote",
    title: "Transformation Consultant",
    yearsExperience: 15,
    primarySector: "FINANCIAL_SERVICES",
    professionalSummary:
      "Experienced transformation leader specialising in financial services, technology and operational change. Track record of delivering large-scale programmes for FTSE 100 clients.",
    skills: ["Transformation", "Programme Management", "Strategy", "Change", "PMO"],
    dayRate: 1250,
    verified: true,
    profileComplete: true,
    availability: ["AVAILABLE", "AVAILABLE", "AVAILABLE", "UNAVAILABLE", "BOOKED"],
    references: [
      {
        name: "Mark Thompson",
        organisation: "Barclays",
        position: "Chief Operating Officer",
        email: "mark.thompson@barclays.example",
        phone: "+44 20 7000 0001",
      },
      {
        name: "Helen Green",
        organisation: "Lloyds Banking Group",
        position: "Director of Change",
        email: "helen.green@lloyds.example",
        phone: "+44 20 7000 0002",
      },
    ],
  },
  {
    email: "david.jones@example.com",
    fullName: "David Jones",
    phone: "+44 7700 900456",
    location: "UK / Remote",
    title: "Programme Director",
    yearsExperience: 12,
    primarySector: "TECHNOLOGY",
    professionalSummary:
      "Programme director with a track record across multi-site technology delivery, vendor consolidation and service transition.",
    skills: ["PMO", "Transformation", "Technology"],
    dayRate: 1100,
    verified: true,
    profileComplete: true,
    availability: ["AVAILABLE", "AVAILABLE", "BOOKED", "AVAILABLE", "AVAILABLE"],
    references: [
      {
        name: "Sarah Line",
        organisation: "Sky",
        position: "Programme Director",
        email: "sarah.line@sky.example",
        phone: "+44 20 7000 0003",
      },
    ],
  },
  {
    email: "priya.sharma@example.com",
    fullName: "Priya Sharma",
    phone: "+44 7700 900789",
    location: "UK / Remote",
    title: "Cloud & Platform Architect",
    yearsExperience: 9,
    primarySector: "TECHNOLOGY",
    professionalSummary:
      "Cloud platform architect specialising in secure migration, platform engineering and developer enablement across regulated environments.",
    skills: ["Cloud", "DevOps", "Architecture", "Security"],
    dayRate: 950,
    verified: true,
    profileComplete: true,
    availability: ["AVAILABLE", "BOOKED", "AVAILABLE", "AVAILABLE", "AVAILABLE"],
    references: [
      {
        name: "Tomas Reidy",
        organisation: "Deloitte",
        position: "Partner",
        email: "tomas.reidy@deloitte.example",
        phone: "+44 20 7000 0004",
      },
    ],
  },
  {
    email: "elena.volkov@example.com",
    fullName: "Elena Volkov",
    phone: "+44 7700 900111",
    location: "UK / Remote",
    title: "Health Data Governance Lead",
    yearsExperience: 11,
    primarySector: "HEALTHCARE",
    professionalSummary:
      "Data governance and information governance lead for NHS and private health providers. Strong experience in Caldicott, DPIA and clinical safety standards.",
    skills: ["Governance", "Health", "Data", "Compliance"],
    dayRate: 1050,
    verified: true,
    profileComplete: true,
    availability: ["AVAILABLE", "AVAILABLE", "UNAVAILABLE", "AVAILABLE", "AVAILABLE"],
    references: [
      {
        name: "Robert Nash",
        organisation: "NHS Digital",
        position: "Programme Lead",
        email: "robert.nash@nhsdigital.example",
        phone: "+44 20 7000 0005",
      },
    ],
  },
  {
    // Deliberately incomplete — proves the profileComplete gate works.
    email: "marcus.reid@example.com",
    fullName: "Marcus Reid",
    phone: "+44 7700 900222",
    location: "North East / On-site",
    title: "Operational Resilience Lead",
    yearsExperience: 18,
    primarySector: "ENERGY",
    professionalSummary:
      "Operational resilience and major incident management across nuclear and oil & gas estates.",
    skills: ["Risk", "Resilience", "Transformation"],
    dayRate: 1400,
    verified: true,
    profileComplete: false,
    availability: ["AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE"],
    references: [],
  },
];

// One engagement per state in the §15 state machine.
const ENGAGEMENTS = [
  { consultant: "jane.smith@example.com", role: "Transformation Lead", start: "2026-11-09", end: "2026-11-20", days: 8, status: "ACTIVE" },
  { consultant: "david.jones@example.com", role: "Programme Director", start: "2026-11-16", end: "2026-12-04", days: 10, status: "CONFIRMED" },
  { consultant: "priya.sharma@example.com", role: "Cloud Platform Lead", start: "2026-11-23", end: "2026-12-11", days: 10, status: "AWAITING_CONSULTANT" },
  { consultant: "elena.volkov@example.com", role: "Data Governance Advisor", start: "2026-12-01", end: "2026-12-08", days: 5, status: "HIRE_REQUESTED" },
  { consultant: "marcus.reid@example.com", role: "Resilience Consultant", start: "2026-12-07", end: "2026-12-18", days: 8, status: "DRAFT" },
  { consultant: "priya.sharma@example.com", role: "Security Architect", start: "2026-11-30", end: "2026-12-09", days: 6, status: "SIGNED" },
  { consultant: "david.jones@example.com", role: "Technology PMO Lead", start: "2026-11-02", end: "2026-11-13", days: 8, status: "COMPLETED" },
  { consultant: "elena.volkov@example.com", role: "Compliance Reviewer", start: "2026-11-10", end: "2026-11-17", days: 5, status: "VIEWED" },
  { consultant: "jane.smith@example.com", role: "Change Director", start: "2026-12-14", end: "2026-12-23", days: 7, status: "CONTRACT_UPLOADED" },
  { consultant: "elena.volkov@example.com", role: "Interim IG Lead", start: "2026-11-03", end: "2026-11-12", days: 6, status: "DECLINED" },
  { consultant: "jane.smith@example.com", role: "Strategy Consultant", start: "2026-10-05", end: "2026-10-16", days: 8, status: "EXPIRED" },
];

async function main() {
  console.log("[seed] clearing existing data...");
  await prisma.auditEvent.deleteMany();
  await prisma.engagement.deleteMany();
  await prisma.availabilityDay.deleteMany();
  await prisma.reference.deleteMany();
  await prisma.consultant.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log("[seed] users + client...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@quedera.example",
      passwordHash: "noop-hash",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: "client@abc-corp.example",
      passwordHash: "noop-hash",
      role: "CLIENT",
      emailVerified: new Date(),
    },
  });

  const client = await prisma.client.create({
    data: {
      userId: clientUser.id,
      companyName: "ABC Corporation",
      contactName: "Alex Carter",
    },
  });

  console.log("[seed] consultants + references + availability...");
  const consultantsByEmail = {};
  for (const c of CONSULTANTS) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: "noop-hash",
        role: "CONSULTANT",
        emailVerified: new Date(),
      },
    });

    const consultant = await prisma.consultant.create({
      data: {
        userId: user.id,
        fullName: c.fullName,
        phone: c.phone,
        location: c.location,
        title: c.title,
        yearsExperience: c.yearsExperience,
        primarySector: c.primarySector,
        professionalSummary: c.professionalSummary,
        skills: c.skills,
        dayRate: c.dayRate,
        cvBlobKey: `consultants/${c.email.split("@")[0]}/cv.pdf`,
        verified: c.verified,
        profileComplete: c.profileComplete,
      },
    });

    for (const r of c.references) {
      await prisma.reference.create({ data: { ...r, consultantId: consultant.id } });
    }

    await prisma.availabilityDay.createMany({
      data: availabilityFor(30, c.availability).map((a) => ({
        ...a,
        consultantId: consultant.id,
      })),
    });

    consultantsByEmail[c.email] = consultant;

    await prisma.auditEvent.create({
      data: {
        actorId: admin.id,
        action: "PROFILE_CREATED",
        resourceType: "consultant",
        resourceId: consultant.id,
        details: `fullName=${c.fullName};sector=${c.primarySector};dayRate=${c.dayRate}`,
      },
    });

    await prisma.auditEvent.create({
      data: {
        actorId: admin.id,
        action: "CV_UPLOADED",
        resourceType: "consultant",
        resourceId: consultant.id,
      },
    });
  }

  console.log("[seed] engagements (all §15 states)...");
  for (const e of ENGAGEMENTS) {
    const consultant = consultantsByEmail[e.consultant];
    if (!consultant) throw new Error(`Unknown consultant ${e.consultant}`);

    const createdAt = new Date(D(e.start));
    createdAt.setUTCDate(createdAt.getUTCDate() - 21);

    const engagement = await prisma.engagement.create({
      data: {
        consultantId: consultant.id,
        clientId: client.id,
        role: e.role,
        startDate: D(e.start),
        endDate: D(e.end),
        estimatedDays: e.days,
        dayRate: consultant.dayRate,
        estimatedValue: consultant.dayRate * e.days,
        status: e.status,
        createdAt,
        contractBlobKey:
          e.status === "DRAFT" || e.status === "HIRE_REQUESTED"
            ? null
            : `engagements/${consultant.id}/${e.start}-contract.pdf`,
        consultantDeadline:
          e.status === "AWAITING_CONSULTANT" || e.status === "CONTRACT_UPLOADED"
            ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            : null,
        signedAt:
          e.status === "SIGNED" || e.status === "CONFIRMED" || e.status === "ACTIVE" || e.status === "COMPLETED"
            ? new Date(D(e.start))
            : null,
        declinedAt: e.status === "DECLINED" ? new Date(D(e.start)) : null,
        expiredAt: e.status === "EXPIRED" ? new Date(D(e.start)) : null,
      },
    });

    await prisma.auditEvent.create({
      data: {
        actorId: clientUser.id,
        action: "HIRE_REQUESTED",
        resourceType: "engagement",
        resourceId: engagement.id,
        engagementId: engagement.id,
        details: `role=${e.role};days=${e.days};value=${consultant.dayRate * e.days}`,
      },
    });

    if (["SIGNED", "CONFIRMED", "ACTIVE", "COMPLETED"].includes(e.status)) {
      await prisma.auditEvent.create({
        data: {
          actorId: consultant.userId,
          action: "SIGNED",
          resourceType: "engagement",
          resourceId: engagement.id,
          engagementId: engagement.id,
        },
      });
    }
  }

  await prisma.auditEvent.create({
    data: {
      actorId: clientUser.id,
      action: "SEARCH_PERFORMED",
      resourceType: "search",
      resourceId: clientUser.id,
      details: "skills=Transformation;sector=Financial Services;experienceMin=10",
    },
  });

  const counts = {
    users: await prisma.user.count(),
    consultants: await prisma.consultant.count(),
    references: await prisma.reference.count(),
    availabilityDays: await prisma.availabilityDay.count(),
    engagements: await prisma.engagement.count(),
    auditEvents: await prisma.auditEvent.count(),
  };
  console.log("[seed] done:", counts);
  console.log("[seed] logins (noop provider accepts any password):");
  console.log("  admin@quedera.example      (ADMIN)");
  console.log("  client@abc-corp.example    (CLIENT)");
  for (const c of CONSULTANTS) console.log(`  ${c.email}  (CONSULTANT)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[seed] FAILED:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
