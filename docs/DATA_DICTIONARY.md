# Data dictionary

All registers live in `src/data/*.json` and are validated by
`scripts/validate-evidence.mjs` (build gate) plus `src/tests/extraction.test.ts`.

## `initial-extraction.json`

```jsonc
{
  "meta": { "schemaVersion": 1, "generated": "2026-10-15", "project": "...",
            "sourceDoc": { ... }, "statusRule": "...", "observedValueRule": "..." },
  "items": [
    {
      "id": "EQ-001",          // unique, prefix per kind (see table)
      "kind": "equipment",      // one of the kinds below
      "name": "Wash Station (TP & CV)",
      "value": "…",             // string; never null/empty
      "notes": "…",             // optional
      "evidence": { ... }       // REQUIRED
    }
  ]
}
```

### Kinds and id prefixes (213 items)

| kind | meaning | id prefix |
|------|---------|-----------|
| `equipment` | machine/unit of the line | `EQ-` |
| `process-step` | step of the line process flow | `PS-` / process ids |
| `parameter` | recipe or setup parameter (washer, oven, induction) | `PR-` |
| `policy` | plant policy / stated rule | `PL-` |
| `control-check` | control plan check (OCP34417178) | `CP-` |
| `procedure` | whole procedure or procedure document | `PC-` |
| `procedure-step` | numbered step inside a procedure | `CR-` / step ids |
| `quality-standard` | OK/NOK visual standard | `QS-` |
| `safety` | LOTO / safety rule | `SF-` |
| `ip-device` | network device from the IP table | `IP-` |
| `note` | editorial note / open observation | `NT-` |
| `hmi` | HMI screen or element (structure, not values) | `HM-` |
| `alarm` | documented alarm text | `AL-` |
| `nc-line` | transcribed NC program block | `NC-` |
| `hmi-observed` | value read off a screenshot — observed only | `OB-` |
| `part-program` | NC part program identity (STEM/BELL MPF) | `PP-` |
| `role` | operator / maintenance / quality role | `RO-` |
| `document` | document in the source list with id/revision | `DC-` |

## `needs-verification.json`

```jsonc
{ "meta": { "policy": "…conflicts preserved, never merged…" },
  "entries": [
    { "id": "NV-001", "title": "…", "status": "open|resolved|deferred",
      "description": "…", "relatedItemIds": ["PR-103"], "evidence": { ... } }
  ] }
```

Currently 15 entries, all `open`. Mirrored in `docs/NEEDS_VERIFICATION.md` (generated).

## `reference-sheet.json`

```jsonc
{ "meta": { "reviewMethod": "…", "matchLegend": { "match": "…", "mismatch": "…",
             "caption-missing": "…", "unclear": "…" }, "excludedFiles": "…" },
  "photos": [
    { "id": "PHOTO-01", "file": "WhatsApp Image ….jpeg", "caption": "PDF claim",
      "observed": "reviewed content", "match": "match|mismatch|caption-missing|unclear",
      "review": "full|contact-sheet", "camera": "…", "hidden": "…",
      "station": "WASH-BLANK", "evidence": { ... } }
  ] }
```

64 entries, one per supplied file; every on-disk photo must be listed and every
listed file must exist (build gate).

## `evidence` object (required everywhere)

```ts
{
  sourceId: string;      // e.g. "Project_Document.pdf" or "PHOTO:4.20.44 PM.jpeg"
  page?: string;         // page/section inside the source
  url?: string;          // for category "external"
  category: 'document' | 'photographic' | 'external' | 'inference'
          | 'assumption' | 'needs-verification';
  confidence: 'high' | 'medium' | 'low';
  status: 'verified' | 'unverified';   // Phase 1: everything is 'unverified'
  reviewed: string;      // ISO date YYYY-MM-DD
}
```

- `document` / `photographic` — seen in the supplied PDF or a supplied photo.
- `inference` — plausible, unconfirmed; must not drive behaviour silently.
- `assumption` — educational simulation value; labelled not validated.
- `needs-verification` — unclear, contradictory or unreadable; has an `NV-` entry.

## Value rules

1. **Never merge conflicts.** Example: washer concentration 2.8 % (setup sheet, `PR-103`)
   and 3.5–9.5 % (control plan, `CP-014`) both exist; `NV-001` registers the conflict.
2. **Screenshot values are observations.** `hmi-observed` items (e.g. bell external shower
   117.9 LPM, quench 34.6 °C, Brix 3.7 %, heat time 69 s) are NOT setpoints, limits or
   fault conditions.
3. **Unknown means marked.** Blank cells in the source (e.g. stem frequency, `NV-012`)
   stay blank; no value is invented.
