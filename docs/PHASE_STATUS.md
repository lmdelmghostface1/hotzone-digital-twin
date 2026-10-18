# Phase status and sign-off

**Verify against master controlled copies before operational use.**

This project is a **virtual training simulator** for the Nexteer Plant 78 Hot Zone line
(TRIPOT housing / CV OR). It is built from a PDF of 65 shop-floor photographs, which is
**not** the controlled master documentation. Nothing here is validated for production.

The single source of truth for the data is the JSON registers under `src/data/`
(`initial-extraction.json`, `needs-verification.json`, `reference-sheet.json`,
`hmi-errors.json`, `model-checklist*.json`, `external-research.json`). This page is a
human-readable status summary of those registers; when it disagrees with them, the JSON wins.

## Phase status

| phase | scope | status | notes |
|-------|-------|--------|-------|
| 1 | extraction + architecture + evidence pipeline | **done** | 213 extracted items, 64 photos reviewed, `npm run build` fails on any missing/malformed evidence. |
| 2a | induction machine to the fidelity gate | **done (partial fidelity)** | 5 render iterations in `docs/compare/induction/`; **nothing is MEASURED** — no controlled drawings (NV-011); rear side never photographed. |
| 2b | rest of the line | **done** | increments 1–5: wash stations, draw oven, CV OR workpiece, line end, laser marking + 2D reader. All conceptual where unphotographed (NV-015/016/018/019/020/021/023). |
| 3 | simulation + part lifecycle | **done** | deterministic fixed-step `LineSim`, tracked parts (serial/2D/lot/recipe/state/temp/history), operator + conceptual GO/NO-GO gage, camera zoom/fit. All driven by one typed signal bus. |
| 4 | HMI / NC / PLC screens, network editor, roles | **partial** | see below. |
| 5 | procedures and faults | **not started** | the HMI fault mimic exists, but the sanctioned procedures (start/stop, interrupted cycle, LOTO) are not built. |
| 6 | learning mode | **not started** | |
| 7 | polish and release | **not started** | |

Per the project rules, work stops after each phase with a runnable checkpoint. **Phase 5 is
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

**Not yet done (Phase 4 remainder)**

- A dedicated SINUMERIK-style screen with the NC program editor/executor.
- A dedicated Inducontrol-style screen (voltage/current/power/frequency, shower-flow graph, Brix, conductivity, job IDs, Learn).
- The AutoID reader configuration screen.
- A recipe editor, the network editor (IP table), roles, and a persistent audit log.

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
- `npm test` — 98 tests pass (extraction, sim, hmi, three, ui).
- Evidence validation — 213 items, 23 needs-verification entries, 64 reference photos,
  107 checklist items across 7 files, 70 HMI error entries, 6 external research entries.
- The 3D app has been exercised in a browser (buttons, part flow, HMI alarms, forced
  indicator, audit log, zoom) with no console errors.

_Last reviewed: 2026-10-18._
