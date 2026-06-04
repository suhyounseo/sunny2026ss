const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const q=$('#q'), quick=$('#quick'), chips=$('#chips'), grid=$('#grid'), title=$('#title'), count=$('#count'), intro=$('#intro'), modal=$('#modal'), detail=$('#detail');
const vipModal=$('#vipModal'), vipInput=$('#vipCode'), vipMessage=$('#vipMessage');
const VERSION='match52';
const KAKAO_URL='http://qr.kakao.com/talk/aGDd1dyfDwbjsvFXshqsTJhGWWc-';
const INSTA_URL=['https://www.instagram.com','dongdaemun_helloapm_nice'].join('/')+'/';
const BLOG_URL='https://blog.naver.com/dongdaemun_nice';
let PRODUCTS=[], FILTER='HOME', currentImages=[];
let modalHistoryOpen=false;

const COLLECTIONS=[
  {key:'A',filter:'COL_A',title:'Collection A',name:'Mini Dress Edit',desc:'경쾌하면서도 여성스러운 미니 원피스 셀렉션'},
  {key:'B',filter:'COL_B',title:'Collection B',name:'Set-up & Styling Edit',desc:'투피스와 세트 아이템으로 완성하는 스타일링'},
  {key:'C',filter:'COL_C',title:'Collection C',name:'Evening & Long Edit',desc:'특별한 순간을 위한 미디·롱 드레스 셀렉션'}
];
const FILTERS_BASE=['HOME','ALL','NEW','BEST'];
const LABEL={HOME:'HOME',ALL:'ALL',COL_A:'COLLECTION A',COL_B:'COLLECTION B',COL_C:'COLLECTION C',NEW:'NEW ARRIVAL',BEST:'BEST PICK',MINI:'미니',MIDI:'미디',LONG:'롱',TWO_PIECE:'투피스',SKIRT:'스커트',SIZE_77:'77가능',SAME_DAY:'당일가능'};
const QUICK_BASE=['미니','미디','A라인','슬림핏','럭셔리핏','투피스','스커트','블라우스','블랙','화이트','77/88'];
const QUICK_VIP=['당일발송'];
const VIP_STORAGE_KEY='niceVipUntil';
const VIP_TTL_MS=12*60*60*1000;
const VIP_CODE_CHARS=[78,73,67,69,86,73,80];
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
      if(!p.collectionName)p.collectionName='Mini Dress Edit';
    }
  }
  return p;
}
const hasTag=(p,t)=>tags(p).includes(t);
const isNew=p=>!!p.new||!!p.isNew||hasTag(p,'NEW');
const isBest=p=>!!p.best||!!p.isPopular||hasTag(p,'BEST');
const isBuyNow=p=>hasTag(p,'바로구매')||hasTag(p,'BUY_NOW')||p.stockStatus==='바로구매';
function productText(p){
  return [p.code,p.name,p.storeName,p.color,p.category,p.length,p.fit,p.size,p.fabric,p.mainCopy,p.desc,p.description,p.recommend,...tags(p),...(p.styleTags||[]),...(p.sceneTags||[])].join(' ');
}
function isLuxuryFit(p){
  return /럭셔리핏|실루엣|슬림라인|슬림핏|머메이드|H라인|라인감|바디라인/i.test(productText(p));
}
function isSlimFit(p){
  return /슬림핏|슬림라인|H라인|머메이드|라인감|바디라인/i.test(productText(p));
}
function isTiara(p){
  return /티아라|tiara/i.test([p.supplier,p.vendor,p.origin,p.zipFolder,p.code,p.productName,p.matchedKey].join(' '));
}
function isWideSize(p){
  if(isTiara(p))return false;
  return hasTag(p,'77가능')||(p.sizeTags||[]).includes('77')||(p.sizeTags||[]).includes('88')||/77|88/.test(String(p.size||p.sizeInfo||''));
}
function isSameDayCandidate(p){
  return p.sameDayAvailable===true||isBuyNow(p)||/당일발송|바로구매|입고|재고|보유 여부/i.test(productText(p));
}
function vipCode(){return String.fromCharCode(...VIP_CODE_CHARS)}
function vipUntil(){return Number(localStorage.getItem(VIP_STORAGE_KEY)||0)}
function isVipActive(){return vipUntil()>Date.now()}
function setVipActive(){localStorage.setItem(VIP_STORAGE_KEY,String(Date.now()+VIP_TTL_MS))}
function clearVip(){localStorage.removeItem(VIP_STORAGE_KEY)}
function visibleToAudience(p){return isVipActive()||p.vipOnly!==true}
function filters(){return isVipActive()?[...FILTERS_BASE,'SAME_DAY']:FILTERS_BASE}
function quickWords(){return isVipActive()?[...QUICK_BASE,...QUICK_VIP]:QUICK_BASE}
function isSameDayVisible(p){return isVipActive()&&isSameDayCandidate(p)}

