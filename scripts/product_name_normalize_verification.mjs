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
