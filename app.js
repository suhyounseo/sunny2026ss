const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];

const q = $('#q');
const quick = $('#quick');
const chips = $('#chips');
const grid = $('#grid');
const title = $('#title');
const count = $('#count');
const intro = $('#intro');
const modal = $('#modal');
const detail = $('#detail');
const vipModal = $('#vipModal');
const vipInput = $('#vipCode');
const vipMessage = $('#vipMessage');

const VERSION = 'match85';
const KAKAO_URL = 'http://qr.kakao.com/talk/aGDd1dyfDwbjsvFXshqsTJhGWWc-';
const INSTA_URL = ['https://www.instagram.com', 'dongdaemun_helloapm_nice'].join('/') + '/';
const BLOG_URL = 'https://blog.naver.com/dongdaemun_nice';
const VIP_STORAGE_KEY = 'niceVipUntil';
const VIP_TTL_MS = 12 * 60 * 60 * 1000;
const VIP_CODE_CHARS = [78, 73, 67, 69, 86, 73, 80];

let PRODUCTS = [];
let FILTER = 'HOME';
let currentImages = [];
let modalHistoryOpen = false;
let SIMILAR_CODE = '';

const COLLECTIONS = [
  { key: 'A', filter: 'COL_A', title: 'Collection A', name: 'Mini Dress Edit', desc: '가볍게 입기 좋은 미니 원피스 셀렉션' },
  { key: 'B', filter: 'COL_B', title: 'Collection B', name: 'Set-up & Styling Edit', desc: '투피스와 세트 아이템으로 완성하는 스타일링' },
  { key: 'C', filter: 'COL_C', title: 'Collection C', name: 'Evening & Long Edit', desc: '특별한 순간을 위한 미디·롱 드레스 셀렉션' }
];

const FILTERS_BASE = ['HOME', 'ALL', 'BEST', 'NEW', 'COSTUME', 'MINI', 'MIDI', 'TWO_PIECE', 'LONG'];
const LABEL = {
  HOME: 'HOME',
  ALL: 'ALL',
  BEST: 'BEST PICK',
  NEW: 'NEW ARRIVAL',
  COSTUME: 'Costume',
  MINI: '미니',
  MIDI: '미디',
  TWO_PIECE: '투피스',
  LONG: '롱',
  COL_A: 'COLLECTION A',
  COL_B: 'COLLECTION B',
  COL_C: 'COLLECTION C',
  SAME_DAY: '당일문의'
};
const QUICK_BASE = ['미니', '미디', '투피스', '롱', 'A라인', '슬림핏', '럭셔리', '파티룩', '클럽룩', '무대의상', '77/88'];
const QUICK_VIP = ['당일문의'];

const COSTUME_STRONG = [
  '코스튬', '코스튬룩', '콘셉트룩', '컨셉룩', '마린룩', '마린', '세일러룩', '세일러',
  '스쿨룩', '스쿨', '교복룩', '교복', '유니폼룩', '유니폼', '파티코스튬',
  'costume', 'cosplay', 'sailor', 'school', 'uniform', '체크', '플리츠'
];
const COSTUME_SOFT = ['이벤트룩', '이벤트', '촬영룩', '촬영', '공연룩', '공연', '방송룩', '방송', 'event', 'stage'];
const SCENE_SEARCH = {
  '파티룩': ['파티', 'party', '행사', '모임', '브라이덜'],
  '클럽룩': ['클럽', 'club', '섹시', '슬림', '바디라인'],
  '무대의상': ['무대', '공연', '방송', '촬영', '행사', 'stage', '존재감', '조명'],
  '방송룩': ['방송', '촬영', '무대', 'stage', '존재감'],
  '촬영룩': ['촬영', '방송', '무대', '조명', '존재감']
};
const INTERNAL_WORDS = [
  '제시카', 'Jessica', 'jessica', '앙크', '앙크최', 'ANK', 'Ank',
  '거래처', '공장', 'supplier', 'vendor', 'origin'
];
const WIDE_SIZE_SUPPLIERS = ['앙크최', '지니', '세윤', '펄', '임마누엘', '지나', '그레이스', '실루엣', '희야'];

