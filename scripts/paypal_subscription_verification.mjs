import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appSource = await readFile(join(root, "src", "App.jsx"), "utf8");
const buttonSource = await readFile(join(root, "src", "PayPalSubscriptionButton.jsx"), "utf8");
const expectedClientId = "BAA_VVUy2i7l_OQtZ58QUw6j_jiZm4Lm7L9ghlkht9oXmZJiqXxINKlLFX__bzN_KFmOUEaT37zjH-K1uc";

const expected = [
  { key: "monthly", planId: "P-0FK62319ED870344ANKYP5WY", price: "NT$199", renewal: "每月續訂直到取消" },
  { key: "yearly", planId: "P-2ED87151CE647480PNKYP7DA", price: "NT$1,988", renewal: "每年自動續訂" },
  { key: "founderMonthly", planId: "P-11R45855RA663083UNKYP7WA", price: "NT$149", renewal: "每月續訂直到取消" },
  { key: "founderYearly", planId: "P-1GW96481V37613622NKYQBBY", price: "NT$1,188", renewal: "每年自動續訂" },
];

const actualIds = {};
for (const match of appSource.matchAll(/(monthly|yearly|founderMonthly|founderYearly): "(P-[A-Z0-9]+)"/g)) {
  actualIds[match[1]] = match[2];
}

assert.equal(Object.keys(actualIds).length, 4, "PayPal 方案 ID 必須剛好四組");
assert.equal(new Set(Object.values(actualIds)).size, 4, "PayPal 方案 ID 不得重複");
for (const plan of expected) assert.equal(actualIds[plan.key], plan.planId, `${plan.key} 方案 ID 不符`);

assert.equal((appSource.match(/<PayPalSubscriptionButton/g) || []).length, 4, "官網必須渲染四顆 PayPal 訂閱按鈕");
assert.ok(buttonSource.includes(`const PAYPAL_CLIENT_ID = "${expectedClientId}";`), "PayPal client ID 必須與提供值一致");
assert.match(buttonSource, /components=buttons&vault=true&intent=subscription/);
assert.match(buttonSource, /actions\.subscription\.create\(\{ plan_id: planId \}\)/);
assert.match(appSource, /shape: "pill", color: "blue", layout: "vertical", label: "subscribe"/);
assert.match(appSource, /shape: "pill", color: "gold", layout: "vertical", label: "paypal"/);
assert.match(appSource, /shape: "rect", color: "silver", layout: "vertical", label: "paypal"/);
assert.match(buttonSource, /付款完成，等待人工開通/);
assert.match(buttonSource, /訂閱編號與登入 Email/);
assert.match(appSource, /綠界單筆付款，PayPal 每年自動續訂/);
assert.match(appSource, /PayPal 月訂閱與年訂閱會依所選週期自動續訂/);
assert.match(appSource, /曾購買模板 2\.0 的會員會自動取得創始會員資格/);
assert.match(appSource, /系統會依當時購買 Email 比對資格/);
assert.match(appSource, /登入 Email 與模板 2\.0 購買 Email 相同/);

const amount = name => {
  const match = appSource.match(new RegExp(`const ${name} = (\\d+);`));
  assert.ok(match, `找不到 ${name}`);
  return Number(match[1]);
};
const prices = {
  monthly: `NT$${amount("APP_MONTHLY_AMOUNT").toLocaleString("en-US")}`,
  yearly: `NT$${amount("APP_YEARLY_AMOUNT").toLocaleString("en-US")}`,
  founderMonthly: `NT$${amount("FOUNDER_MONTHLY_AMOUNT").toLocaleString("en-US")}`,
  founderYearly: `NT$${amount("FOUNDER_YEARLY_AMOUNT").toLocaleString("en-US")}`,
};
const renewals = {
  monthly: appSource.includes("PayPal 月訂閱與年訂閱會依所選週期自動續訂") ? "每月續訂直到取消" : "未找到",
  yearly: appSource.includes("綠界單筆付款，PayPal 每年自動續訂") ? "每年自動續訂" : "未找到",
  founderMonthly: appSource.includes("每月續訂直到取消") ? "每月續訂直到取消" : "未找到",
  founderYearly: appSource.includes("創始會員年訂閱") && appSource.includes("每年自動續訂") ? "每年自動續訂" : "未找到",
};

for (const plan of expected) {
  assert.equal(prices[plan.key], plan.price, `${plan.key} 顯示價格不符`);
  assert.equal(renewals[plan.key], plan.renewal, `${plan.key} 續訂文案不符`);
}

console.table(expected.map(plan => ({
  方案: plan.key,
  輸入: `${plan.planId}，${plan.price}，${plan.renewal}`,
  期望: `${plan.planId}，${plan.price}，${plan.renewal}`,
  實際: `${actualIds[plan.key]}，${prices[plan.key]}，${renewals[plan.key]}`,
})));
console.log("PayPal 四方案、顯示價格、續訂文案與人工開通流程驗證通過");
