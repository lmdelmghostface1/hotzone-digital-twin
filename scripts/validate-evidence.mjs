#!/usr/bin/env node
/**
 * Validates that every extracted item and every needs-verification entry
 * carries a valid evidence object (hotzone-rules skill, section 2).
 * Exits non-zero on any failure. Wired into `npm run build`.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CATEGORIES = new Set([
  'document',
  'photographic',
  'external',
  'inference',
  'assumption',
  'needs-verification'
]);
const CONFIDENCES = new Set(['high', 'medium', 'low']);
const STATUSES = new Set(['verified', 'unverified']);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function checkEvidence(where, value) {
  const errors = [];
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [`${where}: evidence is missing or not an object`];
  }
  if (typeof value.sourceId !== 'string' || value.sourceId.length === 0) {
    errors.push(`${where}: evidence.sourceId missing`);
  }
  if (value.page !== undefined && typeof value.page !== 'string') {
    errors.push(`${where}: evidence.page must be a string`);
  }
  if (value.url !== undefined && typeof value.url !== 'string') {
    errors.push(`${where}: evidence.url must be a string`);
  }
  if (!CATEGORIES.has(value.category)) {
    errors.push(`${where}: evidence.category invalid (${String(value.category)})`);
  }
  if (!CONFIDENCES.has(value.confidence)) {
    errors.push(`${where}: evidence.confidence invalid (${String(value.confidence)})`);
  }
  if (!STATUSES.has(value.status)) {
    errors.push(`${where}: evidence.status invalid (${String(value.status)})`);
  }
  if (typeof value.reviewed !== 'string' || !ISO.test(value.reviewed)) {
    errors.push(`${where}: evidence.reviewed must be ISO date (${String(value.reviewed)})`);
  }
  return errors;
}

const errors = [];
const extraction = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'initial-extraction.json'), 'utf8')
);
const needs = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'needs-verification.json'), 'utf8')
);
const reference = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'reference-sheet.json'), 'utf8')
);
const checklistFiles = readdirSync(join(root, 'src', 'data'))
  .filter((f) => /^model-checklist.*\.json$/.test(f))
  .sort();

const items = extraction.items ?? [];
if (!Array.isArray(items) || items.length === 0) {
  errors.push('initial-extraction.json: items array missing or empty');
}
const itemById = new Map();
const seenIds = new Set();
for (const item of items) {
  const where = `item ${String(item.id ?? '(no id)')}`;
  if (typeof item.id !== 'string' || item.id.length === 0) errors.push(`${where}: id missing`);
  else if (seenIds.has(item.id)) errors.push(`${where}: duplicate id`);
  else seenIds.add(item.id);
  if (typeof item.kind !== 'string' || item.kind.length === 0) {
    errors.push(`${where}: kind missing`);
  }
  itemById.set(item.id, item);
  if (typeof item.name !== 'string' || item.name.length === 0) {
    errors.push(`${where}: name missing`);
  }
  if (item.value === undefined || item.value === null || item.value === '') {
    errors.push(`${where}: value missing`);
  }
  errors.push(...checkEvidence(where, item.evidence));
}

const entries = needs.entries ?? [];
if (!Array.isArray(entries) || entries.length === 0) {
  errors.push('needs-verification.json: entries array missing or empty');
}
const seenNv = new Set();
for (const entry of entries) {
  const where = `NV entry ${String(entry.id ?? '(no id)')}`;
  if (typeof entry.id !== 'string' || entry.id.length === 0) errors.push(`${where}: id missing`);
  else if (seenNv.has(entry.id)) errors.push(`${where}: duplicate id`);
  else seenNv.add(entry.id);
  if (typeof entry.title !== 'string' || entry.title.length === 0) {
    errors.push(`${where}: title missing`);
  }
  if (!['open', 'resolved', 'deferred'].includes(entry.status)) {
    errors.push(`${where}: status invalid (${String(entry.status)})`);
  }
  errors.push(...checkEvidence(where, entry.evidence));
}

const photos = reference.photos ?? [];
if (!Array.isArray(photos) || photos.length === 0) {
  errors.push('reference-sheet.json: photos array missing or empty');
}
const photoDir = join(root, 'docs', 'reference', 'photos');
const diskPhotos = new Set(
  readdirSync(photoDir).filter((f) => statSync(join(photoDir, f)).isFile())
);
const seenPhotos = new Set();
const seenFiles = new Set();
const matchLegend = new Set(Object.keys(reference.meta?.matchLegend ?? {}));
for (const p of photos) {
  const where = `photo ${String(p.id ?? '(no id)')}`;
  if (typeof p.id !== 'string' || p.id.length === 0) errors.push(`${where}: id missing`);
  else if (seenPhotos.has(p.id)) errors.push(`${where}: duplicate id`);
  else seenPhotos.add(p.id);
  if (typeof p.file !== 'string' || p.file.length === 0) errors.push(`${where}: file missing`);
  else if (seenFiles.has(p.file)) errors.push(`${where}: duplicate file`);
  else {
    seenFiles.add(p.file);
    if (!diskPhotos.has(p.file)) errors.push(`${where}: file not present in docs/reference/photos: ${p.file}`);
  }
  if (typeof p.caption !== 'string' || p.caption.length === 0) errors.push(`${where}: caption missing`);
  if (typeof p.observed !== 'string' || p.observed.length === 0) errors.push(`${where}: observed missing`);
  if (!matchLegend.has(p.match)) errors.push(`${where}: match value not in matchLegend (${String(p.match)})`);
  if (!['full', 'contact-sheet'].includes(p.review)) {
    errors.push(`${where}: review invalid (${String(p.review)})`);
  }
  errors.push(...checkEvidence(where, p.evidence));
}
for (const f of diskPhotos) {
  if (!seenFiles.has(f)) errors.push(`reference sheet: photo on disk not listed: ${f}`);
}

const seenCl = new Set();
let clItems = 0;
for (const file of checklistFiles) {
  const checklist = JSON.parse(readFileSync(join(root, 'src', 'data', file), 'utf8'));
  const cl = checklist.items ?? [];
  if (!Array.isArray(cl) || cl.length === 0) {
    errors.push(`${file}: items array missing or empty`);
    continue;
  }
  if (!checklist.meta?.station) errors.push(`${file}: meta.station missing`);
  for (const item of cl) {
    const where = `${file} item ${String(item.id ?? '(no id)')}`;
    if (typeof item.id !== 'string' || item.id.length === 0) errors.push(`${where}: id missing`);
    else if (seenCl.has(item.id)) errors.push(`${where}: duplicate id across checklists`);
    else seenCl.add(item.id);
    if (typeof item.title !== 'string' || item.title.length === 0) errors.push(`${where}: title missing`);
    if (typeof item.note !== 'string' || item.note.length === 0) errors.push(`${where}: note missing`);
    if (!['done', 'partial', 'missing'].includes(item.status)) {
      errors.push(`${where}: status invalid (${String(item.status)})`);
    }
    errors.push(...checkEvidence(where, item.evidence));
    clItems += 1;
  }
}

const hmi = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'hmi-errors.json'), 'utf8')
);
const PAIRINGS = new Set(['clear', 'probable', 'unclear']);
const FIX_STATUSES = new Set(['open', 'in-progress', 'fixed', 'not-an-issue']);
const hmiEntries = hmi.entries ?? [];
if (!Array.isArray(hmiEntries) || hmiEntries.length === 0) {
  errors.push('hmi-errors.json: entries array missing or empty');
}
if (typeof hmi.meta?.method !== 'string' || hmi.meta.method.length === 0) {
  errors.push('hmi-errors.json: meta.method missing');
}
const seenHmiIds = new Set();
const seenHmiCodes = new Set();
for (const entry of hmiEntries) {
  const where = `HMI entry ${String(entry.id ?? '(no id)')}`;
  if (typeof entry.id !== 'string' || entry.id.length === 0) errors.push(`${where}: id missing`);
  else if (seenHmiIds.has(entry.id)) errors.push(`${where}: duplicate id`);
  else seenHmiIds.add(entry.id);
  if (typeof entry.code !== 'string' || !/^\d{3,6}$/.test(entry.code)) {
    errors.push(`${where}: code must be a digit string (${String(entry.code)})`);
  } else if (seenHmiCodes.has(entry.code)) {
    errors.push(`${where}: duplicate code ${entry.code}`);
  } else seenHmiCodes.add(entry.code);
  if (typeof entry.text !== 'string') errors.push(`${where}: text must be a string`);
  if (!Array.isArray(entry.candidates)) errors.push(`${where}: candidates must be an array`);
  else if (entry.candidates.some((c) => typeof c !== 'string' || c.length === 0)) {
    errors.push(`${where}: candidates must be non-empty strings`);
  }
  if (entry.text !== '' && Array.isArray(entry.candidates) && !entry.candidates.includes(entry.text)) {
    errors.push(`${where}: text is not one of the candidates`);
  }
  if (!PAIRINGS.has(entry.pairing)) errors.push(`${where}: pairing invalid (${String(entry.pairing)})`);
  if (!FIX_STATUSES.has(entry.fixStatus)) errors.push(`${where}: fixStatus invalid (${String(entry.fixStatus)})`);
  if (typeof entry.seenInPhotos !== 'number' || entry.seenInPhotos < 1) {
    errors.push(`${where}: seenInPhotos must be a positive number`);
  }
  if (!Array.isArray(entry.sources) || entry.sources.length === 0) {
    errors.push(`${where}: sources missing`);
  } else {
    for (const s of entry.sources) {
      if (typeof s !== 'string' || !s.startsWith('docs/HMI errors/')) {
        errors.push(`${where}: source must be a docs/HMI errors path (${String(s)})`);
      } else if (!existsSync(join(root, s))) {
        errors.push(`${where}: source file not on disk (${s})`);
      }
    }
  }
  errors.push(...checkEvidence(where, entry.evidence));
}

const external = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'external-research.json'), 'utf8')
);
const extEntries = external.entries ?? [];
if (!Array.isArray(extEntries) || extEntries.length === 0) {
  errors.push('external-research.json: entries array missing or empty');
}
if (typeof external.meta?.policy !== 'string' || external.meta.policy.length === 0) {
  errors.push('external-research.json: meta.policy missing');
}
const seenExt = new Set();
for (const entry of extEntries) {
  const where = `external entry ${String(entry.id ?? '(no id)')}`;
  if (typeof entry.id !== 'string' || entry.id.length === 0) errors.push(`${where}: id missing`);
  else if (seenExt.has(entry.id)) errors.push(`${where}: duplicate id`);
  else seenExt.add(entry.id);
  if (typeof entry.title !== 'string' || entry.title.length === 0) errors.push(`${where}: title missing`);
  if (typeof entry.claim !== 'string' || entry.claim.length === 0) errors.push(`${where}: claim missing`);
  if (!Array.isArray(entry.appliesTo) || entry.appliesTo.some((a) => typeof a !== 'string' || a.length === 0)) {
    errors.push(`${where}: appliesTo must be an array of non-empty strings`);
  }
  errors.push(...checkEvidence(where, entry.evidence));
  if (entry.evidence?.url === undefined && entry.negativeSearch !== true) {
    errors.push(`${where}: external entry requires evidence.url (or negativeSearch: true for a recorded search that found nothing)`);
  }
  if (entry.evidence?.category !== 'external') {
    errors.push(`${where}: external entry must use category 'external'`);
  }
}

// ---------------------------------------------------------------------------
// Phase 5: procedures + faults registers
// ---------------------------------------------------------------------------

const procedures = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'procedures.json'), 'utf8')
);
const proceduresList = procedures.procedures ?? [];
if (!Array.isArray(proceduresList) || proceduresList.length === 0) {
  errors.push('procedures.json: procedures array missing or empty');
}
for (const key of ['project', 'policy', 'safetyDisclaimer', 'scoring']) {
  if (typeof procedures.meta?.[key] !== 'string' || procedures.meta[key].length === 0) {
    errors.push(`procedures.json: meta.${key} missing`);
  }
}
const seenProc = new Set();
for (const proc of proceduresList) {
  const where = `procedure ${String(proc.id ?? '(no id)')}`;
  if (typeof proc.id !== 'string' || proc.id.length === 0) errors.push(`${where}: id missing`);
  else if (seenProc.has(proc.id)) errors.push(`${where}: duplicate id`);
  else seenProc.add(proc.id);
  if (typeof proc.title !== 'string' || proc.title.length === 0) errors.push(`${where}: title missing`);
  if (!Array.isArray(proc.steps) || proc.steps.length === 0) {
    errors.push(`${where}: steps missing or empty`);
    continue;
  }
  // verbatim + order check against the extraction register
  const byItem = new Map();
  for (const step of proc.steps) {
    const sWhere = `${where} step ${String(step.id ?? '?')}`;
    if (typeof step.sourceItem !== 'string' || step.sourceItem.length === 0) {
      errors.push(`${sWhere}: sourceItem missing`);
      continue;
    }
    const src = itemById.get(step.sourceItem);
    if (!src) {
      errors.push(`${sWhere}: sourceItem ${step.sourceItem} not in extraction register`);
      continue;
    }
    if (typeof step.manual !== 'boolean') errors.push(`${sWhere}: manual must be boolean`);
    if (typeof step.instruction !== 'string' || step.instruction.trim().length === 0) {
      errors.push(`${sWhere}: instruction missing`);
      continue;
    }
    // the instruction must appear in the source value in documented order
    let pos = byItem.get(step.sourceItem)?.pos ?? 0;
    const inst = step.instruction.trim();
    const found = src.value.indexOf(inst, pos);
    if (found < 0) {
      errors.push(`${sWhere}: instruction not found (verbatim) in ${step.sourceItem} value`);
    } else {
      pos = found + inst.length;
    }
    byItem.set(step.sourceItem, { pos });
    errors.push(...checkEvidence(sWhere, step.evidence));
  }
}

const faults = JSON.parse(readFileSync(join(root, 'src', 'data', 'faults.json'), 'utf8'));
const faultsList = faults.faults ?? [];
if (!Array.isArray(faultsList) || faultsList.length === 0) {
  errors.push('faults.json: faults array missing or empty');
}
for (const key of ['project', 'policy', 'safetyDisclaimer']) {
  if (typeof faults.meta?.[key] !== 'string' || faults.meta[key].length === 0) {
    errors.push(`faults.json: meta.${key} missing`);
  }
}
// signals are parsed from the typed bus source so the trigger cannot drift
const busSrc = readFileSync(join(root, 'src', 'sim', 'bus.ts'), 'utf8');
const busKeys = new Set(
  [...busSrc.matchAll(/key:\s*'([^']+)+'/g)].map((m) => m[1])
);
const seenFault = new Set();
for (const fault of faultsList) {
  const where = `fault ${String(fault.id ?? '(no id)')}`;
  if (typeof fault.id !== 'string' || fault.id.length === 0) errors.push(`${where}: id missing`);
  else if (seenFault.has(fault.id)) errors.push(`${where}: duplicate id`);
  else seenFault.add(fault.id);
  for (const k of ['label', 'category', 'station', 'machine']) {
    if (typeof fault[k] !== 'string' || fault[k].length === 0) {
      errors.push(`${where}: ${k} missing`);
    }
  }
  if (fault.trigger?.signal != null && !busKeys.has(fault.trigger.signal)) {
    errors.push(`${where}: trigger.signal ${String(fault.trigger.signal)} is not a typed bus signal`);
  }
  const react = fault.reaction;
  if (!react || !['training-scenario', 'documented'].includes(react.kind)) {
    errors.push(`${where}: reaction.kind invalid`);
  } else {
    if (typeof react.note !== 'string' || react.note.length === 0) {
      errors.push(`${where}: reaction.note missing`);
    }
    if (react.kind === 'documented' && !proceduresList.some((p) => p.id === react.procedureId)) {
      errors.push(`${where}: documented reaction references missing procedure ${String(react.procedureId)}`);
    }
    if (react.kind === 'training-scenario' && (!Array.isArray(react.steps) || react.steps.length === 0)) {
      errors.push(`${where}: training-scenario remedy steps missing`);
    }
  }
  if (fault.alarm) {
    const reg = hmiEntries.find((e) => e.id === fault.alarm.id);
    if (!reg) errors.push(`${where}: alarm ${String(fault.alarm.id)} not in HMI register`);
    else if (reg.code !== fault.alarm.code || reg.text !== fault.alarm.text) {
      errors.push(`${where}: alarm code/text does not match the HMI register verbatim`);
    }
    errors.push(...checkEvidence(`${where}.alarmEvidence`, fault.alarmEvidence));
  }
  errors.push(...checkEvidence(`${where}`, fault.evidence));
}

if (errors.length > 0) {
  console.error(`evidence validation FAILED (${errors.length} problem(s)):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `evidence validation OK: ${items.length} items, ${entries.length} needs-verification entries, ${photos.length} reference photos, ${clItems} checklist items across ${checklistFiles.length} checklist file(s), ${hmiEntries.length} HMI error entries, ${extEntries.length} external research entries, ${proceduresList.length} procedures, ${faultsList.length} faults, all with valid evidence.`
);
