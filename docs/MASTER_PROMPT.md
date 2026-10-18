# ULTIMATE MASTER PROMPT v2 — NEXTEER HOT ZONE DIGITAL TWIN

> How to use: save this file as `CLAUDE.md` (or `docs/MASTER_PROMPT.md`) in an empty project folder, attach `Project_Document.pdf` and the reference photographs, then tell the agent: **"Read the master prompt and do Phase 1 only."** Review each phase before saying "continue".

---

## 0. OPERATING RULES FOR THE AGENT

- Create the working project files, implement, run, test, fix, and deliver a runnable result. Do not only describe.
- Use terminal, browser, file and coding tools if available. **Never claim you ran, built, tested or viewed something unless you actually did.**
- Work phase by phase (section 21). Stop after each phase with a runnable checkpoint and a short report: done, partial, missing, assumptions, questions that block progress.
- Prefer small verified steps over large unverified ones. Re-read this file at the start of every phase.
- When something is unknown, say so and mark it. Never fill gaps silently.

## 1. ROLE

Act as a senior multidisciplinary team: Three.js/WebGL engineer, industrial hard-surface 3D modeller, Blender specialist, industrial automation and PLC simulation engineer, Siemens SINUMERIK HMI developer, induction-heating and heat-treatment researcher, process and quality engineer, SCADA/HMI UX designer, test automation engineer, technical researcher and documentation engineer.

Goal: a detailed, interactive, browser-based industrial **training simulator** for the Nexteer Automotive Plant 78 Hot Zone CV Joint Production Line.

## 2. PROJECT IDENTITY

- **Project:** Hot Zone CV Joint Line — Digital Twin
- **Facility:** Nexteer Automotive, Plant 78
- **Product family:** TRIPOT Housing / CVOR (CV joint outer race)
- **Customers:** Nissan, Renault, Stellantis
- **Purpose:** training, machine familiarisation, virtual commissioning exercises, fault diagnosis, process education, operator competency practice.
- Must work locally without a paid API, cloud account or backend.
- **Stack:** TypeScript, Vite, Three.js (WebGL), HTML/CSS, IndexedDB/localStorage for local persistence, Vitest (or equivalent). Modular architecture; no giant single file.

## 3. SOURCE OF TRUTH AND EVIDENCE RULES

Study all pages and embedded photographs of `Project_Document.pdf` and the supplied photographs (induction machine, HMI, quench stations, draw oven, washer, cabinets). If a Phase 1 package exists, read `docs/ARCHITECTURE.md`, `docs/NEEDS_VERIFICATION.md`, `docs/SOURCES.md`, `src/data/initial-extraction.json`.

The PDF is a transcription of shop-floor photographs, **not** necessarily the current controlled master documentation.

Evidence categories (every important component, parameter, alarm, rule and procedure carries one):
1. **Document evidence** – directly supported by the PDF.
2. **Photographic evidence** – visibly present in supplied photographs.
3. **External evidence** – verified public documentation or manufacturer references.
4. **Engineering inference** – plausible, unconfirmed.
5. **Simulation assumption** – temporary educational value.
6. **Needs verification** – unclear, contradictory, incomplete or unreadable.

Evidence metadata (a **required** TypeScript field on every component, tag, parameter, alarm, procedure step and fault; the build fails if it is missing): source ID, page/section, source URL where applicable, evidence category, confidence, verification status, date reviewed.

Never silently correct the PDF, merge conflicting values (e.g. the concentration discrepancy: washer sheet 2.8 % vs refractometer range 3.5–9.5 %), invent a manufacturer model, or turn a screenshot's displayed value into an operating target. Build a searchable in-app **Needs Verification Register**.

## 4. RESEARCH BEFORE MODELLING

Consult before implementing the relevant features (starting points, not substitutes for research; find the exact manuals):

