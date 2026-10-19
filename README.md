# Nexteer Plant 78 Hot Zone CV joint line — digital twin (training simulator)

**Verify against master controlled copies before operational use.**

A virtual TRAINING simulator for the Nexteer Plant 78 Hot Zone line (TRIPOT housing / CV OR).
It is built from a PDF of 65 shop-floor photographs, which is **not** the controlled master
documentation. Nothing here is validated for production and none of the numbers/replicas
should be copied into any real system.

## Honest limits (read first)

- The simulated process (part flow, temps, concentration trends, fault reactions) is an
  **educational trend model**, not real metallurgy or a real PLC/NC program. Every interlock
  is tagged with its evidence category in the registers; the screens say
  "Simulated logic — not the plant program".
- Fault→alarm pairings, screens' layout extrapolations and unphotographed geometry are
  **inferences** (needs-verification register, NV-001..NV-024 in-app).
- Manual/physical procedure steps and the crack-event reaction are **self-certified**
  training actions; the simulator cannot verify them. LOTO and all safety procedures:
  the approved site procedure governs real work.
- Learning mode reports **informational counters only** — no documented pass/fail criteria
  exist in the sources, so none is invented (NV-024).
- It never connects to any real PLC, OPC UA, Modbus or PROFINET network; IP addresses of the
  teaching scenarios are simulation-only.
- Screenshot values (e.g. bell external shower 117.9 LPM, quench 34.6 °C, Brix 3.7 %,
  heat time 69 s) are observed values only, NOT setpoints or fault conditions.

## Run it

**Live (free Cloudflare Workers/Pages):** https://hotzone-digital-twin.iamtilose.workers.dev/

Mobile-friendly: on phones the machine panel becomes a bottom sheet, the drawer is a
full-screen sheet with scrollable tabs, and the scene toolbar is a single scrollable row.

```bash
npm install
npm run dev          # dev server (e.g. http://localhost:4200/)
npm run build        # evidence validator + tsc + vite build (build fails on missing/malformed evidence)
npm run test         # vitest unit tests (137 as of the phase 7 checkpoint)
npm run deploy       # build + wrangler pages deploy (Cloudflare account required, `npx wrangler login` once)
npm run preview      # build + local wrangler dev
```

Optional: `npm run docs:generate`, `npm run render:compare` (3D comparison renders against
reference photos, requires the Playwright chromium + managed WebGL). The GitHub repo lives at
https://github.com/lmdelm/hotzone-digital-twin (source only; deployment is via Cloudflare Pages
direct upload, `deploy.yml` workflow kept local as a future GitHub Pages alternative).

## What is in the app

- **3D line as the site**: click any machine (induction heat, both washers, draw oven, laser
  marking, 2D reader, unload/cooling, boxing, gage + operator) → selection outline + anchored
  panel with a REAL evidence breakdown of its components.
- **Machine panel controls** write to one typed signal bus (the single source of truth) —
  forced signals show a global `FORCED: <signal>` badge, raise the site's real alarm codes
  (pairings are an inference, NV-022) and are audited.
- **Screen replicas** (Main HMI with alarm lifecycle, SINUMERIK-safe NC, Inducontrol, AutoID
  navigator, PLC/IO, recipe, network editor, roles) open from machine panels or the toolbar,
  all flagged "Simulated logic".
- **Evidence drawer**: extraction register (213 items), needs-verification (24),
  reference sheet (64 photos), HMI errors (70), sources, **procedures** (15, verbatim steps
  with order enforcement + honesty badges), **faults & drills** (6 training-scenario faults +
  the documented crack event drill) and **learning mode** counters.
- **Deterministic simulation core** (`src/sim`, runs without a browser): fixed-timestep part
  lifecycle, tracked CV OR parts (serial/2D/lot/recipe/state/temp/history), pause/step/
  0.25x–8x rate on simulation time independent from wall clock.

## Architecture

```
src/sim        simulation core (bus, lineSim, hmiSim, procedures, faults, learning) — browser-free
src/three      rendering (scene, machines, viewport loop)
src/hmi        UI (topbar/shell hooks, drawers, panels, screen replicas)
src/data       JSON registers (single source of truth; validator-checked evidence metas)
src/tests      vitest unit tests (jsdom)
docs           master prompt, phase status, extraction/fidelity notes
scripts        evidence validator + one-off generators (gen-phase5-data.mjs etc.)
```

Every new item (component, parameter, alarm, procedure step, fault) must carry an
`evidence` object; `npm run build` fails when evidence is missing or malformed.
Unknowns go into the needs-verification register, never into invented values.

## Status

Phases 1–6 done, phase 7 (polish/release) done as of this checkpoint — see
`docs/PHASE_STATUS.md` for the full done/partial/missing ledger. Next acceptance step is
**nexteer-provided controlled documentation** to close the needs-verification register.
