// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import extraction from '../data/initial-extraction.json';
import needsVerification from '../data/needs-verification.json';
import reference from '../data/reference-sheet.json';
import hmi from '../data/hmi-errors.json';

const html = new Map<string, string>();

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>';
  await import('../main');
  const app = document.getElementById('app');
  if (app) html.set('initial', app.innerHTML);
});

describe('register viewer UI', () => {
  it('renders the mandatory disclaimer banner', () => {
    expect(html.get('initial')).toContain(
      'Verify against master controlled copies before operational use.'
    );
  });

  it('shows all tabs with counts', () => {
    const app = document.getElementById('app')!.innerHTML;
    expect(app).toContain(`Extraction (${extraction.items.length})`);
    expect(app).toContain(`Needs verification (${needsVerification.entries.length})`);
    expect(app).toContain(`Reference sheet (${reference.photos.length} photos)`);
    expect(app).toContain(`HMI errors (${hmi.entries.length})`);
    expect(app).toContain('Sources &amp; evidence');
  });

  it('renders the extraction register with evidence badges', () => {
    const app = document.getElementById('app')!.innerHTML;
    expect(app).toContain('EQ-001');
    expect(app).toContain('status-unverified');
    expect(app).toContain('Project_Document.pdf');
  });

  it('switches to the needs-verification tab and keeps the banner', () => {
    const btn = [...document.querySelectorAll('nav button')].find((b) =>
      b.textContent?.startsWith('Needs verification')
    ) as HTMLButtonElement;
    btn.click();
    const app = document.getElementById('app')!.innerHTML;
    expect(app).toContain('NV-001');
    expect(app).toContain('2.8 % vs 3.5-9.5 %');
    expect(app).toContain('Verify against master controlled copies before operational use.');
  });

  it('switches to the reference sheet and lists photos with match flags', () => {
    const btn = [...document.querySelectorAll('nav button')].find((b) =>
      b.textContent?.startsWith('Reference sheet')
    ) as HTMLButtonElement;
    btn.click();
    const app = document.getElementById('app')!.innerHTML;
    expect(app).toContain('PHOTO-63');
    expect(app).toContain('match-mismatch');
    expect(app).toContain('Main HMI dashboard');
    const img = document.querySelector('img.thumb') as HTMLImageElement;
    expect(img.getAttribute('src')).toContain('reference/photos/WhatsApp%20Image');
  });

  it('switches to the HMI errors tab and lists alarm codes with pairing badges', () => {
    const btn = [...document.querySelectorAll('nav button')].find((b) =>
      b.textContent?.startsWith('HMI errors')
    ) as HTMLButtonElement;
    btn.click();
    const app = document.getElementById('app')!.innerHTML;
    expect(app).toContain('700826');
    expect(app).toContain('400262');
    expect(app).toContain('pair-clear');
    expect(app).toContain('pair-unclear');
    expect(app).toContain('fix-open');
    expect(app).toContain('hmi-screens/');
    expect(app).toContain('Verify against master controlled copies before operational use.');
  });

  it('switches to sources tab', () => {
    const btn = [...document.querySelectorAll('nav button')].find((b) =>
      b.textContent?.startsWith('Sources')
    ) as HTMLButtonElement;
    btn.click();
    const app = document.getElementById('app')!.innerHTML;
    expect(app).toContain('evidence totals');
    expect(app).toContain('needs-verification');
  });
});
