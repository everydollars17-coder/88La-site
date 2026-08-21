/* 88La 資源頁共用埋點。每個資源頁在 </body> 前引入一次，用 data-resource 標明頁面代號。
   導覽列本身是各頁的靜態 HTML，不由這支 JS 產生，這樣就算 JS 沒載入或被擋，
   使用者仍然回得了官網。這支只負責量測，壞掉不影響功能。 */
(function () {
  var GA_ID = "G-D2CKQRTPSR";
  var self = document.currentScript;
  var resource = (self && self.getAttribute("data-resource")) || "unknown";
  var sent = {};

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  if (!window.gtag) window.gtag = gtag;

  // 官網主站已經在 index.html 載過 gtag.js，資源頁是獨立 HTML，要自己載一次
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
  }
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);

  function track(name, params) {
    try {
      window.gtag("event", name, Object.assign({ resource: resource }, params || {}));
    } catch (e) { /* 埋點失敗不能影響工具本身 */ }
  }

  // 完成類事件會被重算邏輯重複觸發，同一頁只記第一次，否則完成率會被灌水
  function trackOnce(name, params) {
    if (sent[name]) return;
    sent[name] = 1;
    track(name, params);
  }

  window.laTrack = track;
  window.laTrackOnce = trackOnce;

  track("resource_view", { page_title: document.title });

  // 試算與填寫類頁面沒有「送出」這個動作，第一次輸入就是有互動的訊號
  document.addEventListener("input", function () { trackOnce("tool_input"); }, true);
  // 這幾張表的完成方式是列印或存成 PDF，用瀏覽器的列印事件記一次就夠
  window.addEventListener("beforeprint", function () { trackOnce("tool_print"); });

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var cta = a.getAttribute("data-la-cta");
    if (cta) return track("cta_click", { cta_target: cta });
    var href = a.getAttribute("href") || "";
    if (/^https?:\/\//.test(href) && a.hostname && a.hostname !== location.hostname) {
      track("outbound_click", { link_domain: a.hostname, link_url: href });
    }
  }, true);
})();
