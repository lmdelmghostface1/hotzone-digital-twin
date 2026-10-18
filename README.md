# Hot Zone CV joint line — digital twin (Phase 1)

Virtual **training simulator** for the Nexteer Plant 78 Hot Zone CV joint line
(TRIPOT housing / CVOR). Built from a photo compilation, **not** controlled master
documentation.

> **Verify against master controlled copies before operational use.**

## Status: Phase 1 checkpoint (extraction and architecture)

Done in this checkpoint:

- Source material collected and reviewed: `docs/sources/Project_Document.pdf` (75 pp.)
  and all 64 reference photographs in `docs/reference/photos/`.
- **213 extracted items** (equipment, process, recipes, control plan, procedures, IP
  table, alarms, NC lines, observed HMI values, documents…) in
  `src/data/initial-extraction.json`, each with an `evidence` object.
- **15 needs-verification entries** (`src/data/needs-verification.json`) — conflicts
  preserved, never merged (NV-001 washer concentration, NV-007 caption mismatches,
  NV-011 missing induction-machine reference photo, …).
- **64-photo reference sheet** (`src/data/reference-sheet.json`) recording PDF caption vs
  reviewed observed content, match flags, camera/occlusion notes and evidence.
- Evidence gate wired into the build: missing/invalid evidence **fails** `npm run build`.
- Runnable register viewer (Extraction / Needs verification / Reference sheet / Sources).

## Run it

```sh
npm install
npm run dev        # local viewer
npm run build      # validate evidence + typecheck + bundle  (must pass)
npm test           # vitest evidence/conflict tests
npm run docs:generate   # regenerate docs/NEEDS_VERIFICATION.md + REFERENCE_SHEET.md
```

## Layout

- `docs/` — master prompt, sources, architecture, safety, data dictionary, generated
  registers, reference photos.
- `src/data/` — JSON registers (single source of truth).
- `src/main.ts` — register viewer UI.
- `scripts/validate-evidence.mjs` — build gate for evidence metadata.
- `src/tests/extraction.test.ts` — evidence + conflict-preservation tests.

See `docs/ARCHITECTURE.md`, `docs/SOURCES.md`, `docs/NEEDS_VERIFICATION.md`,
`docs/SAFETY_AND_LIMITATIONS.md`, `docs/DATA_DICTIONARY.md`,
`docs/reference/REFERENCE_SHEET.md`.

## Not yet built (later phases)

3D station models, simulation core, HMI/PLC screens, procedures/faults, learning mode.
Nothing in this checkpoint simulates plant behaviour.

## Rules

Honesty first: no invented specs, no claim of running anything that was not run, no
simulated OK part as production approval, no connection to any real PLC or factory
network. Full statement: `docs/SAFETY_AND_LIMITATIONS.md`.
