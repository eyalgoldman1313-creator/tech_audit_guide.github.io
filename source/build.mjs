// Builds the single-file guide (dist/index.html) from content/*.json.
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PRACTICE_URL = 'https://eyalgoldman1313-creator.github.io/tech_audit_practice.github.io/';

// Chapter order follows the syllabus. accent/soft match the practice app's topic colors.
const CHAPTERS = [
  { id: 'infra', accent: '#2E7CF6', soft: '#EAF2FE' },
  { id: 'systems', accent: '#0891B2', soft: '#E4F6FA' },
  { id: 'process', accent: '#6366F1', soft: '#EEF0FE' },
  { id: 'controls', accent: '#0E9F6E', soft: '#E6F7F0' },
  { id: 'outsourcing', accent: '#0284C7', soft: '#E0F2FE' },
  { id: 'security', accent: '#E11D48', soft: '#FDEAEF' },
  { id: 'bcp', accent: '#D97706', soft: '#FDF3E3' },
  { id: 'sdlc', accent: '#7C3AED', soft: '#F3EDFD' },
  { id: 'models', accent: '#1E3A8A', soft: '#E7ECF8' },
  { id: 'caat', accent: '#0F766E', soft: '#E2F5F3' },
  { id: 'laws', accent: '#9333EA', soft: '#F5ECFE' },
  { id: 'exam', accent: '#171E33', soft: '#E7E9F1' },
];

// Navbar groups (pill nav can't hold 12 items).
const NAV = [
  { label: 'יסודות', chapters: ['infra', 'systems'] },
  { label: 'תהליך הביקורת', chapters: ['process', 'outsourcing'] },
  { label: 'בקרות', chapters: ['controls', 'models'] },
  { label: 'אבטחה והמשכיות', chapters: ['security', 'bcp'] },
  { label: 'מחזור חיים', chapters: ['sdlc'] },
  { label: 'כלים ו-AI', chapters: ['caat'] },
  { label: 'חקיקה', chapters: ['laws'] },
  { label: 'אסטרטגיית מבחן', chapters: ['exam'] },
];

marked.setOptions({ gfm: true, breaks: false });
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) => marked.parseInline(String(s ?? ''));
const block = (s) => marked.parse(String(s ?? ''));

const chapters = [];
for (const c of CHAPTERS) {
  const f = path.join(ROOT, 'content', `${c.id}.json`);
  if (!fs.existsSync(f)) { console.warn('missing chapter', c.id); continue; }
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (/^פרק\s*\d+$/.test((data.eyebrow ?? '').trim())) delete data.eyebrow;
  chapters.push({ ...c, ...data, id: c.id });
}
const chap = Object.fromEntries(chapters.map((c) => [c.id, c]));
chapters.forEach((c, i) => { c.num = i + 1; });

const caseIds = new Set();
const caseSource = {};
{
  const p = path.join(ROOT, 'content', 'cases.json');
  if (fs.existsSync(p)) JSON.parse(fs.readFileSync(p, 'utf8')).forEach((x) => { caseIds.add(x.id); caseSource[x.id] = x.source; });
}