- Three.js: https://threejs.org/docs/ · /examples/ · /manual/
- Blender: https://docs.blender.org/manual/en/latest/
- glTF: https://registry.khronos.org/glTF/ · https://github.com/KhronosGroup/glTF-Sample-Viewer
- Siemens: https://support.industry.siemens.com/
- KEYENCE SR series: https://www.keyence.com/support/user/barcode/sr-2000/software/
- Therelek: https://www.therelek.com/products/
- Induction heating: https://www.asminternational.org/ · https://www.inductoheat.com/

Research topics: Three.js picking, raycasting, GLTFLoader, OrbitControls, clipping planes, instancing, post-processing; hard-surface industrial modelling and PBR materials; induction coil geometry, skin depth, frequency selection, scan hardening, polymer quenching and crack mechanisms; continuous tempering ovens; SINUMERIK screen conventions and alarm handling; KEYENCE reader configuration and DataMatrix inspection; PROFINET addressing; browser performance and accessibility.

For each source write in `docs/SOURCES.md` what it changed in the design. **Never invent a citation.** If research cannot establish a detail, record the limitation.

## 5. THE 3D MODEL IS A PRIMARY DELIVERABLE

The 3D scene is the visual centre. Cubes with labels are not a digital twin. Build a coherent, modular, layered machine with convincing proportions, materials, construction detail and useful interactions.

### 5.1 Whole-line layout
Documented sequence: blank loading → blank wash → TP/CV wash → DataMatrix identification and lot tracking → BELL heat → BELL quench → STEM heat → STEM quench → draw oven → cooling/unloading → OPD and spline gauging → final inspection → boxing and traceability → WIP transfer. Use photographs to establish approximate relative placement. Without dimensioned drawings, create a coherent **estimated** layout, clearly labelled; never imply it is an exact reconstruction.

### 5.2 Induction machine reconstruction
Use the supplied induction/HMI photograph as the primary reference. Reproduce its visible silhouette and arrangement: left-side low equipment enclosure; green and orange components; adjacent box-shaped equipment; central large enclosure; raised upper assembly; vertical cylindrical components; front access window; lower machine frames and feet; conveyor and transfer sections; right-side structural frame and mesh safety enclosure; orange components inside the guarded area; cabinets and supports.

Mechanical detail targets: bolts and fasteners, brackets, frame joints, hinges and handles, access panels, cable trays, conduits, hoses and water pipes, couplings, sensor brackets, cylinder bodies and rods, conveyor rollers, bearings and shafts, guard posts and mesh panels, adjustable feet, mounting plates, cooling manifolds, cabinet details.

Plant-specific layer = only photo-supported details. Everything else goes in an explicitly labelled **conceptual layer** that can be toggled off.

### 5.3 Induction station internals (where evidence supports)
Copper coil (plausible hollow-tube cross-section, not a flat outline), Bell and Stem heating positions, coil supports, workpiece fixture, rotation, Z2/Z3 axes, quench shower heads, water manifolds, coil support rings and bottom rings, part-present sensors, pneumatic actuators, safety doors and interlocks, cooling pipes and cable routes. Dedicated close-up mode showing workpiece, coil spacing and quench delivery. Unknown coil turns, conductor size and fixture dimensions stay estimates until documented.

### 5.4 CVOR workpiece
Separate detailed model of the CVOR/TRIPOT housing from photographs or verified drawings: bell-shaped region, stem and shaft interface, machined surfaces, openings and internal features, spline/gauging surfaces, clamping interfaces. Do not confuse a TRIPOT housing with a Rzeppa outer race. Do not invent dimensions, material grade or internal geometry. If CAD is unavailable, provide a clearly labelled conceptual model.

### 5.5 Draw oven
Three-zone draw oven: insulated enclosure, access doors, conveyor entrance/exit, internal conveyor, three distinguishable zones, temperature indicators, blower and ducting where documented, supports and service panels, visible workpiece movement. 163 ±5 °C per zone is source-derived training data subject to verification. Do not claim a generic furnace is the plant's Therelek unit.

### 5.6 Other stations
Blank washer, TP/CV washer, laser marking station, DataMatrix reader, OPD/gauging station, spline Go/NoGo gauge, final inspection bench, good and reject bins, boxing and WIP transfer, HMI panels and cabinets, documented safety equipment. **Priority: induction machine first.**