function buildQuick(){
  quick.innerHTML=quickWords().map(k=>`<button class="quick-chip" type="button" data-q="${k}">${k}</button>`).join('');
}
function buildChips(){
  if(FILTER==='HOME'&&!q.value.trim()){chips.innerHTML='';return}
  chips.innerHTML=filters().map(f=>`<button class="chip ${f===FILTER?'on':''}" type="button" data-f="${f}">${LABEL[f]}</button>`).join('');
}
function cCount(k){return PRODUCTS.filter(p=>p.collection===k).length}
function sectionName(){
  if(FILTER==='HOME')return'CURATED COLLECTION';
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
  if(FILTER==='SAME_DAY')return'TODAY AVAILABLE';
  return'ALL COLLECTION';
}
function sectionIntro(){
  if(FILTER==='HOME')return'당신의 취향에 맞는 감각적인 룩을 제안합니다.';
  let c=COLLECTIONS.find(x=>x.filter===FILTER);
  return c?c.desc:'';
}
function match(p){
  const rawSearch=q.value.trim();
  const search=norm(rawSearch);
  const searchableTags=tags(p).filter(t=>!(isJessicaAnk(p)&&/미디|MIDI/i.test(String(t))));
  const derived=[isLuxuryFit(p)?'럭셔리핏':'',isSlimFit(p)?'슬림핏':'',isSameDayVisible(p)?'당일발송':'',isWideSize(p)?'77/88':''].filter(Boolean);
  const hay=norm([p.code,p.name,p.storeName,p.color,p.category,p.length,p.fit,p.size,p.fabric,...searchableTags,...(p.styleTags||[]),...(p.sceneTags||[]),...derived].join(' '));
  let ok=!search||hay.includes(search);
  if(/77\s*\/\s*88|77\/88/.test(rawSearch))ok=isWideSize(p);
  if(/당일발송|당일가능|바로문의/.test(rawSearch))ok=isSameDayVisible(p);
  if(/럭셔리핏/.test(rawSearch))ok=isLuxuryFit(p);
  if(/슬림핏/.test(rawSearch))ok=isSlimFit(p);
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
  else if(FILTER==='TWO_PIECE')f=!isJessicaAnk(p)&&(p.category==='TWO PIECE'||hasTag(p,'TWO PIECE'));
  else if(FILTER==='SKIRT')f=p.category==='SKIRT'||hasTag(p,'SKIRT')||/스커트/.test(name(p));
  else if(FILTER==='SIZE_77')f=isWideSize(p);
  else if(FILTER==='SAME_DAY')f=isSameDayVisible(p);
  if(isJessicaAnk(p)&&/미디|midi/i.test(rawSearch))ok=false;
  if(isJessicaAnk(p)&&/투피스|two[-_ ]?piece/i.test(rawSearch))ok=false;
  if(isJessicaAnk(p)&&/미디|midi/i.test(search))ok=false;
  return ok&&f&&visibleToAudience(p);
}
function badges(p){
  let out=[];
  if(isBest(p))out.push('<span class="badge">BEST</span>');
  if(isNew(p))out.push('<span class="badge gold">NEW</span>');
  return out.join('')||'<span class="badge">NICE</span>';
}
function collectionBadge(p){return p.collectionName?`<div class="info-collection">${p.collectionName}</div>`:''}
function meta(p){return [isLuxuryFit(p)?'럭셔리핏':'',p.length,p.color,p.size?'SIZE '+p.size:''].filter(Boolean).slice(0,3).map(x=>`<span>${x}</span>`).join('')}
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
function communityBlock(){
  return `<section class="community-panel" aria-label="NICE community">
    <div>
      <span class="community-kicker">NICE COMMUNITY</span>
      <h3>새로운 스타일과 매장 소식을 SNS에서 가장 먼저 만나보세요.</h3>
      <p>신상품, 스타일링 팁, 입고 소식, 상담 안내를 빠르게 확인할 수 있습니다.</p>
    </div>
    <div class="community-links">
      <a class="community-link insta" href="${INSTA_URL}" target="_blank" rel="noopener">Instagram</a>
      <a class="community-link" href="${BLOG_URL}" target="_blank" rel="noopener">Naver Blog</a>
      <span class="community-link pending" aria-disabled="true">Smart Store 준비중</span>
      <button class="community-link vip-open" type="button">${isVipActive()?'당일가능 보기':'VIP 인증'}</button>
      ${isVipActive()?'<button class="community-link vip-clear" type="button">인증해제</button>':''}
    </div>
  </section>`;
}
function renderHome(){
  const visible=PRODUCTS.filter(visibleToAudience);
  title.textContent='CURATED COLLECTION';count.textContent=`${visible.length} curated items`;intro.textContent=sectionIntro();grid.className='home';
  const best=choose(visible.filter(isBest),8);
  const fresh=choose(visible.filter(isNew),10);
  const sameDay=choose(visible.filter(isSameDayVisible),10);
  grid.innerHTML=`
    <section class="collection-grid">
      ${COLLECTIONS.map(c=>`<article class="collection-card" data-f="${c.filter}"><div class="collection-count">${cCount(c.key)} items</div><div class="collection-title">${c.title}</div><div class="collection-name">${c.name}</div><p>${c.desc}</p><span class="collection-action">VIEW EDIT</span></article>`).join('')}
    </section>
    ${communityBlock()}
    ${isVipActive()?sectionBlock('TODAY AVAILABLE', '오늘 매장에서 바로 확인 가능한 상품만 모았습니다.', sameDay):''}
    ${sectionBlock("Editor's Select", '나이스가 먼저 추천하는 감각적인 셀렉션', best.length?best:fresh.slice(0,8))}
    ${sectionBlock('New Arrival', '새롭게 입고된 신상품을 만나보세요', fresh)}`;
  $$('.collection-card').forEach(el=>el.onclick=()=>{FILTER=el.dataset.f;buildChips();render();scrollTo({top:0,behavior:'smooth'})});
  bindCards();
  bindVipControls();
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
function closeDetail(fromHistory=false){
  if(!modal.classList.contains('open'))return;
  modal.classList.remove('open');
  if(modalHistoryOpen&&!fromHistory){
    modalHistoryOpen=false;
    history.back();
  }else if(fromHistory){
    modalHistoryOpen=false;
  }
}
function openModalHistory(code){
  if(!modalHistoryOpen){
    history.pushState({niceModal:true,code},'',`#${code}`);
    modalHistoryOpen=true;
  }else{
    history.replaceState({niceModal:true,code},'',`#${code}`);
  }
}
function openDetail(code){
  let p=PRODUCTS.find(x=>x.code===code);if(!p)return;
  if(!visibleToAudience(p))return;
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
  openModalHistory(code);
  $$('.thumb',detail).forEach(b=>b.onclick=()=>{let i=Number(b.dataset.i);$('#mainImage').src=img(currentImages[i].url);$$('.thumb',detail).forEach((x,j)=>x.classList.toggle('on',i===j))});
}
function bindCards(){
  $$('.card').forEach(el=>el.onclick=e=>{if(e.target.closest('.card-actions'))return;openDetail(el.dataset.code)});
  $$('.card-detail').forEach(el=>el.onclick=e=>{e.stopPropagation();openDetail(el.dataset.code)});
}
function openVipModal(){
  if(!vipModal)return;
  vipInput.value='';
  vipMessage.textContent='';
  vipMessage.className='vip-message';
  vipModal.classList.add('open');
  setTimeout(()=>vipInput.focus(),60);
}
function closeVipModal(){vipModal&&vipModal.classList.remove('open')}
function bindVipControls(){
  $$('.vip-open').forEach(el=>el.onclick=()=>{
    if(isVipActive()){
      FILTER='SAME_DAY';
      q.value='';
      buildQuick();
      buildChips();
      render();
      scrollTo({top:0,behavior:'smooth'});
    }else openVipModal();
  });
  $$('.vip-clear').forEach(el=>el.onclick=()=>{clearVip();FILTER='HOME';q.value='';buildQuick();buildChips();render()});
}
$('#close').onclick=()=>closeDetail();
modal.onclick=e=>{if(e.target===modal)closeDetail()};
chips.onclick=e=>{let b=e.target.closest('.chip');if(!b)return;FILTER=b.dataset.f;buildChips();render();scrollTo({top:0,behavior:'smooth'})};
quick.onclick=e=>{let b=e.target.closest('.quick-chip');if(!b)return;q.value=b.dataset.q;FILTER='ALL';buildChips();render()};
q.oninput=()=>{if(q.value.trim()&&FILTER==='HOME')FILTER='ALL';buildChips();render()};
if(vipModal){
  $('#vipClose').onclick=closeVipModal;
  $('#vipCancel').onclick=closeVipModal;
  $('#vipSubmit').onclick=()=>{
    if(vipInput.value.trim().toUpperCase()===vipCode()){
      setVipActive();
      vipMessage.textContent='VIP 인증이 완료되었습니다.';
      vipMessage.className='vip-message ok';
      setTimeout(()=>{closeVipModal();FILTER='HOME';q.value='';buildQuick();buildChips();render()},500);
    }else{
      vipMessage.textContent='인증코드가 올바르지 않습니다.';
      vipMessage.className='vip-message error';
    }
  };
  vipModal.onclick=e=>{if(e.target===vipModal)closeVipModal()};
  vipInput.onkeydown=e=>{if(e.key==='Enter')$('#vipSubmit').click()};
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDetail();closeVipModal()}});
window.addEventListener('popstate',()=>{if(modal.classList.contains('open'))closeDetail(true)});
fetch('./products.json?v='+VERSION).then(r=>r.json()).then(d=>{PRODUCTS=d.map(normalizeProduct);buildQuick();buildChips();render()}).catch(()=>{grid.innerHTML='<div class="empty">상품 데이터를 불러오지 못했습니다.</div>'});