const norm = s => String(s || '').toLowerCase();
const tags = p => Array.isArray(p.tags) ? p.tags : [];
const codeOf = p => String(p.code || '');
const mainImg = p => p.mainImage || p.thumbnail || p.cardImage || (Array.isArray(p.images) && p.images[0]) || '';
const img = u => u ? `${u}?v=${VERSION}` : '';
const hasTag = (p, t) => tags(p).some(x => norm(x) === norm(t));
const isNew = p => !!p.new || !!p.isNew || hasTag(p, 'NEW');
const isBest = p => !!p.best || !!p.isBest || !!p.bestItem || !!p.isPopular || hasTag(p, 'BEST') || !!p.mainDisplay || !!p.featured;
const vipCode = () => String.fromCharCode(...VIP_CODE_CHARS);
const vipUntil = () => Number(localStorage.getItem(VIP_STORAGE_KEY) || 0);
const isVipActive = () => vipUntil() > Date.now();
const setVipActive = () => localStorage.setItem(VIP_STORAGE_KEY, String(Date.now() + VIP_TTL_MS));
const clearVip = () => localStorage.removeItem(VIP_STORAGE_KEY);
const visibleToAudience = p => isVipActive() || p.vipOnly !== true;
const isAnkProduct = p => /^ANC-/.test(codeOf(p));

function cleanText(value, fallback = '') {
  let text = String(value || fallback || '').trim();
  INTERNAL_WORDS.forEach(word => {
    text = text.replace(new RegExp(word, 'gi'), 'NICE');
  });
  text = text
    .replace(/NICE\s*2026\s*봄\s*라인\s*/gi, '새 시즌 ')
    .replace(/NICE\s*2026\s*봄\s*생산중\s*신상/gi, '입고 예정 신상')
    .replace(/NICE\s*신상/gi, '신상')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return text || fallback;
}

function displayName(p) {
  return cleanText(p.name || p.storeName || p.productName || p.code, p.code);
}

function displayCode(p) {
  return cleanText(p.customerCode || p.code || '');
}

function money(n) {
  return n ? '₩' + Number(n).toLocaleString('ko-KR') : '가격문의';
}

function productText(p) {
  return [
    p.code, p.customerCode, p.name, p.storeName, p.productName, p.color, p.category, p.length,
    p.fit, p.size, p.sizeInfo, p.fabric, p.mainCopy, p.desc, p.description, p.recommend,
    ...(p.points || []), ...tags(p), ...(p.styleTags || []), ...(p.sceneTags || [])
  ].join(' ');
}

function focusedProductText(p) {
  return [
    p.name, p.storeName, p.productName, p.color, p.category, p.length, p.fit, p.size,
    p.fabric, ...tags(p), ...(p.styleTags || []), ...(p.sceneTags || [])
  ].join(' ');
}

function supplierText(p) {
  return [p.code, p.origin, p.supplier, p.vendor, p.folder, p.zipFolder, p.supplierProductNo].join(' ');
}

function isJessicaProduct(p) {
  return /^JES-/.test(codeOf(p)) || /제시카|Jessica/i.test(supplierText(p));
}

function isWideSizeSupplier(p) {
  const text = supplierText(p);
  return isAnkProduct(p) || WIDE_SIZE_SUPPLIERS.some(name => text.includes(name));
}

function isWideSize(p) {
  if (isJessicaProduct(p)) return false;
  return isWideSizeSupplier(p) || (p.sizeTags || []).some(x => ['77', '88'].includes(String(x))) || /77|88|99/.test(String(p.size || p.sizeInfo || ''));
}

function hasExtendedSizeLeadTime(p) {
  return isWideSizeSupplier(p);
}

function isFittingAvailable(p) {
  if (isAnkProduct(p)) return false;
  return p.fittingAvailable === true || /피팅|매장/.test(productText(p));
}

function isSameDayCandidate(p) {
  return p.sameDayAvailable === true || p.stockStatus === '바로구매' || /당일|바로|입고|재고|보유/.test(productText(p));
}

function isSameDayVisible(p) {
  return isVipActive() && isSameDayCandidate(p);
}

function isCostume(p) {
  const hay = norm(focusedProductText(p));
  if (COSTUME_STRONG.some(k => hay.includes(norm(k)))) return true;
  const softHits = COSTUME_SOFT.filter(k => hay.includes(norm(k))).length;
  const hasStyleAnchor = /리본|빅리본|카라|스트라이프|체크|플리츠|세트|투피스|미니드레스|망사|레이스/.test(focusedProductText(p));
  return softHits >= 2 && hasStyleAnchor;
}

