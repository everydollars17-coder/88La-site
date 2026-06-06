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

// 配色
const O = "#C85A14";
const O2 = "#FDF0E8";
const NAVY = "#F7BC9E";
const NAVY2 = "#F4A57A";
const NAV_TEXT = "#3D1A0A";
const NAV_TEXT_SUB = "rgba(61,26,10,.55)";
const WHITE = "#FFFFFF";
const GRAY = "#F8F8F8";
const CHAR = "#1A1A1A";
const MID = "#6B6B6B";
const LIGHT = "#ADADAD";

const GF = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Inter:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');`;

const css = `
${GF}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans TC','Inter',sans-serif;background:${WHITE};color:${CHAR};-webkit-font-smoothing:antialiased;}
:lang(en), .en, [data-en] { font-family: 'Inter', sans-serif; }
h1,h2,h3,p,span,div { font-family: 'Noto Sans TC', 'Inter', sans-serif; }
a{text-decoration:none;color:inherit;}
input,textarea,select{font-family:inherit;font-size:14px;border:none;border-bottom:1px solid #D0D5DA;background:transparent;padding:10px 0;outline:none;width:100%;color:${CHAR};}
input:focus,textarea:focus,select:focus{border-bottom-color:${O};}
textarea{resize:vertical;min-height:120px;line-height:1.9;}
button{font-family:inherit;cursor:pointer;border:none;}
.pb{background:${O};color:#fff;padding:12px 28px;font-size:13px;font-weight:500;letter-spacing:.5px;}
.pb:hover{background:#A04510;}
.pb:disabled{opacity:.4;cursor:default;}
.pbn{background:${NAVY};color:#fff;padding:12px 28px;font-size:13px;font-weight:500;letter-spacing:.5px;}
.pbn:hover{background:${NAVY2};}
.pg{background:transparent;border:1px solid #D0D5DA;padding:11px 24px;font-size:13px;color:${MID};}
.pg:hover{border-color:${CHAR};color:${CHAR};}
.tag{display:inline-block;background:${O2};color:${O};font-size:11px;padding:3px 10px;letter-spacing:.5px;font-weight:500;}
.tagn{display:inline-block;background:${NAVY};color:#fff;font-size:11px;padding:3px 10px;letter-spacing:.5px;font-weight:500;}
.ordbtn{background:transparent;border:1px solid #D0D5DA;color:${LIGHT};font-size:11px;padding:2px 6px;line-height:1;}
.ordbtn:hover{border-color:${O};color:${O};}
.card{background:${WHITE};padding:32px;}
.card:hover{background:${GRAY};}

@media(max-width:768px){
  .nav-links{display:none!important;}
  .mob-menu{display:flex!important;}
  .hero-title{font-size:36px!important;}
  .hero-sub{font-size:14px!important;}
  .page-wrap{padding:40px 20px!important;}
  .grid2{grid-template-columns:1fr!important;}
  .grid3{grid-template-columns:1fr!important;}
  .grid-ig{grid-template-columns:1fr 1fr!important;}
  .about-grid{grid-template-columns:1fr!important;}
  .about-img{aspect-ratio:4/3!important;}
  .banner-h{height:420px!important;}
  .hide-mob{display:none!important;}
}
@media(min-width:769px){
  .mob-menu{display:none!important;}
  .mob-panel{display:none!important;}
}
`;

const DEFAULT_TAGS = ["理財觀念","信用卡","記帳","投資","讀書筆記","生活財務","其他"];

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
    img: "",
    bannerImg: "",
    bannerTitle: "理財，是為了讓生活更自由。",
    bannerSub: "88La 帶你用最真實的方式，重新認識金錢。",
    bannerBtn1: "加入 LINE 社群",
    bannerBtn2: "追蹤 Instagram"
  },
  articles: [
    {id:1,title:"為什麼你記帳卻還是存不到錢？",date:"2026-05-01",tag:"理財觀念",excerpt:"很多人以為記帳就能存到錢，但其實記帳只是照妖鏡，照出你花了哪些錢，卻不會自動幫你存錢。",content:"很多人問我：「Barbara，我有記帳，但怎麼還是存不到錢？」\n\n這個問題我自己以前也有過。記帳本寫得密密麻麻，每個月花了多少一清二楚，但帳戶餘額還是在月底趨近於零。\n\n後來我才發現：記帳只是照妖鏡，不是存錢器。\n\n它能告訴你錢去哪了，但它不會幫你把錢留下來。\n\n真正讓我開始存到錢的方法，是把順序倒過來：先存，再花。\n\n發薪日當天，先把要存的錢轉出去。剩下的才是這個月可以動用的生活費。",views:312,comments:[{name:"8友小美",text:"這個觀念真的打到我了！",date:"2026-05-03"}]},
    {id:2,title:"信用卡不是壞東西，是你沒搞清楚規則",date:"2026-05-15",tag:"信用卡",excerpt:"很多人怕信用卡，覺得它會讓自己亂花錢。但其實信用卡是中性工具，問題在於你有沒有掌控它。",content:"信用卡本身是中性的，問題從來都不是卡，是使用的方式。\n\n把信用卡的預算視同現金在管理。刷了就登記，不要等帳單才知道。設定自動扣款，永遠不繳最低應繳。",views:198,comments:[]}
  ],
  products:[
    {id:1,name:"理財自動導航器 2.0",type:"digital",price:"NT$ 299",desc:"Google Sheets 理財模板，自動模式偵測，適合薪水族。",url:"https://portaly.cc/every_dollars",img:""},
    {id:2,name:"88La 存錢袋",type:"physical",price:"NT$ 180",desc:"手工製作信封袋，現金分類存錢用。",url:"",img:""}
  ],
  igPosts:[
    {id:1,title:"假記帳的陷阱你中了嗎？",url:"https://www.instagram.com/every_dollars/",thumb:""},
    {id:2,title:"存錢袋使用教學｜現金分配法",url:"https://www.instagram.com/every_dollars/",thumb:""}
  ],
  goods:[],
  tags: DEFAULT_TAGS
};

const OLD_KEYS = ["ed_art","ed_prod","ed_ig","ed_goods","ed_about","ed_title","ed_tags"];
OLD_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch {} });

async function fbGet(key) {
  try { const s = await getDoc(doc(db,"site",key)); return s.exists()?s.data().value:null; } catch { return null; }
}
async function fbSet(key,value) {
  try { await setDoc(doc(db,"site",key),{value}); } catch {}
}

