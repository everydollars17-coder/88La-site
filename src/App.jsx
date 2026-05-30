import { useState } from "react";

const ADMIN_PW = "everydollars88";
const O = "#C85A14";
const O2 = "#FDF0E8";
const CHAR = "#18170F";
const MID = "#6B6560";
const LIGHT = "#ADA89F";
const BDR = "#C8B89A";
const WHITE = "#FFFFFF";

const GF = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500&family=Inter:ital,wght@0,300;0,400;0,500;1,300&display=swap');`;

const css = `
${GF}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans TC','Inter',sans-serif;background:${WHITE};color:${CHAR};-webkit-font-smoothing:antialiased;}
a{text-decoration:none;color:inherit;}
input,textarea,select{font-family:inherit;font-size:14px;border:1px solid ${BDR};background:${WHITE};padding:9px 13px;outline:none;width:100%;color:${CHAR};}
input:focus,textarea:focus,select:focus{border-color:${O};}
textarea{resize:vertical;min-height:100px;line-height:1.9;}
button{font-family:inherit;cursor:pointer;}
.pb{background:${O};color:#fff;border:none;padding:10px 24px;font-size:13px;font-weight:400;letter-spacing:.5px;white-space:nowrap;}
.pb:hover{background:#A04510;}
.pb:disabled{opacity:.4;cursor:default;}
.pg{background:transparent;border:1px solid ${BDR};padding:9px 20px;font-size:13px;color:${MID};white-space:nowrap;}
.pg:hover{border-color:${CHAR};color:${CHAR};}
.tag{display:inline-block;border:1px solid ${O};color:${O};font-size:11px;padding:2px 9px;letter-spacing:.5px;}
.divider{border:none;border-top:1px solid ${BDR};}
.ordbtn{background:transparent;border:1px solid ${BDR};color:${LIGHT};font-size:11px;padding:2px 6px;line-height:1;}
.ordbtn:hover{border-color:${O};color:${O};}
@media(max-width:680px){
  .nav-links{display:none;}
  .mob-menu{display:flex!important;}
  .page-pad{padding:36px 16px!important;}
  .grid-auto{grid-template-columns:1fr!important;}
  .about-grid{grid-template-columns:1fr!important;}
  .about-img{aspect-ratio:4/3!important;order:-1;}
  .two-col{grid-template-columns:1fr!important;}
}
@media(min-width:681px){
  .mob-menu{display:none!important;}
  .mob-nav-panel{display:none!important;}
}
`;

const DEFAULT_TAGS = ["理財觀念", "信用卡", "記帳", "投資", "讀書筆記", "生活財務", "其他"];

const INIT_ARTICLES = [
  {
    id: 1, title: "為什麼你記帳卻還是存不到錢？", date: "2026-05-01", tag: "理財觀念",
    excerpt: "很多人以為記帳就能存到錢，但其實記帳只是照妖鏡，照出你花了哪些錢，卻不會自動幫你存錢。真正的關鍵是——先存後花。",
    content: "很多人問我：「Barbara，我有記帳，但怎麼還是存不到錢？」\n\n這個問題我自己以前也有過。記帳本寫得密密麻麻，每個月花了多少一清二楚，但帳戶餘額還是在月底趨近於零。\n\n後來我才發現：記帳只是照妖鏡，不是存錢器。\n\n它能告訴你錢去哪了，但它不會幫你把錢留下來。\n\n真正讓我開始存到錢的方法，是把順序倒過來：先存，再花。\n\n發薪日當天，先把要存的錢轉出去——不管是緊急備用金、旅遊基金、還是投資帳戶。剩下的才是這個月可以動用的生活費。\n\n從「記帳→花錢→希望有剩」，變成「存錢→花錢→用記帳確認」。\n\n這個順序的改變，對我來說比任何記帳軟體都有效。",
    views: 312, comments: [{ name: "8友小美", text: "這個觀念真的打到我了，我也是每個月記帳但存不到錢", date: "2026-05-03" }, { name: "匿名", text: "先存後花，我試了兩個月真的有效！謝謝Barbara", date: "2026-05-05" }]
  },
  {
    id: 2, title: "信用卡不是壞東西，是你沒搞清楚規則", date: "2026-05-15", tag: "信用卡",
    excerpt: "很多人怕信用卡，覺得它會讓自己亂花錢。但其實信用卡是中性工具，問題在於你有沒有把帳單日和繳款日搞清楚。",
    content: "「我不敢辦信用卡，怕自己亂花錢。」\n\n這句話我聽過很多次。信用卡在很多人眼中是個危險物品，好像辦了就會失控。\n\n但我想說的是：信用卡本身是中性的，問題從來都不是卡，是使用的方式。\n\n真正讓人「失控」的原因：一、不知道自己實際花了多少。二、搞不清楚帳單日和繳款日的差異。\n\n很多人以為「繳款日前只要繳清就好」，卻不知道帳單日到繳款日之間還有一段緩衝期，這段時間如果繼續刷，會累積到下一期帳單。\n\n我的建議：把信用卡的預算視同現金在管理。刷了就登記，不要等帳單才知道。設定自動扣款，永遠不繳最低應繳。\n\n關鍵從來不是「辦不辦卡」，是「你有沒有在掌控它」。",
    views: 198, comments: [{ name: "匿名", text: "終於有人說清楚帳單日跟繳款日的差別了！", date: "2026-05-17" }]
  }
];

