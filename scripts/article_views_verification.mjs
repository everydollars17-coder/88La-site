// 文章瀏覽數的驗算。輸入 → 期望 → 實際，跑過才交付。
// 用法：node scripts/article_views_verification.mjs
import { articleKey, viewCount } from "../src/articleViews.js";

// 與 api/article-view.js 的 SLUG_RE 同一份規則，改一邊要改兩邊
const SLUG_RE = /^[^/\s]{1,120}$/;

const cases = [
  {
    name: "舊殘值加新計數",
    run: () => viewCount({ slug: "a", views: 312 }, { a: 8 }),
    expect: 320,
  },
  {
    name: "還沒有人在修好之後看過，只顯示殘值",
    run: () => viewCount({ slug: "a", views: 312 }, {}),
    expect: 312,
  },
  {
    name: "新文章沒有殘值，只顯示實際次數",
    run: () => viewCount({ slug: "b", views: 0 }, { b: 5 }),
    expect: 5,
  },
  {
    name: "兩邊都沒有時顯示 0，不能是 NaN 或 undefined",
    run: () => viewCount({ slug: "c" }, undefined),
    expect: 0,
  },
  {
    name: "計數是字串時要轉成數字相加，不能變成字串串接",
    run: () => viewCount({ slug: "a", views: 10 }, { a: "5" }),
    expect: 15,
  },
  {
    name: "沒有 slug 的舊文章用 id 當 key",
    run: () => articleKey({ id: 7 }),
    expect: "7",
  },
  {
    name: "有 slug 就以 slug 為準",
    run: () => articleKey({ id: 7, slug: "why-budget" }),
    expect: "why-budget",
  },
  {
    name: "用 id 當 key 時一樣算得到數字",
    run: () => viewCount({ id: 7, views: 1 }, { 7: 3 }),
    expect: 4,
  },
  { name: "slug 驗證：一般英文 slug 通過", run: () => SLUG_RE.test("why-budget"), expect: true },
  { name: "slug 驗證：中文 slug 通過", run: () => SLUG_RE.test("為什麼記帳存不到錢"), expect: true },
  { name: "slug 驗證：含斜線擋掉，避免打到別的文件路徑", run: () => SLUG_RE.test("a/b"), expect: false },
  { name: "slug 驗證：空字串擋掉", run: () => SLUG_RE.test(""), expect: false },
  { name: "slug 驗證：含空白擋掉", run: () => SLUG_RE.test("a b"), expect: false },
  { name: "slug 驗證：超過 120 字擋掉", run: () => SLUG_RE.test("x".repeat(121)), expect: false },
];

let failed = 0;
console.log("項目".padEnd(46), "期望".padEnd(12), "實際");
for (const c of cases) {
  const actual = c.run();
  const ok = Object.is(actual, c.expect);
  if (!ok) failed += 1;
  console.log(
    (ok ? "✅ " : "❌ ") + c.name.padEnd(44),
    String(c.expect).padEnd(12),
    String(actual),
  );
}
console.log(failed === 0 ? `\n全部 ${cases.length} 項通過` : `\n${failed} 項不合格`);
process.exit(failed === 0 ? 0 : 1);
