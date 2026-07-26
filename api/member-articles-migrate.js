import { getSiteValue, requireAdmin, setDocument } from "./_security.js";

function redactArticle(article) {
  if (!article?.member) return article;
  return { ...article, content: "", locked: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const articles = await getSiteValue("articles");
    if (!Array.isArray(articles)) return res.status(200).json({ migrated: 0 });

    const legacy = articles.filter((article) => article?.member && article.content && article.id);
    for (const article of legacy) {
      await setDocument(`memberArticles/${encodeURIComponent(article.id)}`, {
        content: article.content,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email,
      });
    }

    if (legacy.length > 0) await setDocument("site/articles", { value: articles.map(redactArticle) });
    await setDocument("site/memberPassword", { value: "" });
    return res.status(200).json({ migrated: legacy.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "migration_failed" });
  }
}
