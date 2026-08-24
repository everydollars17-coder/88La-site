import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { APP_LAUNCH_NOTICE } from '../src/siteLaunch.js';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5175';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/88la-app-launch-lock';

await mkdir(SCREENSHOT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function openPage(path, viewport = { width: 1280, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  await page.locator('text=LOADING').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
  return page;
}

async function verifyLockedLink(page, selector, label) {
  const link = page.locator(selector).first();
  await link.waitFor({ state: 'visible' });
  const beforeUrl = page.url();
  let openedPopup = false;
  page.once('popup', () => { openedPopup = true; });
  await link.click();
  const notice = page.getByRole('status');
  await notice.waitFor({ state: 'visible' });
  assert.equal((await notice.textContent()).trim(), APP_LAUNCH_NOTICE, `${label} 提示文字不符`);
  assert.equal(page.url(), beforeUrl, `${label} 不得離開官網`);
  assert.equal(openedPopup, false, `${label} 不得開啟 App 視窗`);
}

try {
  const about = await openPage('/about?dev_admin=true');
  await verifyLockedLink(about, '[data-app-source="about-page"]', '關於頁 CTA');
  await about.evaluate(() => {
    const directLink = document.createElement('a');
    directLink.href = 'https://app.88lamoney.com';
    directLink.dataset.testDirectAppLink = 'true';
    directLink.textContent = '測試未標記的 App 直連';
    document.body.appendChild(directLink);
  });
  await verifyLockedLink(about, '[data-test-direct-app-link="true"]', '全站 App 網域防護');
  await about.locator('[data-test-direct-app-link="true"]').evaluate(element => element.remove());
  await about.screenshot({ path: `${SCREENSHOT_DIR}/about-app-lock-desktop.png`, fullPage: true });
  await about.close();

  const app = await openPage('/app?dev_admin=true');
  await verifyLockedLink(app, '[data-app-source="app-login-note"]', 'App 登入提示 CTA');
  await app.getByRole('button', { name: '了解更多 →' }).first().click();
  await verifyLockedLink(app, '[data-app-source="app-plan-detail"]', 'App 方案詳情 CTA');
  await app.close();

  const plans = await openPage('/plans?dev_admin=true', { width: 375, height: 812 });
  await verifyLockedLink(plans, '[data-app-source="plans-page"]', '方案頁 CTA');
  await plans.screenshot({ path: `${SCREENSHOT_DIR}/plans-app-lock-mobile.png`, fullPage: true });
  await plans.close();

  const pricing = await openPage('/pricing?dev_admin=true');
  await verifyLockedLink(pricing, '[data-app-source="pricing-page"]', '價格頁 CTA');
  await pricing.close();

  const demo = await openPage('/app-demo/index.html');
  await verifyLockedLink(demo, '[data-app-locked="true"]', 'App 示範頁 CTA');
  await demo.close();

  console.table([
    { page: '關於頁', result: '未離站，提示正確' },
    { page: '全站防護', result: '未標記的 App 直連也被攔截' },
    { page: 'App 頁', result: '登入與方案詳情皆鎖定' },
    { page: '方案與價格頁', result: '桌機與手機皆鎖定' },
    { page: 'App 示範頁', result: '未離站，提示正確' },
  ]);
  console.log(`截圖：${SCREENSHOT_DIR}`);
  console.log('App 上線鎖瀏覽器驗證通過');
} finally {
  await browser.close();
}