function rankProduct(p) {
  let score = Number(p.priority || 0);
  if (p.mainDisplay) score += 10000;
  if (p.featured) score += 7000;
  if (isBest(p)) score += 3600;
  if (isNew(p)) score += 2500;
  if (isWideSize(p)) score += 250;
  if (mainImg(p)) score += 200;
  return score;
}

function sortProducts(list) {
  return [...list].sort((a, b) => rankProduct(b) - rankProduct(a) || codeOf(a).localeCompare(codeOf(b), 'ko'));
}

function normalizeProduct(p) {
  if (!p.collection && p.category === 'MINI') p.collection = 'A';
  return p;
}

function filters() {
  return isVipActive() ? [...FILTERS_BASE, 'SAME_DAY'] : FILTERS_BASE;
}

function quickWords() {
  return isVipActive() ? [...QUICK_BASE, ...QUICK_VIP] : QUICK_BASE;
}

function buildQuick() {
  quick.innerHTML = quickWords().map(k => `<button class="quick-chip" type="button" data-q="${k}">${k}</button>`).join('');
}

function buildChips() {
  chips.innerHTML = filters().map(f => `<button class="chip ${f === FILTER ? 'on' : ''}" type="button" data-f="${f}">${LABEL[f]}</button>`).join('');
}

function applyView(nextFilter, { search = '', push = false, scroll = false } = {}) {
  FILTER = nextFilter;
  q.value = search || '';
  buildChips();
  render();
  if (scroll) scrollTo({ top: 0, behavior: 'smooth' });
  if (push) history.pushState({ niceView: true, filter: FILTER, search: q.value }, '', FILTER === 'HOME' && !q.value.trim() ? location.pathname : `#view-${FILTER.toLowerCase()}`);
}

function cCount(k) {
  return PRODUCTS.filter(p => p.collection === k && visibleToAudience(p)).length;
}

function sectionName() {
  if (FILTER === 'HOME') return 'ONLINE SHOWROOM';
  const c = COLLECTIONS.find(x => x.filter === FILTER);
  if (c) return c.title;
  if (FILTER === 'NEW') return 'NEW ARRIVAL';
  if (FILTER === 'BEST') return 'BEST PICK';
  if (FILTER === 'COSTUME') return 'COSTUME';
  if (FILTER === 'MINI') return 'MINI DRESS';
  if (FILTER === 'MIDI') return 'MIDI DRESS';
  if (FILTER === 'TWO_PIECE') return 'TWO PIECE';
  if (FILTER === 'LONG') return 'LONG DRESS';
  if (FILTER === 'SAME_DAY') return 'TODAY AVAILABLE';
  return 'ALL COLLECTION';
}

function sectionIntro() {
  if (FILTER === 'HOME') return '고객님께 어울리는 스타일을 편하게 둘러보고, 재고와 사이즈는 카카오톡으로 바로 확인해주세요.';
  if (FILTER === 'NEW') return '최근 새로 입고된 신상 라인입니다. 매장 피팅 가능 여부와 재고는 카카오톡으로 바로 확인해주세요.';
  if (FILTER === 'BEST') return '쇼룸에서 먼저 추천드리는 인기 스타일입니다.';
  if (FILTER === 'COSTUME') return '마린룩, 세일러룩, 스쿨룩, 교복룩, 유니폼룩까지 함께 찾을 수 있는 Costume 라인입니다.';
  if (FILTER === 'MINI') return '파티, 클럽, 촬영에 활용하기 좋은 미니 원피스 라인입니다.';
  if (FILTER === 'MIDI') return '조금 더 차분하고 고급스러운 무드의 미디 드레스 라인입니다.';
  if (FILTER === 'TWO_PIECE') return '상의와 하의 조합으로 스타일링하기 좋은 투피스 라인입니다.';
  if (FILTER === 'LONG') return '무대, 행사, 특별한 촬영에 어울리는 롱 드레스 라인입니다.';
  const c = COLLECTIONS.find(x => x.filter === FILTER);
  return c ? c.desc : '';
}

