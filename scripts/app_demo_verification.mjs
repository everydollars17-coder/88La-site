#!/usr/bin/env node
/**
 * 官網完整 Demo 的端到端一致性驗算。
 *
 * 這裡只驗證正式 Finance Demo 已算出的同一份結果，不另建診斷公式。
 * Finance 原始資料、引擎、App 畫面與 CSS 必須來自同一個 FINANCE_ROOT。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FINANCE = resolve(process.env.FINANCE_ROOT || join(ROOT, '..', '88la-finance'));
const html = readFileSync(join(ROOT, 'public', 'app-demo', 'index.html'), 'utf8');
const demoCss = readFileSync(join(ROOT, 'public', 'app-demo', 'app.css'), 'utf8');
const financeCss = readFileSync(join(FINANCE, 'src', 'style.css'), 'utf8');
const generator = readFileSync(join(ROOT, 'scripts', 'build_app_demo.mjs'), 'utf8');

const F = {
  income: 42000,
  cashExpense: 21330,
  cardDue: 13794,
  savings: 4000,
  balance: 2876,
  fixedBudget: 16800,
  fixedActual: 20289,
  variableBudget: 9600,
  variableGrossActual: 11835,
  variableNormalActual: 8155,
  variableTemporaryActual: 1730,
  variableImpulseActual: 1950,
  savingTarget: 8000,
  groceryBudget: 2800,
  groceryActual: 2910,
  transitBudget: 1800,
  transitActual: 2000,
  pendingBefore: 4600,
};

const P = {
  periodicReserveMonthly: 600,
  groceryNew: 2900,
  transitNew: 2000,
  pendingAfter: 4300,
};

const checks = [
  ['canonical 可用餘額', F.income - F.cashExpense - F.cardDue - F.savings, F.balance],
  ['固定超支', F.fixedActual - F.fixedBudget, 3489],
  ['變動總額超支', F.variableGrossActual - F.variableBudget, 2235],
  ['變動性質拆分', F.variableNormalActual + F.variableTemporaryActual + F.variableImpulseActual, F.variableGrossActual],
  ['正常日常低於預算', F.variableBudget - F.variableNormalActual, 1445],
  ['儲蓄缺口', F.savingTarget - F.savings, 4000],
  ['食材新預算', Math.round(F.groceryActual / 100) * 100, P.groceryNew],
  ['交通新預算', F.transitActual, P.transitNew],
  ['調整後待分配', F.pendingBefore - (P.groceryNew - F.groceryBudget) - (P.transitNew - F.transitBudget), P.pendingAfter],
  ['半年繳保險每月預存', 3600 / 6, P.periodicReserveMonthly],
];

const mustAppear = [
  '<meta name="88la-finance-source"',
  '<!-- finance-source:',
  '本月沒有現金缺口，但原訂財務安排沒有全部完成。',
  '正常日常支出低於預算 $1,445',
  '扣除臨時與衝動支出 $3,680 後，正常日常變動支出 $8,155 仍在預算內，剩餘 $1,445',
  '最值得注意',
  '「保險」有週期性支出，但每月準備不足。',
  '儲蓄還差 $4,000',
  '之後每月預存 $600 給「保險」',
  '這不代表下月應把整筆週期金額加進固定預算。',
  '替週期性支出建立每月預存',
  '$2,800 → $2,900',
  '$1,800 → $2,000',
  '安排剩餘 $4,300',
  '本月可用餘額',
  '納入後可用餘額 <span id="d-card-compact-balance">$2,876</span>',
  '還完後預計剩 $2,876',
  '還完後剩 $2,876',
  '本期卡費 $13,794 已納入可用餘額計算',
  '診斷 已完成',
  '下月計畫 待分配未歸零',
  'account-action-bar',
  'account-transaction-card',
];

const mustNotAppear = [
  '待補充答案',
  '尚未建立',
  '補充 6 個問題',
  '不是正式診斷',
  '完成後才會指定主要問題',
  '先完成關鍵判斷',
  '本月仍在進行中',
  '下月計畫會在本月結束後產生',
  '完整診斷會在本月結束後整理',
  '資料需要同步',
  '-$5,063',
  '下個月先把保險預算調到 $4,800',
  '保險</div><div class="diag-plan-values mono">$1,200 → $4,800',
  '日常變動支出 $9,885',
  '先重抓固定支出基準',
  String.fromCodePoint(0x2014),
  String.fromCodePoint(0x2013),
  '88La 財務導航',
];

let bad = 0;
console.log('項目'.padEnd(26), '計算'.padStart(9), '期望'.padStart(9), '  結果');
console.log('-'.repeat(62));
for (const [name, actual, expected] of checks) {
  const pass = actual === expected;
  if (!pass) bad += 1;
  console.log(name.padEnd(26), String(actual).padStart(9), String(expected).padStart(9), pass ? '  PASS' : '  FAIL');
}
console.log('-'.repeat(62));
for (const value of mustAppear) {
  if (!html.includes(value)) {
    console.log(`FAIL 頁面上找不到 ${value}`);
    bad += 1;
  }
}
for (const value of mustNotAppear) {
  if (html.includes(value)) {
    console.log(`FAIL 頁面仍出現「${value}」`);
    bad += 1;
  }
}
if (demoCss !== financeCss) {
  console.log('FAIL public/app-demo/app.css 與 FINANCE_ROOT/src/style.css 不一致');
  bad += 1;
}
const generatorChecks = [
  ['產生器使用 FINANCE_ROOT', generator.includes('process.env.FINANCE_ROOT')],
  ['產生器自行啟動 Finance dev server', generator.includes("'run', 'dev'")],
  ['產生器寫入來源標記', generator.includes('88la-finance-source')],
  ['產生器拒絕過期答案', generator.includes('staleAnswerKeys') && generator.includes('missingAnswerKeys')],
  ['產生器不再接受 DEMO_SRC', !generator.includes('process.env.DEMO_SRC')],
];
for (const [name, pass] of generatorChecks) {
  if (!pass) {
    console.log(`FAIL ${name}`);
    bad += 1;
  }
}

console.log(bad === 0
  ? `全部通過，${checks.length} 項計算、${mustAppear.length} 個必要內容、${mustNotAppear.length} 個禁用內容與 ${generatorChecks.length} 項來源檢查`
  : `${bad} 項不符`);
process.exit(bad === 0 ? 0 : 1);
