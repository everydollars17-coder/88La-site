// 會員從哪裡來（2026-11-22 P4）：帶 ?src= 進官網後，連到 App 的按鈕要帶同樣的參數；只記第一次；沒有參數就是原本的網址。
// 用法：node scripts/app_acquisition_link_browser_check.mjs http://127.0.0.1:5297
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const base = process.argv[2] || "http://127.0.0.1:5173";
const playwrightPath = process.env.PLAYWRIGHT_MODULE_PATH;
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const rows = [];
const appLinks = page => page.$$eval('a[href^="https://app.88lamoney.com"]', links => [...new Set(links.map(a => a.getAttribute("href")))]);
try {
  // 1. 第一次帶參數進站
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${base}/?src=reel&c=${encodeURIComponent("刷卡先留錢")}`, { waitUntil: "networkidle" });
  const first = await appLinks(page);
  rows.push({ 情境: "帶 src=reel&c=刷卡先留錢 進站", 期望: "所有 App 連結都帶參數", 實際: first.join(" ") });
  assert.ok(first.length > 0, "頁面上要有連到 App 的連結");
  first.forEach(href => assert.equal(href, `https://app.88lamoney.com/?src=reel&c=${encodeURIComponent("刷卡先留錢").replace(/%20/g, "+")}`));
  // 2. 同一台裝置之後帶別的參數：保留第一次
  await page.goto(`${base}/?src=bio`, { waitUntil: "networkidle" });
  const second = await appLinks(page);
  rows.push({ 情境: "之後帶 src=bio 再進站", 期望: "仍是 reel", 實際: second.join(" ") });
  second.forEach(href => assert.match(href, /src=reel/));
  // 3. 換一台裝置（新的瀏覽器環境）沒帶參數：原本的網址
  const clean = await browser.newContext();
  const cleanPage = await clean.newPage();
  await cleanPage.goto(`${base}/`, { waitUntil: "networkidle" });
  const plain = await appLinks(cleanPage);
  rows.push({ 情境: "沒有參數", 期望: "https://app.88lamoney.com", 實際: plain.join(" ") });
  plain.forEach(href => assert.equal(href, "https://app.88lamoney.com"));
  // 4. 不合格的參數不記
  const bad = await browser.newContext();
  const badPage = await bad.newPage();
  await badPage.goto(`${base}/?src=${encodeURIComponent("<script>")}&c=x`, { waitUntil: "networkidle" });
  const badLinks = await appLinks(badPage);
  rows.push({ 情境: "src 不合格", 期望: "https://app.88lamoney.com", 實際: badLinks.join(" ") });
  badLinks.forEach(href => assert.equal(href, "https://app.88lamoney.com"));
} finally {
  await browser.close();
}
console.table(rows);
console.log(`官網 App 連結帶來源參數：${rows.length}/${rows.length} PASS`);
