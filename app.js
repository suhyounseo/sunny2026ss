const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const q=$('#q'), chips=$('#chips'), grid=$('#grid'), title=$('#title'), count=$('#count'), intro=$('#intro'), modal=$('#modal'), detail=$('#detail');
const VERSION='match35';
let PRODUCTS=[], FILTER='HOME', currentImages=[];
const COLLECTIONS=[
  {key:'A',filter:'COL_A',title:'COLLECTION A',name:'섹시 미니 컬렉션',desc:'몸매 라인을 살려주는 클럽·파티·방송룩 중심'},
  {key:'B',filter:'COL_B',title:'COLLECTION B',name:'데일리 & 러블리 컬렉션',desc:'부담 없이 예쁘게 입기 좋은 데일리·러블리 원피스'},
  {key:'C',filter:'COL_C',title:'COLLECTION C',name:'미디 & 롱 컬렉션',desc:'고급스럽고 존재감 있는 파티·무대·행사용 원피스'}
];
const FILTERS=['HOME','COL_A','COL_B','COL_C','NEW','BEST','SIZE_77','BUY_NOW','ALL'];
const LABEL={HOME:'컬렉션 선택',COL_A:'COLLECTION A',COL_B:'COLLECTION B',COL_C:'COLLECTION C',NEW:'✨ NEW',BEST:'🔥 BEST',SIZE_77:'77가능',BUY_NOW:'바로구매',ALL:'전체'};
const money=n=>n?'₩'+Number(n).toLocaleString('ko-KR'):'문의';
const img=u=>u?`${u}?v=${VERSION}`:'';
const mainImg=p=>p.mainImage||p.thumbnail||p.cardImage||(p.images&&p.images[0])||'';
const name=p=>p.name||p.storeName||p.code;
const norm=s=>String(s||'').toLowerCase();

