#!/usr/bin/env node
/**
 * One-off generator for Phase 5 data (procedures + faults registers).
 *
 * Sources are ALWAYS src/data/initial-extraction.json (procedures) and
 * src/data/hmi-errors.json (alarm texts). Every generated step/fault copies
 * the evidence object of its source, and the step text is a verbatim segment
 * of the source item value (the script asserts this; round-trip joined with
 * the documented separator must reproduce the source text). Nothing here is
 * reconstructed from general knowledge.
 *
 * Run: node scripts/gen-phase5-data.mjs
 * The output is committed; this script is not part of the build.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const extraction = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'initial-extraction.json'), 'utf8')
);
const hmiReg = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'hmi-errors.json'), 'utf8')
);

const item = (id) => {
  const it = extraction.items.find((x) => x.id === id);
  if (!it) throw new Error(`source item ${id} missing from extraction register`);
  return it;
};

/** steps = exact item value split on the documented separator, joined back
 *  reproducing the original (checksum in the script) */
function chain(itemId, separator = ' -> ', manualAll = false) {
  const it = item(itemId);
  const parts = it.value.split(separator).map((s) => s.trim());
  const steps = parts.map((text, i) => ({
    id: `${itemId}.${i + 1}`,
    sourceItem: itemId,
    instruction: text,
    manual: manualAll
  }));
  const rejoined = parts.join(separator);
  if (rejoined !== it.value) {
    throw new Error(
      `${itemId}: round-trip mismatch\n  src:   ${it.value}\n  built: ${rejoined}`
    );
  }
  return steps;
}

/** one step per item (multi-item procedures: LOTO, gage, crack plan) */
function singleStep(itemId, manual = true) {
  const it = item(itemId);
  return {
    id: `${itemId}S`,
    sourceItem: itemId,
    instruction: it.value.trim(),
    manual
  };
}

// ---------------------------------------------------------------------------
// procedures register
// ---------------------------------------------------------------------------

const procs = [];
const pushProc = (def) => {
  const srcIds = [...new Set(def.steps.map((s) => s.sourceItem))];
  const first = item(srcIds[0]);
  procs.push({
    id: def.id,
    title: def.title,
    documentRef: def.documentRef ?? '',
    note: def.note ?? '',
    safetyNote: def.safetyNote ?? '',
    manualActionNote:
      'steps marked manual are physical actions outside the simulator; they are self-certified training actions, not verified by the simulation.',
    steps: def.steps.map((s) => ({
      ...s,
      evidence: item(s.sourceItem).evidence
    })),
    sourceItems: srcIds,
    evidence: first.evidence
  });
};

pushProc({
  id: 'PROC-START-STOP',
  title: 'Start / Stop instruction (STR34407290 / PRO.01.00.10)',
  documentRef: 'STR34407290 / PRO.01.00.10',
  steps: chain('PC-001', ' -> ', true)
});

pushProc({
  id: 'PROC-INTERRUPTED-CYCLE',
  title: 'Interrupted Cycle (RIC34402309 / RIC34401371)',
  documentRef: 'RIC34402309 / RIC34401371',
  steps: chain('PC-002', ' -> ', true)
});

pushProc({
  id: 'PROC-CLEANUP',
  title: 'Cleanup Instruction (GWI34413351)',
  documentRef: 'GWI34413351',
  steps: chain('PC-003', '; ', true)
});

pushProc({
  id: 'PROC-CHANGEOVER',
  title: 'Change Over Instruction (CHO3440796-4)',
  documentRef: 'CHO3440796-4',
  steps: chain('PC-004', '; ', true)
});

pushProc({
  id: 'PROC-SENSIBILITE',
  title: 'Sensibilite Check TP & CV (GWI3441351)',
  documentRef: 'GWI3441351',
  steps: chain('PC-005', '; ', true)
});

pushProc({
  id: 'PROC-WASHER-NOZZLES',
  title: 'Washer Nozzles Check (VAS34402948)',
  documentRef: 'VAS34402948',
  steps: chain('PC-006', '; ', true)
});

pushProc({
  id: 'PROC-REFRACTOMETER',
  title: 'Hand Refractometer (GWI34413698)',
  documentRef: 'GWI34413698',
  steps: chain('PC-007', '; ', true)
});

pushProc({
  id: 'PROC-MANUAL-LOT',
  title: 'Traceability Manual Lot (BLC34402308)',
  documentRef: 'BLC34402308',
  steps: chain('PC-008', ' -> ', true)
});

pushProc({
  id: 'PROC-NC-FLOW',
  title: 'Non-Conforming Flow Chart',
  documentRef: 'flow chart (Project_Document.pdf p.6 / item PC-009)',
  steps: chain('PC-009', ' -> ', true)
});

