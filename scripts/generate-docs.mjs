#!/usr/bin/env node
/**
 * Regenerates docs/NEEDS_VERIFICATION.md and docs/reference/REFERENCE_SHEET.md
 * from the JSON registers so the markdown mirrors can never drift from the data.
 * Run: node scripts/generate-docs.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DISCLAIMER = 'Verify against master controlled copies before operational use.';
const needs = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'needs-verification.json'), 'utf8')
);
const reference = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'reference-sheet.json'), 'utf8')
);

const escMd = (s) => String(s).replace(/\|/g, '\\|');

const nvLines = needs.entries.map((e) => {
  const related = (e.relatedItemIds ?? []).join(', ') || '-';
  return `### ${e.id} — ${e.title}

- **status:** ${e.status}
- **related items:** ${related}
- **evidence:** \`${e.evidence.sourceId}\`${e.evidence.page ? ` p.${e.evidence.page}` : ''} · ${e.evidence.category} · confidence ${e.evidence.confidence} · ${e.evidence.status} · reviewed ${e.evidence.reviewed}

${e.description}
`;
});

const nvDoc = `# Needs Verification Register

> Regenerated from \`src/data/needs-verification.json\` by \`npm run docs:generate\`.
> Do not edit by hand — edit the JSON.

**Policy:** ${needs.meta.policy}

All entries are \`status: open\` as of ${needs.meta.generated}. Known conflicts are preserved, never merged.

${nvLines.join('\n---\n\n')}
`;

writeFileSync(join(root, 'docs', 'NEEDS_VERIFICATION.md'), nvDoc, 'utf8');

const legend = Object.entries(reference.meta.matchLegend)
  .map(([k, v]) => `- \`${k}\` — ${v}`)
  .join('\n');

const rows = reference.photos
  .map((p) => {
    const camera = p.camera ? ` _Camera:_ ${p.camera}` : '';
    const hidden = p.hidden ? ` _Hidden:_ ${p.hidden}` : '';
    return `| ${p.id} | [\`${p.file}\`](photos/${encodeURIComponent(p.file)}) | ${escMd(p.caption)} | ${escMd(p.observed)}${camera}${hidden} | ${p.match} | ${p.review} | \`${p.evidence.sourceId}\` · ${p.evidence.category} · ${p.evidence.confidence} · ${p.evidence.status} · ${p.evidence.reviewed} |`;
  })
  .join('\n');

const refDoc = `# Reference Sheet — 64 source photographs

> Regenerated from \`src/data/reference-sheet.json\` by \`npm run docs:generate\`.
> Do not edit by hand — edit the JSON.

**Review method:** ${reference.meta.reviewMethod}

**Match legend:**

${legend}

**Excluded files:** ${reference.meta.excludedFiles}

Captions below are the *claimed* content from the PDF caption list; "observed" is what the image
actually shows per review. Where \`match\` is not \`match\`, trust the observed column and see
\`docs/NEEDS_VERIFICATION.md\` (NV-007) until re-checked against controlled copies.

| id | file | PDF caption | observed | match | review | evidence |
|----|------|-------------|----------|-------|--------|----------|
${rows}

Generated ${reference.meta.generated}.
`;

writeFileSync(join(root, 'docs', 'reference', 'REFERENCE_SHEET.md'), refDoc, 'utf8');

const hmi = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'hmi-errors.json'), 'utf8')
);

const hmiRows = hmi.entries
  .map((e) => {
    const text = e.text ? escMd(e.text) : '_(text not recovered)_';
    const src = e.sources.map((s) => `[${s.split('/').pop()}](HMI%20errors/${encodeURIComponent(s.split('/').pop())})`).join(', ');
    return `| ${e.id} | \`${e.code}\` | ${text} | ${e.pairing} | ${e.fixStatus} | ${e.seenInPhotos} | ${src} | \`${e.evidence.category}\` · ${e.evidence.confidence} · ${e.evidence.status} · ${e.evidence.reviewed} |`;
  })
  .join('\n');

const hmiDetail = hmi.entries
  .map((e) => {
    const lines = [`### ${e.id} — alarm ${e.code}`, ''];
    lines.push(`- **text:** ${e.text ? escMd(e.text) : '_(text not recovered from the photographs)_'}`);
    lines.push(`- **pairing:** ${e.pairing} · **fix status:** ${e.fixStatus} · seen on ~${e.seenInPhotos} of ${hmi.meta.screens} screens`);
    if (e.candidates.length > 1) {
      lines.push('- **candidate texts preserved (NOT merged):**');
      for (const c of e.candidates) lines.push(`  - ${escMd(c)}`);
    }
    if (e.notes) lines.push(`- **notes:** ${escMd(e.notes)}`);
    lines.push(`- **source screens:** ${e.sources.map((s) => `\`${s.split('/').pop()}\``).join(', ')}${e.seenInPhotos > e.sources.length ? ` (${e.seenInPhotos - e.sources.length} more not listed)` : ''}`);
    lines.push('');
    return lines.join('\n');
  })
  .join('\n');

const hmiDoc = `# HMI error register — induction machine

> Regenerated from \`src/data/hmi-errors.json\` by \`npm run docs:generate\`.
> Do not edit by hand — edit the JSON.

**${DISCLAIMER}**

**Station:** ${hmi.meta.station} · generated ${hmi.meta.generated}
**Source:** ${hmi.meta.source} (${hmi.meta.screens} screening photographs)
**Method:** ${hmi.meta.method}

**Pairing rule:** ${hmi.meta.pairingRule}

**Fixes:** ${hmi.meta.fixes}

**Caveats:** ${hmi.meta.note}

## At a glance

| id | code | text | pairing | fix status | seen in | source screens | evidence |
|----|------|------|---------|------------|----------|----------------|----------|
${hmiRows}

## Entries

${hmiDetail}`;

writeFileSync(join(root, 'docs', 'HMI_ERRORS.md'), hmiDoc, 'utf8');

const ext = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'external-research.json'), 'utf8')
);

const extLines = ext.entries.map((e) => {
  const applies = (e.appliesTo ?? []).join(', ') || '-';
  return `### ${e.id} — ${e.title}

- **claim:** ${e.claim}
- **applies to:** ${applies}
- **evidence:** \`${e.evidence.sourceId}\`${e.evidence.url ? ` · ${e.evidence.url}` : ''}${e.evidence.page ? ` · p.${e.evidence.page}` : ''} · ${e.evidence.category} · confidence ${e.evidence.confidence} · ${e.evidence.status} · reviewed ${e.evidence.reviewed}
`;
});

const extDoc = `# External manufacturer research

> Regenerated from \`src/data/external-research.json\` by \`npm run docs:generate\`.
> Do not edit by hand — edit the JSON.

**${DISCLAIMER}**

**Policy:** ${ext.meta.policy}

**Method:** ${ext.meta.method}

These are PUBLIC manufacturer sources consulted on the recorded dates. They add background
on the machine classes named in the plant document and corroborate or challenge designations.
They never override the plant document, and no entry claims a generic product is the plant's
actual machine.

${extLines.join('\n---\n\n')}
`;

writeFileSync(join(root, 'docs', 'EXTERNAL_RESEARCH.md'), extDoc, 'utf8');

mkdirSync(join(root, 'docs', 'model-checklist'), { recursive: true });

const CHECKLIST_DOCS = {
  INDUCTION: { file: 'induction-machine.md', title: 'induction machine (Phase 2a)' },
  WASH: { file: 'wash-stations.md', title: 'wash stations (Phase 2b)' },
  OVEN: { file: 'draw-oven.md', title: 'draw oven (Phase 2b increment 2)' },
  WORKPIECE: { file: 'cv-or-workpiece.md', title: 'CV OR workpiece (Phase 2b increment 3)' },
  'LINE-END': { file: 'line-end.md', title: 'line end: cooling / unload + boxing (Phase 2b increment 4)' },
  IDENT: { file: 'identification.md', title: 'identification: laser marking + 2D code reader (Phase 2b increment 5)' },
  GAGE: { file: 'gage-station.md', title: 'gage station + operator + line simulation (Phase 3)' }
};

const checklistFiles = readdirSync(join(root, 'src', 'data'))
  .filter((f) => /^model-checklist.*\.json$/.test(f))
  .sort();

const generated = [];
for (const file of checklistFiles) {
  const checklist = JSON.parse(readFileSync(join(root, 'src', 'data', file), 'utf8'));
  const station = String(checklist.meta?.station ?? '');
  const doc = CHECKLIST_DOCS[station] ?? {
    file: `${station.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
    title: station
  };

  const clRows = checklist.items
    .map(
      (i) =>
        `| ${i.id} | ${i.title} | **${i.status.toUpperCase()}** | ${escMd(i.note)} | \`${i.evidence.sourceId}\` · ${i.evidence.category} · ${i.evidence.confidence} |`
    )
    .join('\n');

  const scope = checklist.meta.scope ? `**Scope:** ${checklist.meta.scope}\n\n` : '';

  const clDoc = `# Model checklist — ${doc.title}

> Regenerated from \`src/data/${file}\` by \`npm run docs:generate\`.
> Do not edit by hand — edit the JSON.

**Gate:** ${checklist.meta.gate}
**Station:** ${checklist.meta.station} · generated ${checklist.meta.generated}

${scope}${checklist.meta.note}

| id | checklist item | status | note | evidence |
|----|----------------|--------|------|----------|
${clRows}
${
  station === 'INDUCTION'
    ? `
## Honest summary

- **Exact:** nothing is MEASURED — no controlled drawings exist (NV-011).
- **Photo-supported:** enclosure/window/door, gold cylinders + servo, mesh guard and yellow
  frame, overhead hoses, fixture + quench location, operator panel, maroon box, blue bin.
- **Estimated:** all overall proportions, conveyor style (inferred from the wash station),
  panel seams/vents, fastener layout.
- **Assumed (conceptual layer):** copper coil geometry, teflon spacer, nozzle count (8),
  beacon, rear-side details (never photographed), nameplate wording.
- **Missing:** comparison renders updated after each iteration (docs/compare/induction/).
`
    : ''
}`;

  writeFileSync(join(root, 'docs', 'model-checklist', doc.file), clDoc, 'utf8');
  generated.push(`docs/model-checklist/${doc.file}`);
}

console.log(`docs:generate OK -> docs/NEEDS_VERIFICATION.md, docs/reference/REFERENCE_SHEET.md, docs/HMI_ERRORS.md, docs/EXTERNAL_RESEARCH.md, ${generated.join(', ')}`);
