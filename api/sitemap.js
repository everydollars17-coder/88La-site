import { getSiteValue } from "./_security.js";

const SITE = "https://site.88lamoney.com";

const STATIC_PAGES = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/app", changefreq: "monthly", priority: "0.9" },
  { loc: "/plans", changefreq: "monthly", priority: "0.9" },
  { loc: "/savings-bag", changefreq: "weekly", priority: "0.9" },
  { loc: "/tool-quiz", changefreq: "monthly", priority: "0.8" },
  { loc: "/resources", changefreq: "weekly", priority: "0.8" },
  { loc: "/journal", changefreq: "weekly", priority: "0.8" },
  { loc: "/about", changefreq: "monthly", priority: "0.6" },
  { loc: "/guide", changefreq: "monthly", priority: "0.7" },
  { loc: "/newsletter", changefreq: "monthly", priority: "0.6" },
  { loc: "/contact", changefreq: "monthly", priority: "0.5" },
  { loc: "/community", changefreq: "monthly", priority: "0.5" },
  { loc: "/shop", changefreq: "monthly", priority: "0.6" },
  { loc: "/goods", changefreq: "monthly", priority: "0.5" },
  { loc: "/resources/savings-bag-quiz/index.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/resources/emergency-fund-quiz/index.html", changefreq: "monthly", priority: "0.7" },
  { loc: "/resources/spending-check/index.html", changefreq: "monthly", priority: "0.7" },
  { loc: "/resources/golden-circle/index.html", changefreq: "monthly", priority: "0.7" },
  { loc: "/resources/credit-card-reserve/index.html", changefreq: "monthly", priority: "0.7" },
  { loc: "/resources/declutter-check/index.html", changefreq: "monthly", priority: "0.7" },
  { loc: "/resources/insurance-safety-fund/index.html", changefreq: "monthly", priority: "0.7" },
  { loc: "/resources/survival-line/index.html", changefreq: "monthly", priority: "0.7" },
];

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  let articles = [];
  try {
    const value = await getSiteValue("articles");
    articles = Array.isArray(value) ? value.filter((a) => a.slug || a.id) : [];
  } catch (e) {
    console.error(e);
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const p of STATIC_PAGES) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE}${p.loc}</loc>\n`;
    xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const a of articles) {
    const key = a.slug || a.id;
    xml += `  <url>\n`;
    xml += `    <loc>${SITE}/article/${encodeURIComponent(String(key))}</loc>\n`;
    if (a.date) xml += `    <lastmod>${escapeXml(a.date)}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
  res.status(200).send(xml);
}