pushProc({
  id: 'PROC-LOTO',
  title: 'LOTO (E-1 + A-1, 2 locks)',
  documentRef: 'site LOTO energy sources E-1 / A-1 (items SF-001..SF-003)',
  note: 'lock count from SF-003: 2 locks for a complete controlled energy state; notify affected personnel before servicing.',
  steps: ['SF-001', 'SF-002', 'SF-003'].map((id) => singleStep(id, true)),
  safetyNote:
    'SAFETY-CRITICAL: this simulation is educational only - the approved site procedure governs real work. Never perform LOTO training actions on live equipment.'
});

pushProc({
  id: 'PROC-WORKSTATION-SAFETY',
  title: 'Fiche de Securite au Poste de Travail (SOP34405838 / EHS.12.00.03)',
  documentRef: 'SOP34405838 / EHS.12.00.03',
  note: 'reference material from the workstation safety sheet; no step sequence is documented beyond this text.',
  steps: [singleStep('PC-010', false)]
});

pushProc({
  id: 'PROC-OPD-SPLINE-GAGE',
  title: 'OPD / spline gage - SG 699436 (GOP34413151/755/754)',
  documentRef: 'GOP34413151 / 755 / 754',
  note: 'decision rules from GD-003: Go gage full length = Good part; NoGo passing full length = Scrap / re-evaluate. Mark OK parts with V (GD-004).',
  steps: ['GS-001', 'GS-002', 'GS-003', 'GS-004'].map((id) => singleStep(id, true))
});

pushProc({
  id: 'PROC-OPD-MEASUREMENT',
  title: 'OPD measurement plan (before / after heat treatment)',
  documentRef: 'GOP34413151 (plan per GD-001)',
  steps: [singleStep('GD-001', true)]
});

pushProc({
  id: 'PROC-OPD-MARKING',
  title: 'OPD part marking (lot of 5, bearing face dot)',
  documentRef: 'GOP34413151 (per GD-004)',
  steps: chain('GD-004', '; ', true)
});

{
  const steps = [
    singleStep('CR-000', true),
    ...Array.from({ length: 15 }, (_, i) => {
      const id = `CR-0${String(i + 1).padStart(2, '0')}`;
      return singleStep(id, true);
    })
  ];
  pushProc({
    id: 'PROC-CRACK-REACTION',
    title: 'Crack Reaction Plan (GWI34417543)',
    documentRef: 'GWI34417543',
    note: 'event-based reaction: stop the machine and inform TL / QT / TE first, then execute the documented checks CR-001..CR-014 and the follow-up control CR-015.',
    steps,
    safetyNote: 'a crack reaction touches product containment: verify against the controlled master plan before operational use.'
  });
}

// ---------------------------------------------------------------------------
// faults register
// ---------------------------------------------------------------------------

/** the pairing between a simulated machine fault and a real register alarm is
 *  an educational inference (NV-022) - recorded as such on every entry */
const PAIRING_EVIDENCE = {
  sourceId: 'docs/NEEDS_VERIFICATION.md (NV-022)',
  category: 'inference',
  confidence: 'low',
  status: 'unverified',
  reviewed: '2026-10-18'
};

const SIM_FAULTS = [
  {
    id: 'FAULT-LASER',
    label: 'Laser unit not ready',
    station: 'MARKING',
    machine: 'laser marking station',
    fault: 'laserDisabled',
    signal: 'laser.enabled',
    forcedDesc: 'false (switched off)',
    hmiId: 'HMI-019',
    symptoms: [
      'laser unit not ready / marking disabled',
      'parts arrive unmarked and are rejected at the reader (reader alarm HMI-032 is a separate fault)'
    ]
  },
  {
    id: 'FAULT-SCAN',
    label: '2D scanner reading error',
    station: 'READER',
    machine: '2D code reader',
    fault: 'damagedCode',
    signal: 'fault.damagedCode',
    forcedDesc: 'true',
    hmiId: 'HMI-032',
    symptoms: ['the tracked job is rejected by the reader']
  },
  {
    id: 'FAULT-SIZE',
    label: 'Job height not within range',
    station: 'GAGE',
    machine: 'gage station + operator (conceptual)',
    fault: 'gageForceNok',
    signal: 'gage.offsetMm',
    forcedDesc: '0.03 mm',
    hmiId: 'HMI-022',
    symptoms: ['the current job is rejected at the gage with a NO-GO result']
  },
  {
    id: 'FAULT-CONVEYOR',
    label: 'Unloading conveyor motor trip',
    station: 'UNLOAD',
    machine: 'cooling / unload conveyor',
    fault: 'conveyorStop',
    signal: 'conv.stop',
    forcedDesc: 'true',
    hmiId: 'HMI-026',
    symptoms: ['unloading conveyor stopped', 'boxed parts stop being processed on the bench']
  },
  {
    id: 'FAULT-HEAT',
    label: 'DM high level temperature',
    station: 'INDUCTION',
    machine: 'induction heating machine (bell heat)',
    fault: 'heatFault',
    signal: 'fault.heat',
    forcedDesc: 'true',
    hmiId: 'HMI-069',
    symptoms: ['temperature alarm in the heating stage while a bell part is heating']
  },
  {
    id: 'FAULT-QUENCH',
    label: 'Quench temperature low limit',
    station: 'INDUCTION',
    machine: 'induction heating machine (quench)',
    fault: 'quenchFault',
    signal: 'fault.quench',
    forcedDesc: 'true',
    hmiId: 'HMI-063',
    symptoms: ['quench temperature alarm while quenching is active']
  }
];

