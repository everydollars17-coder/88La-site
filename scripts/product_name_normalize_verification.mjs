#!/usr/bin/env node
// App 改名驗證：Firestore 裡存的舊名要在讀取時換成新名，
// 但 Google Sheets 模板「理財自動導航器 2.0」是另一個產品，不能被改到。
//
// 測資全部取自 2026-08-17 線上實際抓下來的文字。

const APP_PRODUCT_NAME = '88La財務導航';
const PRODUCT_NAME_PATTERNS = [
  '88La 理財自動導航器',
  '88La理財自動導航器',
  '88La 理財導航器',
  '88La理財導航器',
];
const BARE_APP_NAME = /理財自動導航器(?!\s*2\.0)/g;
const normalizeProductText = value => {
  if (typeof value !== 'string') return value;
  return PRODUCT_NAME_PATTERNS.reduce((text, pattern) => text.split(pattern).join(APP_PRODUCT_NAME), value)
    .replace(BARE_APP_NAME, APP_PRODUCT_NAME);
};

const CASES = [
  // [說明, 輸入, 期望輸出]
  ['首頁分流路徑（Firestore）', '用 88La理財自動導航器，把記帳變成看得懂的方向。', '用 88La財務導航，把記帳變成看得懂的方向。'],
  ['App 頁主標（Firestore）', '理財自動導航器', '88La財務導航'],
  ['帶空格的舊名', '88La 理財自動導航器 訂閱方案', '88La財務導航 訂閱方案'],
  ['短舊名', '88La理財導航器', '88La財務導航'],
  ['帶空格短舊名', '88La 理財導航器', '88La財務導航'],
  ['模板產品名（不可改）', '理財自動導航器 2.0', '理財自動導航器 2.0'],
  ['模板產品描述（不可改）', '理財自動導航器 2.0 是純 Google Sheets 模板，自動模式偵測。', '理財自動導航器 2.0 是純 Google Sheets 模板，自動模式偵測。'],
  ['模板無空格寫法（不可改）', '理財自動導航器2.0', '理財自動導航器2.0'],
  ['同句兩個產品', '理財自動導航器 2.0 是模板，88La理財自動導航器 是 App。', '理財自動導航器 2.0 是模板，88La財務導航 是 App。'],
  ['已是新名不重複代換', '88La財務導航完整功能', '88La財務導航完整功能'],
  ['免責聲明句', '88La 理財自動導航器（以下簡稱「本服務」）為個人記帳工具。', '88La財務導航（以下簡稱「本服務」）為個人記帳工具。'],
];

const rows = CASES.map(([name, input, expect]) => {
  const actual = normalizeProductText(input);
  return { name, input, expect, actual, pass: actual === expect };
});

const pad = (s, n) => { let l = 0; for (const c of s) l += /[⺀-鿿＀-￯]/.test(c) ? 2 : 1; return s + ' '.repeat(Math.max(1, n - l)); };
console.log('\n=== App 改名驗證：輸入 → 期望 → 實際 ===\n');
for (const r of rows) {
  console.log(pad(r.name, 30) + (r.pass ? '✅' : '❌'));
  if (!r.pass) {
    console.log('   輸入：' + r.input);
    console.log('   期望：' + r.expect);
    console.log('   實際：' + r.actual);
  }
}
const failed = rows.filter(r => !r.pass);
console.log(`\n共 ${rows.length} 項，通過 ${rows.length - failed.length}，不合格 ${failed.length}\n`);
if (failed.length) process.exitCode = 1;

// ── demoStory 舊文案偵測 ──────────────────────────────────────
// 舊文案的每一句都跟重新配平後的示範帳戶對不上，必須在讀取時換掉。
// 但只認舊文案獨有的句子，Barbara 自己改寫過的版本不能被蓋掉。
const STALE_DEMO_STORY_MARKERS = {
  personaFacts: ['NT$150,000 頭期款基金', '日常消費卡'],
  findings: ['高出 62%', '出現負值缺口'],
  suggestions: ['網購類別預算下修', '聚餐類別出現 3 次'],
};
const NEW_DEMO_STORY = { personaFacts: '新人設', findings: '新發現', suggestions: '新建議' };
const normalizeDemoStory = story => {
  const next = { ...NEW_DEMO_STORY, ...(story || {}) };
  for (const [field, markers] of Object.entries(STALE_DEMO_STORY_MARKERS)) {
    const stored = next[field];
    if (typeof stored === 'string' && markers.some(m => stored.includes(m))) next[field] = NEW_DEMO_STORY[field];
  }
  return next;
};

// 線上 Firestore 目前實際存的內容（2026-08-17 抓取）
const LIVE = {
  personaFacts: '月薪 NT$42,000，台北租屋，每月房租 NT$13,000\n兩張信用卡：日常消費卡 ＋ 網購回饋卡\n目標：一年內存到 NT$150,000 頭期款基金\n有記帳習慣但常常「記了，然後呢？」',
  findings: '系統偵測到：本月網購類別支出比預算高出 62%\n信用卡預留卡費已超過本月現金結餘，出現負值缺口\n儲蓄目標進度落後，以目前速度需要多花 4 個月才能達標',
  suggestions: '建議下個月網購類別預算下修 NT$3,000，轉移到卡費預留\n聚餐類別出現 3 次非計畫性支出，建議設定週間現金額度提醒自己',
};

const d1 = normalizeDemoStory(LIVE);
const dRows = [
  ['線上舊人設 → 換成新的', d1.personaFacts, '新人設'],
  ['線上舊發現 → 換成新的', d1.findings, '新發現'],
  ['線上舊建議 → 換成新的', d1.suggestions, '新建議'],
];
// Barbara 之後自己改寫的版本不可被蓋掉
const HERS = { personaFacts: '小琳，30 歲，自由接案', findings: '這個月房租佔了六成', suggestions: '先把固定支出抓準' };
const d2 = normalizeDemoStory(HERS);
dRows.push(
  ['她改寫的人設 → 保留', d2.personaFacts, HERS.personaFacts],
  ['她改寫的發現 → 保留', d2.findings, HERS.findings],
  ['她改寫的建議 → 保留', d2.suggestions, HERS.suggestions],
);
// 只有一欄是舊的時，其餘欄位不受影響
const d3 = normalizeDemoStory({ ...HERS, findings: LIVE.findings });
dRows.push(
  ['混合：舊的那欄換掉', d3.findings, '新發現'],
  ['混合：她的那欄保留', d3.personaFacts, HERS.personaFacts],
);
// Firestore 完全沒存過時吃預設值
const d4 = normalizeDemoStory(null);
dRows.push(['Firestore 無資料 → 用預設', d4.findings, '新發現']);

console.log('=== demoStory 舊文案汰換驗證 ===\n');
let dFail = 0;
for (const [name, actual, expect] of dRows) {
  const ok = actual === expect;
  if (!ok) dFail++;
  console.log(pad(name, 30) + (ok ? '✅' : `❌ 期望「${expect}」實際「${actual}」`));
}
console.log(`\n共 ${dRows.length} 項，通過 ${dRows.length - dFail}，不合格 ${dFail}\n`);
if (dFail) process.exitCode = 1;
