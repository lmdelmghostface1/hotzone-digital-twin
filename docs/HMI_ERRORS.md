# HMI error register — induction machine

> Regenerated from `src/data/hmi-errors.json` by `npm run docs:generate`.
> Do not edit by hand — edit the JSON.

**Verify against master controlled copies before operational use.**

**Station:** INDUCTION · generated 2026-10-17
**Source:** docs/HMI errors - 53 screening photographs of the CV1-CV4 SINUMERIK / Inducontrol alarm pages, supplied 2026-10-17 (53 screening photographs)
**Method:** Windows.Media.Ocr text recognition was run over all 53 images on 2026-10-17. The transcription is machine-made and is NOT verified against the controlled alarm list or against the machine.

**Pairing rule:** clear = the code and its text could be read together with corroboration (a detail pane spelling out 'code: text', the same pair on two or more screens, or a screen carrying a single alarm). probable = a single multi-alarm screen whose number-column and text-column runs have the same length and line up positionally, with no conflicting candidate seen. unclear = the runs do not line up or two screens give conflicting candidates - the raw OCR is preserved instead of guessing.

**Fixes:** Each entry carries fixStatus (open | in-progress | fixed | not-an-issue) so the maintenance follow-up can be tracked. These are conditions recorded on the real machine screens; the 3D model and its HMI simulation do not reproduce any of them yet.

**Caveats:** Codes are the SINUMERIK alarm numbers as read by OCR - leading digits and formatting must be confirmed in the controlled alarm list. seenInPhotos is an approximate OCR match count. Where a text is left empty the OCR could not recover it. Conflicts found so far (700306, 700329, 700509, 700603, 700826/BRIX-vs-BRAX) are recorded in the entry notes, not merged.

## At a glance

