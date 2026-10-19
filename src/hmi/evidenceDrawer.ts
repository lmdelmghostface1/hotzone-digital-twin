/**
 * Evidence & registers drawer (Phase 7 UI/UX rebuild, step 1).
 *
 * The former text-first tabbed viewer lives here now, behind one "Evidence"
 * button in the slim top bar. The 3D line is the whole site; this drawer keeps
 * every register reviewable without dominating the view (hotzone-rules section
 * 2: evidence metadata stays on everything and must stay accessible).
 *
 * What is IN this module (moved verbatim from the old main.ts viewer):
 *   - extraction register (evidence badges, search, kind filter)
 *   - needs-verification register
 *   - reference-sheet photo list
 *   - HMI alarm register (search, pairing filter)
 *   - sources & external research
 *
 * The Phase 4 control screens are NOT text registers; since the 3D-first
 * rebuild they open on the machines themselves (machine panels â†’ "screens")
 * or from the viewport toolbar via src/hmi/screenOverlay.ts.
 */
import extractionJson from '../data/initial-extraction.json';
import needsJson from '../data/needs-verification.json';
import referenceJson from '../data/reference-sheet.json';
import hmiJson from '../data/hmi-errors.json';
import externalJson from '../data/external-research.json';
import {
  procedures,
  proceduresMeta,
  ProcedureTracker,
  procedureById,
  procedureSession
} from '../sim/procedures';
import { drills, faultDefs, faultsMeta } from '../sim/faults';
import { learning } from '../sim/learning';
import { hmi as hmiSim } from '../sim/runtime';
import type {
  ExtractionFile,
  ExtractionItem,
  HmiFile,
  NeedsFile,
  ReferenceFile,
  ReferencePhoto
} from '../types/data';

const extraction = extractionJson as unknown as ExtractionFile;
const needs = needsJson as unknown as NeedsFile;
const reference = referenceJson as unknown as ReferenceFile;
const hmi = hmiJson as unknown as HmiFile;
const external = externalJson as unknown as {
  meta: { project: string; purpose: string; method: string; policy: string };
  entries: {
    id: string;
    title: string;
    claim: string;
    appliesTo?: string[];
    evidence: {
      sourceId: string;
      url?: string;
      page?: string;
      category: string;
      confidence: string;
      status: string;
      reviewed: string;
    };
  }[];
};

