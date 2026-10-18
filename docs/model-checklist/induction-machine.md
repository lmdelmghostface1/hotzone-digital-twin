# Model checklist — induction machine (Phase 2a)

> Regenerated from `src/data/model-checklist.json` by `npm run docs:generate`.
> Do not edit by hand — edit the JSON.

**Gate:** hotzone-rules fidelity-gate.md / MASTER_PROMPT section 5.7
**Station:** INDUCTION · generated 2026-10-15

Statuses are self-assessed against the reference photographs after the v5 comparison render (saved ref pose, PHOTO-10). No dimension is MEASURED - no controlled drawings exist (NV-011). Objective comparison metrics are in docs/compare/induction/model_v5_metrics.json. Human visual sign-off (MC-14) received 2026-10-15 - Phase 2a fidelity gate cleared.

| id | checklist item | status | note | evidence |
|----|----------------|--------|------|----------|
| MC-01 | overall silhouette and proportions | **PARTIAL** | Relative placement of enclosure, bay, conveyor and guard follows the photos; overall proportions are ESTIMATED because no wide exterior photo exists (NV-011). | `PHOTO:4.20.44 PM (1).jpeg` · photographic · medium |
| MC-02 | main enclosure placement | **DONE** | Wet-cell enclosure, window face and upper head placed per PHOTO-03/04 (through-window views); size ESTIMATED. | `PHOTO:4.20.42 PM (3).jpeg` · photographic · medium |
| MC-03 | upper assembly and cylindrical components | **DONE** | Two gold anodised cylinders with rods and caps plus central servo motor, as visible through the access window. | `PHOTO:4.20.42 PM (3).jpeg` · photographic · high |
| MC-04 | front access window (frame, glazing, hinges, handles, seals) | **DONE** | Door group with yellow frame bars, transmissive glazing, rubber seal, two hinges and handle; opens for inspection. | `PHOTO:4.20.42 PM (3).jpeg` · photographic · high |
| MC-05 | feet, levelling pads, support frames | **DONE** | Six levelling pads with stems under the yellow base frame (frame style from mesh-guard photo, pad count ESTIMATED). | `PHOTO:4.20.44 PM (1).jpeg` · photographic · medium |
| MC-06 | conveyor alignment and height | **PARTIAL** | Feed conveyor at fixture height enters the wet cell from the left. No induction-station conveyor photo exists - style inferred from the wash-station conveyor (same line); evidence category inference. | `PHOTO:4.20.41 PM.jpeg (wash-station conveyor style, same line)` · inference · medium |
| MC-07 | guarding, wire mesh, orange/yellow components | **PARTIAL** | Galvanised steel guard rails/posts with a fine instanced wire-mesh lattice (about 28 mm pitch) in front of the open bay, matching the through-mesh photo; the painted-yellow machine frame and sub-assemblies read behind the mesh. Mesh pitch and frame finish are ESTIMATED from the photo. | `PHOTO:4.20.44 PM (1).jpeg` · photographic · high |
| MC-08 | pipes, hoses, cables, brackets, fasteners | **DONE** | Green/red overhead hoses, blue pneumatic hoses, quench feed hose, cable tray, instanced bolts, valve cartridges and air elbows. | `PHOTO:4.20.44 PM (1).jpeg` · photographic · high |
| MC-09 | copper coil and workpiece relationship (clearance, centering, Teflon gap) | **PARTIAL** | Coil geometry is ASSUMED (never clearly visible) and lives in the toggleable conceptual layer; teflon spacer present with NV-003 conflict noted (1.5 mm vs 1 mm, values not encoded as dimensions). | `coil geometry ASSUMED - not clearly visible in any supplied photo` · assumption · low |
| MC-10 | quench shower arrangement (ring, nozzle count, orientation) | **PARTIAL** | Ring position follows the observed spray location; nozzle count 8 is ASSUMED - not countable in any photo. | `nozzle count ASSUMED - not countable in any photo` · assumption · low |
| MC-11 | materials, bevels, shadows, surface detail | **PARTIAL** | Palette approximates painted steel / anodised gold / copper from photos with soft shadows; exposure and fill raised to reduce the objective brightness gap against PHOTO-10 (luma model 67.5 vs photo 113.9 in docs/compare/induction/model_v5_metrics.json). No bevelled edges or wear modelling yet. | `PHOTO:4.20.42 PM (3).jpeg` · photographic · medium |
| MC-12 | labels, warning stickers, panel seams, connectors | **DONE** | CV 4 label, station nameplate, warning sticker, panel seams on enclosure/head, air elbows and valve connectors. Nameplate wording is ASSUMED. | `PHOTO:4.20.44 PM.jpeg` · photographic · medium |
| MC-13 | comparison renders committed | **DONE** | v1-v5 comparison renders from the saved reference pose (PHOTO-10) under docs/compare/induction/ (model_vN_side.png, model_vN_overlay.png); objective metrics recorded in model_v5_metrics.json (hist_cosine_gray 0.750, edge density 12.9 vs 8.1, luma 67.5 vs 113.9). | `docs/compare/induction/model_v5_metrics.json` · external · medium |
| MC-14 | human visual sign-off of comparison renders | **DONE** | Human review of model_v5_side.png against PHOTO-10 completed and accepted ("good enough") on 2026-10-15. Phase 2a fidelity gate cleared for the induction machine. | `human review of docs/compare/induction/model_v5_side.png` · external · medium |

## Honest summary

- **Exact:** nothing is MEASURED — no controlled drawings exist (NV-011).
- **Photo-supported:** enclosure/window/door, gold cylinders + servo, mesh guard and yellow
  frame, overhead hoses, fixture + quench location, operator panel, maroon box, blue bin.
- **Estimated:** all overall proportions, conveyor style (inferred from the wash station),
  panel seams/vents, fastener layout.
- **Assumed (conceptual layer):** copper coil geometry, teflon spacer, nozzle count (8),
  beacon, rear-side details (never photographed), nameplate wording.
- **Missing:** comparison renders updated after each iteration (docs/compare/induction/).
