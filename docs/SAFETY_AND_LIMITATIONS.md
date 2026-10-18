# Safety and limitations

## Mandatory banner

The application always displays:

> **Verify against master controlled copies before operational use.**

## What this project is

A **virtual training simulator** for the Nexteer Plant 78 Hot Zone CV joint line
(TRIPOT housing / CVOR), built for education. It is **not** a validated engineering tool,
not a production control system, and not a substitute for controlled documentation.

## What it is explicitly NOT

- Not a source of production approval: a simulated OK part is never production approval.
- Not a metallurgical, case-depth, temperature or crack predictor. Any such behaviour in
  later phases is an **educational trend model, labelled "not validated"**.
- Not the plant's official procedure. LOTO and safety procedures are shown for training
  only; **the approved site procedure governs real work**.
- Not the plant's PLC/NC program. The real programs are not in the sources; every
  interlock in later phases is simulated logic, tagged with its evidence category, and
  PLC screens state *"Simulated logic - not the plant program"*.
- Not a claim that a generic model (furnace, induction machine, CAD from the web) is the
  actual Nexteer machine. The Therelek draw-oven model is unknown (`NV-015`) and must
  never be replaced by a generic unit presented as the plant's machine.

## Network safety (hard rule)

Never connect to, scan, ping, or send traffic to any real PLC, OPC UA, Modbus, PROFINET
or factory network. Changing a virtual IP inside the simulation affects only the
simulation. No real network address from the sources is ever contacted by this project.

## Source honesty

- The only source document is a photo compilation, **not** controlled master
  documentation (`docs/SOURCES.md`).
- Therefore **every Phase 1 item has `status: "unverified"`**.
- Known conflicts are preserved, never merged (`docs/NEEDS_VERIFICATION.md`).
- PDF captions are demonstrably misaligned with the actual photo files (NV-007);
  the reviewed per-file observations are used instead.
- Screenshot values are observed-only — not setpoints, limits or fault conditions
  (example: NV-010, bell ext shower 117.9 LPM vs recipe band 100–105 LPM, recorded as
  an observation only; machine state at photo time unknown).
- Unknown means marked: missing values (stem frequency `NV-012`, subnet masks/gateways,
  oven model `NV-015`) stay missing. Nothing is invented from general knowledge.

## Open blocker for Phase 2a

`NV-011`: no verified wide exterior photo of the induction machine exists in the 64-photo
set. Before modelling, either obtain additional site photos or model from close-ups and
label every proportion **ESTIMATED**.

## Phase 1 known limitations

- All evidence is `unverified`; confidence ratings only describe legibility/review depth.
- 55 photos were reviewed on contact sheets only (`review: "contact-sheet"`); the other 9
  were opened at full resolution (`review: "full"`).
- Some photo captions could not be resolved (`match: "unclear"`) and one file has no PDF
  caption at all (`PHOTO-33`).
- No 3D geometry, simulation, HMI values or PLC logic exists yet — Phase 1 is extraction
  and architecture only.
