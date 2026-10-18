# Needs Verification Register

> Regenerated from `src/data/needs-verification.json` by `npm run docs:generate`.
> Do not edit by hand — edit the JSON.

**Policy:** Conflicting or unclear values are preserved, never merged or silently corrected. Each entry is also listed in docs/NEEDS_VERIFICATION.md.

All entries are `status: open` as of 2026-10-15. Known conflicts are preserved, never merged.

### NV-001 — Washer / quench concentration: 2.8 % vs 3.5-9.5 %

- **status:** open
- **related items:** PR-103, CP-014, OB-014
- **evidence:** `Project_Document.pdf` p.3-4 · needs-verification · confidence high · unverified · reviewed 2026-10-15

Setup sheet states chemical concentration 2.8 % (measured via conductivity meter / refractometer). Control plan OCP34417178 manual check 14 states 3.5-9.5 % (x2 for Aquaquench 251). Both preserved; not merged.

---

### NV-002 — 2D Camera and DataMatrix reader share IP 172.38.22.37

- **status:** open
- **related items:** IP-009, IP-015
- **evidence:** `Project_Document.pdf` p.7 · needs-verification · confidence high · unverified · reviewed 2026-10-15

The documented IP table lists '2D Camera 172.38.22.37' and 'DataMatrix Reader (AutoID) 172.38.22.37 (SR-20AH)'. Could be one device under two names or a transcription error. Subnet masks and gateways are not documented anywhere in the sources and must not be invented.

---

### NV-003 — Coil centering teflon gap: 1.5 mm vs 1 mm

- **status:** open
- **related items:** PR-016, PC-004
- **evidence:** `Project_Document.pdf` p.3,6 · needs-verification · confidence high · unverified · reviewed 2026-10-15

Setup-sheet note (p.3): 'verified with 1.5 mm Tlenlon [sic] gap check'. Changeover instruction CHO3440796 (p.6): 'use teflon 1 mm gap for coil centering'. Both preserved.

---

### NV-004 — NC block N580: R29=4 vs R29=-4

- **status:** open
- **related items:** NC-006
- **evidence:** `PHOTO:4.20.44 PM.jpeg` · needs-verification · confidence medium · unverified · reviewed 2026-10-15

Photo '4.20.44 PM.jpeg' reads 'N580 R29=4 ; VOLTAGE ON'. An earlier project reference note (plc-honesty.md) transcribed 'R29=-4'. Needs a sharper photo or the controlled NC listing.

---

### NV-005 — BELL program block N1130 illegible

- **status:** open
- **related items:** NC-010
- **evidence:** `PHOTO:4.20.44 PM.jpeg` · needs-verification · confidence high · unverified · reviewed 2026-10-15

The SINUMERIK photo shows a partially visible line 'N1130 G4F3: 20102020?' that is blurred/cut off. Not transcribed as fact.

---

### NV-006 — Photo count: 65 stated vs 64 supplied

- **status:** open
- **related items:** -
- **evidence:** `Project_Document.pdf` p.1,11-13 · needs-verification · confidence high · unverified · reviewed 2026-10-15

The PDF repeatedly states '65 site photographs' and Appendix A is titled 'All 65 Files', but Appendix B reproduces 64 images and the supplied zip contains exactly those 64 files. One photo is unaccounted for.

---

### NV-007 — PDF captions misaligned with actual photo files (tail of the set)

- **status:** open
- **related items:** OB-008, OB-012, OB-018, HM-002, IP-016
- **evidence:** `PHOTO:contact-sheets-2026-10-15` · needs-verification · confidence high · unverified · reviewed 2026-10-15

Contact-sheet review on 2026-10-15 showed the PDF Appendix A/B caption text does not match the actual image content for at least these files: '4.21.01 PM (5)'..'4.21.01 PM' (EP/refractometer/crack/boxing/IC shifted by ~1), '4.21.02 PM (2)','(3)','(4)','(5)','(10)', and '4.21.03 PM (6)','(7)','(8)','(9)', '4.21.03 PM'. Example: file '4.21.03 PM (9).jpeg' is the Inducontrol main-HMI dashboard, but its caption claims the draw-oven setup sheet. Use the per-file observations in docs/reference/REFERENCE_SHEET.md (from the images themselves), not the PDF captions, until re-checked.

