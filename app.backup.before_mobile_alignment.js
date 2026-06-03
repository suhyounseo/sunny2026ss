const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const q=$('#q'), quick=$('#quick'), chips=$('#chips'), grid=$('#grid'), title=$('#title'), count=$('#count'), intro=$('#intro'), modal=$('#modal'), detail=$('#detail');
const VERSION='match46';
const KAKAO_URL='http://qr.kakao.com/talk/aGDd1dyfDwbjsvFXshqsTJhGWWc-';
const INSTA_URL=['https://www.instagram.com','dongdaemun_helloapm_nice'].join('/')+'/';
let PRODUCTS=[], FILTER='HOME', currentImages=[];

const COLLECTIONS=[
  {key:'A',filter:'COL_A',title:'COLLECTION A',name:'미니 원피스 컬렉션',desc:'첫 화면에서 가장 빠르게 고를 수 있는 미니 원피스 중심'},
  {key:'B',filter:'COL_B',title:'COLLECTION B',name:'투피스 & 상하의 컬렉션',desc:'투피스·상의·스커트처럼 세트와 단품으로 구성된 상품'},
  {key:'C',filter:'COL_C',title:'COLLECTION C',name:'미디 & 롱 컬렉션',desc:'고급스럽고 존재감 있는 파티·무대·행사용 원피스'}
];
const FILTERS=['HOME','ALL','COL_A','COL_B','COL_C','NEW','BEST','MINI','MIDI','LONG','TWO_PIECE','SKIRT','SIZE_77','BUY_NOW'];
const LABEL={HOME:'추천 홈',ALL:'전체',COL_A:'COLLECTION A',COL_B:'COLLECTION B',COL_C:'COLLECTION C',NEW:'✨ NEW',BEST:'🔥 BEST',MINI:'미니',MIDI:'미디',LONG:'롱',TWO_PIECE:'투피스',SKIRT:'스커트',SIZE_77:'77가능',BUY_NOW:'바로문의'};
const QUICK=['미니','미디','투피스','스커트','핑크','블랙','화이트','77','바로문의'];
const money=n=>n?'₩'+Number(n).toLocaleString('ko-KR'):'문의';
const img=u=>u?`${u}?v=${VERSION}`:'';
const mainImg=p=>p.mainImage||p.thumbnail||p.cardImage||(p.images&&p.images[0])||'';
const name=p=>p.name||p.storeName||p.code;
const norm=s=>String(s||'').toLowerCase();
const tags=p=>p.tags||[];
const codeOf=p=>String(p.code||'');
const isJessicaAnk=p=>/^(JES|ANC)-/.test(codeOf(p));
function normalizeProduct(p){
  if(isJessicaAnk(p)){
    p.category=p.category||'MINI';
    if(p.category==='MINI'||tags(p).includes('MINI')||/원피스/.test(name(p))){
      p.length='미니';
      p.tags=[...new Set(tags(p).filter(t=>t!=='MIDI'&&t!=='미디').concat(['MINI','미니']))];
      if(!p.collectionName)p.collectionName='미니 원피스 컬렉션';
    }
  }
  return p;
}
const hasTag=(p,t)=>tags(p).includes(t);
const isNew=p=>!!p.new||!!p.isNew||hasTag(p,'NEW');
const isBest=p=>!!p.best||!!p.isPopular||hasTag(p,'BEST');
const isBuyNow=p=>hasTag(p,'바로구매')||hasTag(p,'BUY_NOW')||p.stockStatus==='바로구매';