function useFS(key,def) {
  const [v,setV] = useState(def);
  const [loaded,setLoaded] = useState(false);
  useEffect(() => { fbGet(key).then(val => { if(val!==null) setV(val); setLoaded(true); }); },[key]);
  const set = async fn => { const n=typeof fn==="function"?fn(v):fn; setV(n); await fbSet(key,n); };
  return [v,set,loaded];
}

function moveItem(arr,idx,dir) {
  const a=[...arr]; const to=idx+dir;
  if(to<0||to>=a.length) return a;
  [a[idx],a[to]]=[a[to],a[idx]]; return a;
}

function OrdBtns({idx,total,onMove,style={}}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:2,...style}}>
      <button className="ordbtn" onClick={e=>{e.stopPropagation();onMove(idx,-1);}} disabled={idx===0}>▲</button>
      <button className="ordbtn" onClick={e=>{e.stopPropagation();onMove(idx,1);}} disabled={idx===total-1}>▼</button>
    </div>
  );
}

const NAV = [["about","關於我"],["ig","最新消息"],["shop","商品"],["home","文章"],["goods","推薦好物"]];

function Nav({page,setPage,isAdmin,setIsAdmin}) {
  const [showL,setShowL]=useState(false);
  const [pw,setPw]=useState(""); const [err,setErr]=useState(false);
  const [mob,setMob]=useState(false);
  const login=()=>{if(pw===ADMIN_PW){setIsAdmin(true);setShowL(false);setPw("");setErr(false);}else setErr(true);};
  const go=p=>{setPage(p);setMob(false);};
  return(
    <>
      <style>{css}</style>
      <header style={{background:NAVY,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 32px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span onClick={()=>go("home")} style={{fontFamily:"Inter",fontWeight:700,fontSize:16,letterSpacing:"2px",color:WHITE,cursor:"pointer"}}>88La</span>
          <nav className="nav-links" style={{display:"flex",gap:32,alignItems:"center"}}>
            {NAV.map(([k,l])=>(
              <span key={k} onClick={()=>go(k)} style={{fontSize:12,letterSpacing:"1px",color:page===k?NAV_TEXT:NAV_TEXT_SUB,cursor:"pointer",fontWeight:page===k?"700":"400",borderBottom:page===k?`2px solid ${NAV_TEXT}`:"none",paddingBottom:2}}>{l}</span>
            ))}
            {isAdmin
              ?<><span onClick={()=>go("write")} style={{fontSize:12,color:O,cursor:"pointer"}}>＋ 撰文</span><span onClick={()=>setIsAdmin(false)} style={{fontSize:11,color:"rgba(255,255,255,.4)",cursor:"pointer",marginLeft:8}}>登出</span></>
              :<span onClick={()=>setShowL(true)} style={{fontSize:11,color:"rgba(255,255,255,.4)",cursor:"pointer"}}>後台</span>
            }
          </nav>
          <button className="mob-menu" onClick={()=>setMob(p=>!p)} style={{background:"none",border:"none",color:WHITE,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center"}}>
            {mob?"✕":"☰"}
          </button>
        </div>
        {mob&&(
          <div className="mob-panel" style={{background:NAVY2,display:"flex",flexDirection:"column"}}>
            {NAV.map(([k,l])=>(
              <span key={k} onClick={()=>go(k)} style={{fontSize:15,padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,.08)",color:page===k?O:WHITE,cursor:"pointer"}}>{l}</span>
            ))}
            {isAdmin
              ?<><span onClick={()=>go("write")} style={{fontSize:15,padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,.08)",color:O,cursor:"pointer"}}>＋ 撰文</span><span onClick={()=>{setIsAdmin(false);setMob(false);}} style={{fontSize:13,padding:"14px 24px",color:"rgba(255,255,255,.4)",cursor:"pointer"}}>登出</span></>
              :<span onClick={()=>{setShowL(true);setMob(false);}} style={{fontSize:13,padding:"14px 24px",color:"rgba(255,255,255,.4)",cursor:"pointer"}}>後台登入</span>
            }
          </div>
        )}
      </header>
      {showL&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px"}}>
          <div style={{background:WHITE,padding:40,width:"100%",maxWidth:360}}>
            <p style={{fontSize:13,letterSpacing:"2px",color:NAVY,marginBottom:24,fontWeight:500}}>後台登入</p>
            <input type="password" placeholder="密碼" value={pw} onChange={e=>{setPw(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&login()} style={{marginBottom:20,fontSize:15}} />
            {err&&<p style={{fontSize:12,color:"#C0392B",marginBottom:12}}>密碼錯誤</p>}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button className="pb" style={{flex:1}} onClick={login}>登入</button>
              <button className="pg" onClick={()=>{setShowL(false);setPw("");setErr(false);}}>取消</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Footer({links,footerTagline,setFooterTagline,isAdmin}) {
  const l=links||DEFAULTS.links;
  const [editing,setEditing]=useState(false);
  const [tmp,setTmp]=useState(footerTagline||DEFAULTS.footerTagline);
  const save=()=>{setFooterTagline(tmp);setEditing(false);};
  return(
    <footer style={{background:NAVY,padding:"28px 32px"}}>
      <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
          <p style={{fontFamily:"Inter",fontWeight:700,fontSize:14,letterSpacing:"2px",color:NAV_TEXT}}>88La</p>
          {editing?(
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input value={tmp} onChange={e=>setTmp(e.target.value)} style={{fontSize:12,color:NAV_TEXT,borderBottom:`1px solid ${NAV_TEXT}`,background:"transparent",width:240,padding:"2px 0"}} />
              <button onClick={save} style={{background:O,color:WHITE,border:"none",padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>儲存</button>
              <button onClick={()=>setEditing(false)} style={{background:"transparent",color:NAV_TEXT,border:`1px solid ${NAV_TEXT}`,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>取消</button>
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <p style={{fontSize:12,color:NAV_TEXT}}>{footerTagline||DEFAULTS.footerTagline}</p>
              {isAdmin&&<span onClick={()=>{setTmp(footerTagline||DEFAULTS.footerTagline);setEditing(true);}} style={{fontSize:11,color:NAV_TEXT_SUB,cursor:"pointer",textDecoration:"underline"}}>編輯</span>}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
          {[[l.lineOfficial,"LINE 官方帳號"],[l.instagram,"Instagram"],["mailto:"+l.email,"合作信箱"]].map(([h,label])=>(
            <a key={label} href={h} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:NAV_TEXT,fontWeight:500}}>{label}</a>
          ))}
        </div>
      </div>
      <div style={{maxWidth:1100,margin:"10px auto 0",paddingTop:12,borderTop:`1px solid rgba(61,26,10,.15)`}}>
        <p style={{fontSize:11,color:NAV_TEXT_SUB}}>© 2026 88La · every_dollars</p>
      </div>
    </footer>
  );
}

function Hero({about,isAdmin,setAbout,links}) {
  const l=links||DEFAULTS.links;
  const [editBanner,setEditBanner]=useState(false);
  const [tmp,setTmp]=useState(about);
  const save=()=>{setAbout(tmp);setEditBanner(false);};
  if(editBanner) return(
    <div style={{padding:"48px 32px",maxWidth:600,margin:"0 auto"}}>
      <p style={{fontSize:11,letterSpacing:"2px",color:O,marginBottom:24}}>編輯 Banner</p>
      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        <div><p style={{fontSize:12,color:MID,marginBottom:8}}>背景圖片網址</p><input placeholder="https://..." value={tmp.bannerImg||""} onChange={e=>setTmp(p=>({...p,bannerImg:e.target.value}))} /></div>
        <div><p style={{fontSize:12,color:MID,marginBottom:8}}>大標題</p><input value={tmp.bannerTitle||""} onChange={e=>setTmp(p=>({...p,bannerTitle:e.target.value}))} /></div>
        <div><p style={{fontSize:12,color:MID,marginBottom:8}}>副標題</p><input value={tmp.bannerSub||""} onChange={e=>setTmp(p=>({...p,bannerSub:e.target.value}))} /></div>
        <div><p style={{fontSize:12,color:MID,marginBottom:8}}>按鈕一文字</p><input value={tmp.bannerBtn1||"加入 LINE 社群"} onChange={e=>setTmp(p=>({...p,bannerBtn1:e.target.value}))} /></div>
        <div><p style={{fontSize:12,color:MID,marginBottom:8}}>按鈕一連結（LINE 社群）</p><input placeholder="https://line.me/..." value={tmp.bannerLink1||""} onChange={e=>setTmp(p=>({...p,bannerLink1:e.target.value}))} /></div>
        <div><p style={{fontSize:12,color:MID,marginBottom:8}}>按鈕二文字</p><input value={tmp.bannerBtn2||"追蹤 Instagram"} onChange={e=>setTmp(p=>({...p,bannerBtn2:e.target.value}))} /></div>
        <div><p style={{fontSize:12,color:MID,marginBottom:8}}>按鈕二連結（Instagram）</p><input placeholder="https://www.instagram.com/..." value={tmp.bannerLink2||""} onChange={e=>setTmp(p=>({...p,bannerLink2:e.target.value}))} /></div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:28}}><button className="pb" onClick={save}>儲存</button><button className="pg" onClick={()=>setEditBanner(false)}>取消</button></div>
    </div>
  );
  const bannerImg=about.bannerImg||"";
  const bannerTitle=about.bannerTitle||"理財，是為了讓生活更自由。";
  const bannerSub=about.bannerSub||"88La 帶你用最真實的方式，重新認識金錢。";
  const bannerBtn1=about.bannerBtn1||"加入 LINE 社群";
  const bannerBtn2=about.bannerBtn2||"追蹤 Instagram";
  const bannerLink1=about.bannerLink1||l.lineCommunity;
  const bannerLink2=about.bannerLink2||l.instagram;
  return(
    <div className="banner-h" style={{height:560,background:bannerImg?`linear-gradient(rgba(44,44,44,.6),rgba(44,44,44,.6)) center/cover, url('${bannerImg}') center/cover no-repeat`:"#EBEBEB",display:"flex",alignItems:"center",position:"relative"}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 32px",width:"100%"}}>
        <p style={{fontSize:12,letterSpacing:"3px",color:O,marginBottom:20,fontWeight:500}}>88La · PERSONAL FINANCE</p>
        <h1 className="hero-title" style={{fontSize:52,fontWeight:700,color:bannerImg?WHITE:CHAR,lineHeight:1.2,marginBottom:20,maxWidth:600}}>{bannerTitle}</h1>
        <p className="hero-sub" style={{fontSize:16,color:bannerImg?"rgba(255,255,255,.8)":MID,marginBottom:36,maxWidth:480,lineHeight:1.8}}>{bannerSub}</p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <a href={bannerLink1} target="_blank" rel="noopener noreferrer"><button className="pb">{bannerBtn1}</button></a>
          <a href={bannerLink2} target="_blank" rel="noopener noreferrer"><button style={{background:bannerImg?"rgba(255,255,255,.15)":"transparent",color:bannerImg?WHITE:CHAR,border:`1px solid ${bannerImg?"rgba(255,255,255,.4)":"#D0D0D0"}`,padding:"11px 24px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{bannerBtn2}</button></a>
        </div>
      </div>
      {isAdmin&&<button onClick={()=>{setTmp(about);setEditBanner(true);}} style={{position:"absolute",top:20,right:20,background:"rgba(200,90,20,.9)",color:WHITE,border:"none",padding:"8px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>編輯 Banner</button>}
    </div>
  );
}

function Home({articles,setPage,setId,setArticles,isAdmin,siteTitle,setSiteTitle,tags,setTags,about,setAbout,links}) {
  const [filter,setFilter]=useState("全部");
  const [editTitle,setEditTitle]=useState(false);
  const [tmpTitle,setTmpTitle]=useState(siteTitle);
  const [editTags,setEditTags]=useState(false);
  const [newTag,setNewTag]=useState("");
  const filtered=articles.filter(a=>filter==="全部"||a.tag===filter);
  const open=id=>{setArticles(prev=>prev.map(a=>a.id===id?{...a,views:a.views+1}:a));setId(id);setPage("article");};
  const addTag=()=>{const t=newTag.trim();if(t&&!tags.includes(t))setTags(prev=>[...prev,t]);setNewTag("");};
  const delTag=t=>{if(confirm("確定刪除標籤「"+t+"」？"))setTags(prev=>prev.filter(x=>x!==t));};
  const moveA=(idx,dir)=>setArticles(prev=>{
    const a=[...prev];const fi=filtered[idx];const ri=a.findIndex(x=>x.id===fi.id);const ni=ri+dir;
    if(ni<0||ni>=a.length)return prev;[a[ri],a[ni]]=[a[ni],a[ri]];return a;
  });
  return(
    <div>
      <Hero about={about} isAdmin={isAdmin} setAbout={setAbout} links={links} />
      <div style={{maxWidth:1100,margin:"0 auto",padding:"80px 32px"}} className="page-wrap">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:16,marginBottom:48}}>
          <div>
            <p style={{fontSize:11,letterSpacing:"3px",color:O,marginBottom:12,fontWeight:500}}>JOURNAL</p>
            {editTitle?(
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <input value={tmpTitle} onChange={e=>setTmpTitle(e.target.value)} style={{fontSize:24,fontWeight:700,flex:1,minWidth:200}} />
                <button className="pb" style={{fontSize:12,padding:"8px 16px"}} onClick={()=>{setSiteTitle(tmpTitle);setEditTitle(false);}}>儲存</button>
                <button className="pg" style={{fontSize:12}} onClick={()=>{setTmpTitle(siteTitle);setEditTitle(false);}}>取消</button>
              </div>
            ):(
              <div style={{display:"flex",gap:16,alignItems:"baseline",flexWrap:"wrap"}}>
                <h2 style={{fontSize:32,fontWeight:700,color:NAVY}}>{siteTitle}</h2>
                {isAdmin&&<span style={{fontSize:12,color:O,cursor:"pointer"}} onClick={()=>{setTmpTitle(siteTitle);setEditTitle(true);}}>編輯</span>}
              </div>
            )}
          </div>
          {isAdmin&&!editTitle&&<button className="pb" onClick={()=>setPage("write")}>＋ 新增文章</button>}
        </div>

        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
          {["全部",...tags].map(t=>(
            <span key={t} onClick={()=>setFilter(t)} style={{fontSize:12,padding:"6px 16px",cursor:"pointer",background:filter===t?NAVY:GRAY,color:filter===t?WHITE:MID,fontWeight:filter===t?"500":"400"}}>{t}</span>
          ))}
          {isAdmin&&<span onClick={()=>setEditTags(p=>!p)} style={{fontSize:12,color:O,cursor:"pointer",marginLeft:8}}>{editTags?"關閉":"管理標籤"}</span>}
        </div>

        {isAdmin&&editTags&&(
          <div style={{background:O2,padding:"20px 24px",marginBottom:32}}>
            <p style={{fontSize:11,letterSpacing:"1px",color:MID,marginBottom:14}}>標籤管理</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
              {tags.map(t=>(
                <span key={t} style={{display:"inline-flex",alignItems:"center",gap:6,background:GRAY,padding:"4px 12px",fontSize:12,color:MID}}>
                  {t}<span onClick={()=>delTag(t)} style={{cursor:"pointer",color:LIGHT,fontSize:14}}>×</span>
                </span>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <input placeholder="新增標籤" value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTag()} style={{maxWidth:200,border:"1px solid #D0D5DA",padding:"8px 12px",background:WHITE}} />
              <button className="pb" style={{fontSize:12,padding:"8px 16px"}} onClick={addTag} disabled={!newTag.trim()}>新增</button>
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:2}} className="grid3">
          {filtered.map((a,idx)=>(
            <div key={a.id} className="card" onClick={()=>open(a.id)} style={{cursor:"pointer",position:"relative",padding:"36px 32px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,alignItems:"flex-start"}}>
                <span className="tag">{a.tag}</span>
                <span style={{fontSize:11,color:LIGHT}}>{a.date}</span>
              </div>
              <h3 style={{fontSize:18,fontWeight:500,lineHeight:1.5,marginBottom:12,color:NAVY}}>{a.title}</h3>
              <p style={{fontSize:14,color:MID,lineHeight:1.9,marginBottom:20}}>{a.excerpt}</p>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:O,fontWeight:500}}>閱讀全文 →</span>
                <span style={{fontSize:11,color:LIGHT}}>瀏覽 {a.views}</span>
              </div>
              {isAdmin&&<OrdBtns idx={idx} total={filtered.length} onMove={moveA} style={{position:"absolute",top:12,right:12}} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Article({article,onBack,setArticles,isAdmin,tags,links}) {
  const [name,setName]=useState(""); const [text,setText]=useState(""); const [copied,setCopied]=useState(false);
  const [editing,setEditing]=useState(false);
  const [ed,setEd]=useState({title:article.title,tag:article.tag,excerpt:article.excerpt,content:article.content});
  const l=links||DEFAULTS.links;
  const submit=()=>{if(!text.trim())return;const c={name:name.trim()||"匿名",text:text.trim(),date:new Date().toISOString().slice(0,10)};setArticles(prev=>prev.map(a=>a.id===article.id?{...a,comments:[...a.comments,c]}:a));setName("");setText("");};
  const copy=()=>{navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const del=()=>{if(confirm("確定刪除此文章？")){setArticles(prev=>prev.filter(a=>a.id!==article.id));onBack();}};
  const saveEdit=()=>{setArticles(prev=>prev.map(a=>a.id===article.id?{...a,...ed}:a));setEditing(false);};
  if(editing) return(
    <div style={{maxWidth:740,margin:"0 auto",padding:"60px 32px"}} className="page-wrap">
      <button className="pg" onClick={()=>setEditing(false)} style={{marginBottom:32}}>← 取消</button>
      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        <input placeholder="標題" value={ed.title} onChange={e=>setEd(p=>({...p,title:e.target.value}))} style={{fontSize:20,fontWeight:500}} />
        <select value={ed.tag} onChange={e=>setEd(p=>({...p,tag:e.target.value}))} style={{border:"1px solid #D0D5DA",padding:"10px 12px",background:WHITE}}>{tags.map(t=><option key={t}>{t}</option>)}</select>
        <input placeholder="摘要" value={ed.excerpt} onChange={e=>setEd(p=>({...p,excerpt:e.target.value}))} />
        <textarea placeholder="內文" value={ed.content} onChange={e=>setEd(p=>({...p,content:e.target.value}))} style={{minHeight:360,border:"1px solid #D0D5DA",padding:"12px",background:WHITE}} />
        <div style={{display:"flex",gap:10}}><button className="pb" onClick={saveEdit}>儲存</button><button className="pg" onClick={()=>setEditing(false)}>取消</button></div>
      </div>
    </div>
  );
  return(
    <div>
      <div style={{background:NAVY,padding:"60px 32px 48px"}}>
        <div style={{maxWidth:740,margin:"0 auto"}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",color:WHITE,border:"none",padding:"8px 18px",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:32}}>← 返回</button>
          <span className="tag" style={{marginBottom:16,display:"inline-block"}}>{article.tag}</span>
          <h1 style={{fontSize:32,fontWeight:700,color:WHITE,lineHeight:1.4,marginBottom:16}}>{article.title}</h1>
          <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>{article.date}</span>
            <span style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>瀏覽 {article.views}</span>
            {isAdmin&&<><span style={{fontSize:12,color:O,cursor:"pointer"}} onClick={()=>setEditing(true)}>編輯</span><span style={{fontSize:12,color:"#E74C3C",cursor:"pointer"}} onClick={del}>刪除</span></>}
          </div>
        </div>
      </div>
      <div style={{maxWidth:740,margin:"0 auto",padding:"60px 32px"}} className="page-wrap">
        <div style={{fontSize:16,lineHeight:2.1,color:CHAR,whiteSpace:"pre-wrap",marginBottom:64}}>{article.content}</div>
        <div style={{display:"flex",gap:12,marginBottom:64,flexWrap:"wrap"}}>
          <button className="pg" onClick={copy}>{copied?"✓ 已複製連結":"複製連結"}</button>
          <a href={"https://social-plugins.line.me/lineit/share?url="+encodeURIComponent(window.location.href)} target="_blank" rel="noopener noreferrer"><button className="pg">分享至 LINE</button></a>
        </div>
        <div style={{background:NAVY,padding:"40px 36px",marginBottom:64}}>
          <p style={{fontSize:16,fontWeight:500,color:WHITE,marginBottom:8}}>加入 8友 社群</p>
          <p style={{fontSize:13,color:"rgba(255,255,255,.6)",marginBottom:24,lineHeight:1.8}}>一起聊聊關於錢的事，不說教，只分享。</p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <a href={l.lineCommunity} target="_blank" rel="noopener noreferrer"><button className="pb">LINE 社群</button></a>
            <a href={l.instagram} target="_blank" rel="noopener noreferrer"><button style={{background:"rgba(255,255,255,.15)",color:WHITE,border:"1px solid rgba(255,255,255,.3)",padding:"11px 24px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Instagram</button></a>
          </div>
        </div>
        <p style={{fontSize:11,letterSpacing:"2px",color:MID,marginBottom:28}}>COMMENTS ({article.comments.length})</p>
        <div style={{marginBottom:40}}>
          {article.comments.length===0&&<p style={{fontSize:14,color:LIGHT,padding:"24px 0"}}>還沒有留言，來說說你的想法吧。</p>}
          {article.comments.map((c,i)=>(
            <div key={i} style={{padding:"20px 0",borderBottom:"1px solid #EAECEE"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:4}}>
                <span style={{fontSize:14,fontWeight:500,color:NAVY}}>{c.name}</span>
                <span style={{fontSize:11,color:LIGHT}}>{c.date}</span>
              </div>
              <p style={{fontSize:14,color:MID,lineHeight:1.8}}>{c.text}</p>
            </div>
          ))}
        </div>
        <div style={{background:GRAY,padding:"32px"}}>
          <p style={{fontSize:12,letterSpacing:"1px",color:MID,marginBottom:20}}>留下你的想法</p>
          <input placeholder="暱稱（選填，留空顯示為匿名）" value={name} onChange={e=>setName(e.target.value)} style={{marginBottom:16}} />
          <textarea placeholder="你的留言⋯" value={text} onChange={e=>setText(e.target.value)} style={{marginBottom:20,border:"none",background:"transparent",borderBottom:"1px solid #D0D5DA"}} />
          <button className="pb" onClick={submit} disabled={!text.trim()}>送出留言</button>
        </div>
      </div>
    </div>
  );
}

function Write({onSave,onBack,tags}) {
  const [d,setD]=useState({title:"",tag:tags[0]||"",excerpt:"",content:""});
  const ok=d.title.trim()&&d.content.trim();
  return(
    <div style={{maxWidth:740,margin:"0 auto",padding:"60px 32px"}} className="page-wrap">
      <button className="pg" onClick={onBack} style={{marginBottom:32}}>← 返回</button>
      <p style={{fontSize:11,letterSpacing:"3px",color:O,marginBottom:32,fontWeight:500}}>NEW ARTICLE</p>
      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        <input placeholder="文章標題" value={d.title} onChange={e=>setD(p=>({...p,title:e.target.value}))} style={{fontSize:22,fontWeight:500}} />
        <select value={d.tag} onChange={e=>setD(p=>({...p,tag:e.target.value}))} style={{border:"1px solid #D0D5DA",padding:"10px 12px",background:WHITE}}>{tags.map(t=><option key={t}>{t}</option>)}</select>
        <input placeholder="摘要（顯示在列表，選填）" value={d.excerpt} onChange={e=>setD(p=>({...p,excerpt:e.target.value}))} />
        <textarea placeholder="文章內文（支援換行）" value={d.content} onChange={e=>setD(p=>({...p,content:e.target.value}))} style={{minHeight:360,border:"1px solid #D0D5DA",padding:"12px",background:WHITE}} />
        <div style={{display:"flex",gap:10}}><button className="pb" disabled={!ok} onClick={()=>onSave(d)}>發布</button><button className="pg" onClick={onBack}>取消</button></div>
      </div>
    </div>
  );
}

function About({about,setAbout,isAdmin,links,setLinks}) {
  const [editing,setEditing]=useState(false);
  const [editLinks,setEditLinks]=useState(false);
  const [tmp,setTmp]=useState(about);
  const [tmpL,setTmpL]=useState(links||DEFAULTS.links);
  const l=links||DEFAULTS.links;
  const save=()=>{setAbout(tmp);setEditing(false);};
  const saveLinks=()=>{setLinks(tmpL);setEditLinks(false);};
  if(editing) return(
    <div style={{maxWidth:860,margin:"0 auto",padding:"60px 32px"}} className="page-wrap">
      <button className="pg" onClick={()=>setEditing(false)} style={{marginBottom:32}}>← 取消</button>
      <p style={{fontSize:11,letterSpacing:"3px",color:O,marginBottom:32,fontWeight:500}}>編輯關於我</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32,marginBottom:32}} className="grid2">
        <div style={{background:GRAY,aspectRatio:"3/4",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          {tmp.img?<img src={tmp.img} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="about" />:<span style={{fontSize:12,color:LIGHT}}>封面圖片</span>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <div><p style={{fontSize:12,color:MID,marginBottom:8}}>封面圖片網址</p><input placeholder="https://..." value={tmp.img} onChange={e=>setTmp(p=>({...p,img:e.target.value}))} /></div>
          <div><p style={{fontSize:12,color:MID,marginBottom:8}}>自我介紹</p><textarea value={tmp.intro} onChange={e=>setTmp(p=>({...p,intro:e.target.value}))} style={{minHeight:200}} /></div>
        </div>
      </div>
      <div style={{display:"flex",gap:10}}><button className="pb" onClick={save}>儲存</button><button className="pg" onClick={()=>setEditing(false)}>取消</button></div>
    </div>
  );
  if(editLinks) return(
    <div style={{maxWidth:600,margin:"0 auto",padding:"60px 32px"}} className="page-wrap">
      <button className="pg" onClick={()=>setEditLinks(false)} style={{marginBottom:32}}>← 取消</button>
      <p style={{fontSize:11,letterSpacing:"3px",color:O,marginBottom:32,fontWeight:500}}>連結設定</p>
      <div style={{display:"flex",flexDirection:"column",gap:24}}>
        {[["LINE 社群連結","lineCommunity"],["LINE 官方帳號連結","lineOfficial"],["Instagram 連結","instagram"],["合作信箱","email"]].map(([label,key])=>(
          <div key={key}><p style={{fontSize:12,color:MID,marginBottom:8}}>{label}</p><input value={tmpL[key]} onChange={e=>setTmpL(p=>({...p,[key]:e.target.value}))} /></div>
        ))}
      </div>
      <div style={{display:"flex",gap:10,marginTop:32}}><button className="pb" onClick={saveLinks}>儲存</button><button className="pg" onClick={()=>setEditLinks(false)}>取消</button></div>
    </div>
  );
  return(
    <div>
      <div style={{background:NAVY,padding:"32px 32px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{fontSize:11,letterSpacing:"3px",color:O,marginBottom:8,fontWeight:500}}>ABOUT</p>
            <h1 style={{fontSize:28,fontWeight:700,color:CHAR}}>88La</h1>
            <p style={{fontSize:13,color:MID,marginTop:4}}>@every_dollars · Taiwan</p>
          </div>
          {isAdmin&&(
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setTmpL(l);setEditLinks(true);}} style={{background:"rgba(255,255,255,.15)",color:WHITE,border:"none",padding:"8px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>連結設定</button>
              <button onClick={()=>{setTmp(about);setEditing(true);}} style={{background:O,color:WHITE,border:"none",padding:"8px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>編輯頁面</button>
            </div>
          )}
        </div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"80px 32px"}} className="page-wrap">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"start"}} className="about-grid">
          <div style={{background:GRAY,aspectRatio:"3/4",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}} className="about-img">
            {about.img?<img src={about.img} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="88La" />:<span style={{fontSize:12,color:LIGHT,letterSpacing:"1px"}}>PHOTO</span>}
          </div>
          <div style={{paddingTop:20}}>
            <p style={{fontSize:11,letterSpacing:"3px",color:O,marginBottom:24,fontWeight:500}}>HELLO</p>
            <div style={{fontSize:16,color:MID,lineHeight:2.2,whiteSpace:"pre-wrap",marginBottom:40}}>{about.intro}</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <a href={l.lineCommunity} target="_blank" rel="noopener noreferrer"><button className="pb">LINE 社群</button></a>
              <a href={l.lineOfficial} target="_blank" rel="noopener noreferrer"><button className="pbn">LINE 官方帳號</button></a>
              <a href={l.instagram} target="_blank" rel="noopener noreferrer"><button className="pg">Instagram</button></a>
              <a href={"mailto:"+l.email}><button className="pg">合作信箱</button></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Shop({products,setProducts,isAdmin}) {
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:"",type:"digital",price:"",desc:"",url:"",img:""});
  const sf=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const startAdd=()=>{setForm({name:"",type:"digital",price:"",desc:"",url:"",img:""});setEditing("new");};
  const startEdit=p=>{setForm({...p});setEditing(p.id);};
  const save=()=>{if(editing==="new")setProducts(prev=>[...prev,{...form,id:Date.now()}]);else setProducts(prev=>prev.map(p=>p.id===editing?{...p,...form}:p));setEditing(null);};
  const del=id=>{if(confirm("確定刪除？"))setProducts(prev=>prev.filter(p=>p.id!==id));};
  const move=(idx,dir)=>setProducts(prev=>moveItem(prev,idx,dir));
  return(
    <div>
      <div style={{background:NAVY,padding:"32px 32px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
          <div>
            <p style={{fontSize:11,letterSpacing:"3px",color:O,marginBottom:8,fontWeight:500}}>SHOP</p>
            <h1 style={{fontSize:28,fontWeight:700,color:CHAR}}>商品</h1>
          </div>
          {isAdmin&&<button className="pb" onClick={startAdd}>＋ 新增商品</button>}
        </div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"60px 32px"}} className="page-wrap">
        {editing&&(
          <div style={{background:GRAY,padding:"32px",marginBottom:40}}>
            <p style={{fontSize:12,letterSpacing:"1px",color:MID,marginBottom:20}}>{editing==="new"?"新增商品":"編輯商品"}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}} className="grid2">
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>商品名稱</p><input value={form.name} onChange={sf("name")} /></div>
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>類型</p><select value={form.type} onChange={sf("type")} style={{border:"1px solid #D0D5DA",padding:"10px 12px",background:WHITE,width:"100%"}}><option value="digital">數位商品</option><option value="physical">實體商品</option></select></div>
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>價格</p><input placeholder="NT$ 299" value={form.price} onChange={sf("price")} /></div>
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>購買連結</p><input value={form.url} onChange={sf("url")} /></div>
            </div>
            <div style={{marginBottom:20}}><p style={{fontSize:12,color:MID,marginBottom:8}}>商品說明</p><textarea value={form.desc} onChange={sf("desc")} style={{minHeight:80,border:"1px solid #D0D5DA",padding:"10px",background:WHITE}} /></div>
            <div style={{marginBottom:24}}><p style={{fontSize:12,color:MID,marginBottom:8}}>圖片網址（選填）</p><input value={form.img} onChange={sf("img")} /></div>
            <div style={{display:"flex",gap:10}}><button className="pb" onClick={save} disabled={!form.name.trim()}>儲存</button><button className="pg" onClick={()=>setEditing(null)}>取消</button></div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:2}} className="grid3">
          {products.map((p,idx)=>(
            <div key={p.id} style={{background:GRAY,padding:"0 0 28px",position:"relative"}}>
              {isAdmin&&<OrdBtns idx={idx} total={products.length} onMove={move} style={{position:"absolute",top:12,right:12,zIndex:1}} />}
              <div style={{height:200,background:"#E8EAEC",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24}}>
                {p.img?<img src={p.img} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{fontSize:12,color:LIGHT,letterSpacing:"1px"}}>{p.type==="digital"?"DIGITAL":"PHYSICAL"}</span>}
              </div>
              <div style={{padding:"0 24px"}}>
                <span className={p.type==="digital"?"tag":"tagn"} style={{marginBottom:12,display:"inline-block"}}>{p.type==="digital"?"數位商品":"實體商品"}</span>
                <h3 style={{fontSize:16,fontWeight:500,marginBottom:8,color:O,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.name}</h3>
                <p style={{fontSize:13,color:MID,lineHeight:1.8,marginBottom:16,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",minHeight:60}}>{p.desc}</p>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <span style={{fontSize:16,fontWeight:700,color:O}}>{p.price}</span>
                  <div style={{display:"flex",gap:8}}>
                    {p.url&&<a href={p.url} target="_blank" rel="noopener noreferrer"><button className="pb" style={{fontSize:12,padding:"8px 16px"}}>購買 →</button></a>}
                    {isAdmin&&<><button className="pg" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>startEdit(p)}>編輯</button><button className="pg" style={{fontSize:11,padding:"5px 10px",color:"#E74C3C",borderColor:"#E74C3C"}} onClick={()=>del(p.id)}>刪除</button></>}
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

function IG({igPosts,setIgPosts,isAdmin,links}) {
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({title:"",url:"",thumb:""});
  const sf=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const startAdd=()=>{setForm({title:"",url:"",thumb:""});setEditing("new");};
  const startEdit=p=>{setForm({...p});setEditing(p.id);};
  const save=()=>{if(editing==="new")setIgPosts(prev=>[...prev,{...form,id:Date.now()}]);else setIgPosts(prev=>prev.map(p=>p.id===editing?{...p,...form}:p));setEditing(null);};
  const del=id=>{if(confirm("確定刪除？"))setIgPosts(prev=>prev.filter(p=>p.id!==id));};
  const move=(idx,dir)=>setIgPosts(prev=>moveItem(prev,idx,dir));
  const l=links||DEFAULTS.links;
  return(
    <div>
      <div style={{background:NAVY,padding:"60px 32px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:16}}>
          <div>
            <p style={{fontSize:11,letterSpacing:"3px",color:O,marginBottom:12,fontWeight:500}}>INSTAGRAM</p>
            <h1 style={{fontSize:36,fontWeight:700,color:CHAR}}>最新消息</h1>
            <p style={{fontSize:13,color:MID,marginTop:8}}>點擊前往 Instagram 觀看</p>
          </div>
          <div style={{display:"flex",gap:12}}>
            {isAdmin&&<button className="pb" onClick={startAdd}>＋ 新增</button>}
            <a href={l.instagram} target="_blank" rel="noopener noreferrer"><button style={{background:"transparent",color:CHAR,border:`1px solid #D0D0D0`,padding:"11px 20px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>IG 主頁 →</button></a>
          </div>
        </div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"60px 32px"}} className="page-wrap">
        {editing&&(
          <div style={{background:GRAY,padding:"32px",marginBottom:40}}>
            <div style={{display:"flex",flexDirection:"column",gap:20,marginBottom:24}}>
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>貼文標題 / 說明</p><input value={form.title} onChange={sf("title")} /></div>
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>Instagram 連結</p><input value={form.url} onChange={sf("url")} /></div>
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>縮圖網址（選填）</p><input value={form.thumb} onChange={sf("thumb")} /></div>
            </div>
            <div style={{display:"flex",gap:10}}><button className="pb" onClick={save} disabled={!form.title.trim()}>儲存</button><button className="pg" onClick={()=>setEditing(null)}>取消</button></div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}} className="grid-ig">
          {igPosts.map((p,idx)=>(
            <div key={p.id} style={{background:WHITE,border:`1px solid #E8E8E8`,position:"relative"}}>
              <a href={p.url||l.instagram} target="_blank" rel="noopener noreferrer" style={{display:"block"}}>
                <div style={{aspectRatio:"1",background:"#EBEBEB",overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {p.thumb?<img src={p.thumb} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{fontSize:12,color:LIGHT,letterSpacing:"2px"}}>IG</span>}
                  <div style={{position:"absolute",inset:0,background:"rgba(30,45,61,0)",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(30,45,61,.4)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(30,45,61,0)"}>
                    <span style={{color:WHITE,fontSize:28,opacity:.9}}>▶</span>
                  </div>
                </div>
              </a>
              <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <p style={{fontSize:13,lineHeight:1.6,color:CHAR,flex:1}}>{p.title}</p>
                {isAdmin&&(
                  <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",flexShrink:0}}>
                    <OrdBtns idx={idx} total={igPosts.length} onMove={move} />
                    <div style={{display:"flex",gap:8}}>
                      <span style={{fontSize:11,color:O,cursor:"pointer"}} onClick={()=>startEdit(p)}>編輯</span>
                      <span style={{fontSize:11,color:"#E74C3C",cursor:"pointer"}} onClick={()=>del(p.id)}>刪除</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Goods({goods,setGoods,isAdmin}) {
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:"",brand:"",desc:"",url:"",img:"",active:true});
  const sf=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const startAdd=()=>{setForm({name:"",brand:"",desc:"",url:"",img:"",active:true});setEditing("new");};
  const startEdit=p=>{setForm({...p});setEditing(p.id);};
  const save=()=>{if(editing==="new")setGoods(prev=>[...prev,{...form,id:Date.now()}]);else setGoods(prev=>prev.map(p=>p.id===editing?{...p,...form}:p));setEditing(null);};
  const del=id=>{if(confirm("確定刪除？"))setGoods(prev=>prev.filter(p=>p.id!==id));};
  const active=goods.filter(g=>g.active);
  const move=(idx,dir)=>setGoods(prev=>{const act=prev.filter(g=>g.active);const inact=prev.filter(g=>!g.active);return[...moveItem(act,idx,dir),...inact];});
  return(
    <div>
      <div style={{background:NAVY,padding:"32px 32px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
          <div>
            <p style={{fontSize:11,letterSpacing:"3px",color:O,marginBottom:8,fontWeight:500}}>FAVORITES</p>
            <h1 style={{fontSize:28,fontWeight:700,color:CHAR}}>推薦好物</h1>
          </div>
          {isAdmin&&<button className="pb" onClick={startAdd}>＋ 新增</button>}
        </div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"60px 32px"}} className="page-wrap">
        {editing&&(
          <div style={{background:GRAY,padding:"32px",marginBottom:40}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}} className="grid2">
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>商品名稱</p><input value={form.name} onChange={sf("name")} /></div>
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>品牌 / 來源</p><input value={form.brand} onChange={sf("brand")} /></div>
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>連結</p><input value={form.url} onChange={sf("url")} /></div>
              <div><p style={{fontSize:12,color:MID,marginBottom:8}}>圖片網址（選填）</p><input value={form.img} onChange={sf("img")} /></div>
            </div>
            <div style={{marginBottom:16}}><p style={{fontSize:12,color:MID,marginBottom:8}}>推薦說明</p><textarea value={form.desc} onChange={sf("desc")} style={{minHeight:80,border:"1px solid #D0D5DA",padding:"10px",background:WHITE}} /></div>
            <label style={{fontSize:12,color:MID,display:"flex",gap:8,alignItems:"center",marginBottom:24,cursor:"pointer"}}>
              <input type="checkbox" checked={form.active} onChange={e=>setForm(p=>({...p,active:e.target.checked}))} style={{width:"auto"}} />上架顯示
            </label>
            <div style={{display:"flex",gap:10}}><button className="pb" onClick={save} disabled={!form.name.trim()}>儲存</button><button className="pg" onClick={()=>setEditing(null)}>取消</button></div>
          </div>
        )}
        {active.length===0?(
          <div style={{textAlign:"center",padding:"100px 0"}}>
            <p style={{fontSize:14,color:LIGHT,lineHeight:2.4}}>88La 正在尋找好物中<br/><span style={{fontSize:12}}>有合適的商品會在這裡和你分享</span></p>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:2}} className="grid3">
            {active.map((p,idx)=>(
              <div key={p.id} style={{background:GRAY,position:"relative"}}>
                {isAdmin&&<OrdBtns idx={idx} total={active.length} onMove={move} style={{position:"absolute",top:12,right:12,zIndex:1}} />}
                {p.img&&<div style={{height:180,overflow:"hidden",background:"#E8EAEC"}}><img src={p.img} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>}
                <div style={{padding:"24px"}}>
                  {p.brand&&<p style={{fontSize:11,color:O,letterSpacing:".5px",marginBottom:6,fontWeight:500}}>{p.brand}</p>}
                  <h3 style={{fontSize:15,fontWeight:500,marginBottom:8,color:NAVY}}>{p.name}</h3>
                  <p style={{fontSize:13,color:MID,lineHeight:1.8,marginBottom:16}}>{p.desc}</p>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    {p.url&&<a href={p.url} target="_blank" rel="noopener noreferrer"><button className="pb" style={{fontSize:12,padding:"8px 16px"}}>查看 →</button></a>}
                    {isAdmin&&<div style={{display:"flex",gap:8}}><button className="pg" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>startEdit(p)}>編輯</button><button className="pg" style={{fontSize:11,padding:"5px 10px",color:"#E74C3C",borderColor:"#E74C3C"}} onClick={()=>del(p.id)}>刪除</button></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {isAdmin&&goods.filter(g=>!g.active).length>0&&(
          <div style={{marginTop:40}}>
            <p style={{fontSize:11,color:LIGHT,marginBottom:12,letterSpacing:".5px"}}>未上架</p>
            {goods.filter(g=>!g.active).map(p=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #EAECEE",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <span style={{fontSize:13,color:LIGHT}}>{p.name}</span>
                <div style={{display:"flex",gap:8}}>
                  <button className="pg" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>startEdit(p)}>編輯</button>
                  <button className="pg" style={{fontSize:11,padding:"4px 10px",color:"#E74C3C",borderColor:"#E74C3C"}} onClick={()=>del(p.id)}>刪除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [articles,setArticles,aL]=useFS("articles",DEFAULTS.articles);
  const [products,setProducts,pL]=useFS("products",DEFAULTS.products);
  const [igPosts,setIgPosts,iL]=useFS("igPosts",DEFAULTS.igPosts);
  const [goods,setGoods,gL]=useFS("goods",[]);
  const [about,setAbout,abL]=useFS("about",DEFAULTS.about);
  const [siteTitle,setSiteTitle,tL]=useFS("siteTitle",DEFAULTS.siteTitle);
  const [tags,setTags,taL]=useFS("tags",DEFAULTS.tags);
  const [links,setLinks,lL]=useFS("links",DEFAULTS.links);
  const [footerTagline,setFooterTagline,ftL]=useFS("footerTagline",DEFAULTS.footerTagline);
  const [page,setPage]=useState("home");
  const [id,setId]=useState(null);
  const [isAdmin,setIsAdmin]=useState(false);

  const loaded=aL&&pL&&iL&&gL&&abL&&tL&&taL&&lL&&ftL;
  const article=articles.find(a=>a.id===id);
  const nav=p=>{setPage(p);setId(null);};
  const saveArticle=d=>{
    const nid=Math.max(...articles.map(a=>a.id),0)+1;
    setArticles(prev=>[...prev,{id:nid,...d,excerpt:d.excerpt||(d.content.slice(0,80)+"⋯"),views:0,comments:[],date:new Date().toISOString().slice(0,10)}]);
    setPage("home");
  };

  if(!loaded) return(
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh",background:NAVY,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <p style={{fontSize:13,color:"rgba(255,255,255,.4)",letterSpacing:"3px"}}>LOADING</p>
      </div>
    </>
  );

  return(
    <div style={{minHeight:"100vh",background:WHITE}}>
      <Nav page={page} setPage={nav} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      {page==="home"&&<Home articles={articles} setPage={setPage} setId={setId} setArticles={setArticles} isAdmin={isAdmin} siteTitle={siteTitle} setSiteTitle={setSiteTitle} tags={tags} setTags={setTags} about={about} setAbout={setAbout} links={links} />}
      {page==="about"&&<About about={about} setAbout={setAbout} isAdmin={isAdmin} links={links} setLinks={setLinks} />}
      {page==="ig"&&<IG igPosts={igPosts} setIgPosts={setIgPosts} isAdmin={isAdmin} links={links} />}
      {page==="shop"&&<Shop products={products} setProducts={setProducts} isAdmin={isAdmin} />}
      {page==="article"&&article&&<Article article={article} onBack={()=>setPage("home")} setArticles={setArticles} isAdmin={isAdmin} tags={tags} links={links} />}
      {page==="write"&&isAdmin&&<Write onSave={saveArticle} onBack={()=>setPage("home")} tags={tags} />}
      {page==="goods"&&<Goods goods={goods} setGoods={setGoods} isAdmin={isAdmin} />}
      <Footer links={links} />
    </div>
  );
}