const INIT_PRODUCTS = [
  { id: 1, name: "理財自動導航器 2.0", type: "digital", price: "NT$ 299", desc: "Google Sheets 理財模板，自動模式偵測，適合薪水族。", url: "https://portaly.cc/every_dollars", img: "" },
  { id: 2, name: "88La 存錢袋", type: "physical", price: "NT$ 180", desc: "手工製作信封袋，現金分類存錢用，711 賣貨便出貨。", url: "", img: "" }
];

const INIT_IG = [
  { id: 1, title: "假記帳的陷阱你中了嗎？", url: "https://www.instagram.com/every_dollars/", thumb: "" },
  { id: 2, title: "存錢袋使用教學｜現金分配法", url: "https://www.instagram.com/every_dollars/", thumb: "" }
];

const INIT_ABOUT = {
  intro: "嗨，我是 88La。\n\n我從信封分類法開始認識理財——不是從書本，是從自己每個月真實的薪水開始。\n\n我相信理財不是讓自己活得緊繃，而是讓你對生活有更多掌控感和自由度。\n\n這裡是我寫給自己、也寫給你的地方。有時候是讀書心得，有時候是想通了某個關於錢的事，有時候只是一個小觀察。",
  img: ""
};

function useLS(key, def) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; }
  });
  const set = fn => {
    const n = typeof fn === "function" ? fn(v) : fn;
    setV(n);
    try { localStorage.setItem(key, JSON.stringify(n)); } catch { }
  };
  return [v, set];
}

function moveItem(arr, idx, dir) {
  const a = [...arr];
  const to = idx + dir;
  if (to < 0 || to >= a.length) return a;
  [a[idx], a[to]] = [a[to], a[idx]];
  return a;
}

function OrderBtns({ idx, total, onMove, style = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, ...style }}>
      <button className="ordbtn" onClick={e => { e.stopPropagation(); onMove(idx, -1); }} disabled={idx === 0}>▲</button>
      <button className="ordbtn" onClick={e => { e.stopPropagation(); onMove(idx, 1); }} disabled={idx === total - 1}>▼</button>
    </div>
  );
}

const NAV_PAGES = [["about", "關於我"], ["ig", "最新消息"], ["shop", "商品"], ["home", "文章"], ["goods", "推薦好物"]];

