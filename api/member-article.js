import crypto from "node:crypto";
import { adminEmails, decodeFirestoreFields, firestoreFetch, getSiteValue, readBearerToken, verifyFirebaseUser } from "./_security.js";

function safeEqual(a, b) {
  const av = Buffer.from(String(a || ""));
  const bv = Buffer.from(String(b || ""));
  return av.length === bv.length && crypto.timingSafeEqual(av, bv);
}

async function isAdminRequest(req) {
  const user = await verifyFirebaseUser(readBearerToken(req));
  const email = user?.email?.toLowerCase();
  return Boolean(email && adminEmails().includes(email));
}

async function readProtectedContent(articleId) {
  const r = await firestoreFetch(`memberArticles/${encodeURIComponent(articleId)}`);
  if (r.ok) {
    const data = await r.json();
    return decodeFirestoreFields(data.fields || {}).content || "";
  }
  if (r.status !== 404) throw new Error(`Protected article read failed: ${r.status}`);

  const articles = await getSiteValue("articles");
  const legacy = Array.isArray(articles)
    ? articles.find((article) => String(article.id) === String(articleId) || String(article.slug) === String(articleId))
    : null;
  return legacy?.member ? legacy.content || "" : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const articleId = String(req.body?.articleId || "").trim();
  if (!articleId) return res.status(400).json({ error: "missing_article_id" });

  const admin = await isAdminRequest(req);
  if (!admin) {
    const password = process.env.MEMBER_ARTICLE_PASSWORD;
    if (!password) return res.status(503).json({ error: "member_password_not_configured" });
    if (!safeEqual(req.body?.password, password)) return res.status(403).json({ error: "invalid_password" });
  }

  try {
    const content = await readProtectedContent(articleId);
    if (!content) return res.status(404).json({ error: "content_not_found" });
    return res.status(200).json({ content });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "read_failed" });
  }
}
