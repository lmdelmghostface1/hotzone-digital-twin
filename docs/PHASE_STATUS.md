# Phase status and sign-off

**Verify against master controlled copies before operational use.**

This project is a **virtual training simulator** for the Nexteer Plant 78 Hot Zone line
(TRIPOT housing / CV OR). It is built from a PDF of 65 shop-floor photographs, which is
**not** the controlled master documentation. Nothing here is validated for production.

The single source of truth for the data is the JSON registers under `src/data/`
(`initial-extraction.json`, `needs-verification.json`, `reference-sheet.json`,
`hmi-errors.json`, `model-checklist*.json`, `external-research.json`). This page is a
human-readable status summary of those registers; when it disagrees with them, the JSON wins.

## UI/UX rebuild (3D-first redesign)

- **Step 1, shell rebuilt**: the 3D line is now the whole site — full-viewport canvas, slim top bar
  with the mandatory disclaimer, and one **Evidence** button opening a drawer
  (`src/hmi/evidenceDrawer.ts`) that holds all former text tabs (extraction / needs / photos /
  HMI / control screens / sources). Verified: drawer open/close/Escape, panels toggle, 0 console errors.
- **Step 2, machine selection done** (`src/three/machines.ts` + anchored panels): clicking any
  machine component selects the whole machine (induction, both washers, draw oven, laser marking,
  2D reader, cooling/unload, boxing, CV OR workpiece, gage + operator), draws a
  `Box3Helper` outline around it and pins an anchored panel above it with the machine id and a
  REAL evidence breakdown of its components (no invented numbers). The panel follows the camera
  in screen space, flips below the anchor near screen top, closes on ×, empty click or Escape.
  Traveling sim part markers are demo actors, not machines (`SIM-…` excluded).
  Verified headless: center click → "Induction heating machine", evidence counts shown, anchor
  follows camera rotation, empty click deselects, 0 console errors.
- **Step 3, per-machine controls done** (`src/hmi/machineControls.ts`): each machine panel gains
  a "simulated logic - not the plant program (NV-022)" section with live controls on the single
  signal bus — induction heat/quench toggles (mutually exclusive), both washers (`amb.washing`),
  oven tempering, laser on/off, camera-scan and gage faults, `gage.offsetMm` numeric trim
  (validated ±0.005 mm), unload/boxing conveyor stop. FORCED signals show `FORCED: <signal>`
  in the panel, further edits are blocked with an inline reason, and every change adds to the
  audit tail + raises the site's real alarm codes (the HMI-019/032/022/026/069/063 pairings
  remain an inference, NV-022).
  Verified headless: laser toggle + laser fault (FORCED badge, red fault button, alarm 700207
  active-unacked, cleans up on untrigger), gage offset 0.002 written with clean audit,
  reader scan fault → FORCED `fault.damagedCode` + HMI-032, cleared with no residual forced
  signals, 0 console errors; 117 unit tests pass. Oversized panels are now fully clamped
  inside the stage so no button can end up clipped under the toolbar.
- **Step 4, screens re-anchored** (`src/hmi/screenOverlay.ts`): the Phase 4 replicas are no
  longer a text drawer tab — each machine panel offers the screens that observe it
  (induction → Inducontrol + SINUMERIK, marking/reader → AutoID, wash/oven/gage → Main HMI,
  unload/boxing → PLC/IO), which open in a centred overlay window over the live 3D line
  (single shared screen state, closes on ×, backdrop click or Escape). The viewport toolbar
  keeps "screens" for the global screens (recipe / network / roles). The top bar now shows a
  global `FORCED: <signal>` badge whenever any signal is forced (hotzone-rules 4), and the
  drawer keeps the five text registers (the screens tab moved out).
  Verified headless: machine → AutoID replica opens with the honesty bar, in-overlay
  switching works, Escape closes the overlay first (drawer stays), toolbar entry opens Main
  HMI, FORCED pill appears/clears with forcing, 0 console errors; 119 unit tests pass.
- **Step 5, done — UI complete**: the alarm lifecycle moved onto the Main HMI replica
  (simulated ALARMS card: live banner, alarm list with real code/text, **ack all / clear all**,
  triggers live on the machine panels) so ack/clear no longer depends on the hidden legacy
  side panel; the side panels stay behind "panels" only for the part list, isolate/hide, and
  fidelity checklist. Final pass: evidence validator OK (213 items, 23 NV, 64 photos,
  70 HMI errors, 6 external), 120 unit tests, `npm run build` green, headless alarm-card
  cycle verified (trigger → HMI-019 active-unacked → acked → cleared, 0 console errors).

## Rebuild checkpoint (all five steps done)

