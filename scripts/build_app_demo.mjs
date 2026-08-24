/**
 * 產生官網示範頁 public/app-demo/
 *
 * 做法：開啟 88la-finance 的示範帳戶（?demo=true），把每一頁真實渲染的 DOM 抓下來，
 * 剝掉 demo 鎖點後組成一份純靜態頁。官網 App 頁的 iframe 指向它。
 *
 * 為什麼不直接嵌正式 App：正式 App 的 demo 模式靠十幾處鎖點遮住建議層，訪客滑完
 * 只看得到「待補充答案」和一整排 🔒，看不出系統要他改什麼；而且每次 App 改版都要
 * 重補鎖點。靜態頁沒有運算、不需鎖點，也不會被 App 改版打壞。
 *
 * App 改版後要更新示範頁：npm run build:demo
 */
import { chromium } from 'playwright';
import { writeFileSync, copyFileSync, mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { APP_LAUNCH_NOTICE } from '../src/siteLaunch.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'app-demo');
const FINANCE = join(ROOT, '..', '88la-finance');
const SRC_URL = process.env.DEMO_SRC || 'https://app.88lamoney.com/?demo=true';

/* 復刻的頁面。key 是 App 的頁面代號，底部導覽與「更多」面板都用同一組代號。 */
const PAGES = [
  'dashboard', 'budget', 'ledger', 'monthly', 'credit', 'report',
  'notes', 'accounts', 'savings-mgr', 'wishlist', 'debts',
];

/* ────────────────────────────────────────────────────────────────
   診斷頁的完成態替換
   示範帳戶沒有回答補充問題，診斷停在「待補充答案」，畫面上每一條都是
   「需要確認這是…還是…」，正好把訪客最該看到的結論擋掉。以下四塊換成
   小琳答完題之後的樣子。文字與金額取自 88la-finance/src/demoReportPayload.js
   （primaryVerdict / keyInsight / userCause / nextFocusActions / scenarioPriorityTable），
   不是自行編寫的結論。
   ──────────────────────────────────────────────────────────────── */
const DIAG_STATUS = `
<div class="card diag-month-status scroll-reveal revealed">
  <div class="diag-month-status-head">
    <div><span>本月狀態</span><strong>已完成</strong></div>
    <div class="diag-month-status-badges">
      <span style="background:#F0FDF4;color:#3C7E4E">診斷 已完成</span>
      <span style="background:#F0FDF4;color:#3C7E4E">下月計畫 已建立</span>
    </div>
  </div>
  <p>小琳已補齊 7 個問題，以下是 8 月的正式診斷結果。</p>
</div>`;

const DIAG_VERDICT = `
<div class="card scroll-reveal revealed" style="padding:18px 16px;margin-bottom:16px;background:#FFF8F2;border:1px solid #F4D4BE">
  <div class="diag-section-heading">這個月的主要判斷</div>
  <div style="font-size:14px;font-weight:700;color:#1A1A1A;line-height:1.8;margin:10px 0 12px">這個月可用餘額表面上仍為正，但固定支出與變動支出都明顯超出預算，建議先回頭檢查預算基準是否抓得太低。</div>
  <div style="background:#FFF;border:1px solid #EEE;border-radius:8px;padding:11px 13px;margin-bottom:9px">
    <div style="font-size:11px;color:#A84810;font-weight:700;margin-bottom:3px">關鍵發現</div>
    <div style="font-size:12px;color:#555;line-height:1.75">固定支出預算 $16,800，實際 $20,289。這種落差需要先確認預算項目是否漏編，而不是急著把所有問題都歸因成花費失控。</div>
  </div>
  <div style="background:#FFF;border:1px solid #EEE;border-radius:8px;padding:11px 13px">
    <div style="font-size:11px;color:#A84810;font-weight:700;margin-bottom:3px">本月主因</div>
    <div style="font-size:12px;color:#555;line-height:1.75">比較像固定與變動預算基準都需要重抓。下個月先把必要支出和日常支出重新分配，再討論哪些消費可以調整。</div>
  </div>
</div>`;

const DIAG_TOP = `
<div class="card scroll-reveal revealed" style="padding:18px 16px;margin-bottom:16px">
  <div class="diag-section-heading">本月三個重點</div>
  <div class="diag-section-help" style="margin-top:4px">依影響程度排序，下個月先盯住第一項就好。</div>
  <div class="diag-top-list" style="display:flex;flex-direction:column;gap:12px;margin-top:14px">
    <div style="display:flex;gap:10px">
      <span style="flex-shrink:0;width:20px;height:20px;border-radius:50%;background:#C85A14;color:#FFF;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px">1</span>
      <div><div style="font-size:13px;font-weight:700;color:#1A1A1A;margin-bottom:3px">預算基準失準，不是花費失控</div>
      <div style="font-size:12px;color:#767676;line-height:1.75">固定支出達預算 121%，變動支出達預算 103%。半年繳的車險 $3,600 沒編進預算，固定支出超支的 $3,489 幾乎全部來自這一筆。</div></div>
    </div>
    <div style="display:flex;gap:10px">
      <span style="flex-shrink:0;width:20px;height:20px;border-radius:50%;background:#B87830;color:#FFF;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px">2</span>
      <div><div style="font-size:13px;font-weight:700;color:#1A1A1A;margin-bottom:3px">儲蓄缺口 $4,000，跟預算一起重估</div>
      <div style="font-size:12px;color:#767676;line-height:1.75">儲蓄目標 $8,000 只做到 $4,000。預算基準上修後，儲蓄目標也要同步調整，不用硬撐原本的數字。</div></div>
    </div>
    <div style="display:flex;gap:10px">
      <span style="flex-shrink:0;width:20px;height:20px;border-radius:50%;background:#8A7A72;color:#FFF;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px">3</span>
      <div><div style="font-size:13px;font-weight:700;color:#1A1A1A;margin-bottom:3px">衝動消費是觀察訊號，不是本月主因</div>
      <div style="font-size:12px;color:#767676;line-height:1.75">衝動消費 4 筆共 $1,950，比上月的 $3,175 少 39%。集中在星期五（2 筆 $1,850），下個月留意這一天就好。</div></div>
    </div>
  </div>
</div>`;

const DIAG_PLAN = `
<div class="card diag-plan-section scroll-reveal revealed" style="margin-bottom:14px">
  <div class="diag-plan-section-title">9 月預算調整</div>
  <div class="diag-plan-section-copy">依這個月的實際狀況重抓基準，不是把超支的預算直接改高讓問題消失。</div>
  <div style="padding:0 16px 16px">
    <div class="tx-row">
      <div><div style="font-size:13px;font-weight:600">固定支出</div><div style="font-size:11px;color:#888;margin-top:2px">車險 $3,600 攤成每月 $600 編進預算</div></div>
      <div style="text-align:right;white-space:nowrap"><div style="font-size:11px;color:#888;text-decoration:line-through">$16,800</div><div style="font-size:14px;font-weight:700;color:#C85A14">$17,400</div></div>
    </div>
    <div class="tx-row">
      <div><div style="font-size:13px;font-weight:600">變動支出</div><div style="font-size:11px;color:#888;margin-top:2px">購物 $2,500 調到 $3,000，另設臨時支出 $1,000</div></div>
      <div style="text-align:right;white-space:nowrap"><div style="font-size:11px;color:#888;text-decoration:line-through">$9,600</div><div style="font-size:14px;font-weight:700;color:#C85A14">$11,100</div></div>
    </div>
    <div class="tx-row">
      <div><div style="font-size:13px;font-weight:600">儲蓄</div><div style="font-size:11px;color:#888;margin-top:2px">預算上修後同步下調，先求穩定達成</div></div>
      <div style="text-align:right;white-space:nowrap"><div style="font-size:11px;color:#888;text-decoration:line-through">$8,000</div><div style="font-size:14px;font-weight:700;color:#4A8C5C">$6,000</div></div>
    </div>
    <div class="ok-box" style="margin-top:12px;font-size:12px;color:#3C7E4E;line-height:1.8">調整後 9 月預算合計 $34,500，收入 $42,000，預留卡費後仍有餘裕。</div>
    <button class="btn-o" style="width:100%;padding:11px;margin-top:12px" data-demo-note="示範帳戶不會實際套用，正式版按下去就會寫進 9 月預算">套用到 9 月預算</button>
  </div>
</div>

<div class="card diag-plan-section scroll-reveal revealed" style="margin-bottom:14px">
  <div class="diag-plan-section-title">下個月要做的三件事</div>
  <div class="diag-plan-section-copy">每一項都是算好金額的具體動作，點進去就能改。</div>
  <div style="padding:0 16px 16px">
    <div style="background:#FAFAF8;border:1px solid #EEE;border-radius:8px;padding:12px 13px;margin-bottom:10px">
      <div style="font-size:13px;font-weight:700;color:#1A1A1A;line-height:1.6;margin-bottom:5px">下個月「保險」預算從 $1,200 改成 $1,800</div>
      <div style="font-size:12px;color:#555;line-height:1.75">你已確認「保險」會持續發生。本月實際 $4,800，其中半年繳的車險 $3,600 攤成每月 $600，下個月依同一份調整增加 $600，畫面試算與實際套用都會使用 $1,800。</div>
      <button class="btn-g" style="margin-top:9px;font-size:11px;padding:6px 12px" data-p="budget">調整固定預算 →</button>
    </div>
    <div style="background:#FAFAF8;border:1px solid #EEE;border-radius:8px;padding:12px 13px;margin-bottom:10px">
      <div style="font-size:13px;font-weight:700;color:#1A1A1A;line-height:1.6;margin-bottom:5px">下個月「購物」再遇到 $1,800 這種，先放願望清單三天</div>
      <div style="font-size:12px;color:#555;line-height:1.75">依你剛才的選擇，那筆是想要才花的。扣掉它，這一類其他 2 筆合計 $2,740，只比預算多 $240，代表日常花費大致穩定，問題出在那一筆決定。下個月同樣金額的東西，先放進願望清單，三天後還想要再買。</div>
      <button class="btn-g" style="margin-top:9px;font-size:11px;padding:6px 12px" data-p="wishlist">打開願望清單 →</button>
    </div>
    <div style="background:#FAFAF8;border:1px solid #EEE;border-radius:8px;padding:12px 13px">
      <div style="font-size:13px;font-weight:700;color:#1A1A1A;line-height:1.6;margin-bottom:5px">重新審視你能存的金額</div>
      <div style="font-size:12px;color:#555;line-height:1.75">本月原定儲蓄 $8,000，目前完成 $4,000，扣完必要支出與卡費後還剩 $2,876。兩者相加 $6,876 就是這個月真正能存的上限，先用 $6,000 重新校準。</div>
      <button class="btn-g" style="margin-top:9px;font-size:11px;padding:6px 12px" data-p="savings-mgr">重新檢視儲蓄目標 →</button>
    </div>
  </div>
</div>

<div class="card diag-plan-section scroll-reveal revealed" style="margin-bottom:14px">
  <div class="diag-plan-section-title">觀察重點</div>
  <div style="padding:0 16px 16px">
    <div class="coach">衝動消費集中在<strong>星期五</strong>（2 筆 $1,850）。下個月出門前先想好當天的額度，不用全面限制所有消費。</div>
    <div class="coach">購物、飲食-外食先放進<strong>待買清單</strong>。想買的東西先記下來，隔幾天還想要，再決定是否購買。</div>
    <div class="coach">下個月回頭看是否<strong>重複出現</strong>。重點不是本月有幾筆，而是同樣時間、同樣類別會不會再次發生。</div>
  </div>
</div>`;

/* ── 抓取 ────────────────────────────────────────────────────── */
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
await page.goto(SRC_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

/** 每次抓之前都要跑：拔掉 demo 鎖點、把圖表轉成圖片、讓延遲揭露的區塊固定可見。 */
const prepare = () => page.evaluate(() => {
  document.querySelectorAll('[data-demo-overlay]').forEach(e => e.remove());
  document.querySelectorAll('[data-demo-blurred]').forEach(e => {
    e.style.filter = ''; e.style.pointerEvents = ''; e.style.userSelect = '';
    e.removeAttribute('data-demo-blurred');
  });
  document.querySelectorAll('[data-demo-locked]').forEach(e => e.removeAttribute('data-demo-locked'));
  const guard = document.getElementById('demo-mode-guard');
  if (guard) guard.remove();

  // .scroll-reveal 預設 opacity:0，靠 GSAP 加 .revealed 才看得見。
  // 靜態頁沒有那段 JS，沒補的話整塊永遠是空白。
  document.querySelectorAll('.scroll-reveal').forEach(e => {
    e.classList.add('revealed');
    e.style.transitionDelay = '0s';
  });

  // canvas 的畫面不存在 HTML 裡，快照會變空白。換成同尺寸的 img。
  document.querySelectorAll('canvas').forEach(c => {
    if (!c.width || !c.height) return;
    let url;
    try { url = c.toDataURL('image/png'); } catch { return; }
    const img = document.createElement('img');
    img.src = url;
    img.style.cssText = c.style.cssText;
    // 抓取當下若圖表在收合區塊裡，clientWidth 會是 0，直接寫進 style 會讓圖片
    // 在靜態頁渲染成 0 寬（看起來像整張圖不見）。量不到就交給 CSS 自適應。
    img.style.width = c.style.width || (c.clientWidth ? c.clientWidth + 'px' : '100%');
    img.style.height = c.style.height || (c.clientHeight ? c.clientHeight + 'px' : 'auto');
    img.style.maxWidth = '100%';
    if (c.className) img.className = c.className;
    if (c.id) img.id = c.id;
    c.replaceWith(img);
  });
});

const grabbed = {};
for (const p of PAGES) {
  await page.evaluate(pg => window.go(pg), p);
  await page.waitForTimeout(2200);
  if (p === 'ledger') {
    // 記帳明細的篩選預設停在「收入」，整頁只會有薪資那一筆。先切到「全部」再抓。
    await page.evaluate(() => document.getElementById('f-all')?.click());
    await page.waitForTimeout(1800);
  }
  if (p === 'report') {
    // 四個分頁的內容都在同一個 pg-report 裡，逐一點過讓它們渲染，
    // 順便把折頁全部展開一次（靜態頁的收合由自己的 JS 接手）。
    for (const tab of ['overview', 'plan', 'detail', 'charts']) {
      await page.evaluate(t => document.querySelector(`[data-report-tab="${t}"]`)?.click(), tab);
      await page.waitForTimeout(1400);
    }
    await page.evaluate(() => {
      document.querySelectorAll('[data-action="toggle-diag"]').forEach(h => h.click());
    });
    await page.waitForTimeout(1200);
    await page.evaluate(() => document.querySelector('[data-report-tab="overview"]')?.click());
    await page.waitForTimeout(900);
  }
  await prepare();
  grabbed[p] = await page.evaluate(pg => document.getElementById('pg-' + pg)?.innerHTML || '', p);
  console.log(String(p).padEnd(14), String(grabbed[p].length).padStart(7), 'bytes');
}

// 快速記帳面板：類別與付款方式是 JS 動態渲染的 chip，等它們真的長出來再抓，
// 不然面板會少掉兩整排選項（只等固定秒數會抓到空殼）
// 快速記帳在 demo 模式是完全關掉的：main.js 把 window.initQuickMode 換成只跳 toast
// 的空函式，點按鈕或直接呼叫都只會拿到沒初始化的空殼（類別與付款方式兩排全空）。
// selectQCat / selectQPay 沒有被換掉，而它們內部會觸發 _renderQCats / _renderQPays，
// 所以改用它們把示範帳戶真正的類別與付款方式渲染出來。
await page.evaluate(() => {
  const qp = document.getElementById('quick-panel');
  if (qp) qp.style.display = 'flex';
  window.selectQCat?.('飲食-外食');
  window.selectQPay?.('信用卡A');
});
await page.waitForFunction(() => {
  const cats = document.getElementById('qt-cats');
  const pays = document.getElementById('qt-pays');
  return cats && pays && cats.children.length > 0 && pays.children.length > 0;
}, { timeout: 20000 }).catch(() => console.warn('  [warn] 快速記帳的類別/付款方式沒渲染出來'));
await page.waitForTimeout(800);
// 日期欄位在 App 是開啟當下填入的，快照裡固定成示範月份，避免顯示成空白
await page.evaluate(() => {
  const d = document.getElementById('qt-date');
  if (d) { d.value = '2026-08-22'; d.setAttribute('value', '2026-08-22'); }
});
await prepare();
const quickPanel = await page.evaluate(() => {
  const el = document.getElementById('quick-panel');
  if (!el) return '';
  // GSAP 開場動畫留下的 transform / opacity 會跟著快照走，靜態頁自己控制顯示
  el.style.transform = '';
  el.style.opacity = '';
  el.style.display = '';
  return el.outerHTML;
});
const morePanel = await page.evaluate(() => document.getElementById('more-panel')?.outerHTML || '');
const bnav = await page.evaluate(() => document.querySelector('.bnav')?.outerHTML || '');
console.log('quick-panel'.padEnd(14), String(quickPanel.length).padStart(7), 'bytes');
console.log('more-panel'.padEnd(14), String(morePanel.length).padStart(7), 'bytes');
await browser.close();

/* ── 套用診斷完成態 ──────────────────────────────────────────── */
/** 把 id 指定的容器整段內容換掉。找不到就中止，不要默默產出半套畫面。 */
function replaceInner(html, id, inner) {
  const anchor = html.indexOf(`id="${id}"`);
  if (anchor < 0) throw new Error(`找不到 #${id}，App 的診斷頁結構可能改過了，請重新確認替換點`);
  const open = html.lastIndexOf('<', anchor);
  const tagEnd = html.indexOf('>', anchor);
  // 從開頭標籤往後數 div 深度，找出對應的結束標籤
  let depth = 1;
  let i = tagEnd + 1;
  while (depth > 0 && i < html.length) {
    const next = html.indexOf('<div', i);
    const close = html.indexOf('</div>', i);
    if (close < 0) throw new Error(`#${id} 的結束標籤找不到`);
    if (next >= 0 && next < close) { depth++; i = next + 4; }
    else { depth--; i = close + 6; }
  }
  const openTag = html.slice(open, tagEnd + 1);
  return html.slice(0, open) + openTag + inner + '</div>' + html.slice(i);
}

/* 抓下來的診斷內容處處寫著「等你回答」，跟上面替換過的「診斷已完成」互相矛盾。
   這些句子換成小琳答完之後的結果。left 找不到就警告：App 改過文案時要有人知道，
   但不必中止整份產出。 */
const TEXT_FIXES = [
  ['本月初步檢查完成', '本月結算結果'],
  ['以下是你這個月用錢的情況，可以確認數字對不對。沒問題的話就往下滑幫我補充資料。',
   '以下是你這個月用錢的情況。往下滑可以看到系統的判斷，以及下個月的調整方向。'],
  ['>需要確認</div>', '>小琳的回答</div>'],
  ['這些固定支出是否每個月都會發生？如果會，下個月應先把它們完整編進固定預算，再討論是否有可取消的訂閱。',
   '汽機車險 $3,600 是半年繳，當初編預算時沒有算進去。攤成每月 $600 編進固定預算，下次就不會被打亂。'],
  ['超支的類別裡，哪些是日常必要、哪些是臨時事件、哪些才是想要消費？',
   '購物 $4,540 裡，衣服 $1,450 和保養品 $1,290 共 $2,740 是計畫內的補貨，剩下的 $1,800 是下班時的衝動網購。購物預算調到 $3,000 貼近實際，另外設一筆臨時支出 $1,000。'],
  ['下個月要維持原儲蓄目標，還是先等生活成本重新校準後再調整？',
   '希望先求每個月都能達成。9 月儲蓄目標下調到 $6,000，等預算基準穩定兩個月後再往上加。'],
  ['先補齊大額支出的需要/想要，尤其是固定支出與變動支出中金額最高的項目。',
   '這個月先補了購物與飲食兩類的需要/想要，其餘大額支出下個月繼續補，比例還不夠代表整體消費結構。'],
];

let report = grabbed.report;
report = replaceInner(report, 'diag-month-status-wrap', DIAG_STATUS);
report = replaceInner(report, 'diag-confirm-wrap', DIAG_VERDICT);
report = replaceInner(report, 'diag-top-diagnoses-wrap', DIAG_TOP);
report = replaceInner(report, 'diag-plan-full-wrap', DIAG_PLAN);

let fixed = 0;
for (const [from, to] of TEXT_FIXES) {
  if (!report.includes(from)) {
    console.warn('  [warn] 找不到要替換的句子，App 文案可能改過：' + from.slice(0, 30));
    continue;
  }
  report = report.split(from).join(to);
  fixed++;
}
grabbed.report = report;
console.log('診斷完成態替換    4 個區塊 ＋ ' + fixed + '/' + TEXT_FIXES.length + ' 處文案');

/* ── 組裝 ────────────────────────────────────────────────────── */
mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(join(FINANCE, 'src', 'style.css'), join(OUT_DIR, 'app.css'));
copyFileSync(join(FINANCE, 'public', 'logo-ui.webp'), join(OUT_DIR, 'logo-ui.webp'));

const SHELL_CSS = `
/* 示範頁殼層。App 的樣式全部來自 app.css，這裡只放靜態頁自己需要的東西。 */
body{background:#F5F0EB;-webkit-tap-highlight-color:transparent}
.mc{padding-bottom:76px}
.demo-top{background:#FFF;border-bottom:1px solid rgba(0,0,0,.05);padding:9px 14px;display:flex;align-items:center;gap:7px;position:sticky;top:0;z-index:45}
.demo-top b{font-size:12px;color:#C85A14;font-weight:700}
.demo-top em{font-size:11px;color:#8A7A72;font-style:normal}
.demo-dot{width:6px;height:6px;border-radius:50%;background:#C85A14;flex-shrink:0}
.demo-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:92px;background:rgba(30,26,24,.94);color:#FFF;font-size:12px;padding:10px 18px;border-radius:8px;z-index:999;opacity:0;pointer-events:none;transition:opacity .2s;max-width:84%;text-align:center;line-height:1.65}
.demo-toast.on{opacity:1}
.demo-cta{margin:18px 14px 4px;background:#FFF;border-radius:8px;padding:16px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.05)}
.demo-cta p{font-size:12px;color:#7A6A68;line-height:1.8;margin-bottom:11px}
.demo-cta a{display:inline-block;background:#C85A14;color:#FFF;font-size:13px;font-weight:700;padding:11px 26px;border-radius:8px;text-decoration:none}
/* 抓下來的快照沒有 GSAP 接手，所有揭露動畫一律當成已完成 */
.scroll-reveal{opacity:1!important;transform:none!important}
/* 更多面板在 App 是 JS 控制的，靜態頁自己接 */
#more-panel{transform:translateY(102%);transition:transform .25s ease}
#more-panel.demo-open{transform:translateY(0)}
#more-overlay{display:none}
#more-overlay.demo-open{display:block}
/* 可用餘額的組成公式（收入 − 現金支出 − 卡費預留 − 儲蓄）維持屏蔽，跟正式 App 的
   demo 模式一致：大數字看得到，拆解糊掉。prepare() 會清掉抓取時的 inline filter，
   所以改用 CSS 蓋回來。 */
#d-balance-formula{filter:blur(5px);pointer-events:none;user-select:none}
/* 快速記帳面板：App 的 CSS 是 left:50%，靠 GSAP 的 xPercent:-50 拉回中間。
   靜態頁沒有 GSAP，這裡直接用 CSS 補上，不然面板會整個偏到右邊被切掉。 */
#quick-panel{display:none!important;transform:translateX(-50%)!important;opacity:1!important}
#quick-panel.demo-open{display:flex!important}
`;

const SHELL_JS = `
/* ══════════════════════════════════════════════════════════════
   示範頁互動層
   畫面是 88la-finance 示範帳戶的真實 DOM 快照，這裡沒有任何計算：
   只負責切頁、切分頁、收合展開，其餘會改資料的按鈕一律攔下來提示。
   ══════════════════════════════════════════════════════════════ */
(function () {
  var APP_LAUNCH_NOTICE = ${JSON.stringify(APP_LAUNCH_NOTICE)};
  var toastEl = document.getElementById('demo-toast');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 2800);
  }

  function goPage(p) {
    var target = document.getElementById('pg-' + p);
    if (!target) return;
    document.querySelectorAll('.page').forEach(function (el) { el.classList.toggle('on', el === target); });
    document.querySelectorAll('.nb[data-p]').forEach(function (b) { b.classList.toggle('on', b.dataset.p === p); });
    closeMore();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  var REPORT_TABS = ['overview', 'plan', 'detail', 'charts'];
  function goTab(t) {
    if (REPORT_TABS.indexOf(t) < 0) t = 'overview';
    REPORT_TABS.forEach(function (k) {
      var el = document.getElementById('report-tab-' + k);
      if (el) el.style.display = k === t ? 'block' : 'none';
    });
    document.querySelectorAll('.report-tab-btn').forEach(function (b) {
      b.classList.toggle('on', b.dataset.reportTab === t);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeMore() {
    var mp = document.getElementById('more-panel');
    var mo = document.getElementById('more-overlay');
    if (mp) mp.classList.remove('demo-open');
    if (mo) mo.classList.remove('demo-open');
  }

  /* 折頁：App 的展開是 GSAP 動畫，這裡改成單純切 display，收合狀態一致。 */
  function toggleFold(head) {
    var body = head.nextElementSibling;
    if (!body) return;
    var open = body.style.display !== 'none' && body.style.display !== '';
    body.style.display = open ? 'none' : 'block';
    var arr = head.querySelector('.d-arr');
    if (arr) arr.textContent = open ? '▸' : '▾';
  }

  /* 只有純顯示切換會被接起來，其餘 data-action 都是會改資料的，一律攔下 */
  var DISPLAY_ONLY = {
    'toggle-diag': function (el) { toggleFold(el); },
    'toggle-budget-workflow-step': function (el) { toggleFold(el); },
    'toggle-rsv-group': function (el) { toggleFold(el); },
    'toggle-wishlist-history': function (el) { toggleFold(el); },
    'toggle-settled-debts': function (el) { toggleFold(el); },
    'toggle-transfer-list': function (el) { toggleFold(el); },
    'toggle-cc-analysis': function (el) { toggleFold(el); }
  };

  document.addEventListener('click', function (e) {
    var lockedAppLink = e.target.closest('[data-app-locked="true"]');
    if (lockedAppLink) {
      e.preventDefault();
      toast(APP_LAUNCH_NOTICE);
      return;
    }

    var tabBtn = e.target.closest('[data-report-tab]');
    if (tabBtn) { goTab(tabBtn.dataset.reportTab); return; }

    var navBtn = e.target.closest('[data-p]');
    if (navBtn && !navBtn.closest('.page')) { goPage(navBtn.dataset.p); return; }
    if (navBtn) { goPage(navBtn.dataset.p); return; }

    var goBtn = e.target.closest('[data-go-page]');
    if (goBtn) {
      var dest = goBtn.dataset.goPage;
      if (document.getElementById('pg-' + dest)) goPage(dest);
      else toast('這一頁在示範版沒有收錄，正式版可以進入');
      return;
    }

    if (e.target.closest('#nb-more, [data-action="open-more-panel"]')) {
      document.getElementById('more-panel').classList.add('demo-open');
      var mo = document.getElementById('more-overlay');
      if (mo) mo.classList.add('demo-open');
      return;
    }
    if (e.target.closest('#more-overlay, [data-action="close-more-panel"]')) { closeMore(); return; }

    if (e.target.closest('[data-action="init-quick-mode"], [data-action="quick-pay-from-account"]')) {
      document.getElementById('quick-panel').classList.add('demo-open');
      return;
    }
    if (e.target.closest('[data-action="close-quick-panel"]')) {
      document.getElementById('quick-panel').classList.remove('demo-open');
      return;
    }

    var noteEl = e.target.closest('[data-demo-note]');
    if (noteEl) { toast(noteEl.dataset.demoNote); return; }

    var actEl = e.target.closest('[data-action]');
    if (actEl) {
      var act = actEl.dataset.action;
      if (DISPLAY_ONLY[act]) { DISPLAY_ONLY[act](actEl); return; }
      toast('這是示範帳戶，不會實際儲存。開始使用後就能操作');
      e.preventDefault();
      return;
    }

    // 沒有 data-action 的折頁標題（診斷頁有幾處是直接綁在標題列上的）
    var arrHead = e.target.closest('.d-arr') ? e.target.closest('.d-arr').parentElement : null;
    if (arrHead) { toggleFold(arrHead); }
  });

  /* 表單可以填，但送出一律攔下 */
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    toast('這是示範帳戶，不會實際儲存。開始使用後就能操作');
  });

  /* 診斷頁預設停在「本月重點」 */
  if (document.getElementById('report-tab-overview')) goTab('overview');

  /* 折頁的初始狀態：抓取時全部展開過，這裡收回預設值，讓訪客自己點開 */
  document.querySelectorAll('[data-action="toggle-diag"]').forEach(function (head) {
    var body = head.nextElementSibling;
    if (!body) return;
    body.style.display = 'none';
    var arr = head.querySelector('.d-arr');
    if (arr) arr.textContent = '▸';
  });
})();
`;

const PAGE_LABEL = {
  dashboard: '快訊', budget: '預算', ledger: '記帳明細', monthly: '月度檢視',
  credit: '信用卡', report: '診斷', notes: '筆記', accounts: '帳戶管理',
  'savings-mgr': '目標追蹤', wishlist: '願望清單', debts: '負債追蹤',
};

const pagesHTML = PAGES.map(p =>
  `<div class="page${p === 'dashboard' ? ' on' : ''}" id="pg-${p}" data-page-label="${PAGE_LABEL[p]}">\n${grabbed[p]}\n</div>`
).join('\n\n');

const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>88La財務導航 示範</title>
<meta name="robots" content="noindex">
<meta name="description" content="88La財務導航示範帳戶畫面，資料為示範用途。">
<link rel="stylesheet" href="./app.css">
<style>${SHELL_CSS}</style>
</head>
<body>

<!-- 這份頁面由 scripts/build_app_demo.mjs 產生，請勿手改；要更新請重跑 npm run build:demo -->

<div class="demo-top">
  <span class="demo-dot"></span><b>示範帳戶</b><em>小琳的 8 月，資料為示範用途</em>
</div>

<div class="mc">
${pagesHTML}

<div class="demo-cta">
  <p>以上是示範帳戶「小琳」的 8 月資料。<br>你的畫面會依自己的記帳結果產生。</p>
  <a href="#app-launch" data-app-locked="true">開始使用 88La財務導航 →</a>
</div>
</div>

<div id="more-overlay" class="more-overlay"></div>
${morePanel}
${quickPanel}
${bnav}

<div class="demo-toast" id="demo-toast" role="status" aria-live="polite" aria-atomic="true"></div>

<script>${SHELL_JS}</script>
</body>
</html>
`;

writeFileSync(join(OUT_DIR, 'index.html'), html);

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log('');
console.log('產出  public/app-demo/index.html  ' + kb(html.length));
console.log('      public/app-demo/app.css     ' + kb(readFileSync(join(OUT_DIR, 'app.css')).length));
console.log('      復刻頁面 ' + PAGES.length + ' 頁：' + PAGES.map(p => PAGE_LABEL[p]).join('、'));
