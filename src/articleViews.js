// 文章瀏覽數的計算口徑。抽成獨立檔案是為了能用 scripts/article_views_verification.mjs
// 實際跑過再交付，畫面上的數字不靠目視確認。
//
// 顯示值 ＝ 文章物件上的 views 殘值 ＋ articleViews 集合實際累積的次數。
// 殘值是修好之前留下的，那時候訪客的 +1 被 Firestore 規則擋掉，只有管理員自己看才算得進去，
// 所以它不是真實流量，但直接歸零會讓既有數字看起來像壞掉，因此保留並相加。

export const articleKey = article => String(article?.slug || article?.id || "");

export const viewCount = (article, counts) =>
  (Number(article?.views) || 0) + (Number(counts?.[articleKey(article)]) || 0);