function esc(v: unknown): string {
  return String(v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

function photoUrl(file: string): string {
  return `reference/photos/${encodeURIComponent(file)}`;
}

function evidenceBadge(e: ExtractionItem['evidence']): string {
  return `<span class="badge cat-${esc(e.category)}">${esc(e.category)}</span>
    <span class="badge conf-${esc(e.confidence)}">${esc(e.confidence)}</span>
    <span class="badge status-${esc(e.status)}">${esc(e.status)}</span>
    <span class="badge src">${esc(e.sourceId)}${e.page ? ' p.' + esc(e.page) : ''} Â· ${esc(e.reviewed)}</span>`;
}

type DrawerTab = 'extraction' | 'needs' | 'photos' | 'hmi' | 'sources' | 'procedures' | 'faults' | 'learning';

export function mountEvidenceDrawer(container: HTMLElement): void {
  const state = {
    tab: 'extraction' as DrawerTab,
    query: '',
    kind: 'all',
    hmiQuery: '',
    pairing: 'all'
  };

  const kinds = [...new Set(extraction.items.map((i) => i.kind))].sort();

  function renderExtraction(): string {
    const q = state.query.trim().toLowerCase();
    const filtered = extraction.items.filter((i) => {
      if (state.kind !== 'all' && i.kind !== state.kind) return false;
      if (!q) return true;
      return `${i.id} ${i.kind} ${i.name} ${String(i.value)} ${i.notes ?? ''}`
        .toLowerCase()
        .includes(q);
    });
    const rows = filtered
      .map(
        (i) => `<tr>
        <td class="mono">${esc(i.id)}</td>
        <td>${esc(i.kind)}</td>
        <td>${esc(i.name)}</td>
        <td class="value">${esc(i.value)}${i.notes ? `<div class="notes">${esc(i.notes)}</div>` : ''}</td>
        <td class="ev">${evidenceBadge(i.evidence)}</td>
      </tr>`
      )
      .join('');
    return `<div class="controls">
      <input id="q" type="search" placeholder="Search id, name, value..." value="${esc(state.query)}" />
      <select id="kind">
        <option value="all">all kinds (${extraction.items.length})</option>
        ${kinds
          .map(
            (k) =>
              `<option value="${esc(k)}"${state.kind === k ? ' selected' : ''}>${esc(k)} (${
                extraction.items.filter((i) => i.kind === k).length
              })</option>`
          )
          .join('')}
      </select>
      <span class="count">${filtered.length} / ${extraction.items.length} items</span>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>id</th><th>kind</th><th>name</th><th>value</th><th>evidence</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">no matches</td></tr>'}</tbody>
    </table></div>`;
  }

  function renderNeeds(): string {
    const cards = needs.entries
      .map(
        (e) => `<article class="card">
        <header><span class="mono">${esc(e.id)}</span>
          <span class="badge status-${e.status === 'open' ? 'unverified' : 'verified'}">${esc(e.status)}</span>
        </header>
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.description)}</p>
        ${e.relatedItemIds?.length ? `<p class="related">related: <span class="mono">${e.relatedItemIds
          .map(esc)
          .join('</span>, <span class="mono">')}</span></p>` : ''}
        <footer class="ev">${evidenceBadge(e.evidence)}</footer>
      </article>`
      )
      .join('');
    return `<p class="policy">${esc(needs.meta.policy)}</p><div class="cards">${cards}</div>`;
  }

  function renderPhotos(): string {
    const legend = Object.entries(reference.meta.matchLegend)
      .map(([k, v]) => `<span class="badge match-${esc(k)}">${esc(k)}</span> ${esc(v)}`)
      .join('<br/>');
    const rows = reference.photos
      .map((p: ReferencePhoto) => `<tr>
      <td class="mono">${esc(p.id)}</td>
      <td><a href="${photoUrl(p.file)}" target="_blank" rel="noreferrer"><img class="thumb" loading="lazy" src="${photoUrl(
        p.file
      )}" alt="${esc(p.id)}" /></a></td>
      <td class="mono small"><a href="${photoUrl(p.file)}" target="_blank" rel="noreferrer">${esc(p.file)}</a>${
      p.camera ? `<div class="notes">${esc(p.camera)}</div>` : ''
    }${p.hidden ? `<div class="notes">hidden: ${esc(p.hidden)}</div>` : ''}</td>
      <td>${esc(p.caption)}</td>
      <td class="value">${esc(p.observed)}</td>
      <td><span class="badge match-${esc(p.match)}">${esc(p.match)}</span>
          <span class="badge review-${esc(p.review)}">${esc(p.review)}</span>
          <div class="ev-inline">${evidenceBadge(p.evidence)}</div></td>
    </tr>`)
      .join('');
    return `<div class="legend">${legend}</div>
    <p class="policy">${esc(reference.meta.reviewMethod)}</p>
    <p class="policy">${esc(reference.meta.excludedFiles)}</p>
    <div class="table-wrap"><table>
      <thead><tr><th>id</th><th>photo</th><th>file</th><th>PDF caption</th><th>observed</th><th>match / evidence</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  function renderHmi(): string {
    const q = state.hmiQuery.trim().toLowerCase();
    const filtered = hmi.entries.filter((e) => {
      if (state.pairing !== 'all' && e.pairing !== state.pairing) return false;
      if (!q) return true;
      return `${e.id} ${e.code} ${e.text} ${e.candidates.join(' ')} ${e.notes}`
        .toLowerCase()
        .includes(q);
    });
    const pairings = ['clear', 'probable', 'unclear'];
    const rows = filtered
      .map((e) => {
        const candidates =
          e.candidates.length > 1
            ? `<div class="notes">candidates (not merged): ${e.candidates.map(esc).join(' | ')}</div>`
            : '';
        const sources = e.sources
          .map(
            (s) =>
              `<a class="mono small" href="hmi-screens/${encodeURIComponent(
                s.split('/').pop() ?? ''
              )}" target="_blank" rel="noreferrer">${esc(s.split('/').pop())}</a>`
          )
          .join(', ');
        return `<tr>
        <td class="mono">${esc(e.id)}</td>
        <td class="mono"><strong>${esc(e.code)}</strong></td>
        <td class="value">${e.text ? esc(e.text) : '<em>text not recovered</em>'}${candidates}${
        e.notes ? `<div class="notes">${esc(e.notes)}</div>` : ''
      }</td>
        <td><span class="badge pair-${esc(e.pairing)}">${esc(e.pairing)}</span>
            <span class="badge fix-${esc(e.fixStatus)}">fix: ${esc(e.fixStatus)}</span></td>
        <td>${e.seenInPhotos}</td>
        <td class="small">${sources}${
        e.seenInPhotos > e.sources.length
          ? `<div class="notes">+${e.seenInPhotos - e.sources.length} more screens</div>`
          : ''
      }</td>
        <td class="ev">${evidenceBadge(e.evidence)}</td>
      </tr>`;
      })
      .join('');
    return `<div class="controls">
      <input id="hmiq" type="search" placeholder="Search id, code, text, notes..." value="${esc(state.hmiQuery)}" />
      <select id="pairing">
        <option value="all">all pairings (${hmi.entries.length})</option>
        ${pairings
          .map(
            (p) =>
              `<option value="${esc(p)}"${state.pairing === p ? ' selected' : ''}>${esc(p)} (${
                hmi.entries.filter((e) => e.pairing === p).length
              })</option>`
          )
          .join('')}
      </select>
      <span class="count">${filtered.length} / ${hmi.entries.length} alarms</span>
    </div>
    <p class="policy">${esc(hmi.meta.method)} ${esc(hmi.meta.pairingRule)}</p>
    <div class="table-wrap"><table>
      <thead><tr><th>id</th><th>alarm</th><th>text read from the screen photographs</th><th>pairing / fix</th><th>seen in</th><th>source screens</th><th>evidence</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7">no matches</td></tr>'}</tbody>
    </table></div>`;
  }

  function renderSources(): string {
    const sd = extraction.meta.sourceDoc;
    const countBy = (cat: string, list: { evidence: { category: string } }[]) =>
      list.filter((x) => x.evidence.category === cat).length;
    const categories = ['document', 'photographic', 'external', 'inference', 'assumption', 'needs-verification'];
    const all = [
      ...extraction.items.map((i) => ({ evidence: i.evidence })),
      ...needs.entries.map((e) => ({ evidence: e.evidence })),
      ...reference.photos.map((p) => ({ evidence: p.evidence })),
      ...external.entries.map((e) => ({ evidence: e.evidence }))
    ];
    const extRows = external.entries
      .map(
        (e) => `<tr>
        <td class="mono">${esc(e.id)}</td>
        <td><strong>${esc(e.title)}</strong><br/>${esc(e.claim)}</td>
        <td class="mono">${esc((e.appliesTo ?? []).join(', ') || '-')}</td>
        <td>${e.evidence.url ? `<a href="${esc(e.evidence.url)}" target="_blank" rel="noreferrer noopener">source</a>` : esc(e.evidence.sourceId)}
          <br/><span class="badge cat-external">${esc(e.evidence.category)}</span> Â· conf ${esc(e.evidence.confidence)} Â· reviewed ${esc(e.evidence.reviewed)}</td>
      </tr>`
      )
      .join('');
    return `<div class="cards">
      <article class="card"><header>source document</header>
        <table class="kv">
          <tr><th>file</th><td class="mono">${esc(sd.path)}</td></tr>
          <tr><th>pages</th><td>${sd.pages} (text ${esc(sd.textPages)}, photo appendix ${esc(sd.photoPages)})</td></tr>
          <tr><th>nature</th><td>${esc(sd.nature)}</td></tr>
          <tr><th>disclaimer</th><td>${esc(sd.disclaimer)}</td></tr>
        </table></article>
      <article class="card"><header>evidence totals (${all.length} records)</header>
        <table class="kv">${categories
          .map((c) => `<tr><th>${esc(c)}</th><td>${countBy(c, all)}</td></tr>`)
          .join('')}</table>
        <p class="notes">${esc(extraction.meta.statusRule)}</p></article>
      <article class="card"><header>value rules</header>
        <p>${esc(extraction.meta.observedValueRule)}</p>
        <p>${esc(needs.meta.policy)}</p></article>
    </div>
    <div class="cards">
      <article class="card"><header>public manufacturer research (${external.entries.length} entries, category: external)</header>
        <p class="policy">${esc(external.meta.purpose)}</p>
        <p class="policy">${esc(external.meta.method)}</p>
        <p class="policy">${esc(external.meta.policy)}</p>
        <div class="table-wrap"><table>
          <thead><tr><th>id</th><th>what the public source says</th><th>applies to</th><th>source</th></tr></thead>
          <tbody>${extRows}</tbody>
        </table></div>
      </article>
    </div>`;
  }

  const tabLabels: Record<DrawerTab, string> = {
    extraction: `Extraction (${extraction.items.length})`,
    needs: `Needs verification (${needs.entries.length})`,
    photos: `Reference sheet (${reference.photos.length} photos)`,
    hmi: `HMI errors (${hmi.entries.length})`,
    sources: 'Sources & evidence',
    procedures: `Procedures (${procedures.length})`,
    faults: `Faults & drills (${faultDefs.length})`,
    learning: 'Learning mode'
  };

  const tracker: ProcedureTracker = procedureSession;
  let fdMessage = '';
  let fdTimerMsg = '';
  let drillTimer: ReturnType<typeof setInterval> | null = null;

  /** live drill status while the faults tab is open; drills.poll() also runs
   *  in the viewport loop so a drawer-closed drill still completes */
  function updateDrillLive(): void {
    const el = {
      state: container.querySelector('[data-fdrole="state"]') as HTMLElement | null,
      elapsed: container.querySelector('[data-fdrole="elapsed"]') as HTMLElement | null,
      writes: container.querySelector('[data-fdrole="writes"]') as HTMLElement | null,
      hints: container.querySelector('[data-fdrole="hints"]') as HTMLElement | null,
      alarms: container.querySelector('[data-fdrole="alarms"]') as HTMLElement | null
    };
    const rec = drills.active();
    if (rec) {
      const t = rec.state === 'injected' ? hmiSim.t - rec.injectedAt : rec.recoveredAt - rec.injectedAt;
      el.state && (el.state.textContent = rec.state);
      el.elapsed && (el.elapsed.textContent = t.toFixed(1));
      el.writes && (el.writes.textContent = String(rec.signalWrites));
      el.hints && (el.hints.textContent = String(rec.hintsUsed));
    }
    el.alarms && (el.alarms.textContent = hmiSim.activeAlarms().map((a) => a.id).join(', ') || 'none');
  }

  function startDrillInterval(): void {
    drills.poll();
    let wasInjected = drills.active()?.state === 'injected';
    if (drillTimer !== null) return;
    drillTimer = setInterval(() => {
      if (state.tab !== 'faults' || container.hidden) return;
      drills.poll();
      const rec = drills.active();
      if (wasInjected && rec?.state !== 'injected') {
        wasInjected = false;
        const done = rec ?? drills.history()[0];
        if (done) {
          fdMessage = `${done.faultId} recovered in ${(done.recoveredAt - done.injectedAt).toFixed(1)} simulated s (alarm cleared, trigger unforced).`;
          render();
          return;
        }
      }
      if (rec) wasInjected = rec.state === 'injected';
      updateDrillLive();
    }, 500);
  }


  function renderProcedures(): string {
    const cards = procedures
      .map((proc) => {
        const prog = tracker.progress(proc.id);
        const cur = tracker.currentStep(proc.id);
        const state = tracker.stateOf(proc.id);
        const steps = proc.steps
          .map((st) => {
            const isDone = state.done.has(st.id);
            const isCur = cur?.id === st.id;
            return `<div class="pc-step${isDone ? ' pc-done' : ''}${isCur ? ' pc-cur' : ''}">
              <span class="pc-idx">${isDone ? 'âœ“' : isCur ? 'â–¶' : 'Â·'}</span>
              <div>
                <div>${esc(st.instruction)}</div>
                <div class="pc-ev">${esc(st.evidence.sourceId)}${st.evidence.page ? ' p.' + esc(st.evidence.page) : ''} Â· ${esc(st.evidence.category)} Â· ${esc(st.evidence.status)}
                  ${st.manual ? '<span class="badge status-unverified">physical action - self-certified, not verified by the simulator</span>' : ''}</div>
              </div>
              <button class="vp-btn pc-next" data-pid="${esc(proc.id)}" data-step="${esc(st.id)}" ${isDone || !isCur ? 'disabled' : ''}>${isDone ? 'done' : 'mark done'}</button>
            </div>`;
          })
          .join('');
        return `<article class="card">
          <header>
            <strong>${esc(proc.title)}</strong>
            <span class="pc-prog">${prog.done}/${prog.total} documented steps</span>
          </header>
          <p class="notes">document: ${esc(proc.documentRef)}${proc.note ? ' Â· ' + esc(proc.note) : ''}</p>
          ${proc.safetyNote ? `<p class="policy safety">âš  ${esc(proc.safetyNote)}</p>` : ''}
          ${steps}
          <div class="pc-msg" data-pmsg="${esc(proc.id)}"></div>
          <div class="pc-foot">
            <span>self-certified: ${state.selfCertified.size}</span>
            <button class="vp-btn" data-preset="${esc(proc.id)}">reset progress</button>
          </div>
        </article>`;
      })
      .join('');
    return `<p class="policy">${esc(proceduresMeta.policy)}</p>
      <p class="policy safety">âš  ${esc(proceduresMeta.safetyDisclaimer)}</p>
      <p class="notes scoring">${esc(proceduresMeta.scoring)}</p>
      ${cards}`;
  }

  function renderFaults(): string {
    const rec = drills.active();
    const hist = drills.history().slice(0, 6);
    const injectable = faultDefs.filter((f) => f.reaction.kind === 'training-scenario');
    let drillBox = `<div class="card fd-drill">
      <header><strong>guided fault drill</strong><span class="pc-prog">fault library (Phase 5)</span></header>
      <p class="policy">Drills inject the teaching fault and run on SIMULATION time (pause/step aware). Recovery happens in the 3D scene: read the alarm, open the machine panel, unforce the signal. Remedy text is a training scenario, not an official reaction plan (see each fault card).</p>
      <div class="cs-row">
        <select data-fdrole="select">
          ${injectable
            .map((f) => `<option value="${esc(f.id)}">${esc(f.label)} (${esc(f.station)})</option>`)
            .join('')}
        </select>
        <button class="vp-btn" data-fd="start">inject</button>
        <button class="vp-btn" data-fd="hint">reveal remedy step</button>
        <button class="vp-btn" data-fd="abandon">abandon</button>
      </div>
      <div class="cs-row">
        <button class="vp-btn" data-fd="start-crack">start off-line crack-event drill</button>
        <span class="cs-k">documented reaction drill - self-certified, never injected into the sim</span>
      </div>
      <div class="pc-msg" data-fdrole="msg">${esc(fdMessage)}</div>`;
    if (rec) {
      const def = faultDefs.find((f) => f.id === rec.faultId);
      const elapsed = rec.state === 'injected' ? hmiSim.t - rec.injectedAt : rec.recoveredAt - rec.injectedAt;
      drillBox += `
      <div class="fd-status">
        <span class="cs-k">fault:</span> <span class="cs-v">${esc(rec.faultId)}${def ? ' - ' + esc(def.label) : ''}</span><br/>
        <span class="cs-k">state:</span> <span class="cs-v" data-fdrole="state">${esc(rec.state)}</span><br/>
        <span class="cs-k">elapsed (sim s):</span> <span class="cs-v" data-fdrole="elapsed">${elapsed.toFixed(1)}</span><br/>
        <span class="cs-k">trigger signal writes:</span> <span class="cs-v" data-fdrole="writes">${rec.signalWrites}</span><br/>
        <span class="cs-k">hints used:</span> <span class="cs-v" data-fdrole="hints">${rec.hintsUsed}</span>
      </div>`;
      if (def?.reaction.kind === 'documented') {
        drillBox += `
      <div class="cs-row">
        <button class="vp-btn" data-fd="self-certify">self-certify documented plan executed</button>
        <span class="pc-prog">recovery by self-certification only (off-line event)</span>
      </div>`;
      }
    }
    drillBox += `
      <div class="cs-row"><span class="cs-k">active alarms:</span> <span class="cs-v" data-fdrole="alarms">${esc(
        hmiSim.activeAlarms().length === 0 ? 'none' : hmiSim.activeAlarms().map((a) => a.id).join(', ')
      )}</span></div>
    </div>`;
    const histRows = hist
      .map((r) => {
        const def = faultDefs.find((f) => f.id === r.faultId);
        const el = (r.recoveredAt - r.injectedAt).toFixed(1);
        return `<div class="fd-history-row">${esc(def?.label ?? r.faultId)} Â· recovered in ${el} sim s Â· ${r.signalWrites} related signal writes Â· ${r.hintsUsed} hints${r.selfCertified ? ' Â· self-certified' : ''}</div>`;
      })
      .join('');
    const cards = faultDefs
      .map((f) => {
        const react = f.reaction;
        let reactHtml = '';
        if (react.kind === 'documented') {
          const proc = procedureById(react.procedureId);
          reactHtml = `<p class="policy safety">documented reaction: follow the procedure "${esc(
            proc?.title ?? react.procedureId
          )}" (${esc(react.note)})</p>`;
        } else {
          reactHtml = `<p class="policy safety">${esc(react.note)}</p>
          <ol class="cs-log">${react.steps
            .map((st) => `<li><b>${esc(st.name)}</b> â€” ${esc(st.instruction)}</li>`)
            .join('')}</ol>`;
        }
        const alarmHtml = f.alarm
          ? `<table class="kv">
              <tr><th>alarm</th><td class="mono">${esc(f.alarm.id)} Â· code ${esc(f.alarm.code)}</td></tr>
              <tr><th>text</th><td class="value">${esc(f.alarm.text)} <span class="badge src">${esc(f.alarmEvidence?.sourceId ?? '')}</span></td></tr>
            </table>`
          : '<p class="notes">no HMI alarm - off-line detection per the register</p>';
        return `<article class="card">
          <header>
            <strong>${esc(f.label)}</strong>
            <span class="pc-prog">${esc(f.category)} Â· ${esc(f.station)} [drill id ${esc(f.id)}]</span>
          </header>
          <p class="notes">machine: ${esc(f.machine)}<br/>trigger: ${esc(f.trigger.via)}${f.trigger.signal ? ` â€” signal <span class="mono">${esc(f.trigger.signal)}</span> (${esc(String(f.trigger.forced))})` : ''}</p>
          <ul class="cs-log">${f.symptoms.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          ${alarmHtml}
          ${reactHtml}
        </article>`;
      })
      .join('');
    return `<p class="policy">${esc(faultsMeta.policy)}</p>${drillBox}
      <div class="card"><header><strong>drill history</strong></header>
        <p class="policy">scoring thresholds are not documented (needs-verification NV-024) - the drill history and the Learning mode tab report informational counters only.</p>
        ${histRows || '<p class="notes">no finished drills yet</p>'}
      </div>
      ${cards}`;
  }

  function renderLearning(): string {
    const s = learning.summary();
    const drillRows = drills
      .history()
      .map((r) => {
        const el = (r.state === 'injected' ? hmiSim.t - r.injectedAt : r.recoveredAt - r.injectedAt).toFixed(1);
        const kind = r.selfCertified ? 'self-certified' : r.abandoned ? 'abandoned (fault stays)' : 'recovered';
        return `<tr><td class="mono">${esc(r.faultId)}</td><td>${esc(kind)}</td><td>${el} s</td><td>${r.hintsUsed}</td><td>${r.signalWrites}</td></tr>`;
      })
      .join('');
    return `<p class="policy">Learning mode (Phase 6) reports INFORMATIONAL training counters about what you did this session on the simulated line. No pass/fail thresholds or grades: the evaluation criteria for the real line are not in the controlled sources (needs-verification NV-024). Nothing is persisted - reloading resets the session.</p>
    <div class="cards">
      <article class="card"><header><strong>session</strong><span class="pc-prog" data-learn-role="session">${esc(s.sessionLength)} (wall clock)</span></header>
        <table class="kv">
          <tr><th>procedure steps completed</th><td data-learn-role="p-ok">${s.procedures.completedSteps} (${s.procedures.selfCertifiedSteps} self-certified manual)</td></tr>
          <tr><th>procedure order blocks</th><td data-learn-role="p-block">${s.procedures.blockedAttempts} (out-of-order clicks that were refused)</td></tr>
          <tr><th>procedures started / finished</th><td data-learn-role="p-proc">${s.procedures.started} / ${s.procedures.finished} (of ${s.procedures.total} in the register)</td></tr>
          <tr><th>drills run</th><td data-learn-role="d-total">${s.drills.total} (${s.drills.recovered} recovered, ${s.drills.selfCertified} self-certified, ${s.drills.abandoned} abandoned)</td></tr>
          <tr><th>avg drill recovery</th><td data-learn-role="d-avg">${s.drills.avgElapsedSimS.toFixed(1)} simulated s / ${s.drills.hintsUsed} hints total</td></tr>
          <tr><th>faults drilled</th><td>${esc(s.drills.faultsTouched.join(', ') || 'none')}</td></tr>
        </table>
        <p class="notes">self-certification is honest handling, not validation: the simulator cannot verify manual/physical steps or the crack reaction (honesty rules). Drill timing uses simulated time, so wall-clock pauses do not show up as slow recoveries.</p>
      </article>
      <article class="card"><header><strong>sim state right now</strong></header>
        <table class="kv">
          <tr><th>forced signals</th><td class="mono" data-learn-role="forced">${esc(s.sim.forcedSignals.join(', ') || 'none')}</td></tr>
          <tr><th>active alarms</th><td class="mono" data-learn-role="alarms">${esc(s.sim.activeAlarms.join(', ') || 'none')}</td></tr>
          <tr><th>drill running</th><td class="mono" data-learn-role="running">${esc(s.sim.drillRunning ?? 'none')}</td></tr>
        </table>
        <p class="notes">forced signals while NOT in a drill are training flexibility of the class (machine panels), not violations - escalation rules are not documented.</p>
      </article>
      ${drillRows ? `<article class="card"><header><strong>this session's drills</strong></header>
        <div class="table-wrap"><table>
          <thead><tr><th>fault</th><th>result</th><th>elapsed</th><th>hints</th><th>signal writes</th></tr></thead>
          <tbody>${drillRows}</tbody>
        </table></div></article>` : ''}
    </div>
    <p class="policy">Phase 7 can add trainee profiles and persistent review; today this tab is a live read of the session.</p>`;
  }

  function contentHtml(): string {
    switch (state.tab) {
      case 'extraction': return renderExtraction();
      case 'needs': return renderNeeds();
      case 'photos': return renderPhotos();
      case 'hmi': return renderHmi();
      case 'sources': return renderSources();
      case 'procedures': return renderProcedures();
      case 'faults': return renderFaults();
      case 'learning': return renderLearning();
    }
  }

  function render(): void {
    const tabs = (Object.keys(tabLabels) as DrawerTab[])
      .map(
        (t) =>
          `<button data-tab="${t}"${state.tab === t ? ' class="active"' : ''}>${esc(tabLabels[t])}</button>`
      )
      .join('');
    container.innerHTML = `
      <header>
        <strong>Evidence &amp; registers</strong>
        <span class="ev-sub">${esc(extraction.meta.project)}</span>
        <button id="ev-close" type="button" class="vp-btn">close Ã—</button>
      </header>
      <p class="ev-disclaimer" role="alert">Verify against master controlled copies before operational use.</p>
      <nav>${tabs}</nav>
      <div id="ev-content">${contentHtml()}</div>`;

    container.querySelectorAll<HTMLButtonElement>('nav button').forEach((b) => {
      b.addEventListener('click', () => {
        const next = b.dataset.tab as DrawerTab | undefined;
        if (!next || next === state.tab) return;
        state.tab = next;
        render();
      });
    });
    container.querySelector('#ev-close')?.addEventListener('click', () => {
      container.hidden = true;
    });

    if (state.tab === 'procedures') {
      let lastMsg = '';
      container.querySelectorAll<HTMLButtonElement>('.pc-next').forEach((b) => {
        b.addEventListener('click', () => {
          const pid = b.dataset.pid ?? '';
          const sid = b.dataset.step ?? '';
          const res = tracker.completeStep(pid, sid);
          lastMsg = `${res.ok ? 'âœ” ' : 'âœ– '}${res.message}`;
          const slot = container.querySelector(`[data-pmsg="${pid}"]`);
          if (slot) slot.textContent = lastMsg;
          if (res.ok) {
            // re-render to move the â–¶ marker, but keep the message visible
            fdTimerMsg = lastMsg;
            render();
            const slot2 = container.querySelector(`[data-pmsg="${pid}"]`);
            if (slot2) slot2.textContent = lastMsg;
          }
        });
      });
      if (fdTimerMsg) {
        const msg = container.querySelector('[data-pmsg]') as HTMLElement | null;
        if (msg && !msg.textContent) msg.textContent = fdTimerMsg;
      }
      container.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) => {
        b.addEventListener('click', () => {
          tracker.reset(b.dataset.preset ?? '');
          render();
        });
      });
    }
    if (state.tab === 'faults') {
      startDrillInterval();
      container.querySelectorAll<HTMLButtonElement>('[data-fd]').forEach((b) => {
        b.addEventListener('click', () => {
          const action = b.dataset.fd;
          const rec = drills.active();
          if (action === 'start') {
            const sel = container.querySelector<HTMLSelectElement>('[data-fdrole="select"]');
            const res = drills.start(sel?.value ?? 'FAULT-LASER');
            fdMessage = res.message;
          } else if (action === 'start-crack') {
            const res = drills.start('FAULT-CRACK');
            fdMessage = res.message;
          } else if (action === 'hint') {
            const res = drills.hint();
            fdMessage = res.message;
          } else if (action === 'abandon') {
            const res = drills.abandon();
            fdMessage = res.ok ? '' : res.message;
          } else if (action === 'self-certify') {
            const res = drills.selfCertify();
            fdMessage = res.message;
            if (rec && rec.state === 'recovered') void rec;
          }
          render();
        });
      });
    }
    if (state.tab === 'extraction') {
      const q = container.querySelector('#q') as HTMLInputElement | null;
      const k = container.querySelector('#kind') as HTMLSelectElement | null;
      q?.addEventListener('input', () => {
        state.query = q.value;
        render();
        (container.querySelector('#q') as HTMLInputElement | null)?.focus();
      });
      k?.addEventListener('change', () => {
        state.kind = k.value;
        render();
      });
    }
    if (state.tab === 'hmi') {
      const hq = container.querySelector('#hmiq') as HTMLInputElement | null;
      const p = container.querySelector('#pairing') as HTMLSelectElement | null;
      hq?.addEventListener('input', () => {
        state.hmiQuery = hq.value;
        render();
        (container.querySelector('#hmiq') as HTMLInputElement | null)?.focus();
      });
      p?.addEventListener('change', () => {
        state.pairing = p.value;
        render();
      });
    }
  }

  container.hidden = true;
  render();
}
