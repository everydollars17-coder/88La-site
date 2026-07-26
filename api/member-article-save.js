import { requireAdmin, setDocument } from "./_security.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const user = await requireAdmin(req, res);
  if (!user) return;

  const articleId = String(req.body?.articleId || "").trim();
  const content = String(req.body?.content || "");
  if (!articleId) return res.status(400).json({ error: "missing_article_id" });

  try {
    await setDocument(`memberArticles/${encodeURIComponent(articleId)}`, {
      content,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "save_failed" });
  }
}
