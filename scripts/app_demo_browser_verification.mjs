#!/usr/bin/env node

import assert from 'node:assert/strict';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = (process.env.SITE_URL || 'http://127.0.0.1:5175').replace(/\/$/, '');
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp';

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(`${BASE_URL}/app-demo/index.html`, { waitUntil: 'networkidle', timeout: 60_000 });

  const sourceId = await page.locator('meta[name="88la-finance-source"]').getAttribute('content');
  assert.match(sourceId || '', /^[0-9a-f]{40}(?:\+working-tree\.[0-9a-f]{16})?$/);

  assert.equal(await page.locator('#d-balance').innerText(), '$2,876');
  assert.match(await page.locator('#d-balance-formula').innerText(), /收入 \$42,000.*現金支出 \$21,330.*卡費預留 \$13,794.*儲蓄 \$4,000.*\$2,876/s);
  assert.equal(await page.locator('#d-card-compact-balance').innerText(), '$2,876');

  await page.locator('.nb[data-p="report"]').click();
  await page.locator('#pg-report.page.on').waitFor({ state: 'visible' });
  const overviewText = await page.locator('#report-tab-overview').innerText();
  assert.match(overviewText, /本月沒有現金缺口，但原訂財務安排沒有全部完成/);
  assert.match(overviewText, /固定支出超出原安排 \$3,489/);
  assert.match(overviewText, /變動總支出超出原安排 \$2,235/);
  assert.match(overviewText, /正常日常支出低於預算 \$1,445/);
  assert.match(overviewText, /保險.*週期性支出.*每月準備不足/s);
  assert.match(overviewText, /儲蓄還差 \$4,000/);
  assert.doesNotMatch(overviewText, /資料需要同步|\-\$5,063|\$10,815/);

  await page.locator('[data-report-tab="plan"]').first().click();
  const planText = await page.locator('#report-tab-plan').innerText();
  assert.match(planText, /每月預存 \$600/);
  assert.doesNotMatch(planText, /保險.*\$4,800.*下月預算/s);

  await page.locator('[data-report-tab="detail"]').click();
  await page.locator('[data-action="toggle-diag"][data-diag-label="固定支出診斷"]').click();
  await page.locator('[data-action="toggle-diag"][data-diag-label="變動支出診斷"]').click();
  await page.locator('[data-action="toggle-diag"][data-diag-label="儲蓄診斷"]').click();
  const detailText = await page.locator('#report-tab-detail').innerText();
  assert.match(detailText, /扣除臨時與衝動支出 \$3,680 後，正常日常變動支出 \$8,155/);
  assert.match(detailText, /固定支出基準為 \$16,689，仍在預算內，剩餘 \$111/);
  assert.match(detailText, /可用餘額為 \$2,876/);

  assert.deepEqual(errors, []);

  await page.locator('[data-report-tab="overview"]').click();
  await page.locator('#pg-report').evaluate(element => element.scrollIntoView({ block: 'start' }));
  await page.screenshot({
    path: join(SCREENSHOT_DIR, '88la-full-app-demo-report-390.png'),
  });

  console.table([
    { item: '快訊可用餘額', expected: '$2,876', actual: await page.locator('#d-balance').innerText(), result: 'PASS' },
    { item: '診斷整月結果', expected: '沒有現金缺口，安排未完成', actual: '沒有現金缺口，安排未完成', result: 'PASS' },
    { item: '正常日常變動支出', expected: '$8,155', actual: '$8,155', result: 'PASS' },
    { item: '週期性保險預存', expected: '每月 $600', actual: '每月 $600', result: 'PASS' },
  ]);
  console.log(`完整 App Demo 瀏覽器驗證通過，Finance 來源 ${sourceId}`);
} finally {
  await browser.close();
}