function article(a, c) {
  const out = [];
  out.push(`<article class="standard" id="${esc(a.id)}">`);
  out.push(`<div class="standard-header"><span class="standard-code">${esc(a.code)}</span><h3>${inline(a.title)}</h3></div>`);
  if (a.purpose) out.push(`<div class="purpose"><strong>במה מדובר:</strong> ${inline(a.purpose)}</div>`);
  if (a.summary?.length) {
    out.push(`<div class="section-label">הסבר</div>`);
    a.summary.forEach((p) => out.push(`<div class="summary">${block(p)}</div>`));
  }
  const cols = [];
  if (a.concepts?.length) cols.push(['מושגים מרכזיים', a.concepts]);
  if (a.duties?.length) cols.push(['תפקיד המבקר ודגשי ביקורת', a.duties]);
  if (cols.length) {
    out.push(`<div class="${cols.length === 2 ? 'two-col' : 'one-col'}">`);
    cols.forEach(([t, items]) => out.push(`<div class="col-block"><div class="section-label">${t}</div><ul class="tight">${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></div>`));
    out.push(`</div>`);
  }
  (a.lists ?? []).forEach((l) => {
    const tag = l.ordered ? 'ol' : 'ul';
    out.push(`<div class="section-label">${inline(l.title)}</div><${tag} class="${l.ordered ? 'numbered' : 'tight'}">${l.items.map((x) => `<li>${inline(x)}</li>`).join('')}</${tag}>`);
  });
  (a.tables ?? []).forEach((t) => {
    out.push(`<div class="section-label">${inline(t.title)}</div><div class="tbl-wrap"><table class="gtable"><thead><tr>${t.headers.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((x, i) => `<td data-label="${esc(String(t.headers[i] ?? '').replace(/[*_`]/g, ''))}">${i === 0 ? `<b>${inline(x)}</b>` : inline(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
  });
  if (a.quotes?.length) {
    out.push(`<div class="section-label">ציטוטים מהמקור</div>`);
    a.quotes.forEach((q) => out.push(`<blockquote class="citation"><p>${inline(q.text)}</p><cite>${esc(q.cite)}</cite></blockquote>`));
  }
  if (a.examTip) out.push(`<div class="notes-block"><strong>🎯 דגש לבחינה</strong>${block(a.examTip)}</div>`);
  const links = [];
  const n = Math.max(a.exam?.length ?? 0, a.caseIds?.length ?? 0);
  for (let i = 0; i < n; i++) {
    const cid = a.caseIds?.[i];
    const label = a.exam?.[i] ?? caseSource[cid] ?? cid;
    links.push(cid && caseIds.has(cid) ? `<a href="${PRACTICE_URL}#/case/${esc(cid)}" target="_blank" rel="noopener">${esc(label)} ↗</a>` : `<span>${esc(label)}</span>`);
  }
  out.push(`<div class="art-foot">`);
  if (links.length) out.push(`<div class="exam-refs"><span class="ef-label">הופיע בבחינות:</span>${links.join('')}</div>`);
  out.push(`<div class="art-actions"><a class="practice-link" href="${PRACTICE_URL}#/quiz/${c.id === 'exam' ? '' : c.id}" target="_blank" rel="noopener">📝 תרגול בנושא</a>${a.sources?.length ? `<span class="srcs">מקורות: ${a.sources.map(esc).join(' · ')}</span>` : ''}</div>`);
  out.push(`</div></article>`);
  return out.join('\n');
}

const navHtml = NAV.map((g) => {
  const cs = g.chapters.map((id) => chap[id]).filter(Boolean);
  if (!cs.length) return '';
  const first = cs[0];
  const dd = cs.map((c) => `<div class="dd-head">פרק ${c.num} · ${esc(c.title)}</div>` + c.articles.map((a) => `<a href="#${esc(a.id)}"><span class="dd-code">${esc(a.code)}</span>${inline(a.title)}</a>`).join('')).join('');
  return `<div class="nav-item"><a href="#ch-${first.id}" style="--accent:${first.accent}">${esc(g.label)}</a><div class="dropdown">${dd}</div></div>`;
}).join('\n');

const bento = chapters.map((c, i) => `<a class="b-card ${i % 5 === 3 || i % 5 === 4 ? 'b-wide' : 'b-item'} rv" href="#ch-${c.id}" style="--accent:${c.accent};--accent-soft:${c.soft}"><span class="b-code">פרק ${c.num}</span><h3>${esc(c.title)}</h3><p>${inline(c.lead?.split(/(?<=\.)\s/)[0] ?? '')}</p></a>`).join('\n');

const sections = chapters.map((c) => `
<section class="chapter container" id="ch-${c.id}" style="--accent:${c.accent};--accent-soft:${c.soft}">
  <div class="ch-head">
    <span class="eyebrow">פרק ${c.num}${c.eyebrow ? ' · ' + esc(c.eyebrow) : ''}</span>
    <h2>${esc(c.title)}</h2>
    <p class="lead">${inline(c.lead)}</p>
    <div class="toc">${c.articles.map((a) => `<a href="#${esc(a.id)}">${inline(a.title)}</a>`).join('')}</div>
  </div>
  ${c.articles.map((a) => article(a, c)).join('\n')}
</section>`).join('\n');

// search index
const index = chapters.flatMap((c) => c.articles.map((a) => ({
  id: a.id, t: a.title, c: c.title, k: [a.title, a.code, a.purpose, ...(a.concepts ?? []), ...(a.summary ?? [])].join(' ').replace(/[*_#`]/g, ''),
})));
const nArticles = index.length;

const refCss = fs.readFileSync(path.join(ROOT, 'ref_style.css'), 'utf8');
const extraCss = fs.readFileSync(path.join(ROOT, 'extra.css'), 'utf8') + fs.readFileSync(path.join(ROOT, 'mobile.css'), 'utf8') + fs.readFileSync(path.join(ROOT, 'mdtable.css'), 'utf8');
const mobileJs = fs.readFileSync(path.join(ROOT, 'mobile.js'), 'utf8');
const sheet = chapters.map((c) => `<details data-ch="ch-${c.id}"><summary><span class="n" style="background:${c.accent}">${c.num}</span>${esc(c.title)}<span class="chev">⌄</span></summary><div class="arts"><a href="#ch-${c.id}"><b>פתיחת הפרק</b></a>${c.articles.map((a) => `<a href="#${esc(a.id)}">${inline(a.title)}</a>`).join('')}</div></details>`).join('');
const script = fs.readFileSync(path.join(ROOT, 'guide.js'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#F6F7FC">
<title>מדריך — ביקורת מערכות מידע ממוחשבות</title>
<meta name="description" content="מדריך לימוד מלא לקורס ביקורת מערכות מידע ממוחשבות בשילוב AI — סיכומים, מושגים, טבלאות השוואה, ציטוטים מהתקנים ודגשים לבחינה.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%236366F1'/%3E%3Cpath d='M18 18h20l8 8v20H18z' fill='none' stroke='%23fff' stroke-width='4'/%3E%3Cpath d='M24 34h16M24 41h10' stroke='%23fff' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Assistant:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
${refCss}
${extraCss}
</style>
</head>
<body>
<div class="mesh" aria-hidden="true"></div>
<div class="nav-wrap">
  <nav class="pill" aria-label="ניווט ראשי">
    <a class="brand" href="#top"><span class="dot"></span>ביקורת מערכות מידע</a>
    <button class="hamburger" id="hamburger" aria-label="פתיחת תפריט" aria-expanded="false">☰</button>
    <div class="nav-links" id="navLinks">
      <div class="nav-item"><a href="#top">מבוא</a></div>
      ${navHtml}
      <div class="nav-item"><a class="ext" href="${PRACTICE_URL}" target="_blank" rel="noopener">📝 לתרגול ↗</a></div>
    </div>
  </nav>
</div>

<header class="hero container" id="top">
  <span class="eyebrow" style="--accent:#6366F1">מדריך קורס מקיף · ${chapters.length} פרקים · ${nArticles} נושאים · שנה״ל תשפ״ו</span>
  <h1>ביקורת מערכות מידע ממוחשבות בשילוב AI</h1>
  <p class="sub">מדריך לימודים מובנה לכל נושאי הסילבוס — הסברים, מושגי מפתח, תפקיד רואה החשבון המבקר, טבלאות השוואה, ציטוטים מתקני הביקורת ודגשים מבחינות המועצה ומבחני הקורס, עם הפניה מדויקת למקור.</p>
  <div class="meta">
    <span>מבוסס על חוברת הקורס (ד״ר אלון כהן)</span>
    <span>תקני ביקורת 315 · 330 · 402 · 500 · 610 · 620</span>
    <span>בחינות מועצה 2015–2025</span>
    <span>מותאם למובייל</span>
  </div>
  <div class="search-box">
    <input id="q" type="search" placeholder="🔎 חיפוש נושא או מושג במדריך…" aria-label="חיפוש במדריך" autocomplete="off">
    <div id="results" class="results" hidden></div>
  </div>
  <div class="bento">
${bento}
  </div>
</header>
${sections}
<footer class="foot">
  <span class="mark">ביקורת מערכות מידע ממוחשבות בשילוב AI · מדריך לימוד</span>
  מבוסס על חוברת מערכי השיעור, סילבוס הקורס, תקני הביקורת (פרסומים מקצועיים 2026), מבחני הקורס ובחינות המועצה 2015–2025.<br>
  <a href="${PRACTICE_URL}" target="_blank" rel="noopener">לאתר התרגול ←</a>
</footer>
<button class="b2t" id="b2t" aria-label="חזרה למעלה">↑</button>
<div class="progress" aria-hidden="true"><i></i></div>
<nav class="mbar" aria-label="ניווט מהיר">
  <button data-sheet><span class="ic">📚</span>פרקים</button>
  <button data-search><span class="ic">🔎</span>חיפוש</button>
  <a href="${PRACTICE_URL}" target="_blank" rel="noopener"><span class="ic">📝</span>תרגול</a>
  <button data-top><span class="ic">↑</span>למעלה</button>
</nav>
<div class="mscrim"></div>
<div class="msheet" role="dialog" aria-label="פרקי המדריך"><div class="grab"></div><h4>פרקי המדריך</h4>${sheet}</div>
<script>window.__INDEX__=${JSON.stringify(index)};</script>
<script>
${script}
${mobileJs}
${fs.readFileSync(path.join(ROOT, 'mdtable.js'), 'utf8')}
enhanceTables(document);
</script>
</body>
</html>`;

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'index.html'), html);
console.log(`built: ${chapters.length} chapters, ${nArticles} articles, ${(html.length / 1024).toFixed(0)} KB`);
