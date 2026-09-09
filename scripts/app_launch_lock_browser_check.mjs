import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { APP_LAUNCH_DATE, APP_LAUNCH_NOTICE, isAppLaunched } from '../src/siteLaunch.js';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5175';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/88la-app-launch-lock';

assert.equal(isAppLaunched(), false, `今天已過開放日 ${APP_LAUNCH_DATE}，鎖已放行，這支驗證不適用`);

await mkdir(SCREENSHOT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function openPage(path, viewport = { width: 1280, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  await page.locator('text=LOADING').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
  return page;
}

// 點下去要：不離站、不開新視窗、跳出正確的開放日提示
async function verifyLockedLink(page, locator, label) {
  await locator.waitFor({ state: 'visible' });
  const beforeUrl = page.url();
  let openedPopup = false;
  page.once('popup', () => { openedPopup = true; });
  await locator.click();
  const notice = page.getByRole('status');
  await notice.waitFor({ state: 'visible' });
  assert.equal((await notice.textContent()).trim(), APP_LAUNCH_NOTICE, `${label} 提示文字不符`);
  assert.equal(page.url(), beforeUrl, `${label} 不得離開官網`);
  assert.equal(openedPopup, false, `${label} 不得開啟 App 視窗`);
  await notice.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
}

// 該頁上每一個鎖定 CTA 都逐一點過，不挑選特定 data-app-source，
// 改版增刪按鈕時這支驗證不會因為選擇器過期而變成假通過
async function verifyEveryLockedCta(page, pageLabel) {
  const links = page.locator('[data-app-locked="true"]:visible');
  const count = await links.count();
  assert.ok(count > 0, `${pageLabel} 找不到任何鎖定 CTA`);
  for (let i = 0; i < count; i += 1) {
    const link = links.nth(i);
    const source = await link.getAttribute('data-app-source');
    await link.scrollIntoViewIfNeeded();
    await verifyLockedLink(page, link, `${pageLabel} ${source || 'CTA'}`);
  }
  return count;
}

const results = [];

try {
  const home = await openPage('/?dev_admin=true');
  const homeCount = await verifyEveryLockedCta(home, '首頁');
  // 沒有掛 data-app-locked 的 App 直連（例如導覽列「登入」）靠網域比對兜底
  await home.evaluate(() => {
    const directLink = document.createElement('a');
    directLink.href = 'https://app.88lamoney.com';
    directLink.dataset.testDirectAppLink = 'true';
    directLink.textContent = '測試未標記的 App 直連';
    document.body.appendChild(directLink);
  });
  await verifyLockedLink(home, home.locator('[data-test-direct-app-link="true"]'), '全站 App 網域防護');
  await home.locator('[data-test-direct-app-link="true"]').evaluate(element => element.remove());
  await home.screenshot({ path: `${SCREENSHOT_DIR}/home-app-lock-desktop.png`, fullPage: true });
  await home.close();
  results.push({ page: '首頁', locked: homeCount, result: '未離站，提示正確；未標記直連也被攔截' });

  const app = await openPage('/app?dev_admin=true');
  const appCount = await verifyEveryLockedCta(app, 'App 介紹頁');
  await app.screenshot({ path: `${SCREENSHOT_DIR}/app-lock-desktop.png`, fullPage: true });
  await app.close();
  results.push({ page: 'App 介紹頁', locked: appCount, result: '全部鎖定' });

  const plans = await openPage('/plans?dev_admin=true', { width: 375, height: 812 });
  const plansCount = await verifyEveryLockedCta(plans, '方案頁');
  await plans.screenshot({ path: `${SCREENSHOT_DIR}/plans-app-lock-mobile.png`, fullPage: true });
  await plans.close();
  results.push({ page: '方案頁（手機）', locked: plansCount, result: '全部鎖定' });

  const pricing = await openPage('/pricing?dev_admin=true');
  const pricingCount = await verifyEveryLockedCta(pricing, '價格頁');
  await pricing.screenshot({ path: `${SCREENSHOT_DIR}/pricing-app-lock-desktop.png`, fullPage: true });
  await pricing.close();
  results.push({ page: '價格頁', locked: pricingCount, result: '全部鎖定' });

  const demo = await openPage('/app-demo/index.html');
  await verifyLockedLink(demo, demo.locator('[data-app-locked="true"]').first(), 'App 示範頁 CTA');
  await demo.screenshot({ path: `${SCREENSHOT_DIR}/app-demo-lock-desktop.png` });
  await demo.close();
  results.push({ page: 'App 示範頁', locked: 1, result: '未離站，提示正確' });

  console.table(results);
  console.log(`開放日：${APP_LAUNCH_DATE}｜提示：${APP_LAUNCH_NOTICE}`);
  console.log(`截圖：${SCREENSHOT_DIR}`);
  console.log('App 上線鎖瀏覽器驗證通過');
} finally {
  await browser.close();
}
