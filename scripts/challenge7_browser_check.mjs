/* 7 天消費紀錄表：瀏覽器實測。
   起一個靜態伺服器服務 public/，用 Playwright 跑 Chromium 與 WebKit。
   用法：node scripts/challenge7_browser_check.mjs [--engine=chromium|webkit|both] [--shots]
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', 'public');
const SLUG = '/resources/7day-spending-challenge/index.html';
const SHOTS = path.resolve(__dirname, '..', '.challenge7-shots');

const args = process.argv.slice(2);
const engineArg = (args.find(a => a.startsWith('--engine=')) || '--engine=both').split('=')[1];
const wantShots = args.includes('--shots');

const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

function serve(){
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      let file = path.join(ROOT, url);
      if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) { res.writeHead(404, {'content-type':'text/plain'}); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/* ------------------------------------------------------------------ */
const results = [];
function check(name, expected, actual, pass){
  results.push({ name, expected, actual, pass: pass === undefined ? String(expected) === String(actual) : pass });
}

const V = { width: 375, height: 812 };

async function fresh(browser, base, { now = '2026-11-01T09:00', start = true, state } = {}){
  const ctx = await browser.newContext(state ? { viewport: V, storageState: state } : { viewport: V });
  const page = await ctx.newPage();
  await page.addInitScript(`window.__LA7_NOW = ${JSON.stringify(now)};`);
  await page.goto(base + SLUG);
  if (start && await page.locator('#startBtn').count()) await page.click('#startBtn');
  return { ctx, page };
}

const chipSel = (f, v) => `.chip[data-field="${f}"][data-value="${v}"]`;

/* 回傳這一筆用掉的點擊次數，用來驗「第一層 4 下、全填 11 下」 */
async function addEntry(page, o){
  let clicks = 0;
  await page.click('#addBtn'); clicks++;
  await page.click(chipSel('decision', o.decision)); clicks++;
  await page.fill('#fItem', o.item);
  await page.fill('#fAmount', String(o.amount));
  if (o.decision === 'substitute') await page.fill('#fSubAmount', String(o.subAmount));
  if (o.time !== undefined) await page.fill('#fTime', o.time);
  if (o.date) await page.fill('#fDate', o.date);
  await page.click(chipSel('decidedAhead', o.decidedAhead)); clicks++;
  await page.click(chipSel('habitual', o.habitual || 'unsure')); clicks++;
  if (o.layer2) {
    await page.click('#l2Toggle'); clicks++;
    for (const [f, v] of Object.entries(o.layer2)) {
      if (f === 'alternative') { await page.fill('#fAlt', v); continue; }
      if (f === 'note') { await page.fill('#fNote', v); continue; }
      for (const vv of (Array.isArray(v) ? v : [v])) { await page.click(chipSel(f, String(vv))); clicks++; }
    }
  }
  await page.click('#saveBtn'); clicks++;
  await page.waitForSelector('#sheetBg.open', { state: 'hidden' });
  return clicks;
}

async function openDay(page, date){
  await page.evaluate(d => { location.hash = '#d/' + d; }, date);
  await page.waitForSelector('#backBtn');
}
async function backToWeek(page){
  await page.click('#backBtn');
  await page.waitForSelector('#days');
}

const stats   = page => page.evaluate(() => window.__LA7.stats());
const entries = page => page.evaluate(() => window.__LA7.entries());
const csvOf   = page => page.evaluate(() => window.__LA7.csv());

