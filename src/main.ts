import './style.css';
import extractionJson from './data/initial-extraction.json';
import needsJson from './data/needs-verification.json';
import referenceJson from './data/reference-sheet.json';
import hmiJson from './data/hmi-errors.json';
import externalJson from './data/external-research.json';
import { mountViewport } from './three/viewport';
import type {
  ExtractionFile,
  ExtractionItem,
  HmiFile,
  NeedsFile,
  ReferenceFile,
  ReferencePhoto
} from './types/data';

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

const DISCLAIMER =
  'Verify against master controlled copies before operational use.';

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
    <span class="badge src">${esc(e.sourceId)}${e.page ? ' p.' + esc(e.page) : ''} · ${esc(e.reviewed)}</span>`;
}

type TabId = 'extraction' | 'needs' | 'photos' | 'hmi' | 'model3d' | 'sources';

const qp = new URLSearchParams(window.location.search);
const startTab: TabId =
  qp.get('capture') === '1' || qp.get('pose')
    ? 'model3d'
    : (['extraction', 'needs', 'photos', 'hmi', 'model3d', 'sources'].includes(qp.get('tab') ?? '')
        ? (qp.get('tab') as TabId)
        : 'extraction');

const state = {
  tab: startTab,
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

function renderModel3d(): string {
  return `<div id="vp-host" class="vp-host"></div>`;
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
          <br/><span class="badge cat-external">${esc(e.evidence.category)}</span> · conf ${esc(e.evidence.confidence)} · reviewed ${esc(e.evidence.reviewed)}</td>
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

const renderers: Record<TabId, () => string> = {
  extraction: renderExtraction,
  needs: renderNeeds,
  photos: renderPhotos,
  hmi: renderHmi,
  model3d: renderModel3d,
  sources: renderSources
};

const tabLabels: Record<TabId, string> = {
  extraction: `Extraction (${extraction.items.length})`,
  needs: `Needs verification (${needs.entries.length})`,
  photos: `Reference sheet (${reference.photos.length} photos)`,
  hmi: `HMI errors (${hmi.entries.length})`,
  model3d: 'Hot Zone line (3D)',
  sources: 'Sources & evidence'
};

function render(): void {
  const app = document.getElementById('app');
  if (!app) throw new Error('#app missing');
  const tabs = (Object.keys(tabLabels) as TabId[])
    .map(
      (t) =>
        `<button data-tab="${t}"${state.tab === t ? ' class="active"' : ''}>${esc(tabLabels[t])}</button>`
    )
    .join('');
  app.innerHTML = `
    <header class="banner">
      <h1>Nexteer Plant 78 Hot Zone CV joint line — digital twin (training simulator, work in progress)</h1>
      <div class="disclaimer" role="alert">${esc(DISCLAIMER)}</div>
      <div class="sub">${esc(extraction.meta.project)} · checkpoint build · educational, not validated</div>
      <nav>${tabs}</nav>
    </header>
    <main id="main">${renderers[state.tab]()}</main>
    <footer class="banner foot">${esc(DISCLAIMER)} Simulation values are educational trends only.</footer>`;

  app.querySelectorAll<HTMLButtonElement>('nav button').forEach((b) => {
    b.addEventListener('click', () => {
      state.tab = b.dataset.tab as TabId;
      render();
    });
  });

  if (state.tab === 'model3d') {
    const host = document.getElementById('vp-host');
    if (host) mountViewport(host);
  }

  if (state.tab === 'extraction') {
    const q = document.getElementById('q') as HTMLInputElement | null;
    const k = document.getElementById('kind') as HTMLSelectElement | null;
    q?.addEventListener('input', () => {
      state.query = q.value;
      render();
      const q2 = document.getElementById('q') as HTMLInputElement;
      q2.focus();
      q2.setSelectionRange(q2.value.length, q2.value.length);
    });
    k?.addEventListener('change', () => {
      state.kind = k.value;
      render();
    });
  }

  if (state.tab === 'hmi') {
    const hq = document.getElementById('hmiq') as HTMLInputElement | null;
    const p = document.getElementById('pairing') as HTMLSelectElement | null;
    hq?.addEventListener('input', () => {
      state.hmiQuery = hq.value;
      render();
      const hq2 = document.getElementById('hmiq') as HTMLInputElement;
      hq2.focus();
      hq2.setSelectionRange(hq2.value.length, hq2.value.length);
    });
    p?.addEventListener('change', () => {
      state.pairing = p.value;
      render();
    });
  }
}

render();