function buildQuick(){
  quick.innerHTML=QUICK.map(k=>`<button class="quick-chip" type="button" data-q="${k}">${k}</button>`).join('');
}
function buildChips(){
  chips.innerHTML=FILTERS.map(f=>`<button class="chip ${f===FILTER?'on':''}" type="button" data-f="${f}">${LABEL[f]}</button>`).join('');
}
function cCount(k){return PRODUCTS.filter(p=>p.collection===k).length}
function sectionName(){
  if(FILTER==='HOME')return'NICE SHOWROOM';
  let c=COLLECTIONS.find(x=>x.filter===FILTER);
  if(c)return`${c.title} · ${c.name}`;
  if(FILTER==='NEW')return'NEW ARRIVAL';
  if(FILTER==='BEST')return'BEST ITEM';
  if(FILTER==='MINI')return'MINI COLLECTION';
  if(FILTER==='MIDI')return'MIDI COLLECTION';
  if(FILTER==='LONG')return'LONG COLLECTION';
  if(FILTER==='TWO_PIECE')return'TWO PIECE & SET';
  if(FILTER==='SKIRT')return'SKIRT COLLECTION';
  if(FILTER==='SIZE_77')return'77 SIZE AVAILABLE';
  if(FILTER==='BUY_NOW')return'바로문의 가능 상품';
  return'ALL COLLECTION';
}
function sectionIntro(){
  if(FILTER==='HOME')return'추천 키워드와 컬렉션으로 빠르게 고르고, 마음에 드는 상품은 바로 상담할 수 있습니다.';
  let c=COLLECTIONS.find(x=>x.filter===FILTER);
  return c?c.desc:'';
}
function match(p){
  const rawSearch=q.value.trim();
  const search=norm(rawSearch);
  const searchableTags=tags(p).filter(t=>!(isJessicaAnk(p)&&/미디|MIDI/i.test(String(t))));
  const hay=norm([p.code,p.name,p.storeName,p.color,p.category,p.length,p.fit,p.size,p.fabric,...searchableTags,...(p.styleTags||[]),...(p.sceneTags||[])].join(' '));
  let ok=!search||hay.includes(search);
  let f=true;
  if(FILTER==='HOME')f=true;
  else if(FILTER==='ALL')f=true;
  else if(FILTER==='COL_A')f=p.collection==='A';
  else if(FILTER==='COL_B')f=p.collection==='B';
  else if(FILTER==='COL_C')f=p.collection==='C';
  else if(FILTER==='NEW')f=isNew(p);
  else if(FILTER==='BEST')f=isBest(p);
  else if(FILTER==='MINI')f=p.category==='MINI'||p.length==='미니'||hasTag(p,'MINI');
  else if(FILTER==='MIDI')f=!isJessicaAnk(p)&&(p.category==='MIDI'||p.length==='미디'||hasTag(p,'MIDI'));
  else if(FILTER==='LONG')f=p.category==='LONG'||p.length==='롱'||hasTag(p,'LONG');
  else if(FILTER==='TWO_PIECE')f=p.category==='TWO PIECE'||hasTag(p,'TWO PIECE');
  else if(FILTER==='SKIRT')f=p.category==='SKIRT'||hasTag(p,'SKIRT')||/스커트/.test(name(p));
  else if(FILTER==='SIZE_77')f=hasTag(p,'77가능')||(p.sizeTags||[]).includes('77')||String(p.size||'').includes('77');
  else if(FILTER==='BUY_NOW')f=isBuyNow(p);
  if(isJessicaAnk(p)&&/미디|midi/i.test(rawSearch))ok=false;
  return ok&&f;
}
function badges(p){
  let out=[];
  if(isBest(p))out.push('<span class="badge">BEST</span>');
  if(isNew(p))out.push('<span class="badge gold">NEW</span>');
  return out.join('')||'<span class="badge">NICE</span>';
}
function collectionBadge(p){return p.collectionName?`<div class="info-collection">${p.collectionName}</div>`:''}
function meta(p){return [p.length,p.color,p.size?'SIZE '+p.size:''].filter(Boolean).slice(0,3).map(x=>`<span>${x}</span>`).join('')}
function productCard(p, compact=false){
  return `<article class="card ${compact?'compact':''}" data-code="${p.code}">
    <div class="photo">${mainImg(p)?`<img loading="lazy" src="${img(mainImg(p))}" alt="${name(p)}">`:''}<div class="badges">${badges(p)}</div></div>
    <div class="info">
      <div class="code">${p.code}</div>${collectionBadge(p)}
      <div class="name">${name(p)}</div>
      <div class="meta">${meta(p)}</div>
      <div class="price">${money(p.price)}</div>
      <div class="card-actions">
        <button class="card-detail" type="button" data-code="${p.code}">상세</button>
        <a class="card-talk" href="${KAKAO_URL}" target="_blank" rel="noopener" aria-label="카톡 문의">카톡</a>
      </div>
    </div>
  </article>`;
}
function choose(list, limit){return list.filter(p=>mainImg(p)).slice(0,limit)}
function sectionBlock(label, desc, items){
  if(!items.length)return'';
  return `<section class="show-section"><div class="section-head"><div><h3>${label}</h3><p>${desc}</p></div><span>${items.length} picks</span></div><div class="rail">${items.map(p=>productCard(p,true)).join('')}</div></section>`;
}
function renderHome(){
  title.textContent='NICE SHOWROOM';count.textContent=`${PRODUCTS.length} items`;intro.textContent=sectionIntro();grid.className='home';
  const best=choose(PRODUCTS.filter(isBest),8);
  const fresh=choose(PRODUCTS.filter(isNew),10);
  const buy=choose(PRODUCTS.filter(isBuyNow),8);
  const mini=choose(PRODUCTS.filter(p=>p.collection==='A'),8);
  grid.innerHTML=`
    <section class="collection-grid">
      ${COLLECTIONS.map(c=>`<article class="collection-card" data-f="${c.filter}"><div class="collection-count">${cCount(c.key)} items</div><div class="collection-title">${c.title}</div><div class="collection-name">${c.name}</div><p>${c.desc}</p></article>`).join('')}
    </section>
    ${sectionBlock('오늘 추천', '먼저 보여주기 좋은 인기/추천 상품입니다.', best.length?best:fresh.slice(0,8))}
    ${sectionBlock('신상 먼저 보기', '최근 추가된 상품을 빠르게 확인하세요.', fresh)}
    ${sectionBlock('미니 원피스 셀렉션', '문의가 많은 미니 라인만 모았습니다.', mini)}
    ${sectionBlock('바로 상담하기 좋은 상품', '바로문의 태그가 있는 상품입니다.', buy)}`;
  $$('.collection-card').forEach(el=>el.onclick=()=>{FILTER=el.dataset.f;buildChips();render();scrollTo({top:0,behavior:'smooth'})});
  bindCards();
}
function render(){
  title.textContent=sectionName();intro.textContent=sectionIntro();
  if(FILTER==='HOME'&&!q.value.trim())return renderHome();
  grid.className='grid';
  let list=PRODUCTS.filter(match);count.textContent=`${list.length} items`;
  if(!list.length){grid.innerHTML='<div class="empty">조건에 맞는 상품이 없습니다.</div>';return}
  grid.innerHTML=list.map(p=>productCard(p)).join('');
  bindCards();
}
function points(p){
  return Array.isArray(p.points)&&p.points.length
    ? p.points.slice(0,5)
    : [p.mainCopy,p.desc||p.description,p.fit&&p.fit+' 실루엣'].filter(Boolean).slice(0,3);
}
function instaIcon(){
  return `<span class="insta-logo" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" stroke-width="2"></rect>
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"></circle>
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor"></circle>
    </svg>
  </span>`;
}
function openDetail(code){
  let p=PRODUCTS.find(x=>x.code===code);if(!p)return;
  currentImages=p.cuts&&p.cuts.length?p.cuts:(p.images||[]).map((u,i)=>({url:u,cut:'컷'+(i+1)}));
  let labelTags=[isNew(p)?'NEW':'',isBest(p)?'BEST':'',p.collectionName,p.color,p.length].filter(Boolean);
  detail.innerHTML=`<div class="body">
    <section class="visual">
      <div class="main">${currentImages[0]?`<img id="mainImage" src="${img(currentImages[0].url)}" alt="${name(p)}">`:'NO IMAGE'}</div>
      <div class="thumbs">${currentImages.map((im,i)=>`<button class="thumb ${i===0?'on':''}" data-i="${i}"><img src="${img(im.url)}" alt="${name(p)} ${i+1}"></button>`).join('')}</div>
    </section>
    <section class="copy">
      <div class="tags">${labelTags.map(t=>`<span>${t}</span>`).join('')}</div>
      <h2>${name(p)}</h2>
      <h3>${money(p.price)}</h3>
      <div class="box"><b>WHY YOU'LL LOVE IT</b><ul>${points(p).map(x=>`<li>${x}</li>`).join('')}</ul></div>
      <div class="box"><b>EDITOR'S NOTE</b><p>${p.desc||p.description||p.mainCopy||'NICE 컬렉션 상품입니다.'}</p></div>
      <div class="box"><b>RECOMMENDED FOR</b><p>${String(p.recommend||'파티 · 모임 · 데이트 · 촬영 · 하객룩').replaceAll('/',' · ')}</p></div>
      <div class="spec">
        <div class="cell"><b>COLOR</b><span>${p.color||'-'}</span></div>
        <div class="cell"><b>SIZE</b><span>${p.size||p.sizeInfo||'-'}</span></div>
        ${p.modelSize?`<div class="cell"><b>MODEL</b><span>${p.modelSize}</span></div>`:''}
        ${p.wearSize?`<div class="cell"><b>WEAR</b><span>${p.wearSize}</span></div>`:''}
        <div class="cell"><b>FABRIC</b><span>${p.fabric||'확인필요'}</span></div>
        <div class="cell"><b>DETAIL</b><span>${p.wearInfo||p.lining||'-'}</span></div>
      </div>
      <div class="cta">
        <a class="kakao" href="${KAKAO_URL}" target="_blank" rel="noopener"><span class="kakao-logo">TALK</span><span>카카오톡 문의</span></a>
        <a class="insta" href="${INSTA_URL}" target="_blank" rel="noopener">${instaIcon()}<span>인스타 DM</span></a>
      </div>
    </section>
  </div>`;
  modal.classList.add('open');
  $$('.thumb',detail).forEach(b=>b.onclick=()=>{let i=Number(b.dataset.i);$('#mainImage').src=img(currentImages[i].url);$$('.thumb',detail).forEach((x,j)=>x.classList.toggle('on',i===j))});
}
function bindCards(){
  $$('.card').forEach(el=>el.onclick=e=>{if(e.target.closest('.card-actions'))return;openDetail(el.dataset.code)});
  $$('.card-detail').forEach(el=>el.onclick=e=>{e.stopPropagation();openDetail(el.dataset.code)});
}
$('#close').onclick=()=>modal.classList.remove('open');
modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};
chips.onclick=e=>{let b=e.target.closest('.chip');if(!b)return;FILTER=b.dataset.f;buildChips();render();scrollTo({top:0,behavior:'smooth'})};
quick.onclick=e=>{let b=e.target.closest('.quick-chip');if(!b)return;q.value=b.dataset.q;FILTER='ALL';buildChips();render()};
q.oninput=()=>{if(q.value.trim()&&FILTER==='HOME')FILTER='ALL';buildChips();render()};
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('open')});
fetch('./products.json?v='+VERSION).then(r=>r.json()).then(d=>{PRODUCTS=d.map(normalizeProduct);buildQuick();buildChips();render()}).catch(()=>{grid.innerHTML='<div class="empty">상품 데이터를 불러오지 못했습니다.</div>'});
