#!/usr/bin/env node
// 官網 Demo 手機預覽驗證
//
// 所有顯示數字由 build_app_demo.mjs 從 Finance 引擎產生，差額只在這裡驗算。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DEMO_PHONE_PREVIEW, deriveDemoPhonePreview } from '../src/demoPhonePreviewData.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const appSource = readFileSync(join(ROOT, 'src', 'App.jsx'), 'utf8');
const dataSource = readFileSync(join(ROOT, 'src', 'demoPhonePreviewData.js'), 'utf8');
const generatedSource = readFileSync(join(ROOT, 'src', 'demoPhonePreviewGenerated.js'), 'utf8');
const demoHtml = readFileSync(join(ROOT, 'public', 'app-demo', 'index.html'), 'utf8');
const progress = deriveDemoPhonePreview('progress');
const complete = deriveDemoPhonePreview('complete');

const checks = [];
const check = (item, expected, actual) => {
  const pass = String(expected) === String(actual);
  checks.push({ item, expected: String(expected), actual: String(actual), pass });
};

check('進行中狀態標題', '本月目前', progress.stateLabel);
check('進行中可用餘額', 2876, progress.balance);
check('進行中距月底天數', 4, progress.daysRemaining);
check('進行中待處理數', 0, progress.activityItems.length);
check('進行中預算提醒總數', 4, progress.budgetAlertCount);
check('進行中預算提醒顯示數', 1, progress.budgetAlerts.length);
check('保險超支算式', 3600, progress.budgetAlerts[0]?.actual - progress.budgetAlerts[0]?.budget);
check('保險顯示超支', 3600, progress.budgetAlerts[0]?.over);
check('進行中未完成目標數', 1, progress.unfinishedGoalCount);
check('儲蓄目標差額', 4000, progress.goals.find(item => item.label === '儲蓄目標')?.remaining);
check('進行中下月卡費', 0, progress.nextMonthCardDue);

check('已結束狀態標題', '本月已結束', complete.stateLabel);
check('已結束可用餘額', 2876, complete.balance);
check('已結束里程碑', '完成第 6 個月的財務整理', complete.milestone);
check('已結束下月卡費', 0, complete.nextMonthCardDue);
check('整月結果不由局部超支取代', '本月沒有現金缺口，但原訂財務安排沒有全部完成。', complete.monthOutcome?.title);
check('整月結果沒有現金缺口', false, complete.monthOutcome?.hasCashGap);
check('整月結果有未完成安排', false, complete.monthOutcome?.arrangementsComplete);
check('最值得注意項目', '「保險」有週期性支出，但每月準備不足。', complete.topDiagnosis?.title);
check('最值得注意依據', '目前預算 $1,200，本月實際 $4,800。', complete.topDiagnosis?.body);
check('最值得注意行動', '之後每月預存 $600 給「保險」', complete.topDiagnosis?.actionSummary);
check('未完成目標名稱', '儲蓄', complete.goalGap?.label);
check('未完成目標差額', 4000, complete.goalGap?.remaining);
check('下月安排行動', '把本月重點帶進下月安排', complete.nextAction);

const requiredSourceMarkers = [
  'deriveDemoPhonePreview',
  '<DemoPhoneReport state={activeDemoMonthPreview.id} />',
  '月中隨時監測收支狀況',
  '·本月進行中：先看現在最重要的事',
  '·本月結束後：整理成結論和下月安排',
  '※可按鈕切換月中/月底情境',
  'aria-pressed={demoMonthPreview === item.id}',
  'aria-live="polite"',
  'role="img"',
  '本月狀態',
  'demo-phone-closed-milestone',
  '本月最後結果',
  'data.monthOutcome.title',
  '最值得注意',
  'data.topDiagnosis.title',
  '未完成目標',
  'data.goalGap.remaining',
  'data.nextAction',
  '查看下月計畫',
  '已過完',
  '@media(prefers-reduced-motion:reduce)',
];
for (const marker of requiredSourceMarkers) {
  check(`程式標記 ${marker}`, true, appSource.includes(marker));
}

check('資料來源只定義一份', 1, (dataSource.match(/export const DEMO_PHONE_PREVIEW/g) || []).length);
check('手機預覽改讀產生資料', true, dataSource.includes('demoPhonePreviewGenerated.js'));
check('完整 Demo 與手機預覽來源一致', true, demoHtml.includes(`name="88la-finance-source" content="${DEMO_PHONE_PREVIEW.sourceId}"`));
check('產生資料有來源指紋', true, generatedSource.includes(DEMO_PHONE_PREVIEW.sourceId));
check('進行中資料物件存在', true, Boolean(DEMO_PHONE_PREVIEW.progress));
check('已結束資料物件存在', true, Boolean(DEMO_PHONE_PREVIEW.complete));
check('手機預覽底部導覽已移除', false, appSource.includes('demo-phone-app-nav'));
check('手機預覽 Home 指示條已移除', false, appSource.includes('demo-phone-home-zone'));
check('局部預算不再當整月結論', false, appSource.includes('const primaryBudgetAlert = data.budgetAlerts[0]'));

const removedCopy = [
  '這是同一個示範帳戶。畫面會依月份進度改變。',
  '先處理現在的事',
  '看可用餘額、預算提醒和還沒完成的目標。',
  '不是等到本月結束，才知道要注意什麼',
];
for (const copy of removedCopy) {
  check(`已移除文案 ${copy}`, false, appSource.includes(copy));
}

const publicCopy = [
  '月中隨時監測收支狀況',
  '·本月進行中：先看現在最重要的事',
  '·本月結束後：整理成結論和下月安排',
  '※可按鈕切換月中/月底情境',
  ...[DEMO_PHONE_PREVIEW.progress, DEMO_PHONE_PREVIEW.complete].flatMap(item => [
    item.stateLabel,
    item.balanceLabel,
    item.activityHeading,
    ...item.activityItems.flatMap(entry => [entry.label, entry.body]),
    ...item.budgetAlerts.map(entry => entry.label),
    ...item.goals.map(entry => entry.label),
    item.milestone || '',
    item.nextAction || '',
  ]),
  complete.monthOutcome.title,
  complete.topDiagnosis.title,
  complete.topDiagnosis.body,
  complete.goalGap.label,
];
const forbiddenDashes = [String.fromCodePoint(0x2014), String.fromCodePoint(0x2013), '──'];
check('新增文案破折號', 0, publicCopy.filter(line => forbiddenDashes.some(mark => line.includes(mark))).length);

const pad = (value, width) => String(value).padEnd(width, ' ');
console.log(pad('項目', 42) + pad('期望', 18) + pad('實際', 18) + '結果');
console.log('-'.repeat(84));
for (const row of checks) {
  console.log(pad(row.item, 42) + pad(row.expected, 18) + pad(row.actual, 18) + (row.pass ? 'PASS' : 'FAIL'));
}

const failed = checks.filter(row => !row.pass);
console.log(`\n共 ${checks.length} 項，通過 ${checks.length - failed.length}，不合格 ${failed.length}`);
process.exit(failed.length ? 1 : 0);