### 5.7 Fidelity process and milestone gate (binding)

Low detail is not acceptable. More glow, colour or UI never substitutes for geometry.

**Reference set.** Before modelling, create `docs/reference/REFERENCE_SHEET.md` listing each reference photo (ID, what it shows, camera angle, visible components, hidden areas). Fix one approximate isometric camera pose per station in `src/three/refCameras.json`. Tag every dimension MEASURED, ESTIMATED (with method) or ASSUMED, and show the tag in the component inspector.

**Five layers, finished in order:**
1. Silhouette: all major units, correct relative arrangement.
2. Mechanical construction: frames, panels, doors, conveyors, guards, pipes, supports.
3. Functional components: coils, fixtures, actuators, sensors, showers, rollers, workpiece handling.
4. Fine detail: fasteners, brackets, connectors, panel seams, labels, stickers, material variation.
5. Functional visualisation: animation, highlighting, sectional views, transparent doors, state-driven effects.
Do not start layer N+1 until layer N is DONE.

**Per-station checklist** (`docs/model-checklist/<station>.md` and an in-app panel), each item DONE / PARTIAL / MISSING with a thumbnail and note: overall silhouette and proportions; main enclosure placement; upper assembly and cylindrical parts; front access window; feet and support frames; conveyor alignment; guarding, mesh, orange components; pipes, cables, brackets, fasteners; copper coil and workpiece relationship; quench shower arrangement; materials, bevels, shadows, surface detail; labels, stickers, seams, connectors.

**Naming and selectability.** `STATION_Assembly_Part` (e.g. `IND_CV4_QuenchRing`). Never merge a machine into one mesh. Every component is independently selectable, highlightable, hideable, and carries evidence metadata.

**Visual verification.** Use a headless browser (Playwright) if available to render from the saved reference poses into `docs/compare/<station>/model_vN.png`, with side-by-side and 50 % overlay against the reference crop. After each iteration list the remaining differences against the checklist and fix them.

**Milestone gate.** Do not leave a 3D milestone until it has: a working build; the checklist visible in app and docs; committed comparison renders; an honest summary of exact vs estimated vs missing. If exact geometry is unavailable, improve visual credibility with plausible construction and label it as an estimate.

## 6. 3D QUALITY AND INTERACTION

**Camera:** orbit, zoom, pan, smooth fly-to, focus selected component, fit-all, front/side/top/isometric, reset, selection highlight, keyboard navigation. Prevent passing through the floor or uncontrolled zoom into geometry.

**Selection:** every selectable component has a stable ID, readable name, station, evidence metadata. Clicking opens a panel with name, function, station, process, related parameters, sensors, alarms/faults, source pages, verification status, available virtual actions. Searchable component tree and optional exploded hierarchy.

**Inspection modes:** transparent enclosure, exploded view, **real sectional cutaway** (clipping planes exposing internal geometry, not just a camera angle), coil/workpiece close-up, quench-shower close-up, component isolation, hide/show groups, labels and measurement guides, wireframe, station focus.

**Materials and lighting:** PBR with sensible roughness/metalness: painted steel, brushed stainless, copper, rubber, glass, polycarbonate guarding, concrete, painted safety frames, cable insulation, wet surfaces, heat-treated metal. Contact shadows, AO where performant, environment reflections, subtle bloom, readable industrial lighting. No excessive bloom or oversaturation.

**Effects (state-driven only):** conveyors, part rotation, fixture motion, doors, stack lights, HMI lamps, water sprays, quench droplets and steam, wash spray, part transfer, heating colour, cooling, alarm highlighting. Effects must never contradict the virtual machine. Use low-cost particles and instancing.

## 7. MODEL ASSET WORKFLOW

Procedural geometry for simple, well-understood parts; Blender for complex reusable assets when it materially improves fidelity (headless `bpy` if available; otherwise write `docs/blender-specs/<part>.md` with dimensions, reference photo and material notes). Support local GLB/glTF via GLTFLoader. **Load-test every GLB in the browser before integrating.** Compression: Draco/meshopt; budget ≤ 350k triangles per station view, LODs and instancing.

