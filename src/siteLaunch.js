// 88La財務導航的正式上線日（台灣時間）。在這天之前，官網所有進 App 的 CTA
// 會攔下來顯示上線提示，方案卡也維持 COMING SOON 遮罩；當天零時之後自動放行，
// 不需要再改程式碼或重新部署。
export const APP_LAUNCH_DATE = "2026-09-10";
export const APP_LAUNCH_NOTICE = "88La財務導航 9/10 正式上線，先看看功能與方案";

// 用台灣時間判斷，避免使用者裝置在別的時區時提早或延後開放
export function isAppLaunched(now = new Date()) {
  const tw = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const ymd = `${tw.getFullYear()}-${String(tw.getMonth() + 1).padStart(2, "0")}-${String(tw.getDate()).padStart(2, "0")}`;
  return ymd >= APP_LAUNCH_DATE;
}
