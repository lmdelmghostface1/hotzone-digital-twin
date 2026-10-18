# Sources

## What we have

| source | path | extent | trust |
|--------|------|--------|-------|
| Compiled project document | `docs/sources/Project_Document.pdf` | 75 pages: text pp. 1–12, photo appendix pp. 13–75 | **Not controlled master documentation.** A compilation dated 15 Oct 2026 from shop-floor photographs. |
| Source photographs | `docs/reference/photos/` (64 files) | Exactly the 64 files of the zip `WhatsApp Unknown 2026-10-15 at 4.22.07 PM.zip`, matching Appendix A filenames | Observed evidence; caption text in the PDF is unreliable (NV-007) |
| Public manufacturer documentation | URLs recorded in `src/data/external-research.json`, mirrored in `docs/EXTERNAL_RESEARCH.md` | 6 researched entries (KEYENCE SR-2000 series + AutoID Network Navigator; Therelek Engineers; Siemens SINUMERIK alarm ranges and component naming; an "Inducontrol" negative search) | **External corroboration only.** Never overrides the plant document; no entry claims a generic product is the plant's actual machine (see EX-001..EX-006, NV-023). |
| Master prompt | `docs/MASTER_PROMPT.md` | Phase definitions, rules, fidelity gate | Project instruction, authoritative for *process*, not for *plant data* |
| Skill rules | `hotzone-rules` skill (`SKILL.md`, `references/fidelity-gate.md`, `references/plc-honesty.md`) | Honesty, evidence, safety, architecture, phase discipline | Project rules |

## What we do NOT have

- Controlled master documents: recipes, control plan, NC/PLC listings, network plans.
- Any PLC or NC source program. Interlock logic is therefore *simulated logic* in later phases.
- Any safe way to touch the real network — connecting to, scanning or pinging real PLCs,
  OPC UA, Modbus or PROFINET is forbidden by project rule.
- A verified wide exterior photo of the induction machine (NV-011).
- Subnet masks / gateways anywhere in the sources (must not be invented).
- One of the 65 claimed photographs — 64 were supplied (NV-006).

## Source inventory inside the PDF (pp. 1–12)

The document text itself transcribes: process overview, bowl/bell + stem recipes, washer
setup, draw-oven setup, IP table, control plan OCP34417178, error-proofing (EP), gage
instructions, OK/NOK standards, crack reaction plan, start/stop + interrupted cycle
procedures, safety/LOTO, roles, and a document list (27 entries). All of these were
extracted into `src/data/initial-extraction.json` with page-level evidence.

## Excluded material

Seven loose images in `C:/Users/Pc/Videos/avis` (dated 2026-09-20 / 2026-09-22) were
reviewed and excluded: they show ceiling lamps, a door chime and personal identity
documents — not plant content. They were not copied into this project.

## Caption reliability (NV-007)

Contact-sheet review on 2026-10-15 showed PDF captions do not match the actual image
content for at least ~16 files, concentrated in the tail of the set. Example: file
`4.21.03 PM (9).jpeg` is the Inducontrol main-HMI dashboard; its caption claims the
draw-oven setup sheet. **Per-file observed content in `docs/reference/REFERENCE_SHEET.md`
is the working ground truth; the PDF captions are kept next to it for traceability.**

## How sources are used downstream

- `src/data/*.json` is the single source of truth; every record carries `evidence`.
- `npm run build` fails if any evidence object is missing or malformed.
- `src/data/external-research.json` (category `external`) records what public
  manufacturer documentation could and could not confirm; the validator checks it and
  `docs/EXTERNAL_RESEARCH.md` mirrors it. Conflicts it raises are preserved as NV entries
  (e.g. NV-023: SR-20AH is a KEYENCE lens attachment, not a standalone reader).
- All Phase 1 items are `status: "unverified"` because no source in hand is a
  controlled master document.
- Screenshot-derived values (`kind: "hmi-observed"`) are observed-only.