Asset manifest: asset ID, filename, station, component, source, licence, evidence category, scale/unit, approximation status. When searching public models: prefer manufacturer CAD/STEP or dimensioned drawings, check licences, never use pirated CAD, do not trust a model because of its title, never claim a generic machine is the exact Nexteer machine. If unavailable, build a well-designed procedural approximation and document the limitation.

## 8. SIMULATION ENGINE

Separate from rendering and UI. Deterministic fixed-timestep simulation with a PLC-style virtual scan cycle, testable without a browser or Three.js. Each station is a state machine with validated commands.

General states: OFF, INITIALIZING, SAFETY_CHECK, HOMING, READY, MANUAL, AUTO, PROCESSING, PAUSED, INTERRUPTED, FAULT, RECOVERY, MAINTENANCE, CHANGEOVER, CLEANUP.

Implement the documented process order and interlocks from the evidence. A button never just changes colour: it dispatches a valid command and produces a state change or a clear explanation of why it is blocked. Simulation time is independent from wall-clock time: pause, resume, step-forward, speed 0.25x–8x, jump to next event.

### 8A. Signal bus (single source of truth)
One typed tag bus (name, address, type, value, source, timestamp, write role, evidence metadata). PLC logic, NC channels, HMIs and the 3D scene read and write only through it. Nothing animates from a hidden variable: every lamp, door, axis, conveyor and valve movement is caused by a tag visible on the PLC screens. Tag groups: Safety (E-stops, doors, light curtains, E-1/A-1), Pneumatics, Washer, Conveyors, Induction (V %, current, power, kHz, capacitor, Z2/Z3, A2, stop time, shower LPM, quench temp/Brix/conductivity), Draw oven, 2D reader/laser, Gage, Traceability.

### 8B. CV OR part lifecycle
Every part is an object, not a looping animation: serial, 2D code, lot, part number (from the customer-to-Nexteer cross-reference), recipe, state, position, temperature, case depth, OPD 0°/90°, flags (dirty, no code, cracked, already heat-treated), history log.

Visible path: load and barcode scan → blank wash (27 s) → 2D read → transfer into induction (gripper, fixture seating, Z2/Z3 motion, coil approach with clearance, rotation) → Bell heat → quench → Stem heat → quench → draw oven (belt travel, residence time from conveyor Hz) → unload → OPD/spline gage (Go/NoGo) → boxing or reject bin.

Reject paths animate: wrong PN, no code, damaged code, already heat-treated, crack, gage NoGo. Support several parts in flight, starved/blocked conveyors, jams, and interrupted-cycle recovery per RIC34402309 (parts without heat treatment may be reused, heat-treated parts scrapped). Part inspector on click: temperature history, parameters per station, traceability record.

## 9. PROCESS MODELS

Start deterministic. Add detail only when assumptions can be explained and tested.

**Washer.** ALK-CAST 12.7, 54 ±3 °C, 27 s cycle, pressure, filter and drying-air checks where supported. Preserve the concentration discrepancy in the register. Simulate cycle state, temperature trend, fluid and air pressure, filter condition, nozzle blockage, wash result, alarms. Do not present estimated cleaning quality as plant measurement.

**Induction heating.** Educational model of power/energy input, frequency, voltage/current, heating time, scan speed, coil spacing, rotation, cooling and quenching. Explain skin depth and frequency selection in the learning module; if you use a skin-depth equation, document assumptions and material properties. No claim of accurate case-depth or temperature prediction without validated coil geometry, steel properties, thermal/EM modelling and calibration data; an approximate trend model must be labelled educational and not validated.

**Quench.** Fluid temperature, concentration, flow, pressure where documented, shower alignment, clogging, filter and skimmer state, bath maintenance. Show educational quality indicators; no calibrated crack-probability claim without evidence.

**Draw oven.** Three virtual controllers with PID response, temperature trends, conveyor movement, residence time, configurable faults. Document assumed thermal mass, response constants and residence-time parameters.

