import { NextResponse } from "next/server";
import type {
  Prisma,
  Sector as PrismaSector,
  DayAvailability as PrismaDayAvailability,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Sector, DayAvailability } from "@/lib/types";
import type {
  SearchConsultantsRequest,
  SearchConsultantsResponse,
  ApiResult,
  PublicConsultant,
  AvailabilityDayResponse,
} from "@/lib/api/contract";

// Maps the display values used by @/lib/types to Prisma's DB enum values.
// URL query strings carry display values (e.g. ?sector=Financial%20Services),
// the database stores DB values (FINANCIAL_SERVICES).
const SECTOR_TO_PRISMA: Record<string, PrismaSector> = {
  "Financial Services": "FINANCIAL_SERVICES",
  "Technology": "TECHNOLOGY",
  "Defence": "DEFENCE",
  "Government": "GOVERNMENT",
  "Healthcare": "HEALTHCARE",
  "Energy": "ENERGY",
  "Other": "OTHER",
};

const PRISMA_TO_SECTOR: Record<PrismaSector, Sector> = {
  FINANCIAL_SERVICES: "Financial Services",
  TECHNOLOGY: "Technology",
  DEFENCE: "Defence",
  GOVERNMENT: "Government",
  HEALTHCARE: "Healthcare",
  ENERGY: "Energy",
  OTHER: "Other",
};

const PRISMA_TO_DAY_AVAILABILITY: Record<PrismaDayAvailability, DayAvailability> = {
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  BOOKED: "booked",
};

// GET /api/search/consultants
// Query: ?skills=...&sector=...&experienceMin=...&availableFrom=...&maxDayRate=...&location=...
// Returns: { ok, data: { total, results: PublicConsultant[] } }
//
// Public/searchable tier only (per wireframe brief §6). All 6 filters now
// applied server-side via Prisma against the Consultant + AvailabilityDay
// tables.
//
// TODO (next batch): write SEARCH_PERFORMED audit event when caller is signed in.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: SearchConsultantsRequest = {
    skills: url.searchParams.get("skills")?.split(",").filter(Boolean),
    sector: url.searchParams.get("sector") as Sector | undefined,
    experienceMin: url.searchParams.get("experienceMin")
      ? Number(url.searchParams.get("experienceMin"))
      : undefined,
    availableFrom: url.searchParams.get("availableFrom") ?? undefined,
    maxDayRate: url.searchParams.get("maxDayRate")
      ? Number(url.searchParams.get("maxDayRate"))
      : undefined,
    location: url.searchParams.get("location") ?? undefined,
    limit: url.searchParams.get("limit")
      ? Number(url.searchParams.get("limit"))
      : 20,
    offset: url.searchParams.get("offset")
      ? Number(url.searchParams.get("offset"))
      : 0,
  };

  // Normalise sector — accept either the display value or the raw DB enum
  const sectorPrisma = params.sector
    ? SECTOR_TO_PRISMA[params.sector] ?? (params.sector as PrismaSector)
    : undefined;

  const where: Prisma.ConsultantWhereInput = {
    verified: true,
    profileComplete: true,
    ...(sectorPrisma && { primarySector: sectorPrisma }),
    ...(params.experienceMin != null && {
      yearsExperience: { gte: params.experienceMin },
    }),
    ...(params.maxDayRate != null && {
      dayRate: { lte: params.maxDayRate },
    }),
    ...(params.location && {
      location: { contains: params.location, mode: "insensitive" },
    }),
    ...(params.skills &&
      params.skills.length > 0 && {
        skills: { hasSome: params.skills },
      }),
    ...(params.availableFrom && {
      availabilityDays: {
        some: {
          date: { gte: new Date(params.availableFrom) },
          status: "AVAILABLE",
        },
      },
    }),
  };

  const [total, consultants] = await Promise.all([
    prisma.consultant.count({ where }),
    prisma.consultant.findMany({
      where,
      include: { availabilityDays: true },
      take: params.limit ?? 20,
      skip: params.offset ?? 0,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const results: PublicConsultant[] = consultants.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    title: c.title,
    yearsExperience: c.yearsExperience,
    primarySector: PRISMA_TO_SECTOR[c.primarySector],
    skills: c.skills,
    location: c.location,
    dayRate: c.dayRate,
    verified: c.verified,
    availability: c.availabilityDays.map(
      (d): AvailabilityDayResponse => ({
        date: d.date.toISOString().split("T")[0],
        status: PRISMA_TO_DAY_AVAILABILITY[d.status],
      })
    ),
  }));

  const data: SearchConsultantsResponse = {
    total,
    results,
  };

  return NextResponse.json(
    { ok: true, data } satisfies ApiResult<SearchConsultantsResponse>
  );
}
