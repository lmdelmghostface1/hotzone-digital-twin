/**
 * Evidence metadata types.
 *
 * Rule (hotzone-rules skill, section 2): every component, tag, parameter, alarm,
 * procedure step and fault MUST carry an `evidence` object. The build
 * (npm run build -> scripts/validate-evidence.mjs) and the test suite
 * (src/tests/evidence.test.ts) fail if an item is missing one.
 */

export type EvidenceCategory =
  | 'document'
  | 'photographic'
  | 'external'
  | 'inference'
  | 'assumption'
  | 'needs-verification';

export type EvidenceConfidence = 'high' | 'medium' | 'low';
export type EvidenceStatus = 'verified' | 'unverified';

export interface Evidence {
  /** Identifier of the source (e.g. "Project_Document.pdf", "PHOTO-4.20.44-PM"). */
  sourceId: string;
  /** Page or section inside the source, when applicable. */
  page?: string;
  /** URL for 'external' sources. */
  url?: string;
  category: EvidenceCategory;
  confidence: EvidenceConfidence;
  status: EvidenceStatus;
  /** ISO date (YYYY-MM-DD) of the last review. */
  reviewed: string;
}

export const EVIDENCE_CATEGORIES: readonly EvidenceCategory[] = [
  'document',
  'photographic',
  'external',
  'inference',
  'assumption',
  'needs-verification'
] as const;

export const EVIDENCE_CONFIDENCES: readonly EvidenceConfidence[] = [
  'high',
  'medium',
  'low'
] as const;

export const EVIDENCE_STATUSES: readonly EvidenceStatus[] = [
  'verified',
  'unverified'
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isEvidence(value: unknown): value is Evidence {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.sourceId === 'string' &&
    e.sourceId.length > 0 &&
    (e.page === undefined || typeof e.page === 'string') &&
    (e.url === undefined || typeof e.url === 'string') &&
    EVIDENCE_CATEGORIES.includes(e.category as EvidenceCategory) &&
    EVIDENCE_CONFIDENCES.includes(e.confidence as EvidenceConfidence) &&
    EVIDENCE_STATUSES.includes(e.status as EvidenceStatus) &&
    typeof e.reviewed === 'string' &&
    ISO_DATE.test(e.reviewed)
  );
}

export function evidenceError(value: unknown): string | null {
  if (isEvidence(value)) return null;
  if (typeof value !== 'object' || value === null) return 'evidence is missing or not an object';
  const e = value as Record<string, unknown>;
  if (typeof e.sourceId !== 'string' || e.sourceId.length === 0)
    return 'evidence.sourceId missing';
  if (!EVIDENCE_CATEGORIES.includes(e.category as EvidenceCategory))
    return `evidence.category invalid: ${String(e.category)}`;
  if (!EVIDENCE_CONFIDENCES.includes(e.confidence as EvidenceConfidence))
    return `evidence.confidence invalid: ${String(e.confidence)}`;
  if (!EVIDENCE_STATUSES.includes(e.status as EvidenceStatus))
    return `evidence.status invalid: ${String(e.status)}`;
  if (typeof e.reviewed !== 'string' || !ISO_DATE.test(e.reviewed))
    return `evidence.reviewed must be ISO date: ${String(e.reviewed)}`;
  return 'evidence failed validation';
}
