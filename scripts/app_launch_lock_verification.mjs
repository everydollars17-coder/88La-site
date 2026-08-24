import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { APP_LAUNCH_NOTICE } from '../src/siteLaunch.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const appSource = await readFile(join(ROOT, 'src/App.jsx'), 'utf8');
const demoSource = await readFile(join(ROOT, 'scripts/build_app_demo.mjs'), 'utf8');
const demoHtml = await readFile(join(ROOT, 'public/app-demo/index.html'), 'utf8');

const expectedSources = ['about-page', 'app-plan-detail', 'app-login-note', 'plans-page', 'pricing-page'];
const actualSources = [...appSource.matchAll(/appLockProps\("([^"]+)"\)/g)].map(match => match[1]);

assert.equal(APP_LAUNCH_NOTICE, '9/10 正式上線');
assert.deepEqual(actualSources, expectedSources);
assert.match(appSource, /a\.dataset\.appLocked === "true" \|\| url\?\.origin === new URL\(APP_URL\)\.origin/);
assert.match(appSource, /_showToast\(APP_LAUNCH_NOTICE, "notice"\)/);
assert.doesNotMatch(appSource, /href=\{appLink\(/);
assert.match(demoSource, /href="#app-launch" data-app-locked="true"/);
assert.match(demoSource, /toast\(APP_LAUNCH_NOTICE\)/);
assert.match(demoHtml, /href="#app-launch" data-app-locked="true"/);
assert.match(demoHtml, new RegExp(`var APP_LAUNCH_NOTICE = ${JSON.stringify(APP_LAUNCH_NOTICE)}`));
assert.doesNotMatch(demoHtml, /href="https:\/\/88la-finance\.vercel\.app/);

console.table([
  { input: '官網 5 組 App CTA', expected: '全部鎖住', actual: `${actualSources.length} 組已鎖住` },
  { input: 'App 示範頁 CTA', expected: '鎖住', actual: '已鎖住' },
  { input: '鎖定提示', expected: '9/10 正式上線', actual: APP_LAUNCH_NOTICE },
]);
console.log('App 上線鎖驗證通過');
