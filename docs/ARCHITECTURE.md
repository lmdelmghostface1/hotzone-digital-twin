# Architecture

> Phase 1 checkpoint. This document describes the structure as built and the
> planned structure for later phases. Planned parts are marked *(planned)*.

## Ground rules (from the hotzone-rules skill)

- The app always displays: **"Verify against master controlled copies before operational use."**
- Every component, tag, parameter, alarm, procedure step and fault carries an `evidence`
  object; the build fails if one is missing.
- Conflicting values are preserved and registered, never merged or silently corrected.
- Screenshot values are observed-only, never setpoints, limits or fault conditions.

## Current layout

```
hotzone-digital-twin/
  index.html                  app shell (disclaimer banner + tabs)
  package.json                scripts: dev / build / test / docs:generate / validate:evidence
  vite.config.ts              base './', plugin serving + copying docs/reference/photos
  tsconfig.json               strict, noEmit, resolveJsonModule
  scripts/
    validate-evidence.mjs     build gate: evidence on every record in all 3 JSON registers
    generate-docs.mjs         regenerates docs/NEEDS_VERIFICATION.md and REFERENCE_SHEET.md from JSON
  docs/
    MASTER_PROMPT.md          master prompt (source of phase definitions)
    SOURCES.md                what source material exists and its trust level
    ARCHITECTURE.md           this file
    NEEDS_VERIFICATION.md     generated mirror of the NV register
    SAFETY_AND_LIMITATIONS.md safety rules and honest scope statement
    DATA_DICTIONARY.md        item kinds and field definitions
    sources/Project_Document.pdf
    reference/REFERENCE_SHEET.md   generated 64-photo caption vs observed table
    reference/photos/              the 64 source photographs
  src/
    main.ts                   tabbed viewer: Extraction / Needs verification / Reference sheet / Sources
    style.css
    types/evidence.ts         Evidence type + validators (shared by tests)
    types/data.ts             interfaces for the three JSON registers
    data/
      initial-extraction.json 213 extracted items, each with evidence
      needs-verification.json 15 NV entries
      reference-sheet.json    64 photo records (caption vs observed, match flag, evidence)
    tests/extraction.test.ts  vitest: evidence present, ids unique, conflicts preserved
```

## Data flow

```
docs/sources/Project_Document.pdf ─┐
docs/reference/photos/*.jpeg  ─────┤ manual extraction + contact-sheet review
                                   ▼
                     src/data/*.json (single source of truth,
                     every record with evidence)
                                   │
             ┌─────────────────────┼──────────────────────┐
             ▼                     ▼                      ▼
   scripts/validate-evidence   src/main.ts UI     scripts/generate-docs.mjs
   (npm run build gate)        (registers view)   (markdown mirrors)
```

There is deliberately **no** code path that derives numbers from the markdown mirrors:
JSON is authoritative, markdown is a generated view.

## Planned layout for later phases (not built yet)

```
src/sim/     deterministic fixed-timestep core, PLC-style scan cycle,
             typed signal bus — runs and is tested without a browser or Three.js
src/three/   rendering: five-layer station models, component naming STATION_Assembly_Part
src/hmi/     HMI / PLC screens reading and writing only through the signal bus
```

Rules that apply when those appear:

- Simulation time is independent of wall-clock time (pause, step, 0.25x–8x).
- A button dispatches a validated command: it changes state or explains why it is blocked.
- Parts are tracked objects (serial, 2D code, lot, recipe, state, temperature, history),
  not looping animations.
- PLC screens show *"Simulated logic - not the plant program"*; forcing writes an audit log
  and shows a forced indicator.

## Evidence gate

`npm run build` = `validate:evidence` → `tsc --noEmit` → `vite build`.

`validate-evidence.mjs` fails the build when any record in
`initial-extraction.json`, `needs-verification.json` or `reference-sheet.json`
is missing `id`/`kind`/`name`/`value` equivalents, has a duplicate id, an invalid
evidence category/confidence/status/date, a match flag outside the declared legend,
a photo filename missing on disk, or a photo on disk missing from the register.