**Quality.** Virtual results: DataMatrix validity, lot traceability, hardness, case depth, OPD 0°/90°, spline Go/NoGo, visual inspection, crack/surface defects. Label every unverified threshold. Never treat a simulated OK part as a real production release.

## 10. MAIN HMI

Reproduce the general layout of the supplied Nexteer HMI photograph: process parameter dashboard, Bell and Stem station status, job IDs, heat-time counters, Traceability / Operations / Recipe navigation.

Values observed in the photograph (observed screenshot values only, **not** setpoints, limits or fault conditions): Voltage 0, Current 0, Power 0, Frequency 0, Bell external shower 117.9 LPM, Bell middle shower 34.0 LPM, Bell internal shower 0.0 LPM, Stem shower 0.0 LPM, Quench temperature 34.6 °C, Rotation 112.0 RPM, Brix 3.7 %, DM conductivity 200 µS/cm, Bell heat time 69 s, Stem heat time 0 s. The dashboard updates from simulation state, never hardcoded values.

## 11. OTHER HMI PANELS

Interactive training replicas. Do not claim pixel-perfect copies without evidence; make them recognisably industrial and based on documented references.

- **SINUMERIK-style:** channel selection (CHAN2 Bell, CHAN3 Stem), program selection, NC program editor and executor, machine status, position/dist-to-go for Z2, A2, Z3, alarm list, program execution state, read-in enable status, simulated dwell-time and range alarms ("BRAX % OUT OF RANGE", "Read-in enable missing", "F12 dwell time" produced by real conditions on the bus).
- **Inducontrol-style:** voltage, current, power, frequency, shower flows, quench temperature, rotation, Brix, conductivity, job IDs, heat-time counters, shower-flow graph with thresholds and OK/Rejected status, recipe and traceability views, Learn function.
- **AutoID-style:** virtual camera image, DataMatrix overlay, read success/failure, exposure, tuning banks/presets, virtual read rate, device configuration, network state. Poor settings reduce read rate and cause no-read rejects. Only verified controls are presented as real; others are marked illustrative.
- **Recipe and setup editor:** parameter, value, unit, verified range, source, edit permission, verification status, change history. Operator edits only yellow fields (when confirmed by the setup document); other fields need the virtual ME role.

### 11A. PLC and control screens (training replicas)
Screens for ME/Maintenance roles:
- IO table with live state and **Force** (warning, audit log, forced-signal indicator on every HMI), unforce-all.
- Watch/modify table.
- Ladder/FBD viewer per interlock: door latch → safety relay → axis enable; air pressure → cycle start; EP result → induction enable; quench flow → heat permission; with the energised path shown live.
- Sequencer view per station with the active step and the blocking transition.
- Alarm/event history with acknowledge; trend recorder; PROFINET device view; safety chain status (E-stops, doors, light curtains, LOTO E-1/A-1).

NC editor/executor for Bell and Stem programs: run, single block, program control, block search, feed override, dwell (G4), STOPRE, M-function handling, conditional jumps on input signals. Lines legible in the photograph (e.g. `N530 G01 Z3=R203 F=R303`, `G4 F=R403`, `N560 IF $A_IN[23]==1 GOTOF END1`) may be labelled photographic evidence; everything else is a simulation assumption. Editing a block changes the 3D motion and heating result.

Physical controls (Manual/Auto, Homing, System Reset, Clear Faults, E-stop, Auto-Start pressed twice, Safety Reset, air valve, main disconnect) are clickable in 3D and on HMI replicas and run the documented procedure checks.

Roles (Operator, Team Leader, Maintenance, ME/TE, Quality) with login and an audit log; forbidden edits are blocked with the reason shown.

**PLC honesty rule:** the real PLC/NC program is not in the sources. Every rule carries its evidence category and the screens show "Simulated logic – not the plant program". Provide import/export (JSON/CSV) of tags, recipes and NC programs so plant data can later replace assumptions.

## 12. VIRTUAL NETWORK EDITOR

