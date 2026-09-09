import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { APP_LAUNCH_DATE, APP_LAUNCH_LABEL, APP_LAUNCH_NOTICE, isAppLaunched } from '../src/siteLaunch.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const appSource = await readFile(join(ROOT, 'src/App.jsx'), 'utf8');
const launchSource = await readFile(join(ROOT, 'src/siteLaunch.js'), 'utf8');
const demoSource = await readFile(join(ROOT, 'scripts/build_app_demo.mjs'), 'utf8');
const demoHtml = await readFile(join(ROOT, 'public/app-demo/index.html'), 'utf8');

// 開放日只能有一個來源。畫面文字一律從 APP_LAUNCH_LABEL 推導，
// App.jsx 不准再出現寫死的日期，否則改日期時一定會漏改。
assert.match(APP_LAUNCH_DATE, /^\d{4}-\d{2}-\d{2}$/);
assert.equal(APP_LAUNCH_LABEL, `${Number(APP_LAUNCH_DATE.split('-')[1])}/${Number(APP_LAUNCH_DATE.split('-')[2])}`);
assert.ok(APP_LAUNCH_NOTICE.includes(APP_LAUNCH_LABEL), '提示文字必須帶開放日');
assert.equal((launchSource.match(/\d{4}-\d{2}-\d{2}/g) || []).length, 1, 'siteLaunch.js 只能出現一個日期字串');
assert.doesNotMatch(appSource, /["'`][^"'`]*\d+\/\d+\s*(開放|正式上線|公布)/, 'App.jsx 不得寫死開放日文字');

// 台灣時間的邊界：前一天仍鎖住，當天零時起放行
const twNoon = day => new Date(`${day}T12:00:00+08:00`);
const prevDay = new Date(twNoon(APP_LAUNCH_DATE).getTime() - 86400000);
assert.equal(isAppLaunched(prevDay), false, '開放日前一天必須仍鎖住');
assert.equal(isAppLaunched(twNoon(APP_LAUNCH_DATE)), true, '開放日當天必須自動放行');

// 官網每個進 App 的 CTA 都要走 appCtaProps（未上線時帶 data-app-locked）
const ctaSources = [...appSource.matchAll(/appCtaProps\("([^"]+)"\)/g)].map(match => match[1]);
assert.ok(ctaSources.length >= 16, `App CTA 應至少 16 組，實際 ${ctaSources.length}`);
assert.equal(new Set(ctaSources).size, ctaSources.length, 'cta_source 不得重複');
assert.match(appSource, /\{ href: "#app-launch", "data-app-locked": "true", "data-app-source": from \}/);
// 沒有標記的 App 直連（例如導覽列「登入」）靠網域比對兜底
assert.match(appSource, /a\.dataset\.appLocked === "true" \|\| url\?\.origin === new URL\(APP_URL\)\.origin/);
assert.match(appSource, /_showToast\(APP_LAUNCH_NOTICE, "notice"\)/);
assert.doesNotMatch(appSource, /href=\{appLink\(/);

// App 示範頁（自動產生的靜態頁）也要同步鎖住
assert.match(demoSource, /href="#app-launch" data-app-locked="true"/);
assert.match(demoSource, /toast\(APP_LAUNCH_NOTICE\)/);
assert.match(demoHtml, /href="#app-launch" data-app-locked="true"/);
assert.match(demoHtml, new RegExp(`var APP_LAUNCH_NOTICE = ${JSON.stringify(APP_LAUNCH_NOTICE)}`));
assert.doesNotMatch(demoHtml, /href="https:\/\/88la-finance\.vercel\.app/);

console.table([
  { input: '開放日', expected: APP_LAUNCH_DATE, actual: APP_LAUNCH_DATE },
  { input: '開放日前一天', expected: '鎖住', actual: isAppLaunched(prevDay) ? '已放行' : '鎖住' },
  { input: '開放日當天', expected: '放行', actual: isAppLaunched(twNoon(APP_LAUNCH_DATE)) ? '放行' : '仍鎖住' },
  { input: '官網 App CTA', expected: '全部鎖住', actual: `${ctaSources.length} 組已鎖住` },
  { input: 'App 示範頁 CTA', expected: '鎖住', actual: '已鎖住' },
  { input: '鎖定提示', expected: `含 ${APP_LAUNCH_LABEL}`, actual: APP_LAUNCH_NOTICE },
]);
console.log('App 上線鎖驗證通過');
