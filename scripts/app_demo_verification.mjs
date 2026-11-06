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
  // 11 月預算：房租 13,000＋保險 1,200＋通訊 600＋運動 1,500＋娛樂 500＋外食 2,500＋食材 2,800
  // ＋交通 1,800＋購物 2,500＋頭期款 7,600＋緊急備用金 8,000＝42,000，等於收入，所以待分配 0。
  budgetItemsTotal: 13000 + 1200 + 600 + 1500 + 500 + 2500 + 2800 + 1800 + 2500 + 7600 + 8000,
};

// 下月計畫（2026-11 對齊 App）：小琳對食材、交通都回答「不減少次數」，App 現在的規則是
// 證據不足以判定常態時先維持原預算再觀察，不再自動調高；所以下月預算＝本月預算。
const P = {
  periodicReserveMonthly: 600,
  groceryNew: 2800,
  transitNew: 1800,
  pendingAfter: 0,
};

const checks = [
  ['canonical 可用餘額', F.income - F.cashExpense - F.cardDue - F.savings, F.balance],
  ['固定超支', F.fixedActual - F.fixedBudget, 3489],
  ['變動總額超支', F.variableGrossActual - F.variableBudget, 2235],
  ['變動性質拆分', F.variableNormalActual + F.variableTemporaryActual + F.variableImpulseActual, F.variableGrossActual],
  ['正常日常低於預算', F.variableBudget - F.variableNormalActual, 1445],
  ['儲蓄缺口', F.savingTarget - F.savings, 4000],
  ['食材下月維持原預算', F.groceryBudget, P.groceryNew],
  ['交通下月維持原預算', F.transitBudget, P.transitNew],
  ['下月待分配', F.income - F.budgetItemsTotal - (P.groceryNew - F.groceryBudget) - (P.transitNew - F.transitBudget), P.pendingAfter],
  ['週期性扣除後固定基準剩餘', F.fixedBudget - (F.fixedActual - 3600), 111],
  ['半年繳保險每月預存', 3600 / 6, P.periodicReserveMonthly],
];

const mustAppear = [
  '<meta name="88la-finance-source"',
  '<!-- finance-source:',
  // 2026-11 對齊 App 現行月底文案（本月結論、判斷依據、下月預算調整）
  '<h2>這個月的錢不夠把原本安排都完成。</h2>',
  '<strong>固定與變動支出都超出原安排</strong>',
  '固定支出超出預算 $3,489，變動支出超出預算 $2,235。',
  '扣除臨時性支出與衝動消費 $3,680 後，日常支出沒有超出預算。',
  '扣除臨時性支出與衝動消費 $3,680 後，變動支出 $8,155 仍在預算內，剩餘 $1,445',
  '<strong>半年繳保險沒有提前預存</strong>',
  '儲蓄未達標，還差 $4,000',
  '之後每月預存 $600 給「保險」',
  '每月固定支出基準為 $16,689，仍在預算內，剩餘 $111。這不代表下月應把整筆週期金額加進固定預算。',
  '替週期性支出建立每月預存',
  '「飲食-食材」下個月先維持原預算 $2,800',
  '「交通」下個月先維持原預算 $1,800',
  '預算已分配到 $0 ✓',
  '本月可用餘額',
  '可用餘額 <span id="d-card-compact-balance">$2,876</span>',
  '還完後剩 $2,876',
  '<small id="d-card-overview-status">已納入可用餘額計算</small>',
  '<span>本月診斷 已整理</span>',
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
  '$2,800 → $2,900',
  '$1,800 → $2,000',
  '已逾期',
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
