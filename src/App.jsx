import { useState, useEffect, useLayoutEffect, useRef, Fragment } from "react";
import { articleKey, viewCount } from "./articleViews.js";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs, query, orderBy, deleteDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import DOMPurify from "dompurify";
import { APP_LAUNCH_NOTICE, isAppLaunched } from "./siteLaunch.js";
import { deriveDemoPhonePreview } from "./demoPhonePreviewData.js";

const firebaseConfig = {
  apiKey: "AIzaSyCW8TU318MtXe50MjjqWmmHDydFXv-zA3E",
  authDomain: "barbara-760bb.firebaseapp.com",
  projectId: "barbara-760bb",
  storageBucket: "barbara-760bb.firebasestorage.app",
  messagingSenderId: "1039136998822",
  appId: "1:1039136998822:web:bde7ca93e95e149d4dfb67"
};

const isLocalPreviewHost = () => ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const isLocalAdminPreviewMode = () => isLocalPreviewHost() && new URLSearchParams(window.location.search).get("dev_admin") === "true";
const localPreviewStorageKey = key => `88la_site_preview_${key}`;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const ADMIN_EMAILS = ["everydollars17@gmail.com"];

const APP_URL = "https://app.88lamoney.com";
const PUBLIC_CONTACT_EMAIL = "hello@88lamoney.com";
// 進 App 的 CTA。上線日之前一律鎖住並顯示提示，當天起自動改成真的導過去，
// 判斷在 siteLaunch.js（用台灣時間），9/10 不需要改程式或重新部署。
const appCtaProps = from => (isAppLaunched()
  ? { href: APP_URL, "data-app-source": from }
  : { href: "#app-launch", "data-app-locked": "true", "data-app-source": from });
const QUIZ_URL = "/resources/savings-bag-quiz/index.html";

// 頁面 key ⇄ 網址路徑對照表，供瀏覽器網址列同步用。article 頁另用 /article/:slug 動態路徑處理。
const PAGE_PATHS = {
  home: "/", app: "/app", resources: "/resources", envelope: "/savings-bag", about: "/about",
  journal: "/journal", community: "/community", shop: "/shop", goods: "/goods", ig: "/ig",
  guide: "/guide", "tool-quiz": "/tool-quiz", newsletter: "/newsletter", contact: "/contact",
  plans: "/plans", pricing: "/pricing", terms: "/terms", privacy: "/privacy", disclaimer: "/disclaimer",
  write: "/write", "savings-quiz": "/savings-quiz"
};
const PATH_TO_PAGE = Object.fromEntries(Object.entries(PAGE_PATHS).map(([p, path]) => [path, p]));
const APP_MONTHLY_AMOUNT = 199;
const APP_YEARLY_AMOUNT = 1988;
const FOUNDER_MONTHLY_AMOUNT = 149;
const FOUNDER_YEARLY_AMOUNT = 1188;
const APP_MONTHLY_PRICE = `NT$${APP_MONTHLY_AMOUNT.toLocaleString("en-US")}`;
const APP_YEARLY_PRICE = `NT$${APP_YEARLY_AMOUNT.toLocaleString("en-US")}`;
const FOUNDER_MONTHLY_PRICE = `NT$${FOUNDER_MONTHLY_AMOUNT.toLocaleString("en-US")}`;
const FOUNDER_YEARLY_PRICE = `NT$${FOUNDER_YEARLY_AMOUNT.toLocaleString("en-US")}`;
// 改版文案規範：金額一律 NT$ + 半形空格 + 千分位（NT$ 1,988）。金額本身仍只有上面那組常數是來源
const ntSpaced = amount => `NT$ ${amount.toLocaleString("en-US")}`;
const NT_MONTHLY = ntSpaced(APP_MONTHLY_AMOUNT);
const NT_YEARLY = ntSpaced(APP_YEARLY_AMOUNT);
const APP_YEARLY_DISCOUNT = Math.round((1 - APP_YEARLY_AMOUNT / (APP_MONTHLY_AMOUNT * 12)) * 100);
const APP_YEARLY_MONTHLY_EQUIVALENT = Math.round(APP_YEARLY_AMOUNT / 12);
const PAGE_META = {
  home: ["88La 犒賞系存錢", "先看懂錢去哪，再決定怎麼存。"],
  app: ["88La財務導航｜88La", "從月初分配、平常記錄到月底診斷，找到下一步。"],
  plans: ["88La財務導航方案｜88La", `月方案 ${APP_MONTHLY_PRICE}，年方案 ${APP_YEARLY_PRICE}。`],
  envelope: ["存錢袋與實體理財工具｜88La", "依照日常支出、月初分配、目標儲蓄與年度預存找到適合的工具。"],
  resources: ["免費理財工具與文章｜88La", "先用免費工具找出目前的財務卡點。"],
  "tool-quiz": ["用 60 秒找到理財起點｜88La", "用三個問題找到目前最值得先處理的卡點。"],
  journal: ["理財文章｜88La", "寫給理財新手的台灣生活財務內容。"],
  about: ["關於 88La", "認識 88La 犒賞系存錢的理念與做法。"],
  community: ["8友社群｜88La", "和正在練習理財的人一起交流與前進。"],
  shop: ["88La 實體理財工具", "找到適合日常分配與目標儲蓄的實體工具。"],
  goods: ["88La 推薦好物", "整理實際使用過的生活與理財工具。"],
  ig: ["88La 社群內容", "查看 88La 最新的社群內容與理財觀點。"],
  guide: ["記帳情境解答｜88La", "用常見情境快速找到正確的記帳方式。"],
  newsletter: ["88La 電子報", "訂閱最新理財文章與實用工具通知。"],
  contact: ["聯絡 88La", "品牌合作、課程邀請與媒體採訪聯絡方式。"],
  pricing: ["88La財務導航訂閱方案", "查看 88La財務導航的訂閱方案與服務內容。"],
  terms: ["服務條款與退款政策｜88La", "88La財務導航的服務條款、續約方式與退款政策。"],
  privacy: ["隱私政策｜88La", "了解 88La 如何蒐集、使用與保護資料。"],
  disclaimer: ["免責聲明｜88La", "88La財務導航的服務性質與使用責任說明。"],
};
const pathForPage = p => PAGE_PATHS[p] || "/";
const pageForPath = pathname => {
  if (pathname.startsWith("/article/")) return "article";
  return PATH_TO_PAGE[pathname] || "home";
};
const articleSlugFromPath = pathname => pathname.startsWith("/article/") ? decodeURIComponent(pathname.slice("/article/".length).replace(/\/$/, "")) : null;

const O = "#C85A14";
const O2 = "#FDF0E8";
const CORAL = "#F19483";
const CORAL2 = "#E8806E";
const NAV_TEXT = "#3D1A0A";
const NAV_TEXT_SUB = "rgba(61,26,10,.55)";
const WHITE = "#FFFFFF";
const GRAY = "#F8F8F8";
const CHAR = "#1A1A1A";
const MID = "#6B6B6B";
const LIGHT = "#767676";
const BORDER = "rgba(0,0,0,0.07)";
const GRAD = O2;

const GF = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500&family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,700;1,14..32,300&display=swap');`;

const css = `
${GF}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Noto Sans TC','Inter',sans-serif;background:${WHITE};color:${CHAR};-webkit-font-smoothing:antialiased;}
h1,h2,h3,h4,h5,h6,p,span{word-break:break-word;overflow-wrap:break-word;}
a{text-decoration:none;color:inherit;}
input,textarea,select{font-family:inherit;font-size:14px;border:none;border-bottom:1px solid #D0D5DA;background:transparent;padding:10px 0;outline:none;width:100%;color:${CHAR};}
input:focus,textarea:focus,select:focus{border-bottom-color:${O};}
textarea{resize:vertical;min-height:120px;line-height:1.9;}
button{font-family:inherit;cursor:pointer;border:none;border-radius:8px;}
.pb{background:${O};color:#fff;padding:12px 28px;font-size:13px;font-weight:500;letter-spacing:.5px;border-radius:8px;box-shadow:0 2px 8px rgba(200,90,20,.22);transition:background .18s,box-shadow .18s,transform .18s;}
.pb:hover{background:#A04510;box-shadow:0 6px 20px rgba(200,90,20,.36);transform:translateY(-2px);}
.pb:active{transform:translateY(0);box-shadow:0 2px 8px rgba(200,90,20,.22);}
.pb:disabled{opacity:.4;cursor:default;box-shadow:none;transform:none;}
.pbn{background:${CORAL};color:#fff;padding:12px 28px;font-size:13px;font-weight:500;letter-spacing:.5px;border-radius:8px;transition:background .18s,box-shadow .18s;}
.pbn:hover{background:${CORAL2};box-shadow:0 4px 16px rgba(200,90,20,.2);}
.pg{background:transparent;border:1px solid #D0D5DA;padding:11px 24px;font-size:13px;color:${MID};border-radius:8px;transition:border-color .18s,color .18s,box-shadow .18s;cursor:pointer;}
.pg:hover{border-color:${O};color:${O};box-shadow:0 2px 10px rgba(200,90,20,.1);}
.tag{display:inline-block;background:${O2};color:${O};font-size:11px;padding:4px 12px;letter-spacing:.5px;font-weight:600;border-radius:999px;}
.tagn{display:inline-block;background:${CORAL};color:#fff;font-size:11px;padding:4px 12px;letter-spacing:.5px;font-weight:600;border-radius:999px;}
.ordbtn{background:transparent;border:1px solid #D0D5DA;color:${LIGHT};font-size:11px;padding:2px 6px;line-height:1;cursor:pointer;}
.ordbtn:hover{border-color:${O};color:${O};}
.card{background:${WHITE};border:1px solid ${BORDER};border-radius:20px;box-shadow:0 2px 10px rgba(0,0,0,.06);transition:box-shadow .3s,transform .3s;cursor:pointer;overflow:hidden;}
.card:hover{box-shadow:0 20px 40px rgba(0,0,0,.1);transform:translateY(-6px);}
.feature-row-alt{direction:rtl;}
.feature-row-alt>*{direction:ltr;}
.section-label{font-size:11px;letter-spacing:3px;color:${O};font-weight:500;text-transform:uppercase;}
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-anim { animation: pageEnter 0.32s cubic-bezier(0.16,1,0.3,1); }
@keyframes heroIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-stagger { opacity: 0; animation: heroIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
.hs-1 { animation-delay: 0s; }
.hs-2 { animation-delay: 0.12s; }
.hs-3 { animation-delay: 0.24s; }
.hs-4 { animation-delay: 0.36s; }
@keyframes homeEcosystemEnter {
  from { opacity: 0; transform: translate(var(--home-enter-x, 0), 18px) scale(.98); }
  to { opacity: 1; transform: translate(0, 0) scale(1); }
}
@keyframes homeEcosystemFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(var(--home-float-y, -5px)); }
}
.home-ecosystem-entry {
  opacity: 0;
  animation: homeEcosystemEnter .7s cubic-bezier(.16,1,.3,1) forwards;
}
.home-ecosystem-entry-left { --home-enter-x: -18px; animation-delay: .12s; }
.home-ecosystem-entry-center { --home-enter-x: 0; animation-delay: 0s; }
.home-ecosystem-entry-right { --home-enter-x: 18px; animation-delay: .12s; }
.home-ecosystem-float {
  --home-float-y: -5px;
  animation: homeEcosystemFloat 4.8s ease-in-out .9s infinite;
  will-change: transform;
}
.home-ecosystem-entry-left .home-ecosystem-float,
.home-ecosystem-entry-right .home-ecosystem-float {
  --home-float-y: -3px;
  animation-duration: 5.4s;
}
.home-ecosystem-entry-right .home-ecosystem-float { animation-delay: 1.35s; }
.home-ecosystem-object { transition: transform .24s ease, filter .24s ease; }
.home-ecosystem-stage {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: .92fr 1.16fr .92fr;
  gap: 18px;
  align-items: end;
  width: min(100%, 660px);
  padding: 44px 16px 22px;
}
.home-ecosystem-stage::before {
  content: '';
  position: absolute;
  z-index: -2;
  width: 60%;
  aspect-ratio: 1;
  left: 50%;
  top: 48%;
  transform: translate(-50%,-50%);
  border-radius: 50%;
  background: rgba(232,128,110,.2);
  filter: blur(54px);
  pointer-events: none;
}
.home-ecosystem-links {
  position: absolute;
  z-index: -1;
  inset: 22% 8% auto;
  width: 84%;
  height: 42%;
  color: rgba(200,90,20,.2);
  pointer-events: none;
}
.home-product-preview {
  min-width: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}
.home-product-preview:hover .home-ecosystem-object { transform: translateY(-4px) scale(1.012); }
.home-product-copy { padding: 18px 6px 0; }
.home-product-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  margin-bottom: 9px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(255,255,255,.72);
  color: #9B4611;
  font-size: 11px;
  font-weight: 700;
}
.home-product-title { color: #2D1A0E; font-size: 17px; line-height: 1.4; font-weight: 700; text-wrap: balance; }
.home-product-desc { margin-top: 7px; color: #694737; font-size: 12px; line-height: 1.65; text-wrap: pretty; }
.home-product-action { display: inline-block; margin-top: 10px; color: #A94C13; font-size: 12px; font-weight: 700; }
.home-free-visual { position: relative; height: 238px; }
.home-free-sheet {
  position: absolute;
  width: 88%;
  height: 186px;
  left: 6%;
  bottom: 8px;
  border: 1px solid #E8CDBB;
  border-radius: 14px;
  background: #FFFDFB;
  box-shadow: 0 5px 8px rgba(90,48,21,.08);
}
.home-free-sheet-back { transform: rotate(-3deg) translate(-8px,-16px); background: #FFF6E8; }
.home-free-sheet-mid { transform: rotate(2.5deg) translate(8px,-8px); background: #FCEBDD; }
.home-free-sheet-front { padding: 18px 16px; }
.home-mini-kicker { color: #A94C13; font-size: 10px; font-weight: 700; }
.home-mini-answer { margin-top: 7px; color: #2D1A0E; font-size: 15px; line-height: 1.45; font-weight: 700; }
.home-mini-track { height: 6px; margin: 15px 0 14px; overflow: hidden; border-radius: 99px; background: #F2DDD0; }
.home-mini-track span { display: block; width: 68%; height: 100%; border-radius: inherit; background: #C85A14; }
.home-mini-check { display: flex; align-items: center; gap: 7px; margin-top: 8px; color: #704C39; font-size: 10px; }
.home-mini-check i { width: 16px; height: 16px; display: grid; place-items: center; border-radius: 50%; background: #F8DCCA; color: #A94C13; font-size: 9px; font-style: normal; }
.home-app-visual { position: relative; height: 292px; }
.home-app-phone {
  position: absolute;
  inset: 0 8px;
  overflow: hidden;
  border-radius: 24px;
  background: #F0EDE9;
  box-shadow: 0 20px 38px rgba(66,37,20,.18);
}
.home-app-phone::before { content: ''; display: block; width: 36px; height: 4px; margin: 10px auto 4px; border-radius: 99px; background: rgba(45,26,14,.18); }
.home-app-screen { height: calc(100% - 18px); padding: 12px; background: #F0EDE9; }
.home-app-top { display: flex; align-items: center; justify-content: space-between; color: #2D1A0E; font-size: 10px; font-weight: 700; }
.home-app-month { color: #7A5B49; font-size: 9px; font-weight: 500; }
.home-app-tabs { display: grid; grid-template-columns: repeat(3,1fr); gap: 3px; margin-top: 10px; padding: 3px; border-radius: 9px; background: #E5DDD6; color: #846958; font-size: 8px; text-align: center; }
.home-app-tabs span:first-child { padding: 5px 3px; border-radius: 7px; background: #FFF; color: #2D1A0E; box-shadow: 0 2px 6px rgba(45,26,14,.08); }
.home-app-tabs span:not(:first-child) { padding: 5px 3px; }
.home-app-balance { margin-top: 10px; padding: 12px; border-radius: 12px; background: #FFF; }
.home-app-balance-label { color: #80624F; font-size: 8px; }
.home-app-balance-line { width: 62%; height: 10px; margin-top: 7px; border-radius: 99px; background: #C85A14; opacity: .82; }
.home-app-metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 5px; margin-top: 7px; }
.home-app-metric { min-width: 0; padding: 8px 6px; border-radius: 9px; background: #FFF; }
.home-app-metric span { display: block; color: #775B4A; font-size: 7px; white-space: nowrap; }
.home-app-metric i { display: block; width: 64%; height: 5px; margin-top: 6px; border-radius: 99px; background: #E7C4AD; font-style: normal; }
.home-app-focus { margin-top: 7px; padding: 10px; border-radius: 10px; background: #FFF5EC; color: #2D1A0E; }
.home-app-focus small { display: block; color: #A94C13; font-size: 7px; font-weight: 700; }
.home-app-focus strong { display: block; margin-top: 4px; font-size: 9px; line-height: 1.45; }
.home-physical-visual { position: relative; height: 238px; }
.home-paper-tab {
  position: absolute;
  z-index: 1;
  width: 72%;
  height: 148px;
  left: 14%;
  bottom: 28px;
  padding: 12px;
  border-radius: 8px;
  background: #F8E7D5;
  box-shadow: 0 8px 16px rgba(66,37,20,.11);
  color: #7A4524;
  font-size: 10px;
  font-weight: 700;
}
.home-paper-tab-one { transform: rotate(-9deg) translate(-26px,-13px); background: #F6DDC2; }
.home-paper-tab-two { transform: rotate(8deg) translate(26px,-10px); background: #F3E9D4; text-align: right; }
.home-physical-photo {
  position: absolute;
  z-index: 2;
  width: 90%;
  height: 174px;
  left: 5%;
  bottom: 4px;
  overflow: hidden;
  border-radius: 10px;
  background: #FFF;
  box-shadow: 0 16px 28px rgba(66,37,20,.16);
  transform: rotate(1.5deg);
}
.home-physical-photo img { width: 180%; height: 180%; object-fit: cover; object-position: 62% 50%; transform: translate(-22%,-20%); }
@media(hover:hover) and (pointer:fine){
  .home-product-preview:hover .home-ecosystem-object { transform: translateY(-4px) scale(1.012); }
}
.mob-tab-bar{
  display:none;position:fixed;bottom:0;left:0;right:0;
  height:60px;background:${WHITE};border-top:1px solid ${BORDER};
  z-index:40;align-items:stretch;
  padding-bottom:env(safe-area-inset-bottom,0px);
  box-shadow:0 -4px 20px rgba(0,0,0,.06);
}
.tab-item{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:3px;cursor:pointer;color:${LIGHT};font-size:10px;letter-spacing:.3px;
  transition:color .15s;background:none;border:none;font-family:inherit;padding:6px 2px;
}
.tab-item.active{color:${O};}
.tab-item svg{width:20px;height:20px;flex-shrink:0;}
.demo-state-preview{
  max-width:760px;
  margin:0 auto 30px;
  padding:32px;
  display:grid;
  grid-template-columns:minmax(0,1fr);
  justify-items:center;
  gap:28px;
  background:${WHITE};
  border-radius:16px;
  box-shadow:0 4px 8px rgba(61,26,10,.08);
}
.demo-state-copy{width:100%;min-width:0;text-align:center;}
.demo-state-heading{
  margin-bottom:12px;
  color:${CHAR};
  font-size:24px;
  font-weight:700;
  line-height:1.45;
  text-wrap:balance;
}
.demo-state-intro{
  max-width:460px;
  margin:0 auto 18px;
  color:${MID};
  font-size:14px;
  line-height:1.85;
  text-wrap:pretty;
  white-space:pre-line;
}
.demo-state-tabs{
  display:flex;
  gap:4px;
  width:max-content;
  max-width:100%;
  margin-inline:auto;
  padding:3px;
  background:#EEE8E2;
  border-radius:10px;
}
.demo-state-tab{
  flex:0 0 auto;
  min-width:108px;
  min-height:36px;
  padding:7px 14px;
  background:transparent;
  border-radius:8px;
  color:#5F5650;
  font-size:12px;
  font-weight:700;
  transition:background .18s,color .18s,box-shadow .18s;
}
.demo-state-tab:hover{color:#A84810;}
.demo-state-tab:focus-visible{outline:2px solid #A84810;outline-offset:2px;}
.demo-state-tab[aria-pressed="true"]{
  background:${WHITE};
  color:#A84810;
  box-shadow:0 2px 6px rgba(61,26,10,.1);
}
.demo-state-image-wrap{
  width:100%;
  max-width:360px;
  justify-self:center;
  position:relative;
  padding:10px;
  background:#171411;
  border-radius:46px;
  box-shadow:0 16px 36px rgba(38,22,13,.24);
}
.demo-state-image-wrap::before,
.demo-state-image-wrap::after{
  content:"";
  position:absolute;
  width:3px;
  background:#2B2622;
  border-radius:3px 0 0 3px;
}
.demo-state-image-wrap::before{left:-3px;top:112px;height:58px;}
.demo-state-image-wrap::after{right:-3px;top:150px;height:76px;border-radius:0 3px 3px 0;}
.demo-phone-preview-screen{
  position:relative;
  overflow:hidden;
  background:#F2EEEA;
  border-radius:37px;
}
.demo-phone-status{
  position:relative;
  height:32px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 16px;
  background:#FCFBFA;
  color:#171411;
  font-size:10px;
  font-weight:700;
}
.demo-phone-island{
  position:absolute;
  top:6px;
  left:50%;
  width:82px;
  height:20px;
  transform:translateX(-50%);
  background:#171411;
  border-radius:999px;
}
.demo-phone-status-meta{font-size:9px;letter-spacing:.2px;}
.demo-phone-app-tabs{
  height:45px;
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:2px;
  padding:5px 6px;
  background:#E7E2DC;
}
.demo-phone-app-tab{
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:8px;
  color:#827871;
  font-size:9px;
  font-weight:700;
  white-space:nowrap;
}
.demo-phone-app-tab.active{
  background:${WHITE};
  color:#A84810;
  box-shadow:0 2px 5px rgba(38,22,13,.1);
}
.demo-state-image{
  width:100%;
  display:block;
  animation:demoStateIn .22s cubic-bezier(.16,1,.3,1);
}
.demo-phone-report{
  display:flex;
  flex-direction:column;
  gap:10px;
  padding:12px 8px;
  background:#F2EEEA;
  color:#241D19;
  text-align:left;
}
.demo-phone-summary-card,
.demo-phone-report-card{
  background:${WHITE};
  border-radius:12px;
  box-shadow:0 3px 7px rgba(61,26,10,.08);
}
.demo-phone-summary-card{padding:16px 14px;}
.demo-phone-report-label,
.demo-phone-report-heading{
  color:#AD470D;
  font-size:11px;
  font-weight:700;
}
.demo-phone-balance-row{
  display:flex;
  align-items:baseline;
  gap:8px;
  margin:10px 0 12px;
}
.demo-phone-balance-row>span{
  color:#544B46;
  font-size:10px;
  font-weight:700;
}
.demo-phone-balance-row strong{
  color:#171411;
  font-size:25px;
  line-height:1;
  letter-spacing:-.025em;
}
.demo-phone-balance-row small{
  padding-left:8px;
  border-left:1px solid #AAA19A;
  color:#746A64;
  font-size:10px;
}
.demo-phone-summary-items{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:0;
  padding:9px 6px;
  background:#F7F3F0;
  color:#463D38;
  font-size:9px;
  font-weight:700;
  line-height:1.4;
  text-align:center;
}
.demo-phone-summary-items span+span::before{
  content:"·";
  padding:0 5px;
  color:#8C817A;
}
.demo-phone-report-card{padding:2px 14px;}
.demo-phone-report-block{padding:14px 0;}
.demo-phone-report-block+.demo-phone-report-block{border-top:1px solid #E8E0D9;}
.demo-phone-report-heading{
  padding-bottom:8px;
  border-bottom:1px solid #E8E0D9;
}
.demo-phone-report-item{padding:10px 0 2px;}
.demo-phone-report-item+.demo-phone-report-item{
  margin-top:6px;
  border-top:1px solid #EEE8E2;
}
.demo-phone-report-item strong{
  display:block;
  color:#211B18;
  font-size:13px;
  line-height:1.45;
}
.demo-phone-report-item strong.success{color:#267550;}
.demo-phone-report-item span{
  display:block;
  margin-top:5px;
  color:#685F59;
  font-size:10px;
  line-height:1.65;
}
.demo-phone-closed-intro{
  padding:12px 14px;
  background:#F8F6FF;
  border:1px solid #D9D0FF;
  border-radius:10px;
  color:#554B50;
  font-size:10px;
  font-weight:600;
  line-height:1.65;
}
.demo-phone-closed-milestone{
  padding:10px 12px;
  background:#F8F6FF;
  border:1px solid #D9D0FF;
  border-radius:10px;
  color:#554B50;
  font-size:10px;
  font-weight:700;
  line-height:1.5;
}
.demo-phone-closed-focus{
  padding:16px 14px;
  background:#FFF8F2;
  border:1px solid #F2CDB5;
  border-radius:12px;
  box-shadow:0 3px 7px rgba(61,26,10,.06);
}
.demo-phone-closed-focus.secondary{
  background:${WHITE};
  border-color:#E8E0D9;
  box-shadow:0 3px 7px rgba(61,26,10,.05);
}
.demo-phone-closed-goal{
  padding:14px;
  background:${WHITE};
  border-radius:12px;
  box-shadow:0 3px 7px rgba(61,26,10,.06);
}
.demo-phone-closed-goal strong{
  display:block;
  margin-top:6px;
  color:#332A25;
  font-size:13px;
}
.demo-phone-closed-goal span{
  display:block;
  margin-top:5px;
  color:#685F59;
  font-size:10px;
  line-height:1.6;
}
.demo-phone-closed-focus strong{
  display:block;
  margin-top:8px;
  color:#211B18;
  font-size:18px;
  line-height:1.4;
}
.demo-phone-closed-focus span{
  display:block;
  margin-top:8px;
  color:#685F59;
  font-size:10px;
  line-height:1.65;
}
.demo-phone-closed-link{
  margin-top:10px;
  color:#AD470D!important;
  font-size:10px!important;
  font-weight:700;
}
.demo-phone-closed-confirm,
.demo-phone-closed-action,
.demo-phone-closed-status{
  padding:14px;
  background:${WHITE};
  border-radius:12px;
  box-shadow:0 3px 7px rgba(61,26,10,.08);
}
.demo-phone-closed-confirm{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.demo-phone-closed-confirm strong{color:#267550;font-size:12px;}
.demo-phone-closed-control{
  padding:6px 9px;
  border:1px solid #D8D0CA;
  border-radius:7px;
  color:#685F59;
  font-size:9px;
  font-weight:700;
}
.demo-phone-closed-action{
  background:#FFF8F2;
  border:1px solid #F2CDB5;
}
.demo-phone-closed-action span,
.demo-phone-closed-status>span{
  color:#AD470D;
  font-size:9px;
  font-weight:700;
}
.demo-phone-closed-action strong,
.demo-phone-closed-status strong{
  display:block;
  margin-top:3px;
  color:#332A25;
  font-size:12px;
}
.demo-phone-closed-action .demo-phone-closed-primary{
  display:block;
  margin-top:10px;
  padding:8px 10px;
  background:#C85A14;
  border-radius:8px;
  color:${WHITE};
  font-size:10px;
  font-weight:700;
  text-align:center;
}
.demo-phone-closed-badges{
  display:flex;
  flex-wrap:wrap;
  gap:5px;
  margin-top:9px;
}
.demo-phone-closed-status{
  padding:10px 12px;
  box-shadow:none;
  border:1px solid #E8E0D9;
}
.demo-phone-closed-status-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}
.demo-phone-closed-status strong{margin-top:0;}
.demo-phone-closed-status .demo-phone-closed-badges{margin-top:7px;}
.demo-phone-closed-badges span{
  padding:4px 7px;
  background:#F2EEEA;
  border-radius:999px;
  color:#685F59;
  font-size:8px;
  font-weight:700;
}
.demo-interactive-heading{
  margin:0 auto 18px;
  color:${CHAR};
  font-size:17px;
  font-weight:700;
  line-height:1.6;
  text-align:center;
}
@keyframes demoStateIn{
  from{opacity:.35;transform:translateY(6px);}
  to{opacity:1;transform:translateY(0);}
}
@media(max-width:768px){
  .nav-links{display:none!important;}
  .mob-menu{display:flex!important;}
  .hero-title{font-size:34px!important;line-height:1.25!important;}
  .hero-sub{font-size:14px!important;}
  .page-wrap{padding:40px 20px 88px!important;}
  .grid2{grid-template-columns:1fr!important;}
  .grid3{grid-template-columns:1fr!important;}
  .feature-row-alt{direction:ltr!important;}
  .feature-row-item{gap:24px!important;padding:32px 0!important;}
  .footer-grid4{grid-template-columns:1fr 1fr!important;}
  .legacy-card{flex-direction:column!important;align-items:flex-start!important;}
  .grid-ig{grid-template-columns:1fr 1fr!important;}
  .feedback-slide{flex-basis:78vw!important;}
  .about-grid{grid-template-columns:1fr!important;}
  .about-img{aspect-ratio:4/3!important;}
  .banner-h{height:460px!important;}
  .hide-mob{display:none!important;}
  .mob-tab-bar{display:flex!important;}
  .site-footer{padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))!important;}
  .demo-sect{padding:40px 12px!important;}
  .demo-card{padding:14px 8px 18px!important;}
  .demo-phone{padding:8px 6px!important;}
  .demo-state-preview{
    grid-template-columns:1fr;
    gap:24px;
    margin-bottom:28px;
    padding:22px 12px;
    border-radius:14px;
  }
  .demo-state-heading{font-size:20px;line-height:1.5;}
  .demo-state-intro{font-size:13px;margin-bottom:18px;}
  .demo-state-tab{min-width:104px;padding-inline:10px;font-size:11px;}
  .demo-state-image-wrap{padding:8px;border-radius:40px;}
  .demo-phone-preview-screen{border-radius:33px;}
  .demo-interactive-heading{font-size:16px;margin-bottom:14px;}
  .home-ecosystem-float{--home-float-y:-3px;}
  .home-ecosystem-entry-left .home-ecosystem-float,
  .home-ecosystem-entry-right .home-ecosystem-float{--home-float-y:-2px;}
  .home-ecosystem-stage{
    display:grid;
    grid-template-columns:1fr;
    gap:52px;
    width:100%;
    max-width:100%;
    margin-inline:0;
    padding:22px 0 12px;
    overflow:visible;
  }
  .home-ecosystem-stage::before{width:120%;top:42%;filter:blur(68px);}
  .home-ecosystem-links{display:none;}
  .home-product-preview{
    width:min(100%,360px);
    max-width:100%;
    justify-self:center;
  }
  .home-ecosystem-entry-left,
  .home-ecosystem-entry-right{--home-enter-x:0;}
  .home-free-visual,.home-physical-visual{height:220px;}
  .home-app-visual{height:270px;}
  .home-product-copy{padding:16px 4px 0;}
  .home-product-title{font-size:18px;}
  .home-product-desc{font-size:13px;}
}
@media(prefers-reduced-motion:reduce){
  .demo-state-image{animation:none!important;}
}
@media(min-width:769px){
  .mob-menu{display:none!important;}
  .mob-panel{display:none!important;}
}
.feedback-carousel-track{scrollbar-width:none;-ms-overflow-style:none;}
.feedback-carousel-track::-webkit-scrollbar{display:none;}
.feedback-slide{scroll-snap-align:center;flex:0 0 clamp(220px,28vw,300px);}
.article-content h2,.rich-ed h2{font-size:22px;font-weight:700;color:#1A1A1A;margin:32px 0 12px;line-height:1.4;}
.article-content h3,.rich-ed h3{font-size:18px;font-weight:600;color:#1A1A1A;margin:24px 0 10px;line-height:1.4;}
.rich-ed p{margin-bottom:18px;line-height:1.8;}
.article-content p{margin-bottom:18px;line-height:1.8;}
.article-content ul,.article-content ol{padding-left:24px;margin-bottom:16px;}
.article-content li{margin-bottom:6px;line-height:1.7;}
.article-content strong{font-weight:700;}
.article-content em{font-style:italic;}
.article-content u{text-decoration:underline;}
.article-content a{color:${O};text-decoration:underline;}
.rich-ed a{color:${O};text-decoration:underline;}
*:focus-visible{outline:2px solid ${O};outline-offset:2px;}
button:focus-visible{border-radius:4px;}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;}
  .page-anim{animation:none;}
  .card:hover{transform:none;}
  .home-ecosystem-entry{opacity:1;animation:none;transform:none;}
  .home-ecosystem-float{animation:none;will-change:auto;}
  .home-product-preview:hover .home-ecosystem-object{transform:none;}
}

/* ========= 2026-09 官網改版：共用設計系統（nx-）與首頁（hm-） ========= */
:root{
  --nx-bg:#FCFAF6;--nx-bg2:#F7F2E9;--nx-card:#FFFFFF;
  --nx-o:#E07238;--nx-od:#C95A26;--nx-os:#FBE6D2;--nx-ost:#7C3617;--nx-ol:#A4471D;
  --nx-dark:#494949;--nx-dt:#FCFAF6;--nx-ds:rgba(252,250,246,.62);--nx-dl:#E8A578;
  --nx-t1:#2E2A21;--nx-t2:#574F40;--nx-t3:#877C68;--nx-t4:#A79B85;--nx-t5:#B5A893;
  --nx-bd:#E4DCC9;--nx-hair:#F0E9DA;
  /* 首頁月底診斷用：警示紅（超支數字）與改善綠（調整後的數字），只在診斷敘事裡出現 */
  --nx-warn:#B84A3E;--nx-good:#9BBF77;
  --nx-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,monospace;
  --nx-ease:cubic-bezier(.2,.7,.2,1);
  --nx-sh:0 1px 0 rgba(46,42,33,.04),0 8px 24px -12px rgba(46,42,33,.10);
  --nx-pad:40px;--nx-navh:66px;
}
@media(max-width:900px){:root{--nx-pad:20px;--nx-navh:58px;}}

.nx-page{background:var(--nx-bg);color:var(--nx-t1);font-family:'Noto Sans TC','PingFang TC',system-ui,sans-serif;}
/* 這是 reset，不是樣式：用 :where() 讓它的權重歸零，否則 .nx-page p 的權重
   會蓋掉 .nx-hero-p 這類單一 class 的 margin，所有段落間距都會被歸零
   （Barbara 2026-09-01 回報「整個擠在一坨」的成因） */
:where(.nx-page) :where(h1,h2,h3,h4,p,dl,dd,ul,ol){margin:0;}
.nx-page img{max-width:100%;height:auto;}
.nx-in{max-width:1120px;margin:0 auto;padding-inline:var(--nx-pad);}
.nx-mono{font-family:var(--nx-mono);letter-spacing:.06em;}
.nx-eyebrow{font-size:clamp(11px,1.2vw,13px);font-weight:700;letter-spacing:.14em;color:var(--nx-o);}
.nx-eyebrow+.nx-h2,.nx-eyebrow+h2{margin-top:12px;}
.nx-h2+.nx-lead,h2+.nx-lead,.nx-h2+.nx-body{margin-top:16px;}
.nx-eyebrow-mute{color:var(--nx-t3);}
.nx-eyebrow-dark{color:#EB8A48;}
.nx-h2{font-size:clamp(24px,3.4vw,34px);font-weight:700;letter-spacing:-.02em;line-height:1.35;text-wrap:pretty;}
.nx-h3{font-size:clamp(17px,1.8vw,20px);font-weight:700;line-height:1.45;}
.nx-h4{font-size:clamp(16px,1.6vw,18px);font-weight:700;line-height:1.5;}
.nx-lead{font-size:clamp(14px,1.4vw,15px);color:var(--nx-t3);line-height:1.8;text-wrap:pretty;}
.nx-body{font-size:clamp(14px,1.5vw,16px);color:var(--nx-t2);line-height:1.9;text-wrap:pretty;}
.nx-sm{font-size:14px;color:var(--nx-t2);line-height:1.85;}
.nx-card{background:var(--nx-card);border:1px solid var(--nx-bd);border-radius:16px;box-shadow:var(--nx-sh);}
.nx-hr{margin-top:24px;padding-top:20px;border-top:1px dotted var(--nx-t5);}
.nx-anchor{scroll-margin-top:calc(var(--nx-navh) + 24px);}
@media(max-width:900px){.nx-anchor{scroll-margin-top:calc(var(--nx-navh) + 16px);}}
.nx-only-mob{display:none!important;}
.nx-link{color:var(--nx-od);text-decoration:underline;text-underline-offset:2px;cursor:pointer;}
.nx-link:hover{color:var(--nx-o);}
@media(max-width:768px){
  .nx-hide-mob{display:none!important;}
  .nx-only-mob{display:block!important;}
}

/* 按鈕 */
.nx-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid transparent;border-radius:999px;font-family:inherit;font-weight:700;line-height:1.2;text-align:center;cursor:pointer;white-space:nowrap;
  transition:background .2s var(--nx-ease),color .2s var(--nx-ease),border-color .2s var(--nx-ease),box-shadow .2s var(--nx-ease),transform .12s var(--nx-ease);}
.nx-btn:active{transform:scale(.98);}
.nx-btn-pri{background:var(--nx-o);color:#fff;box-shadow:0 8px 20px -10px rgba(224,114,56,.9);}
.nx-btn-pri:hover{background:var(--nx-od);color:#fff;box-shadow:0 10px 24px -10px rgba(224,114,56,.95);}
.nx-btn-sec{background:#fff;border-color:var(--nx-bd);color:var(--nx-t2);font-weight:600;}
.nx-btn-sec:hover{border-color:var(--nx-o);color:var(--nx-od);}
.nx-btn-sec-strong{color:var(--nx-t1);}
.nx-btn-lg{padding:15px 30px;font-size:clamp(15px,1.6vw,16px);}
.nx-btn-md{padding:13px 24px;font-size:15px;}
.nx-btn-sm{padding:11px 20px;font-size:14px;font-weight:600;}
.nx-btn-block{display:flex;width:100%;}
/* 上線前的 CTA 掛一個「9/10 開放」小標，讓人在按下去之前就知道。
   靠 data-app-locked 判斷，上線日之後 appCtaProps 不再帶這個屬性，小標自動消失 */
.nx-price-blur{display:inline-block;filter:blur(.2em);opacity:.5;user-select:none;-webkit-user-select:none;vertical-align:baseline;}
.nx-price-note{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;
  background:var(--nx-dark);color:var(--nx-dt);font-size:13px;font-weight:700;line-height:1.5;}
.nx-price-note::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--nx-o);flex-shrink:0;}
.nx-btn[data-app-locked="true"]{position:relative;overflow:visible;}
.nx-btn[data-app-locked="true"]::after{
  content:"9/10 開放";position:absolute;top:-10px;right:-6px;
  padding:3px 9px;border-radius:999px;background:var(--nx-dark);color:var(--nx-dt);
  font-size:10px;font-weight:700;line-height:1.5;white-space:nowrap;pointer-events:none;
  box-shadow:0 3px 10px -3px rgba(46,42,33,.5);}
.nx-nav-in .nx-btn[data-app-locked="true"]::after{top:-11px;right:-8px;font-size:9px;padding:2px 8px;}
@media(max-width:900px){.nx-btn[data-app-locked="true"]::after{top:-9px;right:8px;}}

/* 導覽列 */
.nx-nav{position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid var(--nx-bd);}
.nx-nav-in{display:flex;align-items:center;justify-content:space-between;gap:24px;max-width:1120px;margin:0 auto;padding:18px var(--nx-pad);}
.nx-nav-left{display:flex;align-items:center;gap:36px;min-width:0;}
.nx-logo{padding:0;background:none;border:none;font-family:inherit;font-size:19px;font-weight:900;letter-spacing:-.02em;color:var(--nx-t1);cursor:pointer;transition:transform .12s var(--nx-ease);}
.nx-logo:active{transform:scale(.96);}
.nx-logo i{font-style:normal;color:var(--nx-o);}
.nx-nav-links{display:flex;gap:26px;}
/* 目前頁面的底線用 ::after 畫，切頁時從中間展開；不用 border-bottom，
   才不會跟瀏覽器的 focus outline 疊成一個橘色圓角框（Barbara 2026-09-01 回報） */
.nx-nav-link{position:relative;padding:2px 2px 6px;background:none;border:none;font-family:inherit;font-size:14px;color:var(--nx-t2);white-space:nowrap;cursor:pointer;transition:color .2s var(--nx-ease);}
.nx-nav-link::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:2px;background:var(--nx-o);transform:scaleX(0);transform-origin:center;transition:transform .28s var(--nx-ease);}
.nx-nav-link:hover{color:var(--nx-t1);}
.nx-nav-link:hover::after{transform:scaleX(.45);background:var(--nx-bd);}
.nx-nav-link:active{transform:translateY(1px);}
.nx-nav-link.is-current{font-weight:600;color:var(--nx-t1);}
.nx-nav-link.is-current::after,.nx-nav-link.is-current:hover::after{transform:scaleX(1);background:var(--nx-o);}
/* 全站的 focus-visible 是方框加圓角，套在導覽列上會變成一個橘框，這裡改成細底線 */
.nx-nav-link:focus-visible,.nx-mob-link:focus-visible{outline:none;box-shadow:0 2px 0 0 var(--nx-o);border-radius:2px;}
@media(prefers-reduced-motion:reduce){.nx-nav-link::after{transition:none;}}
.nx-nav-right{display:flex;align-items:center;gap:16px;}
.nx-nav-text{background:none;border:none;padding:0;font-family:inherit;font-size:14px;color:var(--nx-t2);cursor:pointer;transition:color .2s var(--nx-ease);}
.nx-nav-text:hover{color:var(--nx-od);}
.nx-burger{display:none;align-items:center;justify-content:center;width:40px;height:40px;margin-right:-8px;padding:0;background:none;border:none;color:var(--nx-t1);cursor:pointer;}
.nx-nav-admin{display:flex;align-items:center;gap:12px;font-size:12px;color:var(--nx-t3);}
.nx-nav-admin button{background:none;border:none;padding:0;font-family:inherit;font-size:12px;color:var(--nx-t3);cursor:pointer;text-decoration:underline;}
.nx-nav-admin button:hover{color:var(--nx-od);}
.nx-mob-panel{border-top:1px solid var(--nx-bd);background:#fff;padding:6px var(--nx-pad) 18px;}
.nx-mob-link{display:block;width:100%;padding:14px 0;background:none;border:none;border-bottom:1px solid var(--nx-hair);font-family:inherit;font-size:16px;color:var(--nx-t2);text-align:left;cursor:pointer;transition:color .2s var(--nx-ease),padding-left .2s var(--nx-ease);}
.nx-mob-link:active{color:var(--nx-od);padding-left:6px;}
.nx-mob-link.is-current{font-weight:700;color:var(--nx-t1);}
.nx-mob-foot{display:flex;align-items:center;gap:12px;margin-top:16px;}
.nx-mob-foot .nx-btn{flex:1;}
@media(max-width:900px){
  .nx-nav-in{padding:14px var(--nx-pad);}
  .nx-logo{font-size:17px;}
  .nx-nav-links,.nx-nav-right{display:none;}
  .nx-burger{display:flex;}
}
@media(min-width:901px){.nx-mob-panel{display:none;}}

/* ===== 首頁 ===== */
.nx-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,min(470px,45%));gap:48px;align-items:center;padding-block:clamp(30px,5vw,64px) clamp(26px,4.5vw,56px);}
.nx-badge{display:inline-flex;align-items:center;gap:10px;margin-bottom:clamp(22px,2.6vw,28px);padding:6px 14px 6px 8px;border-radius:999px;background:var(--nx-os);}
.nx-badge b{padding:3px 9px;border-radius:999px;background:var(--nx-o);color:#fff;font-size:clamp(10px,1.1vw,11px);font-weight:700;letter-spacing:.06em;}
.nx-badge span{font-size:clamp(12px,1.3vw,13px);font-weight:600;color:var(--nx-ost);}
.nx-h1{margin-bottom:clamp(22px,2.6vw,28px);font-size:clamp(27px,4.4vw,52px);font-weight:700;line-height:1.24;letter-spacing:-.025em;text-wrap:pretty;}
.nx-hero-p{max-width:460px;margin-bottom:18px;font-size:clamp(15px,1.7vw,17px);line-height:1.85;color:var(--nx-t2);text-wrap:pretty;}
.nx-hero-p2{max-width:460px;margin-bottom:clamp(30px,3.6vw,38px);font-size:15px;line-height:1.8;color:var(--nx-t3);}
.nx-cta-row{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-bottom:clamp(26px,3vw,32px);}
.nx-proof{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;font-size:13px;color:var(--nx-t3);}
.nx-proof i{font-style:normal;color:var(--nx-bd);}
.nx-shot-wrap{display:flex;justify-content:center;}
.nx-shot{width:100%;max-width:470px;height:auto;display:block;filter:drop-shadow(0 30px 50px rgba(46,42,33,.26));}
@media(max-width:900px){
  .nx-hero{grid-template-columns:minmax(0,1fr);gap:8px;}
  .nx-hero-p,.nx-hero-p2{max-width:none;}
  /* 手機版只留一段說明，它與按鈕之間要有跟桌機 p2 一樣的呼吸空間 */
  .nx-hero-p{margin-bottom:30px;}
  .nx-cta-row{flex-direction:column;align-items:stretch;gap:12px;margin-bottom:26px;}
  .nx-cta-row .nx-btn{width:100%;}
  .nx-proof{justify-content:center;font-size:12px;}
  .nx-shot{max-width:390px;margin:0 auto;filter:drop-shadow(0 20px 36px rgba(46,42,33,.22));}
}

.nx-band{background:var(--nx-bg2);border-block:1px solid var(--nx-bd);}
.nx-dark{background:var(--nx-dark);}

.hm-story{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(24px,5vw,56px);align-items:center;padding-block:clamp(28px,4.5vw,56px);}
.hm-story h2{margin-bottom:22px;font-size:clamp(26px,3.8vw,38px);font-weight:700;line-height:1.35;letter-spacing:-.02em;text-wrap:pretty;}
.hm-story .nx-mono{display:block;margin-bottom:18px;font-size:clamp(12px,1.3vw,13px);color:var(--nx-o);}
.hm-story .nx-shot{max-width:440px;}
.hm-story-p{max-width:440px;margin-bottom:24px;font-size:clamp(15px,1.6vw,16px);line-height:1.9;color:var(--nx-t2);}
.hm-quote{max-width:420px;margin-top:28px;padding-left:16px;border-left:2px solid var(--nx-bd);font-size:15px;line-height:1.85;color:var(--nx-t3);}
@media(max-width:900px){
  .hm-story{grid-template-columns:minmax(0,1fr);gap:20px;}
  .hm-story-p,.hm-quote{max-width:none;}
  /* 手機一律文字在上、截圖在下；桌機才照設計稿左右交替（.hm-story-flip 這一段圖在左） */
  .hm-story-flip>.nx-shot-wrap{order:2;}
}

/* 月底診斷導言：設計稿桌機 38px / 手機 27px，比 .nx-h2 大一階，所以獨立一個字級 */
.hm-dg-h1{font-size:clamp(27px,4vw,38px);font-weight:700;line-height:1.3;letter-spacing:-.025em;color:var(--nx-t1);text-wrap:pretty;}

/* 兩個情境：桌機並排、中間一條分隔線；手機上下堆疊，分隔線收掉 */
.hm-sc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));}
.hm-sc>div{padding-block:clamp(26px,4vw,40px);}
.hm-sc>div:first-child{padding-right:clamp(20px,3vw,40px);border-right:1px solid var(--nx-bd);}
.hm-sc>div:last-child{padding-left:clamp(20px,3vw,40px);}
.hm-sc-lb{margin-bottom:clamp(12px,1.6vw,16px);font-size:clamp(12px,1.3vw,13px);color:var(--nx-ol);}
.hm-sc-h{margin-bottom:clamp(14px,1.8vw,18px);font-size:clamp(18px,2vw,20px);font-weight:700;line-height:1.6;text-wrap:pretty;}
.hm-sc-box{padding:clamp(18px,2.4vw,24px);}
.hm-sc-big{margin-bottom:6px;font-size:clamp(30px,3.6vw,34px);font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:var(--nx-warn);}
.hm-sc-p{font-size:clamp(14px,1.5vw,15px);line-height:1.8;color:var(--nx-t2);}
.hm-sc-note{margin-top:clamp(14px,1.6vw,16px);font-size:clamp(14px,1.5vw,15px);font-weight:600;line-height:1.8;}
.hm-tri{display:flex;flex-direction:column;gap:8px;}
.hm-tri>div{display:flex;align-items:baseline;justify-content:space-between;gap:12px;}
.hm-tri span{font-size:clamp(13px,1.4vw,14px);color:var(--nx-t3);}
.hm-tri b{font-size:clamp(15px,1.6vw,16px);font-weight:600;font-variant-numeric:tabular-nums;}
.hm-tri-now{padding-top:8px;border-top:1px dotted var(--nx-t5);}
.hm-tri-now b{font-weight:700;color:var(--nx-warn);}
@media(max-width:768px){
  .hm-sc{grid-template-columns:minmax(0,1fr);}
  .hm-sc>div:first-child{padding-right:0;padding-bottom:0;border-right:none;}
  .hm-sc>div:last-child{padding-left:0;padding-top:22px;}
}

/* 你的月底，通常是這樣：全站唯一一次痛點 */
.hm-typ{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(12px,2vw,20px);}
.hm-typ article{padding:clamp(18px,2.4vw,26px);}
.hm-typ p:first-child{margin-bottom:clamp(8px,1.2vw,14px);font-size:clamp(16px,1.9vw,19px);font-weight:600;line-height:1.6;text-wrap:pretty;}
.hm-typ p:last-child{font-size:clamp(13px,1.4vw,14px);color:var(--nx-t3);line-height:1.8;}
@media(max-width:900px){.hm-typ{grid-template-columns:minmax(0,1fr);}}

/* 深色診斷區：桌機左文右圖，手機依序 標題 → 截圖 → 兩張診斷卡 */
.hm-dg{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(24px,4vw,48px);align-items:start;}
.hm-dg-head{grid-column:1;grid-row:1;}
.hm-dg-cards{grid-column:1;grid-row:2;display:flex;flex-direction:column;gap:14px;}
.hm-dg-shot{grid-column:2;grid-row:1 / span 2;}
.hm-dg-shot .nx-shot{max-width:500px;}
.hm-dg-lb{margin-bottom:clamp(12px,1.6vw,16px);font-size:clamp(12px,1.3vw,13px);}
.hm-dg-h2{margin-bottom:clamp(16px,2.2vw,24px);font-size:clamp(26px,3.6vw,34px);font-weight:700;line-height:1.35;letter-spacing:-.025em;color:var(--nx-dt);text-wrap:pretty;}
.hm-dg-card{padding:clamp(20px,2.4vw,26px);border-radius:16px;background:var(--nx-bg);}
.hm-dg-no{margin-bottom:clamp(10px,1.2vw,12px);font-size:clamp(11px,1.2vw,12px);font-weight:700;letter-spacing:.1em;color:var(--nx-ol);}
.hm-dg-body{margin-bottom:clamp(12px,1.4vw,14px);padding-left:14px;border-left:2px solid var(--nx-o);font-size:clamp(14px,1.5vw,15px);line-height:1.85;}
.hm-dg-act{padding-top:clamp(12px,1.4vw,14px);border-top:1px dotted var(--nx-t5);font-size:clamp(14px,1.5vw,15px);font-weight:600;line-height:1.8;}
.hm-dg-foot{margin-top:clamp(16px,2vw,20px);font-size:clamp(13px,1.4vw,14px);line-height:1.85;color:rgba(252,250,246,.5);}

/* 下個月只改兩件事 */
.hm-next{margin-top:clamp(26px,3.6vw,44px);padding-top:clamp(22px,2.8vw,36px);border-top:1px dotted rgba(252,250,246,.24);}
.hm-next-lb{margin-bottom:clamp(14px,1.6vw,16px);font-size:clamp(12px,1.3vw,13px);color:var(--nx-good);}
.hm-next-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(10px,1.6vw,20px);}
.hm-next-grid>div{padding:clamp(18px,2.2vw,24px);border:1px solid rgba(252,250,246,.16);border-radius:16px;background:rgba(252,250,246,.07);}
.hm-next-k{margin-bottom:clamp(8px,1vw,10px);font-size:clamp(12px,1.3vw,13px);color:rgba(252,250,246,.55);}
.hm-next-row{display:flex;align-items:baseline;gap:clamp(10px,1.2vw,12px);flex-wrap:wrap;margin-bottom:10px;}
.hm-next-old{font-size:clamp(18px,2.2vw,22px);font-weight:600;font-variant-numeric:tabular-nums;color:rgba(252,250,246,.45);text-decoration:line-through;}
.hm-next-arw{font-size:clamp(15px,1.8vw,18px);color:rgba(252,250,246,.45);}
.hm-next-new{font-size:clamp(25px,3.2vw,30px);font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--nx-good);}
.hm-next-old2{margin-bottom:4px;font-size:clamp(15px,1.7vw,16px);color:rgba(252,250,246,.45);text-decoration:line-through;}
.hm-next-new2{margin-bottom:10px;font-size:clamp(19px,2.2vw,22px);font-weight:700;line-height:1.5;color:var(--nx-dt);}
.hm-next-d{font-size:clamp(13px,1.4vw,14px);line-height:1.8;color:rgba(252,250,246,.6);}
@media(max-width:900px){
  .hm-dg{grid-template-columns:minmax(0,1fr);gap:20px;}
  .hm-dg-head,.hm-dg-shot,.hm-dg-cards{grid-column:1;grid-row:auto;}
  .hm-dg-shot .nx-shot{max-width:340px;filter:drop-shadow(0 20px 36px rgba(0,0,0,.45));}
  .hm-next-grid{grid-template-columns:minmax(0,1fr);}
  .hm-next-row{margin-bottom:0;}
}

.hm-feat{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(12px,2.2vw,24px);}
.hm-feat article{padding:20px 20px 8px;}
.hm-feat h3{margin-bottom:6px;font-size:clamp(15px,1.8vw,19px);font-weight:700;}
.hm-feat-more{font-weight:600;}
.hm-feat p{margin-bottom:14px;font-size:13px;color:var(--nx-t3);line-height:1.8;}
.hm-feat img{width:100%;display:block;}
@media(max-width:900px){.hm-feat{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}.hm-feat article{padding:16px 16px 6px;}.hm-feat h3{margin-bottom:10px;}}


.nx-stack{display:grid;grid-template-columns:.85fr 1.15fr;gap:clamp(24px,4.5vw,56px);align-items:start;}
.nx-stack-list{display:flex;flex-direction:column;gap:14px;}
.nx-stack-list article{padding:clamp(20px,2.2vw,26px);border-radius:16px;}
.nx-stack-now{background:var(--nx-bg);}
.nx-stack-next{background:rgba(252,250,246,.08);border:1px solid rgba(252,250,246,.16);}
.nx-stack-list h3{margin-bottom:10px;font-size:clamp(17px,1.8vw,19px);font-weight:700;}
.nx-stack-now h3{color:var(--nx-t1);}
.nx-stack-next h3{color:var(--nx-dt);}
.nx-stack-now p{font-size:14px;color:var(--nx-t2);line-height:1.85;}
.nx-stack-next p{font-size:14px;color:var(--nx-ds);line-height:1.85;}
.nx-stack-tag{display:inline-block;margin-top:10px;font-size:12px;font-weight:700;color:var(--nx-ol);}
@media(max-width:900px){.nx-stack{grid-template-columns:minmax(0,1fr);gap:22px;}}


.nx-inline-cta{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;}
.nx-inline-cta p{font-size:clamp(14px,1.5vw,15px);color:var(--nx-t2);}
.nx-inline-cta div{display:flex;gap:12px;flex-wrap:wrap;}
@media(max-width:640px){.nx-inline-cta div{flex-direction:column;width:100%;}.nx-inline-cta .nx-btn{width:100%;}}

.hm-value{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(18px,2.6vw,28px);max-width:920px;margin:0 auto;}
.hm-value>div{padding-top:clamp(16px,2vw,20px);border-top:2px solid var(--nx-o);}
.hm-value h3{margin-bottom:10px;font-size:clamp(18px,2vw,21px);font-weight:700;}
.hm-value p{font-size:14px;color:var(--nx-t2);line-height:1.85;}
@media(max-width:900px){.hm-value{grid-template-columns:minmax(0,1fr);gap:22px;}}
/* 手機照設計稿在「走過三個月，」後換行；桌機維持一整行，所以用 span 切換 display */
@media(max-width:768px){.hm-3m-br{display:block;}}
.hm-3m-cta{display:flex;align-items:center;gap:20px;}
.hm-3m-cta p{font-size:clamp(13px,1.4vw,14px);color:var(--nx-t3);}
@media(max-width:640px){.hm-3m-cta{flex-direction:column;align-items:stretch;gap:10px;}.hm-3m-cta .nx-btn{width:100%;}.hm-3m-cta p{text-align:center;}}

.hm-price{max-width:760px;margin:0 auto;padding:clamp(24px,3.2vw,36px);border:1px solid var(--nx-bd);border-radius:20px;background:#fff;box-shadow:0 8px 24px -12px rgba(46,42,33,.14);}
.hm-price-top{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;padding-bottom:26px;margin-bottom:26px;border-bottom:1px dotted var(--nx-t5);}
.hm-price-label{margin-bottom:10px;font-size:13px;font-weight:700;letter-spacing:.12em;color:var(--nx-t3);}
.hm-price-num{font-size:clamp(34px,5vw,46px);font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;}
.hm-price-num span{font-size:clamp(15px,1.7vw,17px);font-weight:500;color:var(--nx-t3);}
.hm-price-save{margin-top:6px;font-size:clamp(13px,1.4vw,14px);color:var(--nx-od);}
.hm-price-bot{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;}
.hm-price-bot strong{display:block;margin-bottom:4px;font-size:15px;font-weight:600;}
.hm-price-bot em{font-style:normal;font-size:13px;color:var(--nx-t3);}
@media(max-width:640px){
  .hm-price-top,.hm-price-bot{flex-direction:column;align-items:stretch;}
  .hm-price-top .nx-btn,.hm-price-bot .nx-btn{width:100%;}
}

.nx-sticky{position:sticky;bottom:0;z-index:40;display:none;align-items:center;justify-content:space-between;gap:12px;
  padding:14px var(--nx-pad) calc(14px + env(safe-area-inset-bottom,0px));
  background:rgba(252,250,246,.97);border-top:1px solid var(--nx-bd);box-shadow:0 -6px 20px -12px rgba(46,42,33,.35);
  backdrop-filter:saturate(140%) blur(6px);}
.nx-sticky b{display:block;font-size:13px;font-weight:700;line-height:1.35;}
.nx-sticky span{display:block;font-size:12px;color:var(--nx-t3);line-height:1.35;}
@media(max-width:900px){.nx-sticky{display:flex;}}

/* ===== /app 財務導航產品頁 ===== */
.ap-demo{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,400px);gap:clamp(24px,4.5vw,56px);align-items:center;}
.ap-demo-p{max-width:440px;margin-bottom:18px;font-size:clamp(15px,1.6vw,16px);line-height:1.9;color:var(--nx-t2);}
.ap-demo-actions{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
.ap-demo-actions span{font-size:13px;color:var(--nx-t3);}
.nx-btn-dark{background:var(--nx-dark);color:var(--nx-dt);}
.nx-btn-dark:hover{background:#3a3a3a;color:var(--nx-dt);}
.ap-phone{width:100%;max-width:340px;margin:0 auto;padding:12px 10px;border-radius:32px;background:#1F1D1A;box-shadow:0 24px 56px -18px rgba(46,42,33,.5);}
.ap-phone-notch{height:22px;display:flex;align-items:center;justify-content:center;}
.ap-phone-notch i{display:block;width:86px;height:18px;border-radius:12px;background:#111;}
.ap-phone-screen{aspect-ratio:9 / 17;border-radius:24px;overflow:hidden;background:#F5F0EB;}
.ap-phone-screen iframe{width:100%;height:100%;border:none;display:block;}
.ap-phone-bar{height:18px;display:flex;align-items:center;justify-content:center;}
.ap-phone-bar i{display:block;width:86px;height:4px;border-radius:2px;background:#4a4a4a;}
@media(max-width:900px){
  .ap-demo{grid-template-columns:minmax(0,1fr);gap:20px;}
  .ap-demo-p,.ap-demo-note{max-width:none;}
  .ap-demo-actions{flex-direction:column;align-items:stretch;}
  .ap-demo-actions .nx-btn{width:100%;}
  .ap-demo-actions span{text-align:center;}
  .ap-phone{max-width:none;padding:10px 8px;border-radius:26px;}
  .ap-phone-screen{aspect-ratio:9 / 15;border-radius:20px;}
}

.ap-grid{display:grid;gap:20px;}
.ap-grid-3{grid-template-columns:repeat(3,minmax(0,1fr));}
.ap-grid-4{grid-template-columns:repeat(4,minmax(0,1fr));}
.ap-card{padding:22px 22px 10px;}
.ap-card-head{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.ap-card-head svg{flex-shrink:0;}
.ap-card h3{font-size:clamp(15px,1.6vw,17px);font-weight:700;}
.ap-card p{margin-bottom:14px;font-size:13px;color:var(--nx-t3);line-height:1.8;}
.ap-card img{width:100%;display:block;}
.ap-card-sm{padding:20px 20px 8px;}
.ap-card-sm h3{margin-bottom:6px;font-size:16px;}
.ap-card-sm p{margin-bottom:12px;}
.ap-card-plain{padding:20px;border:1px solid var(--nx-bd);border-radius:16px;background:var(--nx-bg2);}
.ap-card-plain h3{margin-bottom:6px;font-size:16px;font-weight:700;}
.ap-card-plain p{font-size:13px;color:var(--nx-t3);line-height:1.8;}
.ap-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
@media(max-width:768px){.ap-chips.nx-only-mob{display:flex!important;}}
.ap-chips span{padding:8px 14px;border:1px solid var(--nx-bd);border-radius:999px;background:var(--nx-bg2);font-size:13px;color:var(--nx-t2);}
@media(max-width:900px){
  .ap-grid-3{grid-template-columns:minmax(0,1fr);gap:14px;}
  .ap-grid-4{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
  .ap-card{padding:20px 20px 8px;}
  .ap-card-sm{padding:16px 16px 6px;}
  .ap-card-sm h3{margin-bottom:10px;}
}

/* 三方比較 */
/* 三方比較：一張真表格跑兩種寬度。88La 那欄底色 #FDF3E8、表頭 #FBE6D2，
   讓視線在窄螢幕上仍能鎖定同一欄；手機超過四列的部分由 .ap-tr-more 收起。 */
.ap-tbl-wrap{border-radius:18px;background:var(--nx-bg);overflow:hidden;}
.ap-tbl{width:100%;border-collapse:collapse;table-layout:fixed;}
.ap-tbl col:nth-child(1){width:20%;}
.ap-tbl col:nth-child(2){width:27%;}
.ap-tbl col:nth-child(3){width:27%;}
.ap-tbl col:nth-child(4){width:26%;}
.ap-tbl thead tr{background:var(--nx-bg2);}
.ap-tbl th{padding:14px 16px;text-align:left;vertical-align:bottom;font-size:clamp(11px,1.3vw,13px);font-weight:700;letter-spacing:.04em;color:var(--nx-t2);border-bottom:1px solid var(--nx-bd);}
.ap-tbl thead th:first-child{color:var(--nx-t3);}
.ap-tbl thead th+th{border-left:1px solid var(--nx-bd);}
.ap-tbl thead th:last-child{background:var(--nx-os);color:var(--nx-ol);}
.ap-tbl tbody th{vertical-align:top;font-size:clamp(12px,1.5vw,14px);font-weight:700;line-height:1.5;color:var(--nx-t1);border-bottom:1px dotted var(--nx-bd);letter-spacing:0;}
.ap-tbl td{padding:14px 16px;vertical-align:top;font-size:clamp(11px,1.4vw,13px);line-height:1.7;color:var(--nx-t3);border-bottom:1px dotted var(--nx-bd);border-left:1px solid var(--nx-hair);}
.ap-tbl td:nth-child(3){color:var(--nx-t2);}
.ap-td-la{background:#FDF3E8;font-weight:600;color:var(--nx-t1)!important;}
.ap-tbl tbody tr:last-child th,.ap-tbl tbody tr:last-child td{border-bottom:none;}
.ap-tr-more{display:none;}
@media(max-width:768px){
  .ap-tbl col:nth-child(1){width:20%;}
  .ap-tbl col:nth-child(2){width:26%;}
  .ap-tbl col:nth-child(3){width:24%;}
  .ap-tbl col:nth-child(4){width:30%;}
  .ap-tbl th,.ap-tbl td{padding:11px 8px;}
  .ap-tbl thead th{font-size:10px;}
}
@media(min-width:769px){.ap-tr-more{display:table-row;}}

/* 漸進揭露的按鈕，功能清單與比較表共用同一種外觀 */
.ap-toggle,.ap-more{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 18px;border:1px solid var(--nx-bd);border-radius:999px;background:var(--nx-bg2);font-family:inherit;font-size:clamp(14px,1.5vw,15px);font-weight:600;color:var(--nx-t2);cursor:pointer;}
.ap-toggle{margin-top:20px;}
.ap-toggle:hover,.ap-more:hover{color:var(--nx-od);}
.ap-more{border:none;border-top:1px solid var(--nx-bd);border-radius:0;}
@media(max-width:768px){.ap-feat-sub:not(.is-open){display:none;}}

/* 第一個月只需要用兩個功能 */
.ap-ramp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(12px,1.8vw,16px);}
.ap-ramp article{padding:clamp(20px,2.4vw,26px);border:1px solid var(--nx-bd);border-radius:16px;background:var(--nx-card);}
.ap-ramp-now{border-color:transparent!important;background:var(--nx-os)!important;}
.ap-ramp-when{margin-bottom:8px;font-size:12px;font-weight:700;color:var(--nx-t3);}
.ap-ramp-now .ap-ramp-when{color:var(--nx-ol);}
.ap-ramp h3{margin-bottom:10px;font-size:clamp(17px,1.9vw,20px);font-weight:700;}
.ap-ramp-d{font-size:14px;color:var(--nx-t2);line-height:1.85;}
@media(max-width:768px){.ap-ramp{grid-template-columns:minmax(0,1fr);}}

.ap-note-weak{margin-top:14px;font-size:14px;line-height:1.85;color:rgba(252,250,246,.4);}
/* 模板 2.0 的購買指引，深色區塊上的連結用 --nx-dl，不用主橘（在深底上對比不夠） */
.ap-buy{margin-top:24px;font-size:clamp(13px,1.4vw,14px);line-height:1.85;color:rgba(252,250,246,.55);}
.ap-buy a{color:var(--nx-dl);font-weight:600;white-space:nowrap;}
.ap-buy a:hover{color:var(--nx-o);}

/* 手機版比較表：跟桌機同一組欄位，只是欄名移到表頭、項目名獨立成一列。
   三欄並排在 390px 下每欄約 100px，12px 字約放得下 8 個字，最長的一句 17 字排三行。
   比較表的價值就在同一列能左右對照，所以寧可窄一點也不拆成上下堆疊。 */
.ap-table-m{border-radius:16px;background:var(--nx-bg);overflow:hidden;}
.ap-mh{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:var(--nx-bg2);border-bottom:1px solid var(--nx-bd);}
.ap-mh>div{padding:10px 8px;font-size:11px;font-weight:700;line-height:1.4;text-align:center;color:var(--nx-t3);}
.ap-mh>div+div{border-left:1px solid var(--nx-bd);}
.ap-mh>div:last-child{background:var(--nx-os);color:var(--nx-ol);}
.ap-row-m{border-bottom:1px dotted var(--nx-bd);}
.ap-row-m>p{margin:0;padding:13px 14px 9px;font-size:15px;font-weight:700;}
.ap-cells{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));}
.ap-cells>div{padding:0 8px 14px;font-size:12px;line-height:1.7;}
.ap-cells>div+div{border-left:1px solid var(--nx-bd);}
.ap-cells>div:first-child{padding-left:14px;color:var(--nx-t3);}
.ap-cells>div:nth-child(2){color:var(--nx-t2);}
.ap-cells>div:last-child{padding-right:14px;font-weight:600;color:var(--nx-t1);}
.ap-table-title{margin:clamp(22px,3vw,32px) 0 12px;color:var(--nx-dt);}
.ap-more{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:15px 18px;border:none;border-top:1px solid var(--nx-bd);background:var(--nx-bg2);font-family:inherit;font-size:14px;font-weight:600;color:var(--nx-t2);cursor:pointer;}
.ap-more:hover{color:var(--nx-od);}

.ap-quotes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(12px,1.8vw,20px);}
.ap-quotes article{padding:clamp(20px,2.4vw,26px);}
.ap-quotes blockquote{margin:0 0 18px;font-size:clamp(15px,1.6vw,16px);line-height:1.85;text-wrap:pretty;}
.ap-quotes cite{font-style:normal;font-size:13px;color:var(--nx-t3);}
.ap-crit{border:1px solid var(--nx-t5);border-radius:16px;background:var(--nx-bg2);box-shadow:none;}
.ap-crit-tag{display:inline-flex;align-items:center;margin-bottom:16px;padding:5px 12px;border:1px solid var(--nx-bd);border-radius:999px;background:#fff;font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--nx-t3);}
.ap-crit-fix{padding-left:14px;border-left:2px solid var(--nx-o);font-size:14px;line-height:1.85;color:var(--nx-t2);}
@media(max-width:900px){.ap-quotes{grid-template-columns:minmax(0,1fr);}}

.ap-devices{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(12px,1.8vw,16px);}
.ap-devices>div{padding:clamp(18px,2.2vw,24px);box-shadow:none;}
.ap-devices dt{margin-bottom:10px;font-size:12px;font-weight:700;letter-spacing:.1em;color:var(--nx-ol);}
.ap-devices dd{margin:0;font-size:clamp(13px,1.5vw,14px);line-height:1.85;color:var(--nx-t2);}
@media(max-width:900px){.ap-devices{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:560px){.ap-devices{grid-template-columns:minmax(0,1fr);}}

.ap-plans{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;max-width:760px;margin:0 auto;}
.ap-plan{position:relative;padding:30px;border:1px solid var(--nx-bd);border-radius:16px;background:#fff;}
.ap-plan-dark{border-color:transparent;background:var(--nx-dark);box-shadow:0 24px 48px -20px rgba(46,42,33,.4);}
.ap-plan-badge{position:absolute;top:-11px;left:30px;padding:4px 12px;border-radius:999px;background:var(--nx-o);color:#fff;font-size:11px;font-weight:700;}
.ap-plan-name{margin-bottom:14px;font-size:15px;font-weight:600;}
.ap-plan-price{margin-bottom:4px;font-size:clamp(32px,4.4vw,44px);font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;}
.ap-plan-price span{font-size:16px;font-weight:500;color:var(--nx-t3);}
.ap-plan-sub{margin-bottom:22px;font-size:13px;color:var(--nx-t3);}
.ap-plan ul{display:flex;flex-direction:column;gap:9px;margin:0 0 26px;padding:0;list-style:none;font-size:14px;color:var(--nx-t2);}
.ap-plan-dark .ap-plan-name,.ap-plan-dark .ap-plan-price{color:var(--nx-dt);}
.ap-plan-dark .ap-plan-price span{color:rgba(252,250,246,.55);}
.ap-plan-dark .ap-plan-sub{color:#EB8A48;}
.ap-plan-dark ul{color:rgba(252,250,246,.72);}
@media(max-width:900px){.ap-plans{grid-template-columns:minmax(0,1fr);gap:24px;}.ap-plan{padding:24px;}.ap-plan-badge{left:24px;}}

.ap-faq{max-width:820px;margin:0 auto;}
.ap-faq h2{margin-bottom:clamp(18px,2.4vw,28px);font-size:clamp(24px,2.6vw,28px);font-weight:700;letter-spacing:-.02em;}
.ap-faq details{padding:clamp(18px,2vw,22px) 0;border-top:1px dotted var(--nx-t5);}
.ap-faq details:last-of-type{border-bottom:1px dotted var(--nx-t5);}
.ap-faq summary{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;font-size:clamp(16px,1.7vw,18px);font-weight:700;line-height:1.5;cursor:pointer;list-style:none;}
.ap-faq summary::-webkit-details-marker{display:none;}
.ap-faq summary::after{content:"＋";display:inline-block;flex-shrink:0;color:var(--nx-o);font-weight:700;transition:transform .2s var(--nx-ease);}
.ap-faq details[open] summary::after{transform:rotate(45deg);}
.ap-faq details p{margin-top:10px;font-size:clamp(14px,1.5vw,15px);line-height:1.9;color:var(--nx-t2);}
.ap-ask{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-top:32px;padding:clamp(20px,2.4vw,26px) clamp(20px,2.6vw,28px);border-radius:16px;background:var(--nx-bg2);}
.ap-ask strong{display:block;margin-bottom:6px;font-size:17px;font-weight:700;}
.ap-ask em{font-style:normal;font-size:14px;color:var(--nx-t3);}
.ap-ask div:last-child{display:flex;gap:12px;flex-wrap:wrap;}
@media(max-width:640px){.ap-ask div:last-child{flex-direction:column;width:100%;}.ap-ask .nx-btn{width:100%;}}

/* ===== /resources 免費工具頁 ===== */
.rs-hero{padding-block:clamp(30px,4.6vw,56px) clamp(26px,3.6vw,44px);border-bottom:1px solid var(--nx-bd);}
.rs-hero h1{max-width:700px;margin-block:16px;font-size:clamp(27px,3.9vw,40px);font-weight:700;line-height:1.3;letter-spacing:-.025em;text-wrap:pretty;}
.rs-hero p{max-width:620px;font-size:clamp(14px,1.6vw,16px);color:var(--nx-t2);line-height:1.9;}
.rs-banner{display:flex;align-items:center;justify-content:space-between;gap:clamp(16px,2.4vw,28px);margin-bottom:14px;padding:clamp(20px,2.4vw,24px) clamp(20px,2.6vw,28px);border-radius:16px;background:var(--nx-dark);}
.rs-banner h2{margin-bottom:8px;font-size:clamp(17px,1.9vw,19px);font-weight:700;color:var(--nx-dt);}
.rs-banner p{font-size:14px;color:var(--nx-ds);line-height:1.8;}
.rs-blocks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;}
.rs-block{display:block;padding:20px 22px;border:1px solid var(--nx-bd);border-radius:16px;background:#fff;color:inherit;transition:border-color .2s var(--nx-ease),transform .12s var(--nx-ease);}
.rs-block:hover{border-color:var(--nx-o);color:inherit;}
.rs-block:active{transform:scale(.98);}
.rs-block strong{display:block;margin-bottom:8px;font-size:15px;font-weight:700;}
.rs-block span{font-size:13px;color:var(--nx-t2);line-height:1.8;}
@media(max-width:900px){
  .rs-banner{flex-direction:column;align-items:stretch;text-align:left;}
  .rs-banner .nx-btn{width:100%;}
  .rs-blocks{grid-template-columns:minmax(0,1fr);}
}

.rs-lead{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,420px);gap:clamp(20px,3.2vw,36px);align-items:center;padding-bottom:clamp(26px,3.4vw,40px);border-bottom:1px dotted var(--nx-t5);}
.rs-lead-badge{display:inline-block;margin-bottom:18px;padding:6px 14px;border-radius:999px;background:var(--nx-os);color:var(--nx-ost);font-size:12px;font-weight:700;letter-spacing:.06em;}
.rs-lead h2{margin-bottom:14px;font-size:clamp(21px,3vw,30px);font-weight:700;line-height:1.35;letter-spacing:-.02em;}
.rs-lead p{max-width:460px;margin-bottom:22px;font-size:15px;color:var(--nx-t2);line-height:1.95;white-space:pre-wrap;}
.rs-lead-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.rs-lead-actions span{font-size:13px;color:var(--nx-t3);}
.rs-lead-img{width:100%;aspect-ratio:7 / 5;border:1px solid var(--nx-bd);border-radius:18px;background:var(--nx-bg2);object-fit:cover;display:block;}
@media(max-width:900px){
  .rs-lead{grid-template-columns:minmax(0,1fr);gap:18px;}
  .rs-lead>div{order:2;}
  .rs-lead p{max-width:none;}
  .rs-lead-actions{flex-direction:column;align-items:stretch;}
  .rs-lead-actions .nx-btn{width:100%;}
  .rs-lead-actions span{text-align:center;}
}

.rs-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:clamp(22px,3vw,36px);}
.rs-tool{display:flex;flex-direction:column;padding:clamp(20px,2.4vw,26px) clamp(20px,2.6vw,28px);border:1px solid var(--nx-bd);border-radius:18px;background:#fff;box-shadow:var(--nx-sh);}
.rs-tag{margin-bottom:12px;font-size:12px;font-weight:700;letter-spacing:.1em;color:var(--nx-t3);}
.rs-tool h3{margin-bottom:10px;font-size:clamp(17px,1.8vw,19px);font-weight:700;line-height:1.45;}
.rs-tool p{margin-bottom:18px;font-size:14px;color:var(--nx-t2);line-height:1.9;white-space:pre-wrap;}
.rs-tool-cta{margin-top:auto;font-size:14px;font-weight:600;color:var(--nx-od);align-self:flex-start;background:none;border:none;padding:0;font-family:inherit;cursor:pointer;}
.rs-tool-cta:hover{color:var(--nx-o);}
.rs-tool-hi{grid-column:1 / -1;border-color:transparent;background:var(--nx-os);box-shadow:none;}
.rs-tool-hi .rs-tag{color:var(--nx-ost);}
.rs-admin-row{display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:12px;border-top:1px dotted var(--nx-bd);font-size:11px;color:var(--nx-t3);}
@media(max-width:900px){.rs-tools{grid-template-columns:minmax(0,1fr);gap:12px;}}

.rs-templates{margin-top:clamp(28px,4vw,48px);padding-top:clamp(24px,3.4vw,40px);border-top:1px dotted var(--nx-t5);}
.rs-templates h2{margin-bottom:8px;font-size:clamp(20px,2.2vw,24px);font-weight:700;letter-spacing:-.02em;}
.rs-templates>p{margin-bottom:24px;font-size:15px;color:var(--nx-t2);line-height:1.9;}

.rs-roles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(20px,3.2vw,36px);align-items:start;}
.rs-roles h2{margin-bottom:14px;font-size:clamp(20px,2.2vw,24px);font-weight:700;line-height:1.4;letter-spacing:-.02em;}
.rs-roles>div>p{font-size:15px;color:var(--nx-t2);line-height:1.95;}
.rs-role-list{display:flex;flex-direction:column;gap:10px;}
.rs-role{display:flex;gap:14px;padding:16px 20px;border:1px solid var(--nx-bd);border-radius:14px;background:#fff;}
.rs-role b{min-width:56px;font-size:13px;font-weight:700;color:var(--nx-o);}
.rs-role p{font-size:14px;color:var(--nx-t2);line-height:1.8;}
@media(max-width:900px){.rs-roles{grid-template-columns:minmax(0,1fr);gap:20px;}}

.rs-cta{padding-block:clamp(32px,4.4vw,52px) clamp(36px,5vw,60px);text-align:center;}
.rs-cta h2{margin-bottom:12px;font-size:clamp(21px,2.4vw,26px);font-weight:700;letter-spacing:-.02em;}
.rs-cta>p{margin-bottom:26px;font-size:15px;color:var(--nx-t2);line-height:1.9;}
.rs-cta-row{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;}
@media(max-width:640px){.rs-cta-row{flex-direction:column;}.rs-cta-row .nx-btn{width:100%;}}

/* ===== /savings-bag 實體工具頁 ===== */
.bg-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:stretch;border-bottom:1px solid var(--nx-bd);}
.bg-hero-copy{display:flex;flex-direction:column;justify-content:center;padding:clamp(28px,4.6vw,64px) var(--nx-pad) clamp(26px,4.2vw,60px);}
.bg-hero h1{margin-bottom:22px;font-size:clamp(30px,4.2vw,42px);font-weight:700;line-height:1.28;letter-spacing:-.03em;text-wrap:pretty;}
.bg-hero-sub{max-width:420px;margin-bottom:clamp(28px,3.4vw,36px);font-size:clamp(15px,1.7vw,17px);color:var(--nx-t2);line-height:1.95;}
.bg-hero-note{font-size:13px;color:var(--nx-t3);line-height:1.8;}
.bg-hero-img{width:100%;height:100%;min-height:420px;max-height:560px;object-fit:cover;display:block;}
@media(max-width:900px){
  .bg-hero{grid-template-columns:minmax(0,1fr);}
  .bg-hero>picture,.bg-hero>img{order:-1;}
  .bg-hero-img{min-height:0;aspect-ratio:4 / 3;}
  .bg-hero-copy{padding-block:24px 26px;}
  .bg-hero-sub{max-width:none;}
  .bg-hero .nx-btn{width:100%;}
}

.bg-quiz{display:flex;align-items:center;justify-content:space-between;gap:clamp(16px,2.4vw,28px);padding:clamp(20px,2.4vw,26px) var(--nx-pad);border-bottom:1px solid var(--nx-bd);background:var(--nx-dark);}
.bg-quiz h2{margin-bottom:6px;font-size:clamp(16px,1.8vw,18px);font-weight:700;color:var(--nx-dt);}
.bg-quiz p{font-size:14px;color:var(--nx-ds);line-height:1.8;}
@media(max-width:900px){.bg-quiz{flex-direction:column;align-items:stretch;}.bg-quiz .nx-btn{width:100%;}}

.bg-why h2{max-width:640px;margin-bottom:16px;font-size:clamp(22px,3vw,28px);font-weight:700;line-height:1.4;letter-spacing:-.02em;}
.bg-why>p{max-width:660px;margin-bottom:clamp(24px,3.2vw,36px);font-size:clamp(14px,1.6vw,16px);color:var(--nx-t2);line-height:1.95;}
.bg-why-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;}
.bg-why-cards article{padding:clamp(20px,2.4vw,24px) clamp(20px,2.6vw,26px);border:1px solid var(--nx-bd);border-radius:16px;background:#fff;}
.bg-why-cards h3{margin-bottom:10px;font-size:16px;font-weight:700;}
.bg-why-cards p{font-size:14px;color:var(--nx-t2);line-height:1.9;}
@media(max-width:900px){.bg-why-cards{grid-template-columns:minmax(0,1fr);gap:12px;}}

.bg-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;}
.bg-steps img{width:100%;height:200px;object-fit:cover;border-radius:14px;display:block;}
.bg-step-head{display:flex;align-items:baseline;gap:12px;margin:18px 0 8px;}
.bg-step-head b{font-family:var(--nx-mono);font-size:22px;font-weight:700;color:var(--nx-o);}
.bg-step-head span{font-size:17px;font-weight:700;}
.bg-steps p{font-size:14px;color:var(--nx-t2);line-height:1.9;}
@media(max-width:900px){.bg-steps{grid-template-columns:minmax(0,1fr);gap:26px;}.bg-steps img{height:auto;aspect-ratio:3 / 2;}}

.bg-fit{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,380px);gap:clamp(24px,3.8vw,44px);align-items:start;}
.bg-fit h2{margin-bottom:22px;font-size:clamp(20px,2.2vw,24px);font-weight:700;letter-spacing:-.02em;}
.bg-fit-item{padding:18px 0;border-bottom:1px dotted var(--nx-t5);}
.bg-fit-item:last-child{border-bottom:none;}
.bg-fit-item strong{display:block;margin-bottom:6px;font-size:16px;font-weight:600;}
.bg-fit-item span{font-size:14px;color:var(--nx-t2);line-height:1.9;}
.bg-spec{padding:clamp(22px,2.6vw,28px) clamp(22px,2.8vw,30px);border:1px solid var(--nx-bd);border-radius:18px;background:#fff;box-shadow:var(--nx-sh);}
.bg-spec>p{margin-bottom:18px;font-size:13px;font-weight:700;letter-spacing:.12em;color:var(--nx-t3);}
.bg-spec dl{display:flex;flex-direction:column;margin:0;}
.bg-spec-row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--nx-hair);}
.bg-spec-row:last-child{border-bottom:none;}
.bg-spec dt{font-size:14px;color:var(--nx-t2);}
.bg-spec dd{margin:0;font-size:14px;font-weight:600;text-align:right;}
.bg-spec .nx-btn{margin-top:22px;}
@media(max-width:900px){.bg-fit{grid-template-columns:minmax(0,1fr);gap:24px;}}

.bg-app{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(22px,3.4vw,40px);align-items:center;}
.bg-app h2{margin-bottom:16px;font-size:clamp(21px,2.4vw,26px);font-weight:700;line-height:1.4;letter-spacing:-.02em;}
.bg-app p{margin-bottom:22px;font-size:15px;color:var(--nx-t2);line-height:1.95;}
.bg-app-row{display:flex;gap:12px;flex-wrap:wrap;}
.bg-app img{width:100%;height:280px;object-fit:cover;border-radius:18px;display:block;}
@media(max-width:900px){
  .bg-app{grid-template-columns:minmax(0,1fr);gap:20px;}
  .bg-app img{height:auto;aspect-ratio:3 / 2;border-radius:16px;order:-1;}
  .bg-app-row{flex-direction:column;}
  .bg-app-row .nx-btn{width:100%;}
}

/* ===== /journal 文章列表 ===== */
.jn-hero{padding-block:clamp(30px,4.6vw,56px) clamp(20px,2.6vw,32px);}
.jn-hero h1{max-width:680px;margin-block:16px;font-size:clamp(27px,3.9vw,40px);font-weight:700;line-height:1.3;letter-spacing:-.025em;text-wrap:pretty;}
.jn-hero p{max-width:600px;font-size:clamp(14px,1.6vw,16px);color:var(--nx-t2);line-height:1.9;}
.jn-chips{display:flex;gap:10px;flex-wrap:wrap;padding-bottom:clamp(20px,2.6vw,32px);}
.jn-chip{padding:10px 20px;border:1px solid var(--nx-bd);border-radius:999px;background:#fff;font-family:inherit;font-size:clamp(13px,1.4vw,14px);color:var(--nx-t2);cursor:pointer;white-space:nowrap;transition:border-color .2s var(--nx-ease),color .2s var(--nx-ease);}
.jn-chip:hover{border-color:var(--nx-o);color:var(--nx-od);}
.jn-chip.is-on{border-color:transparent;background:var(--nx-o);color:#fff;font-weight:600;}
.jn-chip b{font-weight:inherit;margin-left:.6em;}

.jn-lead{display:grid;grid-template-columns:minmax(0,580px) minmax(0,1fr);gap:clamp(20px,3.2vw,36px);align-items:center;padding-bottom:clamp(26px,3.8vw,44px);border-bottom:1px dotted var(--nx-t5);}
.jn-lead-cover{width:100%;aspect-ratio:29 / 17;object-fit:cover;border-radius:18px;background:var(--nx-bg2);display:block;}
.jn-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;}
.jn-tag{padding:6px 14px;border-radius:999px;background:var(--nx-os);color:var(--nx-ost);font-size:12px;font-weight:700;}
.jn-member{padding:6px 14px;border-radius:999px;background:var(--nx-dark);color:var(--nx-dt);font-size:12px;font-weight:700;}
.jn-member-sm{padding:3px 10px;font-size:11px;}
.jn-date{font-size:13px;color:var(--nx-t3);}
.jn-lead h2{margin-bottom:14px;font-size:clamp(21px,3vw,30px);font-weight:700;line-height:1.4;letter-spacing:-.02em;text-wrap:pretty;}
.jn-lead p{margin-bottom:20px;font-size:15px;color:var(--nx-t2);line-height:1.95;}
.jn-more{font-size:14px;font-weight:600;color:var(--nx-od);}
.jn-more:hover{color:var(--nx-o);}
@media(max-width:900px){.jn-lead{grid-template-columns:minmax(0,1fr);gap:16px;}}

.jn-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(16px,2.4vw,24px);}
.jn-card-cover{width:100%;aspect-ratio:16 / 10;object-fit:cover;border-radius:14px;background:var(--nx-bg2);display:block;}
.jn-card-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:16px 0 8px;}
.jn-card-tag{font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--nx-o);}
.jn-card h3{margin-bottom:10px;font-size:clamp(17px,1.8vw,19px);font-weight:700;line-height:1.5;text-wrap:pretty;}
.jn-card p{font-size:14px;color:var(--nx-t2);line-height:1.9;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.jn-card a{color:inherit;}
.jn-card a:hover{color:var(--nx-od);}
@media(max-width:900px){.jn-grid{grid-template-columns:minmax(0,1fr);gap:26px;}}

.jn-note{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,300px);gap:clamp(20px,3.2vw,36px);align-items:center;padding:clamp(24px,3vw,32px) clamp(24px,3.2vw,36px);border-radius:20px;background:var(--nx-dark);}
.jn-note-tag{display:inline-block;margin-bottom:14px;padding:6px 14px;border-radius:999px;background:rgba(252,250,246,.12);color:var(--nx-dt);font-size:12px;font-weight:700;letter-spacing:.06em;}
.jn-note h2{margin-bottom:12px;font-size:clamp(19px,2.2vw,24px);font-weight:700;line-height:1.45;letter-spacing:-.02em;color:var(--nx-dt);}
.jn-note>div>p{font-size:15px;color:var(--nx-ds);line-height:1.9;}
.jn-note-box{padding:22px 24px;border:1px solid rgba(252,250,246,.14);border-radius:16px;background:rgba(252,250,246,.07);}
.jn-note-box p:first-child{margin-bottom:12px;font-size:13px;color:var(--nx-ds);line-height:1.8;}
.jn-note-box p:nth-child(2){margin-bottom:16px;font-size:14px;color:var(--nx-dt);line-height:1.8;}
.jn-note-box a{font-size:14px;font-weight:600;color:var(--nx-dl);}
@media(max-width:900px){.jn-note{grid-template-columns:minmax(0,1fr);gap:18px;}}

.jn-starter{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;}
.jn-starter article{padding:clamp(20px,2.4vw,24px) clamp(20px,2.6vw,26px);border:1px solid var(--nx-bd);border-radius:16px;background:#fff;}
.jn-starter b{font-family:var(--nx-mono);font-size:20px;font-weight:700;color:var(--nx-o);}
.jn-starter h3{margin:12px 0 8px;font-size:17px;font-weight:700;line-height:1.5;}
.jn-starter h3 a{color:inherit;}
.jn-starter h3 a:hover{color:var(--nx-od);}
.jn-starter p{font-size:13px;color:var(--nx-t2);line-height:1.85;}
@media(max-width:900px){.jn-starter{grid-template-columns:minmax(0,1fr);gap:12px;}}

/* ===== 文章內頁：會員密碼閘 ===== */
/* 前段淡出：會員全文在解鎖前不會送到瀏覽器，這裡淡出的是公開摘要，所以漸層只蓋住底部，
   前面幾行要保持完全可讀（設計稿的 inset:0 是為了它那份較長的示範內文） */
.ar-fade{position:relative;min-height:96px;max-height:132px;overflow:hidden;}
.ar-fade::after{content:"";position:absolute;left:0;right:0;bottom:0;height:52px;background:linear-gradient(to bottom,rgba(252,250,246,0) 0%,rgba(252,250,246,.85) 55%,#FCFAF6 100%);}
.ar-gate{padding:clamp(24px,3vw,32px) clamp(24px,3.2vw,36px);border-radius:20px;background:var(--nx-dark);}
.ar-gate-tag{display:inline-block;margin-bottom:16px;padding:6px 14px;border-radius:999px;background:rgba(252,250,246,.12);color:var(--nx-dt);font-size:12px;font-weight:700;letter-spacing:.06em;}
.ar-gate h2{margin-bottom:10px;font-size:clamp(18px,2vw,22px);font-weight:700;line-height:1.5;letter-spacing:-.02em;color:var(--nx-dt);}
.ar-gate>p{margin-bottom:22px;font-size:15px;color:var(--nx-ds);line-height:1.9;}
.ar-gate-form{display:flex;gap:10px;margin-bottom:14px;}
.ar-gate-form input{flex:1;min-width:0;padding:15px 18px;border:1px solid rgba(252,250,246,.18);border-bottom:1px solid rgba(252,250,246,.18);border-radius:10px;background:rgba(252,250,246,.1);color:var(--nx-dt);font-size:15px;}
.ar-gate-form input::placeholder{color:rgba(252,250,246,.45);}
.ar-gate-form input:focus{border-color:var(--nx-o);border-bottom-color:var(--nx-o);outline:none;}
.ar-gate-foot{font-size:13px;color:rgba(252,250,246,.45);line-height:1.8;}
.ar-gate-foot a{color:var(--nx-dl);font-weight:600;}
.ar-gate-err{margin-bottom:12px;font-size:13px;color:#F0A08A;}
@keyframes nxToastIn{from{opacity:0;transform:translate(-50%,50%) scale(.96);}to{opacity:1;}}
.nx-toast{animation:nxToastIn .22s var(--nx-ease);}
@media(prefers-reduced-motion:reduce){.nx-toast{animation:none;}}
@media(max-width:640px){.ar-gate-form{flex-direction:column;}.ar-gate-form .nx-btn{width:100%;}}

/* ===== /about 關於頁 ===== */
.ab-hero{padding-block:clamp(36px,6vw,80px) clamp(30px,4.8vw,64px);text-align:center;border-bottom:1px solid var(--nx-bd);}
.ab-hero h1{max-width:780px;margin:24px auto;font-size:clamp(28px,4.4vw,46px);font-weight:700;line-height:1.35;letter-spacing:-.025em;text-wrap:pretty;}
.ab-hero p{max-width:600px;margin:0 auto;font-size:clamp(15px,1.7vw,17px);color:var(--nx-t2);line-height:1.9;}

.ab-intro{display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr);gap:clamp(20px,3.2vw,40px);align-items:start;padding-block:clamp(30px,4.6vw,60px);border-bottom:1px dotted var(--nx-t5);}
.ab-intro img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:18px;display:block;background:var(--nx-bg2);}
.ab-intro-text{font-size:clamp(15px,1.6vw,16px);color:var(--nx-t2);line-height:2;white-space:pre-line;text-wrap:pretty;}
@media(max-width:768px){.ab-intro{grid-template-columns:minmax(0,1fr);gap:18px;}.ab-intro img{max-width:200px;}}
.ab-lede{max-width:640px;margin-bottom:clamp(22px,2.8vw,36px);}
.ab-lede h2{margin-bottom:20px;font-size:clamp(23px,3.4vw,34px);font-weight:700;line-height:1.4;letter-spacing:-.02em;text-wrap:pretty;}
.ab-lede p{margin-bottom:18px;font-size:clamp(15px,1.6vw,16px);color:var(--nx-t2);line-height:1.9;}
.ab-lede p:last-child{margin-bottom:0;}
.ab-shot{width:100%;display:block;border-radius:18px;box-shadow:0 14px 40px -18px rgba(46,42,33,.3);}
.ab-caption{margin-top:14px;font-size:13px;color:var(--nx-t3);text-align:center;}
.ab-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;}
.ab-pair img{width:100%;height:400px;object-fit:cover;display:block;border-radius:14px;box-shadow:0 8px 24px -12px rgba(46,42,33,.24);}
.ab-pair p{margin-top:12px;font-size:14px;color:var(--nx-t2);line-height:1.8;}
.ab-pair b{font-weight:600;}
@media(max-width:900px){.ab-pair{grid-template-columns:minmax(0,1fr);gap:24px;}.ab-pair img{height:auto;aspect-ratio:4 / 3;}}

.ab-tools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(14px,2vw,22px);}
.ab-tools article{padding:clamp(22px,2.8vw,28px);border:1px solid var(--nx-bd);border-radius:16px;background:#fff;box-shadow:var(--nx-sh);}
.ab-tools h3{margin-bottom:12px;font-size:clamp(18px,2vw,21px);font-weight:700;}
.ab-tools .ab-kind{margin-bottom:12px;font-size:12px;font-weight:700;letter-spacing:.1em;color:var(--nx-t3);}
.ab-tools .ab-desc{margin-bottom:16px;font-size:14px;color:var(--nx-t2);line-height:1.85;}
.ab-tools .ab-foot{font-size:13px;color:var(--nx-t3);line-height:1.8;}
.ab-tools .ab-hi{border-color:transparent;background:var(--nx-os);box-shadow:none;}
.ab-hi .ab-kind{color:var(--nx-ol);}
.ab-hi h3{color:var(--nx-ost);}
@media(max-width:900px){.ab-tools{grid-template-columns:minmax(0,1fr);gap:12px;}}

.ab-beliefs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(22px,3vw,32px) clamp(24px,3.6vw,40px);max-width:900px;margin:0 auto;}
.ab-beliefs>div{padding-top:20px;border-top:2px solid var(--nx-o);}
.ab-beliefs h3{margin-bottom:10px;font-size:clamp(18px,1.9vw,20px);font-weight:700;color:var(--nx-dt);}
.ab-beliefs p{font-size:15px;color:var(--nx-ds);line-height:1.9;}
@media(max-width:768px){.ab-beliefs{grid-template-columns:minmax(0,1fr);}}

.ab-community{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(24px,4.4vw,56px);align-items:center;}
.ab-quotes{display:flex;flex-direction:column;gap:14px;}
.ab-quotes article{padding:24px;border:1px solid var(--nx-bd);border-radius:16px;background:#fff;box-shadow:var(--nx-sh);}
.ab-quotes p{padding-left:14px;border-left:2px solid var(--nx-bd);font-size:16px;line-height:1.85;color:var(--nx-t2);}
.ab-quotes article:first-child p{border-left-color:var(--nx-o);color:var(--nx-t1);}
.ab-community h2{margin-bottom:20px;font-size:clamp(23px,3.4vw,34px);font-weight:700;line-height:1.4;letter-spacing:-.02em;text-wrap:pretty;}
.ab-community-p{max-width:440px;margin-bottom:18px;font-size:clamp(15px,1.6vw,16px);color:var(--nx-t2);line-height:1.9;}
.ab-community-sub{max-width:440px;margin-bottom:26px;font-size:15px;color:var(--nx-t3);line-height:1.85;}
.ab-community-row{display:flex;gap:12px;flex-wrap:wrap;}
@media(max-width:900px){
  .ab-community{grid-template-columns:minmax(0,1fr);gap:22px;}
  .ab-quotes{order:2;}
  .ab-community-p,.ab-community-sub{max-width:none;}
  .ab-community-row{flex-direction:column;}
  .ab-community-row .nx-btn{width:100%;}
}

.ab-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(20px,2.8vw,32px);}
.ab-stats b{display:block;margin-bottom:6px;font-size:clamp(28px,3.6vw,38px);font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;}
.ab-stats span{font-size:14px;color:var(--nx-t3);}
@media(max-width:768px){.ab-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;}}

.ab-cta{padding-block:clamp(34px,5vw,64px);text-align:center;}
.ab-cta h2{margin-bottom:14px;font-size:clamp(23px,2.8vw,30px);font-weight:700;letter-spacing:-.02em;}
.ab-cta>p{max-width:520px;margin:0 auto 30px;font-size:15px;color:var(--nx-t3);line-height:1.85;}
.ab-cta-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
@media(max-width:640px){.ab-cta-row{flex-direction:column;}.ab-cta-row .nx-btn{width:100%;}}

/* ===== /guide 使用說明 ===== */
.gd-hero{padding-block:clamp(30px,4.6vw,56px) clamp(26px,3.6vw,44px);border-bottom:1px solid var(--nx-bd);}
.gd-hero h1{max-width:680px;margin-block:16px;font-size:clamp(27px,3.9vw,40px);font-weight:700;line-height:1.3;letter-spacing:-.025em;text-wrap:pretty;}
.gd-hero>p{max-width:600px;margin-bottom:24px;font-size:clamp(14px,1.6vw,16px);color:var(--nx-t2);line-height:1.9;}
.gd-jump{display:flex;gap:10px;flex-wrap:wrap;}
.gd-jump a{padding:10px 18px;border:1px solid var(--nx-bd);border-radius:999px;background:#fff;font-size:clamp(13px,1.4vw,14px);color:var(--nx-t2);transition:border-color .2s var(--nx-ease),color .2s var(--nx-ease);}
.gd-jump a:first-child{border-color:transparent;background:var(--nx-os);color:var(--nx-ost);font-weight:600;}
.gd-jump a:hover{border-color:var(--nx-o);color:var(--nx-od);}
.gd-jump a:first-child:hover{color:var(--nx-ost);}

.gd-layout{display:grid;grid-template-columns:236px minmax(0,1fr);align-items:start;max-width:1120px;margin:0 auto;}
.gd-toc{position:sticky;top:calc(var(--nx-navh) + 16px);padding:40px 24px 40px var(--nx-pad);}
.gd-toc>p{margin-bottom:18px;font-size:12px;font-weight:700;letter-spacing:.12em;color:var(--nx-t3);}
.gd-toc nav{display:flex;flex-direction:column;gap:2px;}
.gd-toc a{padding:9px 12px;border-radius:8px;font-size:14px;color:var(--nx-t2);}
.gd-toc a:hover{background:var(--nx-bg2);color:var(--nx-od);}
.gd-toc a.is-on{background:var(--nx-os);color:var(--nx-ost);font-weight:600;}
.gd-toc-ask{margin-top:28px;padding-top:20px;border-top:1px dotted var(--nx-t5);}
.gd-toc-ask p{margin-bottom:12px;font-size:13px;color:var(--nx-t3);line-height:1.8;}
.gd-body{padding:40px var(--nx-pad);border-left:1px solid var(--nx-bd);}
@media(max-width:900px){
  .gd-layout{grid-template-columns:minmax(0,1fr);}
  .gd-toc{display:none;}
  .gd-body{padding:28px var(--nx-pad);border-left:none;}
}

.gd-sect{margin-bottom:clamp(34px,4.6vw,52px);scroll-margin-top:calc(var(--nx-navh) + 24px);}
.gd-sect+.gd-sect{padding-top:clamp(28px,3.6vw,44px);border-top:1px dotted var(--nx-t5);}
.gd-sect-head{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:10px;}
.gd-sect-head b{font-family:var(--nx-mono);font-size:14px;font-weight:500;color:var(--nx-o);}
.gd-sect-head h2{font-size:clamp(21px,2.6vw,28px);font-weight:700;letter-spacing:-.02em;}
.gd-sect-head span{font-size:13px;color:var(--nx-t3);}
.gd-intro{max-width:620px;margin-bottom:clamp(26px,3vw,34px);font-size:clamp(14px,1.5vw,15px);color:var(--nx-t2);line-height:1.9;}

.gd-steps{display:flex;flex-direction:column;gap:14px;}
.gd-step{display:grid;grid-template-columns:34px minmax(0,1fr) 250px;gap:20px;align-items:start;padding:24px;border:1px solid var(--nx-bd);border-radius:16px;background:#fff;box-shadow:var(--nx-sh);}
.gd-step>b{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:var(--nx-o);color:#fff;font-size:14px;font-weight:700;}
.gd-step h3{margin-bottom:10px;font-size:clamp(17px,1.8vw,19px);font-weight:700;}
.gd-step-body{margin-bottom:12px;font-size:14px;color:var(--nx-t2);line-height:1.9;}
.gd-tip{padding-left:14px;border-left:2px solid var(--nx-bd);font-size:13px;color:var(--nx-t3);line-height:1.85;}
.gd-step img{width:100%;border-radius:10px;display:block;}
@media(max-width:900px){.gd-step{grid-template-columns:28px minmax(0,1fr);gap:14px;padding:20px;}.gd-step img{display:none;}}

.gd-month{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;}
.gd-month article{padding:24px;border:1px solid var(--nx-bd);border-radius:16px;background:var(--nx-bg2);}
.gd-month-when{margin-bottom:12px;font-family:var(--nx-mono);font-size:12px;color:var(--nx-o);}
.gd-month h3{margin-bottom:12px;font-size:18px;font-weight:700;}
.gd-month ol{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none;font-size:14px;color:var(--nx-t2);line-height:1.8;}
.gd-month-note{margin-top:16px;padding-top:14px;border-top:1px dotted var(--nx-t5);font-size:13px;color:var(--nx-t3);line-height:1.85;}
.gd-month .gd-hi{border-color:transparent;background:var(--nx-os);}
.gd-hi .gd-month-when{color:var(--nx-ol);}
.gd-hi .gd-month-note{color:var(--nx-ost);}
@media(max-width:900px){.gd-month{grid-template-columns:minmax(0,1fr);gap:12px;}}

.gd-table{border:1px solid var(--nx-bd);border-radius:16px;background:#fff;box-shadow:var(--nx-sh);overflow:hidden;}
.gd-tr{display:grid;grid-template-columns:1fr 1.4fr;border-bottom:1px dotted var(--nx-bd);}
.gd-tr:last-child{border-bottom:none;}
.gd-thead{background:var(--nx-bg2);border-bottom:1px solid var(--nx-bd);}
.gd-thead>div{padding:14px 22px;font-size:13px;font-weight:700;letter-spacing:.08em;color:var(--nx-t3);}
.gd-tr>div:nth-child(2){border-left:1px solid var(--nx-bd);}
.gd-tr>dt{padding:18px 22px;font-size:15px;font-weight:600;color:var(--nx-t1);}
.gd-tr>dd{margin:0;padding:18px 22px;border-left:1px solid var(--nx-bd);font-size:14px;color:var(--nx-t2);line-height:1.85;}
@media(max-width:768px){
  .gd-table{border-radius:14px;}
  .gd-tr{grid-template-columns:minmax(0,1fr);}
  .gd-thead{display:none;}
  .gd-tr>dt{padding:16px 18px 0;}
  .gd-tr>dd{padding:8px 18px 16px;border-left:none;}
}

.gd-terms{display:flex;flex-direction:column;}
.gd-terms>div{padding:18px 0;border-bottom:1px dotted var(--nx-t5);}
.gd-terms>div:last-child{border-bottom:none;}
.gd-terms h3{margin-bottom:8px;font-size:16px;font-weight:700;}
.gd-terms p{font-size:14px;color:var(--nx-t2);line-height:1.9;}
.gd-acc details{border-bottom:1px dotted var(--nx-t5);}
.gd-acc summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 0;font-size:16px;font-weight:700;cursor:pointer;list-style:none;}
.gd-acc summary::-webkit-details-marker{display:none;}
.gd-acc summary::after{content:"＋";flex-shrink:0;color:var(--nx-o);font-weight:700;}
.gd-acc details[open] summary::after{content:"－";}
.gd-acc details p{padding-bottom:16px;font-size:14px;color:var(--nx-t2);line-height:1.9;}

.gd-books{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;}
.gd-books article{padding:22px 24px;border:1px solid var(--nx-bd);border-radius:16px;background:#fff;}
.gd-books h3{margin-bottom:8px;font-size:17px;font-weight:700;}
.gd-books p{font-size:14px;color:var(--nx-t2);line-height:1.9;}
@media(max-width:900px){.gd-books{grid-template-columns:minmax(0,1fr);gap:12px;}}

.gd-faq>div{padding:22px 0;border-bottom:1px dotted var(--nx-t5);}
.gd-faq h3{margin-bottom:10px;font-size:clamp(16px,1.7vw,18px);font-weight:700;line-height:1.5;}
.gd-faq p{font-size:clamp(14px,1.5vw,15px);color:var(--nx-t2);line-height:1.9;}
.gd-ask{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-top:32px;padding:clamp(20px,2.4vw,26px) clamp(20px,2.6vw,28px);border-radius:16px;background:var(--nx-bg2);}
.gd-ask strong{display:block;margin-bottom:6px;font-size:17px;font-weight:700;}
.gd-ask em{font-style:normal;font-size:14px;color:var(--nx-t3);}
.gd-ask div:last-child{display:flex;gap:12px;flex-wrap:wrap;}
@media(max-width:640px){.gd-ask div:last-child{flex-direction:column;width:100%;}.gd-ask .nx-btn{width:100%;}}

/* ===== /article 文章內頁 ===== */
.ar-wrap{max-width:760px;margin:0 auto;padding-inline:var(--nx-pad);}
.ar-head{padding-block:clamp(24px,3.4vw,44px) 0;}
.ar-back{display:inline-block;margin-bottom:clamp(18px,2.4vw,28px);font-size:14px;color:var(--nx-t2);background:none;border:none;padding:0;font-family:inherit;cursor:pointer;}
.ar-back:hover{color:var(--nx-od);}
.ar-title{margin-bottom:clamp(20px,2.6vw,28px);font-size:clamp(26px,3.6vw,34px);font-weight:700;line-height:1.35;letter-spacing:-.025em;text-wrap:pretty;}
.ar-cover{width:100%;max-height:400px;object-fit:cover;border-radius:16px;display:block;background:var(--nx-bg2);}
.ar-admin{display:inline-flex;gap:12px;margin-left:auto;}
.ar-admin button{background:none;border:none;padding:0;font-family:inherit;font-size:13px;color:var(--nx-t3);cursor:pointer;text-decoration:underline;}
.ar-admin button:hover{color:var(--nx-od);}
.ar-body{padding-block:clamp(24px,3.4vw,32px) clamp(28px,4vw,48px);}
.nx-page .article-content{font-size:clamp(15px,1.7vw,17px);line-height:2.05;color:var(--nx-t1);}
.nx-page .article-content p{margin-bottom:22px;}
.nx-page .article-content h2{margin:36px 0 14px;font-size:clamp(20px,2.2vw,24px);font-weight:700;color:var(--nx-t1);line-height:1.4;}
.nx-page .article-content h3{margin:28px 0 12px;font-size:clamp(17px,1.9vw,20px);font-weight:700;color:var(--nx-t1);line-height:1.45;}
.nx-page .article-content a{color:var(--nx-od);text-decoration:underline;}
.nx-page .article-content img{border-radius:12px;}
.nx-page .article-content ul,.nx-page .article-content ol{margin-bottom:22px;padding-left:24px;}
.nx-page .article-content li{margin-bottom:8px;line-height:1.95;}

.ar-rel{margin-top:clamp(28px,3.6vw,40px);margin-bottom:clamp(28px,3.6vw,40px);}
.ar-rel>p{margin-bottom:14px;font-size:13px;font-weight:700;letter-spacing:.1em;color:var(--nx-t3);}
.ar-rel-item{display:flex;align-items:center;gap:16px;width:100%;padding:16px 20px;margin-bottom:10px;border:1px solid var(--nx-bd);border-radius:14px;background:#fff;font-family:inherit;text-align:left;cursor:pointer;transition:border-color .2s var(--nx-ease),transform .12s var(--nx-ease);}
.ar-rel-item:hover{border-color:var(--nx-o);}
.ar-rel-item:active{transform:scale(.99);}
.ar-rel-item>i{display:grid;place-items:center;width:36px;height:36px;flex-shrink:0;border-radius:10px;background:var(--nx-os);color:var(--nx-ol);font-style:normal;}
.ar-rel-kind{font-size:12px;font-weight:700;color:var(--nx-t3);}
.ar-rel-label{margin-top:2px;font-size:15px;font-weight:600;color:var(--nx-t1);}
.ar-rel-meta{margin-top:2px;font-size:13px;color:var(--nx-t3);}

.ar-share{display:flex;gap:12px;flex-wrap:wrap;margin-top:clamp(28px,3.6vw,40px);padding-bottom:clamp(28px,3.6vw,40px);border-bottom:1px dotted var(--nx-t5);}
.ar-community{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-block:clamp(28px,3.6vw,40px);padding:clamp(22px,2.6vw,28px);border-radius:16px;background:var(--nx-os);}
.ar-community strong{display:block;margin-bottom:6px;font-size:17px;font-weight:700;color:var(--nx-ost);}
.ar-community em{font-style:normal;font-size:14px;color:var(--nx-ol);}
.ar-community div:last-child{display:flex;gap:10px;flex-wrap:wrap;}
@media(max-width:640px){.ar-community div:last-child{flex-direction:column;width:100%;}.ar-community .nx-btn{width:100%;}}

.ar-comments{padding-bottom:clamp(36px,5vw,64px);}
.ar-comments>p:first-child{margin-bottom:16px;font-size:13px;font-weight:700;letter-spacing:.1em;color:var(--nx-t3);}
.ar-comment{padding:16px 0;border-bottom:1px dotted var(--nx-bd);}
.ar-comment-head{display:flex;align-items:baseline;gap:10px;margin-bottom:8px;}
.ar-comment-head b{font-size:14px;font-weight:600;}
.ar-comment-head span{font-size:12px;color:var(--nx-t3);}
.ar-comment p{font-size:15px;color:var(--nx-t2);line-height:1.9;white-space:pre-wrap;}
.ar-form{margin-top:24px;padding:clamp(20px,2.4vw,24px);border:1px solid var(--nx-bd);border-radius:16px;background:#fff;}
.ar-form>p{margin-bottom:14px;font-size:15px;font-weight:600;}
.ar-form input,.ar-form textarea{border:1px solid var(--nx-bd);border-radius:10px;background:var(--nx-bg);padding:12px 14px;margin-bottom:12px;font-size:15px;color:var(--nx-t1);}
.ar-form input:focus,.ar-form textarea:focus{border-color:var(--nx-o);border-bottom-color:var(--nx-o);}
.ar-form textarea{min-height:110px;line-height:1.85;}
.ar-form-foot{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.ar-form-foot span{font-size:13px;color:var(--nx-t3);}
`;

const DEFAULT_TAGS = ["理財觀念", "信用卡", "記帳", "投資", "讀書筆記", "生活財務", "其他"];

const DEFAULTS = {
  siteTitle: "理財觀點與讀書筆記",
  footerTagline: "理財，是為了讓生活更自由。",
  navLabels: { home: "找到起點", journal: "文章", app: "財務導航", envelope: "實體工具", goods: "推薦好物", community: "8友社群", resources: "免費工具", about: "關於", guide: "使用說明" },
  mobileTabLabels: { home: "首頁", community: "社群", resources: "資源", app: "App", envelope: "存錢袋" },
  footerLabels: {
    colProduct: "產品", colAbout: "關於", colLegal: "法律資訊",
    fApp: "88La財務導航", fEnvelope: "實體理財工具", fGoods: "推薦好物", fPricing: "訂閱方案",
    fAbout: "關於我們", fCommunity: "8友社群", fResources: "資源中心", fNewsletter: "電子報", fContact: "合作洽談",
    fTerms: "服務條款", fPrivacy: "隱私政策", fDisclaimer: "免責聲明",
    copyright: "© 2026 88La 版權所有"
  },
  termsContent: {
    eyebrow: "LEGAL",
    title: "88La財務導航\n服務條款與退款政策",
    lastUpdated: "最後更新：2026 年 7 月",
    body: `<h2>一、服務說明</h2><p>88La財務導航（以下簡稱「本服務」）由 88La 提供，為個人理財記帳管理工具，提供收支記錄、預算規劃及桌面快速記帳等功能。本服務以訂閱制提供，訂閱期間內可無限制使用所有功能。</p><h2>二、訂閱方案與收費</h2><p>本服務提供以下訂閱方案：</p><ul><li>月訂閱：${APP_MONTHLY_PRICE} / 月</li><li>年方案：${APP_YEARLY_PRICE} / 年</li></ul><p>所有金額均為新台幣計價。付款由綠界科技股份有限公司代為處理，月訂閱採信用卡定期定額，年方案採單筆付款。</p><h2>三、續約方式</h2><p>月訂閱將依原方案金額定期扣款，如不希望續約，請於下次扣款日前至帳戶設定頁面取消。年方案不會自動續約，到期前將另行提醒。方案到期前仍可使用當期服務。</p><h2>四、退款政策</h2><p>本服務所販售之內容為數位服務，依消費者保護法第 19 條規定，數位內容於開通後不適用七天鑑賞期退換貨規定。</p><p>如有特殊情形，請聯繫 everydollars17@gmail.com，由 88La 個案審酌處理。</p><h2>五、帳戶與資料</h2><p>用戶須自行保管帳戶登入資訊。用戶的記帳資料儲存於個人 Google 雲端帳號中，訂閱取消後資料仍保留於用戶自己的 Google 試算表，88La 不持有用戶資料。</p><h2>六、服務變更</h2><p>88La 保留調整訂閱方案定價及功能內容之權利，並將提前 30 天以電子郵件通知用戶。現有訂閱者不受漲價影響，直至當期訂閱到期。</p><h2>七、帳號到期與資料保留</h2><ol><li>訂閱方案到期前三天，系統將透過 Email 及 App 推播通知提醒續訂。</li><li>方案到期後，帳號進入 7 天緩衝期：<ul><li>可瀏覽所有歷史記帳紀錄</li><li>可匯出個人資料</li><li>新增、編輯、刪除等寫入功能暫停使用</li></ul></li><li>緩衝期結束後（到期後第 8 天起），帳號功能將完全停用，但資料不會主動刪除。</li><li>如需恢復使用，續訂即可立即解鎖所有功能。</li></ol><h2>八、聯絡方式</h2><p>Email：everydollars17@gmail.com<br>官方網站：https://site.88lamoney.com</p>`,
    footerNote: "使用本服務即代表你已閱讀並同意以上服務條款。\n如對條款有任何疑問，請於訂閱前透過 Email 與我們聯繫。"
  },
  privacyContent: {
    eyebrow: "PRIVACY",
    title: "88La財務導航\n隱私政策",
    lastUpdated: "最後更新：2026 年 7 月",
    intro: "88La 由個人創作者獨立營運，我們深知理財記帳涉及您最私密的財務細節，因此特別撰寫此份隱私政策，以清楚說明本服務蒐集何種資料、如何運用、儲存於何處，以及哪些人能夠接觸這些資訊。",
    body: `<h2>一、適用範圍</h2><p>本隱私政策適用於 88La財務導航（官網與網頁應用程式），說明本服務如何處理您於使用過程中提供或產生之個人資料。本政策不適用於本服務以外之外部連結網站，亦不適用於非本服務委託或參與管理之第三方。</p><h2>二、我們蒐集的資料</h2><p><strong>【登入時】</strong><br>本服務採用 Google 帳號登入機制，系統將取得您的電子郵件位址，作為識別您帳號身分之唯一依據。您無需另行設定獨立的帳號密碼。</p><p><strong>【使用記帳功能時】</strong><br>您於使用過程中主動輸入之內容，包括每一筆記帳明細（金額、類別、付款方式、備註、消費當下之心情記錄）、月度預算規劃、信用卡與帳戶設定、負債資料，以及理財筆記，皆屬於您所提供之資料範疇。</p><p><strong>【付款時】</strong><br>訂閱費用係由綠界科技股份有限公司代為收取，您的信用卡卡號、有效期限等付款資訊將直接於綠界之付款頁面輸入，88La 不會接觸、亦不會儲存任何與您的付款工具相關之資訊。本服務僅會收到付款是否成功之通知，以憑此開通您的訂閱權限。</p><p><strong>【瀏覽網站時（自動蒐集）】</strong><br>本服務官網使用 Vercel Web Analytics 統計流量，此工具不使用第三方 cookie，而是以傳入請求產生的雜湊值識別訪客，所記錄之資料皆為匿名性質，不會與任何個人、客戶或 IP 位址綁定或關聯，相關瀏覽紀錄亦不會永久保存，將於 24 小時後自動清除。我們僅藉此瞭解整體網站使用狀況（如頁面瀏覽量），不會用來識別您的個人身分。</p><h2>三、未成年使用者</h2><p>本服務之受眾可能包含未滿 18 歲之學生族群。若您未滿 18 歲，建議於監護人知悉並同意之情況下使用本服務。若您是未滿 18 歲使用者之監護人，並認為您的子女未經同意提供了個人資料，請透過第七條所列聯絡方式與我們聯繫，我們將協助處理相關資料之刪除或更正事宜。</p><h2>四、資料儲存之處所</h2><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#FDF0E8;"><th style="padding:10px 14px;text-align:left;font-weight:600;border-bottom:2px solid #C85A14;font-size:12px;">資料類型</th><th style="padding:10px 14px;text-align:left;font-weight:600;border-bottom:2px solid #C85A14;font-size:12px;">儲存位置</th><th style="padding:10px 14px;text-align:left;font-weight:600;border-bottom:2px solid #C85A14;font-size:12px;">說明</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(0,0,0,0.07);"><td style="padding:12px 14px;vertical-align:top;">記帳明細、預算、筆記</td><td style="padding:12px 14px;vertical-align:top;">您個人之 Google 試算表</td><td style="padding:12px 14px;vertical-align:top;">登入後，系統將自動於您的 Google 雲端硬碟建立專屬檔案，相關資料即時寫入其中</td></tr><tr style="border-bottom:1px solid rgba(0,0,0,0.07);"><td style="padding:12px 14px;vertical-align:top;">帳號狀態、到期日、帳戶與信用卡及負債設定</td><td style="padding:12px 14px;vertical-align:top;">Firebase（本服務之後端資料庫）</td><td style="padding:12px 14px;vertical-align:top;">用於驗證您訂閱之有效性，並儲存您的個人化功能設定</td></tr><tr style="border-bottom:1px solid rgba(0,0,0,0.07);"><td style="padding:12px 14px;vertical-align:top;">最近一次驗證之時間戳記</td><td style="padding:12px 14px;vertical-align:top;">您裝置之本機儲存空間（localStorage）</td><td style="padding:12px 14px;vertical-align:top;">僅用於判斷離線狀態下之暫時可用性，不含任何記帳內容</td></tr><tr style="border-bottom:1px solid rgba(0,0,0,0.07);"><td style="padding:12px 14px;vertical-align:top;">匿名瀏覽統計</td><td style="padding:12px 14px;vertical-align:top;">Vercel Web Analytics</td><td style="padding:12px 14px;vertical-align:top;">不可識別個人身分，24 小時後自動清除</td></tr></tbody></table><p>換言之，您的記帳流水帳實際上是存放於「您個人」之 Google 雲端硬碟內，而非本服務之伺服器。即便本服務有朝一日終止運作，該份試算表仍歸屬於您本人，您可隨時開啟、複製或刪除。</p><h2>五、資料之存取權限</h2><ul><li>您的記帳明細存放於您個人之 Google 試算表中，僅您本人得以查閱，本服務不具備、亦未申請主動讀取或瀏覽該試算表內容之權限</li><li>本服務所申請之 Google 授權範圍，僅限於「本應用程式所建立之檔案」（技術上稱為 drive.file），絕不涉及您 Google 雲端硬碟中既有之其他檔案</li><li>帳號狀態與設定資料存放於 Firebase，僅供系統驗證訂閱狀態之用，本服務不會將其提供、洩露或出售予任何第三方</li><li>金流相關資訊由綠界科技依其自身隱私規範處理，本服務全程不接觸您的付款資料</li></ul><p>本服務承諾，絕不將您的資料出售予廣告主，亦不會將您的記帳內容用於任何行銷分析或對外提供。</p><h2>六、資料之運用目的</h2><ul><li>呈現您的記帳記錄、預算對比分析、月度診斷報告等您主動使用之功能</li><li>驗證您的訂閱是否仍屬有效期間</li><li>於您與客服聯繫時，協助核對您的帳號狀況</li><li>透過匿名流量統計瞭解網站整體使用狀況，藉以優化服務內容</li></ul><p>凡未經您同意或非屬您主動使用之功能範疇，本服務絕不擅自運用您的資料，例如分析您的消費習慣以投放廣告。</p><h2>七、資料安全與外洩通知</h2><p>本服務已採取合理之技術與管理措施，保護您的資料免於未經授權之存取、使用或揭露。惟若不幸發生資料安全事件（例如後端系統遭未經授權存取），本服務將於知悉後之合理期限內，透過您註冊時所使用之電子郵件通知您，並說明事件性質、可能受影響之資料範圍，以及本服務已採取或將採取之應變措施。</p><h2>八、資料保留期限</h2><ul><li>訂閱使用期間，資料持續妥善保存</li><li>訂閱取消或到期後，依本服務之服務條款，資料將保留七日供您匯出（CSV 或 PDF 格式），逾期後系統可能予以清除</li><li>至於存放於您個人 Google 試算表內之資料，縱使本服務端之紀錄遭清除，惟若您未自行刪除，該份試算表仍將留存於您的 Google 雲端硬碟之中</li></ul><h2>九、您所享有之權利</h2><p>依個人資料保護法相關規定，您對於本服務所持有之個人資料，得行使下列權利：</p><ul><li>查詢或請求閱覽</li><li>請求製給複製本</li><li>請求補充或更正</li><li>請求停止蒐集、處理或利用</li><li>請求刪除</li></ul><p>您可隨時匯出您完整之記帳資料（CSV 或 PDF 格式），亦可隨時開啟您的 Google 試算表自行查閱、複製或備份原始資料。如欲行使上述權利或取消訂閱，敬請致信 everydollars17@gmail.com 提出申請，我們將於合理期限內處理回覆。</p><h2>十、政策之修改</h2><p>本政策內容如有修改，將於本網站公告並更新最後修改日期。重大變更將透過電子郵件另行通知您。</p><h2>十一、聯絡方式</h2><p>如有任何關於本隱私政策之疑問，敬請致信 everydollars17@gmail.com，我們將竭誠為您回覆。</p>`
  },
  disclaimerContent: {
    eyebrow: "DISCLAIMER",
    title: "88La財務導航\n免責聲明",
    lastUpdated: "最後更新：2026 年 7 月",
    body: `<h2>一、服務性質聲明</h2><p>88La財務導航（以下簡稱「本服務」）為個人記帳、支出追蹤與儲蓄習慣建立之輔助工具，其核心功能在於協助使用者記錄日常收支、設定個人預算目標，以及建立規律的儲蓄行為。</p><p>本服務所提供之收支診斷報告，係依據使用者自行輸入之數據，結合本服務創作者之個人實務理財經驗所設計之參考框架自動產生。本服務創作者並非持有任何金融相關執照之財務顧問，所有內容均屬個人實務經驗之分享，不構成專業財務顧問服務，亦不涉及任何有價證券、基金、期貨、外匯、加密貨幣或其他金融商品之投資策略建議、推介或勸誘行為。</p><h2>二、資訊僅供參考</h2><p>本服務所提供之預算建議、收支診斷分析、儲蓄目標試算及相關數字呈現，均係依據使用者自行輸入之個人資料，結合創作者個人實務理財經驗所設計之參考框架，由系統自動運算後呈現之參考資訊。</p><p>診斷報告中所呈現之支出比例建議、預算配置方向等內容，均源自創作者個人實務經驗之歸納，不同使用者之財務狀況、收入結構、家庭背景與生活條件各異，上述建議未必適用於每一位使用者的個別情況。</p><p>上述資訊：</p><ul><li>係創作者個人實務經驗之分享，不代表對您財務狀況之專業個人化評估</li><li>不構成任何具法律效力之財務建議或投資意見</li><li>不保證使用本服務後必然達成特定儲蓄金額或財務目標</li><li>如您的財務狀況較為複雜（如負債重組、保險規劃、稅務安排等），建議另行諮詢具有合法執照之專業人士</li></ul><h2>三、使用者自行負責原則</h2><p>使用者在參考本服務所提供之任何資訊、數據或分析結果後，所作出之一切財務決策，均應由使用者本人獨立評估、審慎判斷，並自行承擔相應之後果與責任。</p><p>如需專業之財務規劃建議，建議您諮詢具有合法執照之財務顧問或相關專業人士。</p><h2>四、系統資料準確性</h2><p>本服務之所有計算與分析結果，均以使用者自行輸入之資料為基礎。若輸入資料有誤、不完整或未即時更新，系統所呈現之結果可能與您的實際財務狀況有所落差，本服務對此不負任何責任。</p><h2>五、服務中斷與資料完整性</h2><p>本服務係透過網際網路提供，可能因伺服器維護、網路異常、第三方服務（包括 Google、Firebase、綠界科技等）故障，或其他不可抗力因素，導致服務暫時中斷或資料暫時無法存取。本服務對上述情形所造成之不便，不負任何賠償責任，但將盡合理努力維持服務之穩定運行。</p><h2>六、本聲明之修改</h2><p>本服務得隨時修訂本免責聲明，修訂後之內容將公告於本頁面並更新修改日期。繼續使用本服務，即視為接受修訂後之條款。</p><h2>七、聯絡方式</h2><p>如對本聲明有任何疑問，歡迎透過以下方式與我們聯繫：</p><p>Email：everydollars17@gmail.com<br>Instagram：@every_dollars</p>`,
    footerNote: "本服務為個人記帳與儲蓄習慣建立工具。診斷報告內容係創作者個人實務理財經驗之分享，僅供參考，不構成專業財務顧問服務或投資建議。使用者應依據自身狀況獨立判斷，並自行承擔相應責任。"
  },
  demoStory: {
    toolbarLabel: "互動 Demo",
    label: "LIVE DEMO",
    heading: "真實帳戶長這樣",
    intro: "以下是示範帳戶「小琳」的完整記帳紀錄，和你未來使用的畫面一模一樣。",
    previewHeading: "月中隨時監測收支狀況",
    previewIntro: "·本月進行中：先看現在最重要的事\n·本月結束後：整理成結論和下月安排\n※可按鈕切換月中/月底情境",
    interactiveHeading: "想看細節？直接操作完整 Demo",
    note: "可以切換頁面、展開明細，看完整的診斷結果",
    personaLabel: "示範帳戶人設",
    personaName: "小琳，28 歲，行銷企劃",
    // 這三段的數字必須跟 88la-finance/src/demoData.js 的示範帳戶對得上。
    // 改動 demo 資料的金額時，這裡要一起改（驗算見該專案的
    // scripts/demo_persona_verification.mjs）。2026-08-17 對照的版本：
    // 固定超支 3,489／購物 4,540 對預算 2,500／衝動 4 筆 1,950／
    // 卡費預留 13,794／可用餘額 2,876／儲蓄 4,000 對目標 8,000
    personaFacts: "月薪 NT$42,000，台北租屋，每月房租 NT$13,000\n兩張信用卡加一張簽帳卡，結帳日都是 20 號\n目標：緊急備用金存到 NT$60,000，同時累積 NT$80,000 頭期款\n有記帳習慣但常常「記了，然後呢？」月初信心滿滿，月中容易失控，月底發現目標又落後",
    findingsLabel: "系統怎麼看",
    findings: "本月沒有現金缺口，但原訂財務安排沒有全部完成\n固定支出超出原安排 NT$3,489，變動總支出超出 NT$2,235，但正常日常支出低於預算 NT$1,445\n最值得注意的是半年繳保險沒有提前準備，本月實際 NT$4,800\n扣除本期卡費 NT$13,794 與儲蓄 NT$4,000 後，可用餘額為 NT$2,876\n儲蓄目標 NT$8,000，本月完成 NT$4,000，還差 NT$4,000",
    suggestionsLabel: "給小琳的建議",
    suggestions: "半年繳保險 NT$3,600，之後每月預存 NT$600，不把整筆加進下月固定預算\n購物的 NT$1,450 已確認為臨時支出，下月先維持原本日常預算\n飲食食材調整為 NT$2,900，交通調整為 NT$2,000\n本月還差 NT$4,000 儲蓄，先決定是否帶到下月安排\n衝動消費 4 筆共 NT$1,950，下次先放進願望清單三天",
    lockNote: "以上是示範帳戶「小琳」8 月的完整診斷。你的畫面會依自己的記帳結果產生。"
  },
  resourcesCopy: {
    filterAll: "全部", filterTools: "互動工具", filterFree: "免費文章", filterMember: "會員文章",
    toolsHeading: "互動工具", toolsSub: "動手玩，兩分鐘看結果",
    toolsEmpty1: "還沒有資源", toolsEmpty2: "資源整理好後會放在這裡",
    articlesHeading: "文章", articlesSub: "免費與會員限定文章都在這裡",
    articlesEmpty: "這個分類還沒有文章"
  },
  goodsCopy: {
    emptyState1: "88La 正在尋找好物中",
    emptyState2: "有合適的商品會在這裡和你分享"
  },
  envelopeCopy: {
    storeNote: "賣場下單，選擇取貨方式",
    heroImgPlaceholder: "產品實拍圖示意",
    productsLabel: "商品系列",
    productsHeading: "存錢袋系列",
    manageLink: "管理商品 →",
    emptyState: "商品準備中，敬請期待",
    buyLink: "前往購買 →",
    comingSoonLink: "連結準備中",
    whyLabel: "為什麼選實體工具",
    whyHeading: "不是每個人都適合純數位記帳",
    why: [
      { title: "看得到、摸得到", desc: "數位數字有時候不夠有感，實體存錢袋讓存錢變成一個具體的動作。" },
      { title: "跟 App 互補使用", desc: "日常花費用88La財務導航記錄，存錢目標用存錢袋實體累積，兩者不衝突。" },
      { title: "不需要學習成本", desc: "不用研究功能怎麼用，拿到就能開始，適合想簡單開始的人。" },
    ],
    ctaLabel: "開始存錢",
    ctaHeading: "在賣場就能買到",
    ctaBtn: "前往賣場 →"
  },
  communityCopy: {
    introPara1: "我們相信理財不是比賽誰存得多、誰花得少，而是找到適合自己的節奏。",
    introPara2: "8友社群從一開始就不是一個「教學課程」，而是一群願意誠實面對自己數字的人聚在一起，互相打氣。",
    joinLabel: "加入方式",
    joinHeading: "先追蹤，LINE 社群開放時第一時間通知你",
    lineBadge: "Coming soon",
    lineTitle: "加入 LINE 社群",
    lineDesc: "正式社群還在籌備中，開放後會優先通知目前已追蹤 IG 的朋友。",
    linePill: "敬請期待",
    igBadge: "現在就能開始",
    igTitle: "追蹤 Instagram",
    igDesc: "日常理財觀念、社群第一手消息都會先在這裡發布，不想錯過就先追蹤起來。",
    igBtn: "追蹤 @every_dollars",
    recentLabel: "最新動態",
    recentHeading: "Instagram 上的最新分享",
    moreLink: "查看更多動態 →",
    feedbackLabel: "會員迴響",
    feedbackHeading: "8友的真實回饋",
    ctaLabel: "下一步",
    ctaHeading: "先從追蹤開始",
    ctaDesc: "LINE 社群開放前，IG 是我們跟大家保持聯繫的地方，日常理財觀念也會先在這裡分享。",
    ctaBtn: "追蹤 Instagram →"
  },
  igCopy: {
    label: "LATEST",
    heading: "最新消息",
    sub: "影片、貼文，直接連結 Instagram",
    profileBtn: "IG 主頁 →"
  },
  shopCopy: {
    label: "SHOP",
    heading: "商品",
    sub: "88La的手作溫暖，陪伴你的存錢之旅。",
    quizTag: "88LA QUIZ • 互動工具",
    quizHeading: "找到最適合你的存錢工具",
    quizDesc: "做完 7 題，直接告訴你哪款存錢工具最適合你。",
    quizBtn: "開始測驗 →",
    soldOut: "尚未上架"
  },
  aboutCopy: {
    heroHeading: "理財是為了讓生活更自由，不是為了成為另一種壓力。",
    heroSub: "我們不做「你應該要這樣做」的教學，只給你看懂自己數字的工具。",
    storyLabel: "故事",
    storyHeading: "從一份免費範本開始",
    timeline: [
      { year: "起點", title: "一份免費的 Google Sheets 記帳範本", desc: "從「先存後花」的概念出發，幫助超過 4,000 人下載使用。" },
      { year: "進化", title: "推出付費 2.0 版本", desc: "加入五種儲蓄模式、支出追蹤、信用卡分析、診斷報告與行事曆檢視，超過百人使用。" },
      { year: "現在", title: "88La財務導航 + 8友社群", desc: "把範本升級成完整的 Web App，同時也有一群人一起練習理財，不是一個人硬撐。" },
    ],
    beliefsLabel: "我們相信",
    beliefsHeading: "做法可以不一樣，但方向很清楚",
    beliefs: [
      { n: "1", title: "行為改變優先", desc: "比起記帳工具本身，我們更在乎它有沒有真的幫你改變花錢的習慣。" },
      { n: "2", title: "給數字不給評判", desc: "我們只呈現「差多少」和「去哪裡調」，不替你的選擇打分數。" },
      { n: "3", title: "不說教的陪伴", desc: "理財很個人，每個人的節奏不一樣，我們不會用同一套標準要求所有人。" },
    ],
    helloLabel: "HELLO",
    ctaBtn1: "開始使用88La財務導航",
    ctaBtn2: "認識 8友社群"
  },
  subscriptionCopy: {
    heading: "選擇你的方案",
    intro: "用 88La財務導航，把記帳這件事變成每天兩分鐘的習慣。\n所有方案皆包含桌面快速記帳功能。",
    notes: "所有金額均為新台幣計價，含稅\n月訂閱採信用卡定期定額，可於下次扣款日前取消\n年方案採單筆付款，不會自動續約\n到期前三天將寄送提醒通知。到期後提供 7 天資料匯出緩衝期，期間可瀏覽歷史紀錄，續訂即可立即恢復完整功能",
    foundingNote: `感謝最早支持 88La 的創始成員，你們的定價永久保留：月訂閱 ${FOUNDER_MONTHLY_PRICE} ／ 年方案 ${FOUNDER_YEARLY_PRICE}。請直接選擇方案並以你當時購買的 Email 登入，系統會自動調整至創始優惠價。此優惠僅適用於已取得創始會員資格之用戶，不開放新申請。`
  },
  trustStats: [
    { num: "90+", label: "8友社群成員" },
    { num: "4700+", label: "記帳範本下載" },
    { num: "150+", label: "付費工具使用者" },
    { num: "3年+", label: "理財經驗" }
  ],
  envelopeHero: {
    eyebrow: "88La · 實體工具",
    headline: "看得見的存錢儀式感",
    subhead: "把存錢這件事從數字變成實際的動作。分類存錢袋讓每一筆存款都有明確去處，適合想要「摸得到」進度的人。",
    ctaPrimary: "前往賣場購買",
    ctaSecondary: "不確定選哪款？先測驗看看",
    buyTagline: "88La的手作溫暖，陪伴你的存錢之旅。",
    heroImg: ""
  },
  goodsHero: {
    eyebrow: "88La · 推薦好物",
    headline: "真的有在用，才推薦",
    subhead: "這些不是我自己的商品，是我實際用過、覺得對理財這件事有幫助的東西。"
  },
  resourcesHero: {
    eyebrow: "資源中心",
    headline: "免費工具與文章，先看懂自己再說",
    subhead: "不用訂閱也能先玩玩看。互動測驗幫你快速抓到自己的財務位置，文章則是把理財觀念拆成你聽得懂的話。"
  },
  communityHero: {
    eyebrow: "88La · COMMUNITY",
    headline: "理財這件事，一個人練習很孤單。",
    subhead: "8友社群是一群正在練習理財的人，互相打氣、交流，不評判彼此的數字，只是一起把日子過好一點。"
  },
  links: {
    lineCommunity: "https://line.me/R/ti/p/@367xhgyr",
    lineOfficial: "https://line.me/R/ti/p/@367xhgyr",
    instagram: "https://www.instagram.com/every_dollars/",
    email: PUBLIC_CONTACT_EMAIL
  },
  about: {
    intro: "嗨，我是 88La。\n\n我從信封分類法開始認識理財，不是從書本，而是從自己每個月真實的薪水開始。\n\n我相信理財不是讓自己活得緊繃，而是讓你對生活有更多掌控感和自由度。",
    img: "", bannerImg: "",
    bannerTitle: "理財，是為了讓生活更自由。",
    bannerSub: "88La 帶你用最真實的方式，重新認識金錢。",
    bannerBtn1: "加入 LINE 社群", bannerBtn2: "追蹤 Instagram"
  },
  articles: [
    { id: 1, title: "為什麼你記帳卻還是存不到錢？", date: "2026-05-01", tag: "理財觀念", img: "", excerpt: "很多人以為記帳就能存到錢，但其實記帳只是照妖鏡，照出你花了哪些錢，卻不會自動幫你存錢。", content: "很多人問我：「Barbara，我有記帳，但怎麼還是存不到錢？」\n\n這個問題我自己以前也有過。記帳本寫得密密麻麻，每個月花了多少一清二楚，但帳戶餘額還是在月底趨近於零。\n\n後來我才發現：記帳只是照妖鏡，不是存錢器。\n\n它能告訴你錢去哪了，但它不會幫你把錢留下來。\n\n真正讓我開始存到錢的方法，是把順序倒過來：先存，再花。\n\n發薪日當天，先把要存的錢轉出去。剩下的才是這個月可以動用的生活費。", views: 312, comments: [{ name: "8友小美", text: "這個觀念真的打到我了！", date: "2026-05-03" }], relatedLinks: [] },
    { id: 2, title: "信用卡不是壞東西，是你沒搞清楚規則", date: "2026-05-15", tag: "信用卡", img: "", excerpt: "很多人怕信用卡，覺得它會讓自己亂花錢。但其實信用卡是中性工具，問題在於你有沒有掌控它。", content: "信用卡本身是中性的，問題從來都不是卡，是使用的方式。\n\n把信用卡的預算視同現金在管理。刷了就登記，不要等帳單才知道。設定自動扣款，永遠不繳最低應繳。", views: 198, comments: [], relatedLinks: [] }
  ],
  products: [
    { id: 1, name: "理財自動導航器 2.0", type: "digital", price: "NT$ 699", desc: "Google Sheets 理財模板，自動模式偵測，適合薪水族。", url: "https://portaly.cc/everydollars", img: "" },
    { id: 2, name: "88La 存錢袋", type: "physical", price: "NT$ 180", desc: "手工製作信封袋，現金分類存錢用。", url: "", img: "" }
  ],
  igPosts: [
    { id: 1, title: "假記帳的陷阱你中了嗎？", url: "https://www.instagram.com/every_dollars/", thumb: "", type: "post" },
    { id: 2, title: "存錢袋使用教學｜現金分配法", url: "https://www.instagram.com/every_dollars/", thumb: "", type: "post" }
  ],
  memberFeedback: [],
  goods: [
    { id: 1, name: "精臣標籤機 D110", brand: "Niimbot 精臣", desc: "幫信封袋、存錢罐貼上標籤，讓分類理財更有儀式感。", url: "https://www.niimbot-tw.com/one-page-stores/every-dollars", img: "", active: true },
    { id: 2, name: "《富爸爸，窮爸爸》", brand: "羅勃特．乙．清崎", desc: "理財入門必讀經典，重新理解金錢、資產與負債的關係。", url: "", img: "", active: true },
    { id: 3, name: "A4 透明拉鏈袋（10入）", brand: "", desc: "搭配信封分類法使用，用透明袋分裝現金一目瞭然。", url: "", img: "", active: true },
  ],
  tags: DEFAULT_TAGS,
  resources: [],
  newsletter: {
    subscriberCount: "1,000+", intro: "每週一篇理財觀念，寫給想讓錢更有意義的你。不說廢話，只寫真實心得。", archiveNote: "隨時取消訂閱，沒有壓力。",
    readerSuffix: "位讀者", titleLine2: "理財週報",
    successTitle: "感謝訂閱！", successSub: "我們會在下期發刊時通知你。",
    emailPlaceholder: "你的 Email", subscribeBtn: "訂閱",
    recentLabel: "RECENT ISSUES", recentHeading: "最新文章", viewAllLink: "查看全部 →", readLink: "閱讀 →"
  },
  appContent: {
    heroTitle: "記帳 App，讓你真的",
    heroHighlight: "存到錢",
    heroSub: "雲端同步 Google Sheets，智慧診斷消費模式，支援家庭記帳。不只記帳，更幫你看懂錢的流向。",
    pricingNote: "這不是記帳的錢，是每個月一次解讀的錢。",
    comingSoonTitle: "目前開放第二批內測",
    comingSoonSub: "正式開放時間另行公告，功能介紹可以先查看。",
    heroEyebrow: "88LA FINANCE · APP",
    heroCtaBtn: "了解方案 →",
    featuresLabel: "FEATURES",
    featuresHeading: "你需要的，都在這裡",
    pricingLabel: "PRICING",
    pricingHeading: "方案與費用",
    loginNote: "已有帳號？",
    loginLink: "直接登入",
    legacyBadge: "輕量版",
    legacyHeading: "想要更簡單的 Google Sheets 版本？",
    legacyDesc: "理財自動導航器 2.0 是純 Google Sheets 模板，自動模式偵測，適合不想用 App、只想要一份好用表格的人。",
    legacyPrice: "NT$ 299 · 一次性購買",
    legacyBtn: "前往購買 2.0 版本",
    planDetailBackBtn: "← 返回方案",
    planDetailLabel: "PLAN DETAILS",
    planDetailFeaturesLabel: "包含功能",
    planDetailBuyBtn: "立即購買 →",
    planLearnMoreBtn: "了解更多 →",
    faqLabel: "常見問題",
    faqHeading: "大家最常問的幾件事",
    faqCountNote: "完整 FAQ 共 {n} 題，詳見官網使用說明頁",
    faqGuideBtn: "查看完整使用說明 →",
    features: [
      { id: 1, n: "01", title: "即時記帳", desc: "一秒記下每筆花費，情緒、類別、帳戶、分期全部記錄。", img: "" },
      { id: 2, n: "02", title: "雲端同步", desc: "資料存在你自己的 Google Sheets，永遠不鎖在 App 裡。", img: "" },
      { id: 3, n: "03", title: "智慧診斷", desc: "月底自動分析消費模式，對比上月找出節流點。", img: "" },
      { id: 4, n: "04", title: "負債追蹤", desc: "定額或不定額還款進度，信用卡分期一目瞭然。", img: "" },
      { id: 5, n: "05", title: "家庭模式", desc: "個人、公費、家庭三種模式獨立管理，互不干擾。", img: "" },
      { id: 6, n: "06", title: "PWA 支援", desc: "加到主畫面，iOS / Android 體驗接近原生 App。", img: "" },
    ],
    plans: [
      { id: 1, name: "月訂閱", price: APP_MONTHLY_PRICE, period: "/月", highlight: false, badge: "", features: ["88La財務導航完整功能", "桌面快速記帳", "隨時可取消"], detailTitle: "", detailImg: "", detailContent: "" },
      { id: 2, name: "年方案", price: APP_YEARLY_PRICE, period: "/年", highlight: true, badge: "最多人選擇", features: ["88La財務導航完整功能", "桌面快速記帳", `省下約 ${APP_YEARLY_DISCOUNT}%`, `相當於 NT$${APP_YEARLY_MONTHLY_EQUIVALENT}/月`], detailTitle: "", detailImg: "", detailContent: "" },
    ],
    guideTitle: "88La財務導航，使用說明",
    guideData: {
      phases: [
        { id: 0, label: "初次設定", sub: "開始使用，設定一次即可", isSetup: true, steps: [
          { id: 1, num: "01", title: "帳戶設定", body: "打開網銀 App，盤點所有帳戶，輸入帳戶名稱與當前餘額。之後每次記帳時直接選取帳戶付款，餘額自動更新，不用再手動計算。", bullets: [] },
          { id: 2, num: "02", title: "信用卡設定", body: "輸入卡別名稱、結帳日、繳費日，系統便能自動提醒卡費時程與預留金額，避免到期才發現現金不夠。", bullets: [] },
          { id: 3, num: "03", title: "負債追蹤設定（選用）", body: "有貸款或分期的話，填入債務名稱、性質、月繳金額、期數。系統自動計算剩餘期數並追蹤還款進度，也可一鍵繳款直接完成記帳。", bullets: [] },
        ]},
        { id: 1, label: "月初", sub: "盤點與規劃", steps: [
          { id: 11, num: "01", title: "收入盤點", body: "領到薪水的那一刻，先把所有收入來源都列出來，每一塊錢都好好安頓。你可以自由決定哪些收入要列入當期預算，哪些想另作運用。", bullets: [] },
          { id: 12, num: "02", title: "設定儲蓄目標", body: "填寫這個月想存下的目標金額，養成「先存後花」的習慣，再進入下一步的預算分配。", bullets: [] },
          { id: 13, num: "03", title: "智慧預算建議", body: "系統根據你的薪水與儲蓄目標，自動推算出適合的分配比例，涵蓋變動支出（含預存支出）、固定支出、儲蓄三大類。", bullets: [] },
          { id: 14, num: "04", title: "實際分配對比", body: "分配完預算後，系統將「你的實際分配比例」與「系統建議比例」並列對比，幫你看清楚儲蓄空間與固定支出占比。", bullets: [] },
          { id: 16, num: "05", title: "上月支出對比", body: "編列預算時，系統自動帶入上月各項實際支出數據，讓你在分配當下就能看出哪些項目超支、哪些有節餘空間，不必翻找舊紀錄也能快速調整本月預算方向。", bullets: [] },
          { id: 15, num: "06", title: "公費 / 家庭模式（選用）", body: "如果你和伴侶有公費分帳或家庭合併收支的需求，系統會引導你一步步抓準金額。", bullets: ["公費制：每人提撥固定金額，用於共同支出", "家庭制：雙方薪水合併使用，共同規劃預算"] },
        ]},
        { id: 2, label: "月中", sub: "日常記帳", steps: [
          { id: 21, num: "07", title: "快速記帳", body: "桌面快速記帳介面，降低記帳阻力，實現無痛記帳。記帳時可設定歸屬、支付方式與消費情緒。", bullets: ["歸屬：個人 / 公費 / 家庭", "支付方式：自由調整", "消費情緒：檢視衝動消費頻率"] },
          { id: 27, num: "08", title: "智慧預填", body: "根據你的記帳習慣，系統自動預填常用金額、類別與支付方式。開啟記帳時欄位已幫你填好，確認或微調即可完成，大幅縮短每次記帳時間。", bullets: [] },
          { id: 22, num: "09", title: "信用卡管理", body: "依卡別設定結帳日、繳費日，系統自動提醒卡費與預留金額，避免惡性循環。", bullets: ["何時繳、繳多少", "下個月卡費預留提醒", "刷卡頻率偵測與建議"] },
          { id: 23, num: "10", title: "帳戶管理", body: "自由設定帳戶名稱、金額、icon，支援帳戶間轉帳（含手續費），並可連動記帳直接用帳戶支付。", bullets: [] },
          { id: 24, num: "11", title: "儲蓄管理", body: "月初編列的儲蓄、投資、預存項目可設定具體目標，透過動態進度條隨時掌握累積進度。", bullets: [] },
          { id: 25, num: "12", title: "負債追蹤", body: "輸入貸款金額、已還金額、期數，追蹤還款進度，並可一鍵繳款直接完成記帳。", bullets: [] },
          { id: 26, num: "13", title: "預存管理", body: "建立一個專屬帳戶來存放預存款項，每次存入時用轉帳功能記錄，要動用時再從帳戶扣款，餘額隨時清楚。習慣用現金預存的人，也可以建立「現金預存帳戶」，操作邏輯一樣。", bullets: [] },
        ]},
        { id: 3, label: "月底", sub: "診斷與調整", steps: [
          { id: 31, num: "14", title: "月度診斷", body: "系統全面分析本月收支，找出調整方向。", bullets: ["固定 / 變動支出狀況、儲蓄是否達標", "支出類別占比、支付方式、情緒消費分析", "偵測未列入預算的支出與未計畫儲蓄", "給出下個月具體調整方向與深度建議"] },
          { id: 32, num: "15", title: "最新快訊", body: "首頁一目瞭然：預算進度條、信用卡費提醒、近期消費紀錄、本月還款倒數。", bullets: [] },
          { id: 33, num: "16", title: "筆記與匯出", body: "可在筆記區記錄調整方向，月底整合匯出 PDF 或 CSV 檔，也支援加購一對一診斷討論。", bullets: [] },
        ]},
      ],
      dataNote: "登入 Google 帳號後，系統會自動建立專屬試算表，所有輸入資料都會同步保存在你自己的雲端空間，僅你本人可見。",
      faqs: [
        { id: 1, q: "我的資料會被誰看到？", a: "不會被任何人看到。所有記帳資料都儲存在你登入後自動建立的個人 Google 試算表中，屬於你自己的雲端空間。" },
        { id: 2, q: "公費制和家庭制有什麼不同？", a: "公費制是每人提撥固定金額到共同帳戶用於共同支出；家庭制則是兩人薪水完全合併使用。記帳時可選擇歸屬為個人、公費或家庭。" },
        { id: 3, q: "系統推薦的預算比例可以自己調整嗎？", a: "可以。系統先給出建議比例，你可以自由分配每一項預算，並看到「實際分配」與「系統建議」的對比，幫助你調整。" },
        { id: 4, q: "信用卡的「預留金額」是什麼意思？", a: "指當期信用卡刷卡金額，系統提醒你預留這筆現金，避免月底現金花光又用下個月薪水繳帳單，形成惡性循環。" },
        { id: 5, q: "月底診斷會告訴我什麼？", a: "分析固定/變動支出比例、儲蓄達標狀況、各類別支出占比、情緒消費頻率，並抓出未列入預算的支出，給出下個月具體調整建議。" },
        { id: 6, q: "可以匯出資料嗎？", a: "可以。月底可匯出整合診斷、筆記、消費情形的 PDF，或匯出記帳明細 CSV 檔。" },
        { id: 7, q: "想要更深入的調整建議怎麼辦？", a: "可加購 88La 一對一診斷討論服務。" },
        { id: 8, q: "幫別人代墊刷卡，對方還現金，該怎麼記？", a: "一樣用信用卡記錄這筆消費，因為會跟著你的帳期出帳，金額比較準確。對方還你現金時，等於你已經把這筆卡費預留起來了。建議在備註欄寫上「代墊」方便辨識。" },
      ],
    },
  },
  contactContent: {
    intro: "如果你是品牌方、媒體、或想和 88La 合作，歡迎透過以下方式聯絡。我通常會在 3 個工作天內回覆。",
    label: "CONTACT", heading: "合作洽談", sub: "品牌合作、課程邀請、媒體採訪，歡迎來信",
    nameLabel: "姓名 / 稱呼 *", companyLabel: "公司 / 品牌（選填）", emailLabel: "Email *",
    typeLabel: "合作類型", typePlaceholder: "請選擇", typeOptions: "品牌贊助\n內容合作\n講座/課程\n媒體採訪\n其他",
    messageLabel: "合作說明 *", messagePlaceholder: "請簡單描述合作方向⋯", submitBtn: "送出合作申請",
    successTitle: "已開啟郵件程式", successSub: "請確認內容後，再按下寄送。"
  },
  savingsBagQuiz: {
    showSeasonal: false,
    products: {
      daily_budget:     { icon: "📅", name: "每日預算記錄組",          scene: "如果你常常月底才發現錢不夠用 → 這個讓你每天出門前就知道今天的上限，不用等到月底才後悔。",                                                           howto: ["決定你的每日經常性預算，例如餐費上限 $200","出門前從錢包數好 $200，帶著這筆錢出門","晚上回家翻開錢包：剩多少，就是今天的結餘，填進當天欄位","一週結束，把七天金額加總，就是這週的實際花費","第五週結束，翻看月卡，一個月的經常性支出一目瞭然"], url: "https://myship.7-11.com.tw/general/detail/GM2510287339100", img: "" },
      spending_tracker: { icon: "📊", name: "極簡收支分配表",          scene: "如果你有收入但總搞不清楚錢要怎麼分配 → 這個讓你在月初就把錢「分好位置」，每類支出都有自己的格子。",                                             howto: ["月初填入本月稅後收入","依序填入固定支出（房租、交通、訂閱費）","計算剩餘金額，分配給日常變動支出與儲蓄","每週確認各項目是否在預算內","月底對帳，超支的項目下個月調整分配比例"],                     url: "https://myship.7-11.com.tw/general/detail/GM2510287339100", img: "" },
      dream_fund:       { icon: "💭", name: "夢想變現儲蓄套組",        scene: "如果你有一個很想達成的目標但不知道要存多少 → 這個幫你把大夢想拆成每月可執行的小數字。",                                                          howto: ["填入目標名稱與目標金額（例：埃及旅遊 $100,000）","填入預計達成日期，計算距今幾個月","目標金額 ÷ 月數 = 每月需存金額，填入月目標欄","每月存錢後，填入實際儲蓄金額","月月對照目標與實際，沒達標的月份下個月補齊"],       url: "https://myship.7-11.com.tw/general/detail/GM2510287339100", img: "" },
      world_advance:    { icon: "🌍", name: "環遊世界存錢袋（進階版）", scene: "如果你想存旅遊基金但需要動力撐過漫長的存錢期 → 每張的國家風景設計讓你每次放錢都更期待那個目的地。",                                           howto: ["選一個你最想去的國家存錢袋開始","填入這趟旅遊的目標預算","計算每月需存金額，設定為每月固定轉入","每次放錢進去，在存錢袋上記錄累計金額","存滿當月目標，翻到下一格繼續累積"],                                  url: "https://myship.7-11.com.tw/general/detail/GM2510287339100", img: "" },
      world_challenge:  { icon: "✈️", name: "環遊世界挑戰卡",          scene: "如果你還沒確定去哪但就是想為旅遊存錢 → 封面機票讓你自己填入目的地與時間，隨時可以換目標。",                                                      howto: ["在封面機票填入你的夢想目的地與預計出發年月","估算旅遊預算並填入目標金額欄","回推每月需存金額","每月存入後在對應格子記錄","達成後換一張，繼續下一個旅遊目標"],                                          url: "https://myship.7-11.com.tw/general/detail/GM2510287339100", img: "" },
      game_challenge:   { icon: "🎮", name: "闖關打怪存錢袋",          scene: "如果你還沒有明確的存錢目標，但就是想先養成存錢習慣 → 把存錢變成打怪遊戲，完成關卡比想「為什麼存」更容易開始。",                                  howto: ["打開存錢袋，從第一關開始","每一關有對應的存錢金額，完成就算打倒這關的怪","存入金額後在關卡上打勾或蓋章","連續完成三關就解鎖下一個區域","全部關卡完成，就是你的第一桶存款"],                         url: "https://myship.7-11.com.tw/general/detail/GM2510287339100", img: "" },
      daily_allocation: { icon: "🏠", name: "日常分配項目存錢袋",      scene: "如果你每個月花錢的項目很多、很雜，難以掌握 → 這個把常見開銷分門別類，每類有自己的格子，不讓任何一項超支。",                                      howto: ["月初填入本月收入","逐一填入各項目的預算金額（房租、伙食、交通、雜支等）","實際花費時更新各項目的剩餘金額","某項目快花完時，你會自然知道需要節制","月底統計各項目，找出下個月要調整的地方"],       url: "https://myship.7-11.com.tw/general/detail/GM2510287339100", img: "" },
    },
    seasonal: {
      red_packet: { icon: "🧧", name: "紅包預存備戰卡",   scene: "如果你每年過年包紅包都讓荷包很痛 → 從現在開始每月預存一點，讓紅包錢提前就位，不再一次失血。", howto: ["選擇目標版本：存滿 $8,000 或 $16,000","計算距過年還有幾個月，推算每月需存金額","每月存入後在對應格子記錄","過年前取出，不再因為紅包而臨時缺錢"],      url: "https://myship.7-11.com.tw/general/detail/GM2510287339100", img: "" },
      christmas:  { icon: "🎄", name: "聖誕節限定存錢袋", scene: "如果你每次交換禮物都在最後一刻才煩惱預算 → 提早準備，讓聖誕禮物的錢有自己的位置。",                howto: ["決定今年聖誕禮物或交際的預算上限","計算距聖誕節還有幾個月，推算每月要存多少","每月存入後記錄進度","聖誕節前取出，從容準備禮物"],                                url: "https://myship.7-11.com.tw/general/detail/GM2510287339100", img: "" },
    },
  },
};

const OLD_KEYS = ["ed_art", "ed_prod", "ed_ig", "ed_goods", "ed_about", "ed_title", "ed_tags"];
OLD_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch { } });

async function fbGet(key) {
  const r = await fetch(`/api/site-content?key=${encodeURIComponent(key)}`);
  if (!r.ok) throw new Error(`site-content fetch failed (${r.status})`);
  const d = await r.json();
  return Object.prototype.hasOwnProperty.call(d, "value") ? d.value : null;
}
async function fbSet(key, value) {
  if (isLocalPreviewHost()) throw new Error("本機環境（localhost）禁止寫入正式 Firestore，請用 ?dev_admin=true 走本地預覽模式");
  await setDoc(doc(db, "site", key), { value });
}

function useFS(key, def) {
  const [v, setV] = useState(() => normalizeValueForKey(key, def));
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (isLocalAdminPreviewMode()) {
      try {
        const raw = localStorage.getItem(localPreviewStorageKey(key));
        if (raw !== null) setV(normalizeValueForKey(key, JSON.parse(raw)));
      } catch { }
      setLoaded(true);
      return;
    }
    fbGet(key)
      .then(val => { if (val !== null) setV(normalizeValueForKey(key, val)); })
      .catch(e => console.error(`fbGet(${key}) failed, 使用預設內容繼續顯示`, e))
      .finally(() => setLoaded(true));
  }, [key]);
  const set = async (fn, opts) => {
    const n = typeof fn === "function" ? fn(v) : fn;
    const prev = v;
    setV(n);
    if (isLocalAdminPreviewMode()) {
      try {
        localStorage.setItem(localPreviewStorageKey(key), JSON.stringify(n));
        if (!opts?.silent) _showToast("本地預覽已更新");
      } catch (e) {
        setV(prev);
        console.error("Local preview save failed", e);
        if (!opts?.silent) _showToast("本地預覽儲存失敗");
        throw e;
      }
      return;
    }
    try {
      await fbSet(key, n);
      if (!opts?.silent) _showToast("儲存成功");
    } catch (e) {
      setV(prev);
      console.error("Firestore save failed", e);
      if (!opts?.silent) _showToast("儲存失敗，請稍後再試");
      throw e;
    }
  };
  return [v, set, loaded];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isValidEmail = value => EMAIL_RE.test(String(value || "").trim()) && String(value || "").trim().length <= 254;
const fileToDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// 文章瀏覽數
// 舊做法是前端把整份 articles 陣列寫回 site/articles 來 +1，但那份文件只有管理員寫得進去，
// 訪客的計數一路都被 Firestore 規則擋掉。現在改成打 API 遞增獨立的計數文件。
// 顯示值 ＝ 文章上的舊 views 殘值 ＋ 修好之後實際累積的次數。
const _viewedThisSession = new Set();
function recordArticleView(article) {
  const slug = articleKey(article);
  if (!slug || _viewedThisSession.has(slug)) return;
  _viewedThisSession.add(slug);
  fetch("/api/article-view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  }).catch(() => { /* 計數失敗不影響閱讀，不要跳錯誤給讀者看 */ });
}

// 四個地方都要顯示瀏覽數，共用同一份結果，不要各自打一次 API
let _viewCounts = null;
let _viewCountsPromise = null;
function useArticleViewCounts() {
  const [counts, setCounts] = useState(_viewCounts || {});
  useEffect(() => {
    if (_viewCounts) return;
    if (!_viewCountsPromise) {
      _viewCountsPromise = fetch("/api/article-views")
        .then(r => (r.ok ? r.json() : { counts: {} }))
        .then(d => { _viewCounts = d.counts || {}; return _viewCounts; })
        .catch(() => ({}));
    }
    let alive = true;
    _viewCountsPromise.then(c => { if (alive) setCounts(c || {}); });
    return () => { alive = false; };
  }, []);
  return counts;
}

function publicArticle(article) {
  if (!article?.member) return article;
  return { ...article, content: "", locked: true };
}

async function adminToken() {
  const user = auth.currentUser;
  if (!user || !ADMIN_EMAILS.includes(user.email)) throw new Error("請先以管理員登入");
  return user.getIdToken();
}

async function uploadCloudinaryImage(file, onProgress) {
  if (isLocalAdminPreviewMode()) {
    if (onProgress) onProgress(100);
    return fileToDataUrl(file);
  }
  const token = await adminToken();
  const sigRes = await fetch("/api/cloudinary-signature", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!sigRes.ok) throw new Error("圖片上傳尚未設定完成，請檢查 Cloudinary 環境變數");
  const sig = await sigRes.json();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", sig.timestamp);
  fd.append("signature", sig.signature);
  if (sig.folder) fd.append("folder", sig.folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) resolve(data.secure_url);
        else reject(new Error(data.error?.message || "上傳失敗，請重試"));
      } catch (e) { reject(e); }
    };
    xhr.onerror = () => reject(new Error("上傳失敗，請重試"));
    xhr.send(fd);
  });
}

// 會員解鎖狀態存在 sessionStorage：輸入一次密碼，這次瀏覽期間所有會員文章都保持解鎖，
// 關掉瀏覽器就失效（不用 localStorage、不用長效 cookie）。密碼本身仍由後端 /api/member-article
// 驗證，前端沒有任何比對邏輯；這裡存密碼是因為每篇全文都要再跟後端換一次。
const MEMBER_SESSION_KEY = "88la_member_pwd";
const getMemberSessionPassword = () => { try { return sessionStorage.getItem(MEMBER_SESSION_KEY) || ""; } catch { return ""; } };
const setMemberSessionPassword = pwd => { try { sessionStorage.setItem(MEMBER_SESSION_KEY, pwd); } catch { } };
const clearMemberSessionPassword = () => { try { sessionStorage.removeItem(MEMBER_SESSION_KEY); } catch { } };

async function fetchMemberArticleContent(articleId, password = "") {
  if (isLocalAdminPreviewMode()) {
    return localStorage.getItem(localPreviewStorageKey(`memberArticle_${articleId}`)) || "";
  }
  const headers = { "Content-Type": "application/json" };
  if (!password) {
    try { headers.Authorization = `Bearer ${await adminToken()}`; } catch { }
  }
  const r = await fetch("/api/member-article", {
    method: "POST",
    headers,
    body: JSON.stringify({ articleId, password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "read_failed");
  return data.content || "";
}

async function saveMemberArticleContent(articleId, content) {
  if (isLocalAdminPreviewMode()) {
    localStorage.setItem(localPreviewStorageKey(`memberArticle_${articleId}`), content || "");
    return;
  }
  const token = await adminToken();
  const r = await fetch("/api/member-article-save", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ articleId, content }),
  });
  if (!r.ok) throw new Error("會員文章儲存失敗");
}

async function setMemberArticlePassword(password) {
  if (isLocalAdminPreviewMode()) {
    localStorage.setItem(localPreviewStorageKey("memberPassword"), password || "");
    return;
  }
  const token = await adminToken();
  const r = await fetch("/api/member-password-set", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "密碼儲存失敗");
}

async function migrateMemberArticles() {
  if (isLocalAdminPreviewMode()) return { migrated: 0 };
  const token = await adminToken();
  const r = await fetch("/api/member-articles-migrate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("會員文章遷移失敗");
  return r.json();
}

let _showToast = () => {};
// 上線前訂閱金額一律屏蔽，9/10 之後自動顯示原值（判斷同 appCtaProps）。
// 只蓋 88La財務導航的訂閱價，存錢袋與模板 2.0 已經在賣，價格照常顯示。
function Price({ children }) {
  if (isAppLaunched()) return <>{children}</>;
  return <span className="nx-price-blur" aria-label="價格 9/10 公布">{children}</span>;
}

// 每個有價格的區塊只標一次，不要每個數字都掛一個標籤
function PriceNote({ style }) {
  if (isAppLaunched()) return null;
  return <p className="nx-price-note" style={style}>完整方案與價格 9/10 公布</p>;
}

function Toast() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const [tone, setTone] = useState("success");
  const t = useRef();
  _showToast = (m, nextTone = "success") => {
    setMsg(m);
    setTone(nextTone);
    setShow(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setShow(false), nextTone === "notice" ? 4200 : 2800);
  };
  if (!show) return null;
  // notice 是上線提示這類「按了但不會發生事情」的回饋，要夠明顯，
  // 否則使用者會以為按鈕壞掉（Barbara 2026-09-01 回報）
  const isNotice = tone === "notice";
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="nx-toast" style={{
      position: "fixed", bottom: isNotice ? "50%" : 80, left: "50%",
      transform: isNotice ? "translate(-50%,50%)" : "translateX(-50%)",
      background: isNotice ? "#494949" : CHAR, color: "#FCFAF6",
      padding: isNotice ? "18px 28px" : "12px 28px",
      borderRadius: isNotice ? 16 : 8,
      fontSize: isNotice ? 16 : 13, fontWeight: isNotice ? 600 : 400,
      lineHeight: 1.7, textAlign: "center", maxWidth: "min(88vw, 420px)",
      zIndex: 80, boxShadow: "0 18px 44px -12px rgba(46,42,33,.5)",
      letterSpacing: isNotice ? 0 : ".5px", pointerEvents: "none",
    }}>
      {tone === "success" ? "✓ " : ""}{msg}
    </div>
  );
}

function isValidUrl(s) {
  if (!s || !s.trim()) return true;
  try { const u = new URL(s.trim()); return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:"; } catch { return false; }
}

function linkify(text) {
  if (!text) return text;
  const parts = text.split(/(https?:\/\/[^\s,，。）)]+|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: O, textDecoration: "underline" }}>{part}</a>;
    if (/@/.test(part) && /\.[a-zA-Z]{2,}$/.test(part)) return <a key={i} href={`mailto:${part}`} style={{ color: O, textDecoration: "underline" }}>{part}</a>;
    return part;
  });
}

function toSlug(str) {
  return str.trim().replace(/\s+/g, "-").replace(/[^\w一-鿿-]/g, "").slice(0, 80) || String(Date.now());
}

function stripHtml(s) {
  return (s || "").replace(/<[^>]*>/g, "");
}

function exportArticlesCSV(articles, counts) {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
  const header = ["id", "日期", "分類標籤", "標題", "摘要", "瀏覽數", "會員限定"];
  // 瀏覽數要跟畫面上顯示的同一個口徑，不然匯出的報表跟後台看到的對不起來
  const rows = (articles || []).map(a => [a.id, a.date, a.tag, a.title, stripHtml(a.excerpt), viewCount(a, counts), a.member ? "Y" : "N"]);
  const csv = "﻿" + [header, ...rows].map(r => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `88La文章清單_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Reveal({ children, delay = 0 }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVis(true); return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVis(true); obs.unobserve(el); }
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(24px)", transition: `opacity .6s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .6s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>{children}</div>;
}

function CountUp({ end, duration = 1000 }) {
  const ref = useRef();
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || done.current) return;
    const n = typeof end === "number" ? end : parseInt(String(end).replace(/[^\d]/g, ""), 10) || 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVal(n); done.current = true; return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !done.current) {
        done.current = true;
        if (n === 0) { setVal(0); obs.unobserve(el); return; }
        const t0 = performance.now();
        const frame = (now) => {
          const p = Math.min((now - t0) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(ease * n));
          if (p < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
        obs.unobserve(el);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val}</span>;
}

function moveItem(arr, idx, dir) {
  const a = [...arr]; const to = idx + dir;
  if (to < 0 || to >= a.length) return a;
  [a[idx], a[to]] = [a[to], a[idx]]; return a;
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function OrdBtns({ idx, total, onMove, style = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, ...style }}>
      <button className="ordbtn" onClick={e => { e.stopPropagation(); onMove(idx, -1); }} disabled={idx === 0}>▲</button>
      <button className="ordbtn" onClick={e => { e.stopPropagation(); onMove(idx, 1); }} disabled={idx === total - 1}>▼</button>
    </div>
  );
}

//  Crop Modal
function CropModal({ src, aspect = "16/9", onConfirm, onCancel }) {
  const [aW, aH] = aspect.split("/").map(Number);
  const CROPW = 360, CROPH = Math.round(CROPW * aH / aW);
  const imgRef = useRef();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(0.5);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [cropError, setCropError] = useState("");

  const clamp = (p, s) => {
    if (!imgRef.current) return p;
    const iW = imgRef.current.naturalWidth * s, iH = imgRef.current.naturalHeight * s;
    return { x: Math.min(0, Math.max(CROPW - iW, p.x)), y: Math.min(0, Math.max(CROPH - iH, p.y)) };
  };

  const onImgLoad = () => {
    const img = imgRef.current; if (!img) return;
    const s = Math.max(CROPW / img.naturalWidth, CROPH / img.naturalHeight);
    setScale(s); setMinScale(s);
    setPos({ x: (CROPW - img.naturalWidth * s) / 2, y: (CROPH - img.naturalHeight * s) / 2 });
  };

  const onDown = (x, y) => { setDragging(true); setStart({ x: x - pos.x, y: y - pos.y }); };
  const onMove = (x, y) => { if (!dragging) return; setPos(clamp({ x: x - start.x, y: y - start.y }, scale)); };
  const onUp = () => setDragging(false);
  const onZoom = (s) => { setScale(s); setPos(p => clamp(p, s)); };

  const confirm = async () => {
    const img = imgRef.current; if (!img) return;
    setUploading(true); setCropError("");
    try {
      const OUT = 1200, OUTH = Math.round(OUT * aH / aW);
      const canvas = document.createElement("canvas");
      canvas.width = OUT; canvas.height = OUTH;
      canvas.getContext("2d").drawImage(img, -pos.x / scale, -pos.y / scale, CROPW / scale, CROPH / scale, 0, 0, OUT, OUTH);
      await new Promise((res, rej) => canvas.toBlob(async blob => {
        try {
          const url = await uploadCloudinaryImage(blob);
          onConfirm(url); res();
        } catch (e) { rej(e); }
      }, "image/jpeg", 0.92));
    } catch (e) { setCropError(e?.message || "裁剪失敗（圖片可能不支援跨來源），請用上傳的圖片再試"); }
    setUploading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: WHITE, borderRadius: 12, padding: 24, width: Math.min(CROPW + 48, 420) }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: CHAR, marginBottom: 4 }}>裁剪 / 調整位置</p>
        <p style={{ fontSize: 12, color: MID, marginBottom: 14 }}>拖曳移動 · 下方滑桿縮放</p>
        <div style={{ width: CROPW, height: CROPH, overflow: "hidden", cursor: dragging ? "grabbing" : "grab", position: "relative", background: "#111", borderRadius: 4, touchAction: "none", outline: `2px solid ${O}` }}
          onMouseDown={e => onDown(e.clientX, e.clientY)} onMouseMove={e => onMove(e.clientX, e.clientY)} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={e => onDown(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }} onTouchEnd={onUp}>
          <img ref={imgRef} src={src} alt="" crossOrigin="anonymous" draggable={false} onLoad={onImgLoad}
            style={{ position: "absolute", transformOrigin: "0 0", transform: `translate(${pos.x}px,${pos.y}px) scale(${scale})`, userSelect: "none", maxWidth: "none" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <span style={{ fontSize: 12, color: MID, flexShrink: 0 }}>縮放</span>
          <input type="range" min={minScale} max={minScale * 4} step={minScale * 0.005} value={scale}
            onChange={e => onZoom(parseFloat(e.target.value))} style={{ flex: 1, width: "auto" }} />
        </div>
        {cropError && <p style={{ fontSize: 12, color: "#C0392B", marginTop: 8 }}>{cropError}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
          <button className="pg" onClick={onCancel}>取消</button>
          <button className="pb" onClick={confirm} disabled={uploading}>{uploading ? "上傳中..." : "確認裁剪"}</button>
        </div>
      </div>
    </div>
  );
}

//  Image Uploader
function ImgUploader({ value, onChange, label = "圖片", aspect = "16/9", maxHeight = 200, boxMaxWidth }) {
  const inputRef = useRef();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [showCrop, setShowCrop] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("請選擇圖片檔案"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("檔案不能超過 5MB"); return; }
    setError("");
    try {
      setProgress(0);
      const url = await uploadCloudinaryImage(file, setProgress);
      onChange(url);
    } catch (e) {
      setError(e?.message || "上傳失敗，請重試");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{label}</p>
      <div style={{ aspectRatio: aspect, background: GRAY, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, maxHeight, maxWidth: boxMaxWidth }}>
        {value
          ? <img src={value} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 12, color: LIGHT }}>尚無圖片</span>}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="pg" onClick={() => inputRef.current.click()} style={{ fontSize: 13, padding: "8px 16px" }} disabled={progress !== null}>
          {progress !== null ? `上傳中 ${progress}%` : "選擇圖片"}
        </button>
        {value && <button type="button" className="pg" onClick={() => setShowCrop(true)} style={{ fontSize: 13, padding: "8px 16px" }}>裁剪</button>}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => upload(e.target.files[0])} />
        <input placeholder="或貼上圖片網址" value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1, minWidth: 0, fontSize: 13 }} />
      </div>
      {error && <p style={{ fontSize: 12, color: "#C0392B", marginTop: 6 }}>{error}</p>}
      {showCrop && <CropModal src={value} aspect={aspect} onConfirm={url => { onChange(url); setShowCrop(false); }} onCancel={() => setShowCrop(false)} />}
    </div>
  );
}

//  Rich Text Editor
function RichEditor({ value, onChange }) {
  const ref = useRef();
  const init = useRef(false);
  useEffect(() => {
    if (!init.current && ref.current) {
      document.execCommand("defaultParagraphSeparator", false, "p");
      const html = /<[a-z][\s\S]*>/i.test(value || "") ? (value || "") : (value || "").replace(/\n/g, "<br>");
      ref.current.innerHTML = html;
      init.current = true;
    }
  }, []);
  const exec = (cmd, val = null) => { ref.current.focus(); document.execCommand(cmd, false, val); };
  const insertLink = () => { const url = prompt("輸入連結 URL："); if (url) exec("createLink", url); };
  const btn = { padding: "4px 9px", fontSize: 13, background: WHITE, border: `1px solid ${BORDER}`, cursor: "pointer", fontFamily: "inherit", borderRadius: 4, lineHeight: 1.4 };
  const COLORS = ["#1A1A1A", "#C85A14", "#E8806E", "#6B6B6B", "#2563EB", "#DC2626", "#16A34A", "#9333EA"];
  return (
    <div style={{ border: "1px solid #D0D5DA", position: "relative" }}>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "8px 10px", background: "#F5F5F5", borderBottom: "1px solid #D0D5DA", position: "sticky", top: 60, zIndex: 30 }}>
        <button type="button" style={{ ...btn, fontWeight: 700 }} onMouseDown={e => { e.preventDefault(); exec("bold"); }}>B</button>
        <button type="button" style={{ ...btn, fontStyle: "italic" }} onMouseDown={e => { e.preventDefault(); exec("italic"); }}>I</button>
        <button type="button" style={{ ...btn, textDecoration: "underline" }} onMouseDown={e => { e.preventDefault(); exec("underline"); }}>U</button>
        <span style={{ width: 1, background: "#D0D5DA", margin: "0 4px", display: "inline-block" }} />
        <button type="button" style={btn} onMouseDown={e => { e.preventDefault(); exec("formatBlock", "h2"); }}>H2</button>
        <button type="button" style={btn} onMouseDown={e => { e.preventDefault(); exec("formatBlock", "h3"); }}>H3</button>
        <button type="button" style={btn} onMouseDown={e => { e.preventDefault(); exec("formatBlock", "p"); }}>¶</button>
        <span style={{ width: 1, background: "#D0D5DA", margin: "0 4px", display: "inline-block" }} />
        <button type="button" style={btn} onMouseDown={e => { e.preventDefault(); exec("insertUnorderedList"); }}>• 列表</button>
        <button type="button" style={btn} onMouseDown={e => { e.preventDefault(); exec("insertOrderedList"); }}>1. 編號</button>
        <button type="button" style={btn} onMouseDown={e => { e.preventDefault(); insertLink(); }}>🔗</button>
        <span style={{ width: 1, background: "#D0D5DA", margin: "0 4px", display: "inline-block" }} />
        {[["小","2"],["正常","3"],["大","5"]].map(([l,s]) => (
          <button key={s} type="button" style={btn} onMouseDown={e => { e.preventDefault(); exec("fontSize", s); }}>{l}</button>
        ))}
        <span style={{ width: 1, background: "#D0D5DA", margin: "0 4px", display: "inline-block" }} />
        {COLORS.map(c => (
          <button key={c} type="button" style={{ width: 22, height: 22, background: c, border: "2px solid rgba(0,0,0,.15)", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
            title={c} onMouseDown={e => { e.preventDefault(); exec("foreColor", c); }} />
        ))}
      </div>
      <div ref={ref} className="rich-ed" contentEditable suppressContentEditableWarning
        onInput={() => onChange(ref.current.innerHTML)}
        onKeyDown={e => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); document.execCommand("insertParagraph"); }
          else if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); document.execCommand("insertLineBreak"); }
        }}
        style={{ minHeight: 360, padding: "16px", outline: "none", fontSize: 16, lineHeight: 1.8, color: CHAR }} />
    </div>
  );
}


const APP_PRODUCT_NAME = "88La財務導航";
// 2026-09 改版導覽列順序（logo 就是首頁入口，所以 home 不進選單）
const NAV_KEYS = ["app","resources","envelope","journal","about","guide"];
const PRODUCT_NAME_PATTERNS = [
  "88La 理財自動導航器",
  "88La理財自動導航器",
  "88La 理財導航器",
  "88La理財導航器",
];
// 沒有 88La 前綴的裸名（例如 /app 頁的主標就是「理財自動導航器」），
// 但「理財自動導航器 2.0」是 Google Sheets 模板，跟 Web App 是兩個產品，必須排除
const BARE_APP_NAME = /理財自動導航器(?!\s*2\.0)/g;
const normalizeProductText = value => {
  if (typeof value !== "string") return value;
  return PRODUCT_NAME_PATTERNS.reduce((text, pattern) => text.split(pattern).join(APP_PRODUCT_NAME), value)
    .replace(BARE_APP_NAME, APP_PRODUCT_NAME)
    .replaceAll("省下約 35%", `省下約 ${APP_YEARLY_DISCOUNT}%`)
    .replaceAll("相當於 NT$83/月", `相當於 NT$${APP_YEARLY_MONTHLY_EQUIVALENT}/月`)
    .replaceAll("everydollars17@gmail.com", PUBLIC_CONTACT_EMAIL);
};
// Firestore 裡存的是 Barbara 在後台編輯過的文字，可能還留著 App 的舊名。
// 那些字改不到（只能在後台一頁一頁改），所以改成讀取時就換掉，畫面上永遠是新名。
// 只比對帶「88La」前綴的舊名，所以模板產品「理財自動導航器 2.0」不會被誤改，
// 它跟 Web App 是兩個不同的產品。
const normalizeStoredContent = value => {
  if (typeof value === "string") return normalizeProductText(value);
  if (Array.isArray(value)) return value.map(normalizeStoredContent);
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    for (const k of Object.keys(value)) out[k] = normalizeStoredContent(value[k]);
    return out;
  }
  return value;
};
const normalizePrivacyContent = value => {
  const normalized = normalizeStoredContent(value);
  if (!normalized || typeof normalized !== "object") return normalized;
  const oldAnalytics = "<p><strong>【瀏覽網站時（自動蒐集）】</strong><br>本服務官網使用 Vercel Web Analytics 統計流量，此工具不使用第三方 cookie，而是以傳入請求產生的雜湊值識別訪客，所記錄之資料皆為匿名性質，不會與任何個人、客戶或 IP 位址綁定或關聯，相關瀏覽紀錄亦不會永久保存，將於 24 小時後自動清除。我們僅藉此瞭解整體網站使用狀況（如頁面瀏覽量），不會用來識別您的個人身分。</p>";
  const newAnalytics = "<p><strong>【瀏覽網站時（自動蒐集）】</strong><br>本服務官網使用 Google Analytics 4 與 Vercel Web Analytics 統計流量及頁面互動，可能處理頁面網址、瀏覽器、裝置類型、流量來源與互動事件等技術資訊。相關資料由 Google 與 Vercel 依各自的隱私政策處理。88La 僅用於了解整體網站使用狀況，不會與 88La財務導航內的記帳內容合併分析。</p>";
  const newsletterDisclosure = `<p><strong>【訂閱電子報時】</strong><br>本服務會蒐集您主動提供的電子郵件位址，用於寄送 88La 電子報。電子報透過 Resend 寄送，每封信均提供退訂方式，退訂後不再寄送行銷電子郵件。</p>`;
  const analyticsStorageRow = '<tr style="border-bottom:1px solid rgba(0,0,0,0.07);"><td style="padding:12px 14px;vertical-align:top;">匿名瀏覽統計</td><td style="padding:12px 14px;vertical-align:top;">Vercel Web Analytics</td><td style="padding:12px 14px;vertical-align:top;">不可識別個人身分，24 小時後自動清除</td></tr>';
  const updatedAnalyticsStorageRow = '<tr style="border-bottom:1px solid rgba(0,0,0,0.07);"><td style="padding:12px 14px;vertical-align:top;">網站流量與互動資料</td><td style="padding:12px 14px;vertical-align:top;">Google Analytics 4、Vercel Web Analytics</td><td style="padding:12px 14px;vertical-align:top;">用於了解整體網站使用狀況，不與記帳內容合併分析</td></tr>';
  const newsletterStorageRow = '<tr style="border-bottom:1px solid rgba(0,0,0,0.07);"><td style="padding:12px 14px;vertical-align:top;">電子報訂閱 Email 與狀態</td><td style="padding:12px 14px;vertical-align:top;">Firebase、Resend</td><td style="padding:12px 14px;vertical-align:top;">用於寄送電子報及處理退訂</td></tr>';
  let body = String(normalized.body || "")
    .replace(oldAnalytics, newAnalytics)
    .replace(analyticsStorageRow, updatedAnalyticsStorageRow)
    .replace("<li>透過匿名流量統計瞭解網站整體使用狀況，藉以優化服務內容</li>", "<li>透過流量統計瞭解網站整體使用狀況，藉以優化服務內容</li><li>依您的訂閱選擇寄送電子報，並處理退訂需求</li>");
  if (!body.includes("【訂閱電子報時】")) {
    body = body.replace("<h2>三、未成年使用者</h2>", `${newsletterDisclosure}<h2>三、未成年使用者</h2>`);
  }
  if (!body.includes("電子報訂閱 Email 與狀態")) {
    body = body.replace("</tbody></table>", `${newsletterStorageRow}</tbody></table>`);
  }
  return { ...normalized, lastUpdated: "最後更新：2026 年 8 月", body };
};
const normalizeValueForKey = (key, value) => key === "privacyContent"
  ? normalizePrivacyContent(value)
  : normalizeStoredContent(value);
// demoStory 的三段內容講的是 88la-finance 示範帳戶的實際數字。2026-08-28
// 已改成先呈現整月結果，再呈現最值得處理的局部主因，週期性保險也改為每月預存。
//
// 這些字存在 Firestore，改程式碼的預設值對線上沒有效果，所以在讀取時逐欄
// 比對：只有當存的還是那份對不上的舊文案（用它獨有的句子辨識）才換成新的。
// 認舊句子而不是「跟預設值不同就換」，Barbara 之後自己改寫過的版本才不會被蓋掉；
// 她下次在後台儲存時，新文案就會寫回 Firestore，這段判斷之後自然失效。
// 2026-08-22 追加 note 與 lockNote：示範改成 public/app-demo/ 的靜態頁後，
// 畫面上不再有任何鎖點，「登入後查看」與「跟實際 App 一樣的流程」兩句都對不上了。
const STALE_DEMO_STORY_MARKERS = {
  personaFacts: ["NT$150,000 頭期款基金", "日常消費卡"],
  findings: ["高出 62%", "出現負值缺口", "比預算高出 82%", "照這個速度緊急備用金要多花 5 個月"],
  suggestions: ["網購類別預算下修", "聚餐類別出現 3 次", "先存後花", "出門前先想好當天的額度", "保險預算 NT$1,200 對不上實際的 NT$4,800", "下次先存一筆備用金"],
  note: ["跟實際 App 一樣的流程"],
  lockNote: ["登入後查看", "🔒"],
};
const normalizeDemoStory = story => {
  const next = { ...DEFAULTS.demoStory, ...(story || {}) };
  for (const [field, markers] of Object.entries(STALE_DEMO_STORY_MARKERS)) {
    const stored = next[field];
    if (typeof stored === "string" && markers.some(marker => stored.includes(marker))) {
      next[field] = DEFAULTS.demoStory[field];
    }
  }
  return next;
};
const normalizeResourceUrl = value => {
  if (typeof value !== "string") return value;
  return value.replace(/(\/resources\/[^/?#]+)\/(?=([?#].*)?$)/, "$1/index.html");
};
const normalizeNavLabels = labels => {
  const next = { ...DEFAULTS.navLabels, ...(labels || {}) };
  if (["首頁", "開始這裡"].includes(next.home)) next.home = "找到起點";
  // 2026-09 改版：導覽列改用短標籤，把 Firestore 裡的舊長標籤換掉，避免選單被撐爆
  if (["導航器", "理財導航器", "理財自動導航器", "88La財務導航", "88La理財自動導航器", "財務導航 Web App", "財務導航 App", APP_PRODUCT_NAME].includes(next.app)) next.app = "財務導航";
  if (["存錢袋", "實體理財工具"].includes(next.envelope)) next.envelope = "實體工具";
  if (["免費資源", "資源中心"].includes(next.resources)) next.resources = "免費工具";
  if (["關於 88La", "關於我們"].includes(next.about)) next.about = "關於";
  return next;
};
const normalizeFooterLabels = labels => {
  const next = { ...DEFAULTS.footerLabels, ...(labels || {}) };
  if (["理財導航器", "理財自動導航器"].includes(next.fApp)) next.fApp = APP_PRODUCT_NAME;
  if (next.fEnvelope === "存錢袋") next.fEnvelope = "實體理財工具";
  return next;
};
const appPlanDefaults = {
  monthly: { id: 1, name: "月訂閱", price: APP_MONTHLY_PRICE, period: "/月", highlight: false, badge: "", features: ["88La財務導航完整功能", "桌面快速記帳", "隨時可取消"] },
  yearly: { id: 2, name: "年方案", price: APP_YEARLY_PRICE, period: "/年", highlight: true, badge: "最多人選擇", features: ["88La財務導航完整功能", "桌面快速記帳", `省下約 ${APP_YEARLY_DISCOUNT}%`, `相當於 NT$${APP_YEARLY_MONTHLY_EQUIVALENT}/月`] },
};
const planKind = plan => {
  const id = String(plan?.id || "").toLowerCase();
  const name = String(plan?.name || "").toLowerCase();
  if (id === "2year" || name.includes("兩") || name.includes("二年") || name.includes("2 年") || name.includes("2年")) return "twoYear";
  if (id === "1year" || name.includes("年") || name.includes("1 年") || name.includes("1年")) return "yearly";
  if (id === "monthly" || name.includes("月")) return "monthly";
  if (plan?.id === 3) return "twoYear";
  if (plan?.id === 2) return "yearly";
  return "monthly";
};
const normalizePlan = plan => {
  const defaults = appPlanDefaults[planKind(plan)];
  return {
    ...plan,
    id: defaults.id,
    name: defaults.name,
    price: defaults.price,
    period: defaults.period,
    highlight: defaults.highlight,
    badge: plan?.badge || defaults.badge,
    features: defaults.features,
    detailTitle: normalizeProductText(plan?.detailTitle || ""),
    detailContent: normalizeProductText(plan?.detailContent || ""),
  };
};
const normalizePlans = plans => {
  const byKind = {};
  (plans || []).forEach(plan => {
    const kind = planKind(plan);
    if (!byKind[kind]) byKind[kind] = plan;
  });
  return ["monthly", "yearly"].map(kind => normalizePlan(byKind[kind] || appPlanDefaults[kind]));
};
const normalizeAppContent = raw => {
  const content = { ...DEFAULTS.appContent, ...(raw || {}) };
  const textKeys = [
    "heroTitle", "heroHighlight", "heroSub", "pricingNote", "comingSoonTitle", "comingSoonSub",
    "heroEyebrow", "heroCtaBtn", "featuresLabel", "featuresHeading", "pricingLabel", "pricingHeading",
    "loginNote", "loginLink", "planDetailBackBtn", "planDetailLabel", "planDetailFeaturesLabel",
    "planDetailBuyBtn", "planLearnMoreBtn", "faqLabel", "faqHeading", "faqCountNote", "faqGuideBtn", "guideTitle",
  ];
  const next = { ...content };
  textKeys.forEach(key => { next[key] = normalizeProductText(next[key]); });
  if ((next.comingSoonSub || "").includes("7 月下旬")) {
    next.comingSoonTitle = "目前開放第二批內測";
    next.comingSoonSub = "正式開放時間另行公告，功能介紹可以先查看。";
  }
  next.plans = normalizePlans(content.plans || DEFAULTS.appContent.plans);
  return next;
};
const normalizeLegalContent = content => Object.fromEntries(
  Object.entries(content || {}).map(([key, value]) => {
    const normalized = normalizeProductText(value);
    if (typeof normalized !== "string" || !normalized.includes("Vercel Web Analytics")) return [key, normalized];
    return [key, normalized
      .replace(
        /本服務官網使用 Vercel Web Analytics[\s\S]*?不會用來識別您的個人身分。/,
        "本服務官網使用 Google Analytics 4 統計頁面瀏覽與互動事件，可能包含裝置類型、瀏覽器、概略地區與匿名識別資料，用於了解整體使用狀況並改善內容與流程。我們不會在分析事件中主動傳送您的記帳明細、付款資訊或本測驗答案。Google 將依其隱私政策處理相關資料。"
      )
      .replaceAll("Vercel Web Analytics", "Google Analytics 4")
      .replace("不可識別個人身分，24 小時後自動清除", "用於統計網站整體使用狀況，保存方式依 Google 隱私政策辦理")];
  })
);
const normalizeTermsContent = content => {
  const next = normalizeLegalContent(content);
  if (typeof next.body !== "string") return next;
  next.body = next.body
    .replace(/<li>兩年方案：NT\$[^<]+<\/li>/g, "")
    .replace(/月訂閱：NT\$[\d,]+ \/ 月/g, `月訂閱：${APP_MONTHLY_PRICE} / 月`)
    .replace(/年方案：NT\$[\d,]+ \/ 年/g, `年方案：${APP_YEARLY_PRICE} / 年`)
    .replace(
      "所有金額均為新台幣計價。付款由綠界科技股份有限公司代為處理，採信用卡定期定額方式進行。",
      "所有金額均為新台幣計價。付款由綠界科技股份有限公司代為處理，月訂閱採信用卡定期定額，年方案採單筆付款。"
    )
    .replace(
      "<h2>三、自動續約</h2><p>訂閱方案將於到期日自動續約，並依原方案金額扣款。如不希望續約，請於訂閱到期日前至帳戶設定頁面取消。取消後，服務仍可使用至當期訂閱到期日為止。</p>",
      "<h2>三、續約方式</h2><p>月訂閱將依原方案金額定期扣款，如不希望續約，請於下次扣款日前至帳戶設定頁面取消。年方案不會自動續約，到期前將另行提醒。方案到期前仍可使用當期服務。</p>"
    );
  return next;
};
const normalizeSubscriptionCopy = raw => {
  const copy = { ...DEFAULTS.subscriptionCopy, ...(raw || {}) };
  return {
    ...copy,
    heading: normalizeProductText(copy.heading),
    intro: normalizeProductText(copy.intro),
    notes: normalizeProductText(copy.notes)
      .replace("訂閱將於到期日自動續約，可於到期前至帳戶設定取消\n付款方式：信用卡定期定額（由綠界科技處理）", "月訂閱採信用卡定期定額，可於下次扣款日前取消\n年方案採單筆付款，不會自動續約"),
  };
};




//  Nav
function Nav({ page, setPage, isAdmin, navLabels, setNavLabels }) {
  const nl = normalizeNavLabels(navLabels);
  const [showL, setShowL] = useState(false);
  const [mob, setMob] = useState(false);
  const [logging, setLogging] = useState(false);
  const [err, setErr] = useState("");
  const [editingNav, setEditingNav] = useState(false);
  const [tmpNav, setTmpNav] = useState(nl);
  const login = async () => {
    if (logging) return;
    setLogging(true); setErr("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!ADMIN_EMAILS.includes(result.user.email)) {
        await signOut(auth);
        setErr("此帳號沒有管理員權限");
      } else {
        setShowL(false);
      }
    } catch (e) {
      if (e?.code === "auth/unauthorized-domain") setErr("此網域未授權，請到 Firebase Console 新增");
      else if (e?.code === "auth/popup-blocked") setErr("彈出視窗被阻擋，請允許後重試");
      else if (e?.code === "auth/popup-closed-by-user") setErr("登入視窗已關閉，請重試");
      else setErr("登入失敗：" + (e?.code || "未知錯誤"));
    }
    setLogging(false);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      setShowL(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);
  const go = p => { setPage(p); setMob(false); };
  return (
    <>
      <style>{css}</style>
      <header className="nx-nav">
        <div className="nx-nav-in">
          <div className="nx-nav-left">
            <button className="nx-logo" onClick={() => go("home")} aria-label="回到首頁">88<i>La</i></button>
            <nav className="nx-nav-links" aria-label="主選單">
              {NAV_KEYS.map(k => (
                <button key={k} className={"nx-nav-link" + (page === k ? " is-current" : "")} aria-current={page === k ? "page" : undefined} onClick={() => go(k)}>{nl[k]}</button>
              ))}
            </nav>
          </div>
          <div className="nx-nav-right">
            {isAdmin ? (
              <div className="nx-nav-admin">
                <button onClick={() => go("write")}>＋ 撰文</button>
                <button onClick={() => go("savings-quiz")}>存錢袋測驗</button>
                <button onClick={() => { setTmpNav(nl); setEditingNav(true); }}>編輯選單文字</button>
                <button onClick={() => signOut(auth)}>登出後台</button>
              </div>
            ) : (
              <a className="nx-nav-text" href={APP_URL}>登入</a>
            )}
            <a className="nx-btn nx-btn-pri nx-btn-sm" {...appCtaProps("nav")}>開始使用</a>
          </div>
          <button className="nx-burger" onClick={() => setMob(p => !p)} aria-label={mob ? "關閉選單" : "開啟選單"} aria-expanded={mob}>
            {mob ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
            )}
          </button>
        </div>
        {mob && (
          <div className="nx-mob-panel">
            {NAV_KEYS.map(k => (
              <button key={k} className={"nx-mob-link" + (page === k ? " is-current" : "")} onClick={() => go(k)}>{nl[k]}</button>
            ))}
            {isAdmin && <>
              <button className="nx-mob-link" onClick={() => go("write")}>＋ 撰文</button>
              <button className="nx-mob-link" onClick={() => go("savings-quiz")}>存錢袋測驗</button>
              <button className="nx-mob-link" onClick={() => { signOut(auth); setMob(false); }}>登出後台</button>
            </>}
            <div className="nx-mob-foot">
              {!isAdmin && <a className="nx-btn nx-btn-sec nx-btn-sm" href={APP_URL}>登入</a>}
              <a className="nx-btn nx-btn-pri nx-btn-sm" {...appCtaProps("nav-mobile")}>開始使用</a>
            </div>
          </div>
        )}
      </header>
      {editingNav && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 61, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: WHITE, padding: 32, width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto" }}>
            <p style={{ fontSize: 13, letterSpacing: "2px", color: CORAL2, marginBottom: 20, fontWeight: 500 }}>編輯選單文字</p>
            <p style={{ fontSize: 12, color: MID, marginBottom: 10, fontWeight: 500 }}>頂部導覽列</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {NAV_KEYS.map(k => (
                <input key={k} value={tmpNav[k] ?? ""} onChange={e => setTmpNav(p => ({ ...p, [k]: e.target.value }))} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pb" onClick={() => { setNavLabels(tmpNav); setEditingNav(false); }}>儲存</button>
              <button className="pg" onClick={() => setEditingNav(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
      {showL && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
          <div style={{ background: WHITE, padding: 40, width: "100%", maxWidth: 360 }}>
            <p style={{ fontSize: 13, letterSpacing: "2px", color: CORAL2, marginBottom: 24, fontWeight: 500 }}>後台登入</p>
            <p style={{ fontSize: 13, color: MID, marginBottom: 20, lineHeight: 1.7 }}>使用管理員 Google 帳號登入</p>
            {err && <p style={{ fontSize: 12, color: "#C0392B", marginBottom: 12 }}>{err}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="pb" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={login} disabled={logging}>
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.35 2.56 10.53l7.97-5.94z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.94C6.51 42.62 14.62 48 24 48z"/></svg>
                {logging ? "登入中..." : "Google 登入"}
              </button>
              <button className="pg" onClick={() => { setShowL(false); setErr(""); }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

//  Footer
function Footer({ links, footerTagline, setFooterTagline, isAdmin, setPage, footerLabels, setFooterLabels }) {
  const l = links || DEFAULTS.links;
  const fl = normalizeFooterLabels(footerLabels);
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(footerTagline || DEFAULTS.footerTagline);
  const save = () => { setFooterTagline(tmp); setEditing(false); };
  const [editingLabels, setEditingLabels] = useState(false);
  const [tmpLabels, setTmpLabels] = useState(fl);
  const navigateFooter = page => {
    if (!setPage) return;
    setPage(page);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const FLink = ({ page, children }) => (
    <li style={{ marginBottom: 10 }}>
      <button type="button" onClick={() => navigateFooter(page)} style={{ padding: 0, background: "transparent", border: "none", fontSize: 13, color: "rgba(255,255,255,.7)", cursor: "pointer", transition: "color .15s", textAlign: "left" }} onMouseEnter={e => e.currentTarget.style.color = CORAL} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.7)"}>{children}</button>
    </li>
  );
  const LABEL_ROWS = [
    ["colProduct", "「產品」欄標題"], ["fApp", "88La財務導航連結文字"], ["fEnvelope", "存錢袋連結文字"], ["fGoods", "推薦好物連結文字"], ["fPricing", "訂閱方案連結文字"],
    ["colAbout", "「關於」欄標題"], ["fAbout", "關於我們連結文字"], ["fCommunity", "8友社群連結文字"], ["fResources", "資源中心連結文字"], ["fNewsletter", "電子報連結文字"], ["fContact", "合作洽談連結文字"],
    ["colLegal", "「法律資訊」欄標題"], ["fTerms", "服務條款連結文字"], ["fPrivacy", "隱私政策連結文字"], ["fDisclaimer", "免責聲明連結文字"],
    ["copyright", "版權宣告文字"],
  ];
  return (
    <footer style={{ background: CHAR, padding: "56px 32px calc(28px + env(safe-area-inset-bottom, 0px))" }} className="site-footer">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 32, marginBottom: 40 }} className="footer-grid4">
          <div>
            <p style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 18, letterSpacing: "1px", color: WHITE, marginBottom: 12 }}>88La</p>
            {editing ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input value={tmp} onChange={e => setTmp(e.target.value)} style={{ fontSize: 12, color: WHITE, borderBottom: `1px solid rgba(255,255,255,.3)`, background: "transparent", width: 200, padding: "2px 0" }} />
                <button onClick={save} style={{ background: O, color: WHITE, border: "none", padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>儲存</button>
                <button onClick={() => setEditing(false)} style={{ background: "transparent", color: "rgba(255,255,255,.5)", border: `1px solid rgba(255,255,255,.25)`, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>取消</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>{footerTagline || DEFAULTS.footerTagline}</p>
                {isAdmin && <span onClick={() => { setTmp(footerTagline || DEFAULTS.footerTagline); setEditing(true); }} style={{ fontSize: 11, color: "rgba(255,255,255,.35)", cursor: "pointer", textDecoration: "underline" }}>編輯</span>}
              </div>
            )}
            <div style={{ display: "flex", gap: 16, marginTop: 18 }}>
              {[[l.lineOfficial, "LINE"], [l.instagram, "Instagram"], ["mailto:" + l.email, "Email"]].map(([h, label]) => (
                <a key={label} href={h} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "rgba(255,255,255,.55)", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = WHITE} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.55)"}>{label}</a>
              ))}
            </div>
          </div>
          <div>
            <h5 style={{ fontSize: 13, color: WHITE, marginBottom: 16, fontWeight: 700 }}>{fl.colProduct}</h5>
            <ul style={{ listStyle: "none" }}>
              <FLink page="app">{fl.fApp}</FLink>
              <FLink page="envelope">{fl.fEnvelope}</FLink>
              <FLink page="goods">{fl.fGoods}</FLink>
              <FLink page="pricing">{fl.fPricing}</FLink>
            </ul>
          </div>
          <div>
            <h5 style={{ fontSize: 13, color: WHITE, marginBottom: 16, fontWeight: 700 }}>{fl.colAbout}</h5>
            <ul style={{ listStyle: "none" }}>
              <FLink page="about">{fl.fAbout}</FLink>
              <FLink page="community">{fl.fCommunity}</FLink>
              <FLink page="resources">{fl.fResources}</FLink>
              <FLink page="newsletter">{fl.fNewsletter}</FLink>
              <FLink page="contact">{fl.fContact}</FLink>
            </ul>
          </div>
          <div>
            <h5 style={{ fontSize: 13, color: WHITE, marginBottom: 16, fontWeight: 700 }}>{fl.colLegal}</h5>
            <ul style={{ listStyle: "none" }}>
              <FLink page="terms">{fl.fTerms}</FLink>
              <FLink page="privacy">{fl.fPrivacy}</FLink>
              <FLink page="disclaimer">{fl.fDisclaimer}</FLink>
            </ul>
          </div>
        </div>
        <div style={{ paddingTop: 20, borderTop: `1px solid rgba(255,255,255,.1)`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>{fl.copyright}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a href={`mailto:${l.email}`} style={{ fontSize: 11, color: "rgba(255,255,255,.5)", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.8)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.5)"}>{l.email}</a>
            {isAdmin && <span onClick={() => { setTmpLabels(fl); setEditingLabels(true); }} style={{ fontSize: 11, color: "rgba(255,255,255,.35)", cursor: "pointer", textDecoration: "underline" }}>編輯頁尾文字</span>}
          </div>
        </div>
      </div>
      {editingLabels && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 61, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: WHITE, padding: 32, width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto" }}>
            <p style={{ fontSize: 13, letterSpacing: "2px", color: CORAL2, marginBottom: 20, fontWeight: 500 }}>編輯頁尾文字</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {LABEL_ROWS.map(([k, label]) => (
                <div key={k}>
                  <p style={{ fontSize: 11, color: MID, marginBottom: 4 }}>{label}</p>
                  <input value={tmpLabels[k] ?? ""} onChange={e => setTmpLabels(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pb" onClick={() => { setFooterLabels(tmpLabels); setEditingLabels(false); }}>儲存</button>
              <button className="pg" onClick={() => setEditingLabels(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

//  Hero Banner
function PageHero({ title, fields, data, setData, defaults, isAdmin, children }) {
  const h = { ...defaults, ...(data || {}) };
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(h);
  const save = () => { setData(tmp); setEditing(false); };
  if (editing) return (
    <div style={{ padding: "48px 32px", maxWidth: 600, margin: "0 auto" }}>
      <p style={{ fontSize: 11, letterSpacing: "2px", color: O, marginBottom: 24 }}>編輯{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {fields.map(f => (
          <div key={f.key}>
            {f.type === "image"
              ? <ImgUploader label={f.label} value={tmp[f.key] || ""} onChange={v => setTmp(p => ({ ...p, [f.key]: v }))} aspect={f.aspect || "1/1"} />
              : <>
                <p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{f.label}</p>
                {f.multiline
                  ? <textarea value={tmp[f.key] || ""} onChange={e => setTmp(p => ({ ...p, [f.key]: e.target.value }))} style={{ minHeight: 70 }} />
                  : <input value={tmp[f.key] || ""} onChange={e => setTmp(p => ({ ...p, [f.key]: e.target.value }))} />}
              </>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 28 }}><button className="pb" onClick={save}>儲存</button><button className="pg" onClick={() => setEditing(false)}>取消</button></div>
    </div>
  );
  return children(h, isAdmin ? <span onClick={() => { setTmp(h); setEditing(true); }} style={{ fontSize: 12, color: O, cursor: "pointer" }}>編輯文字</span> : null);
}

//  Home（2026-09 改版 3a：Hero → 月初分配 → 智慧預填 → 月底診斷四段 → 走過三個月 → 兩張功能卡 → 方案 → 免費入口）
//  痛點只在「你的月底，通常是這樣」講一次；上手三件事與名詞辭典改放 /app 與 /guide，首頁不再重複。
const HM_SHOT = "/app-shots/";
// 首頁只留兩張功能卡，其餘功能用一句話帶到 /app（避免與 /app 的完整功能清單重複）
const HM_FEATURES = [
  ["信用卡帳期", "每張卡的結帳日、繳費日與本期應還，月初就先預留", "credit-card.webp", "88La財務導航 信用卡帳期管理：三張卡的結帳與繳費日、本期應還 $5,774"],
  ["帳戶與淨資產", "目標帳戶與活存分開看，錢有沒有往目標走一眼就懂", "accounts.webp", "88La財務導航 帳戶管理：淨資產、總資產與負債、目標帳戶與其他帳戶"],
];
// 情境 02 的三個月餐費趨勢：最後一列自動標成「本月」樣式，改資料不用改 JSX
const HM_TREND = [
  ["6 月", "NT$ 9,100"],
  ["7 月", "NT$ 9,600"],
  ["8 月", "NT$ 10,200"],
];
const HM_TYPICAL = [
  ["「這個月好像有剩一點，但不知道為什麼」", "好月份沒辦法複製，壞月份也不知道從哪裡開始檢查。"],
  ["「圖表說吃飯占 32%，那是多還是少？」", "占比只講比例，沒講有沒有問題。"],
  ["「又超支了，下個月要怎麼改？」", "沒有具體的調整方向，下個月只能重來一次。"],
];
const HM_DIAG = [
  ["① 卡費正在吃下個月薪水", "本期卡費還有 NT$ 7,800 沒有預留。如果不調整，9 月薪水進來後，要先拿 NT$ 7,800 補這期卡費。", "動作：刷卡時同步預留卡費，先停止把消費延後付款。"],
  ["② 餐費不是偶爾超支", "最近 3 個月餐費都高於 NT$ 8,000，平均約 NT$ 9,600。原本的 NT$ 8,000 已經不太符合你現在的生活。", "動作：下月餐費預算 NT$ 8,000 → NT$ 9,600。"],
];
const HM_VALUES = [
  ["薪水不再先被卡費吃掉", "月初就把卡費預留好，也知道這個月真正能花多少。"],
  ["預算是照你的生活訂的", "卡費、分期、預存、心情都收在同一個地方，預算才不會偏離現實。"],
  ["下個月不用重新猜一次", "不評分、不說教，每個月都給你一份下個月能照做的調整。"],
];

function Home({ setPage, isAdmin, trustStats, setTrustStats }) {
  const ts = trustStats && trustStats.length ? trustStats : DEFAULTS.trustStats;
  const [editStats, setEditStats] = useState(false);
  const [tmpStats, setTmpStats] = useState(ts);
  // 內部連結：保留真實 href（SEO 與新分頁可用），點擊時走前端路由
  const to = p => ({ href: pathForPage(p), onClick: e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); setPage(p); } });
  return (
    <div className="nx-page">
      {/* Hero */}
      <div className="nx-in">
        <section className="nx-hero">
          <div>
            <p className="nx-badge"><b>訂閱制</b><span><span className="nx-hide-mob">88La財務導航 · </span>每月 <Price>{NT_MONTHLY}</Price></span></p>
            <h1 className="nx-h1">不用再問<br />「記帳了，然後勒？」</h1>
            <p className="nx-hero-p nx-hide-mob">88La財務導航幫你月初把薪水分配好，平常 5 秒記一筆，月底告訴你哪裡超支、下個月該從哪裡開始調整。</p>
            <p className="nx-hero-p nx-only-mob">月初分配、平常 5 秒記一筆、月底告訴你下個月該從哪裡開始調整。</p>
            <p className="nx-hero-p2 nx-hide-mob">不是叫你什麼都別買，是讓想花的錢花得安心。</p>
            <div className="nx-cta-row">
              <a className="nx-btn nx-btn-pri nx-btn-lg" {...appCtaProps("home-hero")}>開始使用 88La財務導航 →</a>
              <a className="nx-btn nx-btn-sec nx-btn-lg" href="#month">先看完一個月 ↓</a>
            </div>
            {editStats ? (
              <div style={{ background: GRAY, padding: 20, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 14 }}>
                  {tmpStats.map((s, i) => (
                    <div key={i}>
                      <input value={s.num} onChange={e => setTmpStats(p => p.map((x, xi) => xi === i ? { ...x, num: e.target.value } : x))} placeholder="數字" style={{ marginBottom: 6 }} />
                      <input value={s.label} onChange={e => setTmpStats(p => p.map((x, xi) => xi === i ? { ...x, label: e.target.value } : x))} placeholder="標籤" />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={() => { setTrustStats(tmpStats); setEditStats(false); }}>儲存</button><button className="pg" onClick={() => setEditStats(false)}>取消</button></div>
              </div>
            ) : (
              <p className="nx-proof">
                {ts.slice(0, 3).map((s, i) => (
                  <Fragment key={i}>{i > 0 && <i aria-hidden="true">·</i>}<span>{s.num} {s.label}</span></Fragment>
                ))}
                {isAdmin && <button onClick={() => { setTmpStats(ts); setEditStats(true); }} style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 12, color: O, cursor: "pointer", textDecoration: "underline" }}>編輯信任數據</button>}
              </p>
            )}
          </div>
          <div className="nx-shot-wrap">
            <img className="nx-shot" src={HM_SHOT + "alert.webp"} width="940" height="1175" alt="88La財務導航 快訊頁：本月可用餘額 $4,729、本期卡費已預留 $4,249、提醒中心" />
          </div>
        </section>
      </div>

      {/* 一個月的故事：月初分配 */}
      <div className="nx-in">
        <section className="hm-story nx-anchor" id="month">
          <div>
            <p className="nx-eyebrow" style={{ marginBottom: 10 }}>用 88La財務導航過完一個月</p>
            <span className="nx-mono">8 / 05 &nbsp;月初</span>
            <h2>薪水入帳了。<br />先分配，再開始花。</h2>
            <p className="hm-story-p">NT$ 38,000 進來，四個步驟帶你走完：盤點收入、看分配建議、自己分配、完成本月預算。</p>
            <p className="hm-quote">「依照你的收入，這個月可以存 NT$ 8,000。剩下的 NT$ 26,162 再一起排。」</p>
          </div>
          <div className="nx-shot-wrap">
            <img className="nx-shot" src={HM_SHOT + "budget.webp"} width="940" height="1175" loading="lazy" alt="88La財務導航 預算頁：四步驟流程、盤點收入 $38,000、可存 $8,000、待分配 $26,162" />
          </div>
        </section>
      </div>

      {/* 平常：智慧預填 */}
      <section className="nx-band">
        <div className="nx-in">
          <div className="hm-story hm-story-flip">
            <div className="nx-shot-wrap">
              <img className="nx-shot" src={HM_SHOT + "quick-record.webp"} width="940" height="1175" loading="lazy" alt="88La財務導航 快速記帳：金額、類別、支出類型、付款方式、帳目歸屬與需要或想要" />
            </div>
            <div>
              <span className="nx-mono">8 / 05 ~ 8 / 31 &nbsp;平常</span>
              <h2 className="nx-hide-mob">紀錄使用習慣，<br />智慧預填，5 秒記一筆。</h2>
              <h2 className="nx-only-mob">智慧預填·5秒記一筆</h2>
              <p className="hm-story-p nx-hide-mob">每筆花費標好：固定或變動、現金或刷卡、需要或想要，還有你按下去那一刻的心情。</p>
              <p className="hm-story-p nx-hide-mob" style={{ marginBottom: 0 }}>智慧預填系統，不用每次都重頭選一遍，自動記得你的習慣，預先幫你選好細項！</p>
              <p className="hm-story-p nx-only-mob" style={{ marginBottom: 0 }}>智慧預填系統，自動記得你的使用習慣，預先幫你選好細項，不用每次都重頭選一遍！簡單 5 秒記一筆！</p>
            </div>
          </div>
        </div>
      </section>

      {/* 月底診斷：導言 */}
      <section style={{ paddingBlock: "clamp(32px,5vw,64px) clamp(22px,3.4vw,44px)" }}>
        <div className="nx-in">
          <p className="nx-eyebrow" style={{ marginBottom: 12 }}>月底診斷</p>
          <h2 className="hm-dg-h1">你或許更想知道，<br />超支紅字代表什麼？</h2>
          <p className="hm-story-p" style={{ maxWidth: 580, marginTop: 14, marginBottom: 0 }}>「除了要改付款方式，也要重新調整預算。」得到這個結果，才是「診斷」跟「圓餅圖」的差異。</p>
        </div>
      </section>

      {/* 月底診斷：兩個情境 */}
      <section className="nx-band">
        <div className="nx-in hm-sc">
          <div>
            <p className="nx-mono hm-sc-lb">情境 01&nbsp; 被卡費追著跑</p>
            <p className="hm-sc-h nx-hide-mob">8 月刷了 NT$ 12,800，<br />但只預留 NT$ 5,000</p>
            <p className="hm-sc-h nx-only-mob">8 月刷了 NT$ 12,800，預留 NT$ 5,000</p>
            <div className="nx-card hm-sc-box">
              <p className="hm-sc-big">NT$ 7,800</p>
              <p className="hm-sc-p">要靠 9 月的薪水補！<br />這筆壓力被拖到下個月。</p>
            </div>
          </div>
          <div>
            <p className="nx-mono hm-sc-lb">情境 02 &nbsp;餐費爆預算</p>
            <p className="hm-sc-h nx-hide-mob">預算 NT$ 8,000，<br />實際花了 NT$ 10,200</p>
            <p className="hm-sc-h nx-only-mob">預算 NT$ 8,000，實際花 NT$ 10,200</p>
            <div className="nx-card hm-sc-box">
              <p className="hm-sc-p" style={{ marginBottom: 16 }}>只看這個月，很容易得到一句「下個月少吃一點」。但往前看三個月：</p>
              <div className="hm-tri">
                {HM_TREND.map(([m, amt], i) => (
                  <div key={m} className={i === HM_TREND.length - 1 ? "hm-tri-now" : undefined}><span>{m}</span><b>{amt}</b></div>
                ))}
              </div>
              <p className="hm-sc-note">已經不是偶爾超支，是預算本身抓錯了。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 月底診斷：你的月底通常是這樣（全站只講這一次痛點） */}
      <section style={{ paddingBlock: "clamp(30px,4.6vw,60px) clamp(28px,4.4vw,56px)" }}>
        <div className="nx-in">
          <h2 className="nx-h2" style={{ marginBottom: "clamp(18px,2.4vw,28px)" }}>你的月底，通常是這樣：</h2>
          <div className="hm-typ">
            {HM_TYPICAL.map(([q, d]) => (
              <article key={q} className="nx-card"><p>{q}</p><p>{d}</p></article>
            ))}
          </div>
        </div>
      </section>

      {/* 月底診斷：拿到的診斷 ＋ 下個月只改兩件事 */}
      <section className="nx-dark" style={{ paddingBlock: "clamp(30px,4.6vw,60px)" }}>
        <div className="nx-in">
          <div className="hm-dg">
            <div className="hm-dg-head">
              <p className="nx-mono nx-eyebrow-dark hm-dg-lb">月底 ｜ 拿到的診斷</p>
              <h2 className="hm-dg-h2">兩個問題，<br className="nx-hide-mob" />兩種調整方向。</h2>
            </div>
            <div className="nx-shot-wrap hm-dg-shot">
              <picture>
                <source media="(max-width:900px)" srcSet={HM_SHOT + "diagnosis-mobile.webp"} />
                <img className="nx-shot" src={HM_SHOT + "diagnosis.webp"} width="940" height="1175" loading="lazy" alt="88La財務導航 診斷頁：本月你的支出發生了什麼，逐項說明缺口與判斷依據" />
              </picture>
            </div>
            <div className="hm-dg-cards">
              {HM_DIAG.map(([no, body, act]) => (
                <div key={no} className="hm-dg-card">
                  <p className="hm-dg-no">{no}</p>
                  <p className="hm-dg-body">{body}</p>
                  <p className="hm-dg-act">{act}</p>
                </div>
              ))}
              <p className="hm-dg-foot">不是一昧「要你更節省」！<br />同樣都是超支，有些要改預算，有些要改付款方式。</p>
            </div>
          </div>

          <div className="hm-next">
            <p className="nx-mono hm-next-lb">下個月 ｜ <span className="nx-hide-mob">照建議調整，</span>只改兩件事</p>
            <div className="hm-next-grid">
              <div>
                <p className="hm-next-k">餐費預算</p>
                <div className="hm-next-row">
                  <span className="hm-next-old">NT$ 8,000</span>
                  <span className="hm-next-arw">→</span>
                  <span className="hm-next-new">NT$ 9,600</span>
                </div>
                <p className="hm-next-d nx-hide-mob">不再出現一個假裝做得到的預算。</p>
              </div>
              <div>
                <p className="hm-next-k">卡費</p>
                <p className="hm-next-old2">刷了再想辦法繳</p>
                <p className="hm-next-new2">刷多少，就先留多少</p>
                <p className="hm-next-d nx-hide-mob">這期卡費不用再靠下個月的薪水補。</p>
              </div>
            </div>
            <p className="hm-next-d nx-only-mob" style={{ marginTop: 14 }}>這期卡費不用再靠下個月的薪水補，餐費也不再是一個假裝做得到的預算。</p>
          </div>
        </div>
      </section>

      {/* 走過三個月，你訂閱的是這三件事 */}
      <section style={{ paddingBlock: "clamp(30px,4.6vw,60px) clamp(30px,4.8vw,64px)", borderBottom: "1px solid var(--nx-bd)" }}>
        <div className="nx-in">
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 className="nx-h2">走過三個月，<span className="hm-3m-br">你訂閱的是這三件事</span></h2>
            <p className="nx-lead" style={{ marginTop: 12, marginBottom: "clamp(22px,2.8vw,36px)" }}>不是一個記帳的地方，是一套會跟著你的月份調整的方法。</p>
            <div className="hm-value">
              {HM_VALUES.map(([t, d]) => (<div key={t}><h3>{t}</h3><p>{d}</p></div>))}
            </div>
            <div className="hm-3m-cta nx-hr" style={{ marginTop: "clamp(26px,3.4vw,36px)" }}>
              <a className="nx-btn nx-btn-pri nx-btn-lg" {...appCtaProps("home-3m")}>看我的第一份診斷</a>
              <p>記滿一個月就會產生，不用等半年</p>
            </div>
          </div>
        </div>
      </section>

      {/* 不只是記帳 */}
      <section style={{ paddingBlock: "clamp(32px,5vw,64px) clamp(28px,4.5vw,56px)", borderBottom: "1px solid var(--nx-bd)" }}>
        <div className="nx-in">
          <div style={{ marginBottom: "clamp(20px,2.8vw,36px)" }}>
            <p className="nx-eyebrow" style={{ marginBottom: 12 }}>不只是記帳</p>
            <h2 className="nx-h2">其他財務狀況·輕易掌握</h2>
          </div>
          <div className="hm-feat">
            {HM_FEATURES.map(([t, d, img, alt]) => (
              <article key={t} className="nx-card">
                <h3>{t}</h3>
                <p className="nx-hide-mob">{d}</p>
                <img src={HM_SHOT + img} width="940" height="1175" loading="lazy" alt={alt} />
              </article>
            ))}
          </div>
          <p className="nx-lead nx-hr">
            另外還有負債追蹤、儲蓄目標與預存、願望清單、<span className="nx-hide-mob">個人／公費／家庭</span>三本帳，
            <a className="hm-feat-more" {...to("app")}>完整功能看這裡 →</a>
          </p>
        </div>
      </section>

      {/* 方案 */}
      <section style={{ paddingBottom: "clamp(32px,5vw,64px)" }}>
        <div className="nx-in">
          <div className="hm-price">
            <div className="hm-price-top">
              <div>
                <p className="hm-price-label">年方案 · 最多人選擇</p>
                <PriceNote style={{ marginBottom: 14 }} />
                <p className="hm-price-num"><Price>{NT_YEARLY}</Price><span> /年</span></p>
                <p className="hm-price-save"><Price>{`相當於 NT$ ${APP_YEARLY_MONTHLY_EQUIVALENT} / 月，省下約 ${APP_YEARLY_DISCOUNT}%`}</Price></p>
              </div>
              <a className="nx-btn nx-btn-pri nx-btn-lg" {...appCtaProps("home-price")}>開始使用 →</a>
            </div>
            <div className="hm-price-bot">
              <div>
                <strong>想先試一個月？月訂閱 <Price>{NT_MONTHLY}</Price> / 月</strong>
                <em>下次扣款日前都可以取消，資料留著</em>
              </div>
              <a className="nx-btn nx-btn-sec nx-btn-sm" {...appCtaProps("home-price-monthly")}>選月訂閱</a>
            </div>
          </div>
        </div>
      </section>

      {/* 免費入口 */}
      <section className="nx-band" style={{ paddingBlock: "clamp(28px,3.4vw,40px)", borderBottom: "none" }}>
        <div className="nx-in nx-inline-cta">
          <p>還不確定？先從免費的開始也可以</p>
          <div>
            <a className="nx-btn nx-btn-sec nx-btn-sec-strong nx-btn-sm" {...to("tool-quiz")}>60 秒找到我的起點 →</a>
            <a className="nx-btn nx-btn-sec nx-btn-sm" {...to("resources")}>免費工具與文章</a>
            <a className="nx-btn nx-btn-sec nx-btn-sm" {...to("envelope")}>實體存錢袋</a>
          </div>
        </div>
      </section>

      {/* 手機置底 CTA */}
      <div className="nx-sticky">
        <div>
          <b>88La財務導航</b>
          <span>{isAppLaunched() ? `${NT_MONTHLY} / 月起` : "9/10 正式上線"}</span>
        </div>
        <a className="nx-btn nx-btn-pri nx-btn-sm" {...appCtaProps("home-sticky")}>開始使用</a>
      </div>
    </div>
  );
}

//  Journal（理財觀點文章列表）
//  Journal（2026-09 改版：Hero → 分類 chips → 頭條大圖 → 六篇格狀 → 會員限定說明 → 新手三篇 → CTA）
//
// 「新手三篇」用 slug 完全比對指定，不是拿標題去猜關鍵字：Barbara 改標題不會換掉這三篇，
// 只有改 slug 才會，改完那一格就自動消失（看得見的降級）。
const JOURNAL_STARTERS = [
  ["30歲應該要存多少錢", "先算出自己的最低生活成本"],
  ["你想存多少錢-只有數字恐怕很難存的到", "找出你的財務目標內核"],
  ["記帳習慣難養成先從改變大腦捷徑開始", "養成不用意志力的習慣"],
];
const MEMBER_FILTER = "__member__";
const fmtArticleDate = d => (d || "").replace(/-/g, ".");

function Journal({ articles, setId, setPage, isAdmin, siteTitle, setSiteTitle, tags, setTags, links }) {
  const [filter, setFilter] = useState("全部");
  const [sort, setSort] = useState("newest");
  const [editTitle, setEditTitle] = useState(false);
  const [tmpTitle, setTmpTitle] = useState(siteTitle);
  const [editTags, setEditTags] = useState(false);
  const [newTag, setNewTag] = useState("");
  const viewCounts = useArticleViewCounts();
  const all = articles || [];
  const sorted = all.slice().sort((a, b) => {
    if (sort === "oldest") return (a.date || "").localeCompare(b.date || "");
    if (sort === "views") return viewCount(b, viewCounts) - viewCount(a, viewCounts);
    return (b.date || "").localeCompare(a.date || "");
  });
  const matches = a => filter === "全部" || (filter === MEMBER_FILTER ? !!a.member : a.tag === filter);
  const filtered = sorted.filter(matches);
  const [lead, ...rest] = filtered;
  // 分類 chips 的數量由文章資料算出來，不寫死
  const chips = [
    ["全部", "全部", all.length],
    ...tags.map(t => [t, t, all.filter(a => a.tag === t).length]),
    ["只看會員限定", MEMBER_FILTER, all.filter(a => a.member).length],
  ].filter(([, key, n]) => key === "全部" || n > 0);
  const href = a => "/article/" + encodeURIComponent(a.slug || a.id);
  const open = (a, e) => {
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button)) return;
    e?.preventDefault();
    setId(a.id); setPage("article");
    window.scrollTo({ top: 0, behavior: "instant" });
    history.pushState({}, "", href(a));
  };
  const to = p => ({ href: pathForPage(p), onClick: e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); setPage(p); } });
  const addTag = () => { const t = newTag.trim(); if (t && !tags.includes(t)) setTags(prev => [...prev, t]); setNewTag(""); };
  const delTag = t => { if (confirm("確定刪除標籤「" + t + "」？")) setTags(prev => prev.filter(x => x !== t)); };
  const starters = JOURNAL_STARTERS
    .map(([slug, note]) => [all.find(a => a.slug === slug), note])
    .filter(([a]) => a);
  const igUrl = (links || DEFAULTS.links).instagram || DEFAULTS.links.instagram;

  const Cover = ({ a, className }) => (
    <a href={href(a)} onClick={e => open(a, e)} style={{ display: "block" }}>
      {a.img
        ? <img className={className} src={a.img} alt={a.title} loading="lazy" />
        : <span className={className} style={{ display: "block" }} />}
    </a>
  );

  return (
    <div className="nx-page">
      {/* Hero */}
      <div className="nx-in jn-hero">
        <p className="nx-eyebrow" style={{ letterSpacing: ".16em" }}>文章</p>
        <h1>看得懂、做得到的理財筆記</h1>
        <p>不談投資、不推商品，從我的生活經驗、書本知識出發，用最淺顯易懂的方式，讓你認識理財、找到屬於自己的理財方式！</p>
        {isAdmin && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 18 }}>
            {editTitle ? (
              <>
                <input value={tmpTitle} onChange={e => setTmpTitle(e.target.value)} style={{ maxWidth: 260 }} />
                <button className="pb" style={{ fontSize: 12, padding: "8px 16px" }} onClick={() => { setSiteTitle(tmpTitle); setEditTitle(false); }}>儲存</button>
                <button className="pg" style={{ fontSize: 12 }} onClick={() => { setTmpTitle(siteTitle); setEditTitle(false); }}>取消</button>
              </>
            ) : (
              <>
                <button className="pb" style={{ fontSize: 12, padding: "8px 16px" }} onClick={() => setPage("write")}>＋ 新增文章</button>
                <button className="pg" style={{ fontSize: 12 }} onClick={() => exportArticlesCSV(all, viewCounts)}>匯出文章 CSV</button>
                <button className="pg" style={{ fontSize: 12 }} onClick={() => setEditTags(p => !p)}>{editTags ? "關閉標籤管理" : "管理標籤"}</button>
                <button className="pg" style={{ fontSize: 12 }} onClick={() => { setTmpTitle(siteTitle); setEditTitle(true); }}>編輯站內標題</button>
                <select value={sort} onChange={e => setSort(e.target.value)} style={{ fontSize: 12, border: "1px solid #D0D5DA", borderRadius: 4, padding: "8px 12px", background: WHITE, appearance: "auto", WebkitAppearance: "menulist", width: "auto" }}>
                  <option value="newest">最新文章</option>
                  <option value="oldest">最舊文章</option>
                  <option value="views">最多瀏覽</option>
                </select>
              </>
            )}
          </div>
        )}
        {isAdmin && editTags && (
          <div style={{ background: GRAY, border: `1px solid ${BORDER}`, padding: 16, marginTop: 14 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {tags.map(t => (
                <span key={t} style={{ fontSize: 12, padding: "6px 12px", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 999 }}>
                  {t}<span onClick={() => delTag(t)} style={{ marginLeft: 8, color: "#E74C3C", cursor: "pointer" }}>×</span>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="新標籤" style={{ maxWidth: 200 }} />
              <button className="pb" style={{ fontSize: 12, padding: "8px 16px" }} onClick={addTag}>新增</button>
            </div>
          </div>
        )}
      </div>

      {/* 分類 */}
      <div className="nx-in jn-chips">
        {chips.map(([label, key, n]) => (
          <button key={key} className={"jn-chip" + (filter === key ? " is-on" : "")} onClick={() => setFilter(key)} aria-pressed={filter === key}>
            {label}<b>{n}</b>
          </button>
        ))}
      </div>

      {/* 頭條 */}
      {lead && (
        <div className="nx-in" style={{ paddingBottom: "clamp(26px,3.8vw,44px)" }}>
          <div className="jn-lead">
            <Cover a={lead} className="jn-lead-cover" />
            <div>
              <div className="jn-meta">
                <span className="jn-tag">{lead.tag}</span>
                {lead.member && <span className="jn-member">會員限定</span>}
                <span className="jn-date">{fmtArticleDate(lead.date)}　最新一篇</span>
              </div>
              <h2><a href={href(lead)} onClick={e => open(lead, e)} style={{ color: "inherit" }}>{lead.title}</a></h2>
              <p>{lead.excerpt}</p>
              <a className="jn-more" href={href(lead)} onClick={e => open(lead, e)}>{lead.member ? "輸入密碼閱讀 →" : "閱讀全文 →"}</a>
            </div>
          </div>
        </div>
      )}

      {/* 其餘文章 */}
      {rest.length > 0 && (
        <div className="nx-in" style={{ paddingBottom: "clamp(30px,4.4vw,52px)" }}>
          <div className="jn-grid">
            {rest.map(a => (
              <article key={a.id} className="jn-card">
                <Cover a={a} className="jn-card-cover" />
                <div className="jn-card-meta">
                  <p className="jn-card-tag">{a.tag}</p>
                  {a.member && <span className="jn-member jn-member-sm">會員限定</span>}
                  {isAdmin && <span className="jn-date">{viewCount(a, viewCounts)} 次瀏覽</span>}
                </div>
                <h3><a href={href(a)} onClick={e => open(a, e)}>{a.title}</a></h3>
                <p>{a.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
      )}
      {filtered.length === 0 && (
        <p className="nx-in nx-lead" style={{ paddingBottom: 52 }}>這個分類目前還沒有文章</p>
      )}

      {/* 會員限定說明 */}
      <div className="nx-in" style={{ paddingBottom: "clamp(30px,4.4vw,52px)" }}>
        <div className="jn-note">
          <div>
            <span className="jn-note-tag">會員限定</span>
            <h2>成為 88La Instagram 訂閱會員，解鎖「會員限定」</h2>
            <p>會員限定涵蓋理財影片、文章等獨家資訊，如果你想了解更多 88La 的理財觀念，歡迎到 Instagram 成為訂閱會員，支持 88La 做出更優質的理財內容！</p>
          </div>
          <div className="jn-note-box">
            {isAdmin ? (
              <>
                <p>密碼可在後台隨時更新</p>
                <p>更新後舊密碼立即失效，已解鎖的訪客需重新輸入</p>
                <a {...to("resources")}>到後台設定密碼 →</a>
              </>
            ) : (
              <>
                <p>已經是訂閱會員？</p>
                <p>密碼會在 Instagram 訂閱會員專屬貼文裡公告，輸入一次，這次瀏覽期間所有會員文章都保持解鎖。</p>
                <a href={igUrl} target="_blank" rel="noopener noreferrer">到 Instagram 加入訂閱 →</a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 新手三篇 */}
      {starters.length > 0 && (
        <section className="nx-band" style={{ paddingBlock: "clamp(28px,4vw,48px)" }}>
          <div className="nx-in">
            <h2 className="nx-h2" style={{ fontSize: "clamp(20px,2.2vw,24px)", marginBottom: 8 }}>第一次想認真理財？從這三篇開始</h2>
            <p className="nx-lead" style={{ marginBottom: 26, color: "var(--nx-t2)", fontSize: 15 }}>照順序讀，大概 20 分鐘</p>
            <div className="jn-starter">
              {starters.map(([a, note], i) => (
                <article key={a.id}>
                  <b>{String(i + 1).padStart(2, "0")}</b>
                  <h3><a href={href(a)} onClick={e => open(a, e)}>{a.title}</a></h3>
                  <p>{note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="nx-in rs-cta">
        <h2>讀完了，換成自己的數字試一次</h2>
        <p>免費工具算一次，或直接用財務導航排這個月的預算</p>
        <div className="rs-cta-row">
          <a className="nx-btn nx-btn-pri nx-btn-md" {...to("app")}>免費體驗財務導航</a>
          <a className="nx-btn nx-btn-sec nx-btn-sec-strong nx-btn-md" {...to("resources")}>先用免費工具</a>
        </div>
      </div>
    </div>
  );
}

// 文章「相關內容」可以指到的站內頁面
const PAGE_OPTIONS = [["home","首頁"],["tool-quiz","工具診斷"],["journal","理財觀點文章列表"],["app","記帳 App"],["resources","免費資源"],["shop","商品"],["goods","推薦好物"],["newsletter","電子報"],["contact","合作洽談"]];
function RelatedLinkEditor({ relatedLinks, onChange, products, resources }) {
  const [type, setType] = useState("page");
  const [key, setKey] = useState("app");
  const [label, setLabel] = useState("");
  const links = relatedLinks || [];
  const add = () => {
    if (!key) return;
    const autoLabel = type === "page" ? (PAGE_OPTIONS.find(([k]) => k === key)?.[1] || key) : type === "product" ? ((products || []).find(p => String(p.id) === String(key))?.name || key) : ((resources || []).find(r => String(r.id) === String(key))?.name || key);
    onChange([...links, { id: Date.now(), type, key, label: label.trim() || autoLabel }]);
    setLabel("");
  };
  const del = id => onChange(links.filter(l => l.id !== id));
  return (
    <div style={{ border: `1px solid ${BORDER}`, padding: 20, background: GRAY }}>
      <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>相關連結（文章底部卡片）</p>
      {links.map(l => (
        <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: WHITE, border: `1px solid ${BORDER}`, marginBottom: 6 }}>
          <div><span style={{ fontSize: 10, color: O, marginRight: 8 }}>{l.type}</span><span style={{ fontSize: 13, color: CHAR }}>{l.label}</span></div>
          <button className="pg" style={{ fontSize: 10, padding: "2px 8px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => del(l.id)}>✕</button>
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, marginTop: 12, alignItems: "end" }}>
        <div>
          <p style={{ fontSize: 11, color: MID, marginBottom: 4 }}>類型</p>
          <select value={type} onChange={e => { const t = e.target.value; setType(t); setKey(t === "page" ? "app" : t === "product" ? String((products||[])[0]?.id||"") : String(((resources||[]).filter(r=>r.active))[0]?.id||"")); }} style={{ border: `1px solid #D0D5DA`, padding: "8px 10px", background: WHITE, fontSize: 12 }}>
            <option value="page">頁面</option>
            <option value="product">商品</option>
            <option value="resource">資源</option>
          </select>
        </div>
        <div>
          <p style={{ fontSize: 11, color: MID, marginBottom: 4 }}>目標</p>
          {type === "page" && <select value={key} onChange={e => setKey(e.target.value)} style={{ border: `1px solid #D0D5DA`, padding: "8px 10px", background: WHITE, fontSize: 12, width: "100%" }}>{PAGE_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}
          {type === "product" && <select value={key} onChange={e => setKey(e.target.value)} style={{ border: `1px solid #D0D5DA`, padding: "8px 10px", background: WHITE, fontSize: 12, width: "100%" }}>{(products || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
          {type === "resource" && <select value={key} onChange={e => setKey(e.target.value)} style={{ border: `1px solid #D0D5DA`, padding: "8px 10px", background: WHITE, fontSize: 12, width: "100%" }}>{(resources || []).filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>}
        </div>
        <button className="pb" style={{ fontSize: 12, padding: "8px 16px" }} onClick={add}>＋ 新增</button>
      </div>
      <div style={{ marginTop: 10 }}><p style={{ fontSize: 11, color: MID, marginBottom: 4 }}>自訂標籤（選填）</p><input value={label} onChange={e => setLabel(e.target.value)} placeholder="留空自動帶入名稱" style={{ fontSize: 12 }} /></div>
    </div>
  );
}

function Article({ article, onBack, setArticles, isAdmin, tags, links, setPage, products, resources }) {
  const [name, setName] = useState(""); const [text, setText] = useState(""); const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [memberContent, setMemberContent] = useState(article.member ? "" : article.content);
  const [unlocking, setUnlocking] = useState(false);
  const [pwdInput, setPwdInput] = useState("");
  const [pwdErr, setPwdErr] = useState(false);
  const viewCounts = useArticleViewCounts();
  // 記在這裡而不是各個列表的點擊事件：直接開分享連結、按上一頁進來的人一樣要算到
  useEffect(() => { recordArticleView(article); }, [article]);
  const locked = article.member && !isAdmin && !memberContent;
  const displayContent = article.member ? memberContent : article.content;
  const tryUnlock = async () => {
    if (!pwdInput.trim() || unlocking) return;
    setUnlocking(true); setPwdErr(false);
    try {
      const content = await fetchMemberArticleContent(article.id, pwdInput.trim());
      setMemberContent(content);
      setMemberSessionPassword(pwdInput.trim());
      setPwdInput("");
    } catch {
      setPwdErr(true);
    }
    setUnlocking(false);
  };
  const [ed, setEd] = useState({ title: article.title, tag: article.tag, excerpt: article.excerpt, content: displayContent || "", img: article.img || "", date: article.date || "", relatedLinks: article.relatedLinks || [], member: article.member || false });
  const l = links || DEFAULTS.links;
  const lastSubmit = useRef(0);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  const sanitize = (s) => s.replace(/[<>]/g, "");
  const submit = () => {
    if (!text.trim()) return;
    const now = Date.now();
    const diff = now - lastSubmit.current;
    if (diff < 15000) { setCooldown(Math.ceil((15000 - diff) / 1000)); return; }
    const c = { name: sanitize(name.trim() || "匿名").slice(0, 50), text: sanitize(text.trim()).slice(0, 500), date: new Date().toISOString().slice(0, 10) };
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, comments: [...a.comments, c] } : a));
    setName(""); setText(""); lastSubmit.current = now; setCooldown(0);
  };
  const articleUrl = `${window.location.origin}/article/${encodeURIComponent(article.slug || article.id)}`;
  const copy = () => { navigator.clipboard.writeText(articleUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  useEffect(() => {
    setPwdInput(""); setPwdErr(false);
    setMemberContent(article.member ? "" : article.content);
  }, [article.id, article.member, article.content]);
  useEffect(() => {
    if (!article.member || !isAdmin) return;
    fetchMemberArticleContent(article.id)
      .then(content => setMemberContent(content))
      .catch(() => setMemberContent(article.content || ""));
  }, [article.id, article.member, isAdmin]);
  // 這次瀏覽期間已經解鎖過，換一篇會員文章時直接拿全文，不用再輸入一次
  useEffect(() => {
    if (!article.member || isAdmin) return;
    const pwd = getMemberSessionPassword();
    if (!pwd) return;
    let alive = true;
    fetchMemberArticleContent(article.id, pwd)
      .then(content => { if (alive) setMemberContent(content); })
      .catch(() => { clearMemberSessionPassword(); });  // 密碼被後台換掉了，回到要求輸入的狀態
    return () => { alive = false; };
  }, [article.id, article.member, isAdmin]);
  useEffect(() => {
    if (editing) return;
    setEd({ title: article.title, tag: article.tag, excerpt: article.excerpt, content: displayContent || "", img: article.img || "", date: article.date || "", relatedLinks: article.relatedLinks || [], member: article.member || false });
  }, [article.id, article.title, article.tag, article.excerpt, article.img, article.date, article.relatedLinks, article.member, displayContent, editing]);
  const del = () => { if (confirm("確定刪除此文章？")) { setArticles(prev => prev.filter(a => a.id !== article.id)); onBack(); } };
  const saveEdit = async () => {
    if (ed.member) await saveMemberArticleContent(article.id, ed.content);
    setArticles(prev => prev.map(a => a.id === article.id ? publicArticle({ ...a, ...ed, content: ed.member ? "" : ed.content }) : a));
    setMemberContent(ed.member ? ed.content : "");
    setEditing(false);
  };
  const relLinks = article.relatedLinks || [];
  const handleRelNav = (rl) => {
    if (rl.type === "page") setPage(rl.key);
    else if (rl.type === "product") setPage("shop");
    else if (rl.type === "resource") setPage("resources");
  };
  if (editing) return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "60px 32px" }} className="page-wrap">
      <button className="pg" onClick={() => setEditing(false)} style={{ marginBottom: 32 }}>← 取消</button>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <textarea placeholder="標題" value={ed.title} onChange={e => setEd(p => ({ ...p, title: e.target.value }))} style={{ fontSize: 20, fontWeight: 500, minHeight: 64, resize: "none", border: "none", borderBottom: "1px solid #D0D5DA", lineHeight: 1.4 }} />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <select value={ed.tag} onChange={e => setEd(p => ({ ...p, tag: e.target.value }))} style={{ border: "1px solid #D0D5DA", padding: "10px 12px", background: WHITE, flex: 1 }}>{tags.map(t => <option key={t}>{t}</option>)}</select>
          <input type="date" value={ed.date} onChange={e => setEd(p => ({ ...p, date: e.target.value }))} style={{ border: "1px solid #D0D5DA", padding: "10px 12px", background: WHITE, appearance: "auto", WebkitAppearance: "auto", width: "auto" }} />
        </div>
        <ImgUploader label="封面圖片（選填）" value={ed.img} onChange={v => setEd(p => ({ ...p, img: v }))} aspect="16/9" />
        <textarea placeholder="摘要" value={ed.excerpt} onChange={e => setEd(p => ({ ...p, excerpt: e.target.value }))} style={{ minHeight: 72, resize: "vertical" }} />
        <RichEditor value={ed.content} onChange={v => setEd(p => ({ ...p, content: v }))} />
        <RelatedLinkEditor relatedLinks={ed.relatedLinks} onChange={v => setEd(p => ({ ...p, relatedLinks: v }))} products={products} resources={resources} />
        <label style={{ fontSize: 13, color: MID, display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={ed.member} onChange={e => setEd(p => ({ ...p, member: e.target.checked }))} style={{ width: "auto" }} />會員限定文章
        </label>
        <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={saveEdit}>儲存</button><button className="pg" onClick={() => setEditing(false)}>取消</button></div>
      </div>
    </div>
  );
  const relKindLabel = { product: "商品", resource: "免費資源", page: "前往頁面" };
  const IcRelProduct = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
  const IcRelResource = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
  const IcRelPage = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
  const REL_ICONS = { product: IcRelProduct, resource: IcRelResource, page: IcRelPage };
  return (
    <div className="nx-page">
      <div className="ar-wrap ar-head">
        <button className="ar-back" onClick={onBack}>← 回文章列表</button>
        <div className="jn-meta">
          <span className="jn-tag">{article.tag}</span>
          {article.member && <span className="jn-member">會員限定</span>}
          <span className="jn-date">{fmtArticleDate(article.date)}</span>
          <span className="jn-date">瀏覽 <CountUp end={viewCount(article, viewCounts)} /></span>
          {isAdmin && (
            <span className="ar-admin">
              <button onClick={() => setEditing(true)}>編輯</button>
              <button onClick={del}>刪除</button>
            </span>
          )}
        </div>
        <h1 className="ar-title">{article.title}</h1>
        {article.img && <img className="ar-cover" src={article.img} alt={article.title} />}
      </div>

      <div className="ar-wrap ar-body">
        {locked ? (
          <>
            {/* 前段自由閱讀：會員全文在解鎖前完全沒有送到瀏覽器，這裡淡出的是公開的摘要 */}
            <div className="ar-fade" style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 17, lineHeight: 2.05, color: "var(--nx-t1)", whiteSpace: "pre-wrap" }}>{article.excerpt}</p>
            </div>
            <div className="ar-gate">
              <span className="ar-gate-tag">會員限定</span>
              <h2>剩下的內容需要會員密碼</h2>
              <p>88La 訂閱會員會拿到專屬密碼。輸入一次，這次瀏覽期間所有會員文章都保持解鎖；關掉瀏覽器後需重新輸入。</p>
              <div className="ar-gate-form">
                <input type="password" value={pwdInput} onChange={e => { setPwdInput(e.target.value); setPwdErr(false); }} onKeyDown={e => e.key === "Enter" && tryUnlock()} placeholder="輸入會員密碼" aria-label="會員密碼" />
                <button className="nx-btn nx-btn-pri nx-btn-md" onClick={tryUnlock} disabled={unlocking}>{unlocking ? "確認中..." : "解鎖"}</button>
              </div>
              {pwdErr && <p className="ar-gate-err">密碼不正確，請再試一次</p>}
              <p className="ar-gate-foot">還不是會員？<a href={l.instagram || DEFAULTS.links.instagram} target="_blank" rel="noopener noreferrer">到 Instagram 加入訂閱 →</a></p>
            </div>
          </>
        ) : (
          <div className="article-content" style={{ marginBottom: 40 }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(/<[a-z][\s\S]*>/i.test(displayContent || "") ? displayContent : (displayContent || "").replace(/\n/g, "<br>")) }} />
        )}

        {relLinks.length > 0 && (
          <div className="ar-rel">
            <p>相關內容</p>
            {relLinks.map(rl => {
              const product = rl.type === "product" ? (products || []).find(p => String(p.id) === String(rl.key)) : null;
              const resource = rl.type === "resource" ? (resources || []).find(r => String(r.id) === String(rl.key)) : null;
              const Icon = REL_ICONS[rl.type] || IcRelPage;
              return (
                <button key={rl.id} className="ar-rel-item" onClick={() => handleRelNav(rl)}>
                  <i><Icon /></i>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="ar-rel-kind" style={{ display: "block" }}>{relKindLabel[rl.type] || "前往頁面"}</span>
                    <span className="ar-rel-label" style={{ display: "block" }}>{rl.label}</span>
                    {product && <span className="ar-rel-meta" style={{ display: "block" }}>{product.price}</span>}
                    {resource && <span className="ar-rel-meta" style={{ display: "block" }}>{resource.type}</span>}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--nx-o)" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              );
            })}
          </div>
        )}

        <div className="ar-share">
          <button className="nx-btn nx-btn-sec nx-btn-sm" onClick={copy}>{copied ? "✓ 已複製連結" : "複製連結"}</button>
          <a className="nx-btn nx-btn-sec nx-btn-sm" href={"https://social-plugins.line.me/lineit/share?url=" + encodeURIComponent(articleUrl)} target="_blank" rel="noopener noreferrer">分享至 LINE</a>
        </div>

        <div className="ar-community">
          <div>
            <strong>加入 8友 社群</strong>
            <em>一起聊聊關於錢的事，不說教，只分享。</em>
          </div>
          <div>
            <a className="nx-btn nx-btn-pri nx-btn-sm" href={l.lineCommunity || DEFAULTS.links.lineCommunity} target="_blank" rel="noopener noreferrer">LINE 社群</a>
            <a className="nx-btn nx-btn-sec nx-btn-sm" href={l.instagram || DEFAULTS.links.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
        </div>

        <div className="ar-comments">
          <p>留言（<CountUp end={article.comments.length} duration={600} />）</p>
          {article.comments.length === 0 && <p className="nx-lead">還沒有留言，來說說你的想法吧。</p>}
          {article.comments.map((c, i) => (
            <div key={i} className="ar-comment">
              <div className="ar-comment-head"><b>{c.name}</b><span>{c.date}</span></div>
              <p>{c.text}</p>
            </div>
          ))}
          <div className="ar-form">
            <p>留下你的想法</p>
            <input placeholder="暱稱（選填）" value={name} onChange={e => setName(e.target.value)} maxLength={50} />
            <textarea placeholder="你的留言⋯" value={text} onChange={e => setText(e.target.value)} maxLength={500} />
            <div className="ar-form-foot">
              <button className="nx-btn nx-btn-pri nx-btn-md" onClick={submit} disabled={!text.trim()}>送出留言</button>
              {cooldown > 0 && <span>請等待 {cooldown} 秒後再送出</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

//  Write (admin new article)
function Write({ onSave, onBack, tags, products, resources }) {
  const [d, setD] = useState({ title: "", tag: tags[0] || "", excerpt: "", content: "", img: "", relatedLinks: [], member: false });
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const ok = d.title.trim() && d.content.trim();
  const publish = async () => {
    if (!ok || saving) return;
    setSaving(true); setSaveErr("");
    try { await onSave(d); }
    catch { setSaveErr("發布失敗，請稍後再試"); }
    setSaving(false);
  };
  return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "60px 32px" }} className="page-wrap">
      <button className="pg" onClick={onBack} style={{ marginBottom: 32 }}>← 返回</button>
      <p className="section-label" style={{ marginBottom: 28 }}>NEW ARTICLE</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <textarea placeholder="文章標題" value={d.title} onChange={e => setD(p => ({ ...p, title: e.target.value }))} style={{ fontSize: 22, fontWeight: 500, minHeight: 64, resize: "none", border: "none", borderBottom: "1px solid #D0D5DA", lineHeight: 1.4 }} />
        <select value={d.tag} onChange={e => setD(p => ({ ...p, tag: e.target.value }))} style={{ border: "1px solid #D0D5DA", padding: "10px 12px", background: WHITE }}>{tags.map(t => <option key={t}>{t}</option>)}</select>
        <ImgUploader label="封面圖片（選填）" value={d.img} onChange={v => setD(p => ({ ...p, img: v }))} aspect="16/9" />
        <textarea placeholder="摘要（顯示在列表，選填）" value={d.excerpt} onChange={e => setD(p => ({ ...p, excerpt: e.target.value }))} style={{ minHeight: 72, resize: "vertical" }} />
        <RichEditor value={d.content} onChange={v => setD(p => ({ ...p, content: v }))} />
        <RelatedLinkEditor relatedLinks={d.relatedLinks} onChange={v => setD(p => ({ ...p, relatedLinks: v }))} products={products} resources={resources} />
        <label style={{ fontSize: 13, color: MID, display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={d.member} onChange={e => setD(p => ({ ...p, member: e.target.checked }))} style={{ width: "auto" }} />會員限定文章
        </label>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><button className="pb" disabled={!ok || saving} onClick={publish}>{saving ? "發布中..." : "發布"}</button><button className="pg" onClick={onBack}>取消</button>{saveErr && <span style={{ fontSize: 12, color: "#C0392B" }}>{saveErr}</span>}</div>
      </div>
    </div>
  );
}

//  About
//  About（2026-09 改版：從紙本開始 → 三種工具 → 堅持的四件事 → 8友社群 → 數字 → CTA）
const AB_IMG = "/about/";
const AB_TOOLS = [
  { kind: "實體", name: "存錢袋與預算卡", desc: "現金分配、一週一張卡！\n適合想戒掉刷卡、需要看得見錢變少的人。", foot: "文青手帳風、復古電玩風、百鈔分配等款式，可加購便條紙" },
  { kind: "表格", name: "Google Sheets 模板", desc: "免費的分配計劃範本可以直接下載；進階版模板 2.0 一次買斷，終身使用。", foot: "表格永遠屬於你，可以自己改公式" },
  { kind: "訂閱", name: "88La財務導航", desc: "把分配、記帳、診斷串成循環系統！\n適合記帳容易斷掉、需要有人每個月分析數據的人。", foot: "串聯 Google 帳號，資料只有你能看", hi: true },
];
const AB_BELIEFS = [
  ["不是叫你什麼都別買", "省到不像自己的生活，撐不了三個月！\n88La 的目標是讓想花的錢花得安心，不是為了存錢讓自己吃土。"],
  ["數字要你自己輸入", "不介接任何金融機構！\n手動記那 5 秒是刻意留下的，就是要讓你意識到花費的那一秒。"],
  ["不評分、不說教", "月底的診斷不會給你一個分數讓你難過，只會告訴你發生什麼、問題在哪、下個月從哪開始調整。"],
  ["不是每個人都需要付費", "有些人用一張免費分配表就能開始，有些人喜歡自己改模板，有些人需要系統每個月陪著走，所以免費範本跟文章，我也會認真做。"],
];
const AB_QUOTES = [
  "「這筆代墊的錢到底該記在哪？」不確定可以隨時進來問！",
  "大家會貼自己的月底診斷，看別人也在調整，比較不會覺得只有自己做不好。",
  "許願池裡提的功能，真的會出現在下一版。",
];

function About({ isAdmin, links, setLinks, setPage, trustStats, about, setAbout }) {
  const [editLinks, setEditLinks] = useState(false);
  const [editIntro, setEditIntro] = useState(false);
  const ab = { ...DEFAULTS.about, ...(about || {}) };
  const [tmpIntro, setTmpIntro] = useState(ab.intro || "");
  const l = links || DEFAULTS.links;
  const [tmpL, setTmpL] = useState(l);
  const saveLinks = () => { setLinks(tmpL); setEditLinks(false); };
  // 數字只有這一組來源：後台的「信任數據」，跟首頁 Hero 同一份，內文不再重複寫死任何數字
  // 前三格是會變動的實績數字，取後台「信任數據」（跟首頁 Hero 同一份）。
  // 第四格是產品線的結構事實，不是會成長的指標，所以固定寫在這裡不進後台。
  const stats = (trustStats && trustStats.length ? trustStats : DEFAULTS.trustStats).slice(0, 3);
  const AB_STAT_TOOLS = { num: "3", label: "種工具，同一套方法" };
  const to = p => ({ href: pathForPage(p), onClick: e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); setPage(p); } });
  const ext = { target: "_blank", rel: "noopener noreferrer" };
  return (
    <div className="nx-page">
      {/* Hero */}
      <div className="nx-in ab-hero">
        <p className="nx-eyebrow" style={{ letterSpacing: ".16em" }}>關於 88La</p>
        <h1>我不是因為很會理財，<br />才開始做這些工具。</h1>
        <p>我做的每一樣東西，都是為了回答同一個問題：怎麼用最簡單的方式，理好自己的每一分錢，擺脫月光族。</p>
      </div>

      {/* 自我介紹（內容來自後台，Barbara 自己寫的那段） */}
      {ab.intro && (
        <div className="nx-in ab-intro">
          {ab.img && <img src={ab.img} alt="88La" loading="lazy" />}
          <div>
            <p className="nx-eyebrow" style={{ marginBottom: 14 }}>我是誰</p>
            <p className="ab-intro-text">{ab.intro}</p>
          </div>
        </div>
      )}

      {/* 從紙本開始 */}
      <div className="nx-in" style={{ paddingTop: "clamp(32px,5.6vw,72px)" }}>
        <div className="ab-lede">
          <p className="nx-mono" style={{ display: "block", marginBottom: 16, fontSize: 13, color: "var(--nx-o)" }}>最開始</p>
          <h2>一開始，我只是想找到一個<br />自己真的做得下去的方法</h2>
          <p>最早的 88La 沒有 App，只有一本活頁夾、一疊分配卡跟一支筆。<br />月初把收入、固定支出、儲蓄、變動支出寫下來，這週能花的現金放進袋子，花完就是花完了，很土，但確實有效幫我擺脫月光族。</p>
          <p>因為它讓「錢變少」這件事，變成看得到、摸得到的！<br />這個原則後來沒有變過，只是換了載體。</p>
        </div>
        <img className="ab-shot" src={AB_IMG + "binder.webp"} loading="lazy" alt="88La 分配手帳：活頁夾攤開，分配頁上手寫收入、固定支出與儲蓄" />
        <p className="ab-caption">最早的分配頁。收入、固定支出、儲蓄、變動支出，一頁寫完。</p>
      </div>

      <div className="nx-in" style={{ paddingBlock: "clamp(26px,3.4vw,44px) clamp(32px,5.6vw,72px)" }}>
        <div className="ab-pair">
          <div>
            <img src={AB_IMG + "cards.webp"} loading="lazy" alt="88La 每週預算卡與現金放在半透明存錢袋裡" />
            <p><b>一週一張卡。</b>這週能花的現金裝進袋子，花完就是花完了。</p>
          </div>
          <div>
            <img src={AB_IMG + "retro.webp"} loading="lazy" alt="88La 復古電玩風每週預算卡：WEEK1 到 WEEK5 與月結欄位" style={{ objectPosition: "center 30%" }} />
            <p><b>後來有了各種款式。</b>復古電玩風、文青手帳風，因為記帳本身也可以是件想做的事。</p>
          </div>
        </div>
      </div>

      {/* 為什麼有三種工具 */}
      <section className="nx-band" style={{ paddingBlock: "clamp(32px,5.6vw,72px)" }}>
        <div className="nx-in">
          <div style={{ maxWidth: 640, marginBottom: "clamp(24px,3.2vw,40px)" }}>
            <p className="nx-eyebrow" style={{ marginBottom: 14 }}>為什麼有三種工具</p>
            <h2 className="nx-h2" style={{ marginBottom: 16 }}>不是三個產品線，是三種生活方式</h2>
            <p className="nx-body">有人喜歡手寫的儀式感，有人喜歡自己掌控表格，有人需要每月幫他分析！<br />三種產品、三種生活方式，服務的是不同的人。</p>
          </div>
          <div className="ab-tools">
            {AB_TOOLS.map(t => (
              <article key={t.name} className={t.hi ? "ab-hi" : ""}>
                <p className="ab-kind">{t.kind}</p>
                <h3>{t.name}</h3>
                <p className="ab-desc" style={{ whiteSpace: "pre-line" }}>{t.desc}</p>
                <p className="ab-foot">{t.foot}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 我相信什麼 */}
      <section className="nx-dark" style={{ paddingBlock: "clamp(32px,5.6vw,72px)" }}>
        <div className="nx-in">
          <p className="nx-eyebrow nx-eyebrow-dark" style={{ marginBottom: 14 }}>我相信什麼</p>
          <h2 className="nx-h2" style={{ color: "var(--nx-dt)", marginBottom: "clamp(24px,3.2vw,40px)" }}>88La 堅持的四件事</h2>
          <div className="ab-beliefs">
            {AB_BELIEFS.map(([t, d]) => (
              <div key={t}><h3>{t}</h3><p style={{ whiteSpace: "pre-line" }}>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* 8友社群 */}
      <div className="nx-in" style={{ paddingBlock: "clamp(32px,5.6vw,72px) clamp(30px,5vw,64px)" }}>
        <div className="ab-community">
          <div className="ab-quotes">
            {AB_QUOTES.map(q => <article key={q}><p>{q}</p></article>)}
          </div>
          <div>
            <p className="nx-eyebrow" style={{ marginBottom: 14 }}>8友社群</p>
            <h2>一個人記帳容易混亂，<br />有一個地方可以盡量問。</h2>
            <p className="ab-community-p">社群成員會在裡面問「這筆該怎麼記」。這是 88La 最不像產品、但最貼近你的心。</p>
            <p className="ab-community-sub">財務導航的功能，有很多是從社群裡許願來的。</p>
            <div className="ab-community-row">
              <a className="nx-btn nx-btn-sec nx-btn-sec-strong nx-btn-md" href={l.lineCommunity || DEFAULTS.links.lineCommunity} {...ext}>在社群提問</a>
              <a className="nx-btn nx-btn-sec nx-btn-md" href={l.instagram || DEFAULTS.links.instagram} {...ext}>看 Instagram</a>
            </div>
          </div>
        </div>
      </div>

      {/* 數字 */}
      <section className="nx-band" style={{ paddingBlock: "clamp(28px,4vw,52px)" }}>
        <div className="nx-in ab-stats">
          {[...stats, AB_STAT_TOOLS].map((s, i) => (
            <div key={i}><b>{s.num}</b><span>{s.label}</span></div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="nx-in ab-cta">
        <h2>從哪裡開始都可以</h2>
        <p>不確定自己適合哪一種？花 60 秒回答幾個問題，我告訴你先從哪個開始。</p>
        <div className="ab-cta-row">
          <a className="nx-btn nx-btn-pri nx-btn-lg" {...to("tool-quiz")}>60 秒找到我的起點 →</a>
          <a className="nx-btn nx-btn-sec nx-btn-sec-strong nx-btn-md" {...to("app")}>看 88La財務導航</a>
          <a className="nx-btn nx-btn-sec nx-btn-md" {...to("resources")}>下載免費範本</a>
        </div>
      </div>

      {isAdmin && (
        <div style={{ borderTop: `2px dashed ${BORDER}`, background: GRAY, padding: "20px" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <p style={{ fontSize: 13, color: MID, marginBottom: 10, fontWeight: 500 }}>後台：聯絡與社群連結（頁尾、文章頁也會用到）</p>
            {!editLinks ? (
              <button className="pg" style={{ fontSize: 12 }} onClick={() => { setTmpL(l); setEditLinks(true); }}>編輯連結</button>
            ) : (
              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  {[["lineCommunity", "LINE 社群"], ["lineOfficial", "LINE 官方帳號"], ["instagram", "Instagram"], ["email", "聯絡 Email"]].map(([k, label]) => (
                    <div key={k}>
                      <p style={{ fontSize: 12, color: MID, marginBottom: 4 }}>{label}</p>
                      <input value={tmpL[k] ?? ""} onChange={e => setTmpL(p => ({ ...p, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="pb" onClick={saveLinks}>儲存</button>
                  <button className="pg" onClick={() => setEditLinks(false)}>取消</button>
                </div>
              </div>
            )}
            <div style={{ marginTop: 18, background: WHITE, border: `1px solid ${BORDER}`, padding: 20 }}>
              <p style={{ fontSize: 12, color: MID, marginBottom: 10, fontWeight: 500 }}>自我介紹（頁面上「我是誰」那段）</p>
              {!editIntro ? (
                <button className="pg" style={{ fontSize: 12 }} onClick={() => { setTmpIntro(ab.intro || ""); setEditIntro(true); }}>編輯自我介紹</button>
              ) : (
                <>
                  <textarea value={tmpIntro} onChange={e => setTmpIntro(e.target.value)} style={{ minHeight: 200, border: "1px solid #D0D5DA", padding: 10, background: WHITE, marginBottom: 12 }} />
                  <ImgUploader label="頭像／照片（選填）" value={ab.img} onChange={v => setAbout({ ...ab, img: v })} aspect="1/1" maxHeight={160} />
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button className="pb" onClick={() => { setAbout({ ...ab, intro: tmpIntro }); setEditIntro(false); }}>儲存</button>
                    <button className="pg" onClick={() => setEditIntro(false)}>取消</button>
                  </div>
                </>
              )}
            </div>
            <p style={{ fontSize: 12, color: LIGHT, marginTop: 14, lineHeight: 1.8 }}>
              下方那排數字：前三格取自後台的「信任數據」（與首頁 Hero 同一份，在首頁編輯），第四格「3 種工具」寫死在程式裡。本頁內文刻意不重複寫任何數字，改一個地方就全站一致。
              三張實拍照放在 repo 的 <code>public/about/</code>。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Shop({ products, setProducts, isAdmin, shopCopy, setShopCopy }) {
  const sc = { ...DEFAULTS.shopCopy, ...(shopCopy || {}) };
  const [editCopy, setEditCopy] = useState(false);
  const [tmpCopy, setTmpCopy] = useState(sc);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "digital", price: "", desc: "", url: "", img: "" });
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const startAdd = () => { setForm({ name: "", type: "digital", price: "", desc: "", url: "", img: "" }); setEditing("new"); };
  const startEdit = p => { setForm({ ...p }); setEditing(p.id); };
  const [priceErr, setPriceErr] = useState("");
  const [shopUrlErr, setShopUrlErr] = useState("");
  const save = () => {
    const p = form.price.trim();
    if (p && !/^NT\$\s?\d[\d,]*$/.test(p)) { setPriceErr("格式範例：NT$299 或 NT$ 1,299"); return; }
    if (form.url && !isValidUrl(form.url)) { setShopUrlErr("連結格式不正確，需以 https:// 開頭"); return; }
    setPriceErr(""); setShopUrlErr("");
    if (editing === "new") setProducts(prev => [...prev, { ...form, id: Date.now() }]); else setProducts(prev => prev.map(p => p.id === editing ? { ...p, ...form } : p)); setEditing(null);
  };
  const del = id => { if (confirm("確定刪除？")) setProducts(prev => prev.filter(p => p.id !== id)); };
  const move = (idx, dir) => setProducts(prev => moveItem(prev, idx, dir));
  return (
    <div>
      <div style={{ background: GRAD, padding: "48px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div><p className="section-label" style={{ marginBottom: 8 }}>{sc.label}</p><h1 style={{ fontSize: 26, fontWeight: 700, color: CHAR, marginBottom: 8 }}>{sc.heading}</h1><p style={{ fontSize: 13, color: MID }}>{sc.sub}</p>
            {isAdmin && <span onClick={() => { setTmpCopy(sc); setEditCopy(true); }} style={{ fontSize: 11, color: O, cursor: "pointer", marginTop: 4, display: "inline-block" }}>編輯文字</span>}
          </div>
          {isAdmin && <button className="pb" onClick={startAdd}>＋ 新增商品</button>}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px" }} className="page-wrap">
        {editCopy && (
          <div style={{ background: GRAY, padding: "24px", marginBottom: 32, border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>編輯頁面文字</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標籤</p><input value={tmpCopy.label} onChange={e => setTmpCopy(p => ({ ...p, label: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題</p><input value={tmpCopy.heading} onChange={e => setTmpCopy(p => ({ ...p, heading: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>副標題</p><input value={tmpCopy.sub} onChange={e => setTmpCopy(p => ({ ...p, sub: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>測驗小卡標籤</p><input value={tmpCopy.quizTag} onChange={e => setTmpCopy(p => ({ ...p, quizTag: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>測驗小卡標題</p><input value={tmpCopy.quizHeading} onChange={e => setTmpCopy(p => ({ ...p, quizHeading: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>測驗小卡說明</p><input value={tmpCopy.quizDesc} onChange={e => setTmpCopy(p => ({ ...p, quizDesc: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>測驗小卡按鈕</p><input value={tmpCopy.quizBtn} onChange={e => setTmpCopy(p => ({ ...p, quizBtn: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>未上架商品的按鈕文字</p><input value={tmpCopy.soldOut} onChange={e => setTmpCopy(p => ({ ...p, soldOut: e.target.value }))} /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={() => { setShopCopy(tmpCopy); setEditCopy(false); }}>儲存</button><button className="pg" onClick={() => setEditCopy(false)}>取消</button></div>
          </div>
        )}
        {editing && (
          <div style={{ background: GRAY, padding: "32px", marginBottom: 40, border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 12, letterSpacing: "1px", color: MID, marginBottom: 20 }}>{editing === "new" ? "新增商品" : "編輯商品"}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="grid2">
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>商品名稱</p><input value={form.name} onChange={sf("name")} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>類型</p><select value={form.type} onChange={sf("type")} style={{ border: "1px solid #D0D5DA", padding: "10px 12px", background: WHITE, width: "100%" }}><option value="digital">數位商品</option><option value="physical">實體商品</option></select></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>價格</p><input placeholder="NT$ 299" value={form.price} onChange={e => { sf("price")(e); setPriceErr(""); }} />{priceErr && <p style={{ fontSize: 11, color: "#C0392B", marginTop: 4 }}>{priceErr}</p>}</div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>購買連結</p><input value={form.url} onChange={e => { sf("url")(e); setShopUrlErr(""); }} placeholder="https://..." />{shopUrlErr && <p style={{ fontSize: 11, color: "#C0392B", marginTop: 4 }}>{shopUrlErr}</p>}</div>
            </div>
            <div style={{ marginBottom: 20 }}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>商品說明</p><textarea value={form.desc} onChange={sf("desc")} style={{ minHeight: 80, border: "1px solid #D0D5DA", padding: "10px", background: WHITE }} /></div>
            <div style={{ marginBottom: 24 }}><ImgUploader label="圖片（選填）" value={form.img} onChange={v => setForm(p => ({ ...p, img: v }))} aspect="4/3" /></div>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.name.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
          </div>
        )}
        <div style={{ background:"#FFF8F3", border:`1px solid ${BORDER}`, borderRadius:12, padding:"40px 48px", marginBottom:40 }}>
          <p style={{ fontSize:11, color:O, fontWeight:700, letterSpacing:"1.5px", marginBottom:14 }}>{sc.quizTag}</p>
          <h2 style={{ fontSize:28, fontWeight:800, color:CHAR, marginBottom:12, lineHeight:1.3 }}>{sc.quizHeading}</h2>
          <p style={{ fontSize:14, color:MID, lineHeight:1.85, marginBottom:28 }}>{sc.quizDesc}</p>
          <a href={QUIZ_URL} target="_blank" rel="noopener noreferrer"><button className="pb">{sc.quizBtn}</button></a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }} className="grid3">
          {products.map((p, idx) => (
            <Reveal key={p.id} delay={Math.min(idx * 80, 400)}>
            <div style={{ background: WHITE, borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", position: "relative", border: `1px solid ${BORDER}`, transition: "box-shadow .3s, transform .3s", height: 440, display: "flex", flexDirection: "column" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-6px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {isAdmin && <OrdBtns idx={idx} total={products.length} onMove={move} style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }} />}
              <div style={{ height: 200, flexShrink: 0, background: "#E8EAEC", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.img ? <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <span style={{ fontSize: 12, color: LIGHT, letterSpacing: "1px" }}>{p.type === "digital" ? "DIGITAL" : "PHYSICAL"}</span>}
              </div>
              <div style={{ padding: "20px 22px 24px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span className={p.type === "digital" ? "tag" : "tagn"} style={{ marginBottom: 10, display: "inline-block", flexShrink: 0, alignSelf: "flex-start" }}>{p.type === "digital" ? "數位商品" : "實體商品"}</span>
                <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: O, flexShrink: 0, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: MID, lineHeight: 1.8, marginBottom: 14, whiteSpace: "pre-wrap", flex: 1, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.desc}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: O }}>{p.price}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {p.url
                      ? <a href={p.url} target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "8px 16px" }}>購買 →</button></a>
                      : <button className="pg" style={{ fontSize: 12, padding: "8px 16px", opacity: .45, cursor: "default" }} disabled>{sc.soldOut}</button>}
                    {isAdmin && <><button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => startEdit(p)}>編輯</button><button className="pg" style={{ fontSize: 11, padding: "5px 10px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => del(p.id)}>刪除</button></>}
                  </div>
                </div>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

//  IG / 最新消息
function IG({ igPosts, setIgPosts, isAdmin, links, igCopy, setIgCopy }) {
  const igc = { ...DEFAULTS.igCopy, ...(igCopy || {}) };
  const [editCopy, setEditCopy] = useState(false);
  const [tmpCopy, setTmpCopy] = useState(igc);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", url: "", thumb: "", type: "post" });
  const [igUrlErr, setIgUrlErr] = useState("");
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const startAdd = () => { setForm({ title: "", url: "", thumb: "", type: "post" }); setEditing("new"); setIgUrlErr(""); };
  const startEdit = p => { setForm({ ...p }); setEditing(p.id); setIgUrlErr(""); };
  const save = () => {
    if (form.url && !isValidUrl(form.url)) { setIgUrlErr("連結格式不正確，需以 https:// 開頭"); return; }
    setIgUrlErr("");
    if (editing === "new") setIgPosts(prev => [...prev, { ...form, id: Date.now() }]); else setIgPosts(prev => prev.map(p => p.id === editing ? { ...p, ...form } : p)); setEditing(null);
  };
  const del = id => { if (confirm("確定刪除？")) setIgPosts(prev => prev.filter(p => p.id !== id)); };
  const move = (idx, dir) => setIgPosts(prev => moveItem(prev, idx, dir));
  const l = links || DEFAULTS.links;
  return (
    <div>
      <div style={{ background: GRAD, padding: "52px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 10 }}>{igc.label}</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: CHAR }}>{igc.heading}</h1>
            <p style={{ fontSize: 13, color: MID, marginTop: 8 }}>{igc.sub}</p>
            {isAdmin && <span onClick={() => { setTmpCopy(igc); setEditCopy(true); }} style={{ fontSize: 11, color: O, cursor: "pointer", marginTop: 6, display: "inline-block" }}>編輯文字</span>}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {isAdmin && <button className="pb" onClick={startAdd}>＋ 新增</button>}
            <a href={l.instagram} target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "6px 14px" }}>{igc.profileBtn}</button></a>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px" }} className="page-wrap">
        {editCopy && (
          <div style={{ background: GRAY, padding: "24px", marginBottom: 32, border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>編輯頁面文字</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標籤</p><input value={tmpCopy.label} onChange={e => setTmpCopy(p => ({ ...p, label: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題</p><input value={tmpCopy.heading} onChange={e => setTmpCopy(p => ({ ...p, heading: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>副標題</p><input value={tmpCopy.sub} onChange={e => setTmpCopy(p => ({ ...p, sub: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>IG 主頁按鈕文字</p><input value={tmpCopy.profileBtn} onChange={e => setTmpCopy(p => ({ ...p, profileBtn: e.target.value }))} /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={() => { setIgCopy(tmpCopy); setEditCopy(false); }}>儲存</button><button className="pg" onClick={() => setEditCopy(false)}>取消</button></div>
          </div>
        )}
        {editing && (
          <div style={{ background: GRAY, padding: "32px", marginBottom: 40, border: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>類型</p>
                <div style={{ display: "flex", gap: 12 }}>
                  {[["post","貼文"],["video","影片/Reels"]].map(([v,l]) => (
                    <label key={v} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", fontSize: 13, color: MID }}>
                      <input type="radio" name="igtype" value={v} checked={form.type === v} onChange={sf("type")} style={{ width: "auto" }} />{l}
                    </label>
                  ))}
                </div>
              </div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>標題 / 說明</p><input value={form.title} onChange={sf("title")} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>連結（Instagram / YouTube）</p><input value={form.url} onChange={e => { sf("url")(e); setIgUrlErr(""); }} placeholder="https://..." />{igUrlErr && <p style={{ fontSize: 11, color: "#C0392B", marginTop: 4 }}>{igUrlErr}</p>}</div>
              <ImgUploader label="縮圖（選填）" value={form.thumb} onChange={v => setForm(p => ({ ...p, thumb: v }))} aspect="1/1" />
            </div>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.title.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }} className="grid-ig">
          {igPosts.map((p, idx) => {
            const ytId = getYouTubeId(p.url || "");
            return (
              <Reveal key={p.id} delay={Math.min(idx * 80, 400)}>
              <div key={p.id} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", position: "relative", transition: "box-shadow .24s, transform .24s", height: 300, display: "flex", flexDirection: "column" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-6px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {ytId ? (
                  <div style={{ height: 200, flexShrink: 0, overflow: "hidden" }}>
                    <iframe src={`https://www.youtube.com/embed/${ytId}`} title={p.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none", display: "block" }} loading="lazy" />
                  </div>
                ) : (
                  <a href={p.url || l.instagram} target="_blank" rel="noopener noreferrer" style={{ display: "block", flexShrink: 0 }}>
                    <div style={{ height: 200, background: "#EBEBEB", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {p.thumb ? <img src={p.thumb} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <span style={{ fontSize: 12, color: LIGHT, letterSpacing: "2px" }}>{p.type === "video" ? "VIDEO" : "IG"}</span>}
                      <div style={{ position: "absolute", inset: 0, background: "rgba(30,20,10,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(30,20,10,.4)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(30,20,10,0)"}
                      >
                        {p.type === "video" && <svg width="36" height="36" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                      </div>
                    </div>
                  </a>
                )}
                <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flex: 1, overflow: "hidden" }}>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: CHAR, flex: 1, whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.title}</p>
                  {isAdmin && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                      <OrdBtns idx={idx} total={igPosts.length} onMove={move} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 11, color: O, cursor: "pointer" }} onClick={() => startEdit(p)}>編輯</span>
                        <span style={{ fontSize: 11, color: "#E74C3C", cursor: "pointer" }} onClick={() => del(p.id)}>刪除</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}

//  Community (8友社群)
const COMMUNITY_HERO_FIELDS = [
  { key: "eyebrow", label: "小標籤（Eyebrow）" },
  { key: "headline", label: "主標題" },
  { key: "subhead", label: "副標題", multiline: true }
];

function Community({ igPosts, links, setPage, isAdmin, communityHero, setCommunityHero, communityCopy, setCommunityCopy, memberFeedback, setMemberFeedback }) {
  const l = links || DEFAULTS.links;
  const cc = { ...DEFAULTS.communityCopy, ...(communityCopy || {}) };
  const [editCopy, setEditCopy] = useState(false);
  const [tmpCopy, setTmpCopy] = useState(cc);
  const previewPosts = (igPosts || []).slice(0, 3);
  const feedback = memberFeedback || [];
  const feedbackTrackRef = useRef(null);
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [efEditing, setEfEditing] = useState(null);
  const [efForm, setEfForm] = useState({ img: "", caption: "" });
  const startAddFeedback = () => { setEfForm({ img: "", caption: "" }); setEfEditing("new"); };
  const startEditFeedback = f => { setEfForm({ ...f }); setEfEditing(f.id); };
  const saveFeedback = () => {
    if (efEditing === "new") setMemberFeedback(prev => [...(prev || []), { ...efForm, id: Date.now() }]);
    else setMemberFeedback(prev => (prev || []).map(f => f.id === efEditing ? { ...f, ...efForm } : f));
    setEfEditing(null);
  };
  const delFeedback = id => { if (confirm("確定刪除？")) setMemberFeedback(prev => (prev || []).filter(f => f.id !== id)); };
  const moveFeedback = (idx, dir) => setMemberFeedback(prev => moveItem(prev || [], idx, dir));
  const scrollFeedback = dir => {
    const track = feedbackTrackRef.current;
    if (!track) return;
    const slide = track.querySelector(".feedback-slide");
    const step = slide ? slide.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };
  const scrollFeedbackTo = idx => {
    const track = feedbackTrackRef.current;
    const slide = track?.querySelectorAll(".feedback-slide")[idx];
    if (!track || !slide) return;
    slide.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };
  const updateFeedbackIndex = () => {
    const track = feedbackTrackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll(".feedback-slide"));
    if (!slides.length) return;
    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let nearest = 0;
    let nearestDist = Infinity;
    slides.forEach((slide, idx) => {
      const rect = slide.getBoundingClientRect();
      const dist = Math.abs(rect.left + rect.width / 2 - trackCenter);
      if (dist < nearestDist) {
        nearest = idx;
        nearestDist = dist;
      }
    });
    setFeedbackIndex(nearest);
  };
  return (
    <PageHero title="8友社群頁文字" fields={COMMUNITY_HERO_FIELDS} data={communityHero} setData={setCommunityHero} defaults={DEFAULTS.communityHero} isAdmin={isAdmin}>
      {(h, editLink) => (
    <div>
      <div style={{ background: GRAD, padding: "72px 32px 64px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 16 }}>{h.eyebrow}</p>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: CHAR, lineHeight: 1.45, marginBottom: 18 }}>{h.headline}</h1>
          <p style={{ fontSize: 15, color: MID, lineHeight: 1.9 }}>{h.subhead}</p>
          {editLink && <p style={{ marginTop: 12 }}>{editLink}</p>}
        </div>
      </div>
      <div style={{ background: WHITE, padding: "52px 32px", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: CHAR, lineHeight: 1.9, marginBottom: 14 }}>{cc.introPara1}</p>
          <p style={{ fontSize: 15, color: CHAR, lineHeight: 1.9 }}>{cc.introPara2}</p>
          {isAdmin && <span onClick={() => { setTmpCopy(cc); setEditCopy(true); }} style={{ fontSize: 12, color: O, cursor: "pointer", marginTop: 14, display: "inline-block" }}>編輯本頁文字</span>}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 32px" }} className="page-wrap">
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>{cc.joinLabel}</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: CHAR }}>{cc.joinHeading}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24, marginBottom: 80 }} className="grid2">
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, boxShadow: "0 2px 10px rgba(0,0,0,.06)", transition: "box-shadow .3s, transform .3s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-6px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <span style={{ fontSize: 12, color: O, fontWeight: 500, background: O2, padding: "4px 12px", borderRadius: 999, display: "inline-block", marginBottom: 16 }}>{cc.lineBadge}</span>
            <h3 style={{ fontSize: 18, fontWeight: 500, color: CHAR, marginBottom: 10 }}>{cc.lineTitle}</h3>
            <p style={{ fontSize: 14, color: MID, lineHeight: 1.8, marginBottom: 24 }}>{cc.lineDesc}</p>
            <span style={{ display: "inline-block", background: GRAY, color: LIGHT, padding: "12px 26px", borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: "default" }}>{cc.linePill}</span>
          </div>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, boxShadow: "0 2px 10px rgba(0,0,0,.06)", transition: "box-shadow .3s, transform .3s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-6px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <span style={{ fontSize: 12, color: O, fontWeight: 500, background: O2, padding: "4px 12px", borderRadius: 999, display: "inline-block", marginBottom: 16 }}>{cc.igBadge}</span>
            <h3 style={{ fontSize: 18, fontWeight: 500, color: CHAR, marginBottom: 10 }}>{cc.igTitle}</h3>
            <p style={{ fontSize: 14, color: MID, lineHeight: 1.8, marginBottom: 24 }}>{cc.igDesc}</p>
            <a href={l.instagram} target="_blank" rel="noopener noreferrer"><button className="pb">{cc.igBtn}</button></a>
          </div>
        </div>
        {previewPosts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <p className="section-label" style={{ marginBottom: 12 }}>{cc.recentLabel}</p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: CHAR }}>{cc.recentHeading}</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20, marginBottom: 28 }} className="grid-ig">
              {previewPosts.map(p => (
                <a key={p.id} href={p.url || l.instagram} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                  <div style={{ position: "relative", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", aspectRatio: "1/1", transition: "transform .24s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    {p.thumb ? <img src={p.thumb} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <div style={{ width: "100%", height: "100%", background: GRAY, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12, color: LIGHT, letterSpacing: "2px" }}>IG</span></div>}
                    <div style={{ position: "absolute", bottom: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: "rgba(26,26,26,.55)", color: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/></svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            <p style={{ textAlign: "center" }}><span onClick={() => setPage("ig")} style={{ fontSize: 13, color: O, cursor: "pointer" }}>{cc.moreLink}</span></p>
          </div>
        )}
        {(feedback.length > 0 || isAdmin) && (
          <div style={{ marginTop: previewPosts.length > 0 ? 80 : 0 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <p className="section-label" style={{ marginBottom: 12 }}>{cc.feedbackLabel}</p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: CHAR }}>{cc.feedbackHeading}</h2>
            </div>
            {isAdmin && (
              <div style={{ textAlign: "right", marginBottom: 16 }}>
                <button className="pb" style={{ fontSize: 12, padding: "6px 14px" }} onClick={startAddFeedback}>＋ 新增</button>
              </div>
            )}
            {efEditing && (
              <div style={{ background: GRAY, padding: 24, marginBottom: 24, border: `1px solid ${BORDER}` }}>
                <div style={{ marginBottom: 16 }}><ImgUploader label="回饋截圖" value={efForm.img} onChange={v => setEfForm(p => ({ ...p, img: v }))} aspect="3/4" maxHeight={420} boxMaxWidth={320} /></div>
                <div style={{ marginBottom: 16 }}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>說明文字（例如會員暱稱或一句心得）</p><input value={efForm.caption} onChange={e => setEfForm(p => ({ ...p, caption: e.target.value }))} /></div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="pb" onClick={saveFeedback} disabled={!efForm.img}>儲存</button>
                  <button className="pg" onClick={() => setEfEditing(null)}>取消</button>
                </div>
              </div>
            )}
            {feedback.length === 0 ? (
              isAdmin && <p style={{ textAlign: "center", fontSize: 13, color: LIGHT, padding: "24px 0" }}>還沒有回饋截圖，點上面「＋ 新增」上傳第一張。</p>
            ) : (
              <div>
                {feedback.length > 1 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 14 }}>
                    <button type="button" aria-label="上一則回饋" className="pg" onClick={() => scrollFeedback(-1)} style={{ width: 40, height: 40, padding: 0, borderRadius: "50%", fontSize: 18, color: O }}>←</button>
                    <button type="button" aria-label="下一則回饋" className="pg" onClick={() => scrollFeedback(1)} style={{ width: 40, height: 40, padding: 0, borderRadius: "50%", fontSize: 18, color: O }}>→</button>
                  </div>
                )}
                <div
                  ref={feedbackTrackRef}
                  className="feedback-carousel-track"
                  onScroll={updateFeedbackIndex}
                  style={{ display: "flex", gap: 20, overflowX: "auto", scrollSnapType: "x mandatory", scrollPadding: "0 24px", padding: "4px 4px 18px", WebkitOverflowScrolling: "touch" }}
                >
                  {feedback.map((f, idx) => (
                    <div key={f.id} className="feedback-slide" style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
                      <div style={{ aspectRatio: "3/4", background: GRAY, overflow: "hidden" }}>
                        <img src={f.img} alt={f.caption || "8友回饋"} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      </div>
                      <div style={{ minHeight: isAdmin ? 72 : 54, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <p style={{ fontSize: 13, color: MID, lineHeight: 1.7 }}>{f.caption}</p>
                        {isAdmin && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                            <OrdBtns idx={idx} total={feedback.length} onMove={moveFeedback} />
                            <div style={{ display: "flex", gap: 8 }}>
                              <span style={{ fontSize: 11, color: O, cursor: "pointer" }} onClick={() => startEditFeedback(f)}>編輯</span>
                              <span style={{ fontSize: 11, color: "#E74C3C", cursor: "pointer" }} onClick={() => delFeedback(f.id)}>刪除</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {feedback.length > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4 }}>
                    {feedback.map((f, idx) => (
                      <button
                        key={f.id}
                        type="button"
                        aria-label={`前往第 ${idx + 1} 則回饋`}
                        onClick={() => scrollFeedbackTo(idx)}
                        style={{ width: feedbackIndex === idx ? 18 : 7, height: 7, borderRadius: 999, padding: 0, background: feedbackIndex === idx ? O : "rgba(200,90,20,.22)", transition: "width .2s, background .2s" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ background: CHAR, padding: "64px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <p style={{ fontSize: 12, color: CORAL, letterSpacing: "1px", fontWeight: 600, marginBottom: 14 }}>{cc.ctaLabel}</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: WHITE, marginBottom: 14 }}>{cc.ctaHeading}</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)", lineHeight: 1.8, marginBottom: 28 }}>{cc.ctaDesc}</p>
          <a href={l.instagram} target="_blank" rel="noopener noreferrer"><button style={{ background: CORAL, color: CHAR, border: "none", padding: "12px 26px", borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>{cc.ctaBtn}</button></a>
        </div>
      </div>
      {editCopy && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 61, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: WHITE, padding: 32, width: "100%", maxWidth: 560, maxHeight: "80vh", overflowY: "auto" }}>
            <p style={{ fontSize: 13, letterSpacing: "2px", color: CORAL2, marginBottom: 20, fontWeight: 500 }}>編輯 8友社群頁文字</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                ["introPara1", "開頭段落 1"], ["introPara2", "開頭段落 2"],
                ["joinLabel", "「加入方式」標籤"], ["joinHeading", "「加入方式」標題"],
                ["lineBadge", "LINE 卡片徽章"], ["lineTitle", "LINE 卡片標題"], ["lineDesc", "LINE 卡片說明"], ["linePill", "LINE 卡片按鈕（尚未開放狀態）"],
                ["igBadge", "IG 卡片徽章"], ["igTitle", "IG 卡片標題"], ["igDesc", "IG 卡片說明"], ["igBtn", "IG 卡片按鈕"],
                ["recentLabel", "「最新動態」標籤"], ["recentHeading", "「最新動態」標題"], ["moreLink", "查看更多連結文字"],
                ["feedbackLabel", "「會員迴響」標籤"], ["feedbackHeading", "「會員迴響」標題"],
                ["ctaLabel", "結尾標籤"], ["ctaHeading", "結尾標題"], ["ctaDesc", "結尾說明"], ["ctaBtn", "結尾按鈕"],
              ].map(([k, label]) => (
                <div key={k}>
                  <p style={{ fontSize: 12, color: MID, marginBottom: 4 }}>{label}</p>
                  <input value={tmpCopy[k] ?? ""} onChange={e => setTmpCopy(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pb" onClick={() => { setCommunityCopy(tmpCopy); setEditCopy(false); }}>儲存</button>
              <button className="pg" onClick={() => setEditCopy(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </PageHero>
  );
}


//  Envelope（2026-09 改版：大圖 Hero → 存錢袋測驗 → 為什麼是紙袋 → 怎麼用三步 → 誰適合＋規格 → 搭配 App）
const BAG_IMG = "/bag/";
const BAG_STORE_URL = "https://myship.7-11.com.tw/general/detail/GM2510287339100";
const BAG_WHY = [
  ["分開放，就不會混著花", "一個袋子一個用途。生活費、大筆開銷預存、儲蓄各自分開"],
  ["看得見剩多少", "不用打開 App，摸一下厚度就知道這週還能不能出去吃"],
  ["不用電、不會忘", "放在抽屜或包包裡，每次拿錢都會經過它"],
];
const BAG_STEPS = [
  ["01", "寫上用途和金額", "領薪後照 App 排好的預算，把每個袋子要放多少寫在上面", "step-1.webp", "在存錢袋的週別卡片上寫下用途與金額"],
  ["02", "一次領好、一次裝好", "月初領一次現金分裝完，之後就不再回 ATM。省下最容易失守的那個動作", "step-2.webp", "把現金一次分裝進各個存錢袋"],
  ["03", "月底看剩下多少", "袋子裡剩的就是這個月省下的。想留就留，想存就存進儲蓄", "step-3.webp", "存錢袋收在活頁夾裡，月底翻開清點"],
];
const BAG_FIT = [
  ["刷卡容易失控的人", "改成現金消費，額度就是袋子裡那些，花完就結束"],
  ["記帳老是斷掉的人", "忘記記帳沒關係，袋子的厚度就是最誠實的餘額"],
  ["在存特定目標的人", "旅遊、換手機、年繳保費，一個目標一個袋子，進度一眼看見"],
  ["和家人共用開銷的人", "共同生活費放在同一個袋子，不用互相報帳"],
];
// 規格：尺寸／數量／價格三項各款不同，一律導到賣貨便看，不在官網另外維護一份會過期的數字
const BAG_SPEC = [
  ["尺寸", "依款式而定"],
  ["材質", "PVC+膠片"],
  ["一組數量", "依款式而定"],
  ["價格", "依款式而定"],
  ["出貨方式", "7-11 賣貨便"],
];

function Envelope({ products, setPage, isAdmin }) {
  // 賣場網址以商品資料為準（跟 /shop 同一份），沒設定時退回已知的賣貨便網址
  const storeUrl = (products || []).find(p => p.type === "physical" && p.url)?.url || BAG_STORE_URL;
  const to = p => ({ href: pathForPage(p), onClick: e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); setPage(p); } });
  const ext = { target: "_blank", rel: "noopener noreferrer" };
  return (
    <div className="nx-page">
      {/* Hero */}
      <section className="bg-hero">
        <div className="bg-hero-copy">
          <p className="nx-eyebrow" style={{ letterSpacing: ".16em", marginBottom: 16 }}>實體工具</p>
          <h1>88La 存錢袋</h1>
          <p className="bg-hero-sub">把消費回歸現金！<br className="nx-hide-mob" />鈔票實際裝進袋子裡，看得到、摸得到，比信用卡更有「消費痛感」。</p>
          <div style={{ marginBottom: 20 }}>
            <a className="nx-btn nx-btn-pri nx-btn-md" href={storeUrl} {...ext}>到賣場逛逛 ↗</a>
          </div>
          <p className="bg-hero-note">於 7-11 賣貨便下單、超商取貨付款。價格與庫存以賣貨便頁面為準</p>
        </div>
        <img className="bg-hero-img" src={BAG_IMG + "hero.webp"} alt="88La 存錢袋：透明週別預算袋與現金" />
      </section>

      {/* 存錢袋測驗 */}
      <section className="bg-quiz">
        <div>
          <h2>不確定哪一種工具適合你？</h2>
          <p>3 到 5 題，從你最想解決的事情開始，結果只給一個第一推薦</p>
        </div>
        <a className="nx-btn nx-btn-pri nx-btn-sm" href={QUIZ_URL} {...ext}>開始測驗 →</a>
      </section>

      {/* 為什麼是紙袋 */}
      <section style={{ paddingBlock: "clamp(28px,4.2vw,52px)", borderBottom: "1px solid var(--nx-bd)" }}>
        <div className="nx-in bg-why">
          <h2>讓你的支出，不被忽略</h2>
          <p>App 裡的「儲蓄」是一個欄位；存錢袋是一個位置。錢從錢包移到袋子那一秒，你才真的做了決定。這是 88La 的三種理財工具中，最有「實體感」的一個。</p>
          <div className="bg-why-cards">
            {BAG_WHY.map(([t, d]) => (
              <article key={t}><h3>{t}</h3><p>{d}</p></article>
            ))}
          </div>
        </div>
      </section>

      {/* 怎麼用 */}
      <section className="nx-band" style={{ paddingBlock: "clamp(28px,4.2vw,52px)" }}>
        <div className="nx-in">
          <p className="nx-eyebrow nx-eyebrow-mute" style={{ marginBottom: 28, letterSpacing: ".12em" }}>怎麼用</p>
          <div className="bg-steps">
            {BAG_STEPS.map(([n, t, d, img, alt]) => (
              <div key={n}>
                <img src={BAG_IMG + img} loading="lazy" alt={alt} />
                <div className="bg-step-head"><b>{n}</b><span>{t}</span></div>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 誰適合用 + 規格 */}
      <section style={{ paddingBlock: "clamp(28px,4.2vw,52px)", borderBottom: "1px solid var(--nx-bd)" }}>
        <div className="nx-in bg-fit">
          <div>
            <h2>誰適合用</h2>
            {BAG_FIT.map(([t, d]) => (
              <div key={t} className="bg-fit-item"><strong>{t}</strong><span>{d}</span></div>
            ))}
          </div>
          <div className="bg-spec">
            <p>規格</p>
            <dl>
              {BAG_SPEC.map(([k, v]) => (
                <div key={k} className="bg-spec-row"><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <a className="nx-btn nx-btn-pri nx-btn-block nx-btn-md" href={storeUrl} {...ext}>到賣場看完整規格 ↗</a>
            <p style={{ marginTop: 14, fontSize: 13, textAlign: "center" }}>
              <a className="nx-link" {...to("shop")}>看三款存錢袋的差別與定價</a>
            </p>
          </div>
        </div>
      </section>

      {/* 搭配 App */}
      <section style={{ background: "var(--nx-os)", paddingBlock: "clamp(28px,4.2vw,52px)" }}>
        <div className="nx-in bg-app">
          <div>
            <h2>袋子負責「不要動」<br />App 負責「知道去哪」</h2>
            <p>存錢袋不會算給你聽。金額怎麼分、卡費要留多少、月底該調哪一塊，那些在財務導航裡。兩個一起用最順：App 排好比例，袋子執行。</p>
            <div className="bg-app-row">
              <a className="nx-btn nx-btn-pri nx-btn-md" {...to("app")}>免費體驗財務導航</a>
              <a className="nx-btn nx-btn-sec nx-btn-sec-strong nx-btn-md" {...to("resources")}>先用免費工具算</a>
            </div>
          </div>
          <img src={BAG_IMG + "with-app.webp"} loading="lazy" alt="旅遊目標存錢袋，袋面寫著目標金額與進度" />
        </div>
      </section>

      {/* 手機置底 CTA */}
      <div className="nx-sticky">
        <div>
          <b>88La 存錢袋</b>
          <span>7-11 賣貨便下單</span>
        </div>
        <a className="nx-btn nx-btn-pri nx-btn-sm" href={storeUrl} {...ext}>到賣場逛逛 ↗</a>
      </div>

      {isAdmin && (
        <div style={{ borderTop: `2px dashed ${BORDER}`, background: GRAY, padding: "20px" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <p style={{ fontSize: 12, color: MID, marginBottom: 10, fontWeight: 500 }}>後台說明</p>
            <p style={{ fontSize: 12, color: LIGHT, lineHeight: 1.8 }}>
              本頁的五張實拍照放在 repo 的 <code>public/bag/</code>（主視覺、三張步驟圖、搭配 App 圖），要換照片給我新檔案即可，不從後台上傳。
            </p>
            <p style={{ fontSize: 12, color: LIGHT, marginTop: 14, lineHeight: 1.8 }}>
              款式、價格與賣場連結在
              <span onClick={() => setPage("shop")} style={{ color: O, cursor: "pointer", textDecoration: "underline", margin: "0 4px" }}>商品管理</span>
              維護；本頁只取實體商品的賣場連結，不再重複列出價格，避免跟賣貨便的數字不一致。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const GOODS_HERO_FIELDS = [
  { key: "eyebrow", label: "小標籤（Eyebrow）" },
  { key: "headline", label: "主標題" },
  { key: "subhead", label: "副標題", multiline: true }
];

function Goods({ goods, setGoods, isAdmin, goodsHero, setGoodsHero, goodsCopy, setGoodsCopy }) {
  const gc = { ...DEFAULTS.goodsCopy, ...(goodsCopy || {}) };
  const [editCopy, setEditCopy] = useState(false);
  const [tmpCopy, setTmpCopy] = useState(gc);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", brand: "", desc: "", url: "", img: "", active: true });
  const [goodsUrlErr, setGoodsUrlErr] = useState("");
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const startAdd = () => { setForm({ name: "", brand: "", desc: "", url: "", img: "", active: true }); setEditing("new"); setGoodsUrlErr(""); };
  const startEdit = p => { setForm({ ...p }); setEditing(p.id); setGoodsUrlErr(""); };
  const save = () => {
    if (form.url && !isValidUrl(form.url)) { setGoodsUrlErr("連結格式不正確，需以 https:// 開頭"); return; }
    setGoodsUrlErr("");
    if (editing === "new") setGoods(prev => [...prev, { ...form, id: Date.now() }]); else setGoods(prev => prev.map(p => p.id === editing ? { ...p, ...form } : p)); setEditing(null);
  };
  const del = id => { if (confirm("確定刪除？")) setGoods(prev => prev.filter(p => p.id !== id)); };
  const active = (goods || []).filter(g => g.active);
  const move = (idx, dir) => setGoods(prev => { const act = (prev || []).filter(g => g.active); const inact = (prev || []).filter(g => !g.active); return [...moveItem(act, idx, dir), ...inact]; });
  return (
    <PageHero title="推薦好物頁文字" fields={GOODS_HERO_FIELDS} data={goodsHero} setData={setGoodsHero} defaults={DEFAULTS.goodsHero} isAdmin={isAdmin}>
      {(h, editLink) => (
    <div>
      <div style={{ background: GRAD, padding: "64px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 12 }}>{h.eyebrow}</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: CHAR, marginBottom: 10 }}>{h.headline}</h1>
            <p style={{ fontSize: 14, color: MID, maxWidth: 420 }}>{h.subhead}</p>
            {editLink}
          </div>
          {isAdmin && <button className="pb" onClick={startAdd}>＋ 新增</button>}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px" }} className="page-wrap">
        {editing && (
          <div style={{ background: GRAY, padding: "32px", marginBottom: 40, border: `1px solid ${BORDER}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="grid2">
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>商品名稱</p><input value={form.name} onChange={sf("name")} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>品牌 / 來源</p><input value={form.brand} onChange={sf("brand")} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>連結</p><input value={form.url} onChange={e => { sf("url")(e); setGoodsUrlErr(""); }} placeholder="https://..." />{goodsUrlErr && <p style={{ fontSize: 11, color: "#C0392B", marginTop: 4 }}>{goodsUrlErr}</p>}</div>
            </div>
            <div style={{ marginBottom: 20 }}><ImgUploader label="圖片（選填）" value={form.img} onChange={v => setForm(p => ({ ...p, img: v }))} aspect="4/3" /></div>
            <div style={{ marginBottom: 16 }}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>推薦說明</p><textarea value={form.desc} onChange={sf("desc")} style={{ minHeight: 80, border: "1px solid #D0D5DA", padding: "10px", background: WHITE }} /></div>
            <label style={{ fontSize: 12, color: MID, display: "flex", gap: 8, alignItems: "center", marginBottom: 24, cursor: "pointer" }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} style={{ width: "auto" }} />上架顯示
            </label>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.name.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
          </div>
        )}
        {editCopy && (
          <div style={{ background: GRAY, padding: "24px", marginBottom: 32, border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>編輯無商品時的提示文字</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <input value={tmpCopy.emptyState1} onChange={e => setTmpCopy(p => ({ ...p, emptyState1: e.target.value }))} />
              <input value={tmpCopy.emptyState2} onChange={e => setTmpCopy(p => ({ ...p, emptyState2: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={() => { setGoodsCopy(tmpCopy); setEditCopy(false); }}>儲存</button><button className="pg" onClick={() => setEditCopy(false)}>取消</button></div>
          </div>
        )}
        {active.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <p style={{ fontSize: 14, color: LIGHT, lineHeight: 2.4 }}>{gc.emptyState1}<br /><span style={{ fontSize: 12 }}>{gc.emptyState2}</span></p>
            {isAdmin && <span onClick={() => { setTmpCopy(gc); setEditCopy(true); }} style={{ fontSize: 11, color: O, cursor: "pointer" }}>編輯文字</span>}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }} className="grid3">
            {active.map((p, idx) => (
              <Reveal key={p.id} delay={Math.min(idx * 80, 400)}>
              <div style={{ background: WHITE, borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", position: "relative", border: `1px solid ${BORDER}`, transition: "box-shadow .24s, transform .24s", height: 420, display: "flex", flexDirection: "column" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-6px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {isAdmin && <OrdBtns idx={idx} total={active.length} onMove={move} style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }} />}
                <div style={{ height: 180, flexShrink: 0, overflow: "hidden", background: "#E8EAEC" }}>{p.img && <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}</div>
                <div style={{ padding: "22px 22px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {p.brand && <p style={{ fontSize: 11, color: O, letterSpacing: ".5px", marginBottom: 6, fontWeight: 500, flexShrink: 0 }}>{p.brand}</p>}
                  <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: CORAL2, flexShrink: 0, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: MID, lineHeight: 1.8, marginBottom: 16, whiteSpace: "pre-wrap", flex: 1, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
                    {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "8px 16px" }}>查看 →</button></a>}
                    {isAdmin && <div style={{ display: "flex", gap: 8 }}><button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => startEdit(p)}>編輯</button><button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => { setGoods(prev => prev.map(g => g.id === p.id ? { ...g, active: false } : g), { silent: true }); _showToast(`「${p.name}」已下架`); }}>下架</button><button className="pg" style={{ fontSize: 11, padding: "5px 10px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => del(p.id)}>刪除</button></div>}
                  </div>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        )}
        {isAdmin && (goods || []).filter(g => !g.active).length > 0 && (
          <div style={{ marginTop: 40 }}>
            <p style={{ fontSize: 11, color: LIGHT, marginBottom: 12, letterSpacing: ".5px" }}>未上架</p>
            {(goods || []).filter(g => !g.active).map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${BORDER}`, alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 13, color: LIGHT }}>{p.name}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="pg" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => { setGoods(prev => prev.map(g => g.id === p.id ? { ...g, active: true } : g), { silent: true }); _showToast(`「${p.name}」已上架`); }}>上架</button>
                  <button className="pg" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => startEdit(p)}>編輯</button>
                  <button className="pg" style={{ fontSize: 11, padding: "4px 10px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => del(p.id)}>刪除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
      )}
    </PageHero>
  );
}

//  NEW: App 介紹頁
//  使用說明 (Guide, standalone)
//  Guide（2026-09 改版：卡在哪就從哪一段看，六個段落＋側邊目錄）
const GD_SECTIONS = [
  ["g-01", "01", "第一次設定"],
  ["g-02", "02", "一個月怎麼走"],
  ["g-03", "03", "這筆該怎麼記"],
  ["g-04", "04", "名詞對照"],
  ["g-05", "05", "三種帳本"],
  ["g-06", "06", "疑難排解"],
];
const GD_JUMPS = [
  ["我剛註冊，第一步做什麼？", "g-01"],
  ["這筆花費該選哪個類型？", "g-03"],
  ["餘額跟我銀行不一樣", "g-06"],
  ["中間漏記了幾天", "g-06"],
];
const GD_SETUP = [
  ["填入你手上有多少錢", "到「帳戶」新增你的帳戶，依照「專款專用」概念，將每個帳戶賦予一個角色、用途。金額之後靠記帳自己更新。",
    "常見疑問：定存、股票要填嗎？想追蹤淨資產就填，只想管每月現金流可以先跳過。",
    "accounts.webp", "88La財務導航 帳戶管理：淨資產、總資產與負債、目標帳戶與其他帳戶"],
  ["設好每張卡的結帳日", "到「信用卡」填每張卡的結帳日與繳費日。這步做完，導航才知道要幫你預留多少卡費，你看到的餘額才是真的能花的。",
    "不知道日期？看帳單第一頁，或致電客服問「結帳日幾號」。",
    "credit-card.webp", "88La財務導航 信用卡帳期管理：三張卡的結帳與繳費日、本期應還 $5,774"],
  ["寫下一個想存的目標", "一個就好，可以是腦海中第一個想到的。\n有目標，你才知道還有多遠！",
    "三個月內、或有明確預計達成日期，目標建議設成「時效性儲蓄」，時間到就結束，不會長期綁著你。",
    "goals.webp", "88La財務導航 儲蓄目標頁：儲蓄目標進度、預存管理與短期衝刺目標"],
];
const GD_MONTH = [
  ["月初 · 薪水入帳那天", "排這個月的預算",
    ["盤點這個月的收入", "看導航建議你可以存多少", "把剩下的分到固定與變動", "確認「待分配」歸零，完成"],
    "排不平也沒關係，先送出，月中隨時可以改。", false],
  ["平常 · 每天 5 秒", "花完就記一筆",
    ["輸入金額、選類別", "固定或變動、現金或刷卡", "需要還是想要", "按下去那一刻的心情"],
    "心情不是裝飾。月底你會看到，後悔的花費幾乎都長得一樣。", false],
  ["月底 · 最後一兩天", "看診斷，只改一格",
    ["看「本月發生了什麼」", "看下個月具體建議", "挑一個你做得到的", "寫進月度筆記"],
    "一次改一件事就好。三個都改，下個月大概會放棄。", true],
];
const GD_CASES = [
  ["刷卡買東西", "當天就記，付款方式選「信用卡」，導航會自動把它算進當期的卡費預留。"],
  ["半年繳的保險", "設成「未來預存」，每月存進去一點。真正扣款那個月才記成支出，這樣單月不會突然需要花大筆。"],
  ["分期付款", "在「記帳」選擇信用卡分期，記下這一筆，之後每個月的還款會自動出現在預算分配頁面提醒你，不用重複記。"],
  ["跟朋友吃飯先代墊", "一樣記一筆帳，並備注代墊，他們還你的時候再直接把這筆帳刪除，個人帳完全不受影響。"],
  ["存錢進目標帳戶", "選「儲蓄」，不是支出。錢只是換了位置，淨資產沒有變少。"],
  ["領到獎金或紅包", "記成收入，然後回到預算頁重新分配！不分配它就會默默混進日常花掉。"],
  ["買了又退貨", "直接刪掉那筆，或記一筆同金額的收入在同一個類別。前者乾淨，後者留得住紀錄。"],
  ["把儲蓄帳戶的錢移到其他帳戶", "需要先建立兩個帳戶，再把儲蓄帳戶的錢「轉帳」過去。想記錄當月儲蓄，就到記帳區按「儲蓄」並選擇該帳戶。"],
];
const GD_TERMS = [
  ["固定 / 變動", "每月幾乎不變的（房租、保險）是固定；會浮動的（吃飯、交通）是變動。"],
  ["儲蓄", "存起來不打算動的錢，是往目標走的那一筆。不算支出。"],
  ["未來預存", "為了以後某筆一定會來的支出先放的錢，例如半年繳的保險、年繳的稅。錢還是會花掉，只是提前準備。"],
  ["時效性儲蓄", "短期內想達成的目標，例如三個月後的旅行。時間到就結束，不長期綁著。"],
  ["卡費預留", "這個月刷掉、下個月要付的錢。導航會先扣下來，所以你看到的餘額是真的可以花的。"],
  ["需要 / 想要", "沒有它日子會出問題的是需要，其他是想要。想要不是壞事，是月底診斷用來看比例的。"],
];
const GD_BOOKS = [
  ["個人", "自己的薪水、支出、儲蓄。"],
  ["公費", "兩個以上的人各自拿錢出來共同使用。"],
  ["家庭", "家庭收入與支出本來就一起管理。"],
];
const GD_FAQ = [
  ["導航器的帳戶金額跟實際不一樣", "一鍵校正。可以到帳戶管理的指定帳戶按下「校正」，把金額改回實際數字，系統會幫你記下混亂頻率。"],
  ["中間漏記了好幾天，還救得回來嗎？", "救得回來。翻信用卡明細跟電子支付紀錄補大筆的就好，小額的抓個大概金額記一筆「補記」。"],
  ["預算排不平，怎麼都超出", "先把儲蓄調低，甚至這個月設 0！預算的目的是能執行，不是好看！\n第一個月排不平很常見，看過一次真實花費之後，第二個月會準得多。"],
  ["月底診斷說我情緒消費太多，我覺得沒有", "診斷是觀察，不是判決。它只是把「心情不好那天你花了什麼」放在一起給你看！如果你看完覺得那些花得值得，那就不用改。"],
  ["換手機了，資料會不見嗎？", "不會。導航是 Web App，資料跟著帳號！新手機開瀏覽器登入同一組帳號就接得上，不用備份也不用轉移。"],
  ["想放到手機桌面，像 App 一樣打開", "可以。iPhone 用 Safari 開 → 分享 → 加入主畫面；Android 用 Chrome 開 → 選單 → 加到主畫面。\n之後點圖示直接進，不用打開瀏覽器。"],
];

function Guide({ isAdmin, setPage, links }) {
  const [active, setActive] = useState("g-01");
  const l = links || DEFAULTS.links;
  const ext = { target: "_blank", rel: "noopener noreferrer" };
  const lineUrl = l.lineCommunity || DEFAULTS.links.lineCommunity;
  const mailUrl = `mailto:${l.email || PUBLIC_CONTACT_EMAIL}`;
  // 側邊目錄跟著捲動高亮，用 IntersectionObserver 而不是算捲動位置
  useEffect(() => {
    const els = GD_SECTIONS.map(([id]) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
      const shown = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (shown) setActive(shown.target.id);
    }, { rootMargin: "-20% 0px -70% 0px" });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return (
    <div className="nx-page">
      {/* Hero */}
      <div className="nx-in gd-hero">
        <p className="nx-eyebrow" style={{ letterSpacing: ".16em" }}>使用說明</p>
        <h1>卡在哪，就從哪一段看</h1>
        <p>不用從頭讀完。下面每一段都可以單獨看懂，遇到卡住的地方再回來找。</p>
        <div className="gd-jump">
          {GD_JUMPS.map(([label, id]) => <a key={label} href={"#" + id}>{label}</a>)}
        </div>
      </div>

      <div className="gd-layout">
        {/* 側邊目錄 */}
        <aside className="gd-toc">
          <p>目錄</p>
          <nav>
            {GD_SECTIONS.map(([id, n, name]) => (
              <a key={id} href={"#" + id} className={active === id ? "is-on" : ""}>{n}　{name}</a>
            ))}
          </nav>
          <div className="gd-toc-ask">
            <p>找不到答案？</p>
            <a className="nx-btn nx-btn-sec nx-btn-sec-strong nx-btn-block nx-btn-sm" href={lineUrl} {...ext}>在社群提問</a>
          </div>
        </aside>

        <div className="gd-body">
          {/* 01 第一次設定 */}
          <section className="gd-sect" id="g-01">
            <div className="gd-sect-head"><b>01</b><h2>第一次設定</h2><span>約 10 分鐘，只做一次</span></div>
            <p className="gd-intro">這三件事做完，導航之後給你的分析會更完整！沒填完也沒關係，可以先開始記帳，之後補。</p>
            <div className="gd-steps">
              {GD_SETUP.map(([t, body, tip, img, alt], i) => (
                <article key={t} className="gd-step">
                  <b>{i + 1}</b>
                  <div>
                    <h3>{t}</h3>
                    <p className="gd-step-body" style={{ whiteSpace: "pre-line" }}>{body}</p>
                    <p className="gd-tip">{tip}</p>
                  </div>
                  <img src={HM_SHOT + img} width="940" height="1175" loading="lazy" alt={alt} />
                </article>
              ))}
            </div>
          </section>

          {/* 02 一個月怎麼走 */}
          <section className="gd-sect" id="g-02">
            <div className="gd-sect-head"><b>02</b><h2>一個月怎麼走</h2></div>
            <p className="gd-intro">導航是一個月一個循環。你只要記得月初做一次、平常隨手做、月底看一次。</p>
            <div className="gd-month">
              {GD_MONTH.map(([when, title, steps, note, hi]) => (
                <article key={when} className={hi ? "gd-hi" : ""}>
                  <p className="gd-month-when">{when}</p>
                  <h3>{title}</h3>
                  <ol>{steps.map((s, i) => <li key={s}>{i + 1}　{s}</li>)}</ol>
                  <p className="gd-month-note">{note}</p>
                </article>
              ))}
            </div>
          </section>

          {/* 03 這筆該怎麼記 */}
          <section className="gd-sect" id="g-03">
            <div className="gd-sect-head"><b>03</b><h2>這筆該怎麼記</h2><span>最多人卡住的地方</span></div>
            <p className="gd-intro">下面是社群裡問最多的情境。找不到你的情況？記錯也沒關係，之後可以改。</p>
            <dl className="gd-table" style={{ margin: 0 }}>
              <div className="gd-tr gd-thead"><div>情境</div><div>怎麼記</div></div>
              {GD_CASES.map(([q, a]) => (
                <div key={q} className="gd-tr"><dt>{q}</dt><dd>{a}</dd></div>
              ))}
            </dl>
          </section>

          {/* 04 名詞對照 */}
          <section className="gd-sect" id="g-04">
            <div className="gd-sect-head"><b>04</b><h2>名詞對照</h2></div>
            <div className="gd-terms nx-hide-mob">
              {GD_TERMS.map(([t, d]) => <div key={t}><h3>{t}</h3><p>{d}</p></div>)}
            </div>
            <div className="gd-acc nx-only-mob">
              <p className="gd-intro" style={{ marginBottom: 8 }}>點一下看解釋。</p>
              {GD_TERMS.map(([t, d]) => (
                <details key={t}><summary>{t}</summary><p>{d}</p></details>
              ))}
            </div>
          </section>

          {/* 05 三種帳本 */}
          <section className="gd-sect" id="g-05">
            <div className="gd-sect-head"><b>05</b><h2>三種帳本</h2></div>
            <p className="gd-intro">不知道自己要用哪本？先用「個人」就好。</p>
            <div className="gd-books">
              {GD_BOOKS.map(([t, d]) => <article key={t}><h3>{t}</h3><p>{d}</p></article>)}
            </div>
          </section>

          {/* 06 疑難排解 */}
          <section className="gd-sect" id="g-06">
            <div className="gd-sect-head"><b>06</b><h2>疑難排解</h2></div>
            <div className="gd-faq">
              {GD_FAQ.map(([q, a]) => (
                <div key={q}><h3>{q}</h3><p style={{ whiteSpace: "pre-line" }}>{a}</p></div>
              ))}
            </div>
            <div className="gd-ask">
              <div>
                <strong>上面都沒有你的問題？</strong>
                <em>在社群提問，或直接來信，通常三天內回覆</em>
              </div>
              <div>
                <a className="nx-btn nx-btn-sec nx-btn-sec-strong nx-btn-sm" href={lineUrl} {...ext}>在社群提問</a>
                <a className="nx-btn nx-btn-pri nx-btn-sm" href={mailUrl}>聯絡我們</a>
              </div>
            </div>
            {isAdmin && (
              <p style={{ marginTop: 20, fontSize: 12, color: LIGHT, lineHeight: 1.8 }}>
                本頁文案已改為設計定稿，不再讀後台的「使用說明」資料（舊資料仍保留在
                <span onClick={() => setPage("app")} style={{ color: O, cursor: "pointer", textDecoration: "underline", margin: "0 4px" }}>財務導航頁的後台編輯區</span>
                ，確認不需要後可以移除）。
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const demoMoney = value => `$${Number(value || 0).toLocaleString("en-US")}`;
function DemoPhoneReport({ state }) {
  const data = deriveDemoPhonePreview(state);

  if (state === "complete") {
    return (
      <div className="demo-phone-report demo-phone-report-closed">
        <section className="demo-phone-closed-status">
          <div className="demo-phone-closed-status-row">
            <span>本月狀態</span>
            <strong>已過完</strong>
          </div>
          <div className="demo-phone-closed-badges">
            <span>診斷 已完成</span>
            <span>下月計畫 待安排</span>
          </div>
        </section>
        <div className="demo-phone-closed-milestone">🎉 {data.milestone}</div>
        <section className="demo-phone-closed-focus">
          <p className="demo-phone-report-label">本月最後結果</p>
          <strong>{data.monthOutcome.title}</strong>
          <span>{data.balanceLabel} {demoMoney(data.balance)}，但原訂目標仍有差額。</span>
        </section>
        <section className="demo-phone-closed-focus secondary">
          <p className="demo-phone-report-label">最值得注意</p>
          <strong>{data.topDiagnosis.title}</strong>
          <span>{data.topDiagnosis.body}</span>
          <span className="demo-phone-closed-link">看判斷依據</span>
        </section>
        <section className="demo-phone-closed-goal">
          <p className="demo-phone-report-label">未完成目標</p>
          <strong>{data.goalGap.label}還差 {demoMoney(data.goalGap.remaining)}</strong>
          <span>目標 {demoMoney(data.goalGap.planned)}，本月完成 {demoMoney(data.goalGap.actual)}。</span>
        </section>
        <section className="demo-phone-closed-action">
          <span>下一步</span>
          <strong>{data.nextAction}</strong>
          <span className="demo-phone-closed-primary">查看下月計畫</span>
        </section>
      </div>
    );
  }

  return (
    <div className="demo-phone-report">
      <section className="demo-phone-summary-card">
        <p className="demo-phone-report-label">{data.stateLabel}</p>
        <div className="demo-phone-balance-row">
          <span>{data.balanceLabel}</span>
          <strong>{demoMoney(data.balance)}</strong>
          {data.daysRemaining !== null && <small>距月底 {data.daysRemaining} 天</small>}
        </div>
        <div className="demo-phone-summary-items">
          {data.summaryItems.map(item => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-phone-report-card">
        <div className="demo-phone-report-block">
          <p className="demo-phone-report-heading">{data.activityHeading}</p>
          {data.activityItems.map(item => (
            <div key={item.label} className="demo-phone-report-item">
              <strong className={item.completed ? "success" : ""}>
                {item.label} {demoMoney(item.amount)}{item.completed ? " 已完成 ✓" : ""}
              </strong>
              <span>{item.body}</span>
            </div>
          ))}
        </div>
        <div className="demo-phone-report-block">
          <p className="demo-phone-report-heading">{data.budgetAlertCount ?? data.budgetAlerts.length} 項預算需要注意</p>
          {data.budgetAlerts.map(item => (
            <div key={item.label} className="demo-phone-report-item">
              <strong>{item.label}已超支 {demoMoney(item.over)}</strong>
              <span>預算 {demoMoney(item.budget)}，目前已使用 {demoMoney(item.actual)}。</span>
            </div>
          ))}
        </div>
      </section>

      <section className="demo-phone-report-card">
        <div className="demo-phone-report-block">
          <p className="demo-phone-report-heading">本月目標</p>
          {data.goals.map(item => (
            <div key={item.label} className="demo-phone-report-item">
              <strong className={item.completed ? "success" : ""}>
                {item.completed ? `${item.label}已完成 ✓` : `${item.label}還差 ${demoMoney(item.remaining)}`}
              </strong>
              <span>本月目標 {demoMoney(item.planned)}，目前已完成 {demoMoney(item.actual)}。</span>
            </div>
          ))}
        </div>
        {data.nextMonthCardDue > 0 && (
          <div className="demo-phone-report-block">
            <p className="demo-phone-report-heading">下月提醒</p>
            <div className="demo-phone-report-item">
              <strong>已有 {demoMoney(data.nextMonthCardDue)} 卡費會在下月付款</strong>
              <span>這是本月已經發生、付款時間落在下個月的支出。</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function AppLegacyAdmin({ appContent, setAppContent, isAdmin, setPage, demoStory, setDemoStory }) {
  const c = normalizeAppContent(appContent);
  const ds = normalizeDemoStory(demoStory);
  const upd = patch => setAppContent(prev => ({ ...DEFAULTS.appContent, ...(prev || {}), ...patch }));
  const [detailPlan, setDetailPlan] = useState(null);
  const [editHero, setEditHero] = useState(false);
  const [tmpHero, setTmpHero] = useState({ heroEyebrow: c.heroEyebrow, heroTitle: c.heroTitle, heroHighlight: c.heroHighlight, heroSub: c.heroSub, heroCtaBtn: c.heroCtaBtn });
  const [editMisc, setEditMisc] = useState(false);
  const [tmpMisc, setTmpMisc] = useState(c);
  const [editDemoStory, setEditDemoStory] = useState(false);
  const [tmpDemoStory, setTmpDemoStory] = useState(ds);
  const [demoMonthPreview, setDemoMonthPreview] = useState("progress");
  const [editingFeat, setEditingFeat] = useState(null);
  const [featForm, setFeatForm] = useState({ n: "", title: "", desc: "", img: "", noFrame: false });
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: "", price: "", period: "", highlight: false, badge: "", features: [], detailTitle: "", detailImg: "", detailContent: "" });
  const [editNote, setEditNote] = useState(false);
  const [tmpNote, setTmpNote] = useState({ pricingNote: c.pricingNote, comingSoonTitle: c.comingSoonTitle, comingSoonSub: c.comingSoonSub });
  const [editGuide, setEditGuide] = useState(false);
  const [tmpGuide, setTmpGuide] = useState({ title: "", faqs: [], advancedJson: "", showAdvanced: false });
  const demoMonthPreviews = [
    {
      id: "progress",
      label: "本月進行中",
      alt: "88La 財務導航本月進行中的畫面，顯示可用餘額、預算提醒和未完成目標",
    },
    {
      id: "complete",
      label: "本月已結束",
      alt: "88La 財務導航本月已結束的畫面，顯示本月最後結果、正式診斷和下月安排",
    },
  ];
  const activeDemoMonthPreview = demoMonthPreviews.find(item => item.id === demoMonthPreview) || demoMonthPreviews[0];
  const saveFeat = () => {
    if (editingFeat === "new") upd({ features: [...c.features, { id: Date.now(), n: String(c.features.length + 1).padStart(2, "0"), ...featForm }] });
    else upd({ features: c.features.map(f => f.id === editingFeat ? { ...f, ...featForm } : f) });
    setEditingFeat(null);
  };
  const delFeat = id => { if (confirm("確定刪除？")) upd({ features: c.features.filter(f => f.id !== id) }); };
  const moveFeat = (idx, dir) => upd({ features: moveItem(c.features, idx, dir) });
  const savePlan = () => {
    if (editingPlan === "new") upd({ plans: [...c.plans, { id: Date.now(), ...planForm }] });
    else upd({ plans: c.plans.map(p => p.id === editingPlan ? { ...p, ...planForm } : p) });
    setEditingPlan(null);
  };
  const delPlan = id => { if (confirm("確定刪除？")) upd({ plans: c.plans.filter(p => p.id !== id) }); };

  //  Plan detail page
  if (detailPlan !== null) {
    const plan = c.plans.find(p => p.id === detailPlan);
    if (!plan) { setDetailPlan(null); return null; }
    return (
      <div>
        <div style={{ background: GRAD, padding: "52px 32px 44px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <button onClick={() => setDetailPlan(null)} style={{ background: "transparent", color: MID, border: `1px solid ${BORDER}`, padding: "7px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 28 }}>{c.planDetailBackBtn}</button>
            <p className="section-label" style={{ marginBottom: 12 }}>{c.planDetailLabel}</p>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: CHAR, lineHeight: 1.3 }}>{plan.detailTitle || plan.name}</h1>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 16 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: O }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: LIGHT }}>{plan.period}</span>
            </div>
          </div>
        </div>
        {plan.detailImg && (
          <div style={{ maxWidth: 800, margin: "0 auto", overflow: "hidden" }}>
            <img src={plan.detailImg} alt={plan.name} style={{ width: "100%", maxHeight: 380, objectFit: "cover", display: "block" }} loading="lazy" />
          </div>
        )}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "52px 32px" }} className="page-wrap">
          {plan.detailContent && <div style={{ fontSize: 16, lineHeight: 2.1, color: CHAR, whiteSpace: "pre-wrap", marginBottom: 48 }}>{plan.detailContent}</div>}
          <div style={{ background: plan.highlight ? O : GRAY, border: `2px solid ${plan.highlight ? O : BORDER}`, padding: "36px", marginBottom: 32 }}>
            <p style={{ fontSize: 11, color: plan.highlight ? "rgba(255,255,255,.55)" : MID, letterSpacing: "1px", marginBottom: 16 }}>{c.planDetailFeaturesLabel}</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {(plan.features || []).filter(Boolean).map((f, j) => (
                <li key={j} style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,.9)" : MID, display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "rgba(255,255,255,.8)" : O} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{f}
                </li>
              ))}
            </ul>
            <a {...appCtaProps("app-plan-detail")}>
              <button style={{ background: plan.highlight ? WHITE : O, color: plan.highlight ? O : WHITE, border: "none", padding: "14px 36px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "opacity .18s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >{c.planDetailBuyBtn}</button>
            </a>
          </div>
          {isAdmin && (
            <div style={{ background: GRAY, padding: 20, border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 11, color: MID, marginBottom: 14, letterSpacing: "1px" }}>編輯詳情頁</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>詳情頁標題（選填，預設用方案名）</p><input value={plan.detailTitle || ""} onChange={e => upd({ plans: c.plans.map(p => p.id === plan.id ? { ...p, detailTitle: e.target.value } : p) })} /></div>
                <ImgUploader label="圖片" value={plan.detailImg || ""} onChange={v => upd({ plans: c.plans.map(p => p.id === plan.id ? { ...p, detailImg: v } : p) })} aspect="16/9" />
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>詳情說明</p><textarea value={plan.detailContent || ""} onChange={e => upd({ plans: c.plans.map(p => p.id === plan.id ? { ...p, detailContent: e.target.value } : p) })} style={{ minHeight: 120 }} /></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ background: GRAD, padding: "80px 32px 64px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          {editHero ? (
            <div style={{ background: WHITE, padding: 24, border: `1px solid ${BORDER}`, maxWidth: 560, margin: "0 auto 16px", textAlign: "left" }}>
              <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>編輯主標題</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>小標籤</p><input value={tmpHero.heroEyebrow} onChange={e => setTmpHero(p => ({ ...p, heroEyebrow: e.target.value }))} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題（第一行）</p><input value={tmpHero.heroTitle} onChange={e => setTmpHero(p => ({ ...p, heroTitle: e.target.value }))} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>橘色強調字（第二行）</p><input value={tmpHero.heroHighlight} onChange={e => setTmpHero(p => ({ ...p, heroHighlight: e.target.value }))} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>副標題</p><textarea value={tmpHero.heroSub} onChange={e => setTmpHero(p => ({ ...p, heroSub: e.target.value }))} style={{ minHeight: 80 }} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>按鈕文字</p><input value={tmpHero.heroCtaBtn} onChange={e => setTmpHero(p => ({ ...p, heroCtaBtn: e.target.value }))} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}><button className="pb" onClick={() => { upd(tmpHero); setEditHero(false); }}>儲存</button><button className="pg" onClick={() => setEditHero(false)}>取消</button></div>
            </div>
          ) : (
            <>
              <p className="section-label hero-stagger hs-1" style={{ marginBottom: 16 }}>{c.heroEyebrow}</p>
              <h1 className="hero-stagger hs-2" style={{ fontSize: 48, fontWeight: 700, color: CHAR, lineHeight: 1.2, maxWidth: 620, margin: "0 auto 20px" }}>
                {c.heroTitle}<br /><span style={{ color: O }}>{c.heroHighlight}</span>
              </h1>
              <p className="hero-stagger hs-3" style={{ fontSize: 16, color: MID, lineHeight: 1.9, maxWidth: 480, margin: "0 auto 36px", whiteSpace: "pre-wrap" }}>{c.heroSub}</p>
              <div className="hero-stagger hs-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
                <a href="#pricing" onClick={e => { e.preventDefault(); document.getElementById("app-pricing")?.scrollIntoView({ behavior: "smooth" }); }}><button className="pb" style={{ fontSize: 14, padding: "14px 32px" }}>{c.heroCtaBtn}</button></a>
                {isAdmin && <button className="pg" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => { setTmpHero({ heroEyebrow: c.heroEyebrow, heroTitle: c.heroTitle, heroHighlight: c.heroHighlight, heroSub: c.heroSub, heroCtaBtn: c.heroCtaBtn }); setEditHero(true); }}>編輯標題</button>}
              </div>
            </>
          )}
        </div>
      </div>
      {/* Demo */}
      <div className="demo-sect" style={{ background: "#FFF8F4", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: "72px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>{ds.label}</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: CHAR, marginBottom: 16 }}>{ds.heading}</h2>
            <p style={{ fontSize: 15, color: MID, lineHeight: 1.8, maxWidth: 480, margin: "0 auto" }}>{ds.intro}</p>
            {isAdmin && <span onClick={() => { setTmpDemoStory(ds); setEditDemoStory(true); }} style={{ fontSize: 11, color: O, cursor: "pointer", marginTop: 8, display: "inline-block" }}>編輯示範情境文字</span>}
          </div>
          <div className="demo-state-preview">
            <div className="demo-state-copy">
              <h3 className="demo-state-heading">{ds.previewHeading}</h3>
              <p className="demo-state-intro">{ds.previewIntro}</p>
              <div className="demo-state-tabs" role="group" aria-label="切換月份診斷狀態">
                {demoMonthPreviews.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="demo-state-tab"
                    aria-pressed={demoMonthPreview === item.id}
                    aria-controls="demo-month-preview-panel"
                    onClick={() => setDemoMonthPreview(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div id="demo-month-preview-panel" className="demo-state-image-wrap" aria-live="polite">
              <div className="demo-phone-preview-screen">
                <div className="demo-phone-status" aria-hidden="true">
                  <span>9:41</span>
                  <span className="demo-phone-island" />
                  <span className="demo-phone-status-meta">5G&nbsp;&nbsp;88%</span>
                </div>
                <div className="demo-phone-app-tabs" aria-hidden="true">
                  <span className={`demo-phone-app-tab ${activeDemoMonthPreview.id === "progress" ? "active" : ""}`}>本月重點</span>
                  <span className="demo-phone-app-tab">下月計畫</span>
                  <span className={`demo-phone-app-tab ${activeDemoMonthPreview.id === "complete" ? "active" : ""}`}>完整診斷</span>
                  <span className="demo-phone-app-tab">數據明細</span>
                </div>
                <div
                  key={activeDemoMonthPreview.id}
                  className="demo-state-image"
                  role="img"
                  aria-label={activeDemoMonthPreview.alt}
                >
                  <DemoPhoneReport state={activeDemoMonthPreview.id} />
                </div>
              </div>
            </div>
          </div>
          <p className="demo-interactive-heading">{ds.interactiveHeading}</p>
          <div className="demo-card" style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "24px 20px 32px", boxShadow: "0 24px 48px -20px rgba(26,26,26,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: O, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: LIGHT }}>{ds.toolbarLabel}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div className="demo-phone" style={{
                width: "100%", maxWidth: 390,
                background: "#1A1A1A", borderRadius: 40,
                padding: "14px 12px",
                boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
              }}>
                <div className="hide-mob" style={{ height: 28, display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ width: 100, height: 22, background: "#111", borderRadius: 12 }} />
                </div>
                <div style={{ borderRadius: 28, overflow: "hidden", height: 680 }}>
                  {/* 示範畫面是 public/app-demo/ 的靜態頁，不是正式 App 的 iframe。
                      正式 App 的 ?demo=true 靠十幾處鎖點遮住建議層，訪客滑完只看得到
                      「待補充答案」與一堆 🔒，看不出系統要他改什麼；每次 App 改版
                      還要重補鎖點。靜態頁改放診斷「完成後」的樣子，數字寫死、
                      不需鎖點，也不會被 App 改版打壞（2026-08-22）。 */}
                  {/* 指到 index.html 而不是目錄：vercel.json 的 catch-all rewrite
                      會把取不到檔案的路徑導向官網首頁，官網就會嵌進自己。
                      這跟 normalizeResourceUrl 對 /resources/ 做的是同一件事。 */}
                  <iframe
                    src="/app-demo/index.html"
                    style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                    aria-label="88La財務導航示範"
                    loading="lazy"
                  />
                </div>
                <div className="hide-mob" style={{ height: 24, display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <div style={{ width: 100, height: 4, background: "#444", borderRadius: 2 }} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: LIGHT, textAlign: "center" }}>{ds.note}</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 24 }}>
            <div style={{ maxWidth: 780, width: "100%", textAlign: "left" }}>
              <p style={{ fontSize: 11, color: MID, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>{ds.personaLabel}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: CHAR, marginBottom: 12 }}>{ds.personaName}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {ds.personaFacts.split("\n").filter(Boolean).map((f, i) => (
                  <li key={i} style={{ fontSize: 13, color: MID, display: "flex", gap: 8, lineHeight: 1.6 }}><span style={{ color: O, fontWeight: 700, flexShrink: 0 }}>·</span><span>{f}</span></li>
                ))}
              </ul>
            </div>
            <div className="grid2" style={{ maxWidth: 780, width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 22px" }}>
                <p style={{ fontSize: 12, color: O, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 12 }}>{ds.findingsLabel}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {ds.findings.split("\n").filter(Boolean).map((f, i) => (
                    <li key={i} style={{ fontSize: 13, color: CHAR, display: "flex", gap: 8, lineHeight: 1.6 }}><span style={{ color: O, fontWeight: 700, flexShrink: 0 }}>·</span><span>{f}</span></li>
                  ))}
                </ul>
              </div>
              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 22px" }}>
                <p style={{ fontSize: 12, color: "#4A8C5C", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 12 }}>{ds.suggestionsLabel}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {ds.suggestions.split("\n").filter(Boolean).map((f, i) => (
                    <li key={i} style={{ fontSize: 13, color: CHAR, display: "flex", gap: 8, lineHeight: 1.6 }}><span style={{ color: "#4A8C5C", fontWeight: 700, flexShrink: 0 }}>·</span><span>{f}</span></li>
                  ))}
                </ul>
              </div>
            </div>
            <p style={{ fontSize: 12, color: LIGHT, textAlign: "center", background: GRAY, borderRadius: 10, padding: "10px 16px", maxWidth: 780, width: "100%" }}>{ds.lockNote}</p>
          </div>
        </div>
      </div>
      {editDemoStory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 61, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: WHITE, padding: 32, width: "100%", maxWidth: 560, maxHeight: "80vh", overflowY: "auto" }}>
            <p style={{ fontSize: 13, letterSpacing: "2px", color: CORAL2, marginBottom: 20, fontWeight: 500 }}>編輯示範情境文字</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>區塊標籤</p><input value={tmpDemoStory.label} onChange={e => setTmpDemoStory(p => ({ ...p, label: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題</p><input value={tmpDemoStory.heading} onChange={e => setTmpDemoStory(p => ({ ...p, heading: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>說明</p><textarea value={tmpDemoStory.intro} onChange={e => setTmpDemoStory(p => ({ ...p, intro: e.target.value }))} style={{ minHeight: 50 }} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>狀態預覽標題</p><input value={tmpDemoStory.previewHeading} onChange={e => setTmpDemoStory(p => ({ ...p, previewHeading: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>狀態預覽說明</p><textarea value={tmpDemoStory.previewIntro} onChange={e => setTmpDemoStory(p => ({ ...p, previewIntro: e.target.value }))} style={{ minHeight: 60 }} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>完整 Demo 引導</p><input value={tmpDemoStory.interactiveHeading} onChange={e => setTmpDemoStory(p => ({ ...p, interactiveHeading: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>Demo 小標籤</p><input value={tmpDemoStory.toolbarLabel} onChange={e => setTmpDemoStory(p => ({ ...p, toolbarLabel: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>操作提示文字</p><input value={tmpDemoStory.note} onChange={e => setTmpDemoStory(p => ({ ...p, note: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>人設標籤</p><input value={tmpDemoStory.personaLabel} onChange={e => setTmpDemoStory(p => ({ ...p, personaLabel: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>人設姓名/身分</p><input value={tmpDemoStory.personaName} onChange={e => setTmpDemoStory(p => ({ ...p, personaName: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>人設細節（每行一條）</p><textarea value={tmpDemoStory.personaFacts} onChange={e => setTmpDemoStory(p => ({ ...p, personaFacts: e.target.value }))} style={{ minHeight: 90 }} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>「系統怎麼看」標籤</p><input value={tmpDemoStory.findingsLabel} onChange={e => setTmpDemoStory(p => ({ ...p, findingsLabel: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>系統偵測項目（每行一條）</p><textarea value={tmpDemoStory.findings} onChange={e => setTmpDemoStory(p => ({ ...p, findings: e.target.value }))} style={{ minHeight: 70 }} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>「給小琳的建議」標籤</p><input value={tmpDemoStory.suggestionsLabel} onChange={e => setTmpDemoStory(p => ({ ...p, suggestionsLabel: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>建議項目（每行一條）</p><textarea value={tmpDemoStory.suggestions} onChange={e => setTmpDemoStory(p => ({ ...p, suggestions: e.target.value }))} style={{ minHeight: 60 }} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>鎖定提示文字</p><input value={tmpDemoStory.lockNote} onChange={e => setTmpDemoStory(p => ({ ...p, lockNote: e.target.value }))} /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pb" onClick={() => { setDemoStory(tmpDemoStory); setEditDemoStory(false); }}>儲存</button>
              <button className="pg" onClick={() => setEditDemoStory(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
      {/* Features */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 32px" }} className="page-wrap">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>{c.featuresLabel}</p>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: CHAR }}>{c.featuresHeading}</h2>
          {isAdmin && <span onClick={() => { setTmpMisc(c); setEditMisc(true); }} style={{ fontSize: 11, color: O, cursor: "pointer", marginTop: 8, display: "inline-block" }}>編輯本頁其他文字</span>}
        </div>
        {editingFeat && (
          <div style={{ background: GRAY, padding: "24px", marginBottom: 32, border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>{editingFeat === "new" ? "新增功能" : "編輯功能"}</p>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 16, marginBottom: 16 }} className="grid2">
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>分類標籤</p><input value={featForm.n} onChange={e => setFeatForm(p => ({ ...p, n: e.target.value }))} placeholder="例：即時記帳" /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題</p><input value={featForm.title} onChange={e => setFeatForm(p => ({ ...p, title: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>說明</p><textarea value={featForm.desc} onChange={e => setFeatForm(p => ({ ...p, desc: e.target.value }))} style={{ minHeight: 70 }} /></div>
            <div style={{ marginBottom: 10 }}><ImgUploader label="圖片（選填，建議直式手機截圖）" value={featForm.img} onChange={v => setFeatForm(p => ({ ...p, img: v }))} aspect="9/19" /></div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, color: MID, cursor: "pointer" }}>
              <input type="checkbox" checked={!!featForm.noFrame} onChange={e => setFeatForm(p => ({ ...p, noFrame: e.target.checked }))} style={{ width: "auto", margin: 0 }} />
              圖片已含手機外框，不要再套站上的框
            </label>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={saveFeat} disabled={!featForm.title.trim()}>儲存</button><button className="pg" onClick={() => setEditingFeat(null)}>取消</button></div>
          </div>
        )}
        {isAdmin && !editingFeat && <div style={{ marginBottom: 24, textAlign: "right" }}><button className="pb" style={{ fontSize: 12 }} onClick={() => { setFeatForm({ n: "", title: "", desc: "", img: "", noFrame: false }); setEditingFeat("new"); }}>＋ 新增功能</button></div>}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {c.features.map((f, i) => (
            <Reveal key={f.id || i}>
            <div className={`feature-row-item ${i % 2 === 1 ? "feature-row-alt" : ""}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center", padding: "48px 0", borderBottom: i < c.features.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div
                style={f.noFrame
                  // 自製外框圖四周會留白，手機本身只佔畫布的一半左右（實測 51.3%），
                  // 沿用 280px 會讓手機只剩 144px，比其他列小一半。放寬到 480（左欄可用寬 490），
                  // 手機約 246px，跟裸截圖的 280px 接近。
                  ? { maxWidth: 480, width: "100%", margin: "0 auto", transform: "translateY(0)", transition: "transform .35s cubic-bezier(.16,1,.3,1)" }
                  : { background: O2, borderRadius: 32, maxWidth: 280, width: "100%", margin: "0 auto", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px rgba(26,26,26,0.07), 0 28px 52px -20px rgba(26,26,26,0.26), 0 0 0 1px ${BORDER}`, transform: "translateY(0)", transition: "transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s cubic-bezier(.16,1,.3,1)", ...(f.img ? null : { aspectRatio: "9/19" }) }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px)"; if (!f.noFrame) e.currentTarget.style.boxShadow = `0 12px 20px rgba(26,26,26,0.1), 0 36px 64px -20px rgba(26,26,26,0.32), 0 0 0 1px ${BORDER}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; if (!f.noFrame) e.currentTarget.style.boxShadow = `0 4px 12px rgba(26,26,26,0.07), 0 28px 52px -20px rgba(26,26,26,0.26), 0 0 0 1px ${BORDER}`; }}
              >
                {/* 容器高度跟著圖片的原始比例走，objectFit 一律不用 cover。
                    舊版寫死 aspectRatio:"9/19" + cover，只要圖片比例不是 9:19 就被靜靜裁掉，
                    Barbara 自己合成的 1080x1350 外框圖左右各被切掉 20.4%（2026-08-18 回報）。
                    沒有圖時才保留 9:19 當佔位框。 */}
                {f.img ? <img src={f.img} alt={f.title} style={{ width: "100%", height: "auto", display: "block", borderRadius: f.noFrame ? 0 : 32 }} loading="lazy" /> : <span style={{ fontSize: 13, color: O, fontWeight: 500, textAlign: "center", padding: "0 16px" }}>{f.title || "功能"}畫面示意</span>}
              </div>
              <div style={{ position: "relative" }}>
                {isAdmin && <div style={{ position: "absolute", top: -8, right: 0, display: "flex", gap: 4, alignItems: "center" }}>
                  <OrdBtns idx={i} total={c.features.length} onMove={moveFeat} />
                  <button className="pg" style={{ fontSize: 10, padding: "3px 8px" }} onClick={() => { setFeatForm({ n: f.n, title: f.title, desc: f.desc, img: f.img || "", noFrame: !!f.noFrame }); setEditingFeat(f.id); }}>編輯</button>
                  <button className="pg" style={{ fontSize: 10, padding: "3px 8px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => delFeat(f.id)}>✕</button>
                </div>}
                {f.n && <span style={{ display: "inline-block", fontSize: 12, color: O, fontWeight: 500, background: O2, padding: "4px 12px", borderRadius: 999, marginBottom: 16 }}>{f.n}</span>}
                <h3 style={{ fontSize: 22, fontWeight: 700, color: CHAR, marginBottom: 12 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: MID, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{f.desc}</p>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
      {/* FAQ */}
      <div style={{ background: "#FAFAFA", padding: "72px 32px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>{c.faqLabel}</p>
            <h3 style={{ fontSize: 26, fontWeight: 700, color: CHAR }}>{c.faqHeading}</h3>
          </div>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
            {(c.guideData?.faqs || DEFAULTS.appContent.guideData.faqs).slice(0, 4).map(faq => (
              <div key={faq.id} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "22px 26px" }}>
                <p style={{ fontSize: 15, fontWeight: 500, color: CHAR, marginBottom: 8 }}>{faq.q}</p>
                <p style={{ fontSize: 13, color: MID, lineHeight: 1.8 }}>{faq.a}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: LIGHT, marginTop: 20 }}>{c.faqCountNote.replace("{n}", (c.guideData?.faqs || DEFAULTS.appContent.guideData.faqs).length)}</p>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button className="pg" onClick={() => setPage("guide")}>{c.faqGuideBtn}</button>
          </div>
          {isAdmin && (
            <div style={{ marginTop: 36, textAlign: "right" }}>
              {!editGuide && <button className="pg" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => { const gd = c.guideData || DEFAULTS.appContent.guideData; setTmpGuide({ title: c.guideTitle || "", faqs: (gd.faqs || []).map(f => ({ ...f })), advancedJson: JSON.stringify({ phases: gd.phases, dataNote: gd.dataNote }, null, 2), showAdvanced: false }); setEditGuide(true); }}>編輯使用說明</button>}
              {editGuide && (
                <div style={{ background: GRAY, padding: 24, border: `1px solid ${BORDER}`, textAlign: "left", marginTop: 16 }}>
                  <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>編輯使用說明</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題</p><input value={tmpGuide.title} onChange={e => setTmpGuide(p => ({ ...p, title: e.target.value }))} /></div>
                    <div>
                      <p style={{ fontSize: 12, color: MID, marginBottom: 10 }}>常見問題（FAQ）</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {tmpGuide.faqs.map((faq, fi) => (
                          <div key={faq.id || fi} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 11, color: LIGHT }}>第 {fi + 1} 則</span>
                              <span style={{ fontSize: 11, color: "#E74C3C", cursor: "pointer" }} onClick={() => setTmpGuide(p => ({ ...p, faqs: p.faqs.filter((_, i) => i !== fi) }))}>刪除這則</span>
                            </div>
                            <div style={{ marginBottom: 8 }}><p style={{ fontSize: 11, color: MID, marginBottom: 4 }}>問題</p><input value={faq.q} onChange={e => setTmpGuide(p => ({ ...p, faqs: p.faqs.map((f, i) => i === fi ? { ...f, q: e.target.value } : f) }))} placeholder="使用者常問的問題" /></div>
                            <div><p style={{ fontSize: 11, color: MID, marginBottom: 4 }}>答案</p><textarea value={faq.a} onChange={e => setTmpGuide(p => ({ ...p, faqs: p.faqs.map((f, i) => i === fi ? { ...f, a: e.target.value } : f) }))} style={{ minHeight: 70 }} placeholder="回答內容" /></div>
                          </div>
                        ))}
                      </div>
                      <button className="pg" style={{ fontSize: 12, padding: "6px 14px", marginTop: 12 }} onClick={() => setTmpGuide(p => ({ ...p, faqs: [...p.faqs, { id: Date.now(), q: "", a: "" }] }))}>＋ 新增一則常見問題</button>
                    </div>
                    <div>
                      <span onClick={() => setTmpGuide(p => ({ ...p, showAdvanced: !p.showAdvanced }))} style={{ fontSize: 11, color: O, cursor: "pointer" }}>{tmpGuide.showAdvanced ? "收合進階設定 ▲" : "進階設定（教學步驟內容，需要 JSON 格式）▼"}</span>
                      {tmpGuide.showAdvanced && (
                        <div style={{ marginTop: 10 }}>
                          <p style={{ fontSize: 11, color: MID, marginBottom: 6 }}>教學步驟資料（phases）與資料說明（dataNote），JSON 格式，不熟悉的話不要動這裡</p>
                          <textarea value={tmpGuide.advancedJson} onChange={e => setTmpGuide(p => ({ ...p, advancedJson: e.target.value }))} style={{ minHeight: 240, fontFamily: "monospace", fontSize: 11 }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button className="pb" onClick={() => {
                      const cleanFaqs = tmpGuide.faqs.filter(f => f.q.trim() || f.a.trim()).map(f => ({ id: f.id || (Date.now() + Math.random()), q: f.q.trim(), a: f.a.trim() }));
                      let nextGuideData = { ...(c.guideData || DEFAULTS.appContent.guideData), faqs: cleanFaqs };
                      if (tmpGuide.showAdvanced) {
                        try { nextGuideData = { ...nextGuideData, ...JSON.parse(tmpGuide.advancedJson) }; }
                        catch { alert("進階內容 JSON 格式有誤，請確認後再儲存"); return; }
                      }
                      upd({ guideTitle: tmpGuide.title, guideData: nextGuideData });
                      setEditGuide(false);
                    }}>儲存</button>
                    <button className="pg" onClick={() => setEditGuide(false)}>取消</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Pricing */}
      <div id="app-pricing" style={{ background: GRAY, padding: "72px 32px", position: "relative" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>{c.pricingLabel}</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: CHAR }}>{c.pricingHeading}</h2>
            {editNote ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10, alignItems: "center" }}>
                <input value={tmpNote.pricingNote} onChange={e => setTmpNote(p => ({ ...p, pricingNote: e.target.value }))} style={{ maxWidth: 340 }} placeholder="方案說明文字" />
                <input value={tmpNote.comingSoonTitle} onChange={e => setTmpNote(p => ({ ...p, comingSoonTitle: e.target.value }))} style={{ maxWidth: 340 }} placeholder="即將開放標題" />
                <input value={tmpNote.comingSoonSub} onChange={e => setTmpNote(p => ({ ...p, comingSoonSub: e.target.value }))} style={{ maxWidth: 340 }} placeholder="即將開放說明" />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="pb" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => { upd({ pricingNote: tmpNote.pricingNote, comingSoonTitle: tmpNote.comingSoonTitle, comingSoonSub: tmpNote.comingSoonSub }); setEditNote(false); }}>存</button>
                  <button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => setEditNote(false)}>✕</button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: MID, marginTop: 10 }}>
                {c.pricingNote}
                {isAdmin && <span onClick={() => { setTmpNote({ pricingNote: c.pricingNote, comingSoonTitle: c.comingSoonTitle, comingSoonSub: c.comingSoonSub }); setEditNote(true); }} style={{ fontSize: 11, color: O, cursor: "pointer", marginLeft: 8 }}>編輯（含即將開放提示文字）</span>}
              </p>
            )}
          </div>
          {editingPlan && (
            <div style={{ background: WHITE, padding: "24px", marginBottom: 24, border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>{editingPlan === "new" ? "新增方案" : "編輯方案"}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="grid2">
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>方案名稱</p><input value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>價格</p><input value={planForm.price} onChange={e => setPlanForm(p => ({ ...p, price: e.target.value }))} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>期間（如 /年）</p><input value={planForm.period} onChange={e => setPlanForm(p => ({ ...p, period: e.target.value }))} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>徽章文字（選填）</p><input value={planForm.badge} onChange={e => setPlanForm(p => ({ ...p, badge: e.target.value }))} /></div>
              </div>
              <label style={{ fontSize: 12, color: MID, display: "flex", gap: 8, alignItems: "center", marginBottom: 16, cursor: "pointer" }}>
                <input type="checkbox" checked={planForm.highlight} onChange={e => setPlanForm(p => ({ ...p, highlight: e.target.checked }))} style={{ width: "auto" }} />醒目方案（橘色背景）
              </label>
              <div style={{ marginBottom: 12 }}><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>功能列表（每行一項）</p><textarea value={(planForm.features || []).join("\n")} onChange={e => setPlanForm(p => ({ ...p, features: e.target.value.split("\n") }))} style={{ minHeight: 100 }} /></div>
              <p style={{ fontSize: 11, color: MID, marginBottom: 12, marginTop: 4, letterSpacing: ".5px" }}> 詳情頁內容 </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>詳情頁標題（選填）</p><input value={planForm.detailTitle} onChange={e => setPlanForm(p => ({ ...p, detailTitle: e.target.value }))} /></div>
                <ImgUploader label="詳情頁圖片" value={planForm.detailImg} onChange={v => setPlanForm(p => ({ ...p, detailImg: v }))} aspect="16/9" />
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>詳情說明文字</p><textarea value={planForm.detailContent} onChange={e => setPlanForm(p => ({ ...p, detailContent: e.target.value }))} style={{ minHeight: 100 }} /></div>
              </div>
              <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={savePlan} disabled={!planForm.name.trim()}>儲存</button><button className="pg" onClick={() => setEditingPlan(null)}>取消</button></div>
            </div>
          )}
          {isAdmin && !editingPlan && <div style={{ marginBottom: 20, textAlign: "right" }}><button className="pb" style={{ fontSize: 12 }} onClick={() => { setPlanForm({ name: "", price: "", period: "", highlight: false, badge: "", features: [], detailTitle: "", detailImg: "", detailContent: "" }); setEditingPlan("new"); }}>＋ 新增方案</button></div>}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(c.plans.length, 1)}, 1fr)`, gap: 20 }} className="grid2">
            {c.plans.map((p, i) => (
              <div key={p.id || i} style={{ background: p.highlight ? O : WHITE, border: `2px solid ${p.highlight ? O : BORDER}`, borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,.06)", padding: "36px 28px", position: "relative", transition: "box-shadow .24s, transform .24s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-6px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {p.badge && <span style={{ position: "absolute", top: -11, right: 18, background: CHAR, color: WHITE, fontSize: 10, padding: "3px 10px", letterSpacing: ".5px" }}>{p.badge}</span>}
                {isAdmin && <div style={{ position: "absolute", top: p.badge ? 18 : 10, left: 10, display: "flex", gap: 4 }}>
                  <button className="pg" style={{ fontSize: 10, padding: "3px 8px" }} onClick={() => { setPlanForm({ name: p.name, price: p.price, period: p.period, highlight: p.highlight, badge: p.badge || "", features: [...p.features], detailTitle: p.detailTitle || "", detailImg: p.detailImg || "", detailContent: p.detailContent || "" }); setEditingPlan(p.id); }}>編輯</button>
                  <button className="pg" style={{ fontSize: 10, padding: "3px 8px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => delPlan(p.id)}>✕</button>
                </div>}
                <p style={{ fontSize: 12, color: p.highlight ? "rgba(255,255,255,.65)" : MID, letterSpacing: "1px", marginBottom: 10, marginTop: isAdmin ? 24 : 0 }}>{p.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24, flexWrap: "nowrap" }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: p.highlight ? WHITE : CHAR, whiteSpace: "nowrap" }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: p.highlight ? "rgba(255,255,255,.55)" : LIGHT, whiteSpace: "nowrap" }}>{p.period}</span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9, marginBottom: 28 }}>
                  {(p.features || []).filter(Boolean).map((f, j) => (
                    <li key={j} style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,.85)" : MID, display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={p.highlight ? "rgba(255,255,255,.8)" : O} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setDetailPlan(p.id)} style={{ width: "100%", background: p.highlight ? WHITE : O, color: p.highlight ? O : WHITE, border: "none", padding: "12px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "opacity .18s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >{c.planLearnMoreBtn}</button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: LIGHT, marginTop: 20 }}>{c.loginNote}<a {...appCtaProps("app-login-note")} style={{ color: O }}>{c.loginLink}</a></p>
        </div>
        {!isAdmin && (
          <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", background: "rgba(248,248,248,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: O }}>COMING SOON</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: CHAR, lineHeight: 1.3 }}>{c.comingSoonTitle}</p>
            <p style={{ fontSize: 14, color: MID }}>{c.comingSoonSub}</p>
          </div>
        )}
      </div>
      {/* Legacy 2.0 */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px" }} className="page-wrap">
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }} className="legacy-card">
          <div>
            <span style={{ fontSize: 12, color: O, fontWeight: 500, background: O2, padding: "4px 12px", borderRadius: 999 }}>{c.legacyBadge}</span>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: CHAR, margin: "10px 0 8px" }}>{c.legacyHeading}</h3>
            <p style={{ fontSize: 13, color: MID, maxWidth: 480, marginBottom: 10 }}>{c.legacyDesc}</p>
            <p style={{ fontSize: 13, color: O, fontWeight: 500 }}>{c.legacyPrice}</p>
          </div>
          <a href="https://portaly.cc/every_dollars" target="_blank" rel="noopener noreferrer"><button className="pg">{c.legacyBtn}</button></a>
        </div>
      </div>
      {editMisc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 61, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: WHITE, padding: 32, width: "100%", maxWidth: 560, maxHeight: "80vh", overflowY: "auto" }}>
            <p style={{ fontSize: 13, letterSpacing: "2px", color: CORAL2, marginBottom: 20, fontWeight: 500 }}>編輯 App 頁其他文字</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                ["featuresLabel", "「FEATURES」標籤"], ["featuresHeading", "功能區標題"],
                ["faqLabel", "「常見問題」標籤"], ["faqHeading", "常見問題標題"], ["faqCountNote", "FAQ 題數提示（用 {n} 代表題數）"], ["faqGuideBtn", "查看完整使用說明按鈕"],
                ["pricingLabel", "「PRICING」標籤"], ["pricingHeading", "方案區標題"], ["planLearnMoreBtn", "方案卡片按鈕"],
                ["loginNote", "登入提示前綴"], ["loginLink", "登入連結文字"],
                ["legacyBadge", "2.0 版徽章"], ["legacyHeading", "2.0 版標題"], ["legacyDesc", "2.0 版說明"], ["legacyPrice", "2.0 版價格"], ["legacyBtn", "2.0 版按鈕"],
                ["planDetailBackBtn", "方案詳情頁返回按鈕"], ["planDetailLabel", "方案詳情頁標籤"], ["planDetailFeaturesLabel", "方案詳情頁功能列標籤"], ["planDetailBuyBtn", "方案詳情頁購買按鈕"],
              ].map(([k, label]) => (
                <div key={k}>
                  <p style={{ fontSize: 12, color: MID, marginBottom: 4 }}>{label}</p>
                  <input value={tmpMisc[k] ?? ""} onChange={e => setTmpMisc(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pb" onClick={() => { upd(tmpMisc); setEditMisc(false); }}>儲存</button>
              <button className="pg" onClick={() => setEditMisc(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

//  NEW: 免費資源
//  AppPage（2026-09 改版：先看畫面 → 自己滑 demo → 完整功能 → 誠實比較 → 上手 → 方案 → FAQ）
// 模板 2.0 的名稱、售價與賣場連結以商品資料（Firestore products）為唯一來源，
// 跟 /shop 同一份，不在這頁另外寫一組，否則兩頁會各自漂移。
// 用 type === "digital" 這個結構化欄位辨識，不是拿名稱去猜；取不到商品資料時才退回備援值。
const TEMPLATE_20_FALLBACK = {
  name: "理財自動導航模板2.0（Google sheets版）",
  price: "NT$ 699",
  url: "https://portaly.cc/everydollars",
};
const findTemplateProduct = products => (products || []).find(p => p.type === "digital") || null;

const IcBudget = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--nx-o)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" /><circle cx="16.5" cy="13" r="1.2" />
  </svg>
);
const IcPen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--nx-o)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const IcCompass = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--nx-o)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><polygon points="15.5 8.5 10.5 10.5 8.5 15.5 13.5 13.5" />
  </svg>
);

const AP_FEATURES_MAIN = [
  [IcBudget, "預算編排", "四步驟走完月初分配，一路帶你分配完整", "budget.webp", "88La財務導航 預算頁：四步驟流程、盤點收入 $38,000、可存 $8,000、待分配 $26,162"],
  [IcPen, "快速記帳", "智慧記憶你的記帳習慣，不用每次重選細項，自動幫你選好！5 秒快速記一筆", "quick-record.webp", "88La財務導航 快速記帳：類別、支出類型、付款方式、帳目歸屬、需要或想要"],
  [IcCompass, "月底診斷", "依據你的情況，偵測當月問題，給下個月的具體調整", "diagnosis.webp", "88La財務導航 診斷頁：本月你的支出發生了什麼，逐項說明缺口與判斷依據"],
];
const AP_FEATURES_SUB = [
  ["信用卡帳期", "結帳日、繳費日、本期應還，預留多少，一目瞭然", "credit-card.webp", "88La財務導航 信用卡帳期管理：三張卡的結帳與繳費日、本期應還 $5,774"],
  ["負債追蹤", "學貸、分期還了多少、還剩多少，不漏繳", "debt.webp", "88La財務導航 負債追蹤：大學學貸已還 $28,896、本月還款提醒"],
  ["帳戶與淨資產", "目標帳戶與活存分開看，錢有沒有往目標走", "accounts.webp", "88La財務導航 帳戶管理：淨資產、總資產與負債、目標帳戶與其他帳戶"],
  ["儲蓄目標與預存", "長期目標、短期衝刺、半年繳的保險都算進來", "goals.webp", "88La財務導航 儲蓄目標頁：儲蓄目標進度、預存管理與短期衝刺目標"],
];
const AP_FEATURES_TEXT = [
  ["願望清單", "想買的先記下來，冷靜幾天再決定"],
  ["個人 / 公費 / 家庭", "三本各自獨立帳本，個人使用、情侶各自拿一筆公積金、雙薪家庭混用，三種模式互不混在一起"],
  ["桌面快速記帳", "在電腦前工作時，也能兩秒記一筆"],
  ["月度筆記", "寫下自己的心得，明年回看會很有感"],
];
// 三方比較。desktop 為完整敘述，mobile 為精簡版；first=true 的四項在手機預設展開
const AP_COMPARE = [
  { key: "月初分配", first: true,
    app: "大多只能設類別上限，不幫你把整筆薪水分完", tpl: "五種分配模式可選，填完就看到比例與紅字示警", la: "四步驟帶著走，分完整筆薪水",
    mApp: "只設類別上限", mTpl: "五種模式，自己填", mLa: "四步驟帶著走，分完整筆薪水" },
  { key: "平常記一筆", first: false,
    app: "很快，這是記帳 App 最擅長的事", tpl: "在表格裡填寫，適合每天固定坐下來記的人", la: "手機 5 秒，還能記下需要／想要與心情",
    mApp: "很快，它最擅長", mTpl: "表格裡填一列", mLa: "5 秒，含需要／想要與心情" },
  { key: "卡費預留", first: true,
    app: "刷卡算當月支出，下個月要付多少看不到", tpl: "有信用卡待還款預警欄位，自己填", la: "自動計算你現在真正能花的有多少",
    mApp: "看不到下月要付多少", mTpl: "自己填預留金額", mLa: "自動算出真正能花多少" },
  { key: "月底分析", first: true,
    app: "圖表與類別佔比，要自己解讀", tpl: "診斷報告是我事先寫好的規則：符合哪個條件，就給哪一段建議，偏穩定、可預期", la: "讀你這個月的每一筆之後才寫，所以每個月分析狀況不一樣，給你的建議也會不同",
    mApp: "只說錢花去哪", mTpl: "固定規則給建議", mLa: "照實際狀況，說下月先改什麼" },
  { key: "設備同步", first: true,
    app: "通常只能在手機，或要另外付費才有雲端", tpl: "手機、平板、電腦都可以，你的 Google 雲端", la: "手機、平板、電腦即時同步",
    mApp: "多半只有手機", mTpl: "你的 Google 雲端", mLa: "手機、平板、電腦即時同步" },
  { key: "會不會改版", first: false,
    app: "看各家更新", tpl: "買到的版本就是那個版本，表格完全屬於你的，可以自己改公式", la: "持續更新、優化，新功能自動出現，開放許願池",
    mApp: "看各家更新", mTpl: "版本固定，可改公式", mLa: "持續更新，開放許願池" },
  { key: "資料在哪", first: false,
    app: "各家的伺服器，能不能匯出看它們", tpl: "你的 Google 雲端", la: "保存在你自己的 Google Sheets，隱私安全、還可以匯出歷史資料保存",
    mApp: "各家伺服器", mTpl: "你的 Google 雲端", mLa: "你的 Google Sheets，可匯出" },
  { key: "適合誰", first: false,
    app: "只想知道花了多少的人", tpl: "喜歡用表格整理資料、想自己掌控欄位填寫方式", la: "記帳容易斷掉、不知道記了之後要如何調整、想脫離被卡費追著跑的人",
    mApp: "只想知道花了多少", mTpl: "喜歡表格、想自己掌控", mLa: "記帳容易斷、被卡費追著跑" },
];
// 第一個月只用兩個功能。第一格用主色淺底標成「現在做這個」。
// 註：設計稿寫「只用快訊 ＋ 快速記帳」，這裡沿用 2026-09 已定案的「預算」，
// 首頁與這頁一致；要改回快訊請兩頁一起改。
const AP_RAMP = [
  ["第一個月", "只用預算 ＋ 快速記帳", "每天 5 秒記一筆，看一眼餘額。月底就有一份診斷可以看。"],
  ["第二個月", "打開預算與卡費預留", "看過一次真實花費再排預算，會準得多。"],
  ["之後", "目標、負債、願望清單", "有需要再開，隨時都在為你準備好。"],
];
const AP_DEVICES = [
  ["支援裝置與同步", "Web App 不用下載，放到桌面體感接近原生 App。手機、平板、電腦登入同一組帳號即時同步。"],
  ["登入方式", "Google 一鍵登入，或用 Email 註冊。"],
  ["你的資料", "不介接銀行、不讀取交易紀錄，資料存在你自己的 Google 帳號。"],
  ["取消之後", "資料保留，隨時可以回來，也能匯出成試算表帶走。"],
];
// 退費與續約的說法必須跟 /terms 的服務條款一致，改這裡前先看 DEFAULTS.termsContent 第三、四節
const AP_FAQ = [
  ["可以退費嗎？", "數位商品恕無試用期，月訂閱在下次扣款日前取消即可，不會再扣款，當期還能用到結束。"],
  ["我完全沒記過帳，適合用嗎？", "可以，而且可能比記過帳的人更順，因為你沒有舊習慣要改，建議照上面的「第一個月只用兩個功能」開始。"],
  ["手機記的帳，電腦看得到嗎？", "看得到。財務導航 Web App 支援跨裝置使用，手機、平板、電腦只要登入同一組帳號，看到的就是同一份資料，不用匯入匯出。在外面用手機 5 秒記一筆，回到電腦前排預算或看診斷，都是接得上的。"],
  ["需要連接我的銀行帳戶嗎？", "不用。88La 不介接任何金融機構，所有數字都是你自己輸入的，這是刻意的選擇，手動記那 5 秒，本身就是讓你意識到花費的一部分。"],
  ["跟另一半一起用可以嗎？", "目前一組帳號一個人使用，裡面有「公費」、「家庭」帳本可以記共同開銷，多人共用同一本帳的功能還在規劃中。"],
  ["我買過實體存錢袋，還需要訂閱嗎？", "兩者可以搭著用：存錢袋負責現金的儀式感，導航負責整月的分配與診斷，想只用存錢袋也完全沒問題。"],
  ["中間停用幾個月，資料還在嗎？", "在。取消訂閱只是暫停使用，資料留著，回來就接得上，也可以匯出成試算表。"],
];

function AppPage({ appContent, setAppContent, isAdmin, setPage, demoStory, setDemoStory, products }) {
  const tpl = findTemplateProduct(products) || TEMPLATE_20_FALLBACK;
  const [moreOpen, setMoreOpen] = useState(false);
  // 完整功能的漸進揭露：桌機預設露 7 項（3 大 + 4 小），手機只露 3 大，其餘收在按鈕後面
  const [featOpen, setFeatOpen] = useState(false);
  const [showLegacyAdmin, setShowLegacyAdmin] = useState(false);
  const to = p => ({ href: pathForPage(p), onClick: e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); setPage(p); } });
  const rows = [...AP_COMPARE.filter(r => r.first), ...AP_COMPARE.filter(r => !r.first)];
  return (
    <div className="nx-page">
      {/* Hero */}
      <div className="nx-in">
        <section className="nx-hero">
          <div>
            <p className="nx-badge">
              <b>訂閱制</b>
              <span className="nx-hide-mob"><Price>{NT_MONTHLY}</Price> / 月，或年方案 <Price>{NT_YEARLY}</Price></span>
              <span className="nx-only-mob"><Price>{NT_MONTHLY}</Price> / 月起</span>
            </p>
            <h1 className="nx-h1">88La財務導航</h1>
            <p className="nx-hero-p" style={{ color: "var(--nx-t1)", maxWidth: 480, fontSize: "clamp(17px,1.9vw,19px)", lineHeight: 1.78 }}>月初把錢安排好，平常 5 秒記一筆，月底告訴你下個月該從哪裡調整。</p>
            <div className="nx-cta-row">
              <a className="nx-btn nx-btn-pri nx-btn-lg" {...appCtaProps("app-hero")}>開始使用 →</a>
              <a className="nx-btn nx-btn-sec nx-btn-lg" href="#demo">先免費體驗 ↓</a>
            </div>
            <p className="nx-hero-p2" style={{ marginTop: 18, marginBottom: 0 }}>不是又一個記帳 App。是一整套「分配 → 記錄 → 診斷」的循環<span className="nx-hide-mob">，陪你把每個月走完</span>。</p>
          </div>
          <div className="nx-shot-wrap">
            <img className="nx-shot" src={HM_SHOT + "alert.webp"} width="940" height="1175" alt="88La財務導航 快訊頁：本月可用餘額 $4,729、本期卡費已預留 $4,249、提醒中心" />
          </div>
        </section>
      </div>

      {/* demo：官網現成的可滑示範 */}
      <section className="nx-band nx-anchor" id="demo" style={{ paddingBlock: "clamp(32px,5vw,64px)" }}>
        <div className="nx-in ap-demo">
          <div>
            <p className="nx-eyebrow" style={{ marginBottom: 14 }}>先試，再決定</p>
            <h2 className="nx-h2" style={{ marginBottom: 16 }}>免訂閱·搶先體驗！</h2>
            <p className="ap-demo-p" style={{ marginBottom: 26 }}>這是完整的 88La財務導航，載入了一個月的示範資料。你可以真的按下去、切分頁、體驗看看。</p>
            <div className="ap-demo-actions">
              <a className="nx-btn nx-btn-dark nx-btn-md" href="/app-demo/index.html" target="_blank" rel="noopener noreferrer">開新分頁試玩 →</a>
            </div>
          </div>
          <div>
            {/* 示範畫面是 public/app-demo/ 的靜態頁，不是正式 App 的 iframe。
                正式 App 的 ?demo=true 靠十幾處鎖點遮住建議層，訪客滑完只看得到
                「待補充答案」與一堆 🔒，看不出系統要他改什麼；每次 App 改版
                還要重補鎖點。靜態頁改放診斷「完成後」的樣子，數字寫死、
                不需鎖點，也不會被 App 改版打壞（2026-08-22）。 */}
            {/* 指到 index.html 而不是目錄：vercel.json 的 catch-all rewrite
                會把取不到檔案的路徑導向官網首頁，官網就會嵌進自己。 */}
            <div className="ap-phone">
              <div className="ap-phone-notch nx-hide-mob"><i /></div>
              <div className="ap-phone-screen">
                <iframe src="/app-demo/index.html" title="88La財務導航示範" loading="lazy" />
              </div>
              <div className="ap-phone-bar nx-hide-mob"><i /></div>
            </div>
          </div>
        </div>
      </section>

      {/* 完整功能 */}
      <section style={{ paddingBlock: "clamp(32px,5vw,64px) clamp(28px,4.5vw,56px)" }}>
        <div className="nx-in">
          <div style={{ marginBottom: "clamp(20px,2.8vw,36px)" }}>
            <p className="nx-eyebrow" style={{ marginBottom: 12 }}>完整功能</p>
            <h2 className="nx-h2" style={{ marginBottom: 12 }}>11 種強大功能·全方位照顧</h2>
            <p className="nx-lead" style={{ maxWidth: 520 }}>讓你在花錢之前，就知道這筆錢屬於哪裡。</p>
          </div>
          <div className="ap-grid ap-grid-3" style={{ marginBottom: 20 }}>
            {AP_FEATURES_MAIN.map(([Icon, t, d, img, alt]) => (
              <article key={t} className="nx-card ap-card">
                <div className="ap-card-head"><Icon /><h3>{t}</h3></div>
                <p>{d}</p>
                <img src={HM_SHOT + img} width="940" height="1175" loading="lazy" alt={alt} />
              </article>
            ))}
          </div>
          {/* 四張小卡：桌機屬於預設露出的 7 項，手機才收進「看其他功能」裡 */}
          <div className={"ap-grid ap-grid-4 ap-feat-sub" + (featOpen ? " is-open" : "")} style={{ marginBottom: 20 }}>
            {AP_FEATURES_SUB.map(([t, d, img, alt]) => (
              <article key={t} className="nx-card ap-card ap-card-sm">
                <h3>{t}</h3>
                <p className="nx-hide-mob">{d}</p>
                <img src={HM_SHOT + img} width="940" height="1175" loading="lazy" alt={alt} />
              </article>
            ))}
          </div>
          {featOpen && (
            <>
              <div className="ap-grid ap-grid-4 nx-hide-mob">
                {AP_FEATURES_TEXT.map(([t, d]) => (
                  <article key={t} className="ap-card-plain"><h3>{t}</h3><p>{d}</p></article>
                ))}
              </div>
              <div className="ap-chips nx-only-mob">
                {AP_FEATURES_TEXT.map(([t]) => <span key={t}>{t}</span>)}
              </div>
            </>
          )}
          <button className="ap-toggle" onClick={() => setFeatOpen(v => !v)} aria-expanded={featOpen}>
            {featOpen ? "收起其他功能 ↑" : "看其他功能 ↓"}
          </button>
        </div>
      </section>

      {/* 工具篩選：三方比較 */}
      <section className="nx-dark" style={{ paddingBlock: "clamp(32px,5vw,64px)" }}>
        <div className="nx-in" style={{ maxWidth: 1020 }}>
          <div style={{ marginBottom: "clamp(20px,2.6vw,32px)" }}>
            <p className="nx-eyebrow nx-eyebrow-dark" style={{ marginBottom: 14 }}>工具篩選</p>
            <h2 className="nx-h2" style={{ color: "var(--nx-dt)" }}>你更適合哪種工具？</h2>
          </div>

          {/* 一張真表格跑兩種寬度：桌機吃 app/tpl/la 的完整敘述並列出全部八列，
              手機吃 mApp/mTpl/mLa 的精簡版、先給四列再展開。欄寬 20/26/24/30 是
              設計稿為 390px 算好的，桌機放寬第二、三欄讓長句少斷行。 */}
          <div className="ap-tbl-wrap">
            <table className="ap-tbl">
              <colgroup><col /><col /><col /><col /></colgroup>
              <thead>
                <tr>
                  <th>比較項目</th>
                  <th><span className="nx-hide-mob">一般記帳 App</span><span className="nx-only-mob">記帳 App</span></th>
                  <th><span className="nx-hide-mob">Google Sheets 模板 2.0（買斷）</span><span className="nx-only-mob">模板 2.0</span></th>
                  <th><span className="nx-hide-mob">財務導航（訂閱）</span><span className="nx-only-mob">88La 導航</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.key} className={!moreOpen && i >= 4 ? "ap-tr-more" : undefined}>
                    <th scope="row">{r.key}</th>
                    <td><span className="nx-hide-mob">{r.app}</span><span className="nx-only-mob">{r.mApp}</span></td>
                    <td><span className="nx-hide-mob">{r.tpl}</span><span className="nx-only-mob">{r.mTpl}</span></td>
                    <td className="ap-td-la"><span className="nx-hide-mob">{r.la}</span><span className="nx-only-mob">{r.mLa}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="ap-more nx-only-mob" onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen}>
              {moreOpen ? "收起其他 " + (rows.length - 4) + " 項 ↑" : "看其他 " + (rows.length - 4) + " 項差異 ↓"}
            </button>
          </div>

          <p className="ap-buy">看完覺得自己適合表格？{tpl.name} {tpl.price} 一次買斷，<a href={tpl.url || TEMPLATE_20_FALLBACK.url} target="_blank" rel="noopener noreferrer">到賣場看看 →</a></p>
          <p className="ap-note-weak">另外還有免費的分配計劃（Google Sheets 範本），下載超過 4,700 次，先從免費的開始也完全可以。</p>
        </div>
      </section>

      {/* 不用一次全用 */}
      <section className="nx-band" style={{ paddingBlock: "clamp(32px,5vw,64px) clamp(28px,4.5vw,56px)" }}>
        <div className="nx-in">
          <div style={{ marginBottom: "clamp(20px,2.6vw,32px)" }}>
            <p className="nx-eyebrow" style={{ marginBottom: 12 }}>不用一次全用</p>
            <h2 className="nx-h2">第一個月，你只需要用兩個功能</h2>
          </div>
          <div className="ap-ramp">
            {AP_RAMP.map(([when, t, d], i) => (
              <article key={when} className={i === 0 ? "ap-ramp-now" : undefined}>
                <p className="ap-ramp-when">{when}</p>
                <h3>{t}</h3>
                <p className="ap-ramp-d">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* beta 回饋 */}
      <section style={{ paddingBlock: "clamp(32px,5vw,64px) clamp(28px,4.5vw,56px)", borderBottom: "1px solid var(--nx-bd)" }}>
        <div className="nx-in">
          <div style={{ marginBottom: "clamp(20px,2.6vw,32px)" }}>
            <p className="nx-eyebrow" style={{ marginBottom: 12 }}>beta 使用者說</p>
            <h2 className="nx-h2">體驗真實回饋</h2>
          </div>
          <div className="ap-quotes">
            <article className="nx-card">
              <blockquote>好用的記帳理財工具，會讓我每天主動想打開記帳、看看自己的財務狀況，完全是對每個人量身打造的工具！</blockquote>
              <cite>beta 使用者 · Ｙ先生</cite>
            </article>
            <article className="nx-card">
              <blockquote>這款理財工具是我用過最棒的，而且持之以恆的邁入第二個月了！</blockquote>
              <cite>beta 使用者 · Ｌ小姐</cite>
            </article>
            <article className="nx-card ap-crit">
              <p className="ap-crit-tag">批評，以及我們怎麼改</p>
              <blockquote style={{ marginBottom: 14 }}>「功能說明不清，第一次使用阻力比較大。」</blockquote>
              <p className="ap-crit-fix">所以有了上面的「三件事」，名詞說明移到使用指南，App 內也加了第一次使用的欄位說明。</p>
            </article>
          </div>
        </div>
      </section>

      {/* 開始之前想知道的 */}
      <section className="nx-band" style={{ paddingBlock: "clamp(28px,4vw,52px)" }}>
        <div className="nx-in">
          <p className="nx-eyebrow" style={{ marginBottom: "clamp(14px,1.8vw,22px)" }}>開始之前想知道的</p>
          <dl className="ap-devices">
            {AP_DEVICES.map(([t, d]) => <div key={t} className="nx-card"><dt>{t}</dt><dd>{d}</dd></div>)}
          </dl>
        </div>
      </section>

      {/* 方案 */}
      <section style={{ paddingBlock: "clamp(32px,5vw,64px) clamp(28px,4.5vw,56px)" }}>
        <div className="nx-in">
          <div style={{ textAlign: "center", marginBottom: "clamp(24px,3.4vw,36px)" }}>
            <p className="nx-eyebrow" style={{ marginBottom: 12 }}>方案</p>
            <h2 className="nx-h2">每月一頓飯的錢，換來不焦慮</h2>
            <PriceNote style={{ marginTop: 18 }} />
          </div>
          <div className="ap-plans">
            <div className="ap-plan">
              <p className="ap-plan-name">月訂閱</p>
              <p className="ap-plan-price"><Price>{NT_MONTHLY}</Price><span> /月</span></p>
              <p className="ap-plan-sub">隨時可取消</p>
              <ul><li>完整功能</li><li>桌面快速記帳</li><li>下次扣款前可取消</li></ul>
              <a className="nx-btn nx-btn-sec nx-btn-sec-strong nx-btn-block nx-btn-md" {...appCtaProps("app-plan-monthly")}>選這個方案</a>
            </div>
            <div className="ap-plan ap-plan-dark">
              <span className="ap-plan-badge">最多人選擇</span>
              <p className="ap-plan-name">年方案</p>
              <p className="ap-plan-price"><Price>{NT_YEARLY}</Price><span> /年</span></p>
              <p className="ap-plan-sub"><Price>{`相當於 NT$ ${APP_YEARLY_MONTHLY_EQUIVALENT} / 月，省下約 ${APP_YEARLY_DISCOUNT}%`}</Price></p>
              <ul><li>完整功能</li><li>桌面快速記帳</li><li>單筆付款，不自動續約</li></ul>
              <a className="nx-btn nx-btn-pri nx-btn-block nx-btn-md" {...appCtaProps("app-plan-yearly")}>開始使用 →</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ paddingBottom: "clamp(32px,5vw,64px)" }}>
        <div className="nx-in">
          <div className="ap-faq">
            <h2>常見問題</h2>
            {AP_FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
            <div className="ap-ask">
              <div>
                <strong>還有其他問題？</strong>
                <em>來信或在社群提問，通常三天內回覆</em>
              </div>
              <div>
                <a className="nx-btn nx-btn-sec nx-btn-sec-strong nx-btn-sm" href={`mailto:${PUBLIC_CONTACT_EMAIL}`}>聯絡我們</a>
                <a className="nx-btn nx-btn-pri nx-btn-sm" {...appCtaProps("app-faq")}>開始使用 →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="nx-band" style={{ paddingBlock: "clamp(24px,3vw,32px)", borderBottom: "none" }}>
        <p className="nx-in nx-lead" style={{ textAlign: "center" }}>
          88La 也有免費的 Excel 範本、理財文章與實體存錢袋，<a className="nx-link" {...to("resources")}>先從免費的開始</a>也完全可以
        </p>
      </section>

      {/* 手機置底 CTA */}
      <div className="nx-sticky">
        <div>
          <b>88La財務導航</b>
          <span>{isAppLaunched() ? `${NT_MONTHLY} / 月起` : "9/10 正式上線"}</span>
        </div>
        <a className="nx-btn nx-btn-pri nx-btn-sm" {...appCtaProps("app-sticky")}>開始使用</a>
      </div>

      {/* 後台：舊版 /app 頁只是保留下來當編輯器，方案與使用說明資料還是從這裡改。
          等 /guide 改版做完會把這些編輯器搬到合適的地方（2026-09） */}
      {isAdmin && (
        <div style={{ borderTop: `2px dashed ${BORDER}`, padding: "24px 20px", background: GRAY }}>
          <button onClick={() => setShowLegacyAdmin(v => !v)} style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 13, color: O, cursor: "pointer", textDecoration: "underline" }}>
            {showLegacyAdmin ? "收合" : "展開"}後台編輯區（方案、功能、使用說明 FAQ）
          </button>
          {showLegacyAdmin && <AppLegacyAdmin appContent={appContent} setAppContent={setAppContent} isAdmin={isAdmin} setPage={setPage} demoStory={demoStory} setDemoStory={setDemoStory} />}
        </div>
      )}
    </div>
  );
}


const TOOL_QUIZ_QUESTIONS = [
  {
    id: "need",
    title: "你現在最想先處理哪件事？",
    options: [
      { id: "free", label: "我不知道錢都去哪了", desc: "想先免費找出目前的財務卡點", score: { free: 3 } },
      { id: "app", label: "我有記帳，但月底還是不知道怎麼調", desc: "需要把記錄變成提醒和下一步", score: { app: 3 } },
      { id: "bag", label: "我知道想存什麼，但錢總是被花掉", desc: "需要看得見、摸得到的行動提醒", score: { bag: 3 } }
    ]
  },
  {
    id: "format",
    title: "哪種方式比較容易讓你開始？",
    options: [
      { id: "try", label: "先用免費工具確認方向", desc: "現在還不想買東西", score: { free: 2 } },
      { id: "digital", label: "用手機或電腦整理", desc: "希望資料和提醒集中在同一處", score: { app: 2 } },
      { id: "physical", label: "用實體工具做出行動", desc: "看到進度會比較有感", score: { bag: 2 } }
    ]
  },
  {
    id: "payment",
    title: "你平常主要怎麼付款？",
    options: [
      { id: "cash", label: "以現金為主", desc: "實體分配和剩餘金額比較容易掌握", score: { bag: 2 } },
      { id: "mixed", label: "現金與數位支付都有", desc: "兩種工具都能使用", score: { app: 1, bag: 1 } },
      { id: "digital", label: "幾乎都是信用卡或行動支付", desc: "數位整理的使用阻力比較低", score: { app: 2 } }
    ]
  }
];

const TOOL_RESULTS = {
  app: {
    badge: "先整理錢流向",
    title: "你適合先用 88La財務導航",
    lead: "你的卡點比較像看不懂錢流向。先把日常花費、預算和提醒整理起來，比急著買工具更有幫助。",
    reasons: ["你需要每天看得到自己的狀態", "你比較需要整理資料和提醒", "先看懂數字，再決定怎麼存"],
    primary: { label: "看導航器怎麼用", page: "app" },
    secondary: { label: "先看免費資源", page: "resources" }
  },
  bag: {
    badge: "先讓錢有位置",
    title: "你適合先用實體存錢袋",
    lead: "你的卡點比較像知道要存，但錢容易被日常花掉。實體工具可以幫你把目標金額先分開，降低亂用掉的機率。",
    reasons: ["你需要摸得到的提醒", "你比較卡在行動而不是觀念", "把錢放進固定位置，會比只靠意志力穩"],
    primary: { label: "看實體存錢袋", page: "envelope" },
    secondary: { label: "細分適合哪款存錢袋", href: QUIZ_URL }
  },
  free: {
    badge: "先低壓暖身",
    title: "你適合先從免費資源開始",
    lead: "你現在比較像還在摸索階段。先不用急著買工具，先用免費測驗和文章找到自己的位置，再決定下一步。",
    reasons: ["你還沒有明確卡點", "先降低壓力，比馬上建立系統更重要", "找到問題後，再選工具會更準"],
    primary: { label: "看免費資源", page: "resources" },
    secondary: { label: "看理財文章", page: "journal" }
  }
};

function getToolQuizResult(answers) {
  const scores = { app: 0, bag: 0, free: 0 };
  TOOL_QUIZ_QUESTIONS.forEach(q => {
    const opt = q.options.find(o => o.id === answers[q.id]);
    Object.entries(opt?.score || {}).forEach(([key, value]) => { scores[key] += value; });
  });
  const highest = Math.max(scores.app, scores.bag, scores.free);
  const tied = Object.keys(scores).filter(key => scores[key] === highest);
  const primaryNeed = answers.need;
  const key = tied.includes(primaryNeed) ? primaryNeed : tied[0];
  return { key, scores };
}

function ToolQuiz({ setPage }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const done = step >= TOOL_QUIZ_QUESTIONS.length;
  const resultInfo = done ? getToolQuizResult(answers) : null;
  const result = resultInfo ? TOOL_RESULTS[resultInfo.key] : null;
  const q = TOOL_QUIZ_QUESTIONS[step];
  const progress = Math.round((Math.min(step, TOOL_QUIZ_QUESTIONS.length) / TOOL_QUIZ_QUESTIONS.length) * 100);
  const selected = q ? answers[q.id] : null;
  const choose = id => setAnswers(prev => ({ ...prev, [q.id]: id }));
  const restart = () => { setAnswers({}); setStep(0); };
  const goAction = action => {
    if (action.href) window.open(action.href, "_blank", "noopener,noreferrer");
    else setPage(action.page);
  };

  return (
    <div style={{ background: WHITE }}>
      <div style={{ background: GRAD, padding: "64px 32px 40px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <span className="tag" style={{ marginBottom: 18 }}>工具診斷</span>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: CHAR, lineHeight: 1.35, marginBottom: 14, maxWidth: 620 }}>我不確定我目前需要什麼工具</h1>
          <p style={{ fontSize: 15, color: MID, lineHeight: 1.9, maxWidth: 600 }}>用 3 個問題找到目前最值得先處理的卡點，結果只給你一個主要入口。</p>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 32px 72px" }} className="page-wrap">
        {!done && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
              <span style={{ fontSize: 13, color: MID }}>第 {step + 1} 題，共 {TOOL_QUIZ_QUESTIONS.length} 題</span>
              <span style={{ fontSize: 13, color: O, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 8, background: O2, borderRadius: 999, overflow: "hidden", marginBottom: 34 }}>
              <div style={{ width: `${progress}%`, height: "100%", background: O, borderRadius: 999, transition: "width .24s ease" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 34, alignItems: "start" }} className="grid2">
              <div style={{ position: "sticky", top: 92 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: CHAR, lineHeight: 1.45, marginBottom: 12 }}>{q.title}</h2>
                <p style={{ fontSize: 14, color: MID, lineHeight: 1.9 }}>不用選最完美的答案，選最像你最近一個月狀態的那個就好。</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {q.options.map(opt => {
                  const active = selected === opt.id;
                  return (
                    <button key={opt.id} onClick={() => choose(opt.id)} style={{ textAlign: "left", background: active ? O2 : WHITE, border: `1px solid ${active ? O : BORDER}`, borderRadius: 12, padding: "18px 20px", color: CHAR, fontFamily: "inherit", boxShadow: active ? "none" : "0 1px 6px rgba(0,0,0,.04)", transition: "border-color .18s, background .18s" }}>
                      <span style={{ display: "block", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{opt.label}</span>
                      <span style={{ display: "block", fontSize: 13, color: MID, lineHeight: 1.7 }}>{opt.desc}</span>
                    </button>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 14 }}>
                  <button className="pg" onClick={() => step === 0 ? setPage("home") : setStep(s => s - 1)}>{step === 0 ? "回首頁" : "上一題"}</button>
                  <button className="pb" disabled={!selected} onClick={() => setStep(s => s + 1)}>{step === TOOL_QUIZ_QUESTIONS.length - 1 ? "查看結果" : "下一題"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {done && result && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 0.82fr", gap: 28, alignItems: "start" }} className="grid2">
            <div style={{ background: O2, border: `1px solid ${O}22`, borderRadius: 16, padding: "34px 34px 32px" }}>
              <span className="tag" style={{ background: WHITE, marginBottom: 18 }}>{result.badge}</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: CHAR, lineHeight: 1.4, marginBottom: 14 }}>{result.title}</h2>
              <p style={{ fontSize: 15, color: MID, lineHeight: 1.95, marginBottom: 24 }}>{result.lead}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {result.reasons.map(reason => (
                  <div key={reason} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ width: 22, height: 22, borderRadius: 999, background: WHITE, color: O, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700 }}>✓</span>
                    <span style={{ fontSize: 14, color: CHAR, lineHeight: 1.7 }}>{reason}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="pb" onClick={() => goAction(result.primary)}>{result.primary.label}</button>
                <button className="pg" onClick={() => goAction(result.secondary)}>{result.secondary.label}</button>
                <button className="pg" onClick={restart}>重新測一次</button>
              </div>
            </div>

            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "24px 24px 22px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: CHAR, marginBottom: 14 }}>這個結果怎麼來的？</h3>
              <p style={{ fontSize: 13, color: MID, lineHeight: 1.8, marginBottom: 18 }}>系統會看你的主要需求、偏好的使用方式與付款習慣。分數相同時，以第一題最想解決的問題為準。</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["錢流向", resultInfo.scores.app], ["行動阻力", resultInfo.scores.bag], ["先暖身", resultInfo.scores.free]].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: MID }}>{label}</span>
                      <span style={{ fontSize: 12, color: O, fontWeight: 700 }}>{value}</span>
                    </div>
                    <div style={{ height: 7, background: GRAY, borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(value * 10, 100)}%`, background: O, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 12, color: LIGHT, lineHeight: 1.8 }}>這不是財務建議，也不是要你立刻購買。它只是幫你先判斷，目前比較值得處理的卡點在哪裡。</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

//  Resources（2026-09 改版：卡點分流 → 頭條工具 → 工具卡 → 模板 → 工具/App/手帳分工 → CTA）
//
// 版面角色表：key 是資源連結的「路徑」，做完全比對，不是拿名稱去猜關鍵字。
// Barbara 在後台改資源名稱不會改變版面行為；改連結才會，改完該項就退回一般工具卡（可見的降級）。
// 分類標籤（試算/測驗/盤點/目標/懶人包/判斷準則）目前 Firestore 的 type 只有「工具」「模板」兩種，
// 所以細分類放在這張表；沒登記的資源就用 type 當標籤。
const RESOURCE_LAYOUT = {
  "/resources/budget-planner/index.html": { order: 1, category: "試算", featured: true, anchor: "t-budget", cta: "開始練習 →", meta: "約 3 分鐘 · 免註冊", badge: "最多人從這裡開始" },
  "/resources/credit-card-reserve/index.html": { order: 2, category: "試算", anchor: "t-card", cta: "打開工具 →" },
  "/resources/survival-line/index.html": { order: 3, category: "試算", cta: "打開工具 →" },
  "/resources/spending-check/index.html": { order: 4, category: "盤點", cta: "打開工具 →" },
  "/resources/golden-circle/index.html": { order: 5, category: "目標", cta: "打開工具 →" },
  "/file/d/1tlGyY_TZHKBy-H6SMttFsuM7UNQy5lep/view": { order: 6, category: "懶人包", cta: "下載懶人包 →" },
  "/resources/savings-bag-quiz/index.html": { order: 7, category: "測驗", anchor: "t-save", cta: "開始測驗 →" },
  "/resources/emergency-fund-quiz/index.html": { order: 8, category: "測驗", cta: "開始測驗 →" },
  "/resources/declutter-check/index.html": { order: 20, category: "判斷準則", highlight: true, cta: "產生我的準則 →" },
};
const resourceLayout = r => {
  try { return RESOURCE_LAYOUT[new URL(normalizeResourceUrl(r.url || ""), window.location.origin).pathname] || {}; }
  catch { return {}; }
};
// 工具診斷是站內頁面，不是 Firestore 的資源項目，所以固定放在工具格的最後一張
const RS_TOOL_QUIZ = {
  category: "測驗",
  name: "你現在最需要哪一種理財工具？",
  desc: "3 到 5 題，從你最想解決的事情開始，不用先判斷自己是哪種理財程度。結果只給一個第一推薦。",
  cta: "開始測驗 →",
};
const RS_BLOCKERS = [
  ["錢不知道花去哪", "→ 預算分配練習器、最低生存線", "t-budget"],
  ["卡費一直追著跑", "→ 卡費預留試算工具", "t-card"],
  ["存不下來、不知道怎麼存", "→ 存錢方式測驗、預備金順序", "t-save"],
];
const RS_ROLES = [
  ["工具", "算一次就好。看清楚卡在哪個數字"],
  ["App", "每個月重來一次。預算 → 記帳 → 診斷"],
  ["手帳", "看得見、摸得到。想離開螢幕的時候用"],
];

function Resources({ resources, setResources, isAdmin, setPage }) {
  const [editPwd, setEditPwd] = useState(false);
  const [pwdVal, setPwdVal] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "模板", desc: "", url: "", img: "", active: true });
  const [resUrlErr, setResUrlErr] = useState("");
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const savePwd = async () => {
    if (pwdVal.trim().length < 4) { setPwdMsg("密碼至少要 4 個字元"); return; }
    setPwdSaving(true); setPwdMsg("");
    try {
      await setMemberArticlePassword(pwdVal.trim());
      setPwdMsg("已更新，下次會員登入即生效");
      setPwdVal(""); setEditPwd(false);
    } catch (e) {
      setPwdMsg(e.message || "儲存失敗，請再試一次");
    } finally {
      setPwdSaving(false);
    }
  };
  const startAdd = () => { setForm({ name: "", type: "模板", desc: "", url: "", img: "", active: true }); setEditing("new"); setResUrlErr(""); };
  const startEdit = r => { setForm({ ...r }); setEditing(r.id); setResUrlErr(""); };
  const save = () => {
    if (form.url && !isValidUrl(form.url)) { setResUrlErr("連結格式不正確，需以 https:// 開頭"); return; }
    setResUrlErr("");
    if (editing === "new") setResources(prev => [{ ...form, id: Date.now() }, ...(prev || [])]);
    else setResources(prev => (prev || []).map(r => r.id === editing ? { ...r, ...form } : r));
    setEditing(null);
  };
  const del = id => { if (confirm("確定刪除？")) setResources(prev => (prev || []).filter(r => r.id !== id)); };
  const countClick = r => setResources(prev => (prev || []).map(x => x.id === r.id ? { ...x, clicks: (x.clicks || 0) + 1 } : x), { silent: true });

  const items = resources || [];
  const live = items.filter(r => r.active);
  const byOrder = (a, b) => (resourceLayout(a).order ?? 99) - (resourceLayout(b).order ?? 99) || b.id - a.id;
  const featured = live.find(r => resourceLayout(r).featured) || null;
  const templates = live.filter(r => r.type === "模板").sort(byOrder);
  const tools = live.filter(r => r !== featured && r.type !== "模板").sort(byOrder);
  const to = p => ({ href: pathForPage(p), onClick: e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); setPage(p); } });

  const ToolCard = ({ r }) => {
    const L = resourceLayout(r);
    return (
      <article className={"rs-tool" + (L.highlight ? " rs-tool-hi" : "") + (L.anchor ? " nx-anchor" : "")} id={L.anchor}>
        <p className="rs-tag">{L.category || r.type}</p>
        <h3>{r.name}</h3>
        <p>{r.desc}</p>
        {r.url && (
          <a className="rs-tool-cta" href={normalizeResourceUrl(r.url)} target="_blank" rel="noopener noreferrer" onClick={() => countClick(r)}>
            {L.cta || (r.type === "模板" ? "取得模板 →" : "打開工具 →")}
          </a>
        )}
        {isAdmin && (
          <div className="rs-admin-row">
            <span>{r.clicks || 0} 次點擊</span>
            <button className="pg" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => startEdit(r)}>編輯</button>
            <button className="pg" style={{ fontSize: 11, padding: "4px 10px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => del(r.id)}>刪除</button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="nx-page">
      {/* Hero */}
      <div className="nx-in rs-hero">
        <p className="nx-eyebrow" style={{ letterSpacing: ".16em" }}>免費工具</p>
        <h1>先算清楚，再決定最適合你的</h1>
        <p>免費工具都不用註冊、不用下載，填幾個數字就有結果！<br className="nx-hide-mob" />挑一個現在最讓你頭痛的開始。</p>
      </div>

      {/* 卡點分流 */}
      <section className="nx-band" style={{ paddingBlock: "clamp(24px,3vw,36px)" }}>
        <div className="nx-in">
          <p className="nx-eyebrow nx-eyebrow-mute" style={{ marginBottom: 18, letterSpacing: ".12em" }}>你現在卡在哪？</p>
          <div className="rs-banner">
            <div>
              <h2>不確定的話，先花 60 秒找起點</h2>
              <p>三個問題，找出目前最值得先處理的卡點</p>
            </div>
            <a className="nx-btn nx-btn-pri nx-btn-sm" {...to("tool-quiz")}>開始測驗 →</a>
          </div>
          <div className="rs-blocks">
            {RS_BLOCKERS.map(([t, d, anchor]) => (
              <a key={anchor} className="rs-block" href={"#" + anchor}><strong>{t}</strong><span>{d}</span></a>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingBlock: "clamp(28px,4vw,48px) clamp(26px,3.4vw,40px)" }}>
        <div className="nx-in">
          {/* 頭條工具 */}
          {featured && (() => {
            const L = resourceLayout(featured);
            return (
              <div className="rs-lead nx-anchor" id={L.anchor}>
                <div>
                  {L.badge && <span className="rs-lead-badge">{L.badge}</span>}
                  <h2>{featured.name}</h2>
                  <p>{featured.desc}</p>
                  <div className="rs-lead-actions">
                    <a className="nx-btn nx-btn-pri nx-btn-md" href={normalizeResourceUrl(featured.url)} target="_blank" rel="noopener noreferrer" onClick={() => countClick(featured)}>{L.cta || "打開工具 →"}</a>
                    {L.meta && <span>{L.meta}</span>}
                  </div>
                </div>
                {featured.img
                  ? <img className="rs-lead-img" src={featured.img} alt={featured.name} loading="lazy" />
                  : <div className="rs-lead-img" />}
              </div>
            );
          })()}

          {/* 工具卡 */}
          <div className="rs-tools">
            {tools.filter(r => !resourceLayout(r).highlight).map(r => <ToolCard key={r.id} r={r} />)}
            <article className="rs-tool">
              <p className="rs-tag">{RS_TOOL_QUIZ.category}</p>
              <h3>{RS_TOOL_QUIZ.name}</h3>
              <p>{RS_TOOL_QUIZ.desc}</p>
              <a className="rs-tool-cta" {...to("tool-quiz")}>{RS_TOOL_QUIZ.cta}</a>
            </article>
            {tools.filter(r => resourceLayout(r).highlight).map(r => <ToolCard key={r.id} r={r} />)}
          </div>

          {/* 模板 */}
          {templates.length > 0 && (
            <div className="rs-templates">
              <h2>拿去直接用的模板</h2>
              <p>複製一份到自己的雲端硬碟就能開始填</p>
              <div className="rs-tools" style={{ marginTop: 0 }}>
                {templates.map(r => <ToolCard key={r.id} r={r} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 工具 / App / 手帳的分工 */}
      <section className="nx-band" style={{ paddingBlock: "clamp(28px,3.4vw,40px)" }}>
        <div className="nx-in rs-roles">
          <div>
            <h2>工具告訴你「現在的數字」<br />App 陪你走完一整個月</h2>
            <p>免費工具是單次的一張快照：算完你會知道問題在哪。真正的改變發生在下個月，預算排好、每天記下來、月底看診斷。那一段是 88La財務導航在做的事。</p>
          </div>
          <div className="rs-role-list">
            {RS_ROLES.map(([k, d]) => (
              <div key={k} className="rs-role"><b>{k}</b><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="nx-in rs-cta">
        <h2>算完了，想試著排一次完整的預算？</h2>
        <p>財務導航可以免費體驗，不用綁信用卡</p>
        <div className="rs-cta-row">
          <a className="nx-btn nx-btn-pri nx-btn-md" {...to("app")}>免費體驗財務導航</a>
          <a className="nx-btn nx-btn-sec nx-btn-sec-strong nx-btn-md" {...to("guide")}>先看功能說明</a>
        </div>
      </div>

      {/* 後台：資源維護與會員文章密碼 */}
      {isAdmin && (
        <div style={{ borderTop: `2px dashed ${BORDER}`, background: GRAY, padding: "24px 20px" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <p style={{ fontSize: 13, color: MID, fontWeight: 500 }}>後台：資源維護</p>
              <button className="pb" style={{ fontSize: 12, padding: "6px 14px" }} onClick={startAdd}>＋ 新增資源</button>
            </div>
            {editing && (
              <div style={{ background: WHITE, padding: 24, marginBottom: 24, border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 11, color: MID, letterSpacing: "1px", marginBottom: 20 }}>{editing === "new" ? "新增資源" : "編輯資源"}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="grid2">
                  <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>名稱</p><input value={form.name} onChange={sf("name")} /></div>
                  <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>類型</p><select value={form.type} onChange={sf("type")} style={{ border: "1px solid #D0D5DA", padding: "10px 12px", background: WHITE, width: "100%" }}>{["模板", "教學", "工具", "其他"].map(t => <option key={t}>{t}</option>)}</select></div>
                  <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>連結</p><input value={form.url} onChange={e => { sf("url")(e); setResUrlErr(""); }} placeholder="https://..." />{resUrlErr && <p style={{ fontSize: 11, color: "#C0392B", marginTop: 4 }}>{resUrlErr}</p>}</div>
                </div>
                <div style={{ marginBottom: 20 }}><ImgUploader label="圖片（頭條工具會用到）" value={form.img} onChange={v => setForm(p => ({ ...p, img: v }))} aspect="16/9" /></div>
                <div style={{ marginBottom: 16 }}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>說明</p><textarea value={form.desc} onChange={sf("desc")} style={{ minHeight: 80, border: "1px solid #D0D5DA", padding: "10px", background: WHITE }} /></div>
                <label style={{ fontSize: 12, color: MID, display: "flex", gap: 8, alignItems: "center", marginBottom: 24, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} style={{ width: "auto" }} />上架顯示
                </label>
                <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.name.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
              </div>
            )}
            {items.filter(r => !r.active).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, color: LIGHT, marginBottom: 12 }}>未上架</p>
                {items.filter(r => !r.active).map(r => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${BORDER}`, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: LIGHT }}>{r.name}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="pg" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => startEdit(r)}>編輯</button>
                      <button className="pg" style={{ fontSize: 11, padding: "4px 10px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => del(r.id)}>刪除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "16px 20px", marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: MID, lineHeight: 1.8 }}>會員文章密碼，讀者需輸入此密碼才能看到會員限定文章全文。</p>
              <p style={{ fontSize: 11, color: LIGHT, marginTop: 6, marginBottom: 12, lineHeight: 1.6 }}>會員全文會透過受保護 API 讀取，解鎖前不會載入到瀏覽器 DOM。密碼儲存後不會在畫面上顯示原始內容。</p>
              {!editPwd ? (
                <span onClick={() => { setEditPwd(true); setPwdVal(""); setPwdMsg(""); }} style={{ fontSize: 12, color: O, cursor: "pointer", textDecoration: "underline" }}>修改密碼</span>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input type="text" value={pwdVal} onChange={e => setPwdVal(e.target.value)} placeholder="輸入新密碼" style={{ maxWidth: 220 }} />
                  <button className="pb" disabled={pwdSaving} onClick={savePwd}>{pwdSaving ? "儲存中..." : "儲存"}</button>
                  <button className="pg" onClick={() => { setEditPwd(false); setPwdVal(""); setPwdMsg(""); }}>取消</button>
                </div>
              )}
              {pwdMsg && <p style={{ fontSize: 12, color: pwdMsg.includes("已更新") ? "#4a8c5c" : "#C0392B", marginTop: 8 }}>{pwdMsg}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

//  NEW: 電子報訂閱
function Newsletter({ newsletter, setNewsletter, isAdmin, articles, setId, setPage }) {
  const info = { ...DEFAULTS.newsletter, ...(newsletter || {}) };
  const [editMode, setEditMode] = useState(false);
  const [tmp, setTmp] = useState(info);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subErr, setSubErr] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [sendResult, setSendResult] = useState("");
  const save = () => { setNewsletter(tmp); setEditMode(false); };
  const recent = [...(articles || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const open = id => { const a = (articles || []).find(x => x.id === id); setId(id); setPage("article"); window.scrollTo({ top: 0, behavior: "instant" }); history.pushState({}, "", "/article/" + encodeURIComponent(a?.slug || id)); };
  const handleSubscribe = async () => {
    const normalized = email.trim();
    if (!isValidEmail(normalized) || submitting) { setSubErr("請輸入有效的 Email"); return; }
    setSubmitting(true); setSubErr("");
    try {
      const r = await fetch("/api/newsletter-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      if (!r.ok) throw new Error("subscribe_failed");
      setSubmitted(true);
    } catch {
      setSubErr("訂閱儲存失敗，請稍後再試");
    }
    setSubmitting(false);
  };
  const handleSendNewsletter = async () => {
    const subject = sendSubject.trim();
    const body = sendBody.trim();
    if (!subject || !body || sendingNewsletter) { setSendResult("請先填寫主旨與內容"); return; }
    if (!window.confirm(`確定要寄出「${subject}」給目前所有已訂閱讀者嗎？`)) return;
    setSendingNewsletter(true); setSendResult("");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("admin_required");
      const campaignId = (globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`).replaceAll("-", "");
      const r = await fetch("/api/newsletter?action=send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ subject, body, campaignId }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "send_failed");
      setSendResult(`已寄給 ${data.recipientCount} 位訂閱者`);
      setSendSubject(""); setSendBody("");
    } catch (error) {
      const message = error.message === "email_service_not_configured" ? "寄信服務尚未完成設定" : "寄送失敗，請稍後再試";
      setSendResult(message);
    }
    setSendingNewsletter(false);
  };
  if (editMode) return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 32px" }} className="page-wrap">
      <button className="pg" onClick={() => setEditMode(false)} style={{ marginBottom: 32 }}>← 取消</button>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>訂閱人數文字</p><input value={tmp.subscriberCount || ""} onChange={e => setTmp(p => ({ ...p, subscriberCount: e.target.value }))} placeholder="1,000+" /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>「位讀者」文字</p><input value={tmp.readerSuffix || ""} onChange={e => setTmp(p => ({ ...p, readerSuffix: e.target.value }))} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>標題第二行（橘字）</p><input value={tmp.titleLine2 || ""} onChange={e => setTmp(p => ({ ...p, titleLine2: e.target.value }))} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>介紹文字</p><textarea value={tmp.intro || ""} onChange={e => setTmp(p => ({ ...p, intro: e.target.value }))} style={{ minHeight: 100 }} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>備註</p><input value={tmp.archiveNote || ""} onChange={e => setTmp(p => ({ ...p, archiveNote: e.target.value }))} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>Email 輸入框提示文字</p><input value={tmp.emailPlaceholder || ""} onChange={e => setTmp(p => ({ ...p, emailPlaceholder: e.target.value }))} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>訂閱按鈕文字</p><input value={tmp.subscribeBtn || ""} onChange={e => setTmp(p => ({ ...p, subscribeBtn: e.target.value }))} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>訂閱成功標題</p><input value={tmp.successTitle || ""} onChange={e => setTmp(p => ({ ...p, successTitle: e.target.value }))} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>訂閱成功說明</p><input value={tmp.successSub || ""} onChange={e => setTmp(p => ({ ...p, successSub: e.target.value }))} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>「最新文章」標籤</p><input value={tmp.recentLabel || ""} onChange={e => setTmp(p => ({ ...p, recentLabel: e.target.value }))} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>「最新文章」標題</p><input value={tmp.recentHeading || ""} onChange={e => setTmp(p => ({ ...p, recentHeading: e.target.value }))} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>查看全部連結文字</p><input value={tmp.viewAllLink || ""} onChange={e => setTmp(p => ({ ...p, viewAllLink: e.target.value }))} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>閱讀連結文字</p><input value={tmp.readLink || ""} onChange={e => setTmp(p => ({ ...p, readLink: e.target.value }))} /></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 28 }}><button className="pb" onClick={save}>儲存</button><button className="pg" onClick={() => setEditMode(false)}>取消</button></div>
    </div>
  );
  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${O2} 0%, #FFF 100%)`, padding: "80px 32px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -60, top: -60, width: 360, height: 360, background: `radial-gradient(circle, ${CORAL}30 0%, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
          {isAdmin && <button onClick={() => { setTmp(info); setEditMode(true); }} style={{ position: "absolute", top: -48, right: 0, background: O, color: WHITE, border: "none", padding: "6px 14px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>編輯</button>}
          <div className="hero-stagger hs-1" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: O2, border: `1px solid ${O}25`, padding: "6px 14px", marginBottom: 24 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={O} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span style={{ fontSize: 12, color: O, fontWeight: 500 }}>{info.subscriberCount} {info.readerSuffix}</span>
          </div>
          <h1 className="hero-stagger hs-2" style={{ fontSize: 42, fontWeight: 700, color: CHAR, lineHeight: 1.25, marginBottom: 16 }}>88La<br /><span style={{ color: O }}>{info.titleLine2}</span></h1>
          <p className="hero-stagger hs-3" style={{ fontSize: 16, color: MID, lineHeight: 1.9, marginBottom: 32, maxWidth: 460, whiteSpace: "pre-wrap" }}>{info.intro}</p>
          {submitted ? (
            <div style={{ background: O2, border: `1px solid ${O}30`, padding: "20px 24px" }}>
              <p style={{ fontSize: 14, color: O, fontWeight: 500 }}>{info.successTitle}</p>
              <p style={{ fontSize: 13, color: MID, marginTop: 6 }}>{info.successSub}</p>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 0, maxWidth: 420 }}>
              <input type="email" placeholder={info.emailPlaceholder} value={email} onChange={e => { setEmail(e.target.value); setSubErr(""); }} onKeyDown={e => e.key === "Enter" && handleSubscribe()} style={{ flex: 1, borderBottom: "none", border: `1px solid #D0D5DA`, padding: "12px 16px", fontSize: 14, background: WHITE }} />
              <button className="pb" style={{ padding: "12px 22px", fontSize: 13, flexShrink: 0 }} onClick={handleSubscribe} disabled={!email.trim() || submitting}>{submitting ? "送出中..." : info.subscribeBtn}</button>
            </div>
          )}
          {subErr && <p style={{ fontSize: 12, color: "#C0392B", marginTop: 10 }}>{subErr}</p>}
          <p style={{ fontSize: 11, color: LIGHT, marginTop: 10 }}>{info.archiveNote}</p>
        </div>
      </div>
      {isAdmin && (
        <div style={{ maxWidth: 720, margin: "40px auto 0", padding: "0 32px" }} className="page-wrap">
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: 24 }}>
            <p className="section-label" style={{ marginBottom: 8 }}>管理員寄送</p>
            <h2 style={{ fontSize: 20, color: CHAR, marginBottom: 18 }}>寄送電子報</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={sendSubject} maxLength={160} onChange={e => { setSendSubject(e.target.value); setSendResult(""); }} placeholder="Email 主旨" />
              <textarea value={sendBody} maxLength={20000} onChange={e => { setSendBody(e.target.value); setSendResult(""); }} placeholder="電子報內容，可使用換行分段" style={{ minHeight: 220 }} />
              <p style={{ fontSize: 12, color: LIGHT }}>每封信都會附上退訂連結。按下寄送後，系統會再確認一次。</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="pb" onClick={handleSendNewsletter} disabled={!sendSubject.trim() || !sendBody.trim() || sendingNewsletter}>{sendingNewsletter ? "寄送中..." : "寄送電子報"}</button>
                {sendResult && <span style={{ fontSize: 12, color: sendResult.startsWith("已寄給") ? "#4A8C5C" : "#B84040" }}>{sendResult}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
      {recent.length > 0 && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px" }} className="page-wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div><p className="section-label" style={{ marginBottom: 8 }}>{info.recentLabel}</p><h2 style={{ fontSize: 22, fontWeight: 700, color: CHAR }}>{info.recentHeading}</h2></div>
            <span onClick={() => setPage("journal")} style={{ fontSize: 13, color: O, cursor: "pointer" }}>{info.viewAllLink}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recent.map(a => (
              <div key={a.id} className="card" onClick={() => open(a.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", gap: 16, flexWrap: "wrap", borderLeft: "none", borderRight: "none", borderTop: "none", borderRadius: 0 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                    <span className="tag">{a.tag}</span>
                    <span style={{ fontSize: 11, color: LIGHT }}>{a.date}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 500, color: CHAR, lineHeight: 1.5 }}>{a.title}</h3>
                </div>
                <span style={{ fontSize: 12, color: O, fontWeight: 500, flexShrink: 0 }}>{info.readLink}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

//  NEW: 合作洽談
function Contact({ links, contactContent, setContactContent, isAdmin }) {
  const l = links || DEFAULTS.links;
  const rawContact = { ...DEFAULTS.contactContent, ...(contactContent || {}) };
  const c = {
    ...rawContact,
    successTitle: rawContact.successTitle === "訊息已送出" ? "已開啟郵件程式" : rawContact.successTitle,
    successSub: rawContact.successSub === "感謝你的來信，我會盡快回覆。" ? "請確認內容後，再按下寄送。" : rawContact.successSub,
  };
  const [editIntro, setEditIntro] = useState(false);
  const [tmpIntro, setTmpIntro] = useState(c.intro);
  const [editCopy, setEditCopy] = useState(false);
  const [tmpCopy, setTmpCopy] = useState(c);
  const [form, setForm] = useState({ name: "", company: "", type: "", message: "", email: "" });
  const [submitted, setSubmitted] = useState(false);
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const submit = () => {
    if (!form.name || !form.message || !isValidEmail(form.email)) return;
    const subject = `合作申請 - ${form.type || "一般洽詢"}`;
    const body = `姓名：${form.name}\n公司：${form.company}\nEmail：${form.email}\n合作類型：${form.type}\n\n${form.message}`;
    window.location.href = `mailto:${l.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };
  return (
    <div>
      <div style={{ background: GRAD, padding: "52px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 10 }}>{c.label}</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: CHAR }}>{c.heading}</h1>
          <p style={{ fontSize: 13, color: MID, marginTop: 8 }}>{c.sub}</p>
          {isAdmin && <span onClick={() => { setTmpCopy(c); setEditCopy(true); }} style={{ fontSize: 11, color: O, cursor: "pointer", marginTop: 8, display: "inline-block" }}>編輯頁面文字</span>}
        </div>
      </div>
      {editCopy && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 61, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: WHITE, padding: 32, width: "100%", maxWidth: 520, maxHeight: "80vh", overflowY: "auto" }}>
            <p style={{ fontSize: 13, letterSpacing: "2px", color: CORAL2, marginBottom: 20, fontWeight: 500 }}>編輯合作洽談頁文字</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                ["label", "小標籤"], ["heading", "標題"], ["sub", "副標題"],
                ["nameLabel", "姓名欄位標籤"], ["companyLabel", "公司欄位標籤"], ["emailLabel", "Email 欄位標籤"],
                ["typeLabel", "合作類型標籤"], ["typePlaceholder", "合作類型預設選項"],
                ["messageLabel", "合作說明標籤"], ["messagePlaceholder", "合作說明提示文字"], ["submitBtn", "送出按鈕文字"],
                ["successTitle", "送出成功標題"], ["successSub", "送出成功說明"],
              ].map(([k, label]) => (
                <div key={k}>
                  <p style={{ fontSize: 12, color: MID, marginBottom: 4 }}>{label}</p>
                  <input value={tmpCopy[k] ?? ""} onChange={e => setTmpCopy(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
              <div>
                <p style={{ fontSize: 12, color: MID, marginBottom: 4 }}>合作類型選項（每行一項）</p>
                <textarea value={tmpCopy.typeOptions} onChange={e => setTmpCopy(p => ({ ...p, typeOptions: e.target.value }))} style={{ minHeight: 100 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pb" onClick={() => { setContactContent(tmpCopy); setEditCopy(false); }}>儲存</button>
              <button className="pg" onClick={() => setEditCopy(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }} className="page-wrap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 64 }} className="about-grid">
          <div>
            {editIntro ? (
              <div style={{ marginBottom: 20 }}>
                <textarea value={tmpIntro} onChange={e => setTmpIntro(e.target.value)} style={{ minHeight: 100, marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="pb" style={{ fontSize: 12 }} onClick={() => { setContactContent(prev => ({ ...(prev || DEFAULTS.contactContent), intro: tmpIntro })); setEditIntro(false); }}>儲存</button>
                  <button className="pg" style={{ fontSize: 12 }} onClick={() => setEditIntro(false)}>取消</button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 36 }}>
                <p style={{ fontSize: 14, color: MID, lineHeight: 2.1, whiteSpace: "pre-wrap" }}>{c.intro}</p>
                {isAdmin && <button className="pg" style={{ fontSize: 11, padding: "4px 10px", marginTop: 10 }} onClick={() => { setTmpIntro(c.intro); setEditIntro(true); }}>編輯說明</button>}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Email", l.email, `mailto:${l.email}`], ["Instagram", "@every_dollars", l.instagram], ["LINE 官方帳號", "@367xhgyr", l.lineOfficial]].map(([label, value, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", flexDirection: "column", gap: 3, padding: "14px 18px", background: GRAY, border: `1px solid ${BORDER}`, transition: "border-color .18s,box-shadow .18s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = O; e.currentTarget.style.boxShadow = `0 4px 16px rgba(200,90,20,.08)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <span style={{ fontSize: 10, color: O, letterSpacing: ".5px", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 14, color: CHAR }}>{value}</span>
                </a>
              ))}
            </div>
          </div>
          {submitted ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 52, height: 52, background: O2, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={O} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ fontSize: 18, fontWeight: 500, color: CHAR, marginBottom: 8 }}>{c.successTitle}</p>
                <p style={{ fontSize: 14, color: MID }}>{c.successSub}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="grid2">
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{c.nameLabel}</p><input value={form.name} onChange={sf("name")} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{c.companyLabel}</p><input value={form.company} onChange={sf("company")} /></div>
              </div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{c.emailLabel}</p><input type="email" value={form.email} onChange={sf("email")} /></div>
              <div>
                <p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{c.typeLabel}</p>
                <select value={form.type} onChange={sf("type")} style={{ border: "1px solid #D0D5DA", padding: "10px 12px", background: WHITE, width: "100%" }}>
                  <option value="">{c.typePlaceholder}</option>
                  {c.typeOptions.split("\n").filter(Boolean).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{c.messageLabel}</p><textarea placeholder={c.messagePlaceholder} value={form.message} onChange={sf("message")} style={{ minHeight: 120, border: "none", background: GRAY, padding: "12px 14px", borderBottom: `1px solid #D0D5DA` }} /></div>
              <button className="pb" onClick={submit} disabled={!form.name || !form.message || !isValidEmail(form.email)} style={{ alignSelf: "flex-start", padding: "13px 32px" }}>{c.submitBtn}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const QUIZ_Q_LABELS = {
  q1: "每月存款", q2: "記帳習慣", q3: "想解決的問題", q4: "緊急備用金",
  q5: "卡關點", q6: "實體儀式感", q7: "支付方式",
};

//  存錢袋測驗回答紀錄
function QuizResponsesAdmin() {
  const [responses, setResponses] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setResponses(null);
    setError(false);
    getDocs(query(collection(db, "quizResponses"), orderBy("createdAt", "desc")))
      .then(snap => setResponses(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => { setError(true); setResponses([]); });
  };
  useEffect(load, []);

  const del = async (id) => {
    if (!window.confirm("確定刪除這筆回答紀錄？")) return;
    await deleteDoc(doc(db, "quizResponses", id));
    setResponses(prev => prev.filter(r => r.id !== id));
  };

  const fmtTime = (r) => {
    if (!r.createdAt?.toDate) return "，";
    return r.createdAt.toDate().toLocaleString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const exportCSV = () => {
    const qKeys = Object.keys(QUIZ_Q_LABELS);
    const header = ["時間", "存錢人格", ...qKeys.map(k => QUIZ_Q_LABELS[k])];
    const rows = responses.map(r => [fmtTime(r), r.persona || "", ...qKeys.map(k => r.answers?.[k] || "")]);
    const csv = [header, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `存錢袋測驗回答_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const personaCounts = {};
  (responses || []).forEach(r => { const p = r.persona || "未知"; personaCounts[p] = (personaCounts[p] || 0) + 1; });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <p style={{ fontSize: 13, color: MID }}>
          {responses === null ? "載入中…" : error ? "載入失敗，請重試" : `共 ${responses.length} 筆回答`}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pg" style={{ fontSize: 12, padding: "6px 16px" }} onClick={load}>重新整理</button>
          <button className="pb" style={{ fontSize: 12, padding: "6px 16px" }} onClick={exportCSV} disabled={!responses?.length}>匯出 CSV</button>
        </div>
      </div>

      {!!responses?.length && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {Object.entries(personaCounts).sort((a, b) => b[1] - a[1]).map(([persona, count]) => (
            <span key={persona} style={{ fontSize: 12, background: GRAY, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "6px 14px", color: CHAR }}>
              {persona} <b style={{ color: O }}>{count}</b>
            </span>
          ))}
        </div>
      )}

      {responses?.length === 0 && !error && <p style={{ fontSize: 13, color: MID, padding: "40px 0", textAlign: "center" }}>目前還沒有回答紀錄。</p>}

      {!!responses?.length && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {responses.map(r => (
            <div key={r.id} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: MID }}>{fmtTime(r)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: CHAR }}>{r.persona || "，"}</span>
                </div>
                <span onClick={() => del(r.id)} style={{ fontSize: 11, color: "#E74C3C", cursor: "pointer", flexShrink: 0 }}>刪除</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
                {Object.keys(QUIZ_Q_LABELS).map(k => (
                  <span key={k} style={{ fontSize: 11, color: MID }}>
                    {QUIZ_Q_LABELS[k]}：<b style={{ color: CHAR }}>{r.answers?.[k] || "，"}</b>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//  存錢袋測驗管理
function SavingsBagQuizAdmin({ savingsBagQuiz, setSavingsBagQuiz }) {
  const data = savingsBagQuiz || DEFAULTS.savingsBagQuiz;
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState({});
  const [tab, setTab] = useState("content");

  const PRODUCT_LABELS = {
    daily_budget: "每日預算記錄組", spending_tracker: "極簡收支分配表",
    dream_fund: "夢想變現儲蓄套組", world_advance: "環遊世界存錢袋（進階版）",
    world_challenge: "環遊世界挑戰卡", game_challenge: "闖關打怪存錢袋",
    daily_allocation: "日常分配項目存錢袋",
  };
  const SEASONAL_LABELS = { red_packet: "紅包預存備戰卡", christmas: "聖誕節限定存錢袋" };

  const startEdit = (section, key) => {
    const item = data[section][key];
    const imgs = (item.imgs && item.imgs.length) ? item.imgs : (item.img ? [item.img] : []);
    setForm({ ...item, howtoText: (item.howto || []).join("\n"), imgs });
    setEditingKey(`${section}__${key}`);
  };

  const save = (section, key) => {
    const { howtoText, img, ...rest } = form;
    const newItem = { ...rest, howto: howtoText.split("\n").filter(s => s.trim()), imgs: form.imgs || [] };
    const newData = { ...data, [section]: { ...data[section], [key]: newItem } };
    setSavingsBagQuiz(newData);
    setEditingKey(null);
  };

  const toggleSeasonal = () => setSavingsBagQuiz({ ...data, showSeasonal: !data.showSeasonal });

  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const renderEditForm = (section, key) => (
    <div style={{ background: GRAY, padding: 24, border: `1px solid ${BORDER}`, marginTop: 12, marginBottom: 20 }}>
      <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>編輯：{PRODUCT_LABELS[key] || SEASONAL_LABELS[key]}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 80 }}><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>Icon</p><input value={form.icon || ""} onChange={sf("icon")} style={{ width: "100%" }} /></div>
          <div style={{ flex: 1 }}><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>名稱</p><input value={form.name || ""} onChange={sf("name")} /></div>
        </div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>使用場景（「如果你…→ 這個幫你…」格式）</p><textarea value={form.scene || ""} onChange={sf("scene")} style={{ minHeight: 60 }} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>第一週步驟（每行一個步驟）</p><textarea value={form.howtoText || ""} onChange={sf("howtoText")} style={{ minHeight: 100 }} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>購買連結</p><input value={form.url || ""} onChange={sf("url")} placeholder="https://..." /></div>
        <div>
          <p style={{ fontSize: 12, color: MID, marginBottom: 10 }}>產品圖片（可多張）</p>
          {(form.imgs || []).map((url, idx) => (
            <div key={idx} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: MID }}>圖片 {idx + 1}</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, imgs: (p.imgs || []).filter((_, i) => i !== idx) }))}
                        style={{ fontSize: 11, color: "#c96b2f", background: "none", border: "none", cursor: "pointer", padding: 0 }}>刪除</button>
              </div>
              <ImgUploader label="" value={url} onChange={v => setForm(p => ({ ...p, imgs: (p.imgs || []).map((u, i) => i === idx ? v : u) }))} aspect="4/3" />
            </div>
          ))}
          <ImgUploader label="＋ 新增圖片" value="" onChange={v => { if (v) setForm(p => ({ ...p, imgs: [...(p.imgs || []), v] })); }} aspect="4/3" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button className="pb" onClick={() => save(section, key)} disabled={!form.name?.trim()}>儲存</button>
        <button className="pg" onClick={() => setEditingKey(null)}>取消</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 28px" }} className="page-wrap">
      <h2 style={{ fontSize: 22, fontWeight: 700, color: CHAR, marginBottom: 8 }}>存錢袋測驗管理</h2>
      <p style={{ fontSize: 13, color: MID, marginBottom: 24 }}>編輯各款存錢袋的圖片、說明與連結，前台測驗頁會即時更新；也可以在這裡查看使用者的作答紀錄。</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 32, borderBottom: `1px solid ${BORDER}` }}>
        <span onClick={() => setTab("content")} style={{ fontSize: 13, padding: "10px 4px", marginRight: 20, cursor: "pointer", color: tab === "content" ? O : MID, fontWeight: tab === "content" ? 700 : 400, borderBottom: tab === "content" ? `2px solid ${O}` : "2px solid transparent" }}>產品內容管理</span>
        <span onClick={() => setTab("responses")} style={{ fontSize: 13, padding: "10px 4px", cursor: "pointer", color: tab === "responses" ? O : MID, fontWeight: tab === "responses" ? 700 : 400, borderBottom: tab === "responses" ? `2px solid ${O}` : "2px solid transparent" }}>回答紀錄</span>
      </div>

      {tab === "responses" && <QuizResponsesAdmin />}

      {tab === "content" && <>
      {/* 節慶開關 */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px 20px", marginBottom: 32, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: CHAR, marginBottom: 2 }}>節慶限定款顯示</p>
          <p style={{ fontSize: 12, color: MID }}>開啟後，測驗結果頁會顯示節慶限定款區塊（目前：{data.showSeasonal ? "顯示中" : "已隱藏"}）</p>
        </div>
        <button className={data.showSeasonal ? "pb" : "pg"} style={{ fontSize: 12, padding: "6px 16px", flexShrink: 0 }} onClick={toggleSeasonal}>
          {data.showSeasonal ? "關閉節慶款" : "開啟節慶款"}
        </button>
      </div>

      {/* 一般產品 */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: CHAR, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>一般產品（7 款）</h3>
      {Object.keys(PRODUCT_LABELS).map(key => {
        const item = data.products?.[key] || {};
        const isEditing = editingKey === `products__${key}`;
        return (
          <div key={key} style={{ marginBottom: 4 }}>
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              {(item.imgs?.[0] || item.img) ? <img src={item.imgs?.[0] || item.img} alt={item.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} /> : <span style={{ fontSize: 26, flexShrink: 0, width: 44, textAlign: "center" }}>{item.icon}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: CHAR }}>{item.name || PRODUCT_LABELS[key]}</p>
                <p style={{ fontSize: 11, color: MID, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.scene || "，"}</p>
              </div>
              <button className="pg" style={{ fontSize: 11, padding: "4px 12px", flexShrink: 0 }} onClick={() => isEditing ? setEditingKey(null) : startEdit("products", key)}>{isEditing ? "收起" : "編輯"}</button>
            </div>
            {isEditing && renderEditForm("products", key)}
          </div>
        );
      })}

      {/* 節慶產品 */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: CHAR, margin: "32px 0 16px", paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>節慶限定款（2 款）</h3>
      {Object.keys(SEASONAL_LABELS).map(key => {
        const item = data.seasonal?.[key] || {};
        const isEditing = editingKey === `seasonal__${key}`;
        return (
          <div key={key} style={{ marginBottom: 4 }}>
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              {(item.imgs?.[0] || item.img) ? <img src={item.imgs?.[0] || item.img} alt={item.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} /> : <span style={{ fontSize: 26, flexShrink: 0, width: 44, textAlign: "center" }}>{item.icon}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: CHAR }}>{item.name || SEASONAL_LABELS[key]}</p>
                <p style={{ fontSize: 11, color: MID, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.scene || "，"}</p>
              </div>
              <button className="pg" style={{ fontSize: 11, padding: "4px 12px", flexShrink: 0 }} onClick={() => isEditing ? setEditingKey(null) : startEdit("seasonal", key)}>{isEditing ? "收起" : "編輯"}</button>
            </div>
            {isEditing && renderEditForm("seasonal", key)}
          </div>
        );
      })}
      </>}
    </div>
  );
}

//  方案說明
function PricingPage({ appContent, setPage }) {
  const c = normalizeAppContent(appContent);
  const plans = c.plans || [];

  const ALL_FEATURES = [
    "即時記帳（情緒、類別、分期）",
    "Google Sheets 雲端同步，資料永遠屬於你",
    "CSV / PDF 匯出",
    "信用卡帳單與分期追蹤",
    "負債還款進度視覺化",
    "個人 / 公費 / 家庭三種模式",
    "PWA 主畫面安裝，接近原生 App",
    "持續功能更新",
  ];

  return (
    <div>
      <div style={{ background: GRAD, padding: "72px 32px 56px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 10 }}>PRICING</p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: CHAR, lineHeight: 1.3, marginBottom: 14 }}>選擇最適合你的方案</h1>
          <p style={{ fontSize: 15, color: MID, lineHeight: 1.9, maxWidth: 520 }}>{c.pricingNote || "這不是記帳的錢，是每個月一次解讀的錢。"}</p>
          <PriceNote style={{ marginTop: 18 }} />
        </div>
      </div>
      <div style={{ background: GRAY, padding: "72px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(plans.length, 2)}, 1fr)`, gap: 24 }} className="grid2">
            {plans.map(plan => (
              <div key={plan.id} style={{ background: plan.highlight ? O : WHITE, border: `2px solid ${plan.highlight ? O : BORDER}`, borderRadius: 20, padding: "40px 32px", position: "relative", boxShadow: plan.highlight ? "0 8px 40px rgba(200,90,20,.22)" : "0 2px 16px rgba(0,0,0,.06)", transition: "transform .3s, box-shadow .3s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = plan.highlight ? "0 16px 48px rgba(200,90,20,.32)" : "0 20px 40px rgba(0,0,0,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = plan.highlight ? "0 8px 40px rgba(200,90,20,.22)" : "0 2px 16px rgba(0,0,0,.06)"; }}
              >
                {plan.badge && <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: CHAR, color: WHITE, fontSize: 11, padding: "4px 14px", borderRadius: 20, letterSpacing: ".5px", fontWeight: 500, whiteSpace: "nowrap" }}>{plan.badge}</span>}
                <p style={{ fontSize: 12, letterSpacing: "1.5px", color: plan.highlight ? "rgba(255,255,255,.6)" : MID, marginBottom: 12, fontWeight: 500 }}>{(plan.name || "").toUpperCase()}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 32, flexWrap: "nowrap" }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: plan.highlight ? WHITE : CHAR, whiteSpace: "nowrap" }}><Price>{plan.price}</Price></span>
                  <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,.55)" : LIGHT, whiteSpace: "nowrap" }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
                  {(plan.features || []).filter(Boolean).map((f, i) => (
                    <li key={i} style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,.88)" : MID, display: "flex", alignItems: "center", gap: 10 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "rgba(255,255,255,.7)" : O} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a {...appCtaProps("plans-page")}>
                  <button style={{ width: "100%", background: plan.highlight ? WHITE : O, color: plan.highlight ? O : WHITE, border: "none", padding: "14px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", borderRadius: 8, transition: "opacity .18s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    立即開始使用 →
                  </button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: "72px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* 月度智慧解讀：定價頁的價值錨點。刻意放在九項規格清單「上方」且視覺層級更高，
              先讓訪客看見解讀這件事，再看功能列表。底色沿用同頁 hero 的 O2，不另開色票。
              B 句保留「診斷」兩字，那是 App 裡的功能名稱，不跟標題的「解讀」統一。 */}
          <div style={{ background: O2, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "clamp(28px,4vw,40px) clamp(24px,3.4vw,36px)", marginBottom: 56 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: CHAR, marginBottom: 16 }}>月度智慧解讀</h2>
            <p style={{ fontSize: 15, color: CHAR, lineHeight: 1.9, marginBottom: 4 }}>不想再被卡費追著跑，看見「真正可用餘額」剩多少。</p>
            <p style={{ fontSize: 15, color: CHAR, lineHeight: 1.9 }}>預算一直超支？診斷幫你揪出真相。</p>
          </div>
          <p className="section-label" style={{ marginBottom: 10 }}>FEATURES</p>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: CHAR, marginBottom: 40 }}>所有方案都包含</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="grid2">
            {ALL_FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: GRAY, borderRadius: 10 }}>
                <div style={{ width: 30, height: 30, background: O2, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={O} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: 13, color: CHAR, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: O2, padding: "48px 32px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {["訂閱後即可使用全功能，無試用期限制。", "資料完全屬於你：儲存在你自己的 Google Sheets，不受方案到期影響。", "方案到期後仍可查看歷史記帳資料，續訂後立即恢復完整功能。"].map((note, i) => (
            <p key={i} style={{ fontSize: 13, color: MID, display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.8 }}>
              <span style={{ color: O, fontWeight: 700, flexShrink: 0 }}>·</span>{note}
            </p>
          ))}
          <p style={{ fontSize: 12, color: LIGHT, marginTop: 8 }}>
            付款相關問題請參閱{" "}
            <span onClick={() => setPage("terms")} style={{ color: O, cursor: "pointer", textDecoration: "underline" }}>服務條款</span>
          </p>
        </div>
      </div>
    </div>
  );
}

//  服務條款
function LegalPage({ isAdmin, content, setContent, defaults, hasIntro }) {
  const c = normalizeLegalContent({ ...defaults, ...(content || {}) });
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(c);
  const titleLines = (c.title || "").split("\n");
  return (
    <div>
      <div style={{ background: GRAD, padding: "52px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 10 }}>{c.eyebrow}</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: CHAR, lineHeight: 1.45 }}>
            {titleLines.map((line, i) => <span key={i}>{line}{i < titleLines.length - 1 && <br />}</span>)}
          </h1>
          <p style={{ fontSize: 13, color: MID, marginTop: 10 }}>{c.lastUpdated}</p>
          {isAdmin && !editing && <button className="pg" style={{ fontSize: 12, marginTop: 14 }} onClick={() => { setTmp(c); setEditing(true); }}>編輯本頁</button>}
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 32px" }} className="page-wrap">
        {editing ? (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>小標籤</p><input value={tmp.eyebrow} onChange={e => setTmp(p => ({ ...p, eyebrow: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題（可分行，用換行分隔）</p><textarea value={tmp.title} onChange={e => setTmp(p => ({ ...p, title: e.target.value }))} style={{ minHeight: 60 }} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>最後更新文字</p><input value={tmp.lastUpdated} onChange={e => setTmp(p => ({ ...p, lastUpdated: e.target.value }))} /></div>
              {hasIntro && <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>開頭說明段落</p><textarea value={tmp.intro} onChange={e => setTmp(p => ({ ...p, intro: e.target.value }))} style={{ minHeight: 80 }} /></div>}
              <div>
                <p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>內文</p>
                <RichEditor value={tmp.body} onChange={v => setTmp(p => ({ ...p, body: v }))} />
              </div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>結尾提示框文字（選填，留空則不顯示）</p><textarea value={tmp.footerNote || ""} onChange={e => setTmp(p => ({ ...p, footerNote: e.target.value }))} style={{ minHeight: 60 }} /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pb" onClick={() => { setContent(tmp); setEditing(false); }}>儲存</button>
              <button className="pg" onClick={() => setEditing(false)}>取消</button>
            </div>
          </div>
        ) : (
          <>
            {hasIntro && <p style={{ fontSize: 14, color: MID, lineHeight: 2.1, marginBottom: 48, whiteSpace: "pre-wrap" }}>{c.intro}</p>}
            <div className="article-content" style={{ fontSize: 14, color: MID, lineHeight: 2.1 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.body) }} />
            {c.footerNote && (
              <div style={{ marginTop: 64, padding: "22px 26px", background: GRAY, border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 12, color: LIGHT, lineHeight: 2, whiteSpace: "pre-wrap" }}>{c.footerNote}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TermsPage({ isAdmin, termsContent, setTermsContent }) {
  return <LegalPage isAdmin={isAdmin} content={normalizeTermsContent(termsContent)} setContent={setTermsContent} defaults={DEFAULTS.termsContent} />;
}

//  隱私政策
function PrivacyPage({ isAdmin, privacyContent, setPrivacyContent }) {
  return <LegalPage isAdmin={isAdmin} content={privacyContent} setContent={setPrivacyContent} defaults={DEFAULTS.privacyContent} hasIntro />;
}

//  免責聲明
function DisclaimerPage({ isAdmin, disclaimerContent, setDisclaimerContent }) {
  return <LegalPage isAdmin={isAdmin} content={disclaimerContent} setContent={setDisclaimerContent} defaults={DEFAULTS.disclaimerContent} />;
}

//  訂閱方案
function SubscriptionPage({ setPage, isAdmin, appContent, subscriptionCopy, setSubscriptionCopy }) {
  const c = normalizeAppContent(appContent);
  const sc = normalizeSubscriptionCopy(subscriptionCopy);
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(sc);
  // 上線日之前訪客只看得到 COMING SOON，當天起自動顯示完整方案頁
  if (!isAdmin && !isAppLaunched()) return (
    <div style={{ background: GRAD, minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", textAlign: "center" }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: O, marginBottom: 16 }}>COMING SOON</p>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: CHAR, lineHeight: 1.3, marginBottom: 14 }}>{c.comingSoonTitle}</h1>
      <p style={{ fontSize: 15, color: MID, lineHeight: 1.9 }}>{c.comingSoonSub}</p>
    </div>
  );
  const plans = c.plans;

  return (
    <div>
      <div style={{ background: GRAD, padding: "72px 32px 56px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 10 }}>PRICING</p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: CHAR, lineHeight: 1.3, marginBottom: 12 }}>{sc.heading}</h1>
          {/* 錨定句：刻意寫死不吃 Firestore。它的任務是在價格數字出現前先定調，
              放進 sc.intro 會落到那行小灰字的樣式裡，份量會被吃掉。
              要改這句請改這裡，後台編輯不到是預期行為。 */}
          <p style={{ fontSize: 17, fontWeight: 700, color: CHAR, lineHeight: 1.7, maxWidth: 540, marginBottom: 10 }}>這不是記帳的錢，是每個月一次解讀的錢。</p>
          <p style={{ fontSize: 15, color: MID, lineHeight: 1.9, maxWidth: 540, whiteSpace: "pre-wrap" }}>{sc.intro}</p>
          {isAdmin && <span onClick={() => { setTmp(sc); setEditing(true); }} style={{ fontSize: 12, color: O, cursor: "pointer", marginTop: 10, display: "inline-block" }}>編輯本頁文字</span>}
        </div>
      </div>

      {/* 月度智慧解讀：價值先於價格，所以擺在方案卡片上方。
          底色沿用同頁 hero 的 O2，不另開色票；B 句保留「診斷」，那是 App 裡的功能名稱，
          不跟標題的「解讀」統一。同一段內容在 PricingPage（/plans）也有一份。 */}
      <div style={{ padding: "56px 32px 8px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ background: O2, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "clamp(28px,4vw,40px) clamp(24px,3.4vw,36px)" }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: CHAR, marginBottom: 16 }}>月度智慧解讀</h2>
            <p style={{ fontSize: 15, color: CHAR, lineHeight: 1.9, marginBottom: 4 }}>不想再被卡費追著跑，看見「真正可用餘額」剩多少。</p>
            <p style={{ fontSize: 15, color: CHAR, lineHeight: 1.9 }}>預算一直超支？診斷幫你揪出真相。</p>
          </div>
        </div>
      </div>

      <div style={{ background: GRAY, padding: "64px 32px 48px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(plans.length, 1)}, 1fr)`, gap: 20 }} className="grid3">
            {plans.map(plan => (
              <div key={plan.id} style={{
                background: plan.highlight ? O : WHITE,
                border: `2px solid ${plan.highlight ? O : BORDER}`,
                borderRadius: 20,
                padding: "36px 26px 32px",
                position: "relative",
                boxShadow: plan.highlight ? "0 8px 32px rgba(200,90,20,.2)" : "0 2px 10px rgba(0,0,0,.05)",
                transition: "transform .3s, box-shadow .3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = plan.highlight ? "0 16px 48px rgba(200,90,20,.28)" : "0 20px 40px rgba(0,0,0,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = plan.highlight ? "0 8px 32px rgba(200,90,20,.2)" : "0 2px 10px rgba(0,0,0,.05)"; }}
              >
                {plan.badge && (
                  <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: CHAR, color: WHITE, fontSize: 11, padding: "3px 14px", borderRadius: 20, letterSpacing: ".5px", fontWeight: 500, whiteSpace: "nowrap" }}>{plan.badge}</span>
                )}
                <p style={{ fontSize: 11, letterSpacing: "1.5px", color: plan.highlight ? "rgba(255,255,255,.6)" : MID, marginBottom: 10, fontWeight: 500 }}>{plan.name.toUpperCase()}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 28, flexWrap: "nowrap" }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: plan.highlight ? WHITE : CHAR, whiteSpace: "nowrap" }}><Price>{plan.price}</Price></span>
                  <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,.5)" : LIGHT, whiteSpace: "nowrap" }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,.88)" : MID, display: "flex", alignItems: "center", gap: 9 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "rgba(255,255,255,.7)" : O} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a {...appCtaProps("pricing-page")} style={{ display: "block" }}>
                  <button style={{ width: "100%", background: plan.highlight ? WHITE : O, color: plan.highlight ? O : WHITE, border: "none", padding: "13px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", borderRadius: 8, transition: "opacity .18s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    立即開始使用 →
                  </button>
                </a>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8 }}>
            {sc.notes.split("\n").filter(Boolean).map((n, i) => (
              <p key={i} style={{ fontSize: 12, color: MID, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: O, fontWeight: 700, flexShrink: 0 }}>·</span>{n}
              </p>
            ))}
            <p style={{ fontSize: 12, color: MID, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: O, fontWeight: 700, flexShrink: 0 }}>·</span>
              如有疑問，請聯繫 <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} style={{ color: O, textDecoration: "underline" }}>{PUBLIC_CONTACT_EMAIL}</a>
            </p>
            <p style={{ fontSize: 12, color: LIGHT, marginTop: 4 }}>
              訂閱即代表你同意我們的{" "}
              <span onClick={() => setPage("terms")} style={{ color: O, cursor: "pointer", textDecoration: "underline" }}>服務條款與退款政策</span>
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "32px 32px 48px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ padding: "20px 24px", background: GRAY, border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 12, color: LIGHT, lineHeight: 2.1 }}>{sc.foundingNote}</p>
          </div>
        </div>
      </div>
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 61, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: WHITE, padding: 32, width: "100%", maxWidth: 560, maxHeight: "80vh", overflowY: "auto" }}>
            <p style={{ fontSize: 13, letterSpacing: "2px", color: CORAL2, marginBottom: 20, fontWeight: 500 }}>編輯訂閱方案頁文字</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題</p><input value={tmp.heading} onChange={e => setTmp(p => ({ ...p, heading: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>說明（每行一句）</p><textarea value={tmp.intro} onChange={e => setTmp(p => ({ ...p, intro: e.target.value }))} style={{ minHeight: 60 }} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>方案注意事項（每行一條）</p><textarea value={tmp.notes} onChange={e => setTmp(p => ({ ...p, notes: e.target.value }))} style={{ minHeight: 100 }} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>創始會員說明</p><textarea value={tmp.foundingNote} onChange={e => setTmp(p => ({ ...p, foundingNote: e.target.value }))} style={{ minHeight: 60 }} /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pb" onClick={() => { setSubscriptionCopy(tmp); setEditing(false); }}>儲存</button>
              <button className="pg" onClick={() => setEditing(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

//  App root
export default function App() {
  const [articles, setArticles, aL] = useFS("articles", DEFAULTS.articles);
  const [products, setProducts, pL] = useFS("products", DEFAULTS.products);
  const [igPosts, setIgPosts, iL] = useFS("igPosts", DEFAULTS.igPosts);
  const [memberFeedback, setMemberFeedback, mfL] = useFS("memberFeedback", DEFAULTS.memberFeedback);
  const [goods, setGoods, gL] = useFS("goods", DEFAULTS.goods);
  const [about, setAbout, abL] = useFS("about", DEFAULTS.about);
  const [siteTitle, setSiteTitle, tL] = useFS("siteTitle", DEFAULTS.siteTitle);
  const [tags, setTags, taL] = useFS("tags", DEFAULTS.tags);
  const [links, setLinks, lL] = useFS("links", DEFAULTS.links);
  const [footerTagline, setFooterTagline, ftL] = useFS("footerTagline", DEFAULTS.footerTagline);
  const [navLabels, setNavLabels, nvL] = useFS("navLabels", DEFAULTS.navLabels);
  const [mobileTabLabels, setMobileTabLabels, mtL] = useFS("mobileTabLabels", DEFAULTS.mobileTabLabels);
  const [footerLabels, setFooterLabels, flbL] = useFS("footerLabels", DEFAULTS.footerLabels);
  const [subscriptionCopy, setSubscriptionCopy, scL] = useFS("subscriptionCopy", DEFAULTS.subscriptionCopy);
  const [shopCopy, setShopCopy, shcL] = useFS("shopCopy", DEFAULTS.shopCopy);
  const [igCopy, setIgCopy, igcL] = useFS("igCopy", DEFAULTS.igCopy);
  const [communityCopy, setCommunityCopy, ccpL] = useFS("communityCopy", DEFAULTS.communityCopy);
  const [goodsCopy, setGoodsCopy, gcpL] = useFS("goodsCopy", DEFAULTS.goodsCopy);
  const [demoStory, setDemoStory, dsL] = useFS("demoStory", DEFAULTS.demoStory);
  const [termsContent, setTermsContent, tcL] = useFS("termsContent", DEFAULTS.termsContent);
  const [privacyContent, setPrivacyContent, pcL] = useFS("privacyContent", DEFAULTS.privacyContent);
  const [disclaimerContent, setDisclaimerContent, dcL] = useFS("disclaimerContent", DEFAULTS.disclaimerContent);
  const [resources, setResources, rlL] = useFS("resources", []);
  const [newsletter, setNewsletter, nlL] = useFS("newsletter", DEFAULTS.newsletter);
  const [appContent, setAppContent, acL] = useFS("appContent", DEFAULTS.appContent);
  const [contactContent, setContactContent, ccL] = useFS("contactContent", DEFAULTS.contactContent);
  const [savingsBagQuiz, setSavingsBagQuiz, sbqL] = useFS("savingsBagQuiz", DEFAULTS.savingsBagQuiz);
  const [trustStats, setTrustStats, tsL] = useFS("trustStats", DEFAULTS.trustStats);
  const [goodsHero, setGoodsHero, ghL] = useFS("goodsHero", DEFAULTS.goodsHero);
  const [communityHero, setCommunityHero, chL] = useFS("communityHero", DEFAULTS.communityHero);
  const [page, setPageState] = useState("home");
  const setPage = p => {
    setPageState(p);
    if (p !== "article") {
      const path = pathForPage(p);
      if (window.location.pathname !== path) history.pushState({}, "", path);
    }
  };
  const [id, setId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLocalAdminPreview, setIsLocalAdminPreview] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    const params = new URLSearchParams(window.location.search);
    const localAdminPreview = isLocalPreviewHost() && params.get("dev_admin") === "true";
    setIsLocalAdminPreview(localAdminPreview);
    setIsAdmin(localAdminPreview || (!!user && ADMIN_EMAILS.includes(user.email)));
  }), []);
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [page]);

  // GA4：站外連結一律送 outbound_click；上線前導向 88La財務導航的按鈕會先攔截並記錄鎖定點擊。
  // from_page 記的是「在官網哪一頁點的」，沒有它就只知道有人點了，不知道哪一頁在帶客
  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);
  // 頁內錨點自己接管捲動。原本靠瀏覽器處理 href="#id"，遇到圖片載入造成的
  // 版面位移、或網址已經是同一個 hash 時，可能捲不到位或看起來沒反應。
  // 改成明確呼叫 scrollIntoView，scroll-margin-top 會把導覽列的高度算進去。
  useEffect(() => {
    const onAnchorClick = e => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href").slice(1);
      if (!id || id === "app-launch") return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", window.location.pathname + "#" + id);
    };
    document.addEventListener("click", onAnchorClick);
    return () => document.removeEventListener("click", onAnchorClick);
  }, []);
  useEffect(() => {
    const handler = e => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      let url = null;
      if (/^https?:\/\//.test(href)) {
        try { url = new URL(href); } catch { return; }
      }
      const isAppCta = a.dataset.appLocked === "true" || url?.origin === new URL(APP_URL).origin;
      if (isAppCta) {
        // 上線前：攔下來說明何時開放，不要讓人以為按鈕壞掉
        if (!isAppLaunched()) {
          e.preventDefault();
          _showToast(APP_LAUNCH_NOTICE, "notice");
        }
        if (typeof window.gtag === "function") {
          window.gtag("event", isAppLaunched() ? "app_cta_click" : "cta_locked_click", {
            link_url: href,
            from_page: pageRef.current,
            cta_source: a.dataset.appSource || "direct-app-link",
          });
        }
        return;
      }
      if (!url || url.origin === window.location.origin || typeof window.gtag !== "function") return;
      window.gtag("event", "outbound_click", {
        link_url: href,
        link_domain: url.hostname,
        from_page: pageRef.current,
      });
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  const loaded = aL && pL && iL && gL && abL && tL && taL && lL && ftL && rlL && nlL && acL && ccL && sbqL;
  const article = articles.find(a => a.id === id);
  const nav = p => { setPage(p); setId(null); };

  useEffect(() => {
    const [title, description] = page === "article" && article
      ? [`${article.title}｜88La`, article.excerpt || "88La 理財文章"]
      : PAGE_META[page] || PAGE_META.home;
    document.title = title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) descriptionTag.setAttribute("content", description);
    const robotsTag = document.querySelector('meta[name="robots"]');
    if (robotsTag) robotsTag.setAttribute("content", ["write", "savings-quiz"].includes(page) ? "noindex,nofollow" : "index,follow");
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", `https://site.88lamoney.com${window.location.pathname}`);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    if (ogDescription) ogDescription.setAttribute("content", description);
    if (ogUrl) ogUrl.setAttribute("content", `https://site.88lamoney.com${window.location.pathname}`);
  }, [page, article]);

  // 初次載入：以網址路徑決定要顯示哪一頁；相容舊版 ?article= query 分享連結
  useEffect(() => {
    if (!loaded) return;
    const path = window.location.pathname;
    const legacyArticleSlug = new URLSearchParams(window.location.search).get("article");
    const slug = articleSlugFromPath(path) || legacyArticleSlug;
    if (slug) {
      const a = articles.find(x => x.slug === slug || String(x.id) === slug);
      if (a) {
        setId(a.id); setPageState("article");
        if (path !== "/article/" + encodeURIComponent(a.slug || a.id)) {
          history.replaceState({}, "", "/article/" + encodeURIComponent(a.slug || a.id));
        }
        return;
      }
    }
    const p = pageForPath(path);
    if (p !== "home") setPageState(p);
  }, [loaded]);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const slug = articleSlugFromPath(path);
      if (slug) {
        const a = articles.find(x => x.slug === slug || String(x.id) === slug);
        if (a) { setId(a.id); setPageState("article"); window.scrollTo({ top: 0, behavior: "instant" }); return; }
      }
      setPageState(pageForPath(path)); setId(null); window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [articles]);

  // 一次性遷移：偵測舊方案（1年/3年）並自動更新為新三方案
  useEffect(() => {
    if (!acL) return;
    const oldNames = ["1 年方案", "3 年方案"];
    if (appContent.plans?.some(p => oldNames.includes(p.name))) {
      setAppContent(prev => ({
        ...prev,
        pricingNote: DEFAULTS.appContent.pricingNote,
        plans: DEFAULTS.appContent.plans,
      }), { silent: true });
    }
  }, [acL]);
  useEffect(() => {
    if (!acL || !isAdmin || isLocalAdminPreview) return;
    const gd = appContent.guideData;
    if (!gd?.phases) return;
    const allTitles = gd.phases.flatMap(p => p.steps.map(s => s.title));
    const needsUpdate = !allTitles.includes("智慧預填") || !allTitles.includes("上月支出對比");
    const needsFaq = !gd.faqs?.some(f => f.q.includes("代墊"));
    if (!needsUpdate && !needsFaq) return;
    const updated = { ...gd, phases: gd.phases.map(p => {
      if (p.id === 1 && !p.steps.some(s => s.title === "上月支出對比")) {
        const idx = p.steps.findIndex(s => s.title === "實際分配對比");
        const ins = idx >= 0 ? idx + 1 : p.steps.length;
        const steps = [...p.steps];
        steps.splice(ins, 0, { id: 16, num: "05", title: "上月支出對比", body: "編列預算時，系統自動帶入上月各項實際支出數據，讓你在分配當下就能看出哪些項目超支、哪些有節餘空間，不必翻找舊紀錄也能快速調整本月預算方向。", bullets: [] });
        return { ...p, steps };
      }
      if (p.id === 2 && !p.steps.some(s => s.title === "智慧預填")) {
        const idx = p.steps.findIndex(s => s.title === "快速記帳");
        const ins = idx >= 0 ? idx + 1 : 0;
        const steps = [...p.steps];
        steps.splice(ins, 0, { id: 27, num: "08", title: "智慧預填", body: "根據你的記帳習慣，系統自動預填常用金額、類別與支付方式。開啟記帳時欄位已幫你填好，確認或微調即可完成，大幅縮短每次記帳時間。", bullets: [] });
        return { ...p, steps };
      }
      return p;
    }) };
    let stepNum = 1;
    updated.phases.forEach(p => { if (p.isSetup) { p.steps.forEach((s, i) => { s.num = String(i + 1).padStart(2, "0"); }); } else { p.steps.forEach(s => { s.num = String(stepNum++).padStart(2, "0"); }); } });
    if (needsFaq) updated.faqs = [...(gd.faqs || []), { id: 8, q: "幫別人代墊刷卡，對方還現金，該怎麼記？", a: "一樣用信用卡記錄這筆消費，因為會跟著你的帳期出帳，金額比較準確。對方還你現金時，等於你已經把這筆卡費預留起來了。建議在備註欄寫上「代墊」方便辨識。" }];
    setAppContent(prev => ({ ...prev, guideData: updated }), { silent: true });
  }, [acL, isAdmin, isLocalAdminPreview]);
  useEffect(() => {
    if (!gL) return;
    if ((!goods || goods.length === 0) && DEFAULTS.goods.length > 0) {
      setGoods(DEFAULTS.goods, { silent: true });
    }
  }, [gL]);
  useEffect(() => {
    if (!aL || !isAdmin || isLocalAdminPreview) return;
    migrateMemberArticles()
      .then(result => {
        if (result?.migrated > 0) setArticles(prev => prev.map(publicArticle), { silent: true });
      })
      .catch(e => console.error("Member article migration failed", e));
  }, [aL, isAdmin, isLocalAdminPreview]);
  const saveArticle = async d => {
    const nid = Math.max(...articles.map(a => a.id), 0) + 1;
    const baseSlug = toSlug(d.title);
    const taken = new Set(articles.map(a => a.slug).filter(Boolean));
    let slug = baseSlug, n = 2;
    while (taken.has(slug)) { slug = baseSlug + "-" + n; n++; }
    if (d.member) await saveMemberArticleContent(nid, d.content);
    setArticles(prev => [...prev, publicArticle({ id: nid, slug, ...d, content: d.member ? "" : d.content, excerpt: d.excerpt || (stripHtml(d.content).slice(0, 80) + "⋯"), views: 0, comments: [], date: new Date().toISOString().slice(0, 10) })]);
    setPage("journal");
  };

  if (!loaded) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: CORAL, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", letterSpacing: "3px" }}>LOADING</p>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: WHITE }}>
      <Toast />
      <Nav page={page} setPage={nav} isAdmin={isAdmin} navLabels={navLabels} setNavLabels={setNavLabels} mobileTabLabels={mobileTabLabels} setMobileTabLabels={setMobileTabLabels} />
      <div key={page} className="page-anim">
        {page === "home" && <Home setPage={nav} isAdmin={isAdmin} trustStats={trustStats} setTrustStats={setTrustStats} />}
        {page === "journal" && <Journal articles={articles} setId={setId} setPage={setPage} isAdmin={isAdmin} siteTitle={siteTitle} setSiteTitle={setSiteTitle} tags={tags} setTags={setTags} links={links} />}
        {page === "about" && <About isAdmin={isAdmin} links={links} setLinks={setLinks} setPage={nav} trustStats={trustStats} about={about} setAbout={setAbout} />}
        {page === "ig" && <IG igPosts={igPosts} setIgPosts={setIgPosts} isAdmin={isAdmin} links={links} igCopy={igCopy} setIgCopy={setIgCopy} />}
        {page === "community" && <Community igPosts={igPosts} links={links} setPage={nav} isAdmin={isAdmin} communityHero={communityHero} setCommunityHero={setCommunityHero} communityCopy={communityCopy} setCommunityCopy={setCommunityCopy} memberFeedback={memberFeedback} setMemberFeedback={setMemberFeedback} />}
        {page === "shop" && <Shop products={products} setProducts={setProducts} isAdmin={isAdmin} shopCopy={shopCopy} setShopCopy={setShopCopy} />}
        {page === "envelope" && <Envelope products={products} setPage={nav} isAdmin={isAdmin} />}
        {page === "goods" && <Goods goods={goods} setGoods={setGoods} isAdmin={isAdmin} goodsHero={goodsHero} setGoodsHero={setGoodsHero} goodsCopy={goodsCopy} setGoodsCopy={setGoodsCopy} />}
        {page === "app" && <AppPage appContent={appContent} setAppContent={setAppContent} isAdmin={isAdmin} setPage={nav} demoStory={demoStory} setDemoStory={setDemoStory} products={products} />}
        {page === "guide" && <Guide isAdmin={isAdmin} setPage={nav} links={links} />}
        {page === "tool-quiz" && <ToolQuiz setPage={nav} />}
        {page === "resources" && <Resources resources={resources} setResources={setResources} isAdmin={isAdmin} setPage={nav} />}
        {page === "newsletter" && <Newsletter newsletter={newsletter} setNewsletter={setNewsletter} isAdmin={isAdmin} articles={articles} setId={setId} setPage={setPage} />}
        {page === "contact" && <Contact links={links} contactContent={contactContent} setContactContent={setContactContent} isAdmin={isAdmin} />}
        {page === "savings-quiz" && isAdmin && <SavingsBagQuizAdmin savingsBagQuiz={savingsBagQuiz} setSavingsBagQuiz={setSavingsBagQuiz} />}
        {page === "plans" && <PricingPage appContent={appContent} setPage={nav} />}
        {page === "pricing" && <SubscriptionPage setPage={nav} isAdmin={isAdmin} appContent={appContent} subscriptionCopy={subscriptionCopy} setSubscriptionCopy={setSubscriptionCopy} />}
        {page === "terms" && <TermsPage isAdmin={isAdmin} termsContent={termsContent} setTermsContent={setTermsContent} />}
        {page === "privacy" && <PrivacyPage isAdmin={isAdmin} privacyContent={privacyContent} setPrivacyContent={setPrivacyContent} />}
        {page === "disclaimer" && <DisclaimerPage isAdmin={isAdmin} disclaimerContent={disclaimerContent} setDisclaimerContent={setDisclaimerContent} />}
        {page === "article" && article && <Article article={article} onBack={() => nav("journal")} setArticles={setArticles} isAdmin={isAdmin} tags={tags} links={links} setPage={nav} products={products} resources={resources} />}
        {page === "write" && isAdmin && <Write onSave={saveArticle} onBack={() => nav("journal")} tags={tags} products={products} resources={resources} />}
      </div>
      <Footer links={links} footerTagline={footerTagline} setFooterTagline={setFooterTagline} isAdmin={isAdmin} setPage={nav} footerLabels={footerLabels} setFooterLabels={setFooterLabels} />
    </div>
  );
}
