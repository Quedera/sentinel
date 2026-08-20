// QUEDERA SENTINEL — API contract (Tier 2 surface)
//
// All API endpoints defined in this file. Route handlers in app/api/
// implement this contract. Client code can import the types for end-to-end
// type safety once tRPC / typed-fetch is in place.
//
// Three-tier data exposure (per wireframe brief §6):
//   1. Public/searchable       — name, title, skills, exp, sector, location, availability, day rate
//   2. Authenticated client    — expanded CV, detailed experience, relevant project history
//   3. Post-selection          — full references, contractual/personal info
//
// The three response shapes below (PublicConsultant, DetailedConsultant,
// FullConsultant) enforce this tiering at the type level.

import type {
  Consultant,
  Client,
  Engagement,
  AuditEvent,
  EngagementStatus,
  Sector,
  DayAvailability,
} from "@/lib/types";
import type { UserRole } from "@/lib/types";

// =========================================================================
// Common
// =========================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

// =========================================================================
// Auth endpoints
// =========================================================================

export interface RegisterConsultantRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  location: string;
  title: string;
  yearsExperience: number;
  primarySector: Sector;
  professionalSummary: string;
  skills: string[];
  dayRate: number;
}

export interface RegisterClientRequest {
  email: string;
  password: string;
  companyName: string;
  contactName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  role: UserRole;
  displayName?: string;
  token: string;
  expiresAt: string;
}

// =========================================================================
// Consultant endpoints
// =========================================================================

export interface PublicConsultant {
  id: string;
  fullName: string;
  title: string;
  yearsExperience: number;
  primarySector: Sector;
  skills: string[];
  location: string;
  dayRate: number;
  verified: boolean;
  availability: AvailabilityDayResponse[];
}

export interface DetailedConsultant extends PublicConsultant {
  professionalSummary: string;
  // expanded CV blob URL
  cvUrl?: string;
  // detailed experience + project history (not in MVP)
  detailedExperience?: string;
}

export interface FullConsultant extends DetailedConsultant {
  references: ReferenceResponse[];
  phone: string;
  email: string;
}

export interface ReferenceResponse {
  id: string;
  name: string;
  organisation: string;
  position: string;
  email: string;
  phone: string;
}

export interface AvailabilityDayResponse {
  date: string; // YYYY-MM-DD
  status: DayAvailability;
}

export interface UpdateConsultantRequest {
  title?: string;
  yearsExperience?: number;
  primarySector?: Sector;
  professionalSummary?: string;
  skills?: string[];
  dayRate?: number;
  phone?: string;
  location?: string;
}

export interface AddReferenceRequest {
  name: string;
  organisation: string;
  position: string;
  email: string;
  phone: string;
}

export interface UploadCvResponse {
  blobKey: string;
  uploadedAt: string;
}

export interface UpdateAvailabilityRequest {
  days: AvailabilityDayResponse[];
}

// =========================================================================
// Search endpoints
// =========================================================================

export interface SearchConsultantsRequest {
  skills?: string[];
  sector?: Sector;
  experienceMin?: number;
  availableFrom?: string; // YYYY-MM-DD
  maxDayRate?: number;
  location?: string;
  limit?: number;
  offset?: number;
}

export interface SearchConsultantsResponse {
  total: number;
  results: PublicConsultant[];
}

// =========================================================================
// Engagement endpoints
// =========================================================================

export interface CreateEngagementRequest {
  consultantId: string;
  role: string;
  startDate: string;
  endDate: string;
}

export interface EngagementResponse {
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
  consultantDeadline?: string;
  signedAt?: string;
  declinedAt?: string;
  expiredAt?: string;
  contractBlobKey?: string;
}

export interface UploadContractResponse {
  blobKey: string;
  uploadedAt: string;
  consultantDeadline: string; // 5 days from upload
}

export interface SignEngagementRequest {
  agreed: boolean;
  signature: string; // typed name OR provider signature id
}

export interface DeclineEngagementRequest {
  reason?: string;
}

// =========================================================================
// Admin endpoints
// =========================================================================

export interface AdminApproveConsultantRequest {
  notes?: string;
}

export interface AdminRejectConsultantRequest {
  reason: string;
}

export interface AdminAuditResponse {
  total: number;
  events: AuditEvent[];
}

// =========================================================================
// State machine helpers (used by route handlers to validate transitions)
// =========================================================================

export const ENGAGEMENT_TRANSITIONS: Record<EngagementStatus, EngagementStatus[]> = {
  DRAFT: ["HIRE_REQUESTED"],
  HIRE_REQUESTED: ["CONTRACT_UPLOADED", "EXPIRED"],
  CONTRACT_UPLOADED: ["AWAITING_CONSULTANT", "DECLINED", "EXPIRED"],
  AWAITING_CONSULTANT: ["VIEWED", "DECLINED", "EXPIRED"],
  VIEWED: ["SIGNED", "DECLINED", "EXPIRED"],
  SIGNED: ["CONFIRMED"],
  CONFIRMED: ["ACTIVE"],
  ACTIVE: ["COMPLETED"],
  DECLINED: [],
  EXPIRED: [],
  COMPLETED: [],
};

export function canTransition(
  from: EngagementStatus,
  to: EngagementStatus
): boolean {
  return ENGAGEMENT_TRANSITIONS[from]?.includes(to) ?? false;
}
