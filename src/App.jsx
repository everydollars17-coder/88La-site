import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import DOMPurify from "dompurify";

const firebaseConfig = {
  apiKey: "AIzaSyCW8TU318MtXe50MjjqWmmHDydFXv-zA3E",
  authDomain: "barbara-760bb.firebaseapp.com",
  projectId: "barbara-760bb",
  storageBucket: "barbara-760bb.firebasestorage.app",
  messagingSenderId: "1039136998822",
  appId: "1:1039136998822:web:bde7ca93e95e149d4dfb67"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const ADMIN_EMAILS = ["everydollars17@gmail.com"];

const APP_URL = "https://88la-finance.vercel.app";

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
const TITLE_COLOR = "#F05E1C";
const BORDER = "rgba(0,0,0,0.07)";
const GRAD = `linear-gradient(135deg, ${O2} 0%, #FFF7F3 60%, ${WHITE} 100%)`;

const GF = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,700;1,14..32,300&display=swap');`;

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
.tag{display:inline-block;background:${O2};color:${O};font-size:11px;padding:3px 10px;letter-spacing:.5px;font-weight:500;}
.tagn{display:inline-block;background:${CORAL};color:#fff;font-size:11px;padding:3px 10px;letter-spacing:.5px;font-weight:500;}
.ordbtn{background:transparent;border:1px solid #D0D5DA;color:${LIGHT};font-size:11px;padding:2px 6px;line-height:1;cursor:pointer;}
.ordbtn:hover{border-color:${O};color:${O};}
.card{background:${WHITE};border:1px solid ${BORDER};border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.06);transition:box-shadow .24s,transform .24s;cursor:pointer;overflow:hidden;}
.card:hover{box-shadow:0 12px 40px rgba(200,90,20,.15);transform:translateY(-4px);}
.section-label{font-size:11px;letter-spacing:3px;color:${O};font-weight:500;text-transform:uppercase;}
.hero-pattern{
  background-color:${O2};
  background-image:radial-gradient(${CORAL}60 1.5px,transparent 1.5px);
  background-size:28px 28px;
}
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
@media(max-width:768px){
  .nav-links{display:none!important;}
  .mob-menu{display:flex!important;}
  .hero-title{font-size:34px!important;line-height:1.25!important;}
  .hero-sub{font-size:14px!important;}
  .page-wrap{padding:40px 20px 88px!important;}
  .grid2{grid-template-columns:1fr!important;}
  .grid3{grid-template-columns:1fr!important;}
  .grid-ig{grid-template-columns:1fr 1fr!important;}
  .about-grid{grid-template-columns:1fr!important;}
  .about-img{aspect-ratio:4/3!important;}
  .banner-h{height:460px!important;}
  .hide-mob{display:none!important;}
  .mob-tab-bar{display:flex!important;}
  .site-footer{padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))!important;}
}
@media(min-width:769px){
  .mob-menu{display:none!important;}
  .mob-panel{display:none!important;}
}
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
}
`;

const DEFAULT_TAGS = ["理財觀念", "信用卡", "記帳", "投資", "讀書筆記", "生活財務", "其他"];

const DEFAULTS = {
  siteTitle: "理財觀點與讀書筆記",
  footerTagline: "理財，是為了讓生活更自由。",
  links: {
    lineCommunity: "https://line.me/R/ti/p/@367xhgyr",
    lineOfficial: "https://line.me/R/ti/p/@367xhgyr",
    instagram: "https://www.instagram.com/every_dollars/",
    email: "everydollars17@gmail.com"
  },
  about: {
    intro: "嗨，我是 88La。\n\n我從信封分類法開始認識理財——不是從書本，是從自己每個月真實的薪水開始。\n\n我相信理財不是讓自己活得緊繃，而是讓你對生活有更多掌控感和自由度。",
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
    { id: 1, name: "理財自動導航器 2.0", type: "digital", price: "NT$ 299", desc: "Google Sheets 理財模板，自動模式偵測，適合薪水族。", url: "https://portaly.cc/every_dollars", img: "" },
    { id: 2, name: "88La 存錢袋", type: "physical", price: "NT$ 180", desc: "手工製作信封袋，現金分類存錢用。", url: "", img: "" }
  ],
  igPosts: [
    { id: 1, title: "假記帳的陷阱你中了嗎？", url: "https://www.instagram.com/every_dollars/", thumb: "", type: "post" },
    { id: 2, title: "存錢袋使用教學｜現金分配法", url: "https://www.instagram.com/every_dollars/", thumb: "", type: "post" }
  ],
  goods: [
    { id: 1, name: "精臣標籤機 D110", brand: "Niimbot 精臣", desc: "幫信封袋、存錢罐貼上標籤，讓分類理財更有儀式感。", url: "https://www.niimbot-tw.com/one-page-stores/every-dollars", img: "", active: true },
    { id: 2, name: "《富爸爸，窮爸爸》", brand: "羅勃特．乙．清崎", desc: "理財入門必讀經典，重新理解金錢、資產與負債的關係。", url: "", img: "", active: true },
    { id: 3, name: "A4 透明拉鏈袋（10入）", brand: "", desc: "搭配信封分類法使用，用透明袋分裝現金一目瞭然。", url: "", img: "", active: true },
  ],
  tags: DEFAULT_TAGS,
  resources: [],
  newsletter: { subscriberCount: "1,000+", intro: "每週一篇理財觀念，寫給想讓錢更有意義的你。不說廢話，只寫真實心得。", archiveNote: "隨時取消訂閱，沒有壓力。" },
  appContent: {
    heroTitle: "記帳 App，讓你真的",
    heroHighlight: "存到錢",
    heroSub: "雲端同步 Google Sheets，智慧診斷消費模式，支援家庭記帳。不只記帳，更幫你看懂錢的流向。",
    pricingNote: "所有方案皆包含桌面快速記帳功能，選擇最適合你的方案",
    features: [
      { id: 1, n: "01", title: "即時記帳", desc: "一秒記下每筆花費，情緒、類別、帳戶、分期全部記錄。", img: "" },
      { id: 2, n: "02", title: "雲端同步", desc: "資料存在你自己的 Google Sheets，永遠不鎖在 App 裡。", img: "" },
      { id: 3, n: "03", title: "智慧診斷", desc: "月底自動分析消費模式，對比上月找出節流點。", img: "" },
      { id: 4, n: "04", title: "負債追蹤", desc: "定額或不定額還款進度，信用卡分期一目瞭然。", img: "" },
      { id: 5, n: "05", title: "家庭模式", desc: "個人、公費、家庭三種模式獨立管理，互不干擾。", img: "" },
      { id: 6, n: "06", title: "PWA 支援", desc: "加到主畫面，iOS / Android 體驗接近原生 App。", img: "" },
    ],
    plans: [
      { id: 1, name: "月訂閱", price: "NT$129", period: "/月", highlight: false, badge: "", features: ["88La 理財導航器完整功能", "桌面快速記帳", "隨時可取消"], detailTitle: "", detailImg: "", detailContent: "" },
      { id: 2, name: "年方案", price: "NT$999", period: "/年", highlight: true, badge: "最多人選擇", features: ["88La 理財導航器完整功能", "桌面快速記帳", "省下約 35%", "相當於 NT$83/月"], detailTitle: "", detailImg: "", detailContent: "" },
      { id: 3, name: "兩年方案", price: "NT$1,899", period: "/兩年", highlight: false, badge: "", features: ["88La 理財導航器完整功能", "桌面快速記帳", "最划算方案", "相當於 NT$79/月"], detailTitle: "", detailImg: "", detailContent: "" },
    ],
    guideTitle: "88La 理財自動導航器 — 使用說明",
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
          { id: 15, num: "05", title: "公費 / 家庭模式（選用）", body: "如果你和伴侶有公費分帳或家庭合併收支的需求，系統會引導你一步步抓準金額。", bullets: ["公費制：每人提撥固定金額，用於共同支出", "家庭制：雙方薪水合併使用，共同規劃預算"] },
        ]},
        { id: 2, label: "月中", sub: "日常記帳", steps: [
          { id: 21, num: "06", title: "快速記帳", body: "桌面快速記帳介面，降低記帳阻力，實現無痛記帳。記帳時可設定歸屬、支付方式與消費情緒。", bullets: ["歸屬：個人 / 公費 / 家庭", "支付方式：自由調整", "消費情緒：檢視衝動消費頻率"] },
          { id: 22, num: "07", title: "信用卡管理", body: "依卡別設定結帳日、繳費日，系統自動提醒卡費與預留金額，避免惡性循環。", bullets: ["何時繳、繳多少", "下個月卡費預留提醒", "刷卡頻率偵測與建議"] },
          { id: 23, num: "08", title: "帳戶管理", body: "自由設定帳戶名稱、金額、icon，支援帳戶間轉帳（含手續費），並可連動記帳直接用帳戶支付。", bullets: [] },
          { id: 24, num: "09", title: "儲蓄管理", body: "月初編列的儲蓄、投資、預存項目可設定具體目標，透過動態進度條隨時掌握累積進度。", bullets: [] },
          { id: 25, num: "10", title: "負債追蹤", body: "輸入貸款金額、已還金額、期數，追蹤還款進度，並可一鍵繳款直接完成記帳。", bullets: [] },
          { id: 26, num: "11", title: "預存管理", body: "建立一個專屬帳戶來存放預存款項，每次存入時用轉帳功能記錄，要動用時再從帳戶扣款，餘額隨時清楚。習慣用現金預存的人，也可以建立「現金預存帳戶」，操作邏輯一樣。", bullets: [] },
        ]},
        { id: 3, label: "月底", sub: "診斷與調整", steps: [
          { id: 31, num: "12", title: "月度診斷", body: "系統全面分析本月收支，找出調整方向。", bullets: ["固定 / 變動支出狀況、儲蓄是否達標", "支出類別占比、支付方式、情緒消費分析", "偵測未列入預算的支出與未計畫儲蓄", "給出下個月具體調整方向與深度建議"] },
          { id: 32, num: "13", title: "最新快訊", body: "首頁一目瞭然：預算進度條、信用卡費提醒、近期消費紀錄、本月還款倒數。", bullets: [] },
          { id: 33, num: "14", title: "筆記與匯出", body: "可在筆記區記錄調整方向，月底整合匯出 PDF 或 CSV 檔，也支援加購一對一診斷討論。", bullets: [] },
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
      ],
    },
  },
  contactContent: {
    intro: "如果你是品牌方、媒體、或想和 88La 合作，歡迎透過以下方式聯絡。我通常會在 3 個工作天內回覆。",
  },
};

const OLD_KEYS = ["ed_art", "ed_prod", "ed_ig", "ed_goods", "ed_about", "ed_title", "ed_tags"];
OLD_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch { } });

async function fbGet(key) {
  try { const s = await getDoc(doc(db, "site", key)); return s.exists() ? s.data().value : null; } catch { return null; }
}
async function fbSet(key, value) {
  try { await setDoc(doc(db, "site", key), { value }); } catch { }
}

function useFS(key, def) {
  const [v, setV] = useState(def);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { fbGet(key).then(val => { if (val !== null) setV(val); setLoaded(true); }); }, [key]);
  const set = async (fn, opts) => { const n = typeof fn === "function" ? fn(v) : fn; setV(n); await fbSet(key, n); if (!opts?.silent) _showToast("儲存成功"); };
  return [v, set, loaded];
}

let _showToast = () => {};
function Toast() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const t = useRef();
  _showToast = (m) => { setMsg(m); setShow(true); clearTimeout(t.current); t.current = setTimeout(() => setShow(false), 2200); };
  if (!show) return null;
  return (
    <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: CHAR, color: WHITE, padding: "12px 28px", borderRadius: 8, fontSize: 13, zIndex: 80, boxShadow: "0 4px 20px rgba(0,0,0,.25)", letterSpacing: ".5px", whiteSpace: "nowrap", pointerEvents: "none" }}>
      ✓ {msg}
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

// ── Crop Modal ──
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
        const fd = new FormData();
        fd.append("file", blob, "cropped.jpg");
        fd.append("upload_preset", "88la-site");
        const r = await fetch("https://api.cloudinary.com/v1_1/daiboggpp/image/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (d.secure_url) { onConfirm(d.secure_url); res(); } else rej();
      }, "image/jpeg", 0.92));
    } catch { setCropError("裁剪失敗（圖片可能不支援跨來源），請用上傳的圖片再試"); }
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

// ── Image Uploader ──
function ImgUploader({ value, onChange, label = "圖片", aspect = "16/9" }) {
  const inputRef = useRef();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [showCrop, setShowCrop] = useState(false);

  const upload = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("請選擇圖片檔案"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("檔案不能超過 5MB"); return; }
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", "88la-site");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.cloudinary.com/v1_1/daiboggpp/image/upload");
    xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      if (xhr.status === 200) { onChange(JSON.parse(xhr.responseText).secure_url); setProgress(null); }
      else { setError("上傳失敗，請重試"); setProgress(null); }
    };
    xhr.onerror = () => { setError("上傳失敗，請重試"); setProgress(null); };
    setProgress(0);
    xhr.send(fd);
  };

  return (
    <div>
      <p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{label}</p>
      <div style={{ aspectRatio: aspect, background: GRAY, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, maxHeight: 200 }}>
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

// ── Rich Text Editor ──
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
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); document.execCommand("insertParagraph"); }
          else if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); document.execCommand("insertLineBreak"); }
        }}
        style={{ minHeight: 360, padding: "16px", outline: "none", fontSize: 16, lineHeight: 1.8, color: CHAR }} />
    </div>
  );
}

// ── SVG icons for mobile tab bar ──
const IcUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcIG   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/></svg>;
const IcRes  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IcApp  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>;
const IcShop = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;

const MOBILE_TABS = [["home","文章",IcUser],["ig","最新消息",IcIG],["resources","資源",IcRes],["app","App",IcApp],["shop","商品",IcShop]];
const NAV = [["home","文章"],["about","關於我"],["ig","最新消息"],["resources","資源分享"],["app","記帳 Web App"],["shop","商品"],["goods","推薦好物"]];

// ── Nav ──
function Nav({ page, setPage, isAdmin }) {
  const [showL, setShowL] = useState(false);
  const [mob, setMob] = useState(false);
  const [logging, setLogging] = useState(false);
  const [err, setErr] = useState("");
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
      <header style={{ background: O, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span onClick={() => go("home")} style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 16, letterSpacing: "2px", color: WHITE, cursor: "pointer", flexShrink: 0 }}>88La</span>
          <nav className="nav-links" style={{ display: "flex", gap: 22, alignItems: "center" }}>
            {NAV.map(([k, l]) => (
              <span key={k} onClick={() => go(k)} style={{ fontSize: 12, letterSpacing: ".8px", color: page === k ? WHITE : "rgba(255,255,255,.7)", cursor: "pointer", fontWeight: page === k ? "700" : "400", borderBottom: page === k ? `2px solid ${WHITE}` : "2px solid transparent", paddingBottom: 2, transition: "color .15s" }}>{l}</span>
            ))}
            {isAdmin && <><span onClick={() => go("write")} style={{ fontSize: 12, color: WHITE, cursor: "pointer", letterSpacing: ".5px" }}>＋ 撰文</span><span onClick={() => signOut(auth)} style={{ fontSize: 11, color: "rgba(255,255,255,.5)", cursor: "pointer", marginLeft: 6 }}>登出</span></>}
          </nav>
          <button className="mob-menu" onClick={() => setMob(p => !p)} aria-label={mob ? "關閉選單" : "開啟選單"} style={{ background: "none", border: "none", color: WHITE, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center" }}>
            {mob ? "✕" : "☰"}
          </button>
        </div>
        {mob && (
          <div className="mob-panel" style={{ background: CHAR, display: "flex", flexDirection: "column" }}>
            {NAV.map(([k, l]) => (
              <span key={k} onClick={() => go(k)} style={{ fontSize: 15, padding: "15px 24px", borderBottom: `1px solid rgba(255,255,255,.08)`, color: page === k ? O : "rgba(255,255,255,.85)", cursor: "pointer", fontWeight: page === k ? "600" : "400" }}>{l}</span>
            ))}
            {isAdmin && <><span onClick={() => go("write")} style={{ fontSize: 15, padding: "15px 24px", borderBottom: `1px solid rgba(255,255,255,.08)`, color: O, cursor: "pointer" }}>＋ 撰文</span><span onClick={() => { signOut(auth); setMob(false); }} style={{ fontSize: 13, padding: "13px 24px", color: "rgba(255,255,255,.4)", cursor: "pointer" }}>登出</span></>}
          </div>
        )}
      </header>
      {/* Mobile bottom tab bar */}
      <nav className="mob-tab-bar">
        {MOBILE_TABS.map(([k, l, Icon]) => (
          <button key={k} className={`tab-item ${page === k ? "active" : ""}`} onClick={() => go(k)}>
            <Icon />
            <span>{l}</span>
          </button>
        ))}
      </nav>
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

// ── Footer ──
function Footer({ links, footerTagline, setFooterTagline, isAdmin, setPage }) {
  const l = links || DEFAULTS.links;
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(footerTagline || DEFAULTS.footerTagline);
  const save = () => { setFooterTagline(tmp); setEditing(false); };
  return (
    <footer style={{ background: CHAR, padding: "40px 32px calc(32px + env(safe-area-inset-bottom, 0px))", paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }} className="site-footer">
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <p style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14, letterSpacing: "1.5px", color: WHITE }}>88La 理財導航器</p>
          {editing ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={tmp} onChange={e => setTmp(e.target.value)} style={{ fontSize: 12, color: WHITE, borderBottom: `1px solid rgba(255,255,255,.3)`, background: "transparent", width: 240, padding: "2px 0" }} />
              <button onClick={save} style={{ background: O, color: WHITE, border: "none", padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>儲存</button>
              <button onClick={() => setEditing(false)} style={{ background: "transparent", color: "rgba(255,255,255,.5)", border: `1px solid rgba(255,255,255,.25)`, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>取消</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>{footerTagline || DEFAULTS.footerTagline}</p>
              {isAdmin && <span onClick={() => { setTmp(footerTagline || DEFAULTS.footerTagline); setEditing(true); }} style={{ fontSize: 11, color: "rgba(255,255,255,.35)", cursor: "pointer", textDecoration: "underline" }}>編輯</span>}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[[l.lineOfficial, "LINE"], [l.instagram, "Instagram"], ["mailto:" + l.email, "Email"]].map(([h, label]) => (
            <a key={label} href={h} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "rgba(255,255,255,.6)", fontWeight: 400, transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = WHITE} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}>{label}</a>
          ))}
          {setPage && <><span onClick={() => setPage("newsletter")} style={{ fontSize: 12, color: "rgba(255,255,255,.6)", cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = WHITE} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}>電子報</span><span onClick={() => setPage("contact")} style={{ fontSize: 12, color: "rgba(255,255,255,.6)", cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = WHITE} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}>合作洽談</span><span onClick={() => setPage("pricing")} style={{ fontSize: 12, color: "rgba(255,255,255,.6)", cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = WHITE} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}>訂閱方案</span></>}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "12px auto 0", paddingTop: 14, borderTop: `1px solid rgba(255,255,255,.1)`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>© 2026 88La 版權所有</p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <a href={`mailto:${l.email}`} style={{ fontSize: 11, color: "rgba(255,255,255,.55)", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.8)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.55)"}>{l.email}</a>
          {setPage && <><span onClick={() => setPage("terms")} style={{ fontSize: 11, color: "rgba(255,255,255,.55)", cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.8)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.55)"}>服務條款</span><span onClick={() => setPage("privacy")} style={{ fontSize: 11, color: "rgba(255,255,255,.55)", cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.8)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.55)"}>隱私政策</span><span onClick={() => setPage("disclaimer")} style={{ fontSize: 11, color: "rgba(255,255,255,.55)", cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.8)"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.55)"}>免責聲明</span></>}
        </div>
      </div>
    </footer>
  );
}

// ── Hero Banner ──
function Hero({ about, isAdmin, setAbout, links }) {
  const l = links || DEFAULTS.links;
  const [editBanner, setEditBanner] = useState(false);
  const [tmp, setTmp] = useState(about);
  const [bannerUrlErr, setBannerUrlErr] = useState("");
  const save = () => {
    const l1 = (tmp.bannerLink1 || "").trim(), l2 = (tmp.bannerLink2 || "").trim();
    if ((l1 && !isValidUrl(l1)) || (l2 && !isValidUrl(l2))) { setBannerUrlErr("連結格式不正確，需以 https:// 開頭"); return; }
    setBannerUrlErr(""); setAbout(tmp); setEditBanner(false);
  };
  if (editBanner) return (
    <div style={{ padding: "48px 32px", maxWidth: 600, margin: "0 auto" }}>
      <p style={{ fontSize: 11, letterSpacing: "2px", color: O, marginBottom: 24 }}>編輯 Banner</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <ImgUploader label="背景圖片" value={tmp.bannerImg || ""} onChange={v => setTmp(p => ({ ...p, bannerImg: v }))} aspect="16/9" />
        {[["大標題","bannerTitle",""],["副標題","bannerSub",""],["按鈕一文字","bannerBtn1","加入 LINE 社群"],["按鈕一連結","bannerLink1","https://line.me/..."],["按鈕二文字","bannerBtn2","追蹤 Instagram"],["按鈕二連結","bannerLink2","https://www.instagram.com/..."]].map(([label,key,ph]) => (
          <div key={key}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{label}</p><input placeholder={ph} value={tmp[key] || ""} onChange={e => { setTmp(p => ({ ...p, [key]: e.target.value })); setBannerUrlErr(""); }} /></div>
        ))}
        {bannerUrlErr && <p style={{ fontSize: 12, color: "#C0392B" }}>{bannerUrlErr}</p>}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 28 }}><button className="pb" onClick={save}>儲存</button><button className="pg" onClick={() => setEditBanner(false)}>取消</button></div>
    </div>
  );
  const bi = about.bannerImg || "";
  const bt = about.bannerTitle || "理財，是為了讓生活更自由。";
  const bs = about.bannerSub || "88La 帶你用最真實的方式，重新認識金錢。";
  const bb1 = about.bannerBtn1 || "加入 LINE 社群";
  const bb2 = about.bannerBtn2 || "追蹤 Instagram";
  const bl1 = about.bannerLink1 || l.lineCommunity;
  const bl2 = about.bannerLink2 || l.instagram;
  return (
    <div className={`banner-h${bi ? "" : " hero-pattern"}`} style={{
      height: 560,
      ...(bi ? { background: `linear-gradient(rgba(40,20,10,.55),rgba(40,20,10,.55)) center/cover, url('${bi.replace(/[\\'()]/g, "\\$&")}') center/cover no-repeat` } : {}),
      display: "flex", alignItems: "center", position: "relative"
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", width: "100%" }}>
        <p className="hero-stagger hs-1" style={{ fontSize: 11, letterSpacing: "3px", color: O, marginBottom: 20, fontWeight: 600 }}>88La · PERSONAL FINANCE</p>
        <h1 className="hero-title hero-stagger hs-2" style={{ fontSize: 52, fontWeight: 700, color: bi ? WHITE : CHAR, lineHeight: 1.2, marginBottom: 20, maxWidth: 600 }}>{bt}</h1>
        <p className="hero-sub hero-stagger hs-3" style={{ fontSize: 16, color: bi ? "rgba(255,255,255,.8)" : MID, marginBottom: 36, maxWidth: 480, lineHeight: 1.85 }}>{bs}</p>
        <div className="hero-stagger hs-4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href={bl1} target="_blank" rel="noopener noreferrer"><button className="pb">{bb1}</button></a>
          <a href={bl2} target="_blank" rel="noopener noreferrer">
            <button style={{ background: bi ? "rgba(255,255,255,.12)" : "transparent", color: bi ? WHITE : CHAR, border: `1px solid ${bi ? "rgba(255,255,255,.35)" : "#D0D0D0"}`, padding: "11px 24px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "border-color .18s" }}>{bb2}</button>
          </a>
        </div>
      </div>
      {isAdmin && <button onClick={() => { setTmp(about); setEditBanner(true); }} style={{ position: "absolute", top: 20, right: 20, background: "rgba(200,90,20,.9)", color: WHITE, border: "none", padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>編輯 Banner</button>}
    </div>
  );
}

// ── Home (article list) ──
function Home({ articles, setPage, setId, setArticles, isAdmin, siteTitle, setSiteTitle, tags, setTags, about, setAbout, links }) {
  const [filter, setFilter] = useState("全部");
  const [sort, setSort] = useState("newest");
  const [editTitle, setEditTitle] = useState(false);
  const [tmpTitle, setTmpTitle] = useState(siteTitle);
  const [editTags, setEditTags] = useState(false);
  const [newTag, setNewTag] = useState("");
  const filtered = articles.filter(a => filter === "全部" || a.tag === filter).slice().sort((a, b) => {
    if (sort === "newest") return (b.date || "").localeCompare(a.date || "");
    if (sort === "oldest") return (a.date || "").localeCompare(b.date || "");
    if (sort === "views") return (b.views || 0) - (a.views || 0);
    return 0;
  });
  const open = id => { setArticles(prev => { const next = prev.map(a => a.id === id ? { ...a, views: (a.views || 0) + 1 } : a); fbSet("articles", next); return next; }); setId(id); setPage("article"); window.scrollTo({ top: 0, behavior: "instant" }); const a = articles.find(x => x.id === id); history.pushState({}, "", "?article=" + (a?.slug || id)); };
  const addTag = () => { const t = newTag.trim(); if (t && !tags.includes(t)) setTags(prev => [...prev, t]); setNewTag(""); };
  const delTag = t => { if (confirm("確定刪除標籤「" + t + "」？")) setTags(prev => prev.filter(x => x !== t)); };
  const moveA = (idx, dir) => setArticles(prev => {
    const ti = idx + dir;
    if (ti < 0 || ti >= filtered.length) return prev;
    const a = [...prev];
    const ri = a.findIndex(x => x.id === filtered[idx].id);
    const ni = a.findIndex(x => x.id === filtered[ti].id);
    if (ri === -1 || ni === -1) return prev;
    [a[ri], a[ni]] = [a[ni], a[ri]]; return a;
  });
  return (
    <div>
      <Hero about={about} isAdmin={isAdmin} setAbout={setAbout} links={links} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 32px" }} className="page-wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 40 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 10 }}>JOURNAL</p>
            {editTitle ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input value={tmpTitle} onChange={e => setTmpTitle(e.target.value)} style={{ fontSize: 24, fontWeight: 700, flex: 1, minWidth: 200 }} />
                <button className="pb" style={{ fontSize: 12, padding: "8px 16px" }} onClick={() => { setSiteTitle(tmpTitle); setEditTitle(false); }}>儲存</button>
                <button className="pg" style={{ fontSize: 12 }} onClick={() => { setTmpTitle(siteTitle); setEditTitle(false); }}>取消</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 30, fontWeight: 700, color: TITLE_COLOR }}>{siteTitle}</h2>
                {isAdmin && <span style={{ fontSize: 12, color: O, cursor: "pointer" }} onClick={() => { setTmpTitle(siteTitle); setEditTitle(true); }}>編輯</span>}
              </div>
            )}
          </div>
          {isAdmin && !editTitle && <button className="pb" onClick={() => setPage("write")}>＋ 新增文章</button>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {["全部", ...tags].map(t => (
              <span key={t} onClick={() => setFilter(t)} style={{ fontSize: 12, padding: "8px 16px", cursor: "pointer", background: filter === t ? CORAL : GRAY, color: filter === t ? WHITE : MID, fontWeight: filter === t ? "500" : "400", transition: "background .15s" }}>{t}</span>
            ))}
            {isAdmin && <span onClick={() => setEditTags(p => !p)} style={{ fontSize: 12, color: O, cursor: "pointer", marginLeft: 8 }}>{editTags ? "關閉" : "管理標籤"}</span>}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ fontSize: 12, color: MID, border: `1px solid #D0D5DA`, borderRadius: 4, padding: "8px 12px", background: WHITE, cursor: "pointer", appearance: "auto", WebkitAppearance: "menulist", width: "auto" }}>
            <option value="newest">最新文章</option>
            <option value="oldest">最舊文章</option>
            <option value="views">最多瀏覽</option>
          </select>
        </div>
        {isAdmin && editTags && (
          <div style={{ background: O2, padding: "20px 24px", marginBottom: 32 }}>
            <p style={{ fontSize: 11, letterSpacing: "1px", color: MID, marginBottom: 14 }}>標籤管理</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {tags.map(t => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: GRAY, padding: "4px 12px", fontSize: 12, color: MID }}>
                  {t}<span onClick={() => delTag(t)} style={{ cursor: "pointer", color: LIGHT, fontSize: 14 }}>×</span>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input placeholder="新增標籤" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} style={{ maxWidth: 200, border: "1px solid #D0D5DA", padding: "8px 12px", background: WHITE }} />
              <button className="pb" style={{ fontSize: 12, padding: "8px 16px" }} onClick={addTag} disabled={!newTag.trim()}>新增</button>
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 20 }} className="grid3">
          {filtered.map((a, idx) => (
            <Reveal key={a.id} delay={Math.min(idx * 80, 400)}>
            <div className="card" onClick={() => open(a.id)} style={{ position: "relative" }}>
              {a.img
                ? <div style={{ height: 200, overflow: "hidden", background: GRAY }}><img src={a.img} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }} loading="lazy" onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} /></div>
                : <div style={{ height: 8, background: `linear-gradient(90deg, ${CORAL} 0%, ${O2} 100%)` }} />
              }
              <div style={{ padding: "24px 28px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "flex-start" }}>
                  <span className="tag">{a.tag}</span>
                  <span style={{ fontSize: 11, color: LIGHT, flexShrink: 0, marginLeft: 8 }}>{a.date}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.55, marginBottom: 10, color: TITLE_COLOR }}>{a.title}</h3>
                <p style={{ fontSize: 14, color: MID, lineHeight: 1.9, marginBottom: 20, whiteSpace: "pre-wrap" }}>{a.excerpt}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: O, fontWeight: 500 }}>閱讀全文 →</span>
                  <span style={{ fontSize: 11, color: LIGHT }}>瀏覽 {a.views}</span>
                </div>
              </div>
              {isAdmin && <OrdBtns idx={idx} total={filtered.length} onMove={moveA} style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }} />}
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Article detail ──
const PAGE_OPTIONS = [["home","文章列表"],["app","記帳 App"],["resources","免費資源"],["shop","商品"],["goods","推薦好物"],["newsletter","電子報"],["contact","合作洽談"]];

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
  const [ed, setEd] = useState({ title: article.title, tag: article.tag, excerpt: article.excerpt, content: article.content, img: article.img || "", date: article.date || "", relatedLinks: article.relatedLinks || [] });
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
  const articleUrl = `${window.location.origin}${window.location.pathname}?article=${article.slug || article.id}`;
  const copy = () => { navigator.clipboard.writeText(articleUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const del = () => { if (confirm("確定刪除此文章？")) { setArticles(prev => prev.filter(a => a.id !== article.id)); onBack(); } };
  const saveEdit = () => { setArticles(prev => prev.map(a => a.id === article.id ? { ...a, ...ed } : a)); setEditing(false); };
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
        <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={saveEdit}>儲存</button><button className="pg" onClick={() => setEditing(false)}>取消</button></div>
      </div>
    </div>
  );
  return (
    <div>
      <div style={{ background: GRAD, padding: "52px 32px 44px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <button onClick={onBack} style={{ background: "transparent", color: MID, border: `1px solid ${BORDER}`, padding: "7px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 28 }}>← 返回</button>
          <span className="tag" style={{ marginBottom: 14, display: "inline-block" }}>{article.tag}</span>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: CHAR, lineHeight: 1.45, marginBottom: 14 }}>{article.title}</h1>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: LIGHT }}>{article.date}</span>
            <span style={{ fontSize: 12, color: LIGHT }}>瀏覽 <CountUp end={article.views} /></span>
            {isAdmin && <><span style={{ fontSize: 12, color: O, cursor: "pointer" }} onClick={() => setEditing(true)}>編輯</span><span style={{ fontSize: 12, color: "#E74C3C", cursor: "pointer" }} onClick={del}>刪除</span></>}
          </div>
        </div>
      </div>
      {article.img && (
        <div style={{ maxWidth: 740, margin: "0 auto", overflow: "hidden" }}>
          <img src={article.img} alt={article.title} style={{ width: "100%", height: "auto", display: "block", maxHeight: 400, objectFit: "cover" }} />
        </div>
      )}
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "52px 32px" }} className="page-wrap">
        <div className="article-content" style={{ fontSize: 16, lineHeight: 1.8, color: CHAR, marginBottom: 56 }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(/<[a-z][\s\S]*>/i.test(article.content || "") ? article.content : (article.content || "").replace(/\n/g, "<br>")) }} />
        {relLinks.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, letterSpacing: "2px", color: MID, marginBottom: 16 }}>相關內容</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {relLinks.map(rl => {
                const product = rl.type === "product" ? (products || []).find(p => String(p.id) === String(rl.key)) : null;
                const resource = rl.type === "resource" ? (resources || []).find(r => String(r.id) === String(rl.key)) : null;
                return (
                  <div key={rl.id} onClick={() => handleRelNav(rl)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: O2, border: `1px solid rgba(200,90,20,.15)`, cursor: "pointer", transition: "box-shadow .18s" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px rgba(200,90,20,.12)`}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                  >
                    <div style={{ width: 36, height: 36, background: O, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {rl.type === "product" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>}
                      {rl.type === "resource" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>}
                      {rl.type === "page" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, color: O, letterSpacing: ".5px", marginBottom: 2, fontWeight: 600 }}>{rl.type === "product" ? "商品" : rl.type === "resource" ? "免費資源" : "前往頁面"}</p>
                      <p style={{ fontSize: 14, color: CHAR, fontWeight: 500 }}>{rl.label}</p>
                      {product && <p style={{ fontSize: 12, color: MID, marginTop: 2 }}>{product.price}</p>}
                      {resource && <p style={{ fontSize: 12, color: MID, marginTop: 2 }}>{resource.type}</p>}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={O} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginBottom: 56, flexWrap: "wrap" }}>
          <button className="pg" onClick={copy}>{copied ? "✓ 已複製連結" : "複製連結"}</button>
          <a href={"https://social-plugins.line.me/lineit/share?url=" + encodeURIComponent(articleUrl)} target="_blank" rel="noopener noreferrer"><button className="pg">分享至 LINE</button></a>
        </div>
        <div style={{ background: CORAL, padding: "36px" }}>
          <p style={{ fontSize: 16, fontWeight: 500, color: WHITE, marginBottom: 6 }}>加入 8友 社群</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 22, lineHeight: 1.8 }}>一起聊聊關於錢的事，不說教，只分享。</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={l.lineCommunity} target="_blank" rel="noopener noreferrer"><button className="pb">LINE 社群</button></a>
            <a href={l.instagram} target="_blank" rel="noopener noreferrer"><button style={{ background: "rgba(255,255,255,.15)", color: WHITE, border: "1px solid rgba(255,255,255,.3)", padding: "11px 24px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Instagram</button></a>
          </div>
        </div>
        <p style={{ fontSize: 11, letterSpacing: "2px", color: MID, margin: "48px 0 24px" }}>COMMENTS (<CountUp end={article.comments.length} duration={600} />)</p>
        <div style={{ marginBottom: 36 }}>
          {article.comments.length === 0 && <p style={{ fontSize: 14, color: LIGHT, padding: "20px 0" }}>還沒有留言，來說說你的想法吧。</p>}
          {article.comments.map((c, i) => (
            <div key={i} style={{ padding: "18px 0", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: CORAL2 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: LIGHT }}>{c.date}</span>
              </div>
              <p style={{ fontSize: 14, color: MID, lineHeight: 1.8 }}>{c.text}</p>
            </div>
          ))}
        </div>
        <div style={{ background: GRAY, padding: "28px 28px" }}>
          <p style={{ fontSize: 12, letterSpacing: "1px", color: MID, marginBottom: 18 }}>留下你的想法</p>
          <input placeholder="暱稱（選填）" value={name} onChange={e => setName(e.target.value)} maxLength={50} style={{ marginBottom: 14 }} />
          <textarea placeholder="你的留言⋯" value={text} onChange={e => setText(e.target.value)} maxLength={500} style={{ marginBottom: 18, border: "none", background: "transparent", borderBottom: "1px solid #D0D5DA" }} />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="pb" onClick={submit} disabled={!text.trim()}>送出留言</button>
            {cooldown > 0 && <span style={{ fontSize: 12, color: "#C0392B" }}>請等待 {cooldown} 秒後再送出</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Write (admin new article) ──
function Write({ onSave, onBack, tags, products, resources }) {
  const [d, setD] = useState({ title: "", tag: tags[0] || "", excerpt: "", content: "", img: "", relatedLinks: [] });
  const ok = d.title.trim() && d.content.trim();
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
        <div style={{ display: "flex", gap: 10 }}><button className="pb" disabled={!ok} onClick={() => onSave(d)}>發布</button><button className="pg" onClick={onBack}>取消</button></div>
      </div>
    </div>
  );
}

// ── About ──
function About({ about, setAbout, isAdmin, links, setLinks }) {
  const [editing, setEditing] = useState(false);
  const [editLinks, setEditLinks] = useState(false);
  const [tmp, setTmp] = useState(about);
  const [tmpL, setTmpL] = useState(links || DEFAULTS.links);
  const l = links || DEFAULTS.links;
  const save = () => { setAbout(tmp); setEditing(false); };
  const saveLinks = () => { setLinks(tmpL); setEditLinks(false); };
  if (editing) return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 32px" }} className="page-wrap">
      <button className="pg" onClick={() => setEditing(false)} style={{ marginBottom: 32 }}>← 取消</button>
      <p className="section-label" style={{ marginBottom: 28 }}>編輯關於我</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }} className="grid2">
        <div style={{ background: GRAY, aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {tmp.img ? <img src={tmp.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="about" /> : <span style={{ fontSize: 12, color: LIGHT }}>封面圖片</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ImgUploader label="封面圖片" value={tmp.img} onChange={v => setTmp(p => ({ ...p, img: v }))} aspect="3/4" />
          <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>自我介紹</p><textarea value={tmp.intro} onChange={e => setTmp(p => ({ ...p, intro: e.target.value }))} style={{ minHeight: 200 }} /></div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save}>儲存</button><button className="pg" onClick={() => setEditing(false)}>取消</button></div>
    </div>
  );
  if (editLinks) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 32px" }} className="page-wrap">
      <button className="pg" onClick={() => setEditLinks(false)} style={{ marginBottom: 32 }}>← 取消</button>
      <p className="section-label" style={{ marginBottom: 28 }}>連結設定</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {[["LINE 社群連結","lineCommunity"],["LINE 官方帳號連結","lineOfficial"],["Instagram 連結","instagram"],["合作信箱","email"]].map(([label,key]) => (
          <div key={key}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{label}</p><input value={tmpL[key]} onChange={e => setTmpL(p => ({ ...p, [key]: e.target.value }))} /></div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 32 }}><button className="pb" onClick={saveLinks}>儲存</button><button className="pg" onClick={() => setEditLinks(false)}>取消</button></div>
    </div>
  );
  return (
    <div>
      <div style={{ background: GRAD, padding: "48px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="section-label" style={{ marginBottom: 8 }}>ABOUT</p>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: CHAR }}>88La</h1>
            <p style={{ fontSize: 13, color: MID, marginTop: 4 }}>@every_dollars · Taiwan</p>
          </div>
          {isAdmin && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setTmpL(l); setEditLinks(true); }} className="pg" style={{ fontSize: 12, padding: "8px 16px" }}>連結設定</button>
              <button onClick={() => { setTmp(about); setEditing(true); }} className="pb" style={{ fontSize: 12, padding: "8px 16px" }}>編輯頁面</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 32px" }} className="page-wrap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }} className="about-grid">
          <div style={{ background: GRAY, aspectRatio: "3/4", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }} className="about-img">
            {about.img ? <img src={about.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="88La" /> : <span style={{ fontSize: 12, color: LIGHT, letterSpacing: "1px" }}>PHOTO</span>}
          </div>
          <div style={{ paddingTop: 20 }}>
            <p className="section-label" style={{ marginBottom: 20 }}>HELLO</p>
            <div style={{ fontSize: 16, color: MID, lineHeight: 2.2, whiteSpace: "pre-wrap", marginBottom: 36 }}>{about.intro}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={l.lineCommunity} target="_blank" rel="noopener noreferrer"><button className="pb">LINE 社群</button></a>
              <a href={l.lineOfficial} target="_blank" rel="noopener noreferrer"><button className="pbn">LINE 官方帳號</button></a>
              <a href={l.instagram} target="_blank" rel="noopener noreferrer"><button className="pg">Instagram</button></a>
              <a href={"mailto:" + l.email}><button className="pg">合作信箱</button></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shop ──
function Shop({ products, setProducts, isAdmin }) {
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
          <div><p className="section-label" style={{ marginBottom: 8 }}>SHOP</p><h1 style={{ fontSize: 26, fontWeight: 700, color: CHAR }}>商品</h1></div>
          {isAdmin && <button className="pb" onClick={startAdd}>＋ 新增商品</button>}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px" }} className="page-wrap">
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }} className="grid3">
          {products.map((p, idx) => (
            <Reveal key={p.id} delay={Math.min(idx * 80, 400)}>
            <div style={{ background: WHITE, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", position: "relative", border: `1px solid ${BORDER}`, transition: "box-shadow .24s, transform .24s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,90,20,.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {isAdmin && <OrdBtns idx={idx} total={products.length} onMove={move} style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }} />}
              <div style={{ height: 200, background: "#E8EAEC", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.img ? <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <span style={{ fontSize: 12, color: LIGHT, letterSpacing: "1px" }}>{p.type === "digital" ? "DIGITAL" : "PHYSICAL"}</span>}
              </div>
              <div style={{ padding: "20px 22px 24px" }}>
                <span className={p.type === "digital" ? "tag" : "tagn"} style={{ marginBottom: 10, display: "inline-block" }}>{p.type === "digital" ? "數位商品" : "實體商品"}</span>
                <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: O }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: MID, lineHeight: 1.8, marginBottom: 14, whiteSpace: "pre-wrap" }}>{p.desc}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: O }}>{p.price}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {p.url
                      ? <a href={p.url} target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "8px 16px" }}>購買 →</button></a>
                      : <button className="pg" style={{ fontSize: 12, padding: "8px 16px", opacity: .45, cursor: "default" }} disabled>尚未上架</button>}
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

// ── IG / 最新消息 ──
function IG({ igPosts, setIgPosts, isAdmin, links }) {
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
            <p className="section-label" style={{ marginBottom: 10 }}>LATEST</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: CHAR }}>最新消息</h1>
            <p style={{ fontSize: 13, color: MID, marginTop: 8 }}>影片、貼文，直接連結 Instagram</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {isAdmin && <button className="pb" onClick={startAdd}>＋ 新增</button>}
            <a href={l.instagram} target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "6px 14px" }}>IG 主頁 →</button></a>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px" }} className="page-wrap">
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
              <div key={p.id} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", position: "relative", transition: "box-shadow .24s, transform .24s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,90,20,.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {ytId ? (
                  <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                    <iframe src={`https://www.youtube.com/embed/${ytId}`} title={p.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none", display: "block" }} loading="lazy" />
                  </div>
                ) : (
                  <a href={p.url || l.instagram} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                    <div style={{ aspectRatio: "1", background: "#EBEBEB", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: CHAR, flex: 1, whiteSpace: "pre-wrap" }}>{p.title}</p>
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

// ── Goods ──
function Goods({ goods, setGoods, isAdmin }) {
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
    <div>
      <div style={{ background: GRAD, padding: "48px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div><p className="section-label" style={{ marginBottom: 8 }}>FAVORITES</p><h1 style={{ fontSize: 26, fontWeight: 700, color: CHAR }}>推薦好物</h1></div>
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
        {active.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <p style={{ fontSize: 14, color: LIGHT, lineHeight: 2.4 }}>88La 正在尋找好物中<br /><span style={{ fontSize: 12 }}>有合適的商品會在這裡和你分享</span></p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }} className="grid3">
            {active.map((p, idx) => (
              <Reveal key={p.id} delay={Math.min(idx * 80, 400)}>
              <div style={{ background: WHITE, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", position: "relative", border: `1px solid ${BORDER}`, transition: "box-shadow .24s, transform .24s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,90,20,.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {isAdmin && <OrdBtns idx={idx} total={active.length} onMove={move} style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }} />}
                {p.img && <div style={{ height: 180, overflow: "hidden", background: "#E8EAEC" }}><img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /></div>}
                <div style={{ padding: "22px 22px" }}>
                  {p.brand && <p style={{ fontSize: 11, color: O, letterSpacing: ".5px", marginBottom: 6, fontWeight: 500 }}>{p.brand}</p>}
                  <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: CORAL2 }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: MID, lineHeight: 1.8, marginBottom: 16, whiteSpace: "pre-wrap" }}>{p.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
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
  );
}

// ── NEW: App 介紹頁 ──
function AppPage({ appContent, setAppContent, isAdmin }) {
  const c = { ...DEFAULTS.appContent, ...(appContent || {}) };
  const upd = patch => setAppContent(prev => ({ ...DEFAULTS.appContent, ...(prev || {}), ...patch }));
  const [detailPlan, setDetailPlan] = useState(null);
  const [editHero, setEditHero] = useState(false);
  const [tmpHero, setTmpHero] = useState({ heroTitle: c.heroTitle, heroHighlight: c.heroHighlight, heroSub: c.heroSub });
  const [editingFeat, setEditingFeat] = useState(null);
  const [featForm, setFeatForm] = useState({ n: "", title: "", desc: "", img: "" });
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: "", price: "", period: "", highlight: false, badge: "", features: [], detailTitle: "", detailImg: "", detailContent: "" });
  const [editNote, setEditNote] = useState(false);
  const [tmpNote, setTmpNote] = useState(c.pricingNote);
  const [editGuide, setEditGuide] = useState(false);
  const [tmpGuide, setTmpGuide] = useState({ title: "", json: "" });
  const saveFeat = () => {
    if (editingFeat === "new") upd({ features: [...c.features, { id: Date.now(), n: String(c.features.length + 1).padStart(2, "0"), ...featForm }] });
    else upd({ features: c.features.map(f => f.id === editingFeat ? { ...f, ...featForm } : f) });
    setEditingFeat(null);
  };
  const delFeat = id => { if (confirm("確定刪除？")) upd({ features: c.features.filter(f => f.id !== id) }); };
  const savePlan = () => {
    if (editingPlan === "new") upd({ plans: [...c.plans, { id: Date.now(), ...planForm }] });
    else upd({ plans: c.plans.map(p => p.id === editingPlan ? { ...p, ...planForm } : p) });
    setEditingPlan(null);
  };
  const delPlan = id => { if (confirm("確定刪除？")) upd({ plans: c.plans.filter(p => p.id !== id) }); };

  // ── Plan detail page ──
  if (detailPlan !== null) {
    const plan = c.plans.find(p => p.id === detailPlan);
    if (!plan) { setDetailPlan(null); return null; }
    return (
      <div>
        <div style={{ background: GRAD, padding: "52px 32px 44px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <button onClick={() => setDetailPlan(null)} style={{ background: "transparent", color: MID, border: `1px solid ${BORDER}`, padding: "7px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 28 }}>← 返回方案</button>
            <p className="section-label" style={{ marginBottom: 12 }}>PLAN DETAILS</p>
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
            <p style={{ fontSize: 11, color: plan.highlight ? "rgba(255,255,255,.55)" : MID, letterSpacing: "1px", marginBottom: 16 }}>包含功能</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {(plan.features || []).filter(Boolean).map((f, j) => (
                <li key={j} style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,.9)" : MID, display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "rgba(255,255,255,.8)" : O} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{f}
                </li>
              ))}
            </ul>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer">
              <button style={{ background: plan.highlight ? WHITE : O, color: plan.highlight ? O : WHITE, border: "none", padding: "14px 36px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "opacity .18s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >立即購買 →</button>
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
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {editHero ? (
            <div style={{ background: WHITE, padding: 24, border: `1px solid ${BORDER}`, maxWidth: 560, marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>編輯主標題</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題（第一行）</p><input value={tmpHero.heroTitle} onChange={e => setTmpHero(p => ({ ...p, heroTitle: e.target.value }))} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>橘色強調字（第二行）</p><input value={tmpHero.heroHighlight} onChange={e => setTmpHero(p => ({ ...p, heroHighlight: e.target.value }))} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>副標題</p><textarea value={tmpHero.heroSub} onChange={e => setTmpHero(p => ({ ...p, heroSub: e.target.value }))} style={{ minHeight: 80 }} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}><button className="pb" onClick={() => { upd({ heroTitle: tmpHero.heroTitle, heroHighlight: tmpHero.heroHighlight, heroSub: tmpHero.heroSub }); setEditHero(false); }}>儲存</button><button className="pg" onClick={() => setEditHero(false)}>取消</button></div>
            </div>
          ) : (
            <>
              <p className="section-label hero-stagger hs-1" style={{ marginBottom: 16 }}>88LA FINANCE · APP</p>
              <h1 className="hero-stagger hs-2" style={{ fontSize: 48, fontWeight: 700, color: CHAR, lineHeight: 1.2, maxWidth: 580, marginBottom: 20 }}>
                {c.heroTitle}<br /><span style={{ color: O }}>{c.heroHighlight}</span>
              </h1>
              <p className="hero-stagger hs-3" style={{ fontSize: 16, color: MID, lineHeight: 1.9, maxWidth: 480, marginBottom: 36, whiteSpace: "pre-wrap" }}>{c.heroSub}</p>
              <div className="hero-stagger hs-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <a href="#pricing" onClick={e => { e.preventDefault(); document.getElementById("app-pricing")?.scrollIntoView({ behavior: "smooth" }); }}><button className="pb" style={{ fontSize: 14, padding: "14px 32px" }}>了解方案 →</button></a>
                {isAdmin && <button className="pg" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => { setTmpHero({ heroTitle: c.heroTitle, heroHighlight: c.heroHighlight, heroSub: c.heroSub }); setEditHero(true); }}>編輯標題</button>}
              </div>
            </>
          )}
        </div>
      </div>
      {/* Features */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 32px" }} className="page-wrap">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>FEATURES</p>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: CHAR }}>你需要的，都在這裡</h2>
        </div>
        {editingFeat && (
          <div style={{ background: GRAY, padding: "24px", marginBottom: 32, border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>{editingFeat === "new" ? "新增功能" : "編輯功能"}</p>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 16, marginBottom: 16 }} className="grid2">
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>編號</p><input value={featForm.n} onChange={e => setFeatForm(p => ({ ...p, n: e.target.value }))} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題</p><input value={featForm.title} onChange={e => setFeatForm(p => ({ ...p, title: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>說明</p><textarea value={featForm.desc} onChange={e => setFeatForm(p => ({ ...p, desc: e.target.value }))} style={{ minHeight: 70 }} /></div>
            <div style={{ marginBottom: 16 }}><ImgUploader label="圖片（選填）" value={featForm.img} onChange={v => setFeatForm(p => ({ ...p, img: v }))} aspect="16/9" /></div>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={saveFeat} disabled={!featForm.title.trim()}>儲存</button><button className="pg" onClick={() => setEditingFeat(null)}>取消</button></div>
          </div>
        )}
        {isAdmin && !editingFeat && <div style={{ marginBottom: 24, textAlign: "right" }}><button className="pb" style={{ fontSize: 12 }} onClick={() => { setFeatForm({ n: String(c.features.length + 1).padStart(2, "0"), title: "", desc: "", img: "" }); setEditingFeat("new"); }}>＋ 新增功能</button></div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }} className="grid3">
          {c.features.map((f, i) => (
            <Reveal key={f.id || i} delay={Math.min(i * 80, 400)}>
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", transition: "box-shadow .24s, transform .24s", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,90,20,.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {f.img && <div style={{ height: 160, overflow: "hidden" }}><img src={f.img} alt={f.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /></div>}
              <div style={{ padding: "28px 28px 32px" }}>
                {isAdmin && <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4, zIndex: 1 }}>
                  <button className="pg" style={{ fontSize: 10, padding: "3px 8px" }} onClick={() => { setFeatForm({ n: f.n, title: f.title, desc: f.desc, img: f.img || "" }); setEditingFeat(f.id); }}>編輯</button>
                  <button className="pg" style={{ fontSize: 10, padding: "3px 8px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => delFeat(f.id)}>✕</button>
                </div>}
                <p style={{ fontSize: 11, color: O, fontWeight: 600, letterSpacing: "1px", marginBottom: 14 }}>{f.n}</p>
                <h3 style={{ fontSize: 17, fontWeight: 500, color: CHAR, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: MID, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{f.desc}</p>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
      {/* Guide */}
      <div style={{ background: "#FAFAFA", padding: "72px 32px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>HOW IT WORKS</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: CHAR }}>{c.guideTitle || "使用說明"}</h2>
          </div>
          {(c.guideData?.phases || DEFAULTS.appContent.guideData.phases).map(phase => (
            <div key={phase.id} style={{ marginBottom: 52 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: `2px solid ${phase.isSetup ? BORDER : O2}` }}>
                <span style={{ background: phase.isSetup ? CHAR : O, color: WHITE, fontSize: 11, fontWeight: 700, padding: "3px 12px", letterSpacing: "0.5px" }}>{phase.label}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: CHAR }}>{phase.sub}</span>
                {phase.isSetup && <span style={{ fontSize: 11, color: LIGHT, background: GRAY, padding: "2px 10px", borderRadius: 20 }}>設定一次，長期沿用</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
                {phase.steps.map((step, si) => (
                  <Reveal key={step.id} delay={Math.min(si * 80, 400)}>
                  <div style={{ background: phase.isSetup ? O2 : WHITE, border: `1px solid ${phase.isSetup ? "rgba(200,90,20,.18)" : BORDER}`, borderRadius: 10, padding: "20px 20px 22px", boxShadow: "0 2px 8px rgba(0,0,0,.05)", transition: "box-shadow .2s,transform .2s" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(200,90,20,.11)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <p style={{ fontSize: 10, color: O, fontWeight: 700, letterSpacing: "2px", marginBottom: 8 }}>STEP {step.num}</p>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: CHAR, marginBottom: 7, lineHeight: 1.45 }}>{step.title}</h4>
                    <p style={{ fontSize: 12, color: MID, lineHeight: 1.8 }}>{step.body}</p>
                    {step.bullets?.length > 0 && (
                      <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                        {step.bullets.map((b, bi) => (
                          <li key={bi} style={{ fontSize: 12, color: MID, display: "flex", alignItems: "flex-start", gap: 6, lineHeight: 1.7 }}>
                            <span style={{ color: O, fontWeight: 700, flexShrink: 0 }}>·</span><span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
          <div style={{ background: O2, borderLeft: `3px solid ${O}`, borderRadius: "0 10px 10px 0", padding: "18px 22px", marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: O, letterSpacing: "1px", marginBottom: 5 }}>資料保存</p>
            <p style={{ fontSize: 13, color: CHAR, lineHeight: 1.85 }}>{c.guideData?.dataNote || DEFAULTS.appContent.guideData.dataNote}</p>
          </div>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>FAQ</p>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: CHAR }}>常見問題</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
            {(c.guideData?.faqs || DEFAULTS.appContent.guideData.faqs).map(faq => (
              <div key={faq.id} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "18px 20px" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: CHAR, marginBottom: 7, lineHeight: 1.5 }}>Q：{faq.q}</p>
                <p style={{ fontSize: 12, color: MID, lineHeight: 1.85 }}>A：{faq.a}</p>
              </div>
            ))}
          </div>
          {isAdmin && (
            <div style={{ marginTop: 36, textAlign: "right" }}>
              {!editGuide && <button className="pg" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => { setTmpGuide({ title: c.guideTitle || "", json: JSON.stringify(c.guideData || DEFAULTS.appContent.guideData, null, 2) }); setEditGuide(true); }}>編輯使用說明</button>}
              {editGuide && (
                <div style={{ background: GRAY, padding: 24, border: `1px solid ${BORDER}`, textAlign: "left", marginTop: 16 }}>
                  <p style={{ fontSize: 11, color: MID, marginBottom: 16, letterSpacing: "1px" }}>編輯使用說明</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>標題</p><input value={tmpGuide.title} onChange={e => setTmpGuide(p => ({ ...p, title: e.target.value }))} /></div>
                    <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>內容資料（JSON）</p><textarea value={tmpGuide.json} onChange={e => setTmpGuide(p => ({ ...p, json: e.target.value }))} style={{ minHeight: 360, fontFamily: "monospace", fontSize: 11 }} /></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button className="pb" onClick={() => { try { upd({ guideTitle: tmpGuide.title, guideData: JSON.parse(tmpGuide.json) }); setEditGuide(false); } catch { alert("JSON 格式有誤，請確認後再儲存"); } }}>儲存</button>
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
            <p className="section-label" style={{ marginBottom: 12 }}>PRICING</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: CHAR }}>方案與費用</h2>
            {editNote ? (
              <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
                <input value={tmpNote} onChange={e => setTmpNote(e.target.value)} style={{ maxWidth: 340 }} />
                <button className="pb" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => { upd({ pricingNote: tmpNote }); setEditNote(false); }}>存</button>
                <button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => setEditNote(false)}>✕</button>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: MID, marginTop: 10 }}>
                {c.pricingNote}
                {isAdmin && <span onClick={() => { setTmpNote(c.pricingNote); setEditNote(true); }} style={{ fontSize: 11, color: O, cursor: "pointer", marginLeft: 8 }}>編輯</span>}
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
              <p style={{ fontSize: 11, color: MID, marginBottom: 12, marginTop: 4, letterSpacing: ".5px" }}>── 詳情頁內容 ──</p>
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
              <div key={p.id || i} style={{ background: p.highlight ? O : WHITE, border: `2px solid ${p.highlight ? O : BORDER}`, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", padding: "36px 28px", position: "relative", transition: "box-shadow .24s, transform .24s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,90,20,.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
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
                >了解更多 →</button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: LIGHT, marginTop: 20 }}>已有帳號？<a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ color: O }}>直接登入</a></p>
        </div>
        {!isAdmin && (
          <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", background: "rgba(248,248,248,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: O }}>COMING SOON</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: CHAR, lineHeight: 1.3 }}>訂閱方案即將開放</p>
            <p style={{ fontSize: 14, color: MID }}>預計 7 月下旬上市，敬請期待</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── NEW: 免費資源 ──
function Resources({ resources, setResources, isAdmin }) {
  const types = ["全部", "模板", "教學", "工具", "其他"];
  const [filter, setFilter] = useState("全部");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "模板", desc: "", url: "", img: "", active: true });
  const [resUrlErr, setResUrlErr] = useState("");
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const items = resources || [];
  const filtered = items.filter(r => r.active && (filter === "全部" || r.type === filter));
  const startAdd = () => { setForm({ name: "", type: "模板", desc: "", url: "", img: "", active: true }); setEditing("new"); setResUrlErr(""); };
  const startEdit = r => { setForm({ ...r }); setEditing(r.id); setResUrlErr(""); };
  const save = () => {
    if (form.url && !isValidUrl(form.url)) { setResUrlErr("連結格式不正確，需以 https:// 開頭"); return; }
    setResUrlErr("");
    if (editing === "new") setResources(prev => [...(prev || []), { ...form, id: Date.now() }]); else setResources(prev => (prev || []).map(r => r.id === editing ? { ...r, ...form } : r)); setEditing(null);
  };
  const del = id => { if (confirm("確定刪除？")) setResources(prev => (prev || []).filter(r => r.id !== id)); };
  return (
    <div>
      <div style={{ background: GRAD, padding: "52px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 10 }}>FREE RESOURCES</p>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: CHAR }}>免費資源</h1>
            <p style={{ fontSize: 13, color: MID, marginTop: 8 }}>模板、工具與教學，幫你更有效管理財務</p>
          </div>
          {isAdmin && <button className="pb" onClick={startAdd}>＋ 新增</button>}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px" }} className="page-wrap">
        {editing && (
          <div style={{ background: GRAY, padding: "32px", marginBottom: 40, border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 11, color: MID, letterSpacing: "1px", marginBottom: 20 }}>{editing === "new" ? "新增資源" : "編輯資源"}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="grid2">
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>名稱</p><input value={form.name} onChange={sf("name")} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>類型</p><select value={form.type} onChange={sf("type")} style={{ border: "1px solid #D0D5DA", padding: "10px 12px", background: WHITE, width: "100%" }}>{["模板","教學","工具","其他"].map(t => <option key={t}>{t}</option>)}</select></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>連結</p><input value={form.url} onChange={e => { sf("url")(e); setResUrlErr(""); }} placeholder="https://..." />{resUrlErr && <p style={{ fontSize: 11, color: "#C0392B", marginTop: 4 }}>{resUrlErr}</p>}</div>
            </div>
            <div style={{ marginBottom: 20 }}><ImgUploader label="圖片（選填）" value={form.img} onChange={v => setForm(p => ({ ...p, img: v }))} aspect="16/9" /></div>
            <div style={{ marginBottom: 16 }}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>說明</p><textarea value={form.desc} onChange={sf("desc")} style={{ minHeight: 80, border: "1px solid #D0D5DA", padding: "10px", background: WHITE }} /></div>
            <label style={{ fontSize: 12, color: MID, display: "flex", gap: 8, alignItems: "center", marginBottom: 24, cursor: "pointer" }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} style={{ width: "auto" }} />上架顯示
            </label>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.name.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 36 }}>
          {types.map(t => <span key={t} onClick={() => setFilter(t)} style={{ fontSize: 12, padding: "8px 16px", cursor: "pointer", background: filter === t ? CORAL : GRAY, color: filter === t ? WHITE : MID, transition: "background .15s" }}>{t}</span>)}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 14, color: LIGHT, lineHeight: 2.4 }}>還沒有資源<br /><span style={{ fontSize: 12 }}>資源整理好後會放在這裡</span></p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }} className="grid3">
            {filtered.map((r, ri) => (
              <Reveal key={r.id} delay={Math.min(ri * 80, 400)}>
              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", transition: "box-shadow .24s, transform .24s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,90,20,.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {r.img && <div style={{ height: 160, overflow: "hidden", background: GRAY }}><img src={r.img} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /></div>}
                <div style={{ padding: "22px 24px 24px" }}>
                  <span className="tag" style={{ marginBottom: 10, display: "inline-block" }}>{r.type}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 500, color: CHAR, marginBottom: 8 }}>{r.name}</h3>
                  <p style={{ fontSize: 13, color: MID, lineHeight: 1.85, marginBottom: 18, whiteSpace: "pre-wrap" }}>{r.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={() => setResources(prev => (prev || []).map(x => x.id === r.id ? { ...x, clicks: (x.clicks || 0) + 1 } : x), { silent: true })}><button className="pb" style={{ fontSize: 12, padding: "8px 16px" }}>下載 / 查看 →</button></a>}
                      <span style={{ fontSize: 11, color: LIGHT }}>{r.clicks || 0} 次點擊</span>
                    </div>
                    {isAdmin && <div style={{ display: "flex", gap: 8 }}>
                      <button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => startEdit(r)}>編輯</button>
                      <button className="pg" style={{ fontSize: 11, padding: "5px 10px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => del(r.id)}>刪除</button>
                    </div>}
                  </div>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        )}
        {isAdmin && items.filter(r => !r.active).length > 0 && (
          <div style={{ marginTop: 40 }}>
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
      </div>
    </div>
  );
}

// ── NEW: 電子報訂閱 ──
function Newsletter({ newsletter, setNewsletter, isAdmin, articles, setArticles, setId, setPage }) {
  const [editMode, setEditMode] = useState(false);
  const [tmp, setTmp] = useState(newsletter || DEFAULTS.newsletter);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const info = newsletter || DEFAULTS.newsletter;
  const save = () => { setNewsletter(tmp); setEditMode(false); };
  const recent = [...(articles || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const open = id => { setArticles(prev => { const next = prev.map(a => a.id === id ? { ...a, views: (a.views || 0) + 1 } : a); fbSet("articles", next); return next; }); setId(id); setPage("article"); window.scrollTo({ top: 0, behavior: "instant" }); const a = (articles || []).find(x => x.id === id); history.pushState({}, "", "?article=" + (a?.slug || id)); };
  const handleSubscribe = async () => {
    if (!email) return;
    try { await fbSet("subscribers_" + Date.now(), email); } catch { }
    setSubmitted(true);
  };
  if (editMode) return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 32px" }} className="page-wrap">
      <button className="pg" onClick={() => setEditMode(false)} style={{ marginBottom: 32 }}>← 取消</button>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>訂閱人數文字</p><input value={tmp.subscriberCount || ""} onChange={e => setTmp(p => ({ ...p, subscriberCount: e.target.value }))} placeholder="1,000+" /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>介紹文字</p><textarea value={tmp.intro || ""} onChange={e => setTmp(p => ({ ...p, intro: e.target.value }))} style={{ minHeight: 100 }} /></div>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>備註</p><input value={tmp.archiveNote || ""} onChange={e => setTmp(p => ({ ...p, archiveNote: e.target.value }))} /></div>
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
            <span style={{ fontSize: 12, color: O, fontWeight: 500 }}>{info.subscriberCount} 位讀者</span>
          </div>
          <h1 className="hero-stagger hs-2" style={{ fontSize: 42, fontWeight: 700, color: CHAR, lineHeight: 1.25, marginBottom: 16 }}>88La<br /><span style={{ color: O }}>理財週報</span></h1>
          <p className="hero-stagger hs-3" style={{ fontSize: 16, color: MID, lineHeight: 1.9, marginBottom: 32, maxWidth: 460, whiteSpace: "pre-wrap" }}>{info.intro}</p>
          {submitted ? (
            <div style={{ background: O2, border: `1px solid ${O}30`, padding: "20px 24px" }}>
              <p style={{ fontSize: 14, color: O, fontWeight: 500 }}>感謝訂閱！</p>
              <p style={{ fontSize: 13, color: MID, marginTop: 6 }}>我們會在下期發刊時通知你。</p>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 0, maxWidth: 420 }}>
              <input type="email" placeholder="你的 Email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubscribe()} style={{ flex: 1, borderBottom: "none", border: `1px solid #D0D5DA`, padding: "12px 16px", fontSize: 14, background: WHITE }} />
              <button className="pb" style={{ padding: "12px 22px", fontSize: 13, flexShrink: 0 }} onClick={handleSubscribe} disabled={!email}>訂閱</button>
            </div>
          )}
          <p style={{ fontSize: 11, color: LIGHT, marginTop: 10 }}>{info.archiveNote}</p>
        </div>
      </div>
      {recent.length > 0 && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px" }} className="page-wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div><p className="section-label" style={{ marginBottom: 8 }}>RECENT ISSUES</p><h2 style={{ fontSize: 22, fontWeight: 700, color: CHAR }}>最新文章</h2></div>
            <span onClick={() => setPage("home")} style={{ fontSize: 13, color: O, cursor: "pointer" }}>查看全部 →</span>
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
                <span style={{ fontSize: 12, color: O, fontWeight: 500, flexShrink: 0 }}>閱讀 →</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── NEW: 合作洽談 ──
function Contact({ links, contactContent, setContactContent, isAdmin }) {
  const l = links || DEFAULTS.links;
  const c = contactContent || DEFAULTS.contactContent;
  const [editIntro, setEditIntro] = useState(false);
  const [tmpIntro, setTmpIntro] = useState(c.intro);
  const [form, setForm] = useState({ name: "", company: "", type: "", message: "", email: "" });
  const [submitted, setSubmitted] = useState(false);
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const submit = () => {
    if (!form.name || !form.message || !form.email) return;
    const subject = `合作申請 - ${form.type || "一般洽詢"}`;
    const body = `姓名：${form.name}\n公司：${form.company}\nEmail：${form.email}\n合作類型：${form.type}\n\n${form.message}`;
    window.open(`mailto:${l.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setSubmitted(true);
  };
  return (
    <div>
      <div style={{ background: GRAD, padding: "52px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 10 }}>CONTACT</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: CHAR }}>合作洽談</h1>
          <p style={{ fontSize: 13, color: MID, marginTop: 8 }}>品牌合作、課程邀請、媒體採訪，歡迎來信</p>
        </div>
      </div>
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
                <p style={{ fontSize: 18, fontWeight: 500, color: CHAR, marginBottom: 8 }}>訊息已送出</p>
                <p style={{ fontSize: 14, color: MID }}>感謝你的來信，我會盡快回覆。</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="grid2">
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>姓名 / 稱呼 *</p><input value={form.name} onChange={sf("name")} /></div>
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>公司 / 品牌（選填）</p><input value={form.company} onChange={sf("company")} /></div>
              </div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>Email *</p><input type="email" value={form.email} onChange={sf("email")} /></div>
              <div>
                <p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>合作類型</p>
                <select value={form.type} onChange={sf("type")} style={{ border: "1px solid #D0D5DA", padding: "10px 12px", background: WHITE, width: "100%" }}>
                  <option value="">請選擇</option>
                  {["品牌贊助","內容合作","講座/課程","媒體採訪","其他"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>合作說明 *</p><textarea placeholder="請簡單描述合作方向⋯" value={form.message} onChange={sf("message")} style={{ minHeight: 120, border: "none", background: GRAY, padding: "12px 14px", borderBottom: `1px solid #D0D5DA` }} /></div>
              <button className="pb" onClick={submit} disabled={!form.name || !form.message || !form.email} style={{ alignSelf: "flex-start", padding: "13px 32px" }}>送出合作申請</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 方案說明 ──
function PricingPage({ appContent, setPage }) {
  const c = appContent || DEFAULTS.appContent;
  const plans = c.plans || [];

  const ALL_FEATURES = [
    "即時記帳（情緒、類別、分期）",
    "Google Sheets 雲端同步，資料永遠屬於你",
    "CSV / PDF 匯出",
    "月度智慧診斷分析",
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
          <p style={{ fontSize: 15, color: MID, lineHeight: 1.9, maxWidth: 520 }}>{c.pricingNote || "選擇適合你的方案，開始掌握每一筆錢"}</p>
        </div>
      </div>
      <div style={{ background: GRAY, padding: "72px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(plans.length, 2)}, 1fr)`, gap: 24 }} className="grid2">
            {plans.map(plan => (
              <div key={plan.id} style={{ background: plan.highlight ? O : WHITE, border: `2px solid ${plan.highlight ? O : BORDER}`, borderRadius: 16, padding: "40px 32px", position: "relative", boxShadow: plan.highlight ? "0 8px 40px rgba(200,90,20,.22)" : "0 2px 16px rgba(0,0,0,.06)", transition: "transform .24s, box-shadow .24s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = plan.highlight ? "0 16px 48px rgba(200,90,20,.32)" : "0 12px 40px rgba(0,0,0,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = plan.highlight ? "0 8px 40px rgba(200,90,20,.22)" : "0 2px 16px rgba(0,0,0,.06)"; }}
              >
                {plan.badge && <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: CHAR, color: WHITE, fontSize: 11, padding: "4px 14px", borderRadius: 20, letterSpacing: ".5px", fontWeight: 500, whiteSpace: "nowrap" }}>{plan.badge}</span>}
                <p style={{ fontSize: 12, letterSpacing: "1.5px", color: plan.highlight ? "rgba(255,255,255,.6)" : MID, marginBottom: 12, fontWeight: 500 }}>{(plan.name || "").toUpperCase()}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 32, flexWrap: "nowrap" }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: plan.highlight ? WHITE : CHAR, whiteSpace: "nowrap" }}>{plan.price}</span>
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
                <a href={APP_URL} target="_blank" rel="noopener noreferrer">
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

// ── 服務條款 ──
function TermsPage() {
  const NUMERALS = ["一", "二", "三", "四", "五", "六", "七"];
  const SECTIONS = [
    {
      title: "服務說明",
      content: `88La 理財導航器（以下簡稱「本服務」）由 88La 提供，為個人理財記帳管理工具，提供收支記錄、預算規劃及桌面快速記帳等功能。本服務以訂閱制提供，訂閱期間內可無限制使用所有功能。`,
    },
    {
      title: "訂閱方案與收費",
      content: `本服務提供以下訂閱方案：\n\n• 月訂閱：NT$129 / 月\n• 年方案：NT$999 / 年\n• 兩年方案：NT$1,899 / 兩年\n\n所有金額均為新台幣計價。付款由綠界科技股份有限公司代為處理，採信用卡定期定額方式進行。`,
    },
    {
      title: "自動續約",
      content: `訂閱方案將於到期日自動續約，並依原方案金額扣款。如不希望續約，請於訂閱到期日前至帳戶設定頁面取消。取消後，服務仍可使用至當期訂閱到期日為止。`,
    },
    {
      title: "退款政策",
      content: `本服務所販售之內容為數位服務，依消費者保護法第 19 條規定，數位內容於開通後不適用七天鑑賞期退換貨規定。\n\n如有特殊情形，請聯繫 everydollars17@gmail.com，由 88La 個案審酌處理。`,
    },
    {
      title: "帳戶與資料",
      content: `用戶須自行保管帳戶登入資訊。用戶的記帳資料儲存於個人 Google 雲端帳號中，訂閱取消後資料仍保留於用戶自己的 Google 試算表，88La 不持有用戶資料。`,
    },
    {
      title: "服務變更",
      content: `88La 保留調整訂閱方案定價及功能內容之權利，並將提前 30 天以電子郵件通知用戶。現有訂閱者不受漲價影響，直至當期訂閱到期。`,
    },
    {
      title: "聯絡方式",
      content: `Email：everydollars17@gmail.com\n官方網站：https://88la-site.vercel.app`,
    },
  ];

  return (
    <div>
      <div style={{ background: GRAD, padding: "52px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 10 }}>LEGAL</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: CHAR, lineHeight: 1.45 }}>88La 理財導航器<br />服務條款與退款政策</h1>
          <p style={{ fontSize: 13, color: MID, marginTop: 10 }}>最後更新：2026 年 7 月</p>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 32px" }} className="page-wrap">
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: CHAR, marginBottom: 14 }}>{NUMERALS[i]}、{s.title}</h2>
              <p style={{ fontSize: 14, color: MID, lineHeight: 2.1, whiteSpace: "pre-wrap" }}>{linkify(s.content)}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 64, padding: "22px 26px", background: GRAY, border: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 12, color: LIGHT, lineHeight: 2 }}>
            使用本服務即代表你已閱讀並同意以上服務條款。<br />
            如對條款有任何疑問，請於訂閱前透過 Email 與我們聯繫。
          </p>
        </div>
      </div>
    </div>
  );
}

// ── 隱私政策 ──
function PrivacyPage() {
  const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一"];
  const SECTIONS = [
    {
      title: "適用範圍",
      content: `本隱私政策適用於 88La 理財自動導航器（官網與網頁應用程式），說明本服務如何處理您於使用過程中提供或產生之個人資料。本政策不適用於本服務以外之外部連結網站，亦不適用於非本服務委託或參與管理之第三方。`,
    },
    {
      title: "我們蒐集的資料",
      content: null,
      subsections: [
        { subtitle: "登入時", text: "本服務採用 Google 帳號登入機制，系統將取得您的電子郵件位址，作為識別您帳號身分之唯一依據。您無需另行設定獨立的帳號密碼。" },
        { subtitle: "使用記帳功能時", text: "您於使用過程中主動輸入之內容，包括每一筆記帳明細（金額、類別、付款方式、備註、消費當下之心情記錄）、月度預算規劃、信用卡與帳戶設定、負債資料，以及理財筆記，皆屬於您所提供之資料範疇。" },
        { subtitle: "付款時", text: "訂閱費用係由綠界科技股份有限公司代為收取，您的信用卡卡號、有效期限等付款資訊將直接於綠界之付款頁面輸入，88La 不會接觸、亦不會儲存任何與您的付款工具相關之資訊。本服務僅會收到付款是否成功之通知，以憑此開通您的訂閱權限。" },
        { subtitle: "瀏覽網站時（自動蒐集）", text: "本服務官網使用 Vercel Web Analytics 統計流量，此工具不使用第三方 cookie，而是以傳入請求產生的雜湊值識別訪客，所記錄之資料皆為匿名性質，不會與任何個人、客戶或 IP 位址綁定或關聯，相關瀏覽紀錄亦不會永久保存，將於 24 小時後自動清除。我們僅藉此瞭解整體網站使用狀況（如頁面瀏覽量），不會用來識別您的個人身分。" },
      ],
    },
    {
      title: "未成年使用者",
      content: `本服務之受眾可能包含未滿 18 歲之學生族群。若您未滿 18 歲，建議於監護人知悉並同意之情況下使用本服務。若您是未滿 18 歲使用者之監護人，並認為您的子女未經同意提供了個人資料，請透過第七條所列聯絡方式與我們聯繫，我們將協助處理相關資料之刪除或更正事宜。`,
    },
    {
      title: "資料儲存之處所",
      content: null,
      table: [
        ["記帳明細、預算、筆記", "您個人之 Google 試算表", "登入後，系統將自動於您的 Google 雲端硬碟建立專屬檔案，相關資料即時寫入其中"],
        ["帳號狀態、到期日、帳戶與信用卡及負債設定", "Firebase（本服務之後端資料庫）", "用於驗證您訂閱之有效性，並儲存您的個人化功能設定"],
        ["最近一次驗證之時間戳記", "您裝置之本機儲存空間（localStorage）", "僅用於判斷離線狀態下之暫時可用性，不含任何記帳內容"],
        ["匿名瀏覽統計", "Vercel Web Analytics", "不可識別個人身分，24 小時後自動清除"],
      ],
      afterTable: `換言之，您的記帳流水帳實際上是存放於「您個人」之 Google 雲端硬碟內，而非本服務之伺服器。即便本服務有朝一日終止運作，該份試算表仍歸屬於您本人，您可隨時開啟、複製或刪除。`,
    },
    {
      title: "資料之存取權限",
      content: null,
      bullets: [
        "您的記帳明細存放於您個人之 Google 試算表中，僅您本人得以查閱，本服務不具備、亦未申請主動讀取或瀏覽該試算表內容之權限",
        "本服務所申請之 Google 授權範圍，僅限於「本應用程式所建立之檔案」（技術上稱為 drive.file），絕不涉及您 Google 雲端硬碟中既有之其他檔案",
        "帳號狀態與設定資料存放於 Firebase，僅供系統驗證訂閱狀態之用，本服務不會將其提供、洩露或出售予任何第三方",
        "金流相關資訊由綠界科技依其自身隱私規範處理，本服務全程不接觸您的付款資料",
      ],
      afterBullets: `本服務承諾，絕不將您的資料出售予廣告主，亦不會將您的記帳內容用於任何行銷分析或對外提供。`,
    },
    {
      title: "資料之運用目的",
      content: null,
      bullets: [
        "呈現您的記帳記錄、預算對比分析、月度診斷報告等您主動使用之功能",
        "驗證您的訂閱是否仍屬有效期間",
        "於您與客服聯繫時，協助核對您的帳號狀況",
        "透過匿名流量統計瞭解網站整體使用狀況，藉以優化服務內容",
      ],
      afterBullets: `凡未經您同意或非屬您主動使用之功能範疇，本服務絕不擅自運用您的資料，例如分析您的消費習慣以投放廣告。`,
    },
    {
      title: "資料安全與外洩通知",
      content: `本服務已採取合理之技術與管理措施，保護您的資料免於未經授權之存取、使用或揭露。惟若不幸發生資料安全事件（例如後端系統遭未經授權存取），本服務將於知悉後之合理期限內，透過您註冊時所使用之電子郵件通知您，並說明事件性質、可能受影響之資料範圍，以及本服務已採取或將採取之應變措施。`,
    },
    {
      title: "資料保留期限",
      content: null,
      bullets: [
        "訂閱使用期間，資料持續妥善保存",
        "訂閱取消或到期後，依本服務之服務條款，資料將保留三十日供您匯出（CSV 或 PDF 格式），逾期後系統可能予以清除",
        "至於存放於您個人 Google 試算表內之資料，縱使本服務端之紀錄遭清除，惟若您未自行刪除，該份試算表仍將留存於您的 Google 雲端硬碟之中",
      ],
    },
    {
      title: "您所享有之權利",
      content: `依個人資料保護法相關規定，您對於本服務所持有之個人資料，得行使下列權利：`,
      bullets: [
        "查詢或請求閱覽",
        "請求製給複製本",
        "請求補充或更正",
        "請求停止蒐集、處理或利用",
        "請求刪除",
      ],
      afterBullets: `您可隨時匯出您完整之記帳資料（CSV 或 PDF 格式），亦可隨時開啟您的 Google 試算表自行查閱、複製或備份原始資料。如欲行使上述權利或取消訂閱，敬請致信 everydollars17@gmail.com 提出申請，我們將於合理期限內處理回覆。`,
    },
    {
      title: "政策之修改",
      content: `本政策內容如有修改，將於本網站公告並更新最後修改日期。重大變更將透過電子郵件另行通知您。`,
    },
    {
      title: "聯絡方式",
      content: `如有任何關於本隱私政策之疑問，敬請致信 everydollars17@gmail.com，我們將竭誠為您回覆。`,
    },
  ];

  return (
    <div>
      <div style={{ background: GRAD, padding: "52px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 10 }}>PRIVACY</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: CHAR, lineHeight: 1.45 }}>88La 理財導航器<br />隱私政策</h1>
          <p style={{ fontSize: 13, color: MID, marginTop: 10 }}>最後更新：2026 年 7 月</p>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 32px" }} className="page-wrap">
        <p style={{ fontSize: 14, color: MID, lineHeight: 2.1, marginBottom: 48 }}>
          88La 由個人創作者獨立營運，我們深知理財記帳涉及您最私密的財務細節，因此特別撰寫此份隱私政策，以清楚說明本服務蒐集何種資料、如何運用、儲存於何處，以及哪些人能夠接觸這些資訊。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: CHAR, marginBottom: 14 }}>{NUMERALS[i]}、{s.title}</h2>
              {s.content && <p style={{ fontSize: 14, color: MID, lineHeight: 2.1, whiteSpace: "pre-wrap" }}>{linkify(s.content)}</p>}
              {s.subsections && s.subsections.map((sub, j) => (
                <div key={j} style={{ marginTop: j === 0 ? 0 : 20, marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: CHAR, marginBottom: 6 }}>【{sub.subtitle}】</p>
                  <p style={{ fontSize: 14, color: MID, lineHeight: 2.1 }}>{sub.text}</p>
                </div>
              ))}
              {s.table && (
                <div style={{ overflowX: "auto", marginTop: 8, marginBottom: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: MID }}>
                    <thead>
                      <tr style={{ background: O2 }}>
                        {["資料類型", "儲存位置", "說明"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: CHAR, borderBottom: `2px solid ${O}`, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.table.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{ padding: "12px 14px", lineHeight: 1.8, verticalAlign: "top" }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {s.afterTable && <p style={{ fontSize: 14, color: MID, lineHeight: 2.1 }}>{linkify(s.afterTable)}</p>}
              {s.bullets && (
                <ul style={{ paddingLeft: 20, margin: s.content ? "12px 0 0" : "0" }}>
                  {s.bullets.map((b, bi) => (
                    <li key={bi} style={{ fontSize: 14, color: MID, lineHeight: 2.1, marginBottom: 4 }}>{b}</li>
                  ))}
                </ul>
              )}
              {s.afterBullets && <p style={{ fontSize: 14, color: MID, lineHeight: 2.1, marginTop: 12 }}>{linkify(s.afterBullets)}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 免責聲明 ──
function DisclaimerPage() {
  const NUMERALS = ["一", "二", "三", "四", "五", "六", "七"];
  const SECTIONS = [
    {
      title: "服務性質聲明",
      content: `88La 理財自動導航器（以下簡稱「本服務」）為個人記帳、支出追蹤與儲蓄習慣建立之輔助工具，其核心功能在於協助使用者記錄日常收支、設定個人預算目標，以及建立規律的儲蓄行為。\n\n本服務所提供之收支診斷報告，係依據使用者自行輸入之數據，結合本服務創作者之個人實務理財經驗所設計之參考框架自動產生。本服務創作者並非持有任何金融相關執照之財務顧問，所有內容均屬個人實務經驗之分享，不構成專業財務顧問服務，亦不涉及任何有價證券、基金、期貨、外匯、加密貨幣或其他金融商品之投資策略建議、推介或勸誘行為。`,
    },
    {
      title: "資訊僅供參考",
      content: `本服務所提供之預算建議、收支診斷分析、儲蓄目標試算及相關數字呈現，均係依據使用者自行輸入之個人資料，結合創作者個人實務理財經驗所設計之參考框架，由系統自動運算後呈現之參考資訊。\n\n診斷報告中所呈現之支出比例建議、預算配置方向等內容，均源自創作者個人實務經驗之歸納，不同使用者之財務狀況、收入結構、家庭背景與生活條件各異，上述建議未必適用於每一位使用者的個別情況。\n\n上述資訊：\n• 係創作者個人實務經驗之分享，不代表對您財務狀況之專業個人化評估\n• 不構成任何具法律效力之財務建議或投資意見\n• 不保證使用本服務後必然達成特定儲蓄金額或財務目標\n• 如您的財務狀況較為複雜（如負債重組、保險規劃、稅務安排等），建議另行諮詢具有合法執照之專業人士`,
    },
    {
      title: "使用者自行負責原則",
      content: `使用者在參考本服務所提供之任何資訊、數據或分析結果後，所作出之一切財務決策，均應由使用者本人獨立評估、審慎判斷，並自行承擔相應之後果與責任。\n\n如需專業之財務規劃建議，建議您諮詢具有合法執照之財務顧問或相關專業人士。`,
    },
    {
      title: "系統資料準確性",
      content: `本服務之所有計算與分析結果，均以使用者自行輸入之資料為基礎。若輸入資料有誤、不完整或未即時更新，系統所呈現之結果可能與您的實際財務狀況有所落差，本服務對此不負任何責任。`,
    },
    {
      title: "服務中斷與資料完整性",
      content: `本服務係透過網際網路提供，可能因伺服器維護、網路異常、第三方服務（包括 Google、Firebase、綠界科技等）故障，或其他不可抗力因素，導致服務暫時中斷或資料暫時無法存取。本服務對上述情形所造成之不便，不負任何賠償責任，但將盡合理努力維持服務之穩定運行。`,
    },
    {
      title: "本聲明之修改",
      content: `本服務得隨時修訂本免責聲明，修訂後之內容將公告於本頁面並更新修改日期。繼續使用本服務，即視為接受修訂後之條款。`,
    },
    {
      title: "聯絡方式",
      content: `如對本聲明有任何疑問，歡迎透過以下方式與我們聯繫：\n\nEmail：everydollars17@gmail.com\nInstagram：@every_dollars`,
    },
  ];

  return (
    <div>
      <div style={{ background: GRAD, padding: "52px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 10 }}>DISCLAIMER</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: CHAR, lineHeight: 1.45 }}>88La 理財導航器<br />免責聲明</h1>
          <p style={{ fontSize: 13, color: MID, marginTop: 10 }}>最後更新：2026 年 7 月</p>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 32px" }} className="page-wrap">
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: CHAR, marginBottom: 14 }}>{NUMERALS[i]}、{s.title}</h2>
              <p style={{ fontSize: 14, color: MID, lineHeight: 2.1, whiteSpace: "pre-wrap" }}>{linkify(s.content)}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 64, padding: "22px 26px", background: GRAY, border: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 12, color: LIGHT, lineHeight: 2 }}>
            本服務為個人記帳與儲蓄習慣建立工具。診斷報告內容係創作者個人實務理財經驗之分享，僅供參考，不構成專業財務顧問服務或投資建議。使用者應依據自身狀況獨立判斷，並自行承擔相應責任。
          </p>
        </div>
      </div>
    </div>
  );
}

// ── 訂閱方案 ──
function SubscriptionPage({ setPage, isAdmin }) {
  if (!isAdmin) return (
    <div style={{ background: GRAD, minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", textAlign: "center" }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: O, marginBottom: 16 }}>COMING SOON</p>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: CHAR, lineHeight: 1.3, marginBottom: 14 }}>訂閱方案即將開放</h1>
      <p style={{ fontSize: 15, color: MID, lineHeight: 1.9 }}>預計 7 月下旬上市，敬請期待</p>
    </div>
  );
  const PLANS = [
    {
      id: 1,
      name: "月訂閱",
      price: "NT$129",
      period: "/月",
      equiv: null,
      badge: null,
      highlight: false,
      features: ["88La 理財導航器完整功能", "桌面快速記帳", "隨時可取消"],
    },
    {
      id: 2,
      name: "年方案",
      price: "NT$999",
      period: "/年",
      equiv: "相當於 NT$83/月",
      badge: "最多人選擇",
      highlight: true,
      features: ["88La 理財導航器完整功能", "桌面快速記帳", "省下約 35%"],
    },
    {
      id: 3,
      name: "兩年方案",
      price: "NT$1,899",
      period: "/兩年",
      equiv: "相當於 NT$79/月",
      badge: null,
      highlight: false,
      features: ["88La 理財導航器完整功能", "桌面快速記帳", "最划算方案"],
    },
  ];

  return (
    <div>
      <div style={{ background: GRAD, padding: "72px 32px 56px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 10 }}>PRICING</p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: CHAR, lineHeight: 1.3, marginBottom: 14 }}>選擇你的方案</h1>
          <p style={{ fontSize: 15, color: MID, lineHeight: 1.9, maxWidth: 540 }}>
            用 88La 理財導航器，把記帳這件事變成每天兩分鐘的習慣。<br />所有方案皆包含桌面快速記帳功能。
          </p>
        </div>
      </div>

      <div style={{ background: GRAY, padding: "64px 32px 48px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="grid3">
            {PLANS.map(plan => (
              <div key={plan.id} style={{
                background: plan.highlight ? O : WHITE,
                border: `2px solid ${plan.highlight ? O : BORDER}`,
                borderRadius: 12,
                padding: "36px 26px 32px",
                position: "relative",
                boxShadow: plan.highlight ? "0 8px 32px rgba(200,90,20,.2)" : "0 2px 10px rgba(0,0,0,.05)",
                transition: "transform .22s, box-shadow .22s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = plan.highlight ? "0 16px 48px rgba(200,90,20,.28)" : "0 10px 30px rgba(0,0,0,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = plan.highlight ? "0 8px 32px rgba(200,90,20,.2)" : "0 2px 10px rgba(0,0,0,.05)"; }}
              >
                {plan.badge && (
                  <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: CHAR, color: WHITE, fontSize: 11, padding: "3px 14px", borderRadius: 20, letterSpacing: ".5px", fontWeight: 500, whiteSpace: "nowrap" }}>{plan.badge}</span>
                )}
                <p style={{ fontSize: 11, letterSpacing: "1.5px", color: plan.highlight ? "rgba(255,255,255,.6)" : MID, marginBottom: 10, fontWeight: 500 }}>{plan.name.toUpperCase()}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: plan.equiv ? 6 : 28, flexWrap: "nowrap" }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: plan.highlight ? WHITE : CHAR, whiteSpace: "nowrap" }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,.5)" : LIGHT, whiteSpace: "nowrap" }}>{plan.period}</span>
                </div>
                {plan.equiv && (
                  <p style={{ fontSize: 12, color: plan.highlight ? "rgba(255,255,255,.55)" : MID, marginBottom: 24 }}>{plan.equiv}</p>
                )}
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,.88)" : MID, display: "flex", alignItems: "center", gap: 9 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "rgba(255,255,255,.7)" : O} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                  <button style={{ width: "100%", background: plan.highlight ? WHITE : O, color: plan.highlight ? O : WHITE, border: "none", padding: "13px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", borderRadius: 8, transition: "opacity .18s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    立即開始使用 →
                  </button>
                </a>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8 }}>
            {["所有金額均為新台幣計價，含稅", "訂閱將於到期日自動續約，可於到期前至帳戶設定取消", "付款方式：信用卡定期定額（由綠界科技處理）"].map((n, i) => (
              <p key={i} style={{ fontSize: 12, color: MID, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: O, fontWeight: 700, flexShrink: 0 }}>·</span>{n}
              </p>
            ))}
            <p style={{ fontSize: 12, color: MID, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: O, fontWeight: 700, flexShrink: 0 }}>·</span>
              如有疑問，請聯繫 <a href="mailto:everydollars17@gmail.com" style={{ color: O, textDecoration: "underline" }}>everydollars17@gmail.com</a>
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
            <p style={{ fontSize: 12, color: LIGHT, lineHeight: 2.1 }}>
              感謝最早支持 88La 的 90 位創始成員，你們的定價永久保留：月訂閱 NT$109 ／ 年方案 NT$599 ／ 兩年方案 NT$998。此優惠僅適用於已取得創始會員資格之用戶，不開放新申請。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App root ──
export default function App() {
  const [articles, setArticles, aL] = useFS("articles", DEFAULTS.articles);
  const [products, setProducts, pL] = useFS("products", DEFAULTS.products);
  const [igPosts, setIgPosts, iL] = useFS("igPosts", DEFAULTS.igPosts);
  const [goods, setGoods, gL] = useFS("goods", DEFAULTS.goods);
  const [about, setAbout, abL] = useFS("about", DEFAULTS.about);
  const [siteTitle, setSiteTitle, tL] = useFS("siteTitle", DEFAULTS.siteTitle);
  const [tags, setTags, taL] = useFS("tags", DEFAULTS.tags);
  const [links, setLinks, lL] = useFS("links", DEFAULTS.links);
  const [footerTagline, setFooterTagline, ftL] = useFS("footerTagline", DEFAULTS.footerTagline);
  const [resources, setResources, rlL] = useFS("resources", []);
  const [newsletter, setNewsletter, nlL] = useFS("newsletter", DEFAULTS.newsletter);
  const [appContent, setAppContent, acL] = useFS("appContent", DEFAULTS.appContent);
  const [contactContent, setContactContent, ccL] = useFS("contactContent", DEFAULTS.contactContent);
  const [page, setPage] = useState("home");
  const [id, setId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (user) => setIsAdmin(!!user && ADMIN_EMAILS.includes(user.email))), []);
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [page]);

  const loaded = aL && pL && iL && gL && abL && tL && taL && lL && ftL && rlL && nlL && acL && ccL;
  const article = articles.find(a => a.id === id);
  const nav = p => { setPage(p); setId(null); history.pushState({}, "", window.location.pathname); };

  useEffect(() => {
    if (!loaded) return;
    const params = new URLSearchParams(window.location.search);
    const ap = params.get("article");
    if (ap) {
      const a = articles.find(x => x.slug === ap || String(x.id) === ap);
      if (a) { setId(a.id); setPage("article"); }
    }
  }, [loaded]);

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const ap = params.get("article");
      if (ap) {
        const a = articles.find(x => x.slug === ap || String(x.id) === ap);
        if (a) { setId(a.id); setPage("article"); window.scrollTo({ top: 0, behavior: "instant" }); }
      } else { setPage("home"); setId(null); window.scrollTo({ top: 0, behavior: "instant" }); }
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
    if (!gL) return;
    if ((!goods || goods.length === 0) && DEFAULTS.goods.length > 0) {
      setGoods(DEFAULTS.goods, { silent: true });
    }
  }, [gL]);
  const saveArticle = d => {
    const nid = Math.max(...articles.map(a => a.id), 0) + 1;
    const baseSlug = toSlug(d.title);
    const taken = new Set(articles.map(a => a.slug).filter(Boolean));
    let slug = baseSlug, n = 2;
    while (taken.has(slug)) { slug = baseSlug + "-" + n; n++; }
    setArticles(prev => [...prev, { id: nid, slug, ...d, excerpt: d.excerpt || (stripHtml(d.content).slice(0, 80) + "⋯"), views: 0, comments: [], date: new Date().toISOString().slice(0, 10) }]);
    setPage("home");
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
      <Nav page={page} setPage={nav} isAdmin={isAdmin} />
      <div key={page} className="page-anim">
        {page === "home" && <Home articles={articles} setPage={setPage} setId={setId} setArticles={setArticles} isAdmin={isAdmin} siteTitle={siteTitle} setSiteTitle={setSiteTitle} tags={tags} setTags={setTags} about={about} setAbout={setAbout} links={links} />}
        {page === "about" && <About about={about} setAbout={setAbout} isAdmin={isAdmin} links={links} setLinks={setLinks} />}
        {page === "ig" && <IG igPosts={igPosts} setIgPosts={setIgPosts} isAdmin={isAdmin} links={links} />}
        {page === "shop" && <Shop products={products} setProducts={setProducts} isAdmin={isAdmin} />}
        {page === "goods" && <Goods goods={goods} setGoods={setGoods} isAdmin={isAdmin} />}
        {page === "app" && <AppPage appContent={appContent} setAppContent={setAppContent} isAdmin={isAdmin} />}
        {page === "resources" && <Resources resources={resources} setResources={setResources} isAdmin={isAdmin} />}
        {page === "newsletter" && <Newsletter newsletter={newsletter} setNewsletter={setNewsletter} isAdmin={isAdmin} articles={articles} setArticles={setArticles} setId={setId} setPage={nav} />}
        {page === "contact" && <Contact links={links} contactContent={contactContent} setContactContent={setContactContent} isAdmin={isAdmin} />}
        {page === "plans" && <PricingPage appContent={appContent} setPage={nav} />}
        {page === "pricing" && <SubscriptionPage setPage={nav} isAdmin={isAdmin} />}
        {page === "terms" && <TermsPage />}
        {page === "privacy" && <PrivacyPage />}
        {page === "disclaimer" && <DisclaimerPage />}
        {page === "article" && article && <Article article={article} onBack={() => nav("home")} setArticles={setArticles} isAdmin={isAdmin} tags={tags} links={links} setPage={nav} products={products} resources={resources} />}
        {page === "write" && isAdmin && <Write onSave={saveArticle} onBack={() => nav("home")} tags={tags} products={products} resources={resources} />}
      </div>
      <Footer links={links} footerTagline={footerTagline} setFooterTagline={setFooterTagline} isAdmin={isAdmin} setPage={nav} />
    </div>
  );
}
