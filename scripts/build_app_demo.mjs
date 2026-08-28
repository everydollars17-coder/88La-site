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
 * 診斷頁的完成態：示範帳戶預設沒答補充問題，而且 8 月仍在進行中，正式 App 只會顯示
 * OPEN 財務雷達，不會先產生完整診斷與下月計畫。官網外層文案承諾展示「完整診斷」，
 * 所以這裡會同時注入小琳的答案，並把示範月份標成使用者已結束的 CLOSED 狀態，再交給
 * 診斷引擎重算。診斷內容全部由 App 自己畫，這裡不人工撰寫任何診斷文字或金額。
 *
 * App 改版後要更新示範頁：FINANCE_ROOT=/path/to/88la-finance npm run build:demo
 * 產生器會從同一個 FINANCE_ROOT 啟動暫時 dev server、載入診斷引擎並複製 CSS，
 * 不再允許三個來源各自指向不同工作目錄。
 */
import { chromium } from 'playwright';
import { writeFileSync, copyFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { APP_LAUNCH_NOTICE } from '../src/siteLaunch.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'app-demo');
const FINANCE = resolve(process.env.FINANCE_ROOT || join(ROOT, '..', '88la-finance'));
const requiredFinanceFiles = [
  'package.json',
  'src/main.js',
  'src/demoData.js',
  'src/style.css',
  'api/_deep-report-engine.js',
  'api/_deep-report-app-response.js',
];
const missingFinanceFiles = requiredFinanceFiles.filter(file => !existsSync(join(FINANCE, file)));
if (missingFinanceFiles.length) {
  throw new Error(`FINANCE_ROOT 不是完整的 88la-finance：${FINANCE}\n缺少：${missingFinanceFiles.join('、')}`);
}
const financeHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: FINANCE, encoding: 'utf8' }).trim();
const financeDirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: FINANCE, encoding: 'utf8' }).trim();
const financeFingerprint = createHash('sha256');
requiredFinanceFiles.forEach(file => financeFingerprint.update(file).update(readFileSync(join(FINANCE, file))));
const financeSourceId = `${financeHead}${financeDirty ? `+working-tree.${financeFingerprint.digest('hex').slice(0, 16)}` : ''}`;

const findFreePort = () => new Promise((resolvePort, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    server.close(error => error ? reject(error) : resolvePort(port));
  });
});
const financePort = await findFreePort();
const SRC_URL = `http://127.0.0.1:${financePort}/?demo=true`;
let financeServerLog = '';
const financeServer = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
  'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(financePort), '--strictPort',
], {
  cwd: FINANCE,
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
});
for (const stream of [financeServer.stdout, financeServer.stderr]) {
  stream.on('data', chunk => {
    financeServerLog = (financeServerLog + chunk.toString()).slice(-12000);
  });
}
const stopFinanceServer = async () => {
  if (financeServer.exitCode !== null || financeServer.signalCode !== null) return;
  financeServer.kill('SIGTERM');
  await new Promise(resolveStop => {
    const timer = setTimeout(() => {
      if (financeServer.exitCode === null && financeServer.signalCode === null) financeServer.kill('SIGKILL');
      resolveStop();
    }, 3000);
    financeServer.once('exit', () => {
      clearTimeout(timer);
      resolveStop();
    });
  });
};
const stopOnExit = () => financeServer.kill('SIGTERM');
process.once('exit', stopOnExit);
const waitForFinance = async () => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (financeServer.exitCode !== null) {
      throw new Error(`88la-finance dev server 啟動失敗：\n${financeServerLog}`);
    }
    try {
      const response = await fetch(SRC_URL);
      if (response.ok) return;
    } catch {}
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
  }
  throw new Error(`等待 88la-finance dev server 逾時：${SRC_URL}\n${financeServerLog}`);
};
await waitForFinance();

/* 復刻的頁面。key 是 App 的頁面代號，底部導覽與「更多」面板都用同一組代號。 */
const PAGES = [
  'dashboard', 'budget', 'ledger', 'monthly', 'credit', 'report',
  'notes', 'accounts', 'savings-mgr', 'wishlist', 'debts',
];

