// QUEDERA SENTINEL — shared types
// Engagements follow the explicit state machine defined in the wireframe brief.

export type EngagementStatus =
  | "DRAFT"
  | "HIRE_REQUESTED"
  | "CONTRACT_UPLOADED"
  | "AWAITING_CONSULTANT"
  | "VIEWED"
  | "SIGNED"
  | "CONFIRMED"
  | "DECLINED"
  | "EXPIRED"
  | "ACTIVE"
  | "COMPLETED";

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  DRAFT: "Draft",
  HIRE_REQUESTED: "Hire requested",
  CONTRACT_UPLOADED: "Contract uploaded",
  AWAITING_CONSULTANT: "Awaiting consultant",
  VIEWED: "Viewed by consultant",
  SIGNED: "Signed",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

export interface AvailabilityMap {
  [date: string]: "available" | "unavailable" | "booked";
}

/**
 * Day-level availability status.
 *
 * Values are lowercase in TypeScript (matching the Tier 1 mock data); when
 * Tier 2 wires Prisma, the schema enum uses UPPER_CASE and the route handlers
 * will transform between the two. Keep the lowercase form for the front-end.
 */
export type DayAvailability = "available" | "unavailable" | "booked";

/**
 * Sector classification for a consultant or engagement.
 * Used as the `primarySector` field on Consultant and the `sector` filter
 * on SearchConsultantsRequest.
 */
export type Sector =
  | "Financial Services"
  | "Technology"
  | "Defence"
  | "Government"
  | "Healthcare"
  | "Energy"
  | "Other";

/**
 * User role for authorisation checks. Drives which routes a user can hit
 * and which views the front-end renders (consultant dashboard vs. client
 * dashboard vs. admin).
 */
export type UserRole = "CONSULTANT" | "CLIENT" | "ADMIN";

export interface Consultant {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location: string;
  title: string;
  yearsExperience: number;
  primarySector: Sector;
  professionalSummary: string;
  skills: string[];
  dayRate: number;
  cvFile?: string;
  references: Reference[];
  verified: boolean;
  profileComplete: boolean;
  availability: AvailabilityMap;
}

export interface Reference {
  id: string;
  name: string;
  organisation: string;
  position: string;
  email: string;
  phone: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
}

export interface Engagement {
  id: string;
  consultantId: string;
  clientId: string;
  role: string;
  startDate: string;
  endDate: string;
  estimatedDays: number;
  dayRate: number;
  estimatedValue: number;
  status: EngagementStatus;
  contractFile?: string;
  consultantDeadline?: string;
  signedAt?: string;
  declinedAt?: string;
  expiredAt?: string;
}

export interface SearchFilters {
  skills?: string;
  sector?: string;
  experience?: string;
  availableFrom?: string;
  maxDayRate?: number;
  location?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: string;
}
