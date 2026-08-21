import { getSiteValue, firestoreCommit, documentName } from "./_security.js";

// 文章瀏覽數。原本是前端直接把整份 articles 陣列寫回 site/articles，但那份文件的規則是
// 只有管理員能寫，所以訪客的 +1 一律被拒，數字只有我自己在看的時候才會動。
// 放寬規則不是解法：那等於讓任何人覆寫全部文章內容。改成計數獨立成一份文件，用原子遞增。
const SLUG_RE = /^[^/\s]{1,120}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const slug = String(req.body?.slug || "").trim();
  if (!SLUG_RE.test(slug)) return res.status(400).json({ error: "invalid_slug" });

  try {
    // 先確認這個 slug 真的是一篇文章，否則任何人都能打進來建立無限多份垃圾文件
    const articles = await getSiteValue("articles");
    const exists = Array.isArray(articles)
      && articles.some((a) => String(a?.slug || "") === slug || String(a?.id || "") === slug);
    if (!exists) return res.status(404).json({ error: "article_not_found" });

    await firestoreCommit([{
      // 空的 updateMask 表示不改任何一般欄位，只跑下面的遞增；文件不存在時會一併建立
      update: { name: documentName(`articleViews/${encodeURIComponent(slug)}`), fields: {} },
      updateMask: { fieldPaths: [] },
      updateTransforms: [{ fieldPath: "count", increment: { integerValue: "1" } }],
    }]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "view_count_failed" });
  }
}