- The 3D line IS the site: top bar (disclaimer + global FORCED badge + Evidence),
  machine click → anchored panel (evidence summary + bus-driven controls + screens),
  screens overlay for the HMI/NC/PLC/recipe/network replicas, Evidence drawer for the
  text registers. Working directory for a live look: `npm run dev` (last verified on
  http://localhost:4200/).
- Viewport side panels remain a floating overlay hidden by default (toolbar → "panels") until
  steps 3-4 re-anchor that content onto the machines.

## Phase 5 — procedures register + fault drills

**Done**

- **Procedures register** (`src/data/procedures.json`, generated verbatim from the extraction
  items by `scripts/gen-phase5-data.mjs`): 15 procedures from the controlled-copy photographs —
  start/stop (PC-001..006), interrupted cycle (PC-007..013), cleanup/changeover, sensibilité,
  washer nozzles, refractometer, manual lot, NC block flow, LOTO, workstation safety, OPD
  spline-gage/measurement/marking (GS/GD/SF items), and the crack-event reaction plan
  (GWI34417543, CR-000..CR-015, 16 steps). Every step keeps the
  extracted wording (ordered verbatim substring check in validator + unit test) and its
  source-item evidence; steps the simulator cannot verify physically are marked manual and
  self-certified on completion. No invented preconditions; scoring deferred to Phase 6.
- **Procedures tab in the Evidence drawer**: 15 cards with ordered "mark done" steps
  (out-of-order clicks are disabled/blocked with a reason), per-step + per-procedure evidence
  lines, manual-step honesty badges ("physical action the simulator cannot verify"), reset.
  LOTO shows the safety note that the **approved site procedure governs real work**.
- **Faults register** (`src/data/faults.json`): 6 injectable training faults (laser, scan,
  size, conveyor, heat, quench) + the crack event. The 6 are explicitly labelled TRAINING
  SCENARIO — no documented reaction plan exists in the controlled sources for them; only the
  crack event follows the documented plan (self-certified recovery, never injected). The
  fault→alarm pairings stay an inference (NV-022); alarm id/code/text must match the HMI
  register (validator-enforced).
- **Guided fault drills** (`src/sim/faults.ts`): pick a fault → inject (same bus signals and
  real alarm codes as the panels) → trainee diagnoses in the 3D scene (FORCED pill, alarm
  banner, machine panel unforce) → drill auto-reports recovered when the alarm is cleared AND
  the trigger is unforced, recording simulated elapsed time, related signal writes (monotonic
  per-key bus counters, immune to log eviction) and hints used. Crack drill = self-certified
  only. One drill at a time; abandon keeps the fault in place (manual recovery).
- **Reasoning counters for the signal counts use bus-wide monotonic writes, not the bounded
  300-row audit log**, so long runs still report correct write counts.

**Not done / limits**

- No scoring or assessment (Phase 6 learning mode); drill completion is informational today.
- Manual procedural steps and the crack reaction are self-certifications, not validated actions.
- fault→alarm pairings are an educational inference (NV-022), as in Phase 4.

**Verified**: evidence validator OK (…15 procedures, 7 faults…), 133 unit tests
(`vite build` + `tsc --noEmit`), headless drill smoke (drawer → procedures order enforcement +
LOTO note → fault tab → inject FAULT-LASER → FORCED pill → hint → recovery → history with
writes/hints → crack drill self-certified, 0 console errors).

## Phase status

| phase | scope | status | notes |
|-------|-------|--------|-------|
| 1 | extraction + architecture + evidence pipeline | **done** | 213 extracted items, 64 photos reviewed, `npm run build` fails on any missing/malformed evidence. |
| 2a | induction machine to the fidelity gate | **done (partial fidelity)** | 5 render iterations in `docs/compare/induction/`; **nothing is MEASURED** — no controlled drawings (NV-011); rear side never photographed. |
| 2b | rest of the line | **done** | increments 1–5: wash stations, draw oven, CV OR workpiece, line end, laser marking + 2D reader. All conceptual where unphotographed (NV-015/016/018/019/020/021/023). |
| 3 | simulation + part lifecycle | **done** | deterministic fixed-step `LineSim`, tracked parts (serial/2D/lot/recipe/state/temp/history), operator + conceptual GO/NO-GO gage, camera zoom/fit. All driven by one typed signal bus. |
| 4 | HMI / NC / PLC screens, network editor, roles | **done (training replicas)** | see below. |
| 5 | procedures and faults | **done (training registers)** | see "Phase 5" below. |
| 6 | learning mode | **not started** | scoring/assessment data arrives here. |
| 7 | polish and release | **not started** | |

Per the project rules, work stops after each phase with a runnable checkpoint. **Phase 6 is
not started until you say to continue.**

## Phase 4 — what exists and what does not

**Done**

- Main-HMI troubleshooting mimic in the 3D viewport (`src/hmi/hmiSim.ts`): trigger a fault,
  get the **real** alarm text/code from the extracted register (`src/data/hmi-errors.json`,
  70 entries, `HMI-001..HMI-070`), with what-to-check / how-to-fix from the same register.
- Alarm lifecycle inactive → active-unacked → active-acked → cleared, with ack / clear / reset.
- **Forced-signal indicator** on the banner and a **simulated audit log** of every signal change.
- The mimic raises the site's real codes for the teaching link (laser fault → HMI-019,
  scan/code fault → HMI-032, size fault → HMI-022, conveyor stop → HMI-026, heat → HMI-069,
  quench → HMI-063). The pairings themselves are an inference (NV-022).
