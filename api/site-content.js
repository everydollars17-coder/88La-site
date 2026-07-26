import { getSiteValue } from "./_security.js";

const KEY_RE = /^[A-Za-z0-9_-]{1,80}$/;
const BLOCKED_KEYS = new Set(["memberPassword"]);

function redactArticle(article) {
  if (!article || typeof article !== "object") return article;
  if (!article.member) return article;
  return { ...article, content: "", locked: true };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const key = String(req.query.key || "");
  if (!KEY_RE.test(key) || BLOCKED_KEYS.has(key)) return res.status(404).json({ error: "not_found" });

  try {
    let value = await getSiteValue(key);
    if (key === "articles" && Array.isArray(value)) value = value.map(redactArticle);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ value });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "site_content_unavailable" });
  }
}
