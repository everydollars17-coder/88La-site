#!/usr/bin/env node
// 官網 Demo 手機預覽驗證
//
// 所有顯示數字只取自 demoPhonePreviewData.js，超支與目標差額由程式計算。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DEMO_PHONE_PREVIEW, deriveDemoPhonePreview } from '../src/demoPhonePreviewData.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const appSource = readFileSync(join(ROOT, 'src', 'App.jsx'), 'utf8');
const dataSource = readFileSync(join(ROOT, 'src', 'demoPhonePreviewData.js'), 'utf8');
const progress = deriveDemoPhonePreview('progress');
const complete = deriveDemoPhonePreview('complete');

const checks = [];
const check = (item, expected, actual) => {
  const pass = String(expected) === String(actual);
  checks.push({ item, expected: String(expected), actual: String(actual), pass });
};

check('進行中狀態標題', '本月目前', progress.stateLabel);
check('進行中可用餘額', 2680, progress.balance);
check('進行中距月底天數', 8, progress.daysRemaining);
check('進行中待處理數', 1, progress.activityItems.length);
check('進行中待處理金額', 699, progress.activityItems[0]?.amount);
check('進行中預算提醒數', 1, progress.budgetAlerts.length);
check('外食超支算式', 320, progress.budgetAlerts[0]?.actual - progress.budgetAlerts[0]?.budget);
check('外食顯示超支', 320, progress.budgetAlerts[0]?.over);
check('進行中未完成目標數', 1, progress.unfinishedGoalCount);
check('緊急備用金差額', 1500, progress.goals.find(item => item.label === '緊急備用金')?.remaining);
check('旅遊基金完成狀態', true, progress.goals.find(item => item.label === '旅遊基金')?.completed);
check('進行中下月卡費', 2480, progress.nextMonthCardDue);

check('已結束狀態標題', '本月已結束', complete.stateLabel);
check('已結束本月剩餘', 3260, complete.balance);
check('已結束完成事項數', 1, complete.activityItems.length);
check('已結束付款完成狀態', true, complete.activityItems[0]?.completed);
check('已結束外食超支算式', 850, complete.budgetAlerts[0]?.actual - complete.budgetAlerts[0]?.budget);
check('已結束外食顯示超支', 850, complete.budgetAlerts[0]?.over);
check('已結束緊急備用金完成狀態', true, complete.goals.find(item => item.label === '緊急備用金')?.completed);
check('已結束旅遊基金差額', 1000, complete.goals.find(item => item.label === '旅遊基金')?.remaining);
check('已結束下月卡費', 2480, complete.nextMonthCardDue);

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
  '@media(prefers-reduced-motion:reduce)',
];
for (const marker of requiredSourceMarkers) {
  check(`程式標記 ${marker}`, true, appSource.includes(marker));
}

check('資料來源只定義一份', 1, (dataSource.match(/export const DEMO_PHONE_PREVIEW/g) || []).length);
check('進行中資料物件存在', true, Boolean(DEMO_PHONE_PREVIEW.progress));
check('已結束資料物件存在', true, Boolean(DEMO_PHONE_PREVIEW.complete));

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
  ...Object.values(DEMO_PHONE_PREVIEW).flatMap(item => [
    item.stateLabel,
    item.balanceLabel,
    item.activityHeading,
    ...item.activityItems.flatMap(entry => [entry.label, entry.body]),
    ...item.budgetAlerts.map(entry => entry.label),
    ...item.goals.map(entry => entry.label),
  ]),
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