const faults = [];
for (const f of SIM_FAULTS) {
  const a = hmiReg.entries.find((x) => x.id === f.hmiId);
  if (!a) throw new Error(`alarm ${f.hmiId} missing from register`);
  faults.push({
    id: f.id,
    label: f.label,
    category: 'process',
    station: f.station,
    machine: f.machine,
    trigger: {
      via: `hmi fault "${f.fault}" (machine panel fault button / PLC force / sim condition)`,
      signal: f.signal,
      forced: f.forcedDesc
    },
    alarm: { id: a.id, code: a.code, text: a.text },
    symptoms: f.symptoms,
    reaction: {
      kind: 'training-scenario',
      note:
        "No official reaction plan for this fault exists in the controlled sources; this remedy is a TRAINING SCENARIO and must not be presented as the plant's official recovery. Verify against master controlled copies before operational use.",
      steps: [
        {
          id: 'R.1',
          name: 'read the alarm',
          instruction: 'The alarm text is verbatim from the extracted register (photographic evidence).',
          manual: false
        },
        {
          id: 'R.2',
          name: 'check the machine on the 3D line',
          instruction: `Select the ${f.machine} on the 3D line; the machine panel shows the FORCED indicator for ${f.signal}.`,
          manual: false
        },
        {
          id: 'R.3',
          name: 'clear the trigger (simulated)',
          instruction: `Unforce ${f.signal} on the machine panel (or unforce-all on the PLC screens), watch the alarm clear and the FORCED indicator disappear. This is the simulated recovery condition - not a documented plant procedure step.`,
          manual: false
        }
      ],
      stepsEvidence: PAIRING_EVIDENCE
    },
    alarmEvidence: a.evidence,
    evidence: PAIRING_EVIDENCE
  });
}

// crack event - the documented reaction exists (CR plan)
const crack = item('CR-000');
faults.push({
  id: 'FAULT-CRACK',
  label: 'Cracks appear on parts',
  category: 'quality-event',
  station: 'MPI/METLab (off-line)',
  machine: 'MPI / METLab stations (off-line; not modelled as 3D machines)',
  trigger: {
    via: 'educational trigger only: imported/CLI (no on-line sensor in the simulated line)',
    signal: null,
    forced: 'no'
  },
  alarm: null,
  symptoms: [
    'visual crack indication (MPI) or METLab finding',
    'no HMI alarm is claimed - detection is off-line per the register'
  ],
  reaction: {
    kind: 'documented',
    note: 'Reaction follows the documented Crack Reaction Plan (GWI34417543) extracted as CR-000 + CR-001..CR-015; source order preserved.',
    procedureId: 'PROC-CRACK-REACTION',
    stepsEvidence: crack.evidence
  },
  alarmEvidence: null,
  evidence: crack.evidence
});

// ---------------------------------------------------------------------------
// write
// ---------------------------------------------------------------------------

const proceduresFile = {
  meta: {
    project: extraction.meta.project,
    policy:
      'Every step is a verbatim segment of the extracted procedure register (src/data/initial-extraction.json items PC-*, CR-*, GS-*, GD-*, SF-*). Steps that are physical actions outside the simulator (LOTO locks, refractometer sampling, coil changes, gage handling) are flagged manual; the simulator does NOT perform or verify them - they are self-certified training actions. No steps are reconstructed from general knowledge; nothing here is validated for operational use.',
    safetyDisclaimer:
      'For LOTO and other safety-critical procedures the simulation is educational only - the approved site procedure governs real work.',
    scoring: 'not implemented; assessment/progress tracking arrives with learning mode (Phase 6).'
  },
  procedures: procs
};

const faultsFile = {
  meta: {
    project: extraction.meta.project,
    policy:
      'Six teaching faults reuse the fault/alarm pairings built for the HMI mimic; the pairings themselves are an educational inference (NV-022). Alarm texts and codes are verbatim from the extracted register (src/data/hmi-errors.json). Faults marked training-scenario have NO documented reaction plan: remedies are simulated actions (unforce/ack) and are never presented as the plant\'s official recovery.',
    safetyDisclaimer:
      'Educational training scenarios only. Verify against master controlled copies before operational use.'
  },
  faults
};

writeFileSync(
  join(root, 'src', 'data', 'procedures.json'),
  JSON.stringify(proceduresFile, null, 2) + '\n'
);
writeFileSync(
  join(root, 'src', 'data', 'faults.json'),
  JSON.stringify(faultsFile, null, 2) + '\n'
);
console.log('generated:', procs.length, 'procedures,', faults.length, 'faults.');