function buildChips(){
  chips.innerHTML=FILTERS.map(f=>`<button class="chip ${f===FILTER?'on':''}" data-f="${f}">${LABEL[f]}</button>`).join('');
}
function cCount(k){return PRODUCTS.filter(p=>p.collection===k).length}
function sectionName(){
  if(FILTER==='HOME')return'NICE COLLECTION';
  let c=COLLECTIONS.find(x=>x.filter===FILTER);
  if(c)return`${c.title} · ${c.name}`;
  if(FILTER==='NEW')return'NEW ARRIVAL';
  if(FILTER==='BEST')return'BEST ITEM';
  if(FILTER==='SIZE_77')return'77 SIZE AVAILABLE';
  if(FILTER==='BUY_NOW')return'바로구매 가능 상품';
  return'ALL COLLECTION';
}
function sectionIntro(){
  if(FILTER==='HOME')return'오늘 어떤 스타일을 찾으세요? 원하는 컬렉션을 먼저 선택하면 해당 상품만 빠르게 보여드립니다.';
  let c=COLLECTIONS.find(x=>x.filter===FILTER);
  return c?c.desc:'';
}
function match(p){
  const search=norm(q.value.trim());
  const hay=norm([p.code,p.name,p.storeName,p.color,p.category,p.length,p.fit,p.size,p.fabric,p.collectionName,...(p.tags||[]),...(p.styleTags||[]),...(p.sceneTags||[])].join(' '));
  let ok=!search||hay.includes(search);
  let tags=p.tags||[];
  let f=true;
  if(FILTER==='ALL')f=true;
  else if(FILTER==='COL_A')f=p.collection==='A';
  else if(FILTER==='COL_B')f=p.collection==='B';
  else if(FILTER==='COL_C')f=p.collection==='C';
  else if(FILTER==='NEW')f=!!p.new||!!p.isNew||tags.includes('NEW');
  else if(FILTER==='BEST')f=!!p.best||!!p.isPopular||tags.includes('BEST');
  else if(FILTER==='SIZE_77')f=tags.includes('77가능')||(p.sizeTags||[]).includes('77')||String(p.size||'').includes('77');
  else if(FILTER==='BUY_NOW')f=tags.includes('바로구매')||tags.includes('BUY_NOW')||p.stockStatus==='바로구매';
  return ok&&f;
}
function badges(p){
  let out=[];let tags=p.tags||[];
  if(p.best||p.isPopular||tags.includes('BEST'))out.push('<span class="badge">BEST</span>');
  if(p.new||p.isNew||tags.includes('NEW'))out.push('<span class="badge gold">NEW</span>');
  if(p.collectionName)out.push(`<span class="badge light">${p.collectionName}</span>`);
  return out.join('')||'<span class="badge">NICE</span>';
}
function meta(p){return [p.length,p.color,p.size?'SIZE '+p.size:''].filter(Boolean).slice(0,3).map(x=>`<span>${x}</span>`).join('')}
function renderHome(){
  title.textContent='NICE COLLECTION';count.textContent='';intro.textContent=sectionIntro();grid.className='collection-grid';
  grid.innerHTML=COLLECTIONS.map(c=>`<article class="collection-card" data-f="${c.filter}"><div class="collection-count">${cCount(c.key)} items</div><div class="collection-title">${c.title}</div><div class="collection-name">${c.name}</div><p>${c.desc}</p></article>`).join('');
  $$('.collection-card').forEach(el=>el.onclick=()=>{FILTER=el.dataset.f;buildChips();render();scrollTo({top:0,behavior:'smooth'})});
}
function render(){
  title.textContent=sectionName();intro.textContent=sectionIntro();
  if(FILTER==='HOME'&&!q.value.trim())return renderHome();
  grid.className='grid';
  let list=PRODUCTS.filter(match);count.textContent=`${list.length} items`;
  if(!list.length){grid.innerHTML='<div class="empty">조건에 맞는 상품이 없습니다.</div>';return}
  grid.innerHTML=list.map(p=>`<article class="card" data-code="${p.code}"><div class="photo">${mainImg(p)?`<img loading="lazy" src="${img(mainImg(p))}" alt="${name(p)}">`:''}<div class="badges">${badges(p)}</div></div><div class="info"><div class="code">${p.code}</div><div class="name">${name(p)}</div><div class="meta">${meta(p)}</div><div class="price">${money(p.price)}</div></div></article>`).join('');
  $$('.card').forEach(el=>el.onclick=()=>openDetail(el.dataset.code));
}
function points(p){return Array.isArray(p.points)&&p.points.length?p.points.slice(0,5):[p.mainCopy,p.desc||p.description,p.fit&&p.fit+' 실루엣'].filter(Boolean).slice(0,3)}
function openDetail(code){
  let p=PRODUCTS.find(x=>x.code===code);if(!p)return;
  currentImages=p.cuts&&p.cuts.length?p.cuts:(p.images||[]).map((u,i)=>({url:u,cut:'컷'+(i+1)}));
  let tags=[p.new||p.isNew?'NEW':'',p.best||p.isPopular?'BEST':'',p.collectionName,p.color,p.length].filter(Boolean);
  detail.innerHTML=`<div class="body"><section class="visual"><div class="main">${currentImages[0]?`<img id="mainImage" src="${img(currentImages[0].url)}" alt="${name(p)}">`:'NO IMAGE'}</div><div class="thumbs">${currentImages.map((im,i)=>`<button class="thumb ${i===0?'on':''}" data-i="${i}"><img src="${img(im.url)}" alt="${name(p)} ${i+1}"></button>`).join('')}</div></section><section class="copy"><div class="tags">${tags.map(t=>`<span>${t}</span>`).join('')}</div><h2>${name(p)}</h2><h3>${money(p.price)}</h3><div class="box"><b>WHY YOU’LL LOVE IT</b><ul>${points(p).map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="box"><b>EDITOR’S NOTE</b><p>${p.desc||p.description||p.mainCopy||'NICE 셀렉션 상품입니다.'}</p></div><div class="box"><b>RECOMMENDED FOR</b><p>${String(p.recommend||'파티 · 모임 · 데이트 · 촬영 · 특별한 약속').replaceAll('/',' · ')}</p></div><div class="spec"><div class="cell"><b>COLOR</b><span>${p.color||'-'}</span></div><div class="cell"><b>SIZE</b><span>${p.size||p.sizeInfo||'-'}</span></div><div class="cell"><b>FABRIC</b><span>${p.fabric||'확인필요'}</span></div><div class="cell"><b>DETAIL</b><span>${p.wearInfo||p.lining||'-'}</span></div></div><div class="cta"><a class="kakao" href="#">카카오톡 문의</a><a class="insta" href="#">인스타 DM</a></div></section></div>`;
  modal.classList.add('open');
  $$('.thumb',detail).forEach(b=>b.onclick=()=>{let i=Number(b.dataset.i);$('#mainImage').src=img(currentImages[i].url);$$('.thumb',detail).forEach((x,j)=>x.classList.toggle('on',i===j))});
}
$('#close').onclick=()=>modal.classList.remove('open');
modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};
chips.onclick=e=>{let b=e.target.closest('.chip');if(!b)return;FILTER=b.dataset.f;buildChips();render()};
q.oninput=()=>{if(q.value.trim()&&FILTER==='HOME')FILTER='ALL';buildChips();render()};
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('open')});
fetch('./products.json?v='+VERSION).then(r=>r.json()).then(d=>{PRODUCTS=d;buildChips();render()}).catch(()=>{grid.innerHTML='<div class="empty">상품 데이터를 불러오지 못했습니다.</div>'});