function Nav({ page, setPage, isAdmin, setIsAdmin }) {
  const [showL, setShowL] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [mobOpen, setMobOpen] = useState(false);
  const login = () => {
    if (pw === ADMIN_PW) { setIsAdmin(true); setShowL(false); setPw(""); setErr(false); }
    else setErr(true);
  };
  const go = p => { setPage(p); setMobOpen(false); };
  return (
    <>
      <style>{css}</style>
      <header style={{ background: WHITE, borderBottom: `1px solid ${BDR}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1020, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span onClick={() => go("home")} style={{ fontWeight: 400, fontSize: 14, letterSpacing: "1px", cursor: "pointer", color: CHAR }}>88La 理財官網</span>
          <nav className="nav-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {NAV_PAGES.map(([k, l]) => (
              <span key={k} onClick={() => go(k)} style={{ fontSize: 12, letterSpacing: "1px", color: page === k ? O : MID, cursor: "pointer", borderBottom: page === k ? `1px solid ${O}` : "none", paddingBottom: 1 }}>{l}</span>
            ))}
            {isAdmin
              ? <><span onClick={() => go("write")} style={{ fontSize: 12, color: O, cursor: "pointer" }}>＋ 撰文</span><span onClick={() => setIsAdmin(false)} style={{ fontSize: 11, color: LIGHT, cursor: "pointer", marginLeft: 6 }}>登出</span></>
              : <span onClick={() => setShowL(true)} style={{ fontSize: 11, color: LIGHT, cursor: "pointer" }}>後台</span>
            }
          </nav>
          <button className="mob-menu" onClick={() => setMobOpen(p => !p)} style={{ background: "none", border: "none", fontSize: 20, color: CHAR, padding: "4px 8px", display: "flex", alignItems: "center" }}>
            {mobOpen ? "✕" : "☰"}
          </button>
        </div>
        {mobOpen && (
          <div className="mob-nav-panel" style={{ background: WHITE, borderTop: `1px solid ${BDR}`, padding: "16px 20px", display: "flex", flexDirection: "column" }}>
            {NAV_PAGES.map(([k, l]) => (
              <span key={k} onClick={() => go(k)} style={{ fontSize: 14, padding: "12px 0", borderBottom: `1px solid ${BDR}`, color: page === k ? O : CHAR, cursor: "pointer" }}>{l}</span>
            ))}
            {isAdmin
              ? <><span onClick={() => go("write")} style={{ fontSize: 14, padding: "12px 0", borderBottom: `1px solid ${BDR}`, color: O, cursor: "pointer" }}>＋ 撰文</span><span onClick={() => { setIsAdmin(false); setMobOpen(false); }} style={{ fontSize: 13, padding: "12px 0", color: LIGHT, cursor: "pointer" }}>登出</span></>
              : <span onClick={() => { setShowL(true); setMobOpen(false); }} style={{ fontSize: 13, padding: "12px 0", color: LIGHT, cursor: "pointer" }}>後台登入</span>
            }
          </div>
        )}
      </header>
      {showL && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(24,23,15,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ background: WHITE, padding: 32, width: "100%", maxWidth: 320, border: `1px solid ${BDR}` }}>
            <p style={{ fontSize: 13, letterSpacing: "1px", marginBottom: 20 }}>後台登入</p>
            <input type="password" placeholder="密碼" value={pw} onChange={e => { setPw(e.target.value); setErr(false); }} onKeyDown={e => e.key === "Enter" && login()} style={{ marginBottom: 8 }} />
            {err && <p style={{ fontSize: 12, color: "#B03A2E", marginBottom: 8 }}>密碼錯誤</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="pb" style={{ flex: 1 }} onClick={login}>登入</button>
              <button className="pg" onClick={() => { setShowL(false); setPw(""); setErr(false); }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${BDR}`, marginTop: 80, padding: "40px 20px", background: WHITE }}>
      <div style={{ maxWidth: 1020, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
        <div>
          <p style={{ fontWeight: 400, fontSize: 14, letterSpacing: "1px", marginBottom: 6 }}>88La 理財官網</p>
          <p style={{ fontSize: 12, color: LIGHT, lineHeight: 1.9 }}>理財，是為了讓生活更自由。</p>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[["https://line.me/R/ti/p/@367xhgyr", "LINE 官方帳號"], ["https://www.instagram.com/every_dollars/", "Instagram"], ["mailto:everydollars17@gmail.com", "合作信箱"]].map(([h, l]) => (
            <a key={l} href={h} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: MID, borderBottom: `1px solid ${BDR}`, paddingBottom: 2 }}>{l}</a>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1020, margin: "16px auto 0", paddingTop: 16, borderTop: `1px solid ${BDR}` }}>
        <p style={{ fontSize: 11, color: LIGHT }}>© 2026 88La · every_dollars</p>
      </div>
    </footer>
  );
}

