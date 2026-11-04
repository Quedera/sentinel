// QUEDERA SENTINEL — engagement termination & penalties (decision #5)
//
// Locked 2026-10-18: "Contracts termination penalty both sides."
//
// Interpretation: the penalty is SYMMETRIC. It does not matter which party
// walks away — client or consultant — the same rule applies. The party who
// initiates termination is charged the penalty.
//
// Two numbers are flagged as DECISION REQUIRED (see README "Not yet wired"):
//   1. the penalty rate (default 10%)
//   2. whether notice applies before a mid-engagement cancellation

/**
 * Penalty rate as a fraction of remaining contracted value.
 *
 * LOCKED 2026-11-04 (delegated to TACbot): 10%. Symmetric — the same rate
 * applies whichever side walks away.
 */
export const TERMINATION_PENALTY_RATE = 0.1;

/**
 * Notice period in days for a mid-engagement cancellation.
 *
 * LOCKED 2026-11-04 (delegated to TACbot): 14 days. A party that gives no
 * notice is charged the full penalty; a party that gives notice pays the
 * penalty but the effective date moves to the end of the notice window.
 */
export const TERMINATION_NOTICE_DAYS = 14;

export type TerminationSide = "CLIENT" | "CONSULTANT";

export interface TerminationCalcInput {
  /** Day rate in pence (integer). */
  dayRatePence: number;
  /** Total contracted days on the engagement. */
  estimatedDays: number;
  /** Days already worked (inclusive of the start date). */
  daysElapsed: number;
  /** Which side initiated the termination. */
  side: TerminationSide;
  /** Whether the initiating party gave the notice period. */
  gaveNotice: boolean;
  /** Optional explicit penalty rate override. */
  penaltyRate?: number;
}

export interface TerminationCalcResult {
  /** Total contracted value in pence. */
  contractValuePence: number;
  /** Value of work not yet delivered, in pence. */
  remainingValuePence: number;
  /** Penalty charged to the initiating party, in pence. */
  penaltyPence: number;
  /** Effective date the engagement ends. */
  effectiveDate: Date;
  /** Notice period observed, in days. */
  noticeDays: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculate the symmetric termination penalty.
 *
 * The penalty is charged on the value of work NOT yet delivered — you cannot
 * be penalised for leaving a job you already completed. Both sides are
 * treated identically: the rate is applied to the same remaining value
 * regardless of who initiated.
 */
export function calculateTermination(
  input: TerminationCalcInput,
  now: Date = new Date()
): TerminationCalcResult {
  const contractValuePence = input.dayRatePence * input.estimatedDays;
  const daysElapsed = Math.max(0, Math.min(input.estimatedDays, input.daysElapsed));
  const daysRemaining = Math.max(0, input.estimatedDays - daysElapsed);
  const remainingValuePence = input.dayRatePence * daysRemaining;

  const rate = input.penaltyRate ?? TERMINATION_PENALTY_RATE;
  const penaltyPence = Math.round(remainingValuePence * rate);

  const noticeDays = input.gaveNotice ? TERMINATION_NOTICE_DAYS : 0;
  const effectiveDate = new Date(now.getTime() + noticeDays * MS_PER_DAY);

  return {
    contractValuePence,
    remainingValuePence,
    penaltyPence,
    effectiveDate,
    noticeDays,
  };
}

/**
 * Which side a user sits on for a given engagement.
 */
export function sideForUser(
  userId: string,
  engagement: { consultant: { userId: string }; client: { userId: string } }
): TerminationSide | null {
  if (engagement.consultant.userId === userId) return "CONSULTANT";
  if (engagement.client.userId === userId) return "CLIENT";
  return null;
}