---

### NV-008 — 'Bowl' vs 'Bell' naming

- **status:** open
- **related items:** PR-001, PR-011
- **evidence:** `Project_Document.pdf` p.3 · needs-verification · confidence medium · unverified · reviewed 2026-10-15

Section 2.3 heading says 'Bowl & Stem Recipe' and lists 'Bowl Frequency', while the same document and the HMI consistently use 'Bell' (Bell heat, BELL STN, NC/MPF/BELL, CHAN2 Bell). Treated as the same station for now, but the terminology conflict is preserved.

---

### NV-009 — Quench water line garbled

- **status:** open
- **related items:** PR-015
- **evidence:** `Project_Document.pdf` p.3 · needs-verification · confidence high · unverified · reviewed 2026-10-15

Setup-sheet row transcribed as 'Quench Water 251, >5 bar zone Verte Same'. Likely AQUAQUENCH 251 with a >5 bar green-zone indication, but this is an inference and is not used as a simulation threshold.

---

### NV-010 — Observed Bell Ext Shower 117.9 LPM outside recipe band 100-105 LPM

- **status:** open
- **related items:** OB-008, PR-013
- **evidence:** `PHOTO:4.21.03 PM (9).jpeg` · needs-verification · confidence high · unverified · reviewed 2026-10-15

The dashboard screenshot shows BELL EXT SHOWER 117.9 LPM while the recipe lists 100-105 LPM. Screenshot values are observed values only - this is recorded as an observation, NOT as a fault, out-of-spec claim or alarm condition. The machine state at photo time is unknown (auto-started shower test, different recipe, sensor offset, ...).

---

### NV-011 — No verified wide exterior photo of the induction machine

- **status:** open
- **related items:** NT-005
- **evidence:** `PHOTO:contact-sheets-2026-10-15` · needs-verification · confidence high · unverified · reviewed 2026-10-15

The 64-photo set contains close-ups through the access window and mesh guard plus control screens, but no unambiguous whole-machine elevation photo of the induction machine (CV1-CV4). A primary isometric reference photo is required before Phase 2a modelling. Options: obtain additional site photos, or model from the close-ups plus the 3D line model shown on the main-HMI dashboard photo and label all proportions ESTIMATED.

---

### NV-012 — Stem frequency not listed

- **status:** open
- **related items:** PR-012
- **evidence:** `Project_Document.pdf` p.3 · needs-verification · confidence high · unverified · reviewed 2026-10-15

The recipe table gives Bowl frequency 15 +/-1 kHz and leaves the Stem frequency cell blank. No value may be invented.

---

### NV-013 — Shower-flow graph threshold 300 L/min not confirmed

- **status:** open
- **related items:** HM-005
- **evidence:** `PHOTO:4.21.03 PM (10).jpeg` · needs-verification · confidence medium · unverified · reviewed 2026-10-15

The PDF caption claims the Inducontrol shower-flow graph shows 'threshold 300 L/min'. The actual graph photo (file '4.21.03 PM (10).jpeg') shows a green band and softkeys but the numeric threshold is not legible at the reviewed resolution. Not used as a simulation limit.

---

### NV-014 — OPD pin diameters are an example, not a program table

- **status:** open
- **related items:** GD-002
- **evidence:** `Project_Document.pdf` p.5 · needs-verification · confidence high · unverified · reviewed 2026-10-15

The source says pin diameters are 'per program table (e.g., 2.00-2.002 mm)'. The actual per-program pin table was not legible in the supplied photos. The example value must not be hard-coded as the plant standard.

---

### NV-015 — Draw oven manufacturer model unknown

- **status:** open
- **related items:** EQ-004
- **evidence:** `Project_Document.pdf` p.2 · needs-verification · confidence high · unverified · reviewed 2026-10-15

'Therelek Engineers' is named as the make. No model number, burner details or controller model appear in the sources. A generic furnace model must never be presented as the plant's Therelek unit.

---

### NV-016 — No photograph of a physical gage station exists

- **status:** open
- **related items:** PHOTO-21, EQ-007, PF-010, DC-021, DC-022
- **evidence:** `docs/reference/photos (absence verified against reference-sheet.json)` p.n/a · needs-verification · confidence high · unverified · reviewed 2026-10-17

