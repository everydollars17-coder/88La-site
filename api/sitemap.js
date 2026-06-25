const SITE = "https://88la-site.vercel.app";
const FIRESTORE_URL =
  "https://firestore.googleapis.com/v1/projects/barbara-760bb/databases/(default)/documents/site/articles";

const STATIC_PAGES = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/resources/spending-check/", changefreq: "monthly", priority: "0.7" },
  { loc: "/resources/golden-circle/", changefreq: "monthly", priority: "0.7" },
];

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  let articles = [];
  try {
    const r = await fetch(FIRESTORE_URL);
    if (r.ok) {
      const doc = await r.json();
      const arr = doc?.fields?.value?.arrayValue?.values || [];
      articles = arr
        .map((v) => {
          const m = v?.mapValue?.fields || {};
          return {
            slug: m.slug?.stringValue || null,
            id: m.id?.integerValue || m.id?.stringValue || null,
            date: m.date?.stringValue || null,
          };
        })
        .filter((a) => a.slug || a.id);
    }
  } catch {}

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
    xml += `    <loc>${SITE}/?article=${escapeXml(String(key))}</loc>\n`;
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
