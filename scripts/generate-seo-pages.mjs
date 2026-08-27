import fs from "node:fs/promises";
import path from "node:path";

const SITE = "https://site.88lamoney.com";
const OUTPUT_DIR = path.resolve("dist/__seo");

const pages = {
  app: ["88La財務導航｜88La", "從月初分配、平常記錄到月底診斷，找到下一步。"],
  plans: ["88La財務導航方案｜88La", "查看 88La財務導航的月方案與年方案。"],
  pricing: ["88La財務導航訂閱方案", "查看 88La財務導航的訂閱方案與服務內容。"],
  "savings-bag": ["存錢袋與實體理財工具｜88La", "依照日常支出、月初分配、目標儲蓄與年度預存找到適合的工具。"],
  resources: ["免費理財工具與文章｜88La", "先用免費工具找出目前的財務卡點。"],
  "tool-quiz": ["用 60 秒找到理財起點｜88La", "用三個問題找到目前最值得先處理的卡點。"],
  journal: ["理財文章｜88La", "寫給理財新手的台灣生活財務內容。"],
  about: ["關於 88La", "認識 88La 犒賞系存錢的理念與做法。"],
  community: ["8友社群｜88La", "和正在練習理財的人一起交流與前進。"],
  shop: ["88La 實體理財工具", "找到適合日常分配與目標儲蓄的實體工具。"],
  goods: ["88La 推薦好物", "整理實際使用過的生活與理財工具。"],
  ig: ["88La 社群內容", "查看 88La 最新的社群內容與理財觀點。"],
  guide: ["記帳情境解答｜88La", "用常見情境快速找到正確的記帳方式。"],
  newsletter: ["88La 電子報", "訂閱最新理財文章與實用工具通知。"],
  contact: ["聯絡 88La", "品牌合作、課程邀請與媒體採訪聯絡方式。"],
  terms: ["服務條款與退款政策｜88La", "88La財務導航的服務條款、續約方式與退款政策。"],
  privacy: ["隱私政策｜88La", "了解 88La 如何蒐集、使用與保護資料。"],
  disclaimer: ["免責聲明｜88La", "88La財務導航的服務性質與使用責任說明。"],
};

const resources = {
  "credit-card-reserve": "算出這個月刷的卡費還差多少沒預留，並看出扣掉卡費後真正可動用的錢。",
  "declutter-check": "用幾個問題判斷物品是否適合留下，降低衝動購物與重複支出。",
  "emergency-fund-quiz": "檢查目前的緊急預備金狀況，找到適合自己的下一步。",
  "golden-circle": "從為什麼、怎麼做與做什麼，找到能持續的存錢理由。",
  "insurance-safety-fund": "了解保險安定基金的基本保障範圍與使用情境。",
  "savings-bag-quiz": "用 3 到 5 個問題，依照目前最想解決的理財任務，找到適合的 88La 實體理財工具。",
  "spending-check": "檢視日常花錢情境，找出最容易忽略的支出漏洞。",
  "survival-line": "試算每月最低生活需求，建立收入不固定時的分配起點。",
};

const escapeAttribute = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const replaceMeta = (html, selector, value) => html.replace(selector, `$1${escapeAttribute(value)}$3`);

const source = await fs.readFile(path.resolve("dist/index.html"), "utf8");
await fs.mkdir(OUTPUT_DIR, { recursive: true });

for (const [slug, [title, description]] of Object.entries(pages)) {
  const canonical = `${SITE}/${slug}`;
  let html = source
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")([^"]*)("\s*\/?>)/, `$1${escapeAttribute(description)}$3`)
    .replace(/(<link\s+rel="canonical"\s+href=")([^"]*)("\s*\/?>)/, `$1${canonical}$3`)
    .replace(/(<meta\s+property="og:title"\s+content=")([^"]*)("\s*\/?>)/, `$1${escapeAttribute(title)}$3`)
    .replace(/(<meta\s+property="og:description"\s+content=")([^"]*)("\s*\/?>)/, `$1${escapeAttribute(description)}$3`)
    .replace(/(<meta\s+property="og:url"\s+content=")([^"]*)("\s*\/?>)/, `$1${canonical}$3`);
  html = replaceMeta(html, /(<meta\s+name="robots"\s+content=")([^"]*)("\s*\/?>)/, "index,follow");
  await fs.writeFile(path.join(OUTPUT_DIR, `${slug}.html`), html);
}

for (const [slug, description] of Object.entries(resources)) {
  const filePath = path.resolve(`dist/resources/${slug}/index.html`);
  const canonical = `${SITE}/resources/${slug}/index.html`;
  let html = await fs.readFile(filePath, "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || "88La 免費理財工具";
  if (/<meta\s+name="description"/i.test(html)) {
    html = html.replace(/(<meta\s+name="description"\s+content=")([^"]*)("\s*\/?>)/i, `$1${escapeAttribute(description)}$3`);
  } else {
    html = html.replace(/<title>[^<]*<\/title>/i, (tag) => `${tag}\n<meta name="description" content="${escapeAttribute(description)}">`);
  }
  const seoTags = `<link rel="canonical" href="${canonical}">\n<meta property="og:type" content="website">\n<meta property="og:locale" content="zh_TW">\n<meta property="og:title" content="${escapeAttribute(title)}">\n<meta property="og:description" content="${escapeAttribute(description)}">\n<meta property="og:url" content="${canonical}">`;
  if (!/<link\s+rel="canonical"/i.test(html)) html = html.replace(/<\/head>/i, `${seoTags}\n</head>`);
  await fs.writeFile(filePath, html);
}

console.log(`Generated ${Object.keys(pages).length} SEO entry pages and updated ${Object.keys(resources).length} resource pages`);