The GAGE / OPD check station is documented only by instruction material (PHOTO-21 gage instruction document, gage/fixture sheet, GOP34413151/GOP34413754 and gage SG 699436 steps). No photograph of the physical station appears in the 64-photo reference set, so no comparison render and no human visual sign-off can be made. The station is deferred in the 3D line until a photo is supplied; only the drawing-derived setpoints and check steps are extractable. No gage station geometry may be invented and presented as the plant's.

---

### NV-017 — HMI alarm wording conflicts between the new alarm photographs and the earlier extraction

- **status:** open
- **related items:** AL-001, HMI-067, HMI-024, HMI-028, HMI-044, HMI-052
- **evidence:** `docs/HMI errors/*.jpg vs PHOTO-14 (docs/reference/photos/4.20.44 PM.jpeg) and src/data/initial-extraction.json AL-001` p.n/a · document · confidence high · unverified · reviewed 2026-10-17

The 53 alarm-screen photographs added on 2026-10-17 (docs/HMI errors/, transcribed in src/data/hmi-errors.json) disagree with the earlier PHOTO-14 reads and with each other in several places. Preserved, not merged: (1) 700826 reads BRIX % OUT OF RANGE 3-3.5 on ten screens but AL-001 (PHOTO-14) reads BRAX % OUT OF RANGE: 3 - 3.5 - one spelling error on one side, unknown which; (2) 700306 is paired with QUENCH WATER LEVEL OVER FLOW by the 0010 detail pane but with ORIENTATION CYLINDER ADVANCE FEEDBACK TIMEOUT (DB2.DBX204.6) CHECK E15.0 by the 0023/0028 lists; (3) 700329 is INDUCONTROL GROUP NOT OK 2 on two screens but lines up with PAPERBAND FILTER NO PAPER CONTACT (DB2.DBX207.5) CHECK E9.3 on 0002; (4) 700509 is INITIALIZATION NOT DONE FOR AUTO CYCLE (DB2.DBX221.1) on two screens but LOADING & UN-LOADING CONVEYOR SEQUENCE NOT INITIALIZED on three; (5) 700603 is WAIT FOR ABSENCE AT LOADING/UNLOADING STN AFTER HEATING on three screens but TAILSTOCK ROTATION ON BELL MISSING CHECK I17.1 on 0007. All of it is OCR of photographs of the running HMI, so none of it is authoritative: the controlled alarm list and the PLC program must settle each one. Until then the register keeps every candidate and marks the pairings clear/probable/unclear.

---

### NV-018 — No reference photograph isolates the CV OR workpiece - its dimensions cannot be gated

- **status:** open
- **related items:** WP-01, WP-02, WP-05, WP-07, WP-08, WP-09, EQ-005, EQ-006, EQ-007, QN-004, QN-005, GD-004, GS-004
- **evidence:** `docs/compare/workpiece/ vs PHOTO-05, PHOTO-09, PHOTO-12 (docs/reference/photos/) - no isolating reference` p.n/a · needs-verification · confidence high · unverified · reviewed 2026-10-18

Phase 2b increment 3 models the CV OR workpiece (src/three/workpiece.ts, STATION_Workpiece). Every source that shows the part shows it small, wet, glinting or partly hidden: PHOTO-05 (induction bowl close-up, part on the fixture under coolant), PHOTO-09 (stem quench, part wet in the machine) and PHOTO-12 (a tray of parts at the oven exit, seen at a distance). There is no part-only photograph and no dimensioned drawing or CAD (NV-011), so no pose can be photo-matched to the part itself. In the Phase 2a model the fixture sits inside a closed enclosure shell, so the committed wp-ref-part pose does not even see the part - it renders the shell and door glass, and its captures are byte-identical across model versions (the part view that is committed, wp-closeup, is a free camera inside the enclosure with nothing to compare it to). Consequences: every dimension in the model is ESTIMATED from photo proportions or ASSUMED; the base flange and its six bolt holes (WP-08), the interior seating face and cage seat (WP-07), the spline tooth count (WP-05) and the positions of the DataMatrix, OPD dot and V marks (WP-09) are invented placements of documented features and must not be read as plant geometry; no material grade is claimed (sources say only that the part is steel). To close this, obtain either a controlled part drawing or a dedicated close-up photograph of a single part on a plain background.

---

