/**
 * 官網示範頁的數字驗算
 *
 * 示範頁是 88la-finance 示範帳戶的真實渲染快照，診斷內容則是把小琳的答案注入
 * 診斷引擎重算出來的（見 scripts/build_app_demo.mjs 的 DIAG_ANSWERS）。頁面上
 * 沒有任何人工撰寫的金額，所以這裡不重寫一套算法，而是驗兩件事：
 *   1. 畫面上並列的數字彼此對得起來（每一組並列的框就是一個算式）
 *   2. 該出現的數字真的印在頁面上，該消失的未完成態字樣真的不見了
 * 這兩件事會在 demoData.js 改金額、或引擎改口徑時失敗，那正是要有人回來看的時候。
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'public', 'app-demo', 'index.html'), 'utf8');
const demoCss = readFileSync(join(ROOT, 'public', 'app-demo', 'app.css'), 'utf8');
const financeCss = readFileSync(join(ROOT, '..', '88la-finance', 'src', 'style.css'), 'utf8');

/* 示範帳戶 2026-08 的事實，取自 88la-finance/src/demoData.js 與快訊頁實際畫面 */
const F = {
  income: 42000,
  fixedBudget: 16800, fixedActual: 20289,
  varBudget: 9600, varActual: 9885,      // 變動淨額（不含衝動消費）
  varGrossActual: 11835,                  // 變動總額（含衝動消費 $1,950）
  savingTarget: 8000, savingActual: 4000,
  cardDue: 13794, balance: 2876, cashExpense: 21330,
  carInsurance: 3600,                     // 半年繳車險，本月一次入帳
  insuranceBudget: 1200, insuranceActual: 4800,
  groceryBudget: 2800, groceryActual: 2910,
  transitBudget: 1800, transitActual: 2000,
  shoppingActual: 4540, shoppingClothes: 1450, shoppingSkincare: 1290, shoppingImpulse: 1800,
  impulseThis: 1950, impulseLast: 3175,
  // 預算頁的待分配金額，下月計畫的「待分配」是從它扣掉調整後的餘額
  pendingAllocBefore: 4600,
};

/* 引擎依小琳的答案算出的 9 月調整（顯示在下月計畫，不是人工寫的） */
const P = {
  insuranceNew: 4800, groceryNew: 2900, transitNew: 2000,
  pendingAllocAfter: 700, cardRatio: 33,
};

const checks = [
  ['固定超支',          F.fixedActual - F.fixedBudget, 3489],
  ['儲蓄缺口',          F.savingTarget - F.savingActual, 4000],
  ['可用餘額',          F.income - F.cashExpense - F.cardDue - F.savingActual, F.balance],
  ['衝動消費降幅(%)',   Math.round((F.impulseLast - F.impulseThis) / F.impulseLast * 100), 39],
  ['購物拆解合計',      F.shoppingClothes + F.shoppingSkincare + F.shoppingImpulse, F.shoppingActual],
  // 變動支出的兩個口徑要對得起來，不能是兩套各自算出來的數字
  ['變動總額(含衝動)',  F.varActual + F.impulseThis, F.varGrossActual],
  ['變動總額超支',      F.varGrossActual - F.varBudget, 2235],
  // 下月計畫的三筆預算調整：每一筆都要能從本月實際推出來
  ['保險新預算',        F.insuranceBudget + F.carInsurance, P.insuranceNew],
  ['保險本月實際',      F.insuranceBudget + F.carInsurance, F.insuranceActual],
  ['保險調幅',          P.insuranceNew - F.insuranceBudget, 3600],
  ['食材新預算(百位)',  Math.round(F.groceryActual / 100) * 100, P.groceryNew],
  ['食材調幅',          P.groceryNew - F.groceryBudget, 100],
  ['交通新預算',        F.transitActual, P.transitNew],
  ['交通調幅',          P.transitNew - F.transitBudget, 200],
  ['調整後待分配',      F.pendingAllocBefore - (3600 + 100 + 200), P.pendingAllocAfter],
  ['三筆調整合計',      3600 + 100 + 200, 3900],
  // 其他行動裡的比例
  ['刷卡佔收入(%)',     Math.round(F.cardDue / F.income * 100), P.cardRatio],
];

/* 這些數字必須真的印在頁面上，才算驗到「畫面顯示的」而不只是算式 */
const mustAppear = [
  '$2,876', '$13,794', '$20,289', '$16,800', '$9,600',
  '$1,200', '$4,800', '$3,600', '$2,800', '$2,900', '$2,910', '$1,800', '$2,000',
  '$700', '$4,000', '$8,000', '$1,950', '$3,175', '$3,489', '$2,235',
  '$11,835', '$4,540', '$1,450', '$1,290', '$42,000', '33%', '39%',
  '本月最後結果', '已過完', '診斷 已完成', 'account-action-bar', 'account-transaction-card', '帳戶群組', '交易紀錄',
];

const forbiddenDashes = [String.fromCodePoint(0x2014), String.fromCodePoint(0x2013)];

/* 完成態不該再出現的未完成態字句，以及舊版人工文案的殘跡 */
const mustNotAppear = [
  // 診斷沒切成完成態時會出現的字樣（payload 沒被換掉就會留著）
  '待補充答案', '尚未建立', '補充 6 個問題', '不是正式診斷', '完成後才會指定主要問題',
  '先完成關鍵判斷', '本月初步檢查完成',
  // OPEN 月份只能顯示財務雷達。官網展示完整診斷時，月份狀態必須已結束
  '本月仍在進行中', '下月計畫會在本月結束後產生', '完整診斷會在本月結束後整理',
  // 2026-08-25 之前示範頁的診斷是人工寫的，這幾句是它獨有的。再出現就是又改回手寫了
  '攤成每月', '小琳已補齊', '本月三個重點',
  // 破折號零容忍，與名稱寫錯
  ...forbiddenDashes, '88La 財務導航',
];

let bad = 0;
console.log('項目'.padEnd(20), '計算'.padStart(9), '期望'.padStart(9), '  結果');
console.log('-'.repeat(56));
for (const [name, got, want] of checks) {
  const ok = got === want;
  if (!ok) bad++;
  console.log(name.padEnd(20), String(got).padStart(9), String(want).padStart(9), ok ? '  PASS' : '  FAIL');
}
console.log('-'.repeat(56));
for (const n of mustAppear) {
  if (!html.includes(n)) { console.log(`FAIL 頁面上找不到 ${n}`); bad++; }
}
for (const n of mustNotAppear) {
  if (html.includes(n)) { console.log(`FAIL 頁面仍出現「${n}」`); bad++; }
}
if (demoCss !== financeCss) {
  console.log('FAIL public/app-demo/app.css 不是目前 88la-finance/src/style.css 的完整副本');
  bad++;
}
console.log(bad === 0
  ? `全部通過（${checks.length} 項計算、${mustAppear.length} 個顯示數字、${mustNotAppear.length} 項禁用字句）`
  : `${bad} 項不符`);
process.exit(bad === 0 ? 0 : 1);