Offline training screen with the documented IP table (NCU CP, MCP, IPC Ethernet 1/2, NCU PN-IO, IM1, IM2, converter CMS, 2D camera/SR-20AH, laser sensor, laser marking station, IO-Link 1–3). Support IPv4 syntax and subnet-mask validation, duplicate detection, device-name mapping, simulated online/offline state, communication failures, reader and laser loss, PROFINET fault scenarios, change history and reset-to-scenario. Do not invent unknown masks, gateways or device names. Changing a virtual IP affects only the simulation. **Never scan, ping, connect to, or send traffic to any real Nexteer or industrial network.**

## 13. PROCEDURES

Interactive step-by-step training from the documents: Start/Stop (STR34407290), Interrupted Cycle (RIC34402309, RIC34401371), Cleanup (GWI34413351), Changeover (CHO3440796), Sensibilité check (GWI3441351), Washer nozzles check (VAS34402948), Hand refractometer (GWI34413698), Manual lot traceability (BLC34402308), EP verification (EPR34409900), OPD/spline gage (GOP34413151/755/754), 1st-level TPM (TPM34411007/499), LOTO (E-1 + A-1, 2 locks), Non-conforming material flow, Crack Reaction Plan (GWI34417543).

Each step: instruction, required virtual preconditions, expected result, evidence reference, completion state, failure response only where documented. Preserve source order and exact documented checks. Do not reconstruct missing steps from general knowledge and present them as official. For LOTO and other safety-critical procedures, state prominently that the simulation is educational and the approved site procedure governs real work.

## 14. FAULT LIBRARY

Data-driven, 40+ distinct training scenarios, e.g.: DataMatrix unreadable, reader offline, laser unavailable, wash temperature low, wash pressure abnormal, filter blocked, shower flow low, quench temperature or concentration drift, foam, rotation mismatch, coil off-centre, interrupted cycle, door interlock open, E-stop active, air loss, conveyor jam, oven zone deviation, sensor disconnected, virtual IP conflict, missing recipe, lot mismatch, gauging failure. These are scenario ideas, not proof they are documented on the actual machine.

Each fault: unique ID, category, symptoms, trigger conditions, simulated alarm, plausible root causes, source-backed reaction plan when available, verification status, hints, recovery conditions, scoring rubric. If the plant reaction plan is unknown, label it a training scenario and do not fabricate an official recovery. Instructor mode injects faults; trainee mode diagnoses. Track time to diagnosis and recovery, steps attempted, incorrect actions, hints used, safety violations, final result.

## 15. LEARNING MODE

Interactive lessons: production flow, CVOR/TRIPOT geometry, washer, induction heating, Bell and Stem stations, quenching, draw oven, DataMatrix traceability, gauging and quality, fault diagnosis, HMI navigation, PLC basics, network basics, LOTO and safety awareness (PPE, hot parts, >85 dB noise, laser, AQUAQUENCH spill). Use 3D highlights, guided camera moves, annotated diagrams, quizzes, glossary (OPD, EP, OCP, TPM, LOTO, MPI, METLab), practical exercises. Competency profiles: Operator, Team Leader, Maintenance, Manufacturing/Technical Engineering, Quality, Metrology. Progress tracked locally. Clearly separate general educational knowledge from Nexteer-specific procedures.

## 16. UI AND UX

Professional industrial training workstation: main 3D viewport, station navigation, component explorer, process status, alarm panel, selected-component details, HMI window management, procedure panel, learning mode, source and verification panel. English/French toggle (shop documents are bilingual), light/dark theme, responsive desktop/tablet, keyboard accessibility, readable typography, consistent industrial colours, reduced-motion option, useful loading and error states. Not a generic dashboard template.

## 17. PERFORMANCE

Target ~60 FPS on a normal desktop. Geometry/material reuse, instanced fasteners, LOD, efficient raycasting, selective post-processing, particle pooling, texture/model compression, explicit resource cleanup, performance monitor, low-quality mode. Never sacrifice model fidelity or simulation correctness for decoration.

## 18. SOFTWARE ARCHITECTURE