### NV-019 — No photograph shows the line end (unload / boxing) - the station cannot be gated

- **status:** open
- **related items:** EQ-008, PF-009, PF-012, QN-007, CP-002, PC-010
- **evidence:** `docs/compare/line-end/ vs the reference sheet (docs/reference/photos/) - no station photograph exists` p.n/a · needs-verification · confidence high · unverified · reviewed 2026-10-18

Phase 2b increment 4 models the cooling / unload conveyor (PF-009) and the unload / boxing station (EQ-008, PF-012) at src/three/lineEnd.ts (STATION_Unload, STATION_Boxing). NO photograph in the reference sheet shows this end of the line: the only related images are paper documents and screens - PHOTO-22 / PHOTO-28 (Instruction de Travail CVOR with boxing steps and yellow bins), PHOTO-42 (boxing orientation red BAD / green GOOD box houses, photographed upside down), PHOTO-12 (oven discharge belt with parts on a tray) and PHOTO-01 (mounted handheld scanner at the blank-wash conveyor, the model for the boxing scanner). Consequences: every component of this station is ESTIMATED from documents or ASSUMED - the cooling conveyor construction, the bench, the box houses, the bins, the WIP trolley, the bench tray, the handheld scanner, the work-instruction holder and the stack light; there is no dimensioned drawing (NV-011) and no reference photograph to overlay, so the committed renders in docs/compare/line-end/ record the model but cannot gate its fidelity (LC-15 / LC-16). The belt height (1.025 m) and the start position (x 7.45, the oven discharge roller) are taken from the accepted oven model so the conveyor line is continuous by construction, not by measurement. To close this, obtain a photograph of the unload / boxing area from the operator side and the boxing bench, or a layout drawing of the line end.

---

### NV-020 — Reject box location conflict: "big Hot Zone reject box" versus the GOOD / BAD boxes at boxing

- **status:** open
- **related items:** QN-007, EQ-008, PHOTO-42
- **evidence:** `QN-007 (big Hot Zone reject box) vs PHOTO:4.21.01 PM.jpeg (GOOD / BAD boxes at boxing)` p.n/a · needs-verification · confidence medium · unverified · reviewed 2026-10-18

The unloading orientation standard (QN-007) requires parts to be placed "in big Hot Zone reject box / good box correctly", and the equipment register lists a reject bin with the unload / boxing station (EQ-008). The boxing-orientation sheet (PHOTO-42) shows a red BAD box and a green GOOD box photographed together at the boxing area. It is not stated whether the "Hot Zone reject box" is the same red box as the boxing one or a second, separate reject box kept in the Hot Zone (the induction / heat-treatment area), and no photograph shows where either box stands on the floor. Phase 2b increment 4 places a red reject box house and a green good-part box house together beside the boxing bench (src/three/lineEnd.ts, checklist item LC-07 in src/data/model-checklist-lineend.json) and labels the placement ASSUMED. Preserved, not merged: to close this, confirm the number and location of reject boxes from the plant, or supply a photograph showing the boxing area floor layout.

---

### NV-021 — Laser marking station position and the marking / reading device layout are undocumented

- **status:** open
- **related items:** EQ-005, EQ-006, IP-009, IP-010, IP-011, IP-015, IP-016, EP-003, EP-006, PF-003, IC-01, IC-02, IC-03, IC-07, IC-08
- **evidence:** `docs/compare/identification/ vs the reference sheet (docs/reference/photos/) - neither station is photographed; PHOTO-02 (AutoID software) and PHOTO-46 (network plate) only corroborate the equipment` p.n/a · needs-verification · confidence high · unverified · reviewed 2026-10-18

