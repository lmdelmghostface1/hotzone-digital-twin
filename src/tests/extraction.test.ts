import { describe, it, expect } from 'vitest';
import extraction from '../data/initial-extraction.json';
import needs from '../data/needs-verification.json';
import reference from '../data/reference-sheet.json';
import hmiRaw from '../data/hmi-errors.json';
import { isEvidence, evidenceError } from '../types/evidence';

interface Item {
  id: string;
  kind: string;
  name: string;
  value: unknown;
  notes?: string;
  evidence: unknown;
}

interface NvEntry {
  id: string;
  title: string;
  status: string;
  evidence: unknown;
}

interface ReferencePhoto {
  id: string;
  file: string;
  caption: string;
  observed: string;
  match: string;
  review: string;
  evidence: unknown;
}

const items = (extraction as { items: Item[] }).items;
const entries = (needs as { entries: NvEntry[] }).entries;
const photos = (reference as { photos: ReferencePhoto[] }).photos;
const matchLegend = (reference as { meta: { matchLegend: Record<string, string> } }).meta
  .matchLegend;

describe('initial extraction', () => {
  it('contains items', () => {
    expect(items.length).toBeGreaterThan(100);
  });

  it('has unique ids', () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item carries a valid evidence object', () => {
    const bad = items.filter((i) => !isEvidence(i.evidence));
    expect(bad.map((i) => `${i.id}: ${evidenceError(i.evidence)}`)).toEqual([]);
  });

  it('every item has kind, name and value', () => {
    const bad = items.filter(
      (i) => !i.kind || !i.name || i.value === undefined || i.value === null || i.value === ''
    );
    expect(bad.map((i) => i.id)).toEqual([]);
  });

  it('keeps the washer concentration conflict as two separate values (NV-001)', () => {
    const setup = items.find((i) => i.id === 'PR-103');
    const cp = items.find((i) => i.id === 'CP-014');
    expect(setup?.value).toContain('2.8');
    expect(cp?.value).toContain('3.5-9.5');
  });

  it('marks screenshot-derived values as observed-only in notes', () => {
    const observed = items.filter((i) => i.kind === 'hmi-observed');
    expect(observed.length).toBeGreaterThan(10);
    for (const o of observed) {
      expect(String(o.notes ?? '')).toMatch(/observed/i);
    }
  });
});

describe('needs-verification register', () => {
  it('contains entries', () => {
    expect(entries.length).toBeGreaterThan(5);
  });

  it('has unique ids', () => {
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry carries a valid evidence object', () => {
    const bad = entries.filter((e) => !isEvidence(e.evidence));
    expect(bad.map((e) => `${e.id}: ${evidenceError(e.evidence)}`)).toEqual([]);
  });

  it('includes the known concentration conflict', () => {
    expect(entries.some((e) => e.id === 'NV-001')).toBe(true);
  });
});

describe('reference sheet', () => {
  it('covers all 64 photos with unique ids', () => {
    expect(photos.length).toBe(64);
    const ids = photos.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every photo carries a valid evidence object', () => {
    const bad = photos.filter((p) => !isEvidence(p.evidence));
    expect(bad.map((p) => `${p.id}: ${evidenceError(p.evidence)}`)).toEqual([]);
  });

  it('match flags come from the declared legend', () => {
    const bad = photos.filter((p) => !(p.match in matchLegend));
    expect(bad.map((p) => `${p.id}:${p.match}`)).toEqual([]);
  });

  it('every photo has caption and observed text', () => {
    const bad = photos.filter((p) => !p.caption || !p.observed || p.review !== 'full' && p.review !== 'contact-sheet');
    expect(bad.map((p) => p.id)).toEqual([]);
  });

  it('flags at least one caption/content mismatch (NV-007)', () => {
    expect(photos.filter((p) => p.match === 'mismatch').length).toBeGreaterThan(10);
  });
});

describe('HMI error register', () => {
  const hmi = hmiRaw as {
    meta: { method: string; screens: number };
    entries: {
      id: string;
      code: string;
      text: string;
      candidates: string[];
      pairing: string;
      fixStatus: string;
      seenInPhotos: number;
      sources: string[];
      evidence: unknown;
    }[];
  };
  const hmiEntries = hmi.entries;

  it('transcribes all 53 alarm screens into entries', () => {
    expect(hmi.meta.screens).toBe(53);
    expect(hmiEntries.length).toBeGreaterThan(60);
  });

  it('has unique ids and codes', () => {
    expect(new Set(hmiEntries.map((e) => e.id)).size).toBe(hmiEntries.length);
    expect(new Set(hmiEntries.map((e) => e.code)).size).toBe(hmiEntries.length);
  });

  it('every entry carries a valid evidence object', () => {
    const bad = hmiEntries.filter((e) => !isEvidence(e.evidence));
    expect(bad.map((e) => `${e.id}: ${evidenceError(e.evidence)}`)).toEqual([]);
  });

  it('uses only the declared pairing and fix-status vocabularies', () => {
    for (const e of hmiEntries) {
      expect(['clear', 'probable', 'unclear']).toContain(e.pairing);
      expect(['open', 'in-progress', 'fixed', 'not-an-issue']).toContain(e.fixStatus);
    }
  });

  it('keeps every text one of its own candidates and never invents a source', () => {
    for (const e of hmiEntries) {
      if (e.text !== '') expect(e.candidates).toContain(e.text);
      expect(e.sources.length).toBeGreaterThan(0);
      for (const s of e.sources) expect(s.startsWith('docs/HMI errors/')).toBe(true);
    }
  });

  it('marks the OCR-derived evidence as unverified photographic, reviewed 2026-10-17', () => {
    const ev = hmiEntries.map((e) => e.evidence as { category: string; status: string; reviewed: string });
    expect(ev.every((e) => e.category === 'photographic')).toBe(true);
    expect(ev.every((e) => e.status === 'unverified')).toBe(true);
    expect(ev.every((e) => e.reviewed === '2026-10-17')).toBe(true);
    expect(hmi.meta.method).toMatch(/NOT verified/i);
  });

  it('preserves the BRIX/BRAX conflict instead of merging it (NV-017)', () => {
    const brix = hmiEntries.find((e) => e.code === '700826');
    expect(brix?.text).toContain('BRIX');
    expect(brix?.candidates.some((c) => c.includes('BRAX'))).toBe(true);
  });
});

describe('evidence helper', () => {
  it('rejects missing evidence', () => {
    expect(isEvidence(undefined)).toBe(false);
    expect(isEvidence(null)).toBe(false);
  });

  it('rejects bad category/date', () => {
    expect(
      isEvidence({
        sourceId: 'x',
        category: 'nope',
        confidence: 'high',
        status: 'unverified',
        reviewed: '2026-10-15'
      })
    ).toBe(false);
    expect(
      isEvidence({
        sourceId: 'x',
        category: 'document',
        confidence: 'high',
        status: 'unverified',
        reviewed: '15/10/2026'
      })
    ).toBe(false);
  });

  it('accepts a well-formed object', () => {
    expect(
      isEvidence({
        sourceId: 'Project_Document.pdf',
        page: '3',
        category: 'document',
        confidence: 'high',
        status: 'unverified',
        reviewed: '2026-10-15'
      })
    ).toBe(true);
  });
});
