import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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

const ADMIN_PW = "everydollars88";
const APP_URL = "https://88la-finance.vercel.app";

const O = "#C85A14";
const O2 = "#FDF0E8";
const NAVY = "#F19483";
const NAVY2 = "#E8806E";
const NAV_TEXT = "#3D1A0A";
const NAV_TEXT_SUB = "rgba(61,26,10,.55)";
const WHITE = "#FFFFFF";
const GRAY = "#F8F8F8";
const CHAR = "#1A1A1A";
const MID = "#6B6B6B";
const LIGHT = "#ADADAD";
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
.pbn{background:${NAVY};color:#fff;padding:12px 28px;font-size:13px;font-weight:500;letter-spacing:.5px;border-radius:8px;transition:background .18s,box-shadow .18s;}
.pbn:hover{background:${NAVY2};box-shadow:0 4px 16px rgba(200,90,20,.2);}
.pg{background:transparent;border:1px solid #D0D5DA;padding:11px 24px;font-size:13px;color:${MID};border-radius:8px;transition:border-color .18s,color .18s,box-shadow .18s;cursor:pointer;}
.pg:hover{border-color:${O};color:${O};box-shadow:0 2px 10px rgba(200,90,20,.1);}
.tag{display:inline-block;background:${O2};color:${O};font-size:11px;padding:3px 10px;letter-spacing:.5px;font-weight:500;}
.tagn{display:inline-block;background:${NAVY};color:#fff;font-size:11px;padding:3px 10px;letter-spacing:.5px;font-weight:500;}
.ordbtn{background:transparent;border:1px solid #D0D5DA;color:${LIGHT};font-size:11px;padding:2px 6px;line-height:1;cursor:pointer;}
.ordbtn:hover{border-color:${O};color:${O};}
.card{background:${WHITE};border:1px solid ${BORDER};border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.06);transition:box-shadow .24s,transform .24s;cursor:pointer;overflow:hidden;}
.card:hover{box-shadow:0 12px 40px rgba(200,90,20,.15);transform:translateY(-4px);}
.section-label{font-size:11px;letter-spacing:3px;color:${O};font-weight:500;text-transform:uppercase;}
.hero-pattern{
  background-color:${O2};
  background-image:radial-gradient(${NAVY}60 1.5px,transparent 1.5px);
  background-size:28px 28px;
}
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-anim { animation: pageEnter 0.32s cubic-bezier(0.16,1,0.3,1); }
.mob-tab-bar{
  display:none;position:fixed;bottom:0;left:0;right:0;
  height:60px;background:${WHITE};border-top:1px solid ${BORDER};
  z-index:90;align-items:stretch;
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
}
@media(min-width:769px){
  .mob-menu{display:none!important;}
  .mob-panel{display:none!important;}
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
  goods: [],
  tags: DEFAULT_TAGS,
  resources: [],
  newsletter: { subscriberCount: "1,000+", intro: "每週一篇理財觀念，寫給想讓錢更有意義的你。不說廢話，只寫真實心得。", archiveNote: "隨時取消訂閱，沒有壓力。" },
  appContent: {
    heroTitle: "記帳 App，讓你真的",
    heroHighlight: "存到錢",
    heroSub: "雲端同步 Google Sheets，智慧診斷消費模式，支援家庭記帳。不只記帳，更幫你看懂錢的流向。",
    pricingNote: "選擇適合你的方案，開始掌握每一筆錢",
    features: [
      { id: 1, n: "01", title: "即時記帳", desc: "一秒記下每筆花費，情緒、類別、帳戶、分期全部記錄。", img: "" },
      { id: 2, n: "02", title: "雲端同步", desc: "資料存在你自己的 Google Sheets，永遠不鎖在 App 裡。", img: "" },
      { id: 3, n: "03", title: "智慧診斷", desc: "月底自動分析消費模式，對比上月找出節流點。", img: "" },
      { id: 4, n: "04", title: "負債追蹤", desc: "定額或不定額還款進度，信用卡分期一目瞭然。", img: "" },
      { id: 5, n: "05", title: "家庭模式", desc: "個人、公費、家庭三種模式獨立管理，互不干擾。", img: "" },
      { id: 6, n: "06", title: "PWA 支援", desc: "加到主畫面，iOS / Android 體驗接近原生 App。", img: "" },
    ],
    plans: [
      { id: 1, name: "1 年方案", price: "NT$ 999", period: "/年", highlight: false, badge: "", features: ["全功能存取", "Google Sheets 同步", "CSV/PDF 匯出", "智慧診斷分析"], detailTitle: "", detailImg: "", detailContent: "" },
      { id: 2, name: "3 年方案", price: "NT$ 2,199", period: "/3年", highlight: true, badge: "最超值", features: ["全功能存取", "Google Sheets 同步", "CSV/PDF 匯出", "智慧診斷分析", "平均每年省下更多"], detailTitle: "", detailImg: "", detailContent: "" },
    ],
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
  const set = async fn => { const n = typeof fn === "function" ? fn(v) : fn; setV(n); await fbSet(key, n); };
  return [v, set, loaded];
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

// ── SVG icons for mobile tab bar ──
const IcUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcIG   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/></svg>;
const IcRes  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IcApp  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>;
const IcShop = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;

const MOBILE_TABS = [["home","文章",IcUser],["ig","最新消息",IcIG],["resources","資源",IcRes],["app","App",IcApp],["shop","商品",IcShop]];
const NAV = [["home","文章"],["about","關於我"],["ig","最新消息"],["resources","資源分享"],["app","記帳 Web App"],["shop","商品"],["goods","推薦好物"]];

// ── Nav ──
function Nav({ page, setPage, isAdmin, setIsAdmin }) {
  const [showL, setShowL] = useState(false);
  const [pw, setPw] = useState(""); const [err, setErr] = useState(false);
  const [mob, setMob] = useState(false);
  const login = () => { if (pw === ADMIN_PW) { setIsAdmin(true); setShowL(false); setPw(""); setErr(false); } else setErr(true); };
  const go = p => { setPage(p); setMob(false); };
  return (
    <>
      <style>{css}</style>
      <header style={{ background: O, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span onClick={() => go("home")} style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 16, letterSpacing: "2px", color: WHITE, cursor: "pointer", flexShrink: 0 }}>88La</span>
          <nav className="nav-links" style={{ display: "flex", gap: 22, alignItems: "center" }}>
            {NAV.map(([k, l]) => (
              <span key={k} onClick={() => go(k)} style={{ fontSize: 12, letterSpacing: ".8px", color: page === k ? WHITE : "rgba(255,255,255,.7)", cursor: "pointer", fontWeight: page === k ? "700" : "400", borderBottom: page === k ? `2px solid ${WHITE}` : "2px solid transparent", paddingBottom: 2, transition: "color .15s" }}>{l}</span>
            ))}
            {isAdmin
              ? <><span onClick={() => go("write")} style={{ fontSize: 12, color: WHITE, cursor: "pointer", letterSpacing: ".5px" }}>＋ 撰文</span><span onClick={() => setIsAdmin(false)} style={{ fontSize: 11, color: "rgba(255,255,255,.5)", cursor: "pointer", marginLeft: 6 }}>登出</span></>
              : <span onClick={() => setShowL(true)} style={{ fontSize: 11, color: "rgba(255,255,255,.5)", cursor: "pointer" }}>後台</span>
            }
          </nav>
          <button className="mob-menu" onClick={() => setMob(p => !p)} style={{ background: "none", border: "none", color: WHITE, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center" }}>
            {mob ? "✕" : "☰"}
          </button>
        </div>
        {mob && (
          <div className="mob-panel" style={{ background: CHAR, display: "flex", flexDirection: "column" }}>
            {NAV.map(([k, l]) => (
              <span key={k} onClick={() => go(k)} style={{ fontSize: 15, padding: "15px 24px", borderBottom: `1px solid rgba(255,255,255,.08)`, color: page === k ? O : "rgba(255,255,255,.85)", cursor: "pointer", fontWeight: page === k ? "600" : "400" }}>{l}</span>
            ))}
            {isAdmin
              ? <><span onClick={() => go("write")} style={{ fontSize: 15, padding: "15px 24px", borderBottom: `1px solid rgba(255,255,255,.08)`, color: O, cursor: "pointer" }}>＋ 撰文</span><span onClick={() => { setIsAdmin(false); setMob(false); }} style={{ fontSize: 13, padding: "13px 24px", color: "rgba(255,255,255,.4)", cursor: "pointer" }}>登出</span></>
              : <span onClick={() => { setShowL(true); setMob(false); }} style={{ fontSize: 13, padding: "13px 24px", color: "rgba(255,255,255,.4)", cursor: "pointer" }}>後台登入</span>
            }
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
          <div style={{ background: WHITE, padding: 40, width: "100%", maxWidth: 360 }}>
            <p style={{ fontSize: 13, letterSpacing: "2px", color: NAVY2, marginBottom: 24, fontWeight: 500 }}>後台登入</p>
            <input type="password" placeholder="密碼" value={pw} onChange={e => { setPw(e.target.value); setErr(false); }} onKeyDown={e => e.key === "Enter" && login()} style={{ marginBottom: 20, fontSize: 15 }} />
            {err && <p style={{ fontSize: 12, color: "#C0392B", marginBottom: 12 }}>密碼錯誤</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="pb" style={{ flex: 1 }} onClick={login}>登入</button>
              <button className="pg" onClick={() => { setShowL(false); setPw(""); setErr(false); }}>取消</button>
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
    <footer style={{ background: CHAR, padding: "40px 32px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <p style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14, letterSpacing: "2px", color: WHITE }}>88La</p>
          {editing ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={tmp} onChange={e => setTmp(e.target.value)} style={{ fontSize: 12, color: WHITE, borderBottom: `1px solid rgba(255,255,255,.3)`, background: "transparent", width: 240, padding: "2px 0" }} />
              <button onClick={save} style={{ background: O, color: WHITE, border: "none", padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>儲存</button>
              <button onClick={() => setEditing(false)} style={{ background: "transparent", color: "rgba(255,255,255,.5)", border: `1px solid rgba(255,255,255,.25)`, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>取消</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>{footerTagline || DEFAULTS.footerTagline}</p>
              {isAdmin && <span onClick={() => { setTmp(footerTagline || DEFAULTS.footerTagline); setEditing(true); }} style={{ fontSize: 11, color: "rgba(255,255,255,.35)", cursor: "pointer", textDecoration: "underline" }}>編輯</span>}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[[l.lineOfficial, "LINE"], [l.instagram, "Instagram"], ["mailto:" + l.email, "Email"]].map(([h, label]) => (
            <a key={label} href={h} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "rgba(255,255,255,.6)", fontWeight: 400, transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = WHITE} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}>{label}</a>
          ))}
          {setPage && <><span onClick={() => setPage("newsletter")} style={{ fontSize: 12, color: "rgba(255,255,255,.6)", cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = WHITE} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}>電子報</span><span onClick={() => setPage("contact")} style={{ fontSize: 12, color: "rgba(255,255,255,.6)", cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = WHITE} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}>合作洽談</span></>}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "12px auto 0", paddingTop: 14, borderTop: `1px solid rgba(255,255,255,.1)`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>© 2026 88La · every_dollars</p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>LINE：@367xhgyr</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{l.email}</span>
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
  const save = () => { setAbout(tmp); setEditBanner(false); };
  if (editBanner) return (
    <div style={{ padding: "48px 32px", maxWidth: 600, margin: "0 auto" }}>
      <p style={{ fontSize: 11, letterSpacing: "2px", color: O, marginBottom: 24 }}>編輯 Banner</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {[["背景圖片網址","bannerImg","https://..."],["大標題","bannerTitle",""],["副標題","bannerSub",""],["按鈕一文字","bannerBtn1","加入 LINE 社群"],["按鈕一連結","bannerLink1","https://line.me/..."],["按鈕二文字","bannerBtn2","追蹤 Instagram"],["按鈕二連結","bannerLink2","https://www.instagram.com/..."]].map(([label,key,ph]) => (
          <div key={key}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>{label}</p><input placeholder={ph} value={tmp[key] || ""} onChange={e => setTmp(p => ({ ...p, [key]: e.target.value }))} /></div>
        ))}
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
      ...(bi ? { background: `linear-gradient(rgba(40,20,10,.55),rgba(40,20,10,.55)) center/cover, url('${bi}') center/cover no-repeat` } : {}),
      display: "flex", alignItems: "center", position: "relative"
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", width: "100%" }}>
        <p style={{ fontSize: 11, letterSpacing: "3px", color: O, marginBottom: 20, fontWeight: 600 }}>88La · PERSONAL FINANCE</p>
        <h1 className="hero-title" style={{ fontSize: 52, fontWeight: 700, color: bi ? WHITE : CHAR, lineHeight: 1.2, marginBottom: 20, maxWidth: 600 }}>{bt}</h1>
        <p className="hero-sub" style={{ fontSize: 16, color: bi ? "rgba(255,255,255,.8)" : MID, marginBottom: 36, maxWidth: 480, lineHeight: 1.85 }}>{bs}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
  const [editTitle, setEditTitle] = useState(false);
  const [tmpTitle, setTmpTitle] = useState(siteTitle);
  const [editTags, setEditTags] = useState(false);
  const [newTag, setNewTag] = useState("");
  const filtered = articles.filter(a => filter === "全部" || a.tag === filter);
  const open = id => { setArticles(prev => prev.map(a => a.id === id ? { ...a, views: a.views + 1 } : a)); setId(id); setPage("article"); };
  const addTag = () => { const t = newTag.trim(); if (t && !tags.includes(t)) setTags(prev => [...prev, t]); setNewTag(""); };
  const delTag = t => { if (confirm("確定刪除標籤「" + t + "」？")) setTags(prev => prev.filter(x => x !== t)); };
  const moveA = (idx, dir) => setArticles(prev => {
    const a = [...prev]; const fi = filtered[idx]; const ri = a.findIndex(x => x.id === fi.id); const ni = ri + dir;
    if (ni < 0 || ni >= a.length) return prev; [a[ri], a[ni]] = [a[ni], a[ri]]; return a;
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          {["全部", ...tags].map(t => (
            <span key={t} onClick={() => setFilter(t)} style={{ fontSize: 12, padding: "5px 14px", cursor: "pointer", background: filter === t ? NAVY : GRAY, color: filter === t ? WHITE : MID, fontWeight: filter === t ? "500" : "400", transition: "background .15s" }}>{t}</span>
          ))}
          {isAdmin && <span onClick={() => setEditTags(p => !p)} style={{ fontSize: 12, color: O, cursor: "pointer", marginLeft: 8 }}>{editTags ? "關閉" : "管理標籤"}</span>}
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
            <div key={a.id} className="card" onClick={() => open(a.id)} style={{ position: "relative" }}>
              {a.img
                ? <div style={{ height: 200, overflow: "hidden", background: GRAY }}><img src={a.img} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }} loading="lazy" onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} /></div>
                : <div style={{ height: 8, background: `linear-gradient(90deg, ${NAVY} 0%, ${O2} 100%)` }} />
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
          <select value={type} onChange={e => { setType(e.target.value); setKey(e.target.value === "page" ? "app" : ""); }} style={{ border: `1px solid #D0D5DA`, padding: "8px 10px", background: WHITE, fontSize: 12 }}>
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
  const [ed, setEd] = useState({ title: article.title, tag: article.tag, excerpt: article.excerpt, content: article.content, img: article.img || "", relatedLinks: article.relatedLinks || [] });
  const l = links || DEFAULTS.links;
  const submit = () => {
    if (!text.trim()) return;
    const c = { name: name.trim() || "匿名", text: text.trim(), date: new Date().toISOString().slice(0, 10) };
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, comments: [...a.comments, c] } : a));
    setName(""); setText("");
  };
  const copy = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };
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
        <select value={ed.tag} onChange={e => setEd(p => ({ ...p, tag: e.target.value }))} style={{ border: "1px solid #D0D5DA", padding: "10px 12px", background: WHITE }}>{tags.map(t => <option key={t}>{t}</option>)}</select>
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>封面圖片網址（選填）</p><input placeholder="https://..." value={ed.img} onChange={e => setEd(p => ({ ...p, img: e.target.value }))} /></div>
        <textarea placeholder="摘要" value={ed.excerpt} onChange={e => setEd(p => ({ ...p, excerpt: e.target.value }))} style={{ minHeight: 72, resize: "vertical" }} />
        <textarea placeholder="內文" value={ed.content} onChange={e => setEd(p => ({ ...p, content: e.target.value }))} style={{ minHeight: 360, border: "1px solid #D0D5DA", padding: "12px", background: WHITE }} />
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
            <span style={{ fontSize: 12, color: LIGHT }}>瀏覽 {article.views}</span>
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
        <div style={{ fontSize: 16, lineHeight: 2.1, color: CHAR, whiteSpace: "pre-wrap", marginBottom: 56 }}>{article.content}</div>
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
          <a href={"https://social-plugins.line.me/lineit/share?url=" + encodeURIComponent(window.location.href)} target="_blank" rel="noopener noreferrer"><button className="pg">分享至 LINE</button></a>
        </div>
        <div style={{ background: NAVY, padding: "36px" }}>
          <p style={{ fontSize: 16, fontWeight: 500, color: WHITE, marginBottom: 6 }}>加入 8友 社群</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 22, lineHeight: 1.8 }}>一起聊聊關於錢的事，不說教，只分享。</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={l.lineCommunity} target="_blank" rel="noopener noreferrer"><button className="pb">LINE 社群</button></a>
            <a href={l.instagram} target="_blank" rel="noopener noreferrer"><button style={{ background: "rgba(255,255,255,.15)", color: WHITE, border: "1px solid rgba(255,255,255,.3)", padding: "11px 24px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Instagram</button></a>
          </div>
        </div>
        <p style={{ fontSize: 11, letterSpacing: "2px", color: MID, margin: "48px 0 24px" }}>COMMENTS ({article.comments.length})</p>
        <div style={{ marginBottom: 36 }}>
          {article.comments.length === 0 && <p style={{ fontSize: 14, color: LIGHT, padding: "20px 0" }}>還沒有留言，來說說你的想法吧。</p>}
          {article.comments.map((c, i) => (
            <div key={i} style={{ padding: "18px 0", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: NAVY2 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: LIGHT }}>{c.date}</span>
              </div>
              <p style={{ fontSize: 14, color: MID, lineHeight: 1.8 }}>{c.text}</p>
            </div>
          ))}
        </div>
        <div style={{ background: GRAY, padding: "28px 28px" }}>
          <p style={{ fontSize: 12, letterSpacing: "1px", color: MID, marginBottom: 18 }}>留下你的想法</p>
          <input placeholder="暱稱（選填）" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 14 }} />
          <textarea placeholder="你的留言⋯" value={text} onChange={e => setText(e.target.value)} style={{ marginBottom: 18, border: "none", background: "transparent", borderBottom: "1px solid #D0D5DA" }} />
          <button className="pb" onClick={submit} disabled={!text.trim()}>送出留言</button>
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
        <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>封面圖片網址（選填）</p><input placeholder="https://..." value={d.img} onChange={e => setD(p => ({ ...p, img: e.target.value }))} /></div>
        {d.img && <div style={{ height: 180, overflow: "hidden", background: GRAY }}><img src={d.img} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <textarea placeholder="摘要（顯示在列表，選填）" value={d.excerpt} onChange={e => setD(p => ({ ...p, excerpt: e.target.value }))} style={{ minHeight: 72, resize: "vertical" }} />
        <textarea placeholder="文章內文（支援換行）" value={d.content} onChange={e => setD(p => ({ ...p, content: e.target.value }))} style={{ minHeight: 360, border: "1px solid #D0D5DA", padding: "12px", background: WHITE }} />
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
          <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>封面圖片網址</p><input placeholder="https://..." value={tmp.img} onChange={e => setTmp(p => ({ ...p, img: e.target.value }))} /></div>
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
  const save = () => { if (editing === "new") setProducts(prev => [...prev, { ...form, id: Date.now() }]); else setProducts(prev => prev.map(p => p.id === editing ? { ...p, ...form } : p)); setEditing(null); };
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
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>價格</p><input placeholder="NT$ 299" value={form.price} onChange={sf("price")} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>購買連結</p><input value={form.url} onChange={sf("url")} /></div>
            </div>
            <div style={{ marginBottom: 20 }}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>商品說明</p><textarea value={form.desc} onChange={sf("desc")} style={{ minHeight: 80, border: "1px solid #D0D5DA", padding: "10px", background: WHITE }} /></div>
            <div style={{ marginBottom: 24 }}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>圖片網址（選填）</p><input value={form.img} onChange={sf("img")} /></div>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.name.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }} className="grid3">
          {products.map((p, idx) => (
            <div key={p.id} style={{ background: WHITE, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", position: "relative", border: `1px solid ${BORDER}`, transition: "box-shadow .24s, transform .24s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,90,20,.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {isAdmin && <OrdBtns idx={idx} total={products.length} onMove={move} style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }} />}
              <div style={{ height: 200, background: "#E8EAEC", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.img ? <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 12, color: LIGHT, letterSpacing: "1px" }}>{p.type === "digital" ? "DIGITAL" : "PHYSICAL"}</span>}
              </div>
              <div style={{ padding: "20px 22px 24px" }}>
                <span className={p.type === "digital" ? "tag" : "tagn"} style={{ marginBottom: 10, display: "inline-block" }}>{p.type === "digital" ? "數位商品" : "實體商品"}</span>
                <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: O }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: MID, lineHeight: 1.8, marginBottom: 14, whiteSpace: "pre-wrap" }}>{p.desc}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: O }}>{p.price}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "8px 16px" }}>購買 →</button></a>}
                    {isAdmin && <><button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => startEdit(p)}>編輯</button><button className="pg" style={{ fontSize: 11, padding: "5px 10px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => del(p.id)}>刪除</button></>}
                  </div>
                </div>
              </div>
            </div>
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
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const startAdd = () => { setForm({ title: "", url: "", thumb: "", type: "post" }); setEditing("new"); };
  const startEdit = p => { setForm({ ...p }); setEditing(p.id); };
  const save = () => { if (editing === "new") setIgPosts(prev => [...prev, { ...form, id: Date.now() }]); else setIgPosts(prev => prev.map(p => p.id === editing ? { ...p, ...form } : p)); setEditing(null); };
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
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>連結（Instagram / YouTube）</p><input value={form.url} onChange={sf("url")} placeholder="https://..." /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>縮圖網址（選填）</p><input value={form.thumb} onChange={sf("thumb")} placeholder="https://..." /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.title.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }} className="grid-ig">
          {igPosts.map((p, idx) => {
            const ytId = getYouTubeId(p.url || "");
            return (
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
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const startAdd = () => { setForm({ name: "", brand: "", desc: "", url: "", img: "", active: true }); setEditing("new"); };
  const startEdit = p => { setForm({ ...p }); setEditing(p.id); };
  const save = () => { if (editing === "new") setGoods(prev => [...prev, { ...form, id: Date.now() }]); else setGoods(prev => prev.map(p => p.id === editing ? { ...p, ...form } : p)); setEditing(null); };
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
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>連結</p><input value={form.url} onChange={sf("url")} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>圖片網址（選填）</p><input value={form.img} onChange={sf("img")} /></div>
            </div>
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
              <div key={p.id} style={{ background: WHITE, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", position: "relative", border: `1px solid ${BORDER}`, transition: "box-shadow .24s, transform .24s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,90,20,.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {isAdmin && <OrdBtns idx={idx} total={active.length} onMove={move} style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }} />}
                {p.img && <div style={{ height: 180, overflow: "hidden", background: "#E8EAEC" }}><img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                <div style={{ padding: "22px 22px" }}>
                  {p.brand && <p style={{ fontSize: 11, color: O, letterSpacing: ".5px", marginBottom: 6, fontWeight: 500 }}>{p.brand}</p>}
                  <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: NAVY2 }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: MID, lineHeight: 1.8, marginBottom: 16, whiteSpace: "pre-wrap" }}>{p.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "8px 16px" }}>查看 →</button></a>}
                    {isAdmin && <div style={{ display: "flex", gap: 8 }}><button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => startEdit(p)}>編輯</button><button className="pg" style={{ fontSize: 11, padding: "5px 10px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => del(p.id)}>刪除</button></div>}
                  </div>
                </div>
              </div>
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
  const c = appContent || DEFAULTS.appContent;
  const upd = patch => setAppContent(prev => ({ ...(prev || DEFAULTS.appContent), ...patch }));
  const [detailPlan, setDetailPlan] = useState(null);
  const [editHero, setEditHero] = useState(false);
  const [tmpHero, setTmpHero] = useState({ heroTitle: c.heroTitle, heroHighlight: c.heroHighlight, heroSub: c.heroSub });
  const [editingFeat, setEditingFeat] = useState(null);
  const [featForm, setFeatForm] = useState({ n: "", title: "", desc: "", img: "" });
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: "", price: "", period: "", highlight: false, badge: "", features: [], detailTitle: "", detailImg: "", detailContent: "" });
  const [editNote, setEditNote] = useState(false);
  const [tmpNote, setTmpNote] = useState(c.pricingNote);
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
            <img src={plan.detailImg} alt={plan.name} style={{ width: "100%", maxHeight: 380, objectFit: "cover", display: "block" }} />
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
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>圖片網址</p><input value={plan.detailImg || ""} onChange={e => upd({ plans: c.plans.map(p => p.id === plan.id ? { ...p, detailImg: e.target.value } : p) })} /></div>
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
              <p className="section-label" style={{ marginBottom: 16 }}>88LA FINANCE · APP</p>
              <h1 style={{ fontSize: 48, fontWeight: 700, color: CHAR, lineHeight: 1.2, maxWidth: 580, marginBottom: 20 }}>
                {c.heroTitle}<br /><span style={{ color: O }}>{c.heroHighlight}</span>
              </h1>
              <p style={{ fontSize: 16, color: MID, lineHeight: 1.9, maxWidth: 480, marginBottom: 36, whiteSpace: "pre-wrap" }}>{c.heroSub}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
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
            <div style={{ marginBottom: 16 }}><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>圖片網址（選填）</p><input value={featForm.img} onChange={e => setFeatForm(p => ({ ...p, img: e.target.value }))} placeholder="https://..." /></div>
            {featForm.img && <div style={{ height: 120, overflow: "hidden", background: GRAY, marginBottom: 16 }}><img src={featForm.img} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={saveFeat} disabled={!featForm.title.trim()}>儲存</button><button className="pg" onClick={() => setEditingFeat(null)}>取消</button></div>
          </div>
        )}
        {isAdmin && !editingFeat && <div style={{ marginBottom: 24, textAlign: "right" }}><button className="pb" style={{ fontSize: 12 }} onClick={() => { setFeatForm({ n: String(c.features.length + 1).padStart(2, "0"), title: "", desc: "", img: "" }); setEditingFeat("new"); }}>＋ 新增功能</button></div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }} className="grid3">
          {c.features.map((f, i) => (
            <div key={f.id || i} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", transition: "box-shadow .24s, transform .24s", position: "relative", overflow: "hidden" }}
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
          ))}
        </div>
      </div>
      {/* Pricing */}
      <div id="app-pricing" style={{ background: GRAY, padding: "72px 32px" }}>
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
                <div><p style={{ fontSize: 12, color: MID, marginBottom: 6 }}>詳情頁圖片網址</p><input value={planForm.detailImg} onChange={e => setPlanForm(p => ({ ...p, detailImg: e.target.value }))} placeholder="https://..." /></div>
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
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: 34, fontWeight: 700, color: p.highlight ? WHITE : CHAR }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: p.highlight ? "rgba(255,255,255,.55)" : LIGHT }}>{p.period}</span>
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
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const items = resources || [];
  const filtered = items.filter(r => r.active && (filter === "全部" || r.type === filter));
  const startAdd = () => { setForm({ name: "", type: "模板", desc: "", url: "", img: "", active: true }); setEditing("new"); };
  const startEdit = r => { setForm({ ...r }); setEditing(r.id); };
  const save = () => { if (editing === "new") setResources(prev => [...(prev || []), { ...form, id: Date.now() }]); else setResources(prev => (prev || []).map(r => r.id === editing ? { ...r, ...form } : r)); setEditing(null); };
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
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>連結</p><input value={form.url} onChange={sf("url")} /></div>
              <div><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>圖片網址（選填）</p><input value={form.img} onChange={sf("img")} /></div>
            </div>
            <div style={{ marginBottom: 16 }}><p style={{ fontSize: 12, color: MID, marginBottom: 8 }}>說明</p><textarea value={form.desc} onChange={sf("desc")} style={{ minHeight: 80, border: "1px solid #D0D5DA", padding: "10px", background: WHITE }} /></div>
            <label style={{ fontSize: 12, color: MID, display: "flex", gap: 8, alignItems: "center", marginBottom: 24, cursor: "pointer" }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} style={{ width: "auto" }} />上架顯示
            </label>
            <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.name.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 36 }}>
          {types.map(t => <span key={t} onClick={() => setFilter(t)} style={{ fontSize: 12, padding: "5px 14px", cursor: "pointer", background: filter === t ? NAVY : GRAY, color: filter === t ? WHITE : MID, transition: "background .15s" }}>{t}</span>)}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 14, color: LIGHT, lineHeight: 2.4 }}>還沒有資源<br /><span style={{ fontSize: 12 }}>資源整理好後會放在這裡</span></p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }} className="grid3">
            {filtered.map(r => (
              <div key={r.id} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden", transition: "box-shadow .24s, transform .24s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,90,20,.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {r.img && <div style={{ height: 160, overflow: "hidden", background: GRAY }}><img src={r.img} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /></div>}
                <div style={{ padding: "22px 24px 24px" }}>
                  <span className="tag" style={{ marginBottom: 10, display: "inline-block" }}>{r.type}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 500, color: CHAR, marginBottom: 8 }}>{r.name}</h3>
                  <p style={{ fontSize: 13, color: MID, lineHeight: 1.85, marginBottom: 18, whiteSpace: "pre-wrap" }}>{r.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "8px 16px" }}>下載 / 查看 →</button></a>}
                    {isAdmin && <div style={{ display: "flex", gap: 8 }}>
                      <button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => startEdit(r)}>編輯</button>
                      <button className="pg" style={{ fontSize: 11, padding: "5px 10px", color: "#E74C3C", borderColor: "#E74C3C" }} onClick={() => del(r.id)}>刪除</button>
                    </div>}
                  </div>
                </div>
              </div>
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
  const open = id => { setArticles(prev => prev.map(a => a.id === id ? { ...a, views: a.views + 1 } : a)); setId(id); setPage("article"); };
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
        <div style={{ position: "absolute", right: -60, top: -60, width: 360, height: 360, background: `radial-gradient(circle, ${NAVY}30 0%, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
          {isAdmin && <button onClick={() => { setTmp(info); setEditMode(true); }} style={{ position: "absolute", top: -48, right: 0, background: O, color: WHITE, border: "none", padding: "6px 14px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>編輯</button>}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: O2, border: `1px solid ${O}25`, padding: "6px 14px", marginBottom: 24 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={O} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span style={{ fontSize: 12, color: O, fontWeight: 500 }}>{info.subscriberCount} 位讀者</span>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 700, color: CHAR, lineHeight: 1.25, marginBottom: 16 }}>88La<br /><span style={{ color: O }}>理財週報</span></h1>
          <p style={{ fontSize: 16, color: MID, lineHeight: 1.9, marginBottom: 32, maxWidth: 460, whiteSpace: "pre-wrap" }}>{info.intro}</p>
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

// ── App root ──
export default function App() {
  const [articles, setArticles, aL] = useFS("articles", DEFAULTS.articles);
  const [products, setProducts, pL] = useFS("products", DEFAULTS.products);
  const [igPosts, setIgPosts, iL] = useFS("igPosts", DEFAULTS.igPosts);
  const [goods, setGoods, gL] = useFS("goods", []);
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

  const loaded = aL && pL && iL && gL && abL && tL && taL && lL && ftL && rlL && nlL && acL && ccL;
  const article = articles.find(a => a.id === id);
  const nav = p => { setPage(p); setId(null); window.scrollTo(0, 0); };
  const saveArticle = d => {
    const nid = Math.max(...articles.map(a => a.id), 0) + 1;
    setArticles(prev => [...prev, { id: nid, ...d, excerpt: d.excerpt || (d.content.slice(0, 80) + "⋯"), views: 0, comments: [], date: new Date().toISOString().slice(0, 10) }]);
    setPage("home");
  };

  if (!loaded) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", letterSpacing: "3px" }}>LOADING</p>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: WHITE }}>
      <Nav page={page} setPage={nav} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
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
        {page === "article" && article && <Article article={article} onBack={() => nav("home")} setArticles={setArticles} isAdmin={isAdmin} tags={tags} links={links} setPage={nav} products={products} resources={resources} />}
        {page === "write" && isAdmin && <Write onSave={saveArticle} onBack={() => nav("home")} tags={tags} products={products} resources={resources} />}
      </div>
      <Footer links={links} footerTagline={footerTagline} setFooterTagline={setFooterTagline} isAdmin={isAdmin} setPage={nav} />
    </div>
  );
}