function matchesSearch(p, rawSearch) {
  const search = norm(rawSearch);
  if (!search) return true;
  if (/^costume$/i.test(rawSearch)) return isCostume(p);
  if (/^(A라인|에이라인|a라인)$/i.test(rawSearch)) return /A라인|에이라인|a-line|aline/i.test(productText(p));
  if (/^슬림핏$/i.test(rawSearch)) return /슬림핏|슬림|H라인|머메이드|바디라인|라인감/i.test(productText(p));
  if (/^럭셔리$/i.test(rawSearch)) return /럭셔리|고급|프리미엄|우아|드레스|이브닝/i.test(productText(p));
  const sceneKey = Object.keys(SCENE_SEARCH).find(key => rawSearch === key || rawSearch.includes(key.replace('룩', '')) || key.includes(rawSearch));
  const sceneWords = sceneKey ? SCENE_SEARCH[sceneKey] : null;
  if (sceneWords) {
    const hay = norm(productText(p));
    return sceneWords.some(word => hay.includes(norm(word)));
  }
  if (/^(미니|mini)$/i.test(rawSearch)) return p.category === 'MINI' || p.length === '미니' || hasTag(p, 'MINI');
  if (/^(미디|midi)$/i.test(rawSearch)) return p.category === 'MIDI' || p.length === '미디' || hasTag(p, 'MIDI');
  if (/^(롱|long)$/i.test(rawSearch)) return p.category === 'LONG' || p.length === '롱' || hasTag(p, 'LONG');
  if (/^(투피스|two[-_ ]?piece)$/i.test(rawSearch)) return p.category === 'TWO PIECE' || hasTag(p, 'TWO PIECE');
  if (/77\s*\/\s*88|77\/88/.test(rawSearch)) return isWideSize(p);
  const hay = norm([productText(p), isWideSize(p) ? '77/88' : '', isFittingAvailable(p) ? '피팅가능' : ''].join(' '));
  return hay.includes(search);
}

function match(p) {
  const rawSearch = q.value.trim();
  let f = true;
  if (FILTER === 'COL_A') f = p.collection === 'A';
  else if (FILTER === 'COL_B') f = p.collection === 'B';
  else if (FILTER === 'COL_C') f = p.collection === 'C';
  else if (FILTER === 'NEW') f = isNew(p);
  else if (FILTER === 'BEST') f = isBest(p);
  else if (FILTER === 'COSTUME') f = isCostume(p);
  else if (FILTER === 'MINI') f = p.category === 'MINI' || p.length === '미니' || hasTag(p, 'MINI');
  else if (FILTER === 'MIDI') f = p.category === 'MIDI' || p.length === '미디' || hasTag(p, 'MIDI');
  else if (FILTER === 'TWO_PIECE') f = p.category === 'TWO PIECE' || hasTag(p, 'TWO PIECE');
  else if (FILTER === 'LONG') f = p.category === 'LONG' || p.length === '롱' || hasTag(p, 'LONG');
  else if (FILTER === 'SAME_DAY') f = isSameDayVisible(p);
  return f && matchesSearch(p, rawSearch) && visibleToAudience(p);
}

function badges(p) {
  const out = [];
  if (isNew(p)) out.push('<span class="badge gold">NEW</span>');
  if (isBest(p)) out.push('<span class="badge">BEST</span>');
  if (isFittingAvailable(p)) out.push('<span class="badge light">피팅가능</span>');
  if (out.length < 3 && isSameDayCandidate(p)) out.push('<span class="badge light">당일문의</span>');
  return out.slice(0, 3).join('') || '<span class="badge">NICE</span>';
}

function meta(p) {
  return [p.length, p.color, p.size ? 'SIZE ' + p.size : '', isWideSize(p) ? '77/88가능' : '']
    .filter(Boolean)
    .slice(0, 3)
    .map(x => `<span>${cleanText(x)}</span>`)
    .join('');
}

function priceBlock(p) {
  if (p.price) return `<div class="price">${money(p.price)}</div>`;
  return `<div class="price price-inquiry"><strong>가격문의</strong><span>카카오톡으로 재고/가격 확인</span></div>`;
}

function productCard(p, compact = false) {
  const image = mainImg(p);
  return `<article class="card ${compact ? 'compact' : ''}" data-code="${codeOf(p)}">
    <div class="photo">${image ? `<img loading="lazy" src="${img(image)}" alt="${displayName(p)}">` : `<div class="no-photo"><b>NICE</b><span>문의 가능</span></div>`}<div class="badges">${badges(p)}</div></div>
    <div class="info">
      <div class="code">상품코드 ${displayCode(p)}</div>
      <div class="name">${displayName(p)}</div>
      <div class="meta">${meta(p)}</div>
      ${priceBlock(p)}
      <button class="card-similar" type="button" data-code="${codeOf(p)}">비슷한 옷 보기</button>
    </div>
  </article>`;
}

