import { NextResponse } from "next/server";
import { mockConsultants } from "@/lib/mock-data";
import type {
  SearchConsultantsRequest,
  SearchConsultantsResponse,
  ApiResult,
  PublicConsultant,
  AvailabilityDayResponse,
} from "@/lib/api/contract";
import type { DayAvailability } from "@/lib/types";

// GET /api/search/consultants
// Query: ?skills=...&sector=...&experienceMin=...&availableFrom=...&maxDayRate=...&location=...
// Returns: { ok, data: { total, results: PublicConsultant[] } }
//
// Public/searchable tier only (per wireframe brief §6).
// Filters:
//   - skills:    match any in array
//   - sector:    exact
//   - experienceMin: gte
//   - availableFrom: any day >= this date with AVAILABLE status
//   - maxDayRate: lte
//   - location:  substring match

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: SearchConsultantsRequest = {
    skills: url.searchParams.get("skills")?.split(",").filter(Boolean),
    sector: url.searchParams.get("sector") as SearchConsultantsRequest["sector"],
    experienceMin: url.searchParams.get("experienceMin")
      ? Number(url.searchParams.get("experienceMin"))
      : undefined,
    availableFrom: url.searchParams.get("availableFrom") ?? undefined,
    maxDayRate: url.searchParams.get("maxDayRate")
      ? Number(url.searchParams.get("maxDayRate"))
      : undefined,
    location: url.searchParams.get("location") ?? undefined,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 20,
    offset: url.searchParams.get("offset") ? Number(url.searchParams.get("offset")) : 0,
  };

  // Tier 1: filter the mock data. Tier 2 will replace this with a Prisma query.
  const filtered = mockConsultants.filter((c) => {
    if (!c.verified || !c.profileComplete) return false;
    if (params.sector && c.primarySector !== params.sector) return false;
    if (params.experienceMin && c.yearsExperience < params.experienceMin) return false;
    if (params.maxDayRate && c.dayRate > params.maxDayRate) return false;
    if (params.location && !c.location.toLowerCase().includes(params.location.toLowerCase())) return false;
    if (params.skills && params.skills.length > 0) {
      if (!params.skills.some((s) => c.skills.includes(s))) return false;
    }
    return true;
  });

  const results: PublicConsultant[] = filtered.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    title: c.title,
    yearsExperience: c.yearsExperience,
    primarySector: c.primarySector,
    skills: c.skills,
    location: c.location,
    dayRate: c.dayRate,
    verified: c.verified,
    availability: Object.entries(c.availability).map(([date, status]) => ({
      date,
      status: status as DayAvailability,
    })) satisfies AvailabilityDayResponse[],
  }));

  const data: SearchConsultantsResponse = {
    total: filtered.length,
    results: results.slice(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 20)),
  };

  // TODO Tier 2: write SEARCH_PERFORMED audit event with details of filters used
  return NextResponse.json({ ok: true, data } satisfies ApiResult<SearchConsultantsResponse>);
}