| id | code | text | pairing | fix status | seen in | source screens | evidence |
|----|------|------|---------|------------|----------|----------------|----------|
| HMI-001 | `3000` | Emergency stop | clear | open | 4 | [120363413976268198_0008.jpg](HMI%20errors/120363413976268198_0008.jpg), [120363413976268198_0030.jpg](HMI%20errors/120363413976268198_0030.jpg), [120363413976268198_0036.jpg](HMI%20errors/120363413976268198_0036.jpg), [120363413976268198_0038.jpg](HMI%20errors/120363413976268198_0038.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-002 | `25201` | Axis Z1 drive fault | clear | open | 2 | [120363413976268198_0027.jpg](HMI%20errors/120363413976268198_0027.jpg), [120363413976268198_0037.jpg](HMI%20errors/120363413976268198_0037.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-003 | `26101` | Axis A1 drive communication failure | clear | open | 1 | [120363413976268198_0037.jpg](HMI%20errors/120363413976268198_0037.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-004 | `400262` | Failure of handheld unit | clear | open | 22 | [120363413976268198_0001.jpg](HMI%20errors/120363413976268198_0001.jpg), [120363413976268198_0002.jpg](HMI%20errors/120363413976268198_0002.jpg), [120363413976268198_0003.jpg](HMI%20errors/120363413976268198_0003.jpg), [120363413976268198_0009.jpg](HMI%20errors/120363413976268198_0009.jpg), [120363413976268198_0010.jpg](HMI%20errors/120363413976268198_0010.jpg), [120363413976268198_0011.jpg](HMI%20errors/120363413976268198_0011.jpg), [120363413976268198_0013.jpg](HMI%20errors/120363413976268198_0013.jpg), [120363413976268198_0014.jpg](HMI%20errors/120363413976268198_0014.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-005 | `700015` | DRIVES NOT POWERED UP (DB2.DBX181.7) | clear | open | 3 | [120363413976268198_0008.jpg](HMI%20errors/120363413976268198_0008.jpg), [120363413976268198_0030.jpg](HMI%20errors/120363413976268198_0030.jpg), [120363413976268198_0038.jpg](HMI%20errors/120363413976268198_0038.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-006 | `700016` | TRACK STATION INDUCTOR TOUCH (DB2.DBX182.0) CHECK E0.1 (FEED HOLD Z2-AXIS, A2 AXIS & CH2 READ IN DISABLE) | clear | open | 3 | [120363413976268198_0005.jpg](HMI%20errors/120363413976268198_0005.jpg), [120363413976268198_0006.jpg](HMI%20errors/120363413976268198_0006.jpg), [120363413976268198_0035.jpg](HMI%20errors/120363413976268198_0035.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-007 | `700017` | STEM STATION INDUCTOR TOUCH (DB2.DBX182.1) CHECK E0.1 (FEED HOLD Z3-AXIS & CH3 READ IN DISABLE) | clear | open | 2 | [120363413976268198_0009.jpg](HMI%20errors/120363413976268198_0009.jpg), [120363413976268198_0051.jpg](HMI%20errors/120363413976268198_0051.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-008 | `700101` | BELL STATION C-01 CYLINDER RETRACT PROXY TIMEOUT | probable | open | 1 | [120363413976268198_0032.jpg](HMI%20errors/120363413976268198_0032.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-009 | `700103` | BELL STATION C-02 CYLINDER RETRACT PROXY TIMEOUT | probable | open | 1 | [120363413976268198_0032.jpg](HMI%20errors/120363413976268198_0032.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-010 | `700105` | BELL STATION C-03 CYLINDER RETRACT PROXY TIMEOUT | probable | open | 1 | [120363413976268198_0032.jpg](HMI%20errors/120363413976268198_0032.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-011 | `700106` | LASER MARKING SLIDE RIGHT SIDE CYCLE INTERRUPT, CHECK I12.4, I13.7, I11.6 | probable | open | 1 | [120363413976268198_0023.jpg](HMI%20errors/120363413976268198_0023.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-012 | `700107` | STEM STATION C-01 CYLINDER RETRACT PROXY TIMEOUT | probable | open | 1 | [120363413976268198_0032.jpg](HMI%20errors/120363413976268198_0032.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-013 | `700109` | STEM STATION C-02 CYLINDER RETRACT PROXY TIMEOUT | unclear | open | 1 | [120363413976268198_0032.jpg](HMI%20errors/120363413976268198_0032.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-014 | `700110` | LOADING SEQUENCE IS NOT INITIALISED (DB2.DBX189.2), CYCLE START DISABLE | unclear | open | 1 | [120363413976268198_0018.jpg](HMI%20errors/120363413976268198_0018.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-015 | `700111` | STEM STATION C-02 CYLINDER RETRACT PROXY TIMEOUT | unclear | open | 1 | [120363413976268198_0032.jpg](HMI%20errors/120363413976268198_0032.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-016 | `700113` | LOADING CONVEYOR SEPARATOR RETRACT PROXY TIMEOUT | clear | open | 1 | [120363413976268198_0032.jpg](HMI%20errors/120363413976268198_0032.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-017 | `700120` | LASER MARKING GRIPPER OPEN PROXY TIMEOUT (DB2.DBX190.4) CHECK E12.0 | probable | open | 1 | [120363413976268198_0002.jpg](HMI%20errors/120363413976268198_0002.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-018 | `700129` | PROXY TIMEOUT - CYLINDER RETRACT | probable | open | 1 | [120363413976268198_0032.jpg](HMI%20errors/120363413976268198_0032.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-019 | `700207` | LASER UNIT NOT READY, CYCLE START DISABLE (& EMPTY CYCLE START) | clear | open | 4 | [120363413976268198_0009.jpg](HMI%20errors/120363413976268198_0009.jpg), [120363413976268198_0033.jpg](HMI%20errors/120363413976268198_0033.jpg), [120363413976268198_0035.jpg](HMI%20errors/120363413976268198_0035.jpg), [120363413976268198_0051.jpg](HMI%20errors/120363413976268198_0051.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-020 | `700210` | LASER MARKING GRIPPER CYLINDER ADVANCE FEEDBACK TIMEOUT (DB2.DBX197.2) CHECK E12.5 (EMPTY CYCLE START) | probable | open | 1 | [120363413976268198_0036.jpg](HMI%20errors/120363413976268198_0036.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-021 | `700212` | STEM ADDITIONAL FLOW NOT ATTAINED (DB2.DBX197.4) | clear | open | 3 | [120363413976268198_0002.jpg](HMI%20errors/120363413976268198_0002.jpg), [120363413976268198_0003.jpg](HMI%20errors/120363413976268198_0003.jpg), [120363413976268198_0025.jpg](HMI%20errors/120363413976268198_0025.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-022 | `700219` | JOB HEIGHT NOT WITHIN RANGE, JOB REJECTED | probable | open | 1 | [120363413976268198_0048.jpg](HMI%20errors/120363413976268198_0048.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-023 | `700304` | ORIENTATION CYLINDER RISE TIME OUT AFTER 2ND ATTEMPT, CHECK I15.2 (EMPTY CYCLE START & CH1 CYCLE STOP) | probable | open | 1 | [120363413976268198_0017.jpg](HMI%20errors/120363413976268198_0017.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-024 | `700306` | _(text not recovered)_ | unclear | open | 3 | [120363413976268198_0010.jpg](HMI%20errors/120363413976268198_0010.jpg), [120363413976268198_0023.jpg](HMI%20errors/120363413976268198_0023.jpg), [120363413976268198_0028.jpg](HMI%20errors/120363413976268198_0028.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-025 | `700313` | UNLOADING CONVEYOR JOB PUSHER RETRACT FEEDBACK TIMEOUT (DB2.DBX205.5) CHECK E19.5 (CH3 CYCLE STOP) | probable | open | 1 | [120363413976268198_0001.jpg](HMI%20errors/120363413976268198_0001.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-026 | `700327` | UNLOADING CONVEYOR MOTOR MPU TRIP (DB2.DBX207.3) CHECK E7.1 | clear | open | 2 | [120363413976268198_0008.jpg](HMI%20errors/120363413976268198_0008.jpg), [120363413976268198_0038.jpg](HMI%20errors/120363413976268198_0038.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-027 | `700328` | INDUCONTROL GROUP NOT OK 1 | clear | open | 2 | [120363413976268198_0001.jpg](HMI%20errors/120363413976268198_0001.jpg), [120363413976268198_0029.jpg](HMI%20errors/120363413976268198_0029.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-028 | `700329` | INDUCONTROL GROUP NOT OK 2 | clear | open | 4 | [120363413976268198_0002.jpg](HMI%20errors/120363413976268198_0002.jpg), [120363413976268198_0003.jpg](HMI%20errors/120363413976268198_0003.jpg), [120363413976268198_0023.jpg](HMI%20errors/120363413976268198_0023.jpg), [120363413976268198_0028.jpg](HMI%20errors/120363413976268198_0028.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-029 | `700330` | INDUCONTROL GROUP NOT OK 3 | probable | open | 1 | [120363413976268198_0029.jpg](HMI%20errors/120363413976268198_0029.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-030 | `700332` | _(text not recovered)_ | unclear | open | 1 | [120363413976268198_0045.jpg](HMI%20errors/120363413976268198_0045.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-031 | `700402` | WITH HEAT IS SELECTED, BUT PUMPS ARE OFF - PRESS ALL PUMP ON (DB2.DBX212.2) E8.5 | clear | open | 4 | [120363413976268198_0007.jpg](HMI%20errors/120363413976268198_0007.jpg), [120363413976268198_0008.jpg](HMI%20errors/120363413976268198_0008.jpg), [120363413976268198_0025.jpg](HMI%20errors/120363413976268198_0025.jpg), [120363413976268198_0030.jpg](HMI%20errors/120363413976268198_0030.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-032 | `700403` | 2D SCANNER READING ERROR, CURRENT JOB IS BEING REJECTED (DB2.DBX212.3) | probable | open | 1 | [120363413976268198_0025.jpg](HMI%20errors/120363413976268198_0025.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-033 | `700408` | Z1, Z2 & Z3 AXES FEEDHOLD AS THE A1 AXIS IS NOT IN THE SAFE POSITION | probable | open | 1 | [120363413976268198_0007.jpg](HMI%20errors/120363413976268198_0007.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-034 | `700409` | A1-AXIS FEEDHOLD AS THE Z2-AXIS IS NOT IN THE SAFE POSITION | probable | open | 1 | [120363413976268198_0007.jpg](HMI%20errors/120363413976268198_0007.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-035 | `700410` | A1-AXIS FEEDHOLD AS THE Z-AXIS IS NOT IN THE SAFE POSITION | probable | open | 1 | [120363413976268198_0026.jpg](HMI%20errors/120363413976268198_0026.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-036 | `700411` | A1 & A2-AXES FEEDHOLD AS THE Z1-AXIS IS NOT IN THE SAFE POSITION | probable | open | 1 | [120363413976268198_0007.jpg](HMI%20errors/120363413976268198_0007.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-037 | `700415` | BELL STATION TAILSTOCK LOWER ACTIVE, A1-AXIS CAN NOT BE MOVED | probable | open | 1 | [120363413976268198_0007.jpg](HMI%20errors/120363413976268198_0007.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-038 | `700416` | STEM STATION TAILSTOCK LOWER ACTIVE, A1-AXIS CAN NOT BE MOVED | probable | open | 1 | [120363413976268198_0026.jpg](HMI%20errors/120363413976268198_0026.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-039 | `700423` | A2-AXIS WAITING FOR PREVIOUS UNLOADING SEQUENCE TO BE COMPLETED | probable | open | 1 | [120363413976268198_0026.jpg](HMI%20errors/120363413976268198_0026.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-040 | `700424` | TRACEABILITY HANDSHAKING ERROR, CHECK THE TRACEABILITY NETWORK | clear | open | 3 | [120363413976268198_0013.jpg](HMI%20errors/120363413976268198_0013.jpg), [120363413976268198_0014.jpg](HMI%20errors/120363413976268198_0014.jpg), [120363413976268198_0026.jpg](HMI%20errors/120363413976268198_0026.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-041 | `700425` | TRACEABILITY PERMISSION STATUS MISMATCH, PERMISSION NOT OK TO RUN | clear | open | 1 | [120363413976268198_0032.jpg](HMI%20errors/120363413976268198_0032.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-042 | `700429` | WITH HEAT IS SELECTED, BUT DC IS OFF - CONVERTER RDY TO CONTROL FBK MISSING (DB2.DBX215.5) CHECK E0.6 | clear | open | 3 | [120363413976268198_0008.jpg](HMI%20errors/120363413976268198_0008.jpg), [120363413976268198_0026.jpg](HMI%20errors/120363413976268198_0026.jpg), [120363413976268198_0030.jpg](HMI%20errors/120363413976268198_0030.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-043 | `700431` | TRACK HEAT SELECTED BUT TRACK STN DC IS OFF OR TRACK CONVERTER READY TO CONTROL FEEDBACK IS MISSING, CYCLE START DISABLE | probable | open | 2 | [120363413976268198_0026.jpg](HMI%20errors/120363413976268198_0026.jpg), [120363413976268198_0037.jpg](HMI%20errors/120363413976268198_0037.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-044 | `700509` | INITIALIZATION NOT DONE FOR AUTO CYCLE, PRESS AUTO INITIALIZE KEY IN MANUAL MODE: CYCLE START DISABLE (DB2.DBX221.1) | clear | open | 6 | [120363413976268198_0002.jpg](HMI%20errors/120363413976268198_0002.jpg), [120363413976268198_0007.jpg](HMI%20errors/120363413976268198_0007.jpg), [120363413976268198_0011.jpg](HMI%20errors/120363413976268198_0011.jpg), [120363413976268198_0013.jpg](HMI%20errors/120363413976268198_0013.jpg), [120363413976268198_0014.jpg](HMI%20errors/120363413976268198_0014.jpg), [120363413976268198_0025.jpg](HMI%20errors/120363413976268198_0025.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-045 | `700510` | MANUAL MODE SELECTED, CYCLE START DISABLE | clear | open | 1 | [120363413976268198_0032.jpg](HMI%20errors/120363413976268198_0032.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-046 | `700519` | READ IN DISABLE AT STEM STATION WAITING FOR BELL HEAT COMPLETE | probable | open | 1 | [120363413976268198_0007.jpg](HMI%20errors/120363413976268198_0007.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-047 | `700520` | READ IN DISABLE AT BELL STATION WAITING FOR A1 AXIS INDEXING | clear | open | 4 | [120363413976268198_0007.jpg](HMI%20errors/120363413976268198_0007.jpg), [120363413976268198_0011.jpg](HMI%20errors/120363413976268198_0011.jpg), [120363413976268198_0013.jpg](HMI%20errors/120363413976268198_0013.jpg), [120363413976268198_0014.jpg](HMI%20errors/120363413976268198_0014.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-048 | `700523` | READ IN DISABLE AT STEM STATION WAITING FOR INDEXING AT STEM | clear | open | 3 | [120363413976268198_0007.jpg](HMI%20errors/120363413976268198_0007.jpg), [120363413976268198_0011.jpg](HMI%20errors/120363413976268198_0011.jpg), [120363413976268198_0013.jpg](HMI%20errors/120363413976268198_0013.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-049 | `700527` | CYCLE ACTIVATED | probable | open | 1 | [120363413976268198_0026.jpg](HMI%20errors/120363413976268198_0026.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-050 | `700529` | JOB NOT CLAMP AT STEM STATION | probable | open | 1 | [120363413976268198_0003.jpg](HMI%20errors/120363413976268198_0003.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-051 | `700601` | WAIT FOR JOB ABSENCE AT LOADING CONVEYOR | clear | open | 3 | [120363413976268198_0002.jpg](HMI%20errors/120363413976268198_0002.jpg), [120363413976268198_0003.jpg](HMI%20errors/120363413976268198_0003.jpg), [120363413976268198_0030.jpg](HMI%20errors/120363413976268198_0030.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-052 | `700603` | WAIT FOR ABSENCE AT LOADING/UNLOADING STN AFTER HEATING | clear | open | 5 | [120363413976268198_0002.jpg](HMI%20errors/120363413976268198_0002.jpg), [120363413976268198_0003.jpg](HMI%20errors/120363413976268198_0003.jpg), [120363413976268198_0007.jpg](HMI%20errors/120363413976268198_0007.jpg), [120363413976268198_0008.jpg](HMI%20errors/120363413976268198_0008.jpg), [120363413976268198_0030.jpg](HMI%20errors/120363413976268198_0030.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-053 | `700615` | PAPER BAND FILTER ROTATION FEEDBACK MISSING (DB2.DBX229.7) CHECK E9.5 | clear | open | 2 | [120363413976268198_0002.jpg](HMI%20errors/120363413976268198_0002.jpg), [120363413976268198_0008.jpg](HMI%20errors/120363413976268198_0008.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-054 | `700618` | LASER UNIT NOT READY, CHECK I51.0 & I51.6; CYCLE START DISABLE | probable | open | 1 | [120363413976268198_0025.jpg](HMI%20errors/120363413976268198_0025.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-055 | `700623` | LASER MARKING COMPLETE FEEDBACK MISSING, CHECK I56.7, CYCLE START DISABLED | probable | open | 1 | [120363413976268198_0025.jpg](HMI%20errors/120363413976268198_0025.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-056 | `700709` | STEM TAILSTOCK C-09 RAISE/LOWER REEDSWITCH SHORT, BOTH THE REEDSWITCH | probable | open | 1 | [120363413976268198_0043.jpg](HMI%20errors/120363413976268198_0043.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-057 | `700721` | DRIVE NOT POWERED UP | probable | open | 6 | [120363413976268198_0009.jpg](HMI%20errors/120363413976268198_0009.jpg), [120363413976268198_0033.jpg](HMI%20errors/120363413976268198_0033.jpg), [120363413976268198_0035.jpg](HMI%20errors/120363413976268198_0035.jpg), [120363413976268198_0037.jpg](HMI%20errors/120363413976268198_0037.jpg), [120363413976268198_0048.jpg](HMI%20errors/120363413976268198_0048.jpg), [120363413976268198_0051.jpg](HMI%20errors/120363413976268198_0051.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-058 | `700722` | PROBLEM WITH PRESSURE PLATE LVDT, PLEASE CHECK THE ANALOG SENSOR | clear | open | 4 | [120363413976268198_0005.jpg](HMI%20errors/120363413976268198_0005.jpg), [120363413976268198_0006.jpg](HMI%20errors/120363413976268198_0006.jpg), [120363413976268198_0023.jpg](HMI%20errors/120363413976268198_0023.jpg), [120363413976268198_0031.jpg](HMI%20errors/120363413976268198_0031.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-059 | `700723` | PRESSURE PLATE JOB HEIGHT NOT WITHIN RANGE (DB2.DBX238.7) | clear | open | 4 | [120363413976268198_0009.jpg](HMI%20errors/120363413976268198_0009.jpg), [120363413976268198_0017.jpg](HMI%20errors/120363413976268198_0017.jpg), [120363413976268198_0033.jpg](HMI%20errors/120363413976268198_0033.jpg), [120363413976268198_0051.jpg](HMI%20errors/120363413976268198_0051.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-060 | `700725` | DC OFF DURING AUTO CYCLE RUNNING, CONVERTER READY FEEDBACK MISSING (DB2.DBX239.1) STOP AND CALL MAINTENANCE | probable | open | 1 | [120363413976268198_0029.jpg](HMI%20errors/120363413976268198_0029.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-061 | `700727` | STEM STN DC IS OFF OR STEM CONVERTER READY TO CONTROL FEEDBACK IS MISSING, CYCLE START DISABLE | clear | open | 1 | [120363413976268198_0037.jpg](HMI%20errors/120363413976268198_0037.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-062 | `700804` | LOADING SEQUENCE IS NOT INITIALISED (DB2.DBX189.2), PRESS INITIALISED KEY ON MCP, CYCLE START DISABLE | probable | open | 1 | [120363413976268198_0018.jpg](HMI%20errors/120363413976268198_0018.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-063 | `700807` | QUENCH TEMPERATURE LOW LIMIT REACHED | probable | open | 1 | [120363413976268198_0034.jpg](HMI%20errors/120363413976268198_0034.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-064 | `700815` | LUBRICATION SENSOR FEEDBACK MISSING (DB2.DBX245.7) CHECK E19.1 | probable | open | 1 | [120363413976268198_0030.jpg](HMI%20errors/120363413976268198_0030.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-065 | `700817` | I-M ENABLE PREVIOUS CODE PRESENT, JOB REJECTED | clear | open | 4 | [120363413976268198_0002.jpg](HMI%20errors/120363413976268198_0002.jpg), [120363413976268198_0008.jpg](HMI%20errors/120363413976268198_0008.jpg), [120363413976268198_0025.jpg](HMI%20errors/120363413976268198_0025.jpg), [120363413976268198_0030.jpg](HMI%20errors/120363413976268198_0030.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-066 | `700819` | TRACK HAND GRIPPER OPEN/CLOSE BOTH PROXY FEEDBACK SENSE (DB2.DBX246.3) | probable | open | 1 | [120363413976268198_0048.jpg](HMI%20errors/120363413976268198_0048.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-067 | `700826` | BRIX % OUT OF RANGE 3-3.5 | clear | open | 11 | [120363413976268198_0001.jpg](HMI%20errors/120363413976268198_0001.jpg), [120363413976268198_0003.jpg](HMI%20errors/120363413976268198_0003.jpg), [120363413976268198_0005.jpg](HMI%20errors/120363413976268198_0005.jpg), [120363413976268198_0006.jpg](HMI%20errors/120363413976268198_0006.jpg), [120363413976268198_0008.jpg](HMI%20errors/120363413976268198_0008.jpg), [120363413976268198_0018.jpg](HMI%20errors/120363413976268198_0018.jpg), [120363413976268198_0023.jpg](HMI%20errors/120363413976268198_0023.jpg), [120363413976268198_0028.jpg](HMI%20errors/120363413976268198_0028.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-068 | `700828` | INDUCONTROL NOT READY FOR ACQUISITION, CYCLE START DISABLED | clear | open | 6 | [120363413976268198_0001.jpg](HMI%20errors/120363413976268198_0001.jpg), [120363413976268198_0023.jpg](HMI%20errors/120363413976268198_0023.jpg), [120363413976268198_0025.jpg](HMI%20errors/120363413976268198_0025.jpg), [120363413976268198_0028.jpg](HMI%20errors/120363413976268198_0028.jpg), [120363413976268198_0029.jpg](HMI%20errors/120363413976268198_0029.jpg), [120363413976268198_0035.jpg](HMI%20errors/120363413976268198_0035.jpg) | `photographic` · medium · unverified · 2026-10-17 |
| HMI-069 | `700920` | DM HIGH LEVEL TEMPERATURE REACH ALARM (CYCLE START DISABLE & CYCLE STOP) | probable | open | 1 | [120363413976268198_0018.jpg](HMI%20errors/120363413976268198_0018.jpg) | `photographic` · low · unverified · 2026-10-17 |
| HMI-070 | `700923` | INDUCONTROL NOT OK GROUP 1, CONVERTER OFF DURING PROGRAM CYCLE RUNNING | probable | open | 1 | [120363413976268198_0026.jpg](HMI%20errors/120363413976268198_0026.jpg) | `photographic` · low · unverified · 2026-10-17 |

## Entries

### HMI-001 — alarm 3000

- **text:** Emergency stop
- **pairing:** clear · **fix status:** open · seen on ~4 of 53 screens
- **notes:** Standard SINUMERIK safety alarm; read next to its own row on 4 screens.
- **source screens:** `120363413976268198_0008.jpg`, `120363413976268198_0030.jpg`, `120363413976268198_0036.jpg`, `120363413976268198_0038.jpg`

### HMI-002 — alarm 25201

- **text:** Axis Z1 drive fault
- **pairing:** clear · **fix status:** open · seen on ~2 of 53 screens
- **notes:** Drive/axis alarm screen (0037) lists this with 26101 in a two-row list.
- **source screens:** `120363413976268198_0027.jpg`, `120363413976268198_0037.jpg`

### HMI-003 — alarm 26101

- **text:** Axis A1 drive communication failure
- **pairing:** clear · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Same screen as 25201 (0037).
- **source screens:** `120363413976268198_0037.jpg`

### HMI-004 — alarm 400262

- **text:** Failure of handheld unit
- **pairing:** clear · **fix status:** open · seen on ~22 of 53 screens
- **notes:** Recurs on 21 of the 53 screens (last row before the button bar on most). A standing condition (handheld unit not connected) is plausible but cannot be confirmed from photos alone.
- **source screens:** `120363413976268198_0001.jpg`, `120363413976268198_0002.jpg`, `120363413976268198_0003.jpg`, `120363413976268198_0009.jpg`, `120363413976268198_0010.jpg`, `120363413976268198_0011.jpg`, `120363413976268198_0013.jpg`, `120363413976268198_0014.jpg` (14 more not listed)

### HMI-005 — alarm 700015

- **text:** DRIVES NOT POWERED UP (DB2.DBX181.7)
- **pairing:** clear · **fix status:** open · seen on ~3 of 53 screens
- **notes:** Aligned on 3 screens (0008, 0030, 0038).
- **source screens:** `120363413976268198_0008.jpg`, `120363413976268198_0030.jpg`, `120363413976268198_0038.jpg`

### HMI-006 — alarm 700016

- **text:** TRACK STATION INDUCTOR TOUCH (DB2.DBX182.0) CHECK E0.1 (FEED HOLD Z2-AXIS, A2 AXIS & CH2 READ IN DISABLE)
- **pairing:** clear · **fix status:** open · seen on ~3 of 53 screens
- **notes:** Aligned on 3 screens. OCR reads the axis as '22-AXIS'; Z2 assumed from the sibling 700017 text.
- **source screens:** `120363413976268198_0005.jpg`, `120363413976268198_0006.jpg`, `120363413976268198_0035.jpg`

### HMI-007 — alarm 700017

- **text:** STEM STATION INDUCTOR TOUCH (DB2.DBX182.1) CHECK E0.1 (FEED HOLD Z3-AXIS & CH3 READ IN DISABLE)
- **pairing:** clear · **fix status:** open · seen on ~2 of 53 screens
- **notes:** Aligned on 2 screens (0009, 0051).
- **source screens:** `120363413976268198_0009.jpg`, `120363413976268198_0051.jpg`

### HMI-008 — alarm 700101

- **text:** BELL STATION C-01 CYLINDER RETRACT PROXY TIMEOUT
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Cylinder-proxy screen (0032) lists 700101..700111 against six cylinder texts in reverse order; the per-code cylinder index is not confirmed.
- **source screens:** `120363413976268198_0032.jpg`

### HMI-009 — alarm 700103

- **text:** BELL STATION C-02 CYLINDER RETRACT PROXY TIMEOUT
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Same screen as 700101/700105; index not confirmed.
- **source screens:** `120363413976268198_0032.jpg`

### HMI-010 — alarm 700105

- **text:** BELL STATION C-03 CYLINDER RETRACT PROXY TIMEOUT
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Same screen as 700101/700103; index not confirmed.
- **source screens:** `120363413976268198_0032.jpg`

### HMI-011 — alarm 700106

- **text:** LASER MARKING SLIDE RIGHT SIDE CYCLE INTERRUPT, CHECK I12.4, I13.7, I11.6
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0023 (6 codes / 6 texts, positional).
- **source screens:** `120363413976268198_0023.jpg`

### HMI-012 — alarm 700107

- **text:** STEM STATION C-01 CYLINDER RETRACT PROXY TIMEOUT
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Same cylinder-proxy screen (0032); index not confirmed.
- **source screens:** `120363413976268198_0032.jpg`

### HMI-013 — alarm 700109

- **text:** STEM STATION C-02 CYLINDER RETRACT PROXY TIMEOUT
- **pairing:** unclear · **fix status:** open · seen on ~1 of 53 screens
- **notes:** On the cylinder-proxy screen (0032) this code lines up with a text whose cylinder index the OCR lost ("PROXY STEM STATION C- TIMEOUT"). C-02 is a guess from the sequence, not a reading. Code/text pairing unclear - the OCR melted the number and text columns on the screen. The verbatim OCR of all 53 screens is kept in docs/HMI errors/ocr-2026-10-17.txt so the pairing can be re-checked by eye.
- **source screens:** `120363413976268198_0032.jpg`

### HMI-014 — alarm 700110

- **text:** LOADING SEQUENCE IS NOT INITIALISED (DB2.DBX189.2), CYCLE START DISABLE
- **pairing:** unclear · **fix status:** open · seen on ~1 of 53 screens
- **candidate texts preserved (NOT merged):**
  - LOADING SEQUENCE IS NOT INITIALISED (DB2.DBX189.2), CYCLE START DISABLE
  - LOADING SEQUENCE IS NOT INITIALISED (DB2.DBX189.2) CYCLE START DISABLE, PRESS INITIALISED KEY ON MCP
- **notes:** 0018 shows 700804 and 700110 with what appears to be the same text; the two codes cannot be told apart in the OCR. Code/text pairing unclear - the OCR melted the number and text columns on the screen. The verbatim OCR of all 53 screens is kept in docs/HMI errors/ocr-2026-10-17.txt so the pairing can be re-checked by eye.
- **source screens:** `120363413976268198_0018.jpg`

### HMI-015 — alarm 700111

- **text:** STEM STATION C-02 CYLINDER RETRACT PROXY TIMEOUT
- **pairing:** unclear · **fix status:** open · seen on ~1 of 53 screens
- **candidate texts preserved (NOT merged):**
  - STEM STATION C-02 CYLINDER RETRACT PROXY TIMEOUT
  - STEM STATION C-0? CYLINDER RETRACT PROXY TIMEOUT
- **notes:** On the cylinder-proxy screen (0032) this code lines up with a STEM cylinder text whose index the OCR lost; conflicts with 700109. Index not confirmed. Code/text pairing unclear - the OCR melted the number and text columns on the screen. The verbatim OCR of all 53 screens is kept in docs/HMI errors/ocr-2026-10-17.txt so the pairing can be re-checked by eye.
- **source screens:** `120363413976268198_0032.jpg`

### HMI-016 — alarm 700113

- **text:** LOADING CONVEYOR SEPARATOR RETRACT PROXY TIMEOUT
- **pairing:** clear · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Aligned on 0032 (first row). 0019 shows the separate ADVANCE REED SWITCH TIME OUT (DB2.DBX189.4) CHECK E11.2 variant for a code the OCR did not capture.
- **source screens:** `120363413976268198_0032.jpg`

### HMI-017 — alarm 700120

- **text:** LASER MARKING GRIPPER OPEN PROXY TIMEOUT (DB2.DBX190.4) CHECK E12.0
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0002 (9 codes / 9 texts, positional); not seen on a second screen.
- **source screens:** `120363413976268198_0002.jpg`

### HMI-018 — alarm 700129

- **text:** PROXY TIMEOUT - CYLINDER RETRACT
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Aligned on 0032; the text does not name the cylinder.
- **source screens:** `120363413976268198_0032.jpg`

### HMI-019 — alarm 700207

- **text:** LASER UNIT NOT READY, CYCLE START DISABLE (& EMPTY CYCLE START)
- **pairing:** clear · **fix status:** open · seen on ~4 of 53 screens
- **notes:** Aligned on 4 screens (0009, 0033, 0035, 0051).
- **source screens:** `120363413976268198_0009.jpg`, `120363413976268198_0033.jpg`, `120363413976268198_0035.jpg`, `120363413976268198_0051.jpg`

### HMI-020 — alarm 700210

- **text:** LASER MARKING GRIPPER CYLINDER ADVANCE FEEDBACK TIMEOUT (DB2.DBX197.2) CHECK E12.5 (EMPTY CYCLE START)
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0036 (positional, 5 codes / 5 texts).
- **source screens:** `120363413976268198_0036.jpg`

### HMI-021 — alarm 700212

- **text:** STEM ADDITIONAL FLOW NOT ATTAINED (DB2.DBX197.4)
- **pairing:** clear · **fix status:** open · seen on ~3 of 53 screens
- **notes:** Aligned on 3 screens (0002, 0003, 0025).
- **source screens:** `120363413976268198_0002.jpg`, `120363413976268198_0003.jpg`, `120363413976268198_0025.jpg`

### HMI-022 — alarm 700219

- **text:** JOB HEIGHT NOT WITHIN RANGE, JOB REJECTED
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0048 (positional, 4 codes).
- **source screens:** `120363413976268198_0048.jpg`

### HMI-023 — alarm 700304

- **text:** ORIENTATION CYLINDER RISE TIME OUT AFTER 2ND ATTEMPT, CHECK I15.2 (EMPTY CYCLE START & CH1 CYCLE STOP)
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0017 (positional, 3 codes / 3 texts).
- **source screens:** `120363413976268198_0017.jpg`

### HMI-024 — alarm 700306

- **text:** _(text not recovered from the photographs)_
- **pairing:** unclear · **fix status:** open · seen on ~3 of 53 screens
- **candidate texts preserved (NOT merged):**
  - QUENCH WATER LEVEL OVER FLOW FEEDBACK SIGNAL DETECTED (machine ready signal withdrawn after the current cycle)
  - ORIENTATION CYLINDER ADVANCE FEEDBACK TIMEOUT (DB2.DBX204.6) CHECK E15.0
- **notes:** TWO CONFLICTING TEXTS PRESERVED: the detail pane on 0010 shows '700306: QUENCH WATER LEVEL OVER FLOW - FEEDBACK SIGNAL DETECTED. MACHINE READY SIGNAL WILL BE WITHDRAWN AFTER CURRENT CYCLE COMPLETION IN CASE IF CYCLE IS ACTIVE', while the list screens 0023 and 0028 pair 700306 with 'ORIENTATION CYLINDER ADVANCE FEEDBACK TIMEOUT (DB2.DBX204.6) CHECK E15.0'. Not merged - needs the controlled alarm list. Code/text pairing unclear - the OCR melted the number and text columns on the screen. The verbatim OCR of all 53 screens is kept in docs/HMI errors/ocr-2026-10-17.txt so the pairing can be re-checked by eye.
- **source screens:** `120363413976268198_0010.jpg`, `120363413976268198_0023.jpg`, `120363413976268198_0028.jpg`

### HMI-025 — alarm 700313

- **text:** UNLOADING CONVEYOR JOB PUSHER RETRACT FEEDBACK TIMEOUT (DB2.DBX205.5) CHECK E19.5 (CH3 CYCLE STOP)
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0001 only (5 codes / 5 texts, positional).
- **source screens:** `120363413976268198_0001.jpg`

### HMI-026 — alarm 700327

- **text:** UNLOADING CONVEYOR MOTOR MPU TRIP (DB2.DBX207.3) CHECK E7.1
- **pairing:** clear · **fix status:** open · seen on ~2 of 53 screens
- **notes:** Aligned on 0008 and 0038; the OCR reads CHECK E11/E0.1 on 0030 for the same code.
- **source screens:** `120363413976268198_0008.jpg`, `120363413976268198_0038.jpg`

### HMI-027 — alarm 700328

- **text:** INDUCONTROL GROUP NOT OK 1
- **pairing:** clear · **fix status:** open · seen on ~2 of 53 screens
- **notes:** Aligned on 0001 and 0029.
- **source screens:** `120363413976268198_0001.jpg`, `120363413976268198_0029.jpg`

### HMI-028 — alarm 700329

- **text:** INDUCONTROL GROUP NOT OK 2
- **pairing:** clear · **fix status:** open · seen on ~4 of 53 screens
- **candidate texts preserved (NOT merged):**
  - INDUCONTROL GROUP NOT OK 2
  - PAPERBAND FILTER NO PAPER CONTACT (DB2.DBX207.5) CHECK E9.3
- **notes:** Aligned on 0023 and 0028. CONFLICT: the positional alignment of 0002 would give this code the text PAPERBAND FILTER NO PAPER CONTACT (DB2.DBX207.5) CHECK E9.3; both preserved, code-2 reading corroborated by two screens.
- **source screens:** `120363413976268198_0002.jpg`, `120363413976268198_0003.jpg`, `120363413976268198_0023.jpg`, `120363413976268198_0028.jpg`

### HMI-029 — alarm 700330

- **text:** INDUCONTROL GROUP NOT OK 3
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0029 (6 codes / 6 texts, positional); follows the NOT OK 1/2 pattern.
- **source screens:** `120363413976268198_0029.jpg`

### HMI-030 — alarm 700332

- **text:** _(text not recovered from the photographs)_
- **pairing:** unclear · **fix status:** open · seen on ~1 of 53 screens
- **notes:** The Raised/Cleared alarm log (0045) shows <no text available> for every row of this code - the text cannot be recovered from the photos. Code/text pairing unclear - the OCR melted the number and text columns on the screen. The verbatim OCR of all 53 screens is kept in docs/HMI errors/ocr-2026-10-17.txt so the pairing can be re-checked by eye.
- **source screens:** `120363413976268198_0045.jpg`

### HMI-031 — alarm 700402

- **text:** WITH HEAT IS SELECTED, BUT PUMPS ARE OFF - PRESS ALL PUMP ON (DB2.DBX212.2) E8.5
- **pairing:** clear · **fix status:** open · seen on ~4 of 53 screens
- **notes:** Aligned on 3 screens (0008, 0025, 0030).
- **source screens:** `120363413976268198_0007.jpg`, `120363413976268198_0008.jpg`, `120363413976268198_0025.jpg`, `120363413976268198_0030.jpg`

### HMI-032 — alarm 700403

- **text:** 2D SCANNER READING ERROR, CURRENT JOB IS BEING REJECTED (DB2.DBX212.3)
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0025 (positional), and the text also appears in the 0019 text list. 0025 has one more text than code after row 4, so the row alignment there is not guaranteed.
- **source screens:** `120363413976268198_0025.jpg`

### HMI-033 — alarm 700408

- **text:** Z1, Z2 & Z3 AXES FEEDHOLD AS THE A1 AXIS IS NOT IN THE SAFE POSITION
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0007 (positional, 10/10). The five feedhold texts (700408-700411, plus the plain Z-axis variant) are easy to swap; treat the axis letter/station in each as unconfirmed.
- **source screens:** `120363413976268198_0007.jpg`

### HMI-034 — alarm 700409

- **text:** A1-AXIS FEEDHOLD AS THE Z2-AXIS IS NOT IN THE SAFE POSITION
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Same screen as 700408. Axis/letter unconfirmed.
- **source screens:** `120363413976268198_0007.jpg`

### HMI-035 — alarm 700410

- **text:** A1-AXIS FEEDHOLD AS THE Z-AXIS IS NOT IN THE SAFE POSITION
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0026; the OCR lost the axis number (Z1/Z2/Z3 unknown).
- **source screens:** `120363413976268198_0026.jpg`

### HMI-036 — alarm 700411

- **text:** A1 & A2-AXES FEEDHOLD AS THE Z1-AXIS IS NOT IN THE SAFE POSITION
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Same screen as 700408. Axis/letter unconfirmed.
- **source screens:** `120363413976268198_0007.jpg`

### HMI-037 — alarm 700415

- **text:** BELL STATION TAILSTOCK LOWER ACTIVE, A1-AXIS CAN NOT BE MOVED
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0007.
- **source screens:** `120363413976268198_0007.jpg`

### HMI-038 — alarm 700416

- **text:** STEM STATION TAILSTOCK LOWER ACTIVE, A1-AXIS CAN NOT BE MOVED
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0026.
- **source screens:** `120363413976268198_0026.jpg`

### HMI-039 — alarm 700423

- **text:** A2-AXIS WAITING FOR PREVIOUS UNLOADING SEQUENCE TO BE COMPLETED
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0026.
- **source screens:** `120363413976268198_0026.jpg`

### HMI-040 — alarm 700424

- **text:** TRACEABILITY HANDSHAKING ERROR, CHECK THE TRACEABILITY NETWORK
- **pairing:** clear · **fix status:** open · seen on ~3 of 53 screens
- **notes:** Aligned on 3 screens (0013, 0014, 0026).
- **source screens:** `120363413976268198_0013.jpg`, `120363413976268198_0014.jpg`, `120363413976268198_0026.jpg`

### HMI-041 — alarm 700425

- **text:** TRACEABILITY PERMISSION STATUS MISMATCH, PERMISSION NOT OK TO RUN
- **pairing:** clear · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Aligned on 0032 (second row).
- **source screens:** `120363413976268198_0032.jpg`

### HMI-042 — alarm 700429

- **text:** WITH HEAT IS SELECTED, BUT DC IS OFF - CONVERTER RDY TO CONTROL FBK MISSING (DB2.DBX215.5) CHECK E0.6
- **pairing:** clear · **fix status:** open · seen on ~3 of 53 screens
- **notes:** Aligned on 3 screens (0008, 0026, 0030).
- **source screens:** `120363413976268198_0008.jpg`, `120363413976268198_0026.jpg`, `120363413976268198_0030.jpg`

### HMI-043 — alarm 700431

- **text:** TRACK HEAT SELECTED BUT TRACK STN DC IS OFF OR TRACK CONVERTER READY TO CONTROL FEEDBACK IS MISSING, CYCLE START DISABLE
- **pairing:** probable · **fix status:** open · seen on ~2 of 53 screens
- **notes:** Read on 0037 (third row from the bottom); the same text is in the 0026 list.
- **source screens:** `120363413976268198_0026.jpg`, `120363413976268198_0037.jpg`

### HMI-044 — alarm 700509

- **text:** INITIALIZATION NOT DONE FOR AUTO CYCLE, PRESS AUTO INITIALIZE KEY IN MANUAL MODE: CYCLE START DISABLE (DB2.DBX221.1)
- **pairing:** clear · **fix status:** open · seen on ~6 of 53 screens
- **candidate texts preserved (NOT merged):**
  - INITIALIZATION NOT DONE FOR AUTO CYCLE, PRESS AUTO INITIALIZE KEY IN MANUAL MODE: CYCLE START DISABLE (DB2.DBX221.1)
  - LOADING & UN-LOADING CONVEYOR SEQUENCE NOT INITIALIZED, CYCLE START DISABLE
- **notes:** Aligned on 0002 and 0025. CONFLICT: the positional alignment of 0011/0013/0014 puts LOADING & UN-LOADING CONVEYOR SEQUENCE NOT INITIALIZED, CYCLE START DISABLE on this code; both preserved - the 0002/0025 reading was explicit with its DB2.DBX221.1 reference.
- **source screens:** `120363413976268198_0002.jpg`, `120363413976268198_0007.jpg`, `120363413976268198_0011.jpg`, `120363413976268198_0013.jpg`, `120363413976268198_0014.jpg`, `120363413976268198_0025.jpg`

### HMI-045 — alarm 700510

- **text:** MANUAL MODE SELECTED, CYCLE START DISABLE
- **pairing:** clear · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Aligned on 0032 (last row) and read on 0010.
- **source screens:** `120363413976268198_0032.jpg`

### HMI-046 — alarm 700519

- **text:** READ IN DISABLE AT STEM STATION WAITING FOR BELL HEAT COMPLETE
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0007 (first row).
- **source screens:** `120363413976268198_0007.jpg`

### HMI-047 — alarm 700520

- **text:** READ IN DISABLE AT BELL STATION WAITING FOR A1 AXIS INDEXING
- **pairing:** clear · **fix status:** open · seen on ~4 of 53 screens
- **notes:** Aligned on 4 screens (0007, 0011, 0013, 0014).
- **source screens:** `120363413976268198_0007.jpg`, `120363413976268198_0011.jpg`, `120363413976268198_0013.jpg`, `120363413976268198_0014.jpg`

### HMI-048 — alarm 700523

- **text:** READ IN DISABLE AT STEM STATION WAITING FOR INDEXING AT STEM
- **pairing:** clear · **fix status:** open · seen on ~3 of 53 screens
- **notes:** Aligned on 4 screens (0007, 0011, 0013).
- **source screens:** `120363413976268198_0007.jpg`, `120363413976268198_0011.jpg`, `120363413976268198_0013.jpg`

### HMI-049 — alarm 700527

- **text:** CYCLE ACTIVATED
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0026 (first row).
- **source screens:** `120363413976268198_0026.jpg`

### HMI-050 — alarm 700529

- **text:** JOB NOT CLAMP AT STEM STATION
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0003 (first row); the rest of that screen is not aligned (7 codes / 8 texts).
- **source screens:** `120363413976268198_0003.jpg`

### HMI-051 — alarm 700601

- **text:** WAIT FOR JOB ABSENCE AT LOADING CONVEYOR
- **pairing:** clear · **fix status:** open · seen on ~3 of 53 screens
- **notes:** Aligned on 3 screens (0002, 0008, 0030).
- **source screens:** `120363413976268198_0002.jpg`, `120363413976268198_0003.jpg`, `120363413976268198_0030.jpg`

### HMI-052 — alarm 700603

- **text:** WAIT FOR ABSENCE AT LOADING/UNLOADING STN AFTER HEATING
- **pairing:** clear · **fix status:** open · seen on ~5 of 53 screens
- **candidate texts preserved (NOT merged):**
  - WAIT FOR ABSENCE AT LOADING/UNLOADING STN AFTER HEATING
  - TAILSTOCK ROTATION ON BELL MISSING CHECK I17.1
- **notes:** Aligned on 3 screens (0002, 0008, 0030). CONFLICT: the positional alignment of 0007 puts TAILSTOCK ROTATION ON BELL MISSING CHECK I17.1 on this code; both preserved.
- **source screens:** `120363413976268198_0002.jpg`, `120363413976268198_0003.jpg`, `120363413976268198_0007.jpg`, `120363413976268198_0008.jpg`, `120363413976268198_0030.jpg`

### HMI-053 — alarm 700615

- **text:** PAPER BAND FILTER ROTATION FEEDBACK MISSING (DB2.DBX229.7) CHECK E9.5
- **pairing:** clear · **fix status:** open · seen on ~2 of 53 screens
- **notes:** Aligned on 3 screens (0002, 0008, 0030).
- **source screens:** `120363413976268198_0002.jpg`, `120363413976268198_0008.jpg`

### HMI-054 — alarm 700618

- **text:** LASER UNIT NOT READY, CHECK I51.0 & I51.6; CYCLE START DISABLE
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0025; text is nearly identical to 700207 - the two codes may be variants of the same interlock.
- **source screens:** `120363413976268198_0025.jpg`

### HMI-055 — alarm 700623

- **text:** LASER MARKING COMPLETE FEEDBACK MISSING, CHECK I56.7, CYCLE START DISABLED
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0025.
- **source screens:** `120363413976268198_0025.jpg`

### HMI-056 — alarm 700709

- **text:** STEM TAILSTOCK C-09 RAISE/LOWER REEDSWITCH SHORT, BOTH THE REEDSWITCH
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0043 (only alarm on screen besides 400262). The sentence is cut off by the screen frame - the photo does not show the rest.
- **source screens:** `120363413976268198_0043.jpg`

### HMI-057 — alarm 700721

- **text:** DRIVE NOT POWERED UP
- **pairing:** probable · **fix status:** open · seen on ~6 of 53 screens
- **notes:** Read on 0037 (bottom row). Note 700015 carries the "DRIVES NOT POWERED UP (DB2.DBX181.7)" text; the two may be related but are kept separate.
- **source screens:** `120363413976268198_0009.jpg`, `120363413976268198_0033.jpg`, `120363413976268198_0035.jpg`, `120363413976268198_0037.jpg`, `120363413976268198_0048.jpg`, `120363413976268198_0051.jpg`

### HMI-058 — alarm 700722

- **text:** PROBLEM WITH PRESSURE PLATE LVDT, PLEASE CHECK THE ANALOG SENSOR
- **pairing:** clear · **fix status:** open · seen on ~4 of 53 screens
- **notes:** Aligned on 4 screens (0005, 0006, 0023, 0031).
- **source screens:** `120363413976268198_0005.jpg`, `120363413976268198_0006.jpg`, `120363413976268198_0023.jpg`, `120363413976268198_0031.jpg`

### HMI-059 — alarm 700723

- **text:** PRESSURE PLATE JOB HEIGHT NOT WITHIN RANGE (DB2.DBX238.7)
- **pairing:** clear · **fix status:** open · seen on ~4 of 53 screens
- **notes:** Aligned on 4 screens (0009, 0017, 0033, 0051).
- **source screens:** `120363413976268198_0009.jpg`, `120363413976268198_0017.jpg`, `120363413976268198_0033.jpg`, `120363413976268198_0051.jpg`

### HMI-060 — alarm 700725

- **text:** DC OFF DURING AUTO CYCLE RUNNING, CONVERTER READY FEEDBACK MISSING (DB2.DBX239.1) STOP AND CALL MAINTENANCE
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0029 (positional, 6 codes / 6 texts).
- **source screens:** `120363413976268198_0029.jpg`

### HMI-061 — alarm 700727

- **text:** STEM STN DC IS OFF OR STEM CONVERTER READY TO CONTROL FEEDBACK IS MISSING, CYCLE START DISABLE
- **pairing:** clear · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Confirmed by the 0037 detail pane, which spells out "700727: STEM ... CYCLE START DISABLE", and by the 0037 list row.
- **source screens:** `120363413976268198_0037.jpg`

### HMI-062 — alarm 700804

- **text:** LOADING SEQUENCE IS NOT INITIALISED (DB2.DBX189.2), PRESS INITIALISED KEY ON MCP, CYCLE START DISABLE
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0018 (header row of the screen). 700110 on the same screen carries a very similar text - see 700110.
- **source screens:** `120363413976268198_0018.jpg`

### HMI-063 — alarm 700807

- **text:** QUENCH TEMPERATURE LOW LIMIT REACHED
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0034 (only alarm on screen besides 400262).
- **source screens:** `120363413976268198_0034.jpg`

### HMI-064 — alarm 700815

- **text:** LUBRICATION SENSOR FEEDBACK MISSING (DB2.DBX245.7) CHECK E19.1
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0030 (positional) and the text also appears in the 0019 list.
- **source screens:** `120363413976268198_0030.jpg`

### HMI-065 — alarm 700817

- **text:** I-M ENABLE PREVIOUS CODE PRESENT, JOB REJECTED
- **pairing:** clear · **fix status:** open · seen on ~4 of 53 screens
- **notes:** Aligned on 4 screens (0002, 0008, 0025, 0030). OCR reads "LM ENABLE PRIORE CODE PRESENT JOB REJECTED"; the "I-M enable" reading follows the 0025 wording and is not certain.
- **source screens:** `120363413976268198_0002.jpg`, `120363413976268198_0008.jpg`, `120363413976268198_0025.jpg`, `120363413976268198_0030.jpg`

### HMI-066 — alarm 700819

- **text:** TRACK HAND GRIPPER OPEN/CLOSE BOTH PROXY FEEDBACK SENSE (DB2.DBX246.3)
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0048 (first row).
- **source screens:** `120363413976268198_0048.jpg`

### HMI-067 — alarm 700826

- **text:** BRIX % OUT OF RANGE 3-3.5
- **pairing:** clear · **fix status:** open · seen on ~11 of 53 screens
- **candidate texts preserved (NOT merged):**
  - BRIX % OUT OF RANGE 3-3.5
  - BRAX % OUT OF RANGE: 3 - 3.5 (PHOTO-14 / AL-001)
- **notes:** Aligned on 10 screens, the most frequent alarm after 400262. CONFLICT: the earlier extraction AL-001 from PHOTO-14 reads "BRAX % OUT OF RANGE: 3 - 3.5" for this same alarm; both preserved (see NV-017).
- **source screens:** `120363413976268198_0001.jpg`, `120363413976268198_0003.jpg`, `120363413976268198_0005.jpg`, `120363413976268198_0006.jpg`, `120363413976268198_0008.jpg`, `120363413976268198_0018.jpg`, `120363413976268198_0023.jpg`, `120363413976268198_0028.jpg` (3 more not listed)

### HMI-068 — alarm 700828

- **text:** INDUCONTROL NOT READY FOR ACQUISITION, CYCLE START DISABLED
- **pairing:** clear · **fix status:** open · seen on ~6 of 53 screens
- **notes:** Aligned on 4 screens (0001, 0023, 0028, 0029). 0035 shows the variant wording "CYCLE START DISABLED, INDUCONTROL MASTER NOT READY TO RUN".
- **source screens:** `120363413976268198_0001.jpg`, `120363413976268198_0023.jpg`, `120363413976268198_0025.jpg`, `120363413976268198_0028.jpg`, `120363413976268198_0029.jpg`, `120363413976268198_0035.jpg`

### HMI-069 — alarm 700920

- **text:** DM HIGH LEVEL TEMPERATURE REACH ALARM (CYCLE START DISABLE & CYCLE STOP)
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0018 only; the wording (and what DM stands for) is not confirmed.
- **source screens:** `120363413976268198_0018.jpg`

### HMI-070 — alarm 700923

- **text:** INDUCONTROL NOT OK GROUP 1, CONVERTER OFF DURING PROGRAM CYCLE RUNNING
- **pairing:** probable · **fix status:** open · seen on ~1 of 53 screens
- **notes:** Read on 0026 (second row).
- **source screens:** `120363413976268198_0026.jpg`