- **Dedicated control screens** (`src/hmi/controlScreens.ts`, "Control screens (Phase 4)" tab),
  all sharing the one signal bus via `src/sim/runtime.ts`:
  - **Main HMI** — observed process-parameter readings (voltage/current/power/frequency,
    shower flows, quench temp, rotation, Brix, conductivity, job IDs) plus live sim readouts.
  - **SINUMERIK (NC)** — CHAN2/CHAN3, documented NC lines only (NC-001..NC-010; illegible block
    flagged NV-005), observed axes, and a live alarm list from bus conditions (AL-001/002/003).
  - **Inducontrol** — observed dashboard + shower-flow trend (observed 117.9 LPM shown against
    the documented 100–105 LPM band; conflict preserved as NV-010, not corrected).
  - **AutoID** — illustrative reader mimic; states "SR-20AH" is a KEYENCE lens attachment, not a
    reader (NV-023); tuning banks / exposure range per HM-003.
  - **Recipe / setup** — editable against RL-001/RL-004: operator edits are blocked unless a
    controlled setup sheet marks the field yellow (none confirmed), ME / TE may approve.
  - **PLC / IO** — IO table with Force, simulated interlock chain, sequencer from tracked parts,
    audit history; everything labelled "simulated logic - not the plant program".
  - **Network editor** — offline IP table built from IP-001..IP-015, editable with IPv4 and
    duplicate validation; scenario buttons. Never scans or touches a real network.
  - **Roles / audit** — documented roles (RL-001..RL-006) and the shared audit log.

**Not yet done (Phase 5+, not started)**

- Procedure walkthroughs (start/stop, interrupted cycle, LOTO) and fault scenarios.
- Learning / assessment mode.
- NC program editing that changes 3D motion (the editor is read-only for motion today).

## Known limitations (global)

- No MEASURED dimensions anywhere; no controlled drawings (NV-011).
- No temperature, case-depth or crack predictions are claimed — the heat index and GO/NO-GO
  dimensions are **illustrative trends**, labelled not validated (NV-014).
- Screenshot values (e.g. 117.9 LPM, 34.6 °C, 3.7 % Brix, 69 s) are observed readings, **not**
  setpoints or limits.
- No PLC/NC program exists in the sources, so all logic is **simulated logic - not the plant
  program** (NV-022). The HMI mimic is not connected to any real PLC, OPC UA, Modbus or
  PROFINET, and must never be used to touch the real network.

## Human sign-off checklist

A Nexteer reviewer must confirm each of these against controlled copies before this simulator
can be used operationally. Until then it stays labelled educational.

- [ ] Induction machine identity and models (builder, generator, coil, axes) — closes NV-011.
- [ ] Stem heat frequency (currently blank in the recipe) — closes NV-012.
- [ ] Washer / quench concentration: reconcile 2.8 % vs 3.5–9.5 % — closes NV-001.
- [ ] Reader model: confirm the main unit (SR-20AH is a KEYENCE lens attachment, not a reader) — closes NV-023.
- [ ] Gage / OPD station photo and dimensions — closes NV-016, NV-014.
- [ ] Line-end (unload / boxing) photo and reject-box location — closes NV-019, NV-020.
- [ ] Laser marking + reader positions and device layout — closes NV-021.
- [ ] Confirm the 64-vs-65 photograph count and re-caption the tail of the set — closes NV-006, NV-007.
- [ ] Awarded NC/PLC program and alarm-to-condition table — closes NV-022; only then can real interlock logic replace the simulation.

## Current mechanical evidence

- `npm run build` — passes (evidence validation + type check + Vite build).
- `npm test` — 120 tests pass (extraction, sim, hmi, three, ui, control screens, machine controls).
- Evidence validation — 213 items, 23 needs-verification entries, 64 reference photos,
  107 checklist items across 7 files, 70 HMI error entries, 6 external research entries.
- The 3D app has been exercised in a browser (buttons, part flow, HMI alarms, forced
  indicator, audit log, zoom) with no console errors.
- All eight Phase 4 control screens were exercised headless (nav, force/unforce, duplicate-IP
  validation) with zero console errors.

_Last reviewed: 2026-10-18._