/* ------------------------------------------------------------------ */
async function run(browser, label, base){
  let p;

  /* 1. 只填第一層就存檔，而且只要 4 下點擊 */
  p = await fresh(browser, base);
  let clicks = await addEntry(p.page, { item:'手搖飲', decision:'bought', amount:60, decidedAhead:'at_moment' });
  check(`${label} 只填第一層就存檔`, 1, (await entries(p.page)).length);
  check(`${label} 第一層點擊次數`, 5, clicks);
  let e0 = (await entries(p.page))[0];
  check(`${label} 第一層存完詳細記錄是 null`, 'null|null|null', [e0.needWant, e0.ifNotBuy, e0.satisfaction].map(x => String(x)).join('|'));
  check(`${label} 照習慣是必填所以有值`, 'unsure', e0.habitual);
  if (wantShots) { fs.mkdirSync(SHOTS, { recursive:true }); await p.page.screenshot({ path:`${SHOTS}/${label}-01-first-entry.png`, fullPage:true }); }

  /* 2. 買了，七天總額增加 */
  check(`${label} 買了算進七天花了`, 60, (await stats(p.page)).spent);

  /* 3. 沒買，總額不變，想買但沒買那行增加 */
  await addEntry(p.page, { item:'想買咖啡', decision:'not_bought', amount:65, decidedAhead:'at_moment' });
  let st = await stats(p.page);
  check(`${label} 沒買不算進七天花了`, 60, st.spent);
  check(`${label} 沒買計入想買但沒買筆數`, 1, st.notBoughtCount);
  check(`${label} 沒買的原本想花`, 65, st.notBoughtPlanned);
  const nb = (await entries(p.page)).find(x => x.decision === 'not_bought');
  check(`${label} 沒買的實際花費寫入時就是 0`, 0, nb.amount);

  /* 4. 延後也算進想買但沒買 */
  await addEntry(p.page, { item:'想買鞋', decision:'postponed', amount:1200, decidedAhead:'planned' });
  st = await stats(p.page);
  check(`${label} 延後也計入想買但沒買`, 2, st.notBoughtCount);
  check(`${label} 延後的原本想花累加`, 1265, st.notBoughtPlanned);

  /* 5. 改買替代品：原本想花與實際花費分開 */
  await addEntry(p.page, { item:'改買超商咖啡', decision:'substitute', amount:200, subAmount:45, decidedAhead:'at_moment' });
  const sub = (await entries(p.page)).find(x => x.decision === 'substitute');
  check(`${label} 替代品原本想花`, 200, sub.plannedAmount);
  check(`${label} 替代品實際花費`, 45, sub.amount);
  check(`${label} 替代品算進七天花了`, 105, (await stats(p.page)).spent);
  await p.ctx.close();

  /* 6. 選沒買不出現滿足感 */
  p = await fresh(browser, base);
  await p.page.click('#addBtn');
  await p.page.click(chipSel('decision', 'not_bought'));
  await p.page.click('#l2Toggle');
  check(`${label} 沒買不出現滿足感`, 0, await p.page.locator('.chip[data-field="satisfaction"]').count());
  await p.page.click(chipSel('decision', 'bought'));
  check(`${label} 買了才出現滿足感`, 5, await p.page.locator('.chip[data-field="satisfaction"]').count());
  if (wantShots) await p.page.screenshot({ path:`${SHOTS}/${label}-02-layer2-open.png`, fullPage:true });
  await p.ctx.close();

  /* 7. 第二層全填：11 下點擊，資料完整 */
  p = await fresh(browser, base);
  clicks = await addEntry(p.page, {
    item:'午餐', decision:'bought', amount:120, decidedAhead:'planned',
    habitual:'yes',
    layer2:{ needWant:'need', motives:['physical'], ifNotBuy:'inconvenient', satisfaction:4, budgetStatus:'within' }
  });
  check(`${label} 必填加詳細記錄全填的點擊次數`, 11, clicks);
  const full = (await entries(p.page))[0];
  check(`${label} 詳細記錄資料完整`, 'need|physical|inconvenient|yes|4|within',
    [full.needWant, full.motives.join('+'), full.ifNotBuy, full.habitual, full.satisfaction, full.budgetStatus].join('|'));

  /* 8. 第二層展開但全部跳過，仍可存，欄位是 null */
  await p.page.click('#addBtn');
  await p.page.click(chipSel('decision', 'bought'));
  await p.page.fill('#fItem', '便利商店');
  await p.page.fill('#fAmount', '38');
  await p.page.click(chipSel('decidedAhead', 'unsure'));
  await p.page.click(chipSel('habitual', 'no'));
  await p.page.click('#l2Toggle');
  await p.page.click('#saveBtn');
  await p.page.waitForSelector('#sheetBg.open', { state:'hidden' });
  const skipped = (await entries(p.page)).find(x => x.item === '便利商店');
  check(`${label} 詳細記錄展開全跳過也能存`, true, !!skipped, !!skipped);
  check(`${label} 跳過的詳細記錄是 null`, 'null|null|null',
    [skipped.needWant, skipped.ifNotBuy, skipped.budgetStatus].map(String).join('|'));

  /* 9. 照習慣必填之後的分母 */
  st = await stats(p.page);
  check(`${label} 照習慣兩筆都有回答`, 2, st.habAnswered);
  check(`${label} 照習慣回答有的筆數`, 1, st.habYes);
  const noteTxt = await p.page.locator('#notes').innerText();
  check(`${label} 全部都有回答時不寫有回答的`, true, /(^|\n)2 筆裡，1 筆/.test(noteTxt), /(^|\n)2 筆裡，1 筆/.test(noteTxt));
  check(`${label} 沒填詳細記錄的筆數有揭露`, true, /有 1 筆沒有填詳細記錄/.test(noteTxt), /有 1 筆沒有填詳細記錄/.test(noteTxt));

  /* 10. 多選為什麼買 */
  await p.page.click('#addBtn');
  await p.page.click(chipSel('decision', 'bought'));
  await p.page.fill('#fItem', '飲料');
  await p.page.fill('#fAmount', '50');
  await p.page.click(chipSel('decidedAhead', 'at_moment'));
  await p.page.click(chipSel('habitual', 'yes'));
  await p.page.click('#l2Toggle');
  await p.page.click(chipSel('motives', 'habit'));
  await p.page.click(chipSel('motives', 'emotion'));
  await p.page.click('#saveBtn');
  await p.page.waitForSelector('#sheetBg.open', { state:'hidden' });
  const multi = (await entries(p.page)).find(x => x.item === '飲料');
  check(`${label} 多選動機保存`, 'habit+emotion', multi.motives.join('+'));
  let csv = await csvOf(p.page);
  check(`${label} CSV 多選用直線分隔`, true, csv.includes('習慣|情緒'), csv.includes('習慣|情緒'));

  /* 11. 兩欄交叉統計加總 */
  const cross = await p.page.evaluate(() => {
    const es = window.__LA7.entries();
    const dt = { planned:0, at_moment:0, unsure:0 };
    const hb = { yes:0, no:0, unsure:0, none:0 };
    let crossSum = 0;
    es.forEach(e => { dt[e.decidedAhead] += 1; hb[e.habitual == null ? 'none' : e.habitual] += 1; });
    ['planned','at_moment','unsure'].forEach(a => ['yes','no','unsure','none'].forEach(b => {
      crossSum += es.filter(e => e.decidedAhead === a && (e.habitual == null ? 'none' : e.habitual) === b).length;
    }));
    return { total: es.length, dtSum: Object.values(dt).reduce((x,y)=>x+y,0), hbSum: Object.values(hb).reduce((x,y)=>x+y,0), crossSum };
  });
  check(`${label} 決定時點三格加總等於總筆數`, cross.total, cross.dtSum);
  check(`${label} 照習慣四格含未回答加總等於總筆數`, cross.total, cross.hbSum);
  check(`${label} 交叉表 12 格加總等於總筆數`, cross.total, cross.crossSum);
  await p.ctx.close();

  /* 12. 修改一筆不會多一筆 */
  p = await fresh(browser, base);
  await addEntry(p.page, { item:'早餐', decision:'bought', amount:75, decidedAhead:'planned' });
  await openDay(p.page, '2026-11-01');
  await p.page.click('.tl-card');
  await p.page.click('[data-edit]');
  await p.page.fill('#fAmount', '95');
  await p.page.click('#saveBtn');
  await p.page.waitForSelector('#sheetBg.open', { state:'hidden' });
  check(`${label} 修改不會多一筆`, 1, (await entries(p.page)).length);
  check(`${label} 修改後金額更新`, 95, (await stats(p.page)).spent);

  /* 13. 重新整理資料還在 */
  await p.page.reload();
  check(`${label} 重新整理資料還在`, 1, (await entries(p.page)).length);

  /* 14. 關掉再開資料還在（帶著儲存狀態開新 context） */
  const saved = await p.ctx.storageState();
  await p.ctx.close();
  p = await fresh(browser, base, { state: saved, start:false });
  check(`${label} 關掉再開資料還在`, 1, (await entries(p.page)).length);

  /* 15. 刪除 */
  await openDay(p.page, '2026-11-01');
  await p.page.click('.tl-card');
  p.page.once('dialog', d => d.accept());
  await p.page.click('[data-del]');
  await p.page.waitForFunction(() => window.__LA7.entries().length === 0);
  check(`${label} 刪除後紀錄歸零`, 0, (await entries(p.page)).length);
  check(`${label} 刪除後金額歸零`, 0, (await stats(p.page)).spent);
  await p.ctx.close();

  /* 16. 時間留空：空心點、排在那天最後 */
  p = await fresh(browser, base);
  await addEntry(p.page, { item:'午餐', decision:'bought', amount:100, time:'12:30', decidedAhead:'planned' });
  await addEntry(p.page, { item:'宵夜', decision:'bought', amount:38, time:'22:10', decidedAhead:'unsure' });
  await openDay(p.page, '2026-11-01');
  const order1 = await p.page.locator('.tl-item-name').allInnerTexts();
  check(`${label} 當天由早到晚`, '午餐>宵夜', order1.join('>'));

  /* 17. 同一天三筆由早到晚 */
  await addEntry(p.page, { item:'早餐', decision:'bought', amount:60, time:'08:00', decidedAhead:'planned' });
  const order2 = await p.page.locator('.tl-item-name').allInnerTexts();
  check(`${label} 同一天三筆由早到晚`, '早餐>午餐>宵夜', order2.join('>'));
  check(`${label} 一條線三個點`, 3, await p.page.locator('.dot').count());
  if (wantShots) await p.page.screenshot({ path:`${SHOTS}/${label}-03-timeline.png`, fullPage:true });

  /* 18. CSV：BOM、16 欄、中文、沒填留空、公式注入、逗號 */
  await addEntry(p.page, { item:'=SUM(A1)', decision:'bought', amount:10, time:'10:00', decidedAhead:'planned' });
  await addEntry(p.page, { item:'咖啡,大杯', decision:'bought', amount:85, time:'11:00', decidedAhead:'planned',
    layer2:{ note:'很"想"喝' } });
  csv = await csvOf(p.page);
  const lines = csv.replace(/^﻿/, '').trim().split('\r\n');
  check(`${label} CSV 有 BOM`, true, csv.charCodeAt(0) === 0xFEFF, csv.charCodeAt(0) === 0xFEFF);
  check(`${label} CSV 16 欄`, 16, lines[0].split(',').length);
  check(`${label} CSV 標題是中文`, true, lines[0].includes('照習慣在做'), lines[0].includes('照習慣在做'));
  check(`${label} CSV 選項值是中文`, true, csv.includes('事先決定'), csv.includes('事先決定'));
  check(`${label} CSV 公式注入前面加單引號`, true, csv.includes("'=SUM(A1)"), csv.includes("'=SUM(A1)"));
  check(`${label} CSV 逗號用雙引號包起來`, true, csv.includes('"咖啡,大杯"'), csv.includes('"咖啡,大杯"'));
  check(`${label} CSV 內部雙引號變兩個`, true, csv.includes('很""想""喝'), csv.includes('很""想""喝'));
  const plainRow = lines.find(l => l.includes('宵夜'));
  check(`${label} CSV 沒填的欄位留空不寫 0`, true, /,,/.test(plainRow), /,,/.test(plainRow));
  const plainCells = plainRow.split(',');
  check(`${label} CSV 需要還是想要沒填是空白`, '', plainCells[8]);
  check(`${label} CSV 照習慣在做有值`, '不確定', plainCells[11]);

  /* 19. 下載真的會觸發，檔名正確。下載鈕在七天層，先返回 */
  await backToWeek(p.page);
  const dl = await Promise.all([ p.page.waitForEvent('download'), p.page.click('#csvBtn') ]);
  const fname = dl[0].suggestedFilename();
  check(`${label} CSV 檔名帶開始日`, true, /^88la-7day-challenge_2026-11-01_/.test(fname), /^88la-7day-challenge_2026-11-01_/.test(fname));

  /* 20. AI 指令完整 */
  const prompt = await p.page.evaluate(() => window.__LA7.prompt());
  /* 一條裁決一條守門，2026-10-30 Barbara 十點裁決 */
  check(`${label} 裁決1 指令用正式名稱`, true, prompt.includes('「消費行為觀察練習」'), prompt.includes('「消費行為觀察練習」'));
  check(`${label} 裁決1 指令不再出現舊名字`, false, prompt.includes('最低消費挑戰'), !prompt.includes('最低消費挑戰'));
  check(`${label} 裁決2 第一部分標題`, true, prompt.includes('第一部分｜這七天值得注意的消費觀察'), prompt.includes('第一部分｜這七天值得注意的消費觀察'));
  check(`${label} 裁決2 最多五項`, true, prompt.includes('列出最多五項有資料支持的發現'), prompt.includes('列出最多五項有資料支持的發現'));
  check(`${label} 裁決2 不預設分析面向`, true, prompt.includes('不需要固定分析哪些面向'), prompt.includes('不需要固定分析哪些面向'));
  check(`${label} 裁決2 資料不足可以少於三項`, true, prompt.includes('不需要湊滿三項'), prompt.includes('不需要湊滿三項'));
  check(`${label} 裁決3 情境只能用寫下來的`, true, prompt.includes('生活情境只能用我自己寫下來的'), prompt.includes('生活情境只能用我自己寫下來的'));
  check(`${label} 裁決3 禁止用時間推斷情境`, true, prompt.includes('22:30 不等於睡前，19:30 不等於飯後'), prompt.includes('22:30 不等於睡前，19:30 不等於飯後'));
  check(`${label} 裁決4 區分同一樣與同一類`, true, prompt.includes('不要把同類直接當成同一樣'), prompt.includes('不要把同類直接當成同一樣'));
  check(`${label} 裁決4 次數要能對回紀錄`, true, prompt.includes('要能對回我的紀錄'), prompt.includes('要能對回我的紀錄'));
  check(`${label} 裁決4 要說明歸類依據`, true, prompt.includes('說明你是怎麼歸類的'), prompt.includes('說明你是怎麼歸類的'));
  check(`${label} 裁決5 下結論前先看筆數與天數`, true, prompt.includes('先看這是幾筆、分布在幾天'), prompt.includes('先看這是幾筆、分布在幾天'));
  check(`${label} 裁決5 筆數少不得推論長期`, true, prompt.includes('不要講成我長期的行為'), prompt.includes('不要講成我長期的行為'));
  check(`${label} 裁決6 第二部分三段結構`, true, prompt.includes('下一次我可以怎麼做'), prompt.includes('下一次我可以怎麼做'));
  check(`${label} 裁決6 所以呢檢查`, true, prompt.includes('請先自己問一次「所以呢？」'), prompt.includes('請先自己問一次「所以呢？」'));
  check(`${label} 裁決7 第三部分只提一個改變`, true, prompt.includes('只提出一個最值得我下週先試的小改變'), prompt.includes('只提出一個最值得我下週先試的小改變'));
  check(`${label} 裁決7 不得變成省錢清單`, true, prompt.includes('不要變成省錢建議清單'), prompt.includes('不要變成省錢建議清單'));
  check(`${label} 裁決8 移除雙入口敘述`, false, prompt.includes('入口'), !prompt.includes('入口'));
  check(`${label} 裁決8 第二三部分用自然文字`, true, prompt.includes('這一段不要表格'), prompt.includes('這一段不要表格'));
  check(`${label} 裁決9 指令不放誘導用的案例`, false, prompt.includes('範例'), !prompt.includes('範例'));
  check(`${label} 裁決9 指令不放示範內容`, false, prompt.includes('示範'), !prompt.includes('示範'));
  check(`${label} 裁決10 未購買不等於省下`, true, prompt.includes('不等於我省下的錢'), prompt.includes('不等於我省下的錢'));
  check(`${label} 裁決10 想要不等於浪費`, true, prompt.includes('不要把所有「想要」都當成浪費'), prompt.includes('不要把所有「想要」都當成浪費'));
  check(`${label} 裁決10 不得編造`, true, prompt.includes('不要編造我沒記下的消費、金額或情境'), prompt.includes('不要編造我沒記下的消費、金額或情境'));
  check(`${label} 裁決10 納入記錄本身的影響`, true, prompt.includes('可能已經改變了我這七天的消費行為'), prompt.includes('可能已經改變了我這七天的消費行為'));
  await p.ctx.close();

  /* 21. 漏記一天：顯示沒有紀錄，不顯示 $0 */
  p = await fresh(browser, base, { now:'2026-11-01T09:00' });
  await addEntry(p.page, { item:'早餐', decision:'bought', amount:60, decidedAhead:'planned' });
  const saved2 = await p.ctx.storageState();
  await p.ctx.close();
  p = await fresh(browser, base, { now:'2026-11-03T09:00', state: saved2, start:false });
  const pageTxt = await p.page.locator('#days').innerText();
  check(`${label} 漏記那天寫還沒記`, true, pageTxt.includes('還沒記'), pageTxt.includes('還沒記'));
  check(`${label} 漏記那天不顯示 $0`, false, /11\/2\s*\n?\s*還沒記[\s\S]{0,20}\$0/.test(pageTxt), !/11\/2\s*\n?\s*還沒記[\s\S]{0,20}\$0/.test(pageTxt));
  check(`${label} 新的一天顯示 DAY 3`, true, (await p.page.locator('#dayBadge').innerText()).includes('DAY 3'), (await p.page.locator('#dayBadge').innerText()).includes('DAY 3'));
  await p.ctx.close();

  /* 22. DAY 計算與跨月 */
  p = await fresh(browser, base, { now:'2026-11-01T09:00' });
  const s3 = await p.ctx.storageState();
  await p.ctx.close();
  p = await fresh(browser, base, { now:'2026-11-07T09:00', state:s3, start:false });
  check(`${label} 11/01 開始 11/07 是 DAY 7`, true, (await p.page.locator('#dayBadge').innerText()).includes('DAY 7'), (await p.page.locator('#dayBadge').innerText()).includes('DAY 7'));
  check(`${label} DAY 7 還可以記一筆`, 1, await p.page.locator('#addBtn').count());
  await p.ctx.close();

  /* 23. 第八天：練習已結束，資料還看得到，不能再記 */
  p = await fresh(browser, base, { now:'2026-11-08T09:00', state:s3, start:false });
  check(`${label} 第八天寫練習已結束`, '練習已結束', await p.page.locator('#dayBadge').innerText());
  check(`${label} 第八天沒有記一筆按鈕`, 0, await p.page.locator('#addBtn').count());
  check(`${label} 第八天還下載得到`, 1, await p.page.locator('#csvBtn').count());
  if (wantShots) await p.page.screenshot({ path:`${SHOTS}/${label}-04-ended.png`, fullPage:true });
  await p.ctx.close();

  /* 24. 跨月 DAY：10/28 開始，11/03 是 DAY 7 */
  p = await fresh(browser, base, { now:'2026-10-28T09:00' });
  const s4 = await p.ctx.storageState();
  await p.ctx.close();
  p = await fresh(browser, base, { now:'2026-11-03T09:00', state:s4, start:false });
  check(`${label} 跨月 10/28 到 11/03 是 DAY 7`, true, (await p.page.locator('#dayBadge').innerText()).includes('DAY 7'), (await p.page.locator('#dayBadge').innerText()).includes('DAY 7'));
  await p.ctx.close();

  /* 25. 存檔失敗要說失敗，表單不清空 */
  p = await fresh(browser, base);
  await p.page.evaluate(() => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v){
      if (k === 'la7day_v1') throw new Error('quota');
      return orig.call(this, k, v);
    };
  });
  await p.page.click('#addBtn');
  await p.page.click(chipSel('decision', 'bought'));
  await p.page.fill('#fItem', '會存失敗的一筆');
  await p.page.fill('#fAmount', '99');
  await p.page.click(chipSel('decidedAhead', 'planned'));
  await p.page.click(chipSel('habitual', 'no'));
  await p.page.click('#saveBtn');
  await p.page.waitForSelector('#formMsg.show');
  const errText = await p.page.locator('#formMsg').innerText();
  check(`${label} 存檔失敗有說沒存成功`, true, errText.includes('沒有存成功'), errText.includes('沒有存成功'));
  check(`${label} 存檔失敗表單不清空`, '會存失敗的一筆', await p.page.inputValue('#fItem'));
  check(`${label} 存檔失敗視窗不關`, 1, await p.page.locator('#sheetBg.open').count());
  check(`${label} 存檔失敗沒有寫進紀錄`, 0, (await entries(p.page)).length);
  await p.ctx.close();

  /* 26. 手機版版面：兩顆按鈕不橫向捲動、輸入字級 16px 以上 */
  p = await fresh(browser, base);
  await addEntry(p.page, { item:'測試', decision:'bought', amount:50, decidedAhead:'planned' });
  const layout = await p.page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    return { overflow: sw - cw };
  });
  check(`${label} 沒有橫向捲動`, true, layout.overflow <= 1, layout.overflow <= 1);
  await p.page.click('#addBtn');
  const fontSizes = await p.page.evaluate(() =>
    Array.from(document.querySelectorAll('#sheet input, #sheet textarea'))
      .map(el => parseFloat(getComputedStyle(el).fontSize)));
  check(`${label} 輸入欄位字級都 16px 以上`, true, fontSizes.every(f => f >= 16), fontSizes.every(f => f >= 16));
  const btnH = await p.page.evaluate(() => {
    const b = document.querySelector('#saveBtn');
    return b.getBoundingClientRect().height;
  });
  check(`${label} 主按鈕高度 44px 以上`, true, btnH >= 44, btnH >= 44);
  await p.ctx.close();

  /* 27. 日期固定、時間與照習慣必填、點選項不會往回滾 */
  p = await fresh(browser, base, { now:'2026-11-01T09:00' });
  await p.page.click('#addBtn');
  check(`${label} 表單沒有日期欄位`, 0, await p.page.locator('#fDate').count());
  check(`${label} 表單標題寫出是哪一天`, true, (await p.page.locator('.sh-sub').innerText()).includes('11 月 1 日'), (await p.page.locator('.sh-sub').innerText()).includes('11 月 1 日'));
  check(`${label} 幾點是第一欄`, 'fTime', await p.page.evaluate(() => document.querySelector('#sheet input, #sheet textarea').id));
  check(`${label} 幾點預設帶入現在`, '09:00', await p.page.inputValue('#fTime'));
  check(`${label} 照習慣在必填區`, true, await p.page.evaluate(() => {
    const hb = document.querySelector('.chip[data-field="habitual"]');
    const l2 = document.getElementById('layer2');
    return !!hb && !l2.contains(hb);
  }), await p.page.evaluate(() => {
    const hb = document.querySelector('.chip[data-field="habitual"]');
    const l2 = document.getElementById('layer2');
    return !!hb && !l2.contains(hb);
  }));
  check(`${label} 選填區的文案`, '詳細記錄（選填）', (await p.page.locator('#l2Toggle').innerText()).trim());
  check(`${label} 改用替代品的文案`, true, (await p.page.locator('#sheet').innerText()).includes('改用替代品'), (await p.page.locator('#sheet').innerText()).includes('改用替代品'));

  // 照習慣沒選不給存
  await p.page.click(chipSel('decision', 'bought'));
  await p.page.fill('#fItem', '測試必填');
  await p.page.fill('#fAmount', '10');
  await p.page.click(chipSel('decidedAhead', 'planned'));
  await p.page.click('#saveBtn');
  await p.page.waitForSelector('#formMsg.show');
  check(`${label} 照習慣沒選被擋下`, true, (await p.page.locator('#formMsg').innerText()).includes('照習慣'), (await p.page.locator('#formMsg').innerText()).includes('照習慣'));
  check(`${label} 被擋下時沒寫進去`, 0, (await entries(p.page)).length);

  // 時間清空不給存
  await p.page.click(chipSel('habitual', 'no'));
  await p.page.fill('#fTime', '');
  await p.page.click('#saveBtn');
  await p.page.waitForSelector('#formMsg.show');
  check(`${label} 時間清空被擋下`, true, (await p.page.locator('#formMsg').innerText()).includes('幾點'), (await p.page.locator('#formMsg').innerText()).includes('幾點'));

  // 點選填區的選項，捲動位置不能跳回最上面
  await p.page.fill('#fTime', '09:30');
  await p.page.click('#l2Toggle');
  // 量使用者真正看到的東西：點下去之後，那顆選項在畫面上有沒有移位。
  // 直接比 scrollTop 不可靠，它會被瀏覽器夾範圍。
  // 位置類的斷言用 tap()（頁面內直接觸發），不用 Playwright 的 click：
  // Playwright 點擊前會先 scrollIntoViewIfNeeded，那一下捲動會混進測量值，
  // 分不出是表單重畫造成的、還是 Playwright 自己捲的（2026-10-29 實測：
  // 真實瀏覽器點同一顆選項，位置 279 不動、捲動位置 542 不動，Playwright 卻報移位 354px）。
  // 「有沒有重畫」「樣式有沒有生效」仍然用真實點擊驗證。
  const chipTop = sel => p.page.evaluate(q => {
    const s = document.getElementById('sheet');
    const r = document.querySelector(q).getBoundingClientRect();
    const sr = s.getBoundingClientRect();
    return Math.round(r.top - sr.top);
  }, sel);
  const centerOn = sel => p.page.evaluate(q => {
    const s = document.getElementById('sheet');
    const r = document.querySelector(q).getBoundingClientRect();
    const sr = s.getBoundingClientRect();
    s.scrollTop += (r.top - sr.top) - s.clientHeight / 2 + r.height / 2;
  }, sel);
  // 在元素上做記號。表單若被整張重畫，記號會跟著消失，這直接證明有沒有重畫
  const mark = sel => p.page.evaluate(q => { document.querySelector(q).dataset.probe = '1'; }, sel);
  const markSurvived = sel => p.page.evaluate(q => document.querySelector(q).dataset.probe === '1', sel);
  const steady = (a, b) => Math.abs(a - b) <= 2;
  const tap = sel => p.page.evaluate(q => document.querySelector(q).click(), sel);

  // 單選
  await centerOn(chipSel('needWant', 'want'));
  const t1 = await chipTop(chipSel('needWant', 'want'));
  check(`${label} 捲動測試前選項確實在畫面中間`, true, t1 > 100, t1 > 100);
  await mark(chipSel('needWant', 'need'));
  await tap(chipSel('needWant', 'want'));
  const t1b = await chipTop(chipSel('needWant', 'want'));
  check(`${label} 點單選選項畫面不移位`, true, steady(t1, t1b), steady(t1, t1b));
  check(`${label} 點單選沒有重畫整張表單`, true, await markSurvived(chipSel('needWant', 'need')), await markSurvived(chipSel('needWant', 'need')));
  check(`${label} 就地換樣式有生效`, true,
    await p.page.evaluate(() => document.querySelector('.chip[data-field="needWant"][data-value="want"]').classList.contains('on')),
    await p.page.evaluate(() => document.querySelector('.chip[data-field="needWant"][data-value="want"]').classList.contains('on')));

  // 多選
  await centerOn(chipSel('motives', 'habit'));
  const t2 = await chipTop(chipSel('motives', 'habit'));
  await mark(chipSel('motives', 'emotion'));
  await tap(chipSel('motives', 'habit'));
  const t2b = await chipTop(chipSel('motives', 'habit'));
  check(`${label} 點多選畫面不移位`, true, steady(t2, t2b), steady(t2, t2b));
  check(`${label} 點多選沒有重畫整張表單`, true, await markSurvived(chipSel('motives', 'emotion')), await markSurvived(chipSel('motives', 'emotion')));

  // 反向證明：改「最後決定」會改變表單結構，一定要重畫，但不該把人丟回最上面
  await centerOn(chipSel('decision', 'not_bought'));
  const t3 = await chipTop(chipSel('decision', 'not_bought'));
  await mark(chipSel('decision', 'bought'));
  await p.page.click(chipSel('decision', 'not_bought'));
  check(`${label} 改最後決定才會重畫整張表單`, false, await markSurvived(chipSel('decision', 'bought')), (await markSurvived(chipSel('decision', 'bought'))) === false);
  const t3b = await chipTop(chipSel('decision', 'not_bought'));
  check(`${label} 重畫之後畫面也不會跳回最上面`, true, Math.abs(t3 - t3b) < 60, Math.abs(t3 - t3b) < 60);
  await p.ctx.close();

  /* 27b. 從某一天進去記一筆，日期就是那一天 */
  p = await fresh(browser, base, { now:'2026-11-01T09:00' });
  const s27 = await p.ctx.storageState();
  await p.ctx.close();
  p = await fresh(browser, base, { now:'2026-11-03T20:00', state:s27, start:false });
  await openDay(p.page, '2026-11-01');
  await addEntry(p.page, { item:'補記前天的', decision:'bought', amount:50, time:'13:00', decidedAhead:'planned' });
  check(`${label} 從某一天記的日期就是那一天`, '2026-11-01', (await entries(p.page))[0].date);
  await p.ctx.close();

  /* 27c. 七天層的標題與內文 */
  p = await fresh(browser, base);
  const headTxt = await p.page.locator('.head').innerText();
  check(`${label} 七天層有標題`, true, headTxt.includes('消費行為觀察練習'), headTxt.includes('消費行為觀察練習'));
  const docTitle = await p.page.title();
  check(`${label} 分頁標題用同一個名字`, true, docTitle.includes('消費行為觀察練習'));
  check(`${label} AI 指令用同一個名字`, true, (await p.page.evaluate(() => window.__LA7.prompt())).includes('「消費行為觀察練習」'));
  check(`${label} AI 指令不再出現舊名字`, false, (await p.page.evaluate(() => window.__LA7.prompt())).includes('最低消費挑戰'));
  check(`${label} 七天層有內文`, true, headTxt.includes('有花錢的念頭就記下來'), headTxt.includes('有花錢的念頭就記下來'));
  check(`${label} 內文說明只要七天`, true, headTxt.includes('只需要 7 天'), headTxt.includes('只需要 7 天'));
  await p.ctx.close();

  /* 28. 兩層結構：七天目次、點進某一天、返回 */
  p = await fresh(browser, base, { now:'2026-11-01T09:00' });
  check(`${label} 七天層一眼七列`, 7, await p.page.locator('.day-row').count());
  check(`${label} 還沒到的那幾天不能點`, 6, await p.page.locator('div.day-row.future').count());
  check(`${label} 今天那列可以點`, 1, await p.page.locator('button.day-row').count());
  check(`${label} 七天層沒有時間軸`, 0, await p.page.locator('.line').count());
  check(`${label} 記一筆是右下角的小加號`, '＋', (await p.page.locator('#addBtn').innerText()).trim());
  const fabBox = await p.page.locator('#addBtn').boundingBox();
  check(`${label} 加號是小圓鈕不是整行`, true, fabBox.width <= 60 && fabBox.width === fabBox.height, fabBox.width <= 60 && fabBox.width === fabBox.height);

  await addEntry(p.page, { item:'早餐', decision:'bought', amount:75, time:'08:00', decidedAhead:'planned' });
  await addEntry(p.page, { item:'午餐', decision:'bought', amount:120, time:'12:30', decidedAhead:'at_moment' });
  check(`${label} 七天層那列顯示筆數與金額`, true,
    /2 筆/.test(await p.page.locator('#days').innerText()) && /\$195/.test(await p.page.locator('#days').innerText()),
    /2 筆/.test(await p.page.locator('#days').innerText()) && /\$195/.test(await p.page.locator('#days').innerText()));

  await p.page.click('button.day-row');
  await p.page.waitForSelector('#backBtn');
  check(`${label} 點進某一天看到整條時間線`, 1, await p.page.locator('.line').count());
  check(`${label} 那一天的兩筆都在線上`, 2, await p.page.locator('.dot').count());
  check(`${label} 單日頁有當天小計`, true, (await p.page.locator('#daysum').innerText()).includes('這天記了 2 筆，花了 $195'), (await p.page.locator('#daysum').innerText()).includes('這天記了 2 筆，花了 $195'));
  check(`${label} 單日頁網址記住是哪一天`, '#d/2026-11-01', await p.page.evaluate(() => location.hash));

  await addEntry(p.page, { item:'晚餐', decision:'bought', amount:200, time:'19:00', decidedAhead:'planned' });
  check(`${label} 從某一天記一筆會留在那一天`, '#d/2026-11-01', await p.page.evaluate(() => location.hash));
  check(`${label} 新的一筆直接出現在線上`, 3, await p.page.locator('.dot').count());

  await backToWeek(p.page);
  check(`${label} 返回回到七天層`, 7, await p.page.locator('.day-row').count());
  await p.page.goBack();
  check(`${label} 手機返回鍵回得到單日`, 1, await p.page.locator('.line').count());
  await p.ctx.close();

  /* 29. 沒設定問卷網址就不顯示那一段 */
  p = await fresh(browser, base);
  const aiLabel = await p.page.textContent('#aiBtn');
  // 元素不在時要紅，不要卡在 textContent 等到逾時
  const aiHint = (await p.page.locator('#aiHint').count()) ? await p.page.textContent('#aiHint') : '';
  check(`${label} AI 按鈕下面說明只是複製指令`, true, (aiHint || '').includes('複製一段指令') && (aiHint || '').includes('貼到任何一個 AI'));
  check(`${label} AI 按鈕是回顧不是分析`, '讓 AI 幫我回顧這七天', (aiLabel || '').trim());
  check(`${label} 沒設表單網址就不顯示問卷`, 0, await p.page.locator('.survey').count());
  await p.ctx.close();
}

/* ------------------------------------------------------------------ */
const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const engines = engineArg === 'both' ? [['chromium', chromium], ['webkit', webkit]] : [[engineArg, engineArg === 'webkit' ? webkit : chromium]];

try {
  for (const [name, launcher] of engines) {
    const browser = await launcher.launch();
    try { await run(browser, name, base); }
    finally { await browser.close(); }
  }
} finally {
  server.close();
}

const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - [...String(s)].reduce((w,c)=>w+(c.charCodeAt(0)>255?2:1),0)));
console.log(pad('項目', 46), pad('期望', 14), pad('實際', 14), '結果');
let fail = 0;
for (const r of results) {
  if (!r.pass) fail++;
  console.log(pad(r.name, 46), pad(r.expected, 14), pad(r.actual, 14), r.pass ? 'PASS' : 'FAIL');
}
console.log(`\n共 ${results.length} 項，通過 ${results.length - fail} 項，失敗 ${fail} 項。`);
if (wantShots) console.log(`截圖：${SHOTS}`);
process.exit(fail ? 1 : 0);