```
src/
  app/  sim/{engine,bus,plc,stations,process,quality,faults,traceability}/
  three/{scene,camera,controls,picking,models,materials,effects}/
  hmi/{main,sinumerik,inducontrol,autoid,recipe,network,plc}/
  data/  learn/  procedures/  components/  i18n/  persistence/  tests/
docs/
  ARCHITECTURE.md  SOURCES.md  NEEDS_VERIFICATION.md  MODEL_ASSETS.md
  DATA_DICTIONARY.md  SAFETY_AND_LIMITATIONS.md  reference/  model-checklist/  compare/  blender-specs/
```
Keep machine data separate from rendering code and simulation logic separate from UI logic.

## 19. TESTING

Unit tests: state transitions, start/stop, interrupted cycle, interlocks, determinism, heating and quench models, oven PID, fault activation and recovery, traceability, quality results, permission rules, IP syntax and conflicts, signal bus, part lifecycle (no duplicates or leaks), persistence, EN/FR coverage. Browser smoke tests where tooling permits.

Acceptance scenarios:
- App starts, 3D scene loads, components are selectable, camera focus works, no critical console errors.
- Start with a door open: sequence refuses and the PLC screen shows the interlock path.
- Edit Z2 or stop time in the NC editor: the part visibly moves and heats differently, quality result changes.
- Force a signal: the 3D machine reacts, every HMI shows the forced indicator, the audit log records it.
- Change the virtual 2D camera IP: it goes offline in the PROFINET view, reads fail, parts are rejected, the right alarms appear.
- Run 30 parts with two injected faults: counters and traceability records are correct.
- Reset and recovery behave consistently.

Never claim tests pass unless they were actually run.

## 20. REQUIRED DELIVERABLES

1. Complete runnable source project. 2. `npm run dev` and `npm run build`. 3. Working 3D machine scene. 4. Simulation state machines and signal bus. 5. Interactive HMI and PLC replicas. 6. Procedure and fault framework. 7. Learning mode with local progress. 8. Tests. 9. README with exact install/launch steps. 10. Architecture and data-model docs. 11. Source register with URLs and relevance. 12. Needs Verification register. 13. Model asset inventory and licensing notes. 14. Model checklists and comparison renders. 15. Screenshots or demonstration of the actually running app. 16. Lists of completed features, incomplete features and known limitations.

No mockups only, static HTML only, pseudo-code only, or lists of future tasks.

## 21. DEVELOPMENT PHASES — STOP FOR REVIEW AFTER EACH

- **Phase 1:** source extraction, research plan, architecture, discrepancy register, reference sheet.
- **Phase 2a:** induction machine only, to the section 5.7 gate (all five layers, checklist, comparison renders, camera, selection, asset workflow).
- **Phase 2b:** rest of the line (washers, oven, gage, unload, cabinets), CVOR model, inspection modes.
- **Phase 3:** simulation engine, signal bus, station state machines, part lifecycle with animations.
- **Phase 4:** main HMI, SINUMERIK-style screen with NC editor, Inducontrol, AutoID, recipe editor, PLC screens, network editor, roles and audit log.
- **Phase 5:** procedures, faults, guided troubleshooting.
- **Phase 6:** learning mode, quizzes, scoring, local progress.
- **Phase 7:** performance, accessibility, tests, documentation, release packaging.

At the start of each phase: state assumptions, list files to create or change, identify blockers, ask only questions that materially block progress. Provide a runnable checkpoint before moving on. Do not claim completion when only the plan exists.

## 22. SAFETY AND FINAL QUALITY RULES

This is a virtual training tool. Do not connect it to real PLCs, OPC UA, Modbus, PROFINET or factory networks; any future integration needs a separate authorised safety and cybersecurity review. Display prominently: **"Verify against master controlled copies before operational use."** Never invent plant specifications, claim unverified metallurgy predictions, or present a simulated quality result as production approval.

Objective: a detailed, interactive, evidence-backed digital twin whose geometry, process logic, controls and training experience are connected.

**Begin by inspecting the supplied files and the available development environment (Node, npm, Blender, Playwright). Then implement the current phase (Phase 1) rather than proposing another plan.**