/* 小琳的補充答案
   示範帳戶預設一題都沒答。這四題的答案決定訪客看到的結論，所以是內容決策，
   不是技術細節：維持不減少食材與交通頻率，兩筆臨時支出由本月收入支付。
   換答案的方式：改這裡再跑 npm run build:demo，診斷會整份跟著變。
   注意：官網示範情境的「給小琳的建議」（src/App.jsx 的 demoStory）講的是同一份
   診斷，改這裡要一起看那邊，不然同一個畫面上下兩段會互相矛盾。
*/
const DIAG_ANSWERS = {
  'var:飲食-食材': 'cut:0',             // 下個月不減少次數，預算改成貼近實際
  'var:交通': 'cut:0',                  // 同上
  'temporary-funding:120': 'fund:income', // 下午茶聚會 $280 由本月收入支付
  'temporary-funding:122': 'fund:income', // 衣服（網購）$1,450 由本月收入支付
};

/* 抓取 */
const browser = await chromium.launch();
/* serviceWorkers: 'block'：App 是 PWA，模組請求會被 service worker 接走，
   page.route 就攔不到 demoReportPayload.js（診斷會停在未完成態）。示範頁不需要 SW。 */
const context = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' });
const page = await context.newPage();
await page.goto(SRC_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

/* 診斷完成態，把答案注入引擎，重算一份 payload
   ?demo=true 的診斷不做運算，一律讀 src/demoReportPayload.js。把那份換成
   「答完題」的版本，App 就會自己畫出完成態的診斷。 */
const snapshot = await page.evaluate(() => window.__88laBuildDeepReportSnapshot?.());
if (!snapshot?.context) {
  throw new Error(`拿不到 window.__88laBuildDeepReportSnapshot()。請確認 FINANCE_ROOT 指向可啟動的 88la-finance。來源：${SRC_URL}`);
}
const enginePath = pathToFileURL(join(FINANCE, 'api', '_deep-report-app-response.js')).href;
const { buildDeepReportEngineResponse } = await import(enginePath);
const openResponse = buildDeepReportEngineResponse(snapshot);
const unanswered = openResponse?.diagnosisModel?.questions || [];
const questionKeys = unanswered.filter(question => !question.answer).map(question => question.key);
const staleAnswerKeys = Object.keys(DIAG_ANSWERS).filter(key => !questionKeys.includes(key));
const missingAnswerKeys = questionKeys.filter(key => !Object.hasOwn(DIAG_ANSWERS, key));
if (staleAnswerKeys.length || missingAnswerKeys.length) {
  throw new Error(`Demo 答案與目前診斷問題不一致。多餘：${staleAnswerKeys.join('、') || '無'}；缺少：${missingAnswerKeys.join('、') || '無'}`);
}
snapshot.context.diagAnswers = DIAG_ANSWERS;
/* 官網示範的是完整月底診斷，不能讓畫面一邊寫「進行中」，一邊又出現完整下月計畫。
   用 App 正式支援的 userClosedMonth 狀態結束示範月份，讓引擎自己決定 CLOSED 投影。 */
snapshot.context.monthLifecycle = {
  ...(snapshot.context.monthLifecycle || {}),
  userClosedMonth: true,
  closedAt: `${snapshot.reportDate}T00:00:00.000Z`,
  closedBy: 'USER',
  reopenedAt: '',
  reopenReason: '',
  diagnosisStaleAt: '',
};
const answered = buildDeepReportEngineResponse(snapshot);
const monthStatus = answered?.diagnosisModel?.monthState?.status;
const diagnosisStatus = answered?.diagnosisModel?.diagnosisStatus;
const pending = (answered?.diagnosisModel?.questions || []).filter(q => !q.answer);
if (monthStatus !== 'CLOSED' || diagnosisStatus !== 'FINALIZED' || pending.length) {
  throw new Error(`注入答案後診斷仍未完成（month=${monthStatus}，diagnosis=${diagnosisStatus}，未答 ${pending.length} 題：`
    + pending.map(q => q.key).join('、') + '）。App 的題目可能改過，請對照 diagnosisModel.questions 更新 DIAG_ANSWERS');
}
const openFocus = openResponse.appCurrentMonthFocus;
const closedFocus = answered.appCurrentMonthFocus;
const closedTopDiagnosis = answered.appTopDiagnoses?.[0] || closedFocus?.mainImpact || null;
const closedGoal = closedFocus?.unfinishedGoals?.[0] || null;
const openBudgetAlerts = Array.isArray(openFocus?.budgetAlerts) ? openFocus.budgetAlerts : [];
const openGoals = Array.isArray(openFocus?.goals) ? openFocus.goals : [];
const openPayments = Array.isArray(openFocus?.pendingPayments) ? openFocus.pendingPayments : [];
const demoPhonePreview = {
  sourceId: financeSourceId,
  progress: {
    stateLabel: openFocus?.heading || '本月目前',
    balanceLabel: '可用餘額',
    balance: Number(openFocus?.summary?.availableBalance) || 0,
    daysRemaining: Number(openFocus?.summary?.daysRemaining) || 0,
    activityHeading: openPayments.length ? `月底前還有 ${openPayments.length} 項待處理` : '目前沒有待繳款項',
    activityItems: openPayments.map(item => ({
      label: item.label,
      amount: Number(item.amount) || 0,
      body: item.body,
      completed: false,
    })),
    budgetAlertCount: openBudgetAlerts.length,
    budgetAlerts: openBudgetAlerts.slice(0, 1).map(item => ({
      label: item.label,
      budget: Number(item.budget) || 0,
      actual: Number(item.actual) || 0,
    })),
    goals: openGoals.map(item => ({
      label: item.label,
      planned: Number(item.planned) || 0,
      actual: Number(item.actual) || 0,
    })),
    nextMonthCardDue: Number(openResponse?.diagnosisModel?.metrics?.cards?.nextMonthDueAmount) || 0,
  },
  complete: {
    stateLabel: '本月已結束',
    balanceLabel: '可用餘額',
    balance: Number(answered?.diagnosisModel?.metrics?.cashflow?.availableBalance) || 0,
    daysRemaining: null,
    milestone: `完成第 ${snapshot.months.filter(item => Array.isArray(item.txns) && item.txns.length > 0).length} 個月的財務整理`,
    monthOutcome: {
      hasCashGap: Boolean(answered.appMonthOutcome?.flags?.hasCashShortfall),
      arrangementsComplete: !answered.appMonthOutcome?.flags?.hasUnfinishedGoals,
      title: closedFocus?.overallResult?.title || '',
    },
    topDiagnosis: closedTopDiagnosis ? {
      title: closedTopDiagnosis.title,
      body: closedTopDiagnosis.reason || closedTopDiagnosis.body || '',
      actionSummary: closedTopDiagnosis.actionSummary || '',
    } : null,
    goalGapLabel: closedGoal?.label || '',
    nextAction: '把本月重點帶進下月安排',
    activityHeading: '',
    activityItems: [],
    budgetAlertCount: 0,
    budgetAlerts: [],
    goals: closedGoal ? [{
      label: closedGoal.label,
      planned: Number(closedGoal.target) || 0,
      actual: Number(closedGoal.actual) || 0,
    }] : [],
    nextMonthCardDue: Number(answered?.diagnosisModel?.metrics?.cards?.nextMonthDueAmount) || 0,
  },
};
writeFileSync(
  join(ROOT, 'src', 'demoPhonePreviewGenerated.js'),
  `// 自動產生，請勿手改。來源由 scripts/build_app_demo.mjs 鎖定。\nexport const DEMO_PHONE_PREVIEW_GENERATED = Object.freeze(${JSON.stringify(demoPhonePreview, null, 2)});\n`,
);
const frozen = { ...answered, snapshot: { month: answered.snapshot?.month, viewMode: answered.snapshot?.viewMode } };
await page.route('**/demoReportPayload.js*', route => route.fulfill({
  status: 200,
  contentType: 'application/javascript; charset=utf-8',
  body: 'export const DEMO_REPORT_PAYLOAD = ' + JSON.stringify(frozen) + ';',
}));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
console.log('診斷完成態    答完 ' + Object.keys(DIAG_ANSWERS).length + ' 題，月份 ' + monthStatus + '，診斷 ' + diagnosisStatus);

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

/* 抓取結果的完整性檢查
   Playwright 抓到半套內容時不會報錯，產出的頁面照樣寫得出來，只是某一頁少了一大塊，
   而且 index.html 有 390 KB，少 60 KB 用看的看不出來。拿上一份產出逐頁比大小，
   明顯縮水就中止。真的是 App 改版讓某頁變小時，刪掉 public/app-demo/index.html 再跑。 */
const prev = existsSync(join(OUT_DIR, 'index.html')) ? readFileSync(join(OUT_DIR, 'index.html'), 'utf8') : '';
/* 上一份產出把各頁大小寫在 HTML 註解裡（見下方 SIZE_NOTE），直接讀，不用去猜頁面邊界 */
const prevSizes = (() => {
  const m = prev.match(/<!-- page-sizes: (\{.*?\}) -->/);
  try { return m ? JSON.parse(m[1]) : {}; } catch { return {}; }
})();
const prevSize = p => prevSizes[p] || 0;
const shrunk = PAGES.filter(p => prevSize(p) > 0 && grabbed[p].length < prevSize(p) * 0.6);
if (shrunk.length) {
  throw new Error('這幾頁抓到的內容比上一份少了四成以上，很可能是沒渲染完就抓：\n  - '
    + shrunk.map(p => `${p}：${grabbed[p].length} bytes（上一份約 ${prevSize(p)}）`).join('\n  - ')
    + '\n重跑一次；若是 App 改版讓這頁真的變小，刪掉 public/app-demo/index.html 再跑。');
}
const empty = PAGES.filter(p => grabbed[p].length < 1500);
if (empty.length) throw new Error('這幾頁幾乎是空的，抓取失敗：' + empty.join('、'));

/* 診斷完成態的把關
   注入答案後，抓下來的診斷頁必須是完成態。若還留著「待補充答案」這類字樣，
   代表 payload 沒被換掉（例如攔截路徑失效），官網就會掛著一頁自己前後矛盾的
   診斷：上面說已完成，中間又叫訪客去回答問題。 */
const UNFINISHED_MARKERS = [
  '待補充答案', '尚未建立', '補充 6 個問題', '不是正式診斷', '完成後才會指定主要問題',
  '本月仍在進行中', '下月計畫會在本月結束後產生', '完整診斷會在本月結束後整理',
];
const leftover = UNFINISHED_MARKERS.filter(m => grabbed.report.includes(m));
if (leftover.length) {
  throw new Error('診斷頁抓到的還是未完成態，出現這些字樣：' + leftover.join('、')
    + '\n可能是 demoReportPayload.js 的攔截沒生效（Vite 的模組路徑改了？），或 App 的診斷改版');
}
const CLOSED_MARKERS = ['本月最後結果', '已過完', '診斷 已完成', '下個月計畫'];
const missingClosed = CLOSED_MARKERS.filter(m => !grabbed.report.includes(m));
if (missingClosed.length) {
  throw new Error('診斷頁不是完整 CLOSED 畫面，缺少：' + missingClosed.join('、'));
}

/* 帳戶頁也要跟目前 App 同步。只抓到舊版「帳戶明細」時，數字測試仍會通過，
   但官網會漏掉新的操作列、群組與交易紀錄卡片。 */
const ACCOUNT_MARKERS = ['account-action-bar', 'account-transaction-card', '帳戶群組', '交易紀錄'];
const missingAccounts = ACCOUNT_MARKERS.filter(m => !grabbed.accounts.includes(m));
if (missingAccounts.length) {
  throw new Error('帳戶頁仍是舊介面，缺少：' + missingAccounts.join('、'));
}

/* 組裝 */
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
  /* 更多面板列出的頁面比示範頁收錄的多（帳號與方案、資料設定、疑難排解都沒收錄，
     它們的內容是登入後才有的個人資料，做成示範沒有意義）。這些按鈕點下去必須有
     回應，不能靜靜地什麼都不做，不然訪客會以為畫面壞了。 */
  var MISSING_PAGE_NOTE = '這一頁在示範版沒有收錄，正式版可以進入';
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
    if (!target) return false;
    document.querySelectorAll('.page').forEach(function (el) { el.classList.toggle('on', el === target); });
    /* 底部導覽與「更多」面板用同一組 data-p，兩邊的使用中狀態一起換 */
    document.querySelectorAll('.nb[data-p], .more-item[data-p]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.p === p);
    });
    closeMore();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
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

  /* 折頁
     示範頁沒有 App 的 JS，展開收合要自己接。這裡刻意不維護「哪些動作只是展開」
     的名單：App 每次改版都會多出幾個 toggle-*，名單永遠追不上，漏掉的按鈕會跳
     出「不會實際儲存」，但它其實只是展開一段內容，訪客看不到那段內容也不知道
     自己按錯什麼。改成看 DOM：找得到收起來的內容區就展開它，找不到才當成會改
     資料的動作攔下來。
     動作名稱只用來排除會寫入資料的按鈕（只有 toggle- 開頭的才嘗試展開），
     真正決定行為的是 DOM 裡有沒有那塊收合內容。
     App 用三種方式收合，三種都要認：inline display:none、hidden 屬性、
     .collapsible-body（max-height:0，靠 .open 展開）。 */
  function isFoldBody(el) {
    if (!el || (el.tagName !== 'DIV' && el.tagName !== 'SECTION')) return false;
    if (el.hasAttribute('hidden')) return true;
    if (el.style.display === 'none') return true;
    var cls = String(el.className || '');
    if (cls.indexOf('collapsible-body') >= 0 || cls.indexOf('ia-group-body') >= 0) return true;
    /* 診斷卡片的內容是 data-diag-body="固定支出診斷" 這種，標題用 data-diag-label 對應。
       抓下來時它是展開的（要讓內容進 HTML），所以認不到 display:none，
       改認「屬性名字以 -body 結尾」這個 App 自己標的記號。 */
    if ([].some.call(el.attributes, function (a) { return /-body$/.test(a.name); })) return true;
    return /-(body|wrap|list|inner|popover)$/.test(el.id || '');
  }

  function foldBodyFor(head) {
    /* App 自己指名 body 的就照它給的（診斷頁的卡費分組） */
    if (head.dataset.bodyId) return document.getElementById(head.dataset.bodyId);
    /* 預算四步驟：標題與箭頭包在同一層，內容在外層的下一個，
       App 用 data-budget-step 對到 #budget-step-N-body，示範頁沿用同一組對應 */
    if (head.dataset.budgetStep) return document.getElementById('budget-step-' + head.dataset.budgetStep + '-body');
    return isFoldBody(head.nextElementSibling) ? head.nextElementSibling : null;
  }

  /* 收合方式在第一次判斷時記下來。hidden 屬性一旦被移掉就認不出原本是哪一種，
     記在 dataset 上，開合來回幾次都用同一種方式。 */
  function foldMode(body) {
    if (!body.dataset.demoFold) {
      body.dataset.demoFold = String(body.className || '').indexOf('collapsible-body') >= 0 ? 'class'
        : (body.hasAttribute('hidden') ? 'hidden' : 'display');
    }
    return body.dataset.demoFold;
  }

  function isFoldOpen(body) {
    var mode = foldMode(body);
    if (mode === 'class') return body.classList.contains('open');
    if (mode === 'hidden') return !body.hidden;
    return body.style.display !== 'none';
  }

  /* 箭頭字元的開合對應。只認這幾個字，其他文字不動。 */
  var ARROW_OPEN = { '▸': '▾', '⌄': '⌃' };
  var ARROW_CLOSED = { '▾': '▸', '⌃': '⌄' };
  function syncFoldHead(head, open) {
    if (head.hasAttribute('aria-expanded')) head.setAttribute('aria-expanded', String(open));
    var map = open ? ARROW_OPEN : ARROW_CLOSED;
    head.querySelectorAll('*').forEach(function (el) {
      if (el.children.length) return;
      var t = el.textContent.trim();
      if (map[t]) el.textContent = map[t];
    });
  }

  function setFoldOpen(head, body, open) {
    var mode = foldMode(body);
    if (mode === 'class') body.classList.toggle('open', open);
    else if (mode === 'hidden') body.hidden = !open;
    else body.style.display = open ? 'block' : 'none';
    syncFoldHead(head, open);
  }

  function toggleFold(head) {
    var body = foldBodyFor(head);
    if (!body) return false;
    setFoldOpen(head, body, !isFoldOpen(body));
    return true;
  }

  /* 目標追蹤的三個分類（持續儲蓄／未來預存／時效性儲蓄）沒有 data-action，
     用 data-sav-mgr-section 對到 #<id>-body，收合方式也自己一套
     （height:0 + data-collapsed），跟 App 的 toggleSavMgrSection 對齊。 */
  function toggleSavSection(head) {
    var id = head.dataset.savMgrSection;
    var body = document.getElementById(id + '-body');
    if (!body) return false;
    var open = body.dataset.collapsed === '1';
    body.dataset.collapsed = open ? '0' : '1';
    body.style.height = open ? '' : '0';
    body.style.opacity = open ? '1' : '0';
    body.style.overflow = open ? '' : 'hidden';
    var arrow = document.getElementById(id + '-arrow');
    if (arrow) arrow.textContent = open ? '▾' : '▸';
    head.setAttribute('aria-expanded', String(open));
    var bar = document.getElementById(id + '-bar');
    if (bar) bar.style.borderRadius = open ? '8px 8px 0 0' : '8px';
    return true;
  }

  /* 「查看其他比較數據」的內容不在標題旁邊，是同一張卡裡標了 .diag-compare-extra
     的那幾列（App 的 toggleMonthCompareExtra 也是這樣找的）。 */
  function toggleCompareExtra(head) {
    var scope = head.closest('.card') || document;
    var rows = scope.querySelectorAll('.diag-compare-extra');
    if (!rows.length) return false;
    var open = rows[0].hasAttribute('hidden');
    rows.forEach(function (r) { r.hidden = !open; });
    var label = head.querySelector('.diag-compare-extra-label');
    if (label) label.textContent = open ? '收合其他比較數據' : '查看其他比較數據';
    syncFoldHead(head, open);
    return true;
  }

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
    if (navBtn) {
      if (!goPage(navBtn.dataset.p)) toast(MISSING_PAGE_NOTE);
      return;
    }

    var goBtn = e.target.closest('[data-go-page]');
    if (goBtn) {
      var dest = goBtn.dataset.goPage;
      if (!goPage(dest)) toast(MISSING_PAGE_NOTE);
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

    /* 目標追蹤的分類列：跟 App 一樣，列上的 ℹ 說明鈕（帶 data-action）優先 */
    var savHead = e.target.closest('[data-sav-mgr-section]');
    if (savHead && !e.target.closest('[data-action]') && toggleSavSection(savHead)) return;

    var actEl = e.target.closest('[data-action]');
    if (actEl) {
      var act = actEl.dataset.action;
      e.preventDefault();
      if (act === 'toggle-month-compare-extra' && toggleCompareExtra(actEl)) return;
      /* 預算頁的「前往這一步」：展開那一步並捲過去，箭頭跟著那一步的標題一起翻 */
      if (act === 'jump-budget-workflow-step' && actEl.dataset.budgetStep) {
        var stepBody = foldBodyFor(actEl);
        if (stepBody) {
          var stepHead = document.querySelector('[data-action="toggle-budget-workflow-step"][data-budget-step="'
            + actEl.dataset.budgetStep + '"]');
          setFoldOpen(stepHead || actEl, stepBody, true);
          stepBody.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      if (act.indexOf('toggle-') === 0 && toggleFold(actEl)) return;
      toast('這是示範帳戶，不會實際儲存。開始使用後就能操作');
      return;
    }

    // 沒有 data-action 的折頁標題（診斷頁有幾處是直接綁在標題列上的）
    var arr = e.target.closest('.d-arr, .collapse-arrow');
    if (arr && arr.parentElement && toggleFold(arr.parentElement)) return;

    /* 個人／公費／家庭：快照只有個人視角的資料，說清楚比丟一句「不會儲存」準確 */
    if (e.target.closest('[data-page-view-mode], [data-budget-mode]')) {
      toast('示範版只放個人視角的資料，公費與家庭在正式版可以切換');
      return;
    }
    /* 記帳明細的篩選：靜態頁沒有篩選運算，明細固定顯示全部 */
    if (e.target.closest('[data-filter]')) {
      toast('示範版的記帳明細固定顯示全部，篩選在正式版可以用');
      return;
    }

    /* 收尾：按得下去的東西一定要有回應。示範頁最容易壞掉的地方就是 App 改版後
       多出幾顆沒人接手的按鈕，點下去毫無反應，訪客會以為畫面當掉。
       這一段保證最差也有提示，不會靜靜地什麼都不做。 */
    if (e.target.closest('button, [role="button"], [aria-controls], [data-sav-mgr-section]')) {
      toast('這是示範帳戶，不會實際儲存。開始使用後就能操作');
    }
  });

  /* 表單可以填，但送出一律攔下 */
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    toast('這是示範帳戶，不會實際儲存。開始使用後就能操作');
  });

  /* 更多面板的項目也帶 data-p，快照抓取當下停在哪一頁，那一項就被標成使用中，
     訪客一打開面板會看到不相干的項目亮著。初始化時對齊實際在看的頁面。 */
  var startPage = (document.querySelector('.page.on') || {}).id || '';
  document.querySelectorAll('.nb[data-p], .more-item[data-p]').forEach(function (b) {
    b.classList.toggle('on', 'pg-' + b.dataset.p === startPage);
  });

  /* 診斷頁預設停在「本月重點」 */
  if (document.getElementById('report-tab-overview')) goTab('overview');

  /* 折頁的初始狀態
     診斷卡片在抓取時被逐一點開過（內容才會進 HTML），這裡收回去讓訪客自己點。 */
  document.querySelectorAll('[data-action="toggle-diag"]').forEach(function (head) {
    var body = foldBodyFor(head);
    if (body) setFoldOpen(head, body, false);
  });
  /* 其餘折頁維持 App 給的狀態，只把箭頭與 aria 對齊實際狀態：
     快照裡有幾處箭頭是展開的樣子、內容卻是收起來的（抓取當下的中間狀態）。 */
  document.querySelectorAll('[data-action^="toggle-"]').forEach(function (head) {
    var body = foldBodyFor(head);
    if (body) syncFoldHead(head, isFoldOpen(body));
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
<meta name="88la-finance-source" content="${financeSourceId}">
<link rel="stylesheet" href="./app.css">
<style>${SHELL_CSS}</style>
</head>
<body>

<!-- 這份頁面由 scripts/build_app_demo.mjs 產生，請勿手改；要更新請重跑 npm run build:demo -->
<!-- finance-source: ${financeSourceId} -->
<!-- page-sizes: ${JSON.stringify(Object.fromEntries(PAGES.map(p => [p, grabbed[p].length])))} -->

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

const normalizedHtml = html.replace(/[ \t]+$/gm, '');
writeFileSync(join(OUT_DIR, 'index.html'), normalizedHtml);

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log('');
console.log('產出  public/app-demo/index.html  ' + kb(normalizedHtml.length));
console.log('      public/app-demo/app.css     ' + kb(readFileSync(join(OUT_DIR, 'app.css')).length));
console.log('      復刻頁面 ' + PAGES.length + ' 頁：' + PAGES.map(p => PAGE_LABEL[p]).join('、'));
console.log('      src/demoPhonePreviewGenerated.js');
console.log('      Finance source ' + financeSourceId);
await stopFinanceServer();
process.removeListener('exit', stopOnExit);
