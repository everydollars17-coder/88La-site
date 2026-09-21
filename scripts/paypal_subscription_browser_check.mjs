import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = join(root, "artifacts");
const target = process.env.PAYPAL_CHECK_URL || "http://127.0.0.1:5175/app?dev_admin=true";
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
  { name: "desktop", width: 1280, height: 960 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(target, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator(".paypal-subscription").first().waitFor({ state: "visible" });
  const subscriptions = page.locator(".paypal-subscription");
  for (let index = 0; index < 4; index += 1) {
    const subscription = subscriptions.nth(index);
    await subscription.scrollIntoViewIfNeeded();
    const paypalFrame = subscription
      .frameLocator('iframe[title="PayPal"]:visible')
      .first();
    await paypalFrame.locator("body").waitFor({ state: "visible", timeout: 15000 });
    await paypalFrame.locator('[role="link"], a, button').first().waitFor({ state: "visible", timeout: 15000 });
  }

  const planIds = await page.locator(".paypal-subscription").evaluateAll(nodes => nodes.map(node => node.dataset.paypalPlanId));
  const sdkCount = await page.locator("script#paypal-subscription-sdk").count();
  const iframeCount = await page.locator(".paypal-button-mount iframe").count();
  const loadingCopyCount = await page.getByText("PayPal 按鈕載入中", { exact: true }).count();
  const founderCopy = await page.locator(".paypal-founder").innerText();

  assert.equal(planIds.length, 4, `${viewport.name} 應顯示四組 PayPal 方案`);
  assert.equal(new Set(planIds).size, 4, `${viewport.name} PayPal 方案 ID 不得重複`);
  assert.equal(sdkCount, 1, `${viewport.name} PayPal SDK 只能載入一次`);
  assert.ok(iframeCount >= 4, `${viewport.name} 每組方案至少要有一個 PayPal 按鈕 iframe`);
  assert.equal(loadingCopyCount, 0, `${viewport.name} 按鈕完成後不得殘留載入提示`);
  assert.match(founderCopy, /曾購買模板 2\.0 的會員會自動取得創始會員資格/);
  assert.match(founderCopy, /登入 Email 與模板 2\.0 購買 Email 相同/);
  assert.equal(errors.length, 0, `${viewport.name} 瀏覽器錯誤：${errors.join(" | ")}`);

  const section = page.locator(".ap-plans").locator("xpath=.." );
  let screenshot;
  if (viewport.name === "mobile") {
    await page.addStyleTag({ content: ".nx-nav,.nx-sticky,.mob-tab-bar{display:none!important}" });
    const mobileCards = [
      [page.locator(".ap-plan").nth(0), "paypal-subscriptions-mobile.png"],
      [page.locator(".ap-plan").nth(1), "paypal-subscriptions-mobile-standard-yearly.png"],
      [page.locator(".paypal-founder-plan").nth(0), "paypal-subscriptions-mobile-founder-monthly.png"],
      [page.locator(".paypal-founder-plan").nth(1), "paypal-subscriptions-mobile-founder-yearly.png"],
    ];
    const mobileScreenshots = [];
    for (const [card, filename] of mobileCards) {
      await card.scrollIntoViewIfNeeded();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const path = join(artifacts, filename);
      await card.screenshot({ path });
      mobileScreenshots.push(path);
    }
    screenshot = mobileScreenshots.join(", ");
  } else {
    await section.scrollIntoViewIfNeeded();
    screenshot = join(artifacts, `paypal-subscriptions-${viewport.name}.png`);
    await section.screenshot({ path: screenshot });
  }
  results.push({ viewport: `${viewport.width}x${viewport.height}`, plans: planIds.length, sdk: sdkCount, iframes: iframeCount, screenshot });
  await page.close();
}

const legalPage = await browser.newPage();
const origin = new URL(target).origin;
await legalPage.goto(`${origin}/terms?dev_admin=true`, { waitUntil: "networkidle", timeout: 30000 });
const termsText = await legalPage.locator(".article-content").innerText();
assert.match(
  termsText,
  /PayPal 月訂閱與年訂閱均採自動續訂/,
  "服務條款必須說明 PayPal 月訂閱與年訂閱的自動續訂方式",
);
await legalPage.goto(`${origin}/privacy?dev_admin=true`, { waitUntil: "networkidle", timeout: 30000 });
const privacyText = await legalPage.locator(".article-content").innerText();
assert.match(
  privacyText,
  /使用 PayPal 付款時，您需將訂閱編號/,
  "隱私權政策必須說明人工開通使用的 PayPal 訂閱編號",
);
await legalPage.close();

await browser.close();
console.table(results);
console.log("PayPal 訂閱按鈕桌機與手機瀏覽器驗證通過");
