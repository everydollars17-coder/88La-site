#!/usr/bin/env node
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = (process.env.SITE_URL || 'http://127.0.0.1:5175').replace(/\/$/, '');
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp';
const viewports = [
  { width: 320, height: 800 },
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
];

const rgbToLuminance = value => {
  const channels = value.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
const contrastRatio = (foreground, background) => {
  const a = rgbToLuminance(foreground);
  const b = rgbToLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

const browser = await chromium.launch({ headless: true });
const rows = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto(`${BASE_URL}/app?dev_admin=true`, { waitUntil: 'networkidle', timeout: 60_000 });
    const preview = page.locator('.demo-state-preview');
    await preview.waitFor({ state: 'visible' });

    const progressButton = page.getByRole('button', { name: '本月進行中', exact: true });
    const completeButton = page.getByRole('button', { name: '本月已結束', exact: true });
    const image = page.locator('.demo-state-image');

    assert.equal(await progressButton.getAttribute('aria-pressed'), 'true');
    assert.equal(await completeButton.getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('.demo-state-heading').innerText(), '月中隨時監測收支狀況');
    assert.deepEqual((await page.locator('.demo-state-intro').innerText()).split('\n'), [
      '·本月進行中：先看現在最重要的事',
      '·本月結束後：整理成結論和下月安排',
      '※可按鈕切換月中/月底情境',
    ]);
    assert.equal(await page.locator('.demo-state-detail-title').count(), 0);
    assert.equal(await page.locator('.demo-state-note').count(), 0);
    assert.equal(await image.getAttribute('role'), 'img');
    assert.match(await image.innerText(), /本月目前/);
    assert.match(await image.innerText(), /可用餘額\s+\$2,876/);
    assert.match(await image.innerText(), /目前沒有待繳款項/);
    assert.match(await image.innerText(), /4 項預算需要注意/);
    assert.match(await image.innerText(), /保險已超支 \$3,600/);
    assert.match(await image.innerText(), /儲蓄目標還差 \$4,000/);
    assert.doesNotMatch(await image.innerText(), /卡費會在下月付款/);

    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const previewBox = document.querySelector('.demo-state-preview')?.getBoundingClientRect();
      const copyBox = document.querySelector('.demo-state-copy')?.getBoundingClientRect();
      const imageBox = document.querySelector('.demo-state-image-wrap')?.getBoundingClientRect();
      const tabsBox = document.querySelector('.demo-state-tabs')?.getBoundingClientRect();
      const buttonBox = document.querySelector('.demo-state-tab')?.getBoundingClientRect();
      return {
        pageOverflow: root.scrollWidth - root.clientWidth,
        previewLeft: previewBox?.left,
        previewRight: previewBox?.right,
        copyBottom: copyBox?.bottom,
        phoneTop: imageBox?.top,
        phoneWidth: imageBox?.width,
        tabsWidth: tabsBox?.width,
        buttonHeight: buttonBox?.height,
        tabsCenterDiff: Math.abs((tabsBox?.left + tabsBox?.width / 2) - (copyBox?.left + copyBox?.width / 2)),
        viewportWidth: innerWidth,
      };
    });
    assert.ok(layout.pageOverflow <= 1, `頁面水平溢出 ${layout.pageOverflow}px`);
    assert.ok(layout.previewLeft >= 0 && layout.previewRight <= layout.viewportWidth + 1);
    assert.ok(layout.copyBottom <= layout.phoneTop, `文案與按鈕沒有在手機上方：${layout.copyBottom}px > ${layout.phoneTop}px`);
    assert.ok(layout.phoneWidth >= (viewport.width <= 390 ? 270 : 330));
    assert.ok(layout.tabsWidth <= 240, `切換按鈕群過寬 ${layout.tabsWidth}px`);
    assert.ok(layout.buttonHeight <= 38, `切換按鈕過高 ${layout.buttonHeight}px`);
    assert.ok(layout.tabsCenterDiff <= 1, `切換按鈕沒有置中，偏移 ${layout.tabsCenterDiff}px`);
    assert.equal(await page.locator('.demo-state-copy').evaluate(el => getComputedStyle(el).textAlign), 'center');

    const progressColor = await progressButton.evaluate(el => getComputedStyle(el).color);
    const progressBackground = await progressButton.evaluate(el => getComputedStyle(el).backgroundColor);
    const inactiveColor = await completeButton.evaluate(el => getComputedStyle(el).color);
    const tabsBackground = await page.locator('.demo-state-tabs').evaluate(el => getComputedStyle(el).backgroundColor);
    assert.ok(contrastRatio(progressColor, progressBackground) >= 4.5);
    assert.ok(contrastRatio(inactiveColor, tabsBackground) >= 4.5);

    await completeButton.click();
    assert.equal(await progressButton.getAttribute('aria-pressed'), 'false');
    assert.equal(await completeButton.getAttribute('aria-pressed'), 'true');
    assert.match(await image.innerText(), /本月狀態/);
    assert.match(await image.innerText(), /完成第 6 個月的財務整理/);
    assert.match(await image.innerText(), /本月最後結果/);
    assert.match(await image.innerText(), /本月沒有現金缺口，但原訂財務安排沒有全部完成/);
    assert.match(await image.innerText(), /最值得注意/);
    assert.match(await image.innerText(), /「保險」有週期性支出，但每月準備不足/);
    assert.match(await image.innerText(), /目前預算 \$1,200，本月實際 \$4,800/);
    assert.match(await image.innerText(), /未完成目標/);
    assert.match(await image.innerText(), /儲蓄還差 \$4,000/);
    assert.match(await image.innerText(), /把本月重點帶進下月安排/);
    assert.match(await image.innerText(), /查看下月計畫/);
    assert.match(await image.innerText(), /已過完/);
    const closedOrder = await page.evaluate(() => {
      const selectors = [
        '.demo-phone-closed-status',
        '.demo-phone-closed-milestone',
        '.demo-phone-closed-focus',
        '.demo-phone-closed-focus.secondary',
        '.demo-phone-closed-goal',
        '.demo-phone-closed-action',
      ];
      return selectors.map(selector => document.querySelector(selector)?.getBoundingClientRect().top);
    });
    assert.ok(closedOrder.every(Number.isFinite));
    assert.deepEqual([...closedOrder].sort((a, b) => a - b), closedOrder);
    assert.equal(await page.locator('.demo-phone-app-nav').count(), 0);
    assert.equal(await page.locator('.demo-phone-home-zone').count(), 0);

    await progressButton.focus();
    await page.keyboard.press('Tab');
    assert.equal(await completeButton.evaluate(el => document.activeElement === el), true);
    const focusStyle = await completeButton.evaluate(el => getComputedStyle(el).outlineStyle);
    assert.notEqual(focusStyle, 'none');

    assert.deepEqual(errors, []);
    rows.push({
      viewport: `${viewport.width}x${viewport.height}`,
      overflow: layout.pageOverflow,
      phoneWidth: Math.round(layout.phoneWidth),
      tabsWidth: Math.round(layout.tabsWidth),
      buttonHeight: Math.round(layout.buttonHeight),
      centerDiff: Number(layout.tabsCenterDiff.toFixed(1)),
      activeContrast: contrastRatio(progressColor, progressBackground).toFixed(2),
      inactiveContrast: contrastRatio(inactiveColor, tabsBackground).toFixed(2),
      result: 'PASS',
    });
    await page.close();
  }

  const reducedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${BASE_URL}/app?dev_admin=true`, { waitUntil: 'networkidle', timeout: 60_000 });
  await reducedPage.locator('.demo-state-preview').waitFor({ state: 'visible' });
  const animationName = await reducedPage.locator('.demo-state-image').evaluate(el => getComputedStyle(el).animationName);
  assert.equal(animationName, 'none');
  await reducedContext.close();

  const screenshotPage = await browser.newPage({ viewport: { width: 390, height: 1400 } });
  await screenshotPage.goto(`${BASE_URL}/app?dev_admin=true`, { waitUntil: 'networkidle', timeout: 60_000 });
  const screenshotPreview = screenshotPage.locator('.demo-state-preview');
  await screenshotPreview.waitFor({ state: 'visible' });
  // 只在驗收截圖隱藏 sticky Header，避免 locator 自動捲動時遮住區塊標題。
  await screenshotPage.addStyleTag({ content: 'header{visibility:hidden!important}' });
  await screenshotPreview.screenshot({ path: join(SCREENSHOT_DIR, '88la-demo-preview-390-progress.png') });
  await screenshotPage.getByRole('button', { name: '本月已結束', exact: true }).click();
  await screenshotPreview.screenshot({ path: join(SCREENSHOT_DIR, '88la-demo-preview-390-complete.png') });
  await screenshotPage.close();

  const desktopScreenshotPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await desktopScreenshotPage.goto(`${BASE_URL}/app?dev_admin=true`, { waitUntil: 'networkidle', timeout: 60_000 });
  const desktopPreview = desktopScreenshotPage.locator('.demo-state-preview');
  await desktopPreview.waitFor({ state: 'visible' });
  await desktopScreenshotPage.addStyleTag({ content: 'header{visibility:hidden!important}' });
  await desktopScreenshotPage.getByRole('button', { name: '本月已結束', exact: true }).click();
  await desktopPreview.screenshot({ path: join(SCREENSHOT_DIR, '88la-demo-preview-1440-complete.png') });
  await desktopScreenshotPage.close();

  console.table(rows);
  console.log('月份狀態切換、鍵盤焦點、手機預覽內容、無水平溢出與 reduced motion 全部通過');
} finally {
  await browser.close();
}
