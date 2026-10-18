# External manufacturer research

> Regenerated from `src/data/external-research.json` by `npm run docs:generate`.
> Do not edit by hand — edit the JSON.

**Verify against master controlled copies before operational use.**

**Policy:** External entries never silently correct the plant document. Where public information contradicts a designation in the sources, the conflict is preserved and a needs-verification entry is opened (see NV-023).

**Method:** Public web search of manufacturer pages (keyence.com, keyence.eu, therelek.com, Siemens support.industry.siemens.com) on 2026-10-18. Only manufacturer-published specifications are recorded; nothing is inferred about the plant's configuration beyond what the plant document itself states.

These are PUBLIC manufacturer sources consulted on the recorded dates. They add background
on the machine classes named in the plant document and corroborate or challenge designations.
They never override the plant document, and no entry claims a generic product is the plant's
actual machine.

### EX-001 — KEYENCE SR-2000 series 1D/2D code reader - public specifications

- **claim:** Manufacturer-published specifications for the KEYENCE SR-2000 series 1D/2D code reader (the series the plant's AutoID screen names): CMOS image sensor 2048 x 1536 pixels with auto focus; reads DataMatrix (ECC200), GS1 DataMatrix, QR and other 2D codes plus major barcodes; minimum 2D resolution 0.040 mm; reading distance 100-2000 mm (SR-2000W ultra-wide variant 50-1000 mm); IP65 enclosure; 24 VDC; Ethernet 10BASE-T/100BASE-TX with TCP/IP, SNTP, FTP, BOOTP, EtherNet/IP, PROFINET, KV STUDIO, MC Protocol and OMRON PLC Link; RS-232C and USB 2.0; setup software 'AutoID Network Navigator' (SR-H8W; predecessor SR-H6W discontinued). Manufacturer capability only - this does NOT confirm the configuration or the exact main unit fitted on the plant line.
- **applies to:** EQ-006, IP-015
- **evidence:** `KEYENCE America - SR-2000 series specifications (public product page)` · https://www.keyence.com/products/barcode/barcode-readers/sr-2000/specs · external · confidence high · unverified · reviewed 2026-10-18

---

### EX-002 — SR-20AH is a KEYENCE high-resolution lens attachment, not a standalone reader model

- **claim:** On the manufacturer's SR-2000 series model list, 'SR-20AH' is the high-resolution lens attachment mounted on an SR-2000 series main unit: minimum 2D resolution 0.012 mm, reading distance 35-70 mm, field of view 26 x 19 mm at 70 mm, approx. 50 g. It is not a standalone reader model. The plant document shows 'SR-20AH' on the AutoID Network Navigator screen (PHOTO-02); the reader main unit actually fitted on the line is therefore unconfirmed (an SR-2000 series unit is consistent, because AutoID Network Navigator is that series' setup software, but is not established by any source). Logged as NV-023; the observed 'SR-20AH' designation is preserved in the register and on the 3D model nameplate, not overwritten.
- **applies to:** EQ-006, IP-015, NV-023
- **evidence:** `KEYENCE International - SR-2000 series model list (SR-20AH high-resolution lens attachment)` · https://www.keyence.eu/products/barcode/barcode-readers/sr-2000/models · external · confidence high · unverified · reviewed 2026-10-18

---

### EX-003 — Therelek Engineers (Bengaluru, India) - industrial furnace manufacturer named in the plant document

- **claim:** Therelek Engineers Pvt Ltd is a real Indian industrial furnace manufacturer headquartered in Peenya Industrial Area, Bengaluru, Karnataka, India (second unit at Avverahalli Industrial Area, Bengaluru Rural), claiming 45+ years of expertise and 5500+ furnaces delivered. Product families include continuous mesh belt furnaces/ovens and low-temperature air-circulation chamber ovens used for tempering, stress relieving, ageing and drying, with digital controls and safety interlocks. This confirms the maker named in the plant document (EQ-004, draw oven CVOR #4) exists and builds ovens of the right class; the specific draw-oven model and configuration at the plant remain unknown (NV-015 unchanged).
- **applies to:** EQ-004, NV-015
- **evidence:** `Therelek Engineers - company profile and product pages (public site, incl. /about-us)` · https://www.therelek.com/ · external · confidence high · unverified · reviewed 2026-10-18

---

### EX-004 — SINUMERIK alarm number range 700000-799999 is the machine-manufacturer user area

- **claim:** Siemens diagnostics manuals for SINUMERIK 840D / 840D sl (with SIMODRIVE 611 / SINAMICS S120) partition alarm numbers: PLC alarms and messages in 500000-899999 are configured and described by the machine manufacturer, and 700000-799999 is the user area (PLC-to-HMI activation via the DB2 bit interface; each configured bit corresponds to one user alarm number and its text). The 700xxx codes in the extracted HMI register (700207, 700219, 700327, 700403, 700807, 700920, etc.) fall inside this user area. This corroborates that the alarm texts in src/data/hmi-errors.json are machine-builder (plant-side) texts, not Siemens standard alarm texts, and that they cannot be resolved from public Siemens documentation (see NV-022).
- **applies to:** EQ-003, NV-022
- **evidence:** `Siemens - SINUMERIK 840D/840Di/810D SIMODRIVE 611 digital Diagnostics Manual (alarm number range tables)` · https://cache.industry.siemens.com/dl/files/820/34877820/att_68029/v1/DA_1106_en.pdf · p.Preface, alarm number range tables · external · confidence high · unverified · reviewed 2026-10-18

---

### EX-005 — NCU / MCP / IPC / PN-IO are standard SINUMERIK 840D sl component names

- **claim:** NCU (numerical control unit), MCP (machine control panel), IPC (industrial PC) and PN-IO (PROFINET IO on the NCU) are standard SINUMERIK 840D sl system component names in Siemens documentation. The plant IP table (IP-001 NCU CP, IP-002 MCP, IP-003/IP-004 IPC Ethernet 1/2, IP-005 NCU PN-IO, IP-012..IP-014 IO-Link 1-3) uses exactly this naming, consistent with EQ-003's 'Siemens SINUMERIK' control on the induction machine. This corroborates the component naming only; it does not identify machine models or confirm network topology beyond what the plant IP table itself states (subnet masks and gateways remain unknown and are not invented).
- **applies to:** IP-001, IP-002, IP-003, IP-004, IP-005, IP-012, IP-013, IP-014, EQ-003
- **evidence:** `Siemens - SINUMERIK 840D sl / SINAMICS S120 Diagnostics Manual and HMI sl documentation (system component naming)` · https://support.industry.siemens.com/cs/attachments/53851272/DAsl_0211_en.pdf · external · confidence high · unverified · reviewed 2026-10-18

---

### EX-006 — No public machine-builder product named 'Inducontrol' found

- **claim:** A public web search on 2026-10-18 for the HMI name 'Inducontrol' (visible on the plant's main-HMI dashboard photograph, PHOTO-02 series) found no machine-builder product, brand or product line of that name; the results surfaced induction-machine makers such as eldec (SINUMERIK-based mask-input HMI) and Inductoheat / Inductotherm Group, none publicly using 'Inducontrol'. The name therefore remains an observed plant HMI name from the photographs; the induction machine's builder is still unknown (EQ-003 notes, NV-011). A negative search result cannot prove absence; treat this as a research negative, not a plant fact.
- **applies to:** EQ-003, NV-011
- **evidence:** `Web search performed 2026-10-18 (queries on 'Inducontrol' + induction hardening HMI); no manufacturer page for the name found` · external · confidence medium · unverified · reviewed 2026-10-18

