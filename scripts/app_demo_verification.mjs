/**
 * 官網示範頁的數字驗算
 *
 * 示範頁大部分內容是 88la-finance 示範帳戶的真實渲染快照，那些數字由 App 算出來，
 * 這裡不重算。要驗的是 build_app_demo.mjs 裡「診斷完成態」那幾段人工撰寫的內容：
 * 它們引用與延伸了示範帳戶的數字，算錯就是官網對外掛著一份自相矛盾的診斷。
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'public', 'app-demo', 'index.html'), 'utf8');

/* 示範帳戶 2026-08 的事實，取自 88la-finance/src/demoData.js 與快訊頁實際畫面 */
const F = {
  income: 42000,
  fixedBudget: 16800, fixedActual: 20289,
  varBudget: 9600, varActual: 9885,
  savingTarget: 8000, savingActual: 4000,
  cardDue: 13794, balance: 2876, cashExpense: 21330,
  carInsurance: 3600,          // 半年繳車險，本月一次入帳
  shoppingActual: 4540, shoppingBudget: 2500,
  shoppingClothes: 1450, shoppingSkincare: 1290, shoppingImpulse: 1800,
  impulseThis: 1950, impulseLast: 3175, impulseCount: 4,
};

/* 下月計畫的調整（人工撰寫，必須自洽） */
const P = { fixed: 17400, variable: 11100, saving: 6000, total: 34500,
            carMonthly: 600, shoppingNew: 3000, adhoc: 1000 };

const checks = [
  ['固定超支',        F.fixedActual - F.fixedBudget, 3489],
  ['變動超支',        F.varActual - F.varBudget, 285],
  ['儲蓄缺口',        F.savingTarget - F.savingActual, 4000],
  ['可用餘額',        F.income - F.cashExpense - F.cardDue - F.savingActual, F.balance],
  ['固定達成率(%)',   Math.round(F.fixedActual / F.fixedBudget * 100), 121],
  ['變動達成率(%)',   Math.round(F.varActual / F.varBudget * 100), 103],
  ['衝動消費降幅(%)', Math.round((F.impulseLast - F.impulseThis) / F.impulseLast * 100), 39],
  ['車險月攤提',      F.carInsurance / 6, P.carMonthly],
  ['購物拆解合計',    F.shoppingClothes + F.shoppingSkincare + F.shoppingImpulse, F.shoppingActual],
  ['購物計畫內小計',  F.shoppingClothes + F.shoppingSkincare, 2740],
  ['9月固定預算',     F.fixedBudget + P.carMonthly, P.fixed],
  ['9月變動預算',     F.varBudget + (P.shoppingNew - F.shoppingBudget) + P.adhoc, P.variable],
  ['9月預算合計',     P.fixed + P.variable + P.saving, P.total],
  ['9月預算不超收入', P.total < F.income ? 1 : 0, 1],
];

/* 這些數字必須真的印在頁面上，才算驗到「畫面顯示的」而不只是算式 */
const mustAppear = [
  '$3,489', '$4,000', '$2,876', '$13,794', '$20,289', '$16,800',
  '$17,400', '$11,100', '$6,000', '$34,500', '$600', '$3,000', '$1,000',
  '$2,740', '$1,800', '$1,450', '$1,290', '121%', '103%',
];

/* 完成態不該再出現的未完成態字句 */
const mustNotAppear = ['待補充答案', '尚未建立', '下月計畫尚未產生', '本月初步檢查完成',
                       '回答 6 題', '不是正式診斷', '88La 財務導航', '—', '–'];

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
console.log(bad === 0
  ? `全部通過（${checks.length} 項計算、${mustAppear.length} 個顯示數字、${mustNotAppear.length} 項禁用字句）`
  : `${bad} 項不符`);
process.exit(bad === 0 ? 0 : 1);
