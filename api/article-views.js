import { listCollection } from "./_security.js";

// 回傳每篇文章實際被看的次數。前端顯示時跟文章本身的舊 views 欄位相加，
// 舊欄位是修好之前累積的殘值，不歸零是為了不讓既有數字看起來像壞掉。
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  try {
    const docs = await listCollection("articleViews");
    const counts = Object.fromEntries(docs.map((d) => [d.id, Number(d.count) || 0]));
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ counts });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "views_unavailable" });
  }
}
