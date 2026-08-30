import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");

const expected = Object.freeze({
  standard: Object.freeze({ monthly: 199, yearly: 1988, yearlyMonthly: 166, yearlyDiscount: 17 }),
  founder: Object.freeze({ monthly: 149, yearly: 1188, yearlyMonthly: 99 }),
});

function readAmount(name) {
  const match = source.match(new RegExp(`const ${name} = (\\d+);`));
  if (!match) throw new Error(`找不到 ${name}`);
  return Number(match[1]);
}

function assertEqual(label, actual, wanted) {
  if (actual !== wanted) throw new Error(`${label}：期望 ${wanted}，實際 ${actual}`);
}

const actual = {
  standard: {
    monthly: readAmount("APP_MONTHLY_AMOUNT"),
    yearly: readAmount("APP_YEARLY_AMOUNT"),
  },
  founder: {
    monthly: readAmount("FOUNDER_MONTHLY_AMOUNT"),
    yearly: readAmount("FOUNDER_YEARLY_AMOUNT"),
  },
};

actual.standard.yearlyMonthly = Math.round(actual.standard.yearly / 12);
actual.standard.yearlyDiscount = Math.round((1 - actual.standard.yearly / (actual.standard.monthly * 12)) * 100);
actual.founder.yearlyMonthly = Math.round(actual.founder.yearly / 12);

for (const tier of Object.keys(expected)) {
  for (const key of Object.keys(expected[tier])) {
    assertEqual(`${tier}.${key}`, actual[tier][key], expected[tier][key]);
  }
}

const staleMarkers = ["NT$109", "NT$139", "NT$599", "NT$998", "省下約 29%", "NT$99/月"];
for (const marker of staleMarkers) {
  if (source.includes(marker)) throw new Error(`仍有舊方案文字：${marker}`);
}

const foundingNoteMatch = source.match(/foundingNote: `([^`]+)`/);
if (!foundingNoteMatch) throw new Error("找不到創始會員備援文案");
if (foundingNoteMatch[1].includes("兩年方案")) throw new Error("創始會員備援文案仍有兩年方案");

console.table([
  { 身份: "一般會員", 週期: "月繳", 輸入: 199, 期望: 199, 實際: actual.standard.monthly },
  { 身份: "一般會員", 週期: "年繳", 輸入: 1988, 期望: 1988, 實際: actual.standard.yearly },
  { 身份: "一般會員", 週期: "年繳月均", 輸入: "1988 ÷ 12", 期望: 166, 實際: actual.standard.yearlyMonthly },
  { 身份: "一般會員", 週期: "年繳折扣", 輸入: "1 - 1988 ÷ (199 × 12)", 期望: "17%", 實際: `${actual.standard.yearlyDiscount}%` },
  { 身份: "創始會員", 週期: "月繳", 輸入: 149, 期望: 149, 實際: actual.founder.monthly },
  { 身份: "創始會員", 週期: "年繳", 輸入: 1188, 期望: 1188, 實際: actual.founder.yearly },
  { 身份: "創始會員", 週期: "年繳月均", 輸入: "1188 ÷ 12", 期望: 99, 實際: actual.founder.yearlyMonthly },
]);

console.log("價格一致性驗證通過，舊方案文字 0 筆，創始會員兩年方案 0 筆");