function Home({ articles, setPage, setId, setArticles, isAdmin, siteTitle, setSiteTitle, tags, setTags }) {
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
    const a = [...prev];
    const fi = filtered[idx];
    const ri = a.findIndex(x => x.id === fi.id);
    const ni = ri + dir;
    if (ni < 0 || ni >= a.length) return prev;
    [a[ri], a[ni]] = [a[ni], a[ri]];
    return a;
  });
  return (
    <div style={{ maxWidth: 1020, margin: "0 auto", padding: "48px 20px" }} className="page-pad">
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 11, letterSpacing: "3px", color: O, marginBottom: 10 }}>JOURNAL</p>
          {editTitle ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input value={tmpTitle} onChange={e => setTmpTitle(e.target.value)} style={{ fontSize: 18, fontWeight: 300, flex: 1, minWidth: 160 }} />
              <button className="pb" style={{ fontSize: 12, padding: "7px 14px" }} onClick={() => { setSiteTitle(tmpTitle); setEditTitle(false); }}>儲存</button>
              <button className="pg" style={{ fontSize: 12, padding: "7px 14px" }} onClick={() => { setTmpTitle(siteTitle); setEditTitle(false); }}>取消</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 24, fontWeight: 300, lineHeight: 1.4 }}>{siteTitle}</h1>
              {isAdmin && <span style={{ fontSize: 11, color: O, cursor: "pointer" }} onClick={() => { setTmpTitle(siteTitle); setEditTitle(true); }}>編輯標題</span>}
            </div>
          )}
        </div>
        {isAdmin && !editTitle && <button className="pb" onClick={() => setPage("write")}>＋ 新增文章</button>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
        {["全部", ...tags].map(t => (
          <span key={t} onClick={() => setFilter(t)} style={{ fontSize: 11, padding: "5px 12px", cursor: "pointer", border: `1px solid ${filter === t ? O : BDR}`, color: filter === t ? O : MID }}>{t}</span>
        ))}
        {isAdmin && <span onClick={() => setEditTags(p => !p)} style={{ fontSize: 11, color: O, cursor: "pointer", borderBottom: `1px solid ${O}`, paddingBottom: 1, marginLeft: 4 }}>{editTags ? "關閉" : "管理標籤"}</span>}
      </div>
      {isAdmin && editTags && (
        <div style={{ background: O2, padding: "18px 20px", marginBottom: 24, borderLeft: `3px solid ${O}` }}>
          <p style={{ fontSize: 11, letterSpacing: "1px", color: MID, marginBottom: 12 }}>標籤管理</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {tags.map(t => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${BDR}`, padding: "4px 10px", fontSize: 12, color: MID }}>
                {t}<span onClick={() => delTag(t)} style={{ cursor: "pointer", color: LIGHT, fontSize: 14 }}>×</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input placeholder="新增標籤" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} style={{ maxWidth: 180 }} />
            <button className="pb" style={{ fontSize: 12, padding: "7px 14px" }} onClick={addTag} disabled={!newTag.trim()}>新增</button>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gap: "1px", background: BDR, gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }} className="grid-auto">
        {filtered.map((a, idx) => (
          <div key={a.id} style={{ background: WHITE, padding: "26px 22px", cursor: "pointer", position: "relative" }} onMouseEnter={e => e.currentTarget.style.background = O2} onMouseLeave={e => e.currentTarget.style.background = WHITE}>
            <div onClick={() => open(a.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span className="tag">{a.tag}</span>
                <span style={{ fontSize: 11, color: LIGHT }}>{a.date}</span>
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.65, marginBottom: 8 }}>{a.title}</h2>
              <p style={{ fontSize: 13, color: MID, lineHeight: 1.9, marginBottom: 14 }}>{a.excerpt}</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: O }}>閱讀 →</span>
                <span style={{ fontSize: 11, color: LIGHT }}>瀏覽 {a.views}</span>
              </div>
            </div>
            {isAdmin && <OrderBtns idx={idx} total={filtered.length} onMove={moveA} style={{ position: "absolute", top: 10, right: 10 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Article({ article, onBack, setArticles, isAdmin, tags }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ed, setEd] = useState({ title: article.title, tag: article.tag, excerpt: article.excerpt, content: article.content });
  const submit = () => {
    if (!text.trim()) return;
    const c = { name: name.trim() || "匿名", text: text.trim(), date: new Date().toISOString().slice(0, 10) };
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, comments: [...a.comments, c] } : a));
    setName(""); setText("");
  };
  const copy = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const del = () => { if (confirm("確定刪除此文章？")) { setArticles(prev => prev.filter(a => a.id !== article.id)); onBack(); } };
  const saveEdit = () => { setArticles(prev => prev.map(a => a.id === article.id ? { ...a, ...ed } : a)); setEditing(false); };
  if (editing) return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 20px" }} className="page-pad">
      <button className="pg" onClick={() => setEditing(false)} style={{ marginBottom: 28 }}>← 取消</button>
      <p style={{ fontSize: 11, letterSpacing: "2px", color: O, marginBottom: 16 }}>編輯文章</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="標題" value={ed.title} onChange={e => setEd(p => ({ ...p, title: e.target.value }))} />
        <select value={ed.tag} onChange={e => setEd(p => ({ ...p, tag: e.target.value }))}>{tags.map(t => <option key={t}>{t}</option>)}</select>
        <input placeholder="摘要" value={ed.excerpt} onChange={e => setEd(p => ({ ...p, excerpt: e.target.value }))} />
        <textarea placeholder="內文" value={ed.content} onChange={e => setEd(p => ({ ...p, content: e.target.value }))} style={{ minHeight: 320 }} />
        <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={saveEdit}>儲存</button><button className="pg" onClick={() => setEditing(false)}>取消</button></div>
      </div>
    </div>
  );
  return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 20px" }} className="page-pad">
      <button className="pg" onClick={onBack} style={{ marginBottom: 36 }}>← 返回</button>
      <p style={{ fontSize: 11, letterSpacing: "2px", color: O, marginBottom: 12 }}>{article.tag}</p>
      <h1 style={{ fontSize: 22, fontWeight: 400, lineHeight: 1.5, marginBottom: 10 }}>{article.title}</h1>
      <div style={{ display: "flex", gap: 16, marginBottom: 36, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: LIGHT }}>{article.date}</span>
        <span style={{ fontSize: 12, color: LIGHT }}>瀏覽 {article.views}</span>
        {isAdmin && <><span style={{ fontSize: 12, color: O, cursor: "pointer" }} onClick={() => setEditing(true)}>編輯</span><span style={{ fontSize: 12, color: "#B03A2E", cursor: "pointer" }} onClick={del}>刪除</span></>}
      </div>
      <hr className="divider" style={{ marginBottom: 36 }} />
      <div style={{ fontSize: 15, lineHeight: 2.1, color: CHAR, whiteSpace: "pre-wrap", marginBottom: 52 }}>{article.content}</div>
      <hr className="divider" style={{ marginBottom: 24 }} />
      <div style={{ display: "flex", gap: 10, marginBottom: 44, flexWrap: "wrap" }}>
        <button className="pg" onClick={copy}>{copied ? "✓ 已複製" : "複製連結"}</button>
        <a href="https://social-plugins.line.me/lineit/share?url=https://every-dollars.com" target="_blank" rel="noopener noreferrer"><button className="pg">分享至 LINE</button></a>
      </div>
      <div style={{ background: O2, padding: "24px 24px", marginBottom: 44, borderLeft: `3px solid ${O}` }}>
        <p style={{ fontSize: 13, fontWeight: 400, marginBottom: 6 }}>加入 8友 社群</p>
        <p style={{ fontSize: 12, color: MID, marginBottom: 16, lineHeight: 1.8 }}>一起聊聊關於錢的事，不說教，只分享。</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="https://line.me/R/ti/p/@367xhgyr" target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "8px 18px" }}>LINE 社群</button></a>
          <a href="https://www.instagram.com/every_dollars/" target="_blank" rel="noopener noreferrer"><button className="pg" style={{ fontSize: 12 }}>Instagram</button></a>
        </div>
      </div>
      <p style={{ fontSize: 12, letterSpacing: "1.5px", marginBottom: 20, color: MID }}>COMMENTS ({article.comments.length})</p>
      <div style={{ borderTop: `1px solid ${BDR}`, marginBottom: 28 }}>
        {article.comments.length === 0 && <p style={{ fontSize: 13, color: LIGHT, padding: "18px 0" }}>還沒有留言，來說說你的想法吧。</p>}
        {article.comments.map((c, i) => (
          <div key={i} style={{ padding: "16px 0", borderBottom: `1px solid ${BDR}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, flexWrap: "wrap", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 400 }}>{c.name}</span>
              <span style={{ fontSize: 11, color: LIGHT }}>{c.date}</span>
            </div>
            <p style={{ fontSize: 14, color: MID, lineHeight: 1.8 }}>{c.text}</p>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${BDR}`, paddingTop: 24 }}>
        <p style={{ fontSize: 12, letterSpacing: "1px", marginBottom: 14, color: MID }}>留下你的想法</p>
        <input placeholder="暱稱（選填，留空顯示為匿名）" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 10 }} />
        <textarea placeholder="你的留言⋯" value={text} onChange={e => setText(e.target.value)} style={{ marginBottom: 12 }} />
        <button className="pb" onClick={submit} disabled={!text.trim()}>送出</button>
      </div>
    </div>
  );
}

function Write({ onSave, onBack, tags }) {
  const [d, setD] = useState({ title: "", tag: tags[0] || "", excerpt: "", content: "" });
  const ok = d.title.trim() && d.content.trim();
  return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 20px" }} className="page-pad">
      <button className="pg" onClick={onBack} style={{ marginBottom: 28 }}>← 返回</button>
      <p style={{ fontSize: 11, letterSpacing: "2px", color: O, marginBottom: 16 }}>NEW ARTICLE</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="文章標題" value={d.title} onChange={e => setD(p => ({ ...p, title: e.target.value }))} style={{ fontSize: 15 }} />
        <select value={d.tag} onChange={e => setD(p => ({ ...p, tag: e.target.value }))}>{tags.map(t => <option key={t}>{t}</option>)}</select>
        <input placeholder="摘要（顯示在列表，選填）" value={d.excerpt} onChange={e => setD(p => ({ ...p, excerpt: e.target.value }))} />
        <textarea placeholder="文章內文（支援換行）" value={d.content} onChange={e => setD(p => ({ ...p, content: e.target.value }))} style={{ minHeight: 320 }} />
        <div style={{ display: "flex", gap: 10 }}><button className="pb" disabled={!ok} onClick={() => onSave(d)}>發布</button><button className="pg" onClick={onBack}>取消</button></div>
      </div>
    </div>
  );
}

function About({ about, setAbout, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(about);
  const save = () => { setAbout(tmp); setEditing(false); };
  if (editing) return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px" }} className="page-pad">
      <p style={{ fontSize: 11, letterSpacing: "3px", color: O, marginBottom: 32 }}>ABOUT</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24, alignItems: "start" }} className="two-col">
        <div style={{ background: "#EDE8E2", aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {tmp.img ? <img src={tmp.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="about" /> : <span style={{ fontSize: 11, color: LIGHT }}>封面圖片</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="封面圖片網址（選填）" value={tmp.img} onChange={e => setTmp(p => ({ ...p, img: e.target.value }))} />
          <textarea placeholder="自我介紹內文" value={tmp.intro} onChange={e => setTmp(p => ({ ...p, intro: e.target.value }))} style={{ minHeight: 260 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="pb" onClick={save}>儲存</button>
        <button className="pg" onClick={() => setEditing(false)}>取消</button>
      </div>
    </div>
  );
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px" }} className="page-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 44 }}>
        <p style={{ fontSize: 11, letterSpacing: "3px", color: O }}>ABOUT</p>
        {isAdmin && <button className="pg" style={{ fontSize: 12 }} onClick={() => { setTmp(about); setEditing(true); }}>編輯頁面</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, marginBottom: 52, alignItems: "start" }} className="about-grid">
        <div style={{ background: "#EDE8E2", aspectRatio: "3/4", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }} className="about-img">
          {about.img ? <img src={about.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="88La" /> : <span style={{ fontSize: 11, color: LIGHT, letterSpacing: "1px" }}>PHOTO</span>}
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 300, marginBottom: 4 }}>88La</h1>
          <p style={{ fontSize: 12, color: LIGHT, letterSpacing: ".5px", marginBottom: 2 }}>理財內容創作者</p>
          <p style={{ fontSize: 12, color: LIGHT, letterSpacing: ".5px", marginBottom: 28 }}>@every_dollars · Taiwan</p>
          <hr className="divider" style={{ marginBottom: 28 }} />
          <div style={{ fontSize: 14, color: MID, lineHeight: 2.1, whiteSpace: "pre-wrap" }}>{about.intro}</div>
        </div>
      </div>
      <hr className="divider" style={{ marginBottom: 28 }} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="https://line.me/R/ti/p/@367xhgyr" target="_blank" rel="noopener noreferrer"><button className="pb">LINE 社群</button></a>
        <a href="https://line.me/R/ti/p/@367xhgyr" target="_blank" rel="noopener noreferrer"><button className="pg">LINE 官方帳號</button></a>
        <a href="https://www.instagram.com/every_dollars/" target="_blank" rel="noopener noreferrer"><button className="pg">Instagram</button></a>
        <a href="mailto:everydollars17@gmail.com"><button className="pg">合作信箱</button></a>
      </div>
    </div>
  );
}

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
    <div style={{ maxWidth: 1020, margin: "0 auto", padding: "48px 20px" }} className="page-pad">
      <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div><p style={{ fontSize: 11, letterSpacing: "3px", color: O, marginBottom: 10 }}>SHOP</p><h1 style={{ fontSize: 24, fontWeight: 300 }}>商品</h1></div>
        {isAdmin && <button className="pb" onClick={startAdd}>＋ 新增商品</button>}
      </div>
      {editing && (
        <div style={{ background: O2, padding: "22px 20px", marginBottom: 32, borderLeft: `3px solid ${O}` }}>
          <p style={{ fontSize: 12, letterSpacing: "1px", marginBottom: 14, color: MID }}>{editing === "new" ? "新增商品" : "編輯商品"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }} className="two-col">
            <input placeholder="商品名稱" value={form.name} onChange={sf("name")} />
            <select value={form.type} onChange={sf("type")}><option value="digital">數位商品</option><option value="physical">實體商品</option></select>
            <input placeholder="價格（如 NT$ 299）" value={form.price} onChange={sf("price")} />
            <input placeholder="購買連結" value={form.url} onChange={sf("url")} />
          </div>
          <textarea placeholder="商品說明" value={form.desc} onChange={sf("desc")} style={{ marginBottom: 10, minHeight: 60 }} />
          <input placeholder="封面圖片網址（選填）" value={form.img} onChange={sf("img")} style={{ marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.name.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
        </div>
      )}
      <div style={{ display: "grid", gap: "1px", background: BDR, gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))" }} className="grid-auto">
        {products.map((p, idx) => (
          <div key={p.id} style={{ background: WHITE, padding: "22px 20px", position: "relative" }}>
            {isAdmin && <OrderBtns idx={idx} total={products.length} onMove={move} style={{ position: "absolute", top: 10, right: 10 }} />}
            <div style={{ height: 110, background: "#EDE8E2", marginBottom: 14, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {p.img ? <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 11, color: LIGHT, letterSpacing: "1px" }}>{p.type === "digital" ? "DIGITAL" : "PHYSICAL"}</span>}
            </div>
            <p style={{ fontSize: 11, color: LIGHT, letterSpacing: ".5px", marginBottom: 5 }}>{p.type === "digital" ? "數位商品" : "實體商品"}</p>
            <h3 style={{ fontSize: 14, fontWeight: 400, marginBottom: 7 }}>{p.name}</h3>
            <p style={{ fontSize: 13, color: MID, lineHeight: 1.8, marginBottom: 12 }}>{p.desc}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 14, color: O }}>{p.price}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "6px 12px" }}>購買 →</button></a>}
                {isAdmin && <><button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => startEdit(p)}>編輯</button><button className="pg" style={{ fontSize: 11, padding: "5px 10px", color: "#B03A2E", borderColor: "#B03A2E" }} onClick={() => del(p.id)}>刪除</button></>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IG({ igPosts, setIgPosts, isAdmin }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", url: "", thumb: "" });
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const startAdd = () => { setForm({ title: "", url: "", thumb: "" }); setEditing("new"); };
  const startEdit = p => { setForm({ ...p }); setEditing(p.id); };
  const save = () => { if (editing === "new") setIgPosts(prev => [...prev, { ...form, id: Date.now() }]); else setIgPosts(prev => prev.map(p => p.id === editing ? { ...p, ...form } : p)); setEditing(null); };
  const del = id => { if (confirm("確定刪除？")) setIgPosts(prev => prev.filter(p => p.id !== id)); };
  const move = (idx, dir) => setIgPosts(prev => moveItem(prev, idx, dir));
  return (
    <div style={{ maxWidth: 1020, margin: "0 auto", padding: "48px 20px" }} className="page-pad">
      <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: "3px", color: O, marginBottom: 10 }}>INSTAGRAM</p>
          <h1 style={{ fontSize: 24, fontWeight: 300 }}>最新消息</h1>
          <p style={{ fontSize: 12, color: LIGHT, marginTop: 6 }}>點擊影片前往 Instagram 觀看</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin && <button className="pb" onClick={startAdd}>＋ 新增</button>}
          <a href="https://www.instagram.com/every_dollars/" target="_blank" rel="noopener noreferrer"><button className="pg">Instagram 主頁 →</button></a>
        </div>
      </div>
      {editing && (
        <div style={{ background: O2, padding: "22px 20px", marginBottom: 32, borderLeft: `3px solid ${O}` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            <input placeholder="貼文標題 / 說明" value={form.title} onChange={sf("title")} />
            <input placeholder="Instagram 貼文或影片連結" value={form.url} onChange={sf("url")} />
            <input placeholder="縮圖圖片網址（選填）" value={form.thumb} onChange={sf("thumb")} />
          </div>
          <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.title.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
        </div>
      )}
      <div style={{ display: "grid", gap: "1px", background: BDR, gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }} className="grid-auto">
        {igPosts.map((p, idx) => (
          <div key={p.id} style={{ background: WHITE }}>
            <a href={p.url || "https://www.instagram.com/every_dollars/"} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
              <div style={{ aspectRatio: "1", background: "#EDE8E2", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.thumb ? <img src={p.thumb} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 11, color: LIGHT, letterSpacing: "1px" }}>IG</span>}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(24,23,15,.2)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: "#fff", fontSize: 20, opacity: .9 }}>▶</span>
                </div>
              </div>
            </a>
            <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: CHAR, flex: 1 }}>{p.title}</p>
              {isAdmin && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                  <OrderBtns idx={idx} total={igPosts.length} onMove={move} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 11, color: O, cursor: "pointer" }} onClick={() => startEdit(p)}>編輯</span>
                    <span style={{ fontSize: 11, color: "#B03A2E", cursor: "pointer" }} onClick={() => del(p.id)}>刪除</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Goods({ goods, setGoods, isAdmin }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", brand: "", desc: "", url: "", img: "", active: true });
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const startAdd = () => { setForm({ name: "", brand: "", desc: "", url: "", img: "", active: true }); setEditing("new"); };
  const startEdit = p => { setForm({ ...p }); setEditing(p.id); };
  const save = () => { if (editing === "new") setGoods(prev => [...prev, { ...form, id: Date.now() }]); else setGoods(prev => prev.map(p => p.id === editing ? { ...p, ...form } : p)); setEditing(null); };
  const del = id => { if (confirm("確定刪除？")) setGoods(prev => prev.filter(p => p.id !== id)); };
  const active = goods.filter(g => g.active);
  const move = (idx, dir) => setGoods(prev => {
    const act = prev.filter(g => g.active);
    const inact = prev.filter(g => !g.active);
    return [...moveItem(act, idx, dir), ...inact];
  });
  return (
    <div style={{ maxWidth: 1020, margin: "0 auto", padding: "48px 20px" }} className="page-pad">
      <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div><p style={{ fontSize: 11, letterSpacing: "3px", color: O, marginBottom: 10 }}>FAVORITES</p><h1 style={{ fontSize: 24, fontWeight: 300 }}>推薦好物</h1></div>
        {isAdmin && <button className="pb" onClick={startAdd}>＋ 新增</button>}
      </div>
      {editing && (
        <div style={{ background: O2, padding: "22px 20px", marginBottom: 32, borderLeft: `3px solid ${O}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }} className="two-col">
            <input placeholder="商品名稱" value={form.name} onChange={sf("name")} />
            <input placeholder="品牌 / 來源" value={form.brand} onChange={sf("brand")} />
            <input placeholder="購買或團購連結" value={form.url} onChange={sf("url")} />
            <input placeholder="圖片網址（選填）" value={form.img} onChange={sf("img")} />
          </div>
          <textarea placeholder="推薦說明" value={form.desc} onChange={sf("desc")} style={{ marginBottom: 10, minHeight: 60 }} />
          <label style={{ fontSize: 12, color: MID, display: "flex", gap: 8, alignItems: "center", marginBottom: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} style={{ width: "auto" }} />上架顯示
          </label>
          <div style={{ display: "flex", gap: 10 }}><button className="pb" onClick={save} disabled={!form.name.trim()}>儲存</button><button className="pg" onClick={() => setEditing(null)}>取消</button></div>
        </div>
      )}
      {active.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", borderTop: `1px solid ${BDR}` }}>
          <p style={{ fontSize: 13, color: LIGHT, lineHeight: 2.4 }}>88La 正在尋找好物中<br /><span style={{ fontSize: 11 }}>有合適的商品會在這裡和你分享</span></p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1px", background: BDR, gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))" }} className="grid-auto">
          {active.map((p, idx) => (
            <div key={p.id} style={{ background: WHITE, padding: "20px", position: "relative" }}>
              {isAdmin && <OrderBtns idx={idx} total={active.length} onMove={move} style={{ position: "absolute", top: 10, right: 10 }} />}
              {p.img && <div style={{ height: 110, marginBottom: 12, overflow: "hidden", background: "#EDE8E2" }}><img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
              {p.brand && <p style={{ fontSize: 11, color: LIGHT, letterSpacing: ".5px", marginBottom: 4 }}>{p.brand}</p>}
              <h3 style={{ fontSize: 14, fontWeight: 400, marginBottom: 6 }}>{p.name}</h3>
              <p style={{ fontSize: 13, color: MID, lineHeight: 1.8, marginBottom: 12 }}>{p.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer"><button className="pb" style={{ fontSize: 12, padding: "6px 12px" }}>查看 →</button></a>}
                {isAdmin && <div style={{ display: "flex", gap: 6 }}><button className="pg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => startEdit(p)}>編輯</button><button className="pg" style={{ fontSize: 11, padding: "5px 10px", color: "#B03A2E", borderColor: "#B03A2E" }} onClick={() => del(p.id)}>刪除</button></div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {isAdmin && goods.filter(g => !g.active).length > 0 && (
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 11, color: LIGHT, marginBottom: 10 }}>未上架</p>
          {goods.filter(g => !g.active).map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${BDR}`, alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 13, color: LIGHT }}>{p.name}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="pg" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => startEdit(p)}>編輯</button>
                <button className="pg" style={{ fontSize: 11, padding: "4px 10px", color: "#B03A2E", borderColor: "#B03A2E" }} onClick={() => del(p.id)}>刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [articles, setArticles] = useLS("ed_art", INIT_ARTICLES);
  const [products, setProducts] = useLS("ed_prod", INIT_PRODUCTS);
  const [igPosts, setIgPosts] = useLS("ed_ig", INIT_IG);
  const [goods, setGoods] = useLS("ed_goods", []);
  const [about, setAbout] = useLS("ed_about", INIT_ABOUT);
  const [siteTitle, setSiteTitle] = useLS("ed_title", "理財觀點與讀書筆記");
  const [tags, setTags] = useLS("ed_tags", DEFAULT_TAGS);
  const [page, setPage] = useState("about");
  const [id, setId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const article = articles.find(a => a.id === id);
  const nav = p => { setPage(p); setId(null); };
  const saveArticle = d => {
    const nid = Math.max(...articles.map(a => a.id), 0) + 1;
    setArticles(prev => [...prev, { id: nid, ...d, excerpt: d.excerpt || (d.content.slice(0, 80) + "⋯"), views: 0, comments: [], date: new Date().toISOString().slice(0, 10) }]);
    setPage("home");
  };
  return (
    <div style={{ minHeight: "100vh", background: WHITE }}>
      <Nav page={page} setPage={nav} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      {page === "about" && <About about={about} setAbout={setAbout} isAdmin={isAdmin} />}
      {page === "ig" && <IG igPosts={igPosts} setIgPosts={setIgPosts} isAdmin={isAdmin} />}
      {page === "shop" && <Shop products={products} setProducts={setProducts} isAdmin={isAdmin} />}
      {page === "home" && <Home articles={articles} setPage={setPage} setId={setId} setArticles={setArticles} isAdmin={isAdmin} siteTitle={siteTitle} setSiteTitle={setSiteTitle} tags={tags} setTags={setTags} />}
      {page === "article" && article && <Article article={article} onBack={() => setPage("home")} setArticles={setArticles} isAdmin={isAdmin} tags={tags} />}
      {page === "write" && isAdmin && <Write onSave={saveArticle} onBack={() => setPage("home")} tags={tags} />}
      {page === "goods" && <Goods goods={goods} setGoods={setGoods} isAdmin={isAdmin} />}
      <Footer />
    </div>
  );
}