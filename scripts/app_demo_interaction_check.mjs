/**
 * 官網示範頁的互動檢查
 *
 * 示範頁的價值是「畫面可以按」。它是靜態快照，按鈕背後的 App 邏輯都不在，
 * 所以每個按鈕只有兩種正確結果：真的展開／換頁，或跳出提示說明示範版不會存。
 * 第三種結果「點了完全沒反應」是壞掉，訪客會以為畫面當掉，而且它不會讓 build
 * 失敗，只能靠這支檢查抓出來。
 *
 * 用 MutationObserver 判斷有沒有反應：點下去之後 DOM 有變動或有 toast 就算通過。
 *
 * 跑法：npm run verify:demo:clicks
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'file://' + join(ROOT, 'public', 'app-demo', 'index.html');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push('JS 錯誤：' + e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_FILE_NOT_FOUND')) errors.push('console：' + m.text()); });
await page.goto(FILE, { waitUntil: 'load' });
await page.waitForTimeout(800);

await page.evaluate(() => {
  window.__mut = 0;
  new MutationObserver(() => { window.__mut++; }).observe(document.body,
    { subtree: true, childList: true, attributes: true, characterData: true });
});

/** 點一個元素，回報它有沒有反應。index 是同一組 selector 裡的第幾個。
    清 toast 本身也是一次 DOM 變動，要先等它入帳再把計數歸零，
    不然每個按鈕都會被算成「有反應」，死按鈕就驗不出來。 */
const clickAndWatch = (sel, i) => page.evaluate(async ([s, idx]) => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const el = document.querySelectorAll(s)[idx];
  if (!el) return { missing: true };
  /* disabled 的按鈕瀏覽器本來就不會發 click，訪客也按不動，不算死按鈕 */
  if (el.disabled) return { skipped: true };
  /* 關閉鈕要有東西可關才測得出來，先把對應的面板打開 */
  const act = el.dataset.action || '';
  if (act === 'close-quick-panel') document.getElementById('quick-panel')?.classList.add('demo-open');
  if (act === 'close-more-panel') document.getElementById('more-panel')?.classList.add('demo-open');
  document.getElementById('demo-toast').classList.remove('on');
  await wait(0);
  window.__mut = 0;
  const scrollBefore = window.scrollY;
  /* 已經在這一頁／這個分頁時再點一次，畫面本來就不該變。這種不算沒反應。 */
  const already = (el.dataset.p && document.getElementById('pg-' + el.dataset.p)?.classList.contains('on'))
    || (el.dataset.reportTab && document.getElementById('report-tab-' + el.dataset.reportTab)?.style.display === 'block')
    || false;
  el.click();
  await wait(150);
  return {
    mut: window.__mut,
    already,
    scrolled: window.scrollY !== scrollBefore,
    toast: document.getElementById('demo-toast').classList.contains('on'),
    toastText: document.getElementById('demo-toast').textContent,
  };
}, [sel, i]);

const dead = [];
const summary = { fold: 0, toast: 0, nav: 0 };

/* 1. 折頁，必須真的展開，不能只跳提示 */
const folds = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('[data-action^="toggle-"]').forEach((el, i) => {
    out.push({ i, act: el.dataset.action, page: (el.closest('.page') || {}).id || '(shell)' });
  });
  return out;
});
for (const f of folds) {
  await page.evaluate(pg => {
    if (pg === '(shell)') return;
    document.querySelectorAll('.page').forEach(e => e.classList.toggle('on', e.id === pg));
  }, f.page);
  const r = await clickAndWatch('[data-action^="toggle-"]', f.i);
  if (!r.mut && !r.toast && !r.scrolled) dead.push(`折頁 ${f.act}（${f.page}）點了沒反應`);
  else if (r.toast) summary.toast++;
  else summary.fold++;
}

/* 2. 其餘所有按得下去的東西，至少要有提示
   不能只檢查 data-action。App 有幾處折頁用的是別的記號（目標追蹤的三個分類是
   data-sav-mgr-section＋aria-controls），只掃 data-action 的話那幾顆是死的也看不出來。 */
const CLICKABLE = 'button, [role="button"], [data-action], [data-sav-mgr-section], [aria-controls]';
const acts = await page.evaluate(sel =>
  [...document.querySelectorAll(sel)].map((el, i) => ({
    i,
    act: el.dataset.action || el.dataset.savMgrSection || el.getAttribute('aria-controls')
      || el.id || el.textContent.trim().slice(0, 14) || el.tagName,
  })).filter(a => !String(a.act).startsWith('toggle-')), CLICKABLE);
for (const a of acts) {
  const r = await clickAndWatch(CLICKABLE, a.i);
  if (r.missing || r.skipped) continue;
  if (!r.mut && !r.toast && !r.already && !r.scrolled) dead.push(`按鈕 ${a.act} 點了沒反應`);
  else if (r.toast) summary.toast++;
  else summary.nav++;
  await page.evaluate(() => {
    document.getElementById('more-panel')?.classList.remove('demo-open');
    document.getElementById('more-overlay')?.classList.remove('demo-open');
    document.getElementById('quick-panel')?.classList.remove('demo-open');
  });
}

/* 3. 導覽，底部列與更多面板 */
const navs = await page.evaluate(() => [...document.querySelectorAll('[data-p]')].map((el, i) => ({
  i, p: el.dataset.p, label: el.textContent.trim().slice(0, 12),
  hasPage: !!document.getElementById('pg-' + el.dataset.p),
})));
for (const n of navs) {
  const r = await clickAndWatch('[data-p]', n.i);
  const onPage = await page.evaluate(p => !!document.getElementById('pg-' + p)?.classList.contains('on'), n.p);
  if (n.hasPage && !onPage) dead.push(`導覽 ${n.label}（${n.p}）沒有切到該頁`);
  if (!n.hasPage && !r.toast) dead.push(`導覽 ${n.label}（${n.p}）示範版沒收錄，但點了沒有提示`);
  summary.nav++;
}

/* 4. 診斷頁的四個分頁 */
await page.evaluate(() => document.querySelectorAll('.page').forEach(e => e.classList.toggle('on', e.id === 'pg-report')));
for (const tab of ['plan', 'detail', 'charts', 'overview']) {
  await page.evaluate(t => document.querySelector(`[data-report-tab="${t}"]`)?.click(), tab);
  await page.waitForTimeout(120);
  const shown = await page.evaluate(t => document.getElementById('report-tab-' + t)?.style.display === 'block', tab);
  if (!shown) dead.push(`診斷分頁「${tab}」點了沒切換`);
  else summary.nav++;
}

await browser.close();

console.log(`展開收合 ${summary.fold} 個、換頁/切換 ${summary.nav} 個、示範提示 ${summary.toast} 個`);
for (const e of errors) console.log('FAIL ' + e);
for (const d of dead) console.log('FAIL ' + d);
const bad = errors.length + dead.length;
console.log(bad === 0 ? '全部通過：沒有點了沒反應的按鈕，也沒有 JS 錯誤' : `${bad} 項不符`);
process.exit(bad === 0 ? 0 : 1);