Phase 2b increment 5 models the laser marking station (EQ-005, IP 172.38.22.39) and the 2D camera / code reader (EQ-006, Keyence-style SR-20AH, IP 172.38.22.37) as two stations on the induction feed belt (src/three/identification.ts, STATION_Marking and STATION_Reader). No source states where the marking station stands, what either machine looks like, or in which order the two devices sit on the belt. EQ-005 and EQ-006 are named in the equipment register (2D DataMatrix marking / DataMatrix verification) and the IP table names '2D Camera', 'Laser Sensor' and 'Laser Marking Station' (IP-009..IP-011, IP-015), but there is no photograph of either station's hardware: PHOTO-02 is only a PC monitor running AutoID Network Navigator, and PHOTO-46 is a wall-mounted network plate that lists 2D CAMERA / LASER SENSOR / STATION DE MARQUAGE with 172.38.22.x addresses without any placement. The placement used is therefore inferred, not known: (1) the reader is put at the induction station entrance because EP-006 states EP verification is performed before the DataMatrix reader at the induction station entrance, and PF-003 puts the 2D code scan after the blank wash (PF-002) and before the induction heat (PF-004); (2) the marking station is put immediately upstream of the reader on the same belt because EP-003 requires a blank run with the laser disabled to be rejected by the reader, so the code must be written before it is read. Both the marking-station form (enclosure, glazing, head, cabinet) and the reader mount (post-and-arm, head, ring light, AutoID panel) are ASSUMED. Consequences: IC-01..IC-14 in src/data/model-checklist-identification.json are ESTIMATED / ASSUMED / INFERRED, nothing is MEASURED (NV-011), and the committed renders in docs/compare/identification/ record the model but cannot gate its fidelity (IC-15 / IC-16). Preserved, not merged: to close this, obtain a photograph of the marking station and the reader on the line, a line layout drawing showing their positions, or the marking/reading station order from the plant.

---

### NV-022 — HMI / PLC logic and fault triggers are not in the sources

- **status:** open
- **related items:** HMI-019, HMI-022, HMI-026, HMI-032, HMI-063, HMI-069, GS-10
- **evidence:** `docs/HMI_ERRORS.md and the SINUMERIK / Inducontrol alarm screenshots - the alarm text is extracted but the raising logic and reset procedure are not provided` p.n/a · needs-verification · confidence high · unverified · reviewed 2026-10-18

Phase 4 adds an interactive HMI troubleshooting/diagnostics mimic (src/hmi/hmiSim.ts, panel in src/three/viewport.ts). The alarm text, code and the what-to-check / how-to-fix hints are taken verbatim from the extracted HMI error register (src/data/hmi-errors.json, 70 entries read from the SINUMERIK / Inducontrol alarm screenshots, docs/HMI_ERRORS.md), so nothing there is invented. What is NOT in any source is the plant logic: which real condition raises each alarm, the PLC signal names/addresses behind them, the enable/interlock chain, and the correct reset procedure. Each fault button in the mimic therefore only forces a simulated signal on the local SignalBus (src/sim/bus.ts) as a teaching link to the matching code (laser fault -> HMI-019, scan/code fault -> HMI-032, size fault -> HMI-022, conveyor stop -> HMI-026, heat -> HMI-069, quench -> HMI-063); these pairings are an inference for demonstration, not the plant wiring. The forced indicator and the audit log are simulated only. No real PLC, OPC UA, Modbus or PROFINET connection exists. Consequences: the HMI panel is labelled simulated logic and must not be used as the plant HMI or as a validated troubleshooting procedure. Preserved, not merged: to close this, obtain the PLC/NC program, the alarm-to-condition table and the approved reset procedures.

---

### NV-023 — SR-20AH is a KEYENCE lens attachment, not a standalone reader model

- **status:** open
- **related items:** EQ-006, IP-015, EX-001, EX-002
- **evidence:** `KEYENCE public SR-2000 series product pages (specs + model list) - see external-research.json EX-001/EX-002` p.n/a · external · confidence high · unverified · reviewed 2026-10-18

The plant document AutoID Network Navigator screen (PHOTO-02) shows the reader designation SR-20AH, and EQ-006 / IP-015 carry it as the reader model. An external check of the KEYENCE SR-2000 series (2026-10-18, src/data/external-research.json EX-001/EX-002) shows SR-20AH is actually the high-resolution lens attachment (0.012 mm minimum 2D resolution, 35-70 mm reading distance, 26 x 19 mm field of view at 70 mm, approx. 50 g) that mounts on an SR-2000 series main unit - not a standalone reader. The reader main unit actually fitted on the line is therefore unconfirmed; an SR-2000 series unit is consistent (AutoID Network Navigator is that series setup software) but is not established by any source. The observed SR-20AH designation is preserved in the register and on the 3D reader nameplate (ESTIMATED tag), not overwritten. Preserved, not merged: close this by reading the reader rating plate or the AutoID Network Navigator device list from a controlled copy.