function choose(list, limit) {
  return list.filter(p => mainImg(p)).slice(0, limit);
}

function sectionBlock(label, desc, items) {
  if (!items.length) return '';
  return `<section class="show-section"><div class="section-head"><div><h3>${label}</h3><p>${desc}</p></div><span>${items.length} picks</span></div><div class="rail">${items.map(p => productCard(p, true)).join('')}</div></section>`;
}

function styleProfile(p) {
  const text = productText(p);
  return [
    p.category === 'MINI' || p.length === '미니' || hasTag(p, 'MINI') ? '미니' : '',
    p.category === 'MIDI' || p.length === '미디' || hasTag(p, 'MIDI') ? '미디' : '',
    p.category === 'LONG' || p.length === '롱' || hasTag(p, 'LONG') ? '롱' : '',
    p.category === 'TWO PIECE' || hasTag(p, 'TWO PIECE') ? '투피스' : '',
    /A라인|에이라인|a-line|aline/i.test(text) ? 'A라인' : '',
    /슬림핏|슬림|H라인|머메이드|바디라인|라인감/i.test(text) ? '슬림핏' : '',
    /럭셔리|고급|프리미엄|우아|드레스|이브닝/i.test(text) ? '럭셔리' : '',
    isCostume(p) ? 'Costume' : '',
    isWideSize(p) ? '77/88' : ''
  ].filter(Boolean);
}

function similarScore(source, candidate) {
  const sourceProfile = styleProfile(source);
  const candidateProfile = styleProfile(candidate);
  let score = 0;
  sourceProfile.forEach(tag => {
    if (candidateProfile.includes(tag)) score += tag === 'A라인' || tag === '슬림핏' || tag === '미디' ? 120 : 80;
  });
  if (source.category && source.category === candidate.category) score += 55;
  if (source.length && source.length === candidate.length) score += 45;
  if (source.collection && source.collection === candidate.collection) score += 20;
  if (source.color && candidate.color && source.color === candidate.color) score += 12;
  if (isBest(candidate)) score += 8;
  if (isNew(candidate)) score += 5;
  if (!mainImg(candidate)) score -= 80;
  return score;
}

