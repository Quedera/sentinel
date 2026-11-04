// QUEDERA SENTINEL — profile completeness (decision #6)
//
// Locked 2026-10-18: "pure UX, weighted by field importance, soft nudge,
// no gating".
//
// This module computes a 0..100 score from a consultant's profile. It is
// deliberately NOT a gate: nothing in the app blocks a consultant because
// their score is low. It drives a nudge on the dashboard only.
//
// Weights are relative, not absolute — a consultant missing a low-weight
// field still reads as "mostly complete", which is the intent of a soft
// nudge rather than a checklist.

/**
 * Field weights, summing to 100.
 *
 * CV is the heaviest signal because it is the single artefact a client
 * cannot verify any other way. References follow — they carry the trust
 * proposition. Skills, rate and summary are progressively more routine.
 */
export const COMPLETENESS_WEIGHTS = {
  cv: 30,
  references: 25,
  skills: 20,
  dayRate: 15,
  summary: 10,
} as const;

export type CompletenessField = keyof typeof COMPLETENESS_WEIGHTS;

export interface CompletenessInput {
  hasCv: boolean;
  referenceCount: number;
  skillCount: number;
  dayRate: number;
  hasSummary: boolean;
}

export interface CompletenessResult {
  /** 0..100, rounded. */
  percent: number;
  /** One entry per weighted field, for rendering the breakdown. */
  fields: Array<{
    field: CompletenessField;
    label: string;
    done: boolean;
    /** Points earned for this field. */
    earned: number;
    /** Points available for this field. */
    possible: number;
  }>;
  /** Fields still outstanding, heaviest first. */
  missing: CompletenessField[];
}

const LABELS: Record<CompletenessField, string> = {
  cv: "CV uploaded",
  references: "References supplied",
  skills: "Skills completed",
  dayRate: "Day rate set",
  summary: "Professional summary added",
};

/**
 * How many references count as "supplied".
 *
 * Two is the wireframe's own example (see the SENTINEL.docx CV & references
 * screen, which shows Reference 1 and Reference 2). Partial credit is
 * deliberately NOT given — a single reference reads the same as none for
 * the trust proposition, and giving half marks would overstate the profile.
 */
export const REFERENCES_REQUIRED = 2;

export function computeCompleteness(input: CompletenessInput): CompletenessResult {
  const done: Record<CompletenessField, boolean> = {
    cv: input.hasCv,
    references: input.referenceCount >= REFERENCES_REQUIRED,
    skills: input.skillCount > 0,
    dayRate: input.dayRate > 0,
    summary: input.hasSummary,
  };

  const fields = (Object.keys(COMPLETENESS_WEIGHTS) as CompletenessField[]).map(
    (field) => {
      const possible = COMPLETENESS_WEIGHTS[field];
      return {
        field,
        label: LABELS[field],
        done: done[field],
        earned: done[field] ? possible : 0,
        possible,
      };
    }
  );

  const earned = fields.reduce((sum, f) => sum + f.earned, 0);
  const total = Object.values(COMPLETENESS_WEIGHTS).reduce((a, b) => a + b, 0);

  return {
    percent: Math.round((earned / total) * 100),
    fields,
    missing: fields.filter((f) => !f.done).map((f) => f.field),
  };
}