function similarItemsFor(source, limit = 12) {
  return PRODUCTS
    .filter(p => visibleToAudience(p) && codeOf(p) !== codeOf(source) && mainImg(p))
    .map(p => ({ p, score: similarScore(source, p) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || rankProduct(b.p) - rankProduct(a.p))
    .slice(0, limit)
    .map(x => x.p);
}

function similarShelfBlock() {
  const source = PRODUCTS.find(p => codeOf(p) === SIMILAR_CODE);
  if (!source) return '';
  const items = similarItemsFor(source);
  if (!items.length) return '';
  const profile = styleProfile(source).slice(0, 4).join(' · ');
  return `<section class="similar-shelf" aria-live="polite">
    <div class="section-head similar-head">
      <div>
        <h3>비슷한 상품</h3>
        <p>${displayName(source)} 기준 ${profile ? profile + ' ' : ''}스타일을 모았습니다.</p>
      </div>
      <button class="similar-close" type="button" aria-label="비슷한 상품 닫기">닫기</button>
    </div>
    <div class="rail">${items.map(p => productCard(p, true)).join('')}</div>
  </section>`;
}

function collectionBlock() {
  return `<section class="collection-grid">
    ${COLLECTIONS.map(c => `<article class="collection-card" data-f="${c.filter}"><div class="collection-count">${cCount(c.key)} items</div><div class="collection-title">${c.title}</div><div class="collection-name">${c.name}</div><p>${c.desc}</p><span class="collection-action">VIEW EDIT</span></article>`).join('')}
  </section>`;
}

function instaIcon() {
  return `<span class="insta-logo" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" stroke-width="2"></rect>
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"></circle>
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor"></circle>
    </svg>
  </span>`;
}

function communityBlock() {
  return `<section class="community-panel" aria-label="NICE community">
    <div>
      <h2 class="community-title">NICE COMMUNITY</h2>
      <p class="community-copy">동대문 밀리오레 NICE<br>파티룩 · 무대의상 · 클럽룩 · 방송의상 전문</p>
      <p class="community-guide">매장 피팅 가능 / 당일 구매 가능 / 택배 발송 가능<br>사이즈와 재고는 상품별로 다르므로 방문 전 카카오톡 문의를 권장합니다.</p>
    </div>
    <div class="community-links">
      <a class="community-link kakao community-brand" href="${KAKAO_URL}" target="_blank" rel="noopener"><span class="kakao-logo">TALK</span><span>카카오톡 문의</span></a>
      <a class="community-link insta community-brand" href="${INSTA_URL}" target="_blank" rel="noopener">${instaIcon()}<span>Instagram</span></a>
      <a class="community-link naver community-brand" href="${BLOG_URL}" target="_blank" rel="noopener"><span class="naver-logo">N</span><span>Naver Blog</span></a>
      <button class="community-link vip-open subtle" type="button">${isVipActive() ? '당일문의 상품 보기' : 'VIP 인증'}</button>
      ${isVipActive() ? '<button class="community-link vip-clear subtle" type="button">인증해제</button>' : ''}
    </div>
  </section>`;
}

function renderHome() {
  const visible = PRODUCTS.filter(visibleToAudience);
  const editor = choose(sortProducts(visible.filter(p => isBest(p) && !isNew(p))), 8);
  const editorFallback = choose(sortProducts(visible.filter(isBest)), 8);
  const editorItems = editor.length ? editor : editorFallback;
  const editorCodes = new Set(editorItems.map(codeOf));
  const fresh = choose(sortProducts(visible.filter(p => isNew(p) && !editorCodes.has(codeOf(p)))), 10);
  const sameDay = choose(sortProducts(visible.filter(isSameDayVisible)), 10);
  title.textContent = 'ONLINE SHOWROOM';
  count.textContent = `${visible.length} items`;
  intro.textContent = sectionIntro();
  grid.className = 'home';
  grid.innerHTML = `
    ${similarShelfBlock()}
    ${sectionBlock("Editor's Select", '신상과 겹치지 않게, 지금 쇼룸에서 안정적으로 추천드리기 좋은 스타일을 모았습니다.', editorItems)}
    ${sectionBlock('New Arrival', '최근 새로 입고된 신상 라인입니다. 매장 피팅 가능 여부와 재고는 카카오톡으로 바로 확인해주세요.', fresh)}
    ${collectionBlock()}
    ${communityBlock()}
    ${isVipActive() ? sectionBlock('TODAY AVAILABLE', '오늘 매장에서 바로 확인하기 좋은 상품입니다.', sameDay) : ''}`;
  $$('.collection-card').forEach(el => el.onclick = () => applyView(el.dataset.f, { push: true, scroll: true }));
  bindCards();
  bindVipControls();
}

function render() {
  title.textContent = sectionName();
  intro.textContent = sectionIntro();
  if (FILTER === 'HOME' && !q.value.trim()) return renderHome();
  grid.className = 'grid';
  const list = sortProducts(PRODUCTS.filter(match));
  count.textContent = `${list.length} items`;
  if (!list.length) {
    grid.innerHTML = '<div class="empty">조건에 맞는 상품이 없습니다. 카카오톡으로 원하시는 스타일을 보내주시면 비슷한 상품을 추천드릴게요.</div>';
    return;
  }
  grid.innerHTML = `${similarShelfBlock()}${list.map(p => productCard(p)).join('')}`;
  bindCards();
}

function points(p) {
  if (Array.isArray(p.points) && p.points.length) return p.points.map(x => cleanText(x)).slice(0, 4);
  const text = cleanText(p.desc || p.description || p.mainCopy || '');
  const parts = text.replaceAll(' / ', '. ').split(/(?<=\.)\s+/).map(x => x.trim()).filter(Boolean);
  const picked = parts.filter(x => !/재고|촬영 환경|방문 전|DM 문의|온라인 쇼룸용/.test(x)).slice(0, 3);
  return picked.length ? picked : ['매장 피팅과 사이즈 확인 후 구매 가능합니다.', '카카오톡으로 재고와 가격을 빠르게 안내드립니다.'];
}

function editorNote(p) {
  return cleanText(p.editorsNote || p.desc || p.description || p.mainCopy || 'NICE 쇼룸 추천 상품입니다.');
}

function contactText(p, mode = 'product') {
  const prefix = '상품 문의드립니다.';
  return `${prefix}\n상품명: ${displayName(p)}\n상품코드: ${displayCode(p)}\n재고/사이즈/가격 안내 부탁드립니다.`;
}

function copyContact(p, mode) {
  const text = contactText(p, mode);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    // Link navigation still works if browser copy is unavailable.
  }
  area.remove();
}

function contactProduct(p, mode = 'product') {
  copyContact(p, mode);
  window.open(KAKAO_URL, '_blank', 'noopener');
}

function showSimilar(p) {
  SIMILAR_CODE = codeOf(p);
  render();
  requestAnimationFrame(() => {
    const shelf = $('.similar-shelf');
    if (shelf) shelf.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function closeDetail(fromHistory = false) {
  if (!modal.classList.contains('open')) return;
  modal.classList.remove('open');
  if (modalHistoryOpen && !fromHistory) {
    modalHistoryOpen = false;
    history.back();
  } else if (fromHistory) {
    modalHistoryOpen = false;
  }
}

function openModalHistory(code) {
  if (!modalHistoryOpen) {
    history.pushState({ niceModal: true, code }, '', `#${code}`);
    modalHistoryOpen = true;
  } else {
    history.replaceState({ niceModal: true, code }, '', `#${code}`);
  }
}

function openDetail(code) {
  const p = PRODUCTS.find(x => codeOf(x) === code);
  if (!p || !visibleToAudience(p)) return;
  currentImages = p.cuts && p.cuts.length ? p.cuts : (p.images || []).map((u, i) => ({ url: u, cut: '상세 ' + (i + 1) }));
  const labelTags = [isNew(p) ? 'NEW' : '', isBest(p) ? 'BEST' : '', isFittingAvailable(p) ? '피팅가능' : '', isWideSize(p) ? '77/88가능' : ''].filter(Boolean).slice(0, 4);
  detail.innerHTML = `<div class="body">
    <section class="visual">
      <div class="main">${currentImages[0] ? `<img id="mainImage" src="${img(currentImages[0].url)}" alt="${displayName(p)}">` : 'NO IMAGE'}</div>
      <div class="thumbs">${currentImages.map((im, i) => `<button class="thumb ${i === 0 ? 'on' : ''}" data-i="${i}"><img src="${img(im.url)}" alt="${displayName(p)} ${i + 1}"></button>`).join('')}</div>
    </section>
    <section class="copy">
      <div class="tags">${labelTags.map(t => `<span>${t}</span>`).join('')}</div>
      <h2>${displayName(p)}</h2>
      <h3>${money(p.price)}</h3>
      ${!p.price ? '<p class="detail-price-note">카카오톡으로 현재 재고와 가격을 바로 확인해주세요.</p>' : ''}
      <div class="box"><b>WHY YOU'LL LOVE IT</b><ul>${points(p).map(x => `<li>${cleanText(x)}</li>`).join('')}</ul></div>
      <div class="box"><b>EDITOR'S NOTE</b><p>${editorNote(p)}</p></div>
      <div class="box"><b>RECOMMENDED FOR</b><p>${cleanText(p.recommend || '파티 · 클럽 · 무대 · 촬영 · 모임').replaceAll('/', ' · ')}</p></div>
      <div class="spec">
        <div class="cell"><b>COLOR</b><span>${cleanText(p.color || '-')}</span></div>
        <div class="cell"><b>SIZE</b><span>${cleanText(p.size || p.sizeInfo || '-')}</span></div>
        ${p.modelSize ? `<div class="cell"><b>MODEL</b><span>${cleanText(p.modelSize)}</span></div>` : ''}
        ${p.wearSize ? `<div class="cell"><b>WEAR</b><span>${cleanText(p.wearSize)}</span></div>` : ''}
        <div class="cell"><b>FABRIC</b><span>${cleanText(p.fabric || '확인필요')}</span></div>
        <div class="cell"><b>DETAIL</b><span>${cleanText(p.wearInfo || p.lining || '-')}</span></div>
      </div>
      <div class="purchase-guide">
        <b>구매 안내</b>
        <p>이 상품은 매장 재고와 사이즈 확인 후 구매 가능합니다. 카카오톡으로 상품 코드 또는 캡처 이미지를 보내주시면 빠르게 안내드립니다.${hasExtendedSizeLeadTime(p) ? '<br>77/88 및 일부 99 사이즈는 제작 문의가 가능하며, 보통 1~2주 정도 소요됩니다. 지연 시 한 달 이상 걸릴 수 있습니다.' : ''}</p>
      </div>
      <div class="cta detail-cta">
        <button class="kakao detail-contact" type="button" data-mode="product"><span class="kakao-logo">TALK</span><span>상품 문의</span></button>
        <a class="insta" href="${INSTA_URL}" target="_blank" rel="noopener">${instaIcon()}<span>인스타 DM 문의</span></a>
      </div>
    </section>
  </div>`;
  modal.classList.add('open');
  openModalHistory(code);
  $$('.thumb', detail).forEach(b => b.onclick = () => {
    const i = Number(b.dataset.i);
    $('#mainImage').src = img(currentImages[i].url);
    $$('.thumb', detail).forEach((x, j) => x.classList.toggle('on', i === j));
  });
  $$('.detail-contact', detail).forEach(b => b.onclick = () => contactProduct(p, b.dataset.mode));
}

function bindCards() {
  $$('.card').forEach(el => el.onclick = () => openDetail(el.dataset.code));
  $$('.card-similar').forEach(btn => btn.onclick = e => {
    e.stopPropagation();
    const p = PRODUCTS.find(x => codeOf(x) === btn.dataset.code);
    if (p) showSimilar(p);
  });
  $$('.similar-close').forEach(btn => btn.onclick = () => {
    SIMILAR_CODE = '';
    render();
  });
}

function openVipModal() {
  if (!vipModal) return;
  vipInput.value = '';
  vipMessage.textContent = '';
  vipMessage.className = 'vip-message';
  vipModal.classList.add('open');
  setTimeout(() => vipInput.focus(), 60);
}

function closeVipModal() {
  if (vipModal) vipModal.classList.remove('open');
}

function bindVipControls() {
  $$('.vip-open').forEach(el => el.onclick = () => {
    if (isVipActive()) applyView('SAME_DAY', { push: true, scroll: true });
    else openVipModal();
  });
  $$('.vip-clear').forEach(el => el.onclick = () => {
    clearVip();
    FILTER = 'HOME';
    q.value = '';
    buildQuick();
    buildChips();
    render();
  });
}

$('#close').onclick = () => closeDetail();
modal.onclick = e => { if (e.target === modal) closeDetail(); };
chips.onclick = e => {
  const b = e.target.closest('.chip');
  if (!b) return;
  applyView(b.dataset.f, { push: true, scroll: true });
};
quick.onclick = e => {
  const b = e.target.closest('.quick-chip');
  if (!b) return;
  applyView('ALL', { search: b.dataset.q, push: true, scroll: true });
};
q.oninput = () => {
  if (q.value.trim() && FILTER === 'HOME') FILTER = 'ALL';
  buildChips();
  render();
  history.replaceState({ niceView: true, filter: FILTER, search: q.value }, '', q.value.trim() ? `#view-${FILTER.toLowerCase()}` : location.pathname);
};

if (vipModal) {
  $('#vipClose').onclick = closeVipModal;
  $('#vipCancel').onclick = closeVipModal;
  $('#vipSubmit').onclick = () => {
    if (vipInput.value.trim().toUpperCase() === vipCode()) {
      setVipActive();
      vipMessage.textContent = 'VIP 인증이 완료되었습니다.';
      vipMessage.className = 'vip-message ok';
      setTimeout(() => {
        closeVipModal();
        FILTER = 'HOME';
        q.value = '';
        buildQuick();
        buildChips();
        render();
      }, 500);
    } else {
      vipMessage.textContent = '인증코드가 올바르지 않습니다.';
      vipMessage.className = 'vip-message error';
    }
  };
  vipModal.onclick = e => { if (e.target === vipModal) closeVipModal(); };
  vipInput.onkeydown = e => { if (e.key === 'Enter') $('#vipSubmit').click(); };
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDetail();
    closeVipModal();
  }
});

window.addEventListener('popstate', e => {
  if (modal.classList.contains('open')) {
    closeDetail(true);
    return;
  }
  const state = e.state && e.state.niceView ? e.state : { filter: 'HOME', search: '' };
  FILTER = state.filter || 'HOME';
  q.value = state.search || '';
  buildChips();
  render();
});

fetch('./products.json?v=' + VERSION)
  .then(r => r.json())
  .then(d => {
    PRODUCTS = d.map(normalizeProduct);
    history.replaceState({ niceView: true, filter: FILTER, search: q.value }, '', location.href);
    buildQuick();
    buildChips();
    render();
  })
  .catch(() => {
    grid.innerHTML = '<div class="empty">상품 데이터를 불러오지 못했습니다.</div>';
  });
