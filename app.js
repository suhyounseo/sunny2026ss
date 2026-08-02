const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];
const q = $('#q');
const langSwitcher = $('#langSwitcher');
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
const VERSION = 'aug02mobilezoom1';
const KAKAO_URL = 'https://qr.kakao.com/talk/aGDd1dyfDwbjsvFXshqsTJhGWWc-';
const INSTA_URL = 'https://www.instagram.com/dongdaemun_migliore_nice/';
const BLOG_URL = 'https://blog.naver.com/dongdaemun_nice';
const SMARTSTORE_URL = 'https://smartstore.naver.com/nisshop'; // 스마트스토어 주소
const VIP_STORAGE_KEY = 'niceVipUntil';
const LANG_STORAGE_KEY = 'niceLang';
const VIP_TTL_MS = 12 * 60 * 60 * 1000;
const VIP_CODE_CHARS = [78, 73, 67, 69, 86, 73, 80];
const LANGS = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' }
];
const I18N = {
  ko: {
    searchPlaceholder: '미니, A라인, 롱드레스, 앙크 검색',
    item: 'items',
    picks: 'picks',
    productCode: '상품코드',
    similarSearch: '비슷한 옷 검색',
    noPhoto: '문의 가능',
    priceInquiry: '가격문의',
    priceInquiryNote: '카카오톡으로 재고/가격 확인',
    detailPriceNote: '재고와 가격은 카카오톡으로 바로 확인해드립니다.',
    stylePoint: '스타일 포인트',
    recommendFor: '추천 상황',
    detailDesc: '상세 설명',
    sizeGuide: '사이즈 가이드',
    sizeAsk: '상세 사이즈는 카카오톡으로 문의해 주세요.',
    topBottom: '하의',
    topDress: '상의/원피스',
    actualSize: '실측',
    size: '사이즈',
    chest: '가슴',
    waist: '허리',
    hip: '힙',
    sleeve: '소매',
    totalLength: '총장',
    color: '컬러',
    fabric: '소재',
    lining: '안감',
    stretch: '신축성',
    cap: '캡',
    sheer: '비침',
    thickness: '두께',
    zipper: '지퍼',
    ask: '문의',
    commonNote: '재고, 실측, 피팅 상담은 상품코드와 함께 카카오톡으로 문의해 주세요.',
    productAsk: '상품 문의',
    instaAsk: '인스타 DM 문의',
    similarTitle: '비슷한 옷 추천',
    similarDesc: '{name} 기준 {profile}스타일을 모았습니다.',
    close: '닫기',
    empty: '조건에 맞는 상품이 없습니다. 카카오톡으로 원하시는 스타일을 보내주시면 비슷한 상품을 추천드릴게요.',
    dataFail: '상품 데이터를 불러오지 못했습니다.',
    communityCopy: '동대문 밀리오레 NICE<br>파티룩 · 무대의상 · 클럽룩 · 방송의상 전문',
    communityGuide: '쇼룸에는 매장 셀렉션과 네이버 등록 상품이 함께 소개됩니다.',
    kakaoAsk: '카카오톡 문의',
    vipAuth: 'VIP 인증',
    smartstoreGo: '네이버 등록상품 보기',
    vipViewSameDay: '당일발송 상품 보기',
    vipClear: '인증해제',
    vipTitle: 'VIP 인증',
    vipDesc: 'VIP 고객에게만 공개되는 셀렉션을 보여드립니다.',
    vipPlaceholder: '인증코드를 입력해 주세요',
    cancel: '취소',
    verify: '인증하기',
    vipOk: 'VIP 인증이 완료되었습니다.',
    vipError: '인증코드가 올바르지 않습니다.',
    fittingAvailable: '피팅가능',
    sameDay: '당일발송',
    showroomIntro: '캡처 또는 상품코드로 문의 주세요.',
    newIntro: '최근 새로 입고된 신상 라인입니다. 매장 피팅 가능 여부와 재고는 카카오톡으로 바로 확인해주세요.',
    bestIntro: '쇼룸에서 먼저 추천드리는 인기 스타일입니다.',
    costumeIntro: '마린룩, 세일러룩, 스쿨룩, 유니폼룩까지 함께 찾을 수 있는 Costume 라인입니다.',
    miniIntro: '파티, 클럽, 촬영에 활용하기 좋은 미니 원피스 라인입니다.',
    midiIntro: '조금 더 차분하고 고급스러운 무드의 미디 드레스 라인입니다.',
    twoPieceIntro: '상의와 하의 조합으로 스타일링하기 좋은 투피스 라인입니다.',
    longIntro: '무대, 행사, 특별한 촬영에 어울리는 롱 드레스 라인입니다.',
    editorDesc: '지금 쇼룸에서 먼저 보여드리고 싶은 제품입니다.',
    smartstoreDesc: '네이버에 등록된 일부 상품을 모아봤어요.',
    smartstoreBest: '네이버 등록상품 BEST',
    viewAllProducts: '전체 상품 보기',
    julyMore: '7월 신상 더보기',
    editorsMore: '에디터스픽 더보기',
    dmGuideTitle: '캡처/상품코드로 문의 주세요.',
    dmGuideLine: '재고·피팅 바로 확인해드릴게요.',
    luxury: '럭셔리',
    sameDesignColors: '같은 디자인 다른 컬러',
    coordinatedLook: '코디 상품',
    viewProduct: '상품 보기',
    contactPrefix: '상품 문의드립니다.',
    contactStockSizePrice: '재고/사이즈/가격 안내 부탁드립니다.',
    wearInfo: '착용 정보',
    photoRuleKicker: '사진 안내',
    photoRuleTitle: '쇼룸 사진은 상품을 고르기 쉽게 정리되어 있습니다.',
    photoRuleMain: '대표컷',
    photoRuleMainCopy: '전체 핏과 분위기를 먼저 확인할 수 있습니다.',
    photoRuleDetail: '상세컷',
    photoRuleDetailCopy: '길이, 색감, 소재, 포인트를 차례로 확인할 수 있습니다.',
    photoRuleContact: '상담컷',
    photoRuleContactCopy: '마음에 드는 상품은 캡처 또는 상품코드로 문의해 주세요.',
    imagePrev: '이전 사진',
    imageNext: '다음 사진',
    newDesc: '나이스가 선별한 신상 디자인입니다. 컬러와 옵션은 상품 상세에서 확인해주세요.',
    collectionJuly: '7월 신상만 모은 셀렉션',
    collectionA: '6월 마지막 신상 제품만 모은 셀렉션',
    collectionB: '투피스와 세트 아이템으로 완성하는 스타일링',
    collectionC: '특별한 순간을 위한 미디·롱 드레스 셀렉션',
    collectionD: '클럽룩·파티룩으로 입기 좋은 미니원피스 셀렉션',
    collectionE: '77·88 사이즈까지 확인 가능한 추천 셀렉션'
  },
  en: {
    searchPlaceholder: 'Search mini, slim fit, party look, stage outfit',
    item: 'items', picks: 'picks', productCode: 'Code', similarSearch: 'Find similar styles', noPhoto: 'Ask us',
    priceInquiry: 'Ask for price', priceInquiryNote: 'Check stock/price via KakaoTalk', detailPriceNote: 'Stock and price are confirmed quickly via KakaoTalk.',
    stylePoint: 'Style Points', recommendFor: 'Recommended For', detailDesc: 'Details', sizeGuide: 'Size Guide', sizeAsk: 'Ask us on KakaoTalk for detailed measurements.',
    topBottom: 'Bottom', topDress: 'Top/Dress', actualSize: 'Measurements', size: 'Size', chest: 'Chest', waist: 'Waist', hip: 'Hip', sleeve: 'Sleeve', totalLength: 'Length',
    color: 'Color', fabric: 'Fabric', lining: 'Lining', stretch: 'Stretch', cap: 'Cup', sheer: 'Sheer', thickness: 'Thickness', zipper: 'Zipper', ask: 'Ask',
    commonNote: 'For stock, measurements, and fitting advice, send us the product code on KakaoTalk.',
    productAsk: 'Product Inquiry', instaAsk: 'Instagram DM', similarTitle: 'Similar Styles', similarDesc: 'Based on {name}, we gathered {profile}styles.', close: 'Close',
    empty: 'No matching products. Send your preferred style on KakaoTalk and we will recommend similar items.', dataFail: 'Product data could not be loaded.',
    communityCopy: 'Dongdaemun Migliore NICE<br>Party looks · Stage outfits · Club looks · Broadcast styling',
    communityGuide: 'The showroom includes both in-store selections and items listed on Naver.',
    kakaoAsk: 'KakaoTalk Inquiry', smartstoreGo: 'View Naver items', vipAuth: 'VIP Access', vipViewSameDay: 'View Same-Day Items', vipClear: 'Clear VIP', vipTitle: 'VIP Access',
    vipDesc: 'View selections available only to VIP customers.', vipPlaceholder: 'Enter VIP code', cancel: 'Cancel', verify: 'Verify', vipOk: 'VIP access confirmed.', vipError: 'Invalid VIP code.',
    fittingAvailable: 'Fitting available', sameDay: 'Same-day',
    showroomIntro: 'Search by mood or length. Send us the product code to quickly check stock and size.',
    newIntro: 'Recently arrived styles. Ask on KakaoTalk for fitting availability and stock.', bestIntro: 'Popular styles recommended by the showroom.',
    costumeIntro: 'Costume edit including sailor, school, uniform, and concept looks.', miniIntro: 'Mini dress styles for parties, clubs, and shoots.',
    midiIntro: 'Midi dress styles with a calmer, elevated mood.', twoPieceIntro: 'Two-piece styling with matching tops and bottoms.', longIntro: 'Long dress styles for stage, events, and special shoots.',
    editorDesc: 'Products we want to show first in the showroom.',
    smartstoreDesc: 'A curated selection of items listed on Naver.',
    smartstoreBest: 'Best on Naver',
    viewAllProducts: 'View all products',
    julyMore: 'View July arrivals',
    editorsMore: 'View Editor’s Picks',
    dmGuideTitle: 'Send a screenshot or product code.',
    dmGuideLine: 'We will quickly check stock and fitting.',
    luxury: 'Luxury',
    sameDesignColors: 'Other colors in this design',
    coordinatedLook: 'Coordinated Look',
    viewProduct: 'View product',
    contactPrefix: 'Product inquiry.',
    contactStockSizePrice: 'Please check stock, size, and price.',
    wearInfo: 'Wear Information',
    photoRuleKicker: 'PHOTO GUIDE',
    photoRuleTitle: 'Showroom images are arranged to help you choose with confidence.',
    photoRuleMain: 'Main image',
    photoRuleMainCopy: 'Check the overall fit and mood first.',
    photoRuleDetail: 'Detail image',
    photoRuleDetailCopy: 'Review length, color, fabric, and design points in order.',
    photoRuleContact: 'Inquiry image',
    photoRuleContactCopy: 'Send a screenshot or product code for quick assistance.',
    imagePrev: 'Previous photo',
    imageNext: 'Next photo', newDesc: 'New designs selected by NICE. Check colors and options in product details.',
    collectionJuly: 'July new-arrival selection', collectionA: 'June final new-arrival selection', collectionB: 'Set-up and styling edit', collectionC: 'Midi and long dress edit for special moments', collectionD: 'Mini dress selection for club and party looks', collectionE: 'Recommended styles available in 77/88 sizing'
  },
  zh: {
    searchPlaceholder: '搜索迷你、修身、派对风、舞台服',
    item: '件', picks: '款', productCode: '商品代码', similarSearch: '查找相似款', noPhoto: '可咨询',
    priceInquiry: '价格咨询', priceInquiryNote: '通过 KakaoTalk 确认库存/价格', detailPriceNote: '库存和价格可通过 KakaoTalk 快速确认。',
    stylePoint: '风格亮点', recommendFor: '推荐场合', detailDesc: '详细说明', sizeGuide: '尺码指南', sizeAsk: '详细尺码请通过 KakaoTalk 咨询。',
    topBottom: '下装', topDress: '上衣/连衣裙', actualSize: '实测', size: '尺码', chest: '胸围', waist: '腰围', hip: '臀围', sleeve: '袖长', totalLength: '衣长',
    color: '颜色', fabric: '面料', lining: '内衬', stretch: '弹性', cap: '胸垫', sheer: '透视', thickness: '厚度', zipper: '拉链', ask: '咨询',
    commonNote: '库存、实测和试穿建议请带商品代码通过 KakaoTalk 咨询。',
    productAsk: '商品咨询', instaAsk: 'Instagram 私信', similarTitle: '相似款推荐', similarDesc: '以 {name} 为参考，为您整理了 {profile}风格。', close: '关闭',
    empty: '没有符合条件的商品。请通过 KakaoTalk 发送想要的风格，我们会推荐相似款。', dataFail: '无法加载商品数据。',
    communityCopy: '东大门 Migliore NICE<br>派对造型 · 舞台服 · 夜店风 · 直播服装',
    communityGuide: '展厅同时展示门店精选款和 Naver 上架商品。',
    kakaoAsk: 'KakaoTalk 咨询', smartstoreGo: '查看 Naver 商品', vipAuth: 'VIP 认证', vipViewSameDay: '查看当日发货', vipClear: '解除认证', vipTitle: 'VIP 认证',
    vipDesc: '显示仅 VIP 顾客可见的精选商品。', vipPlaceholder: '请输入认证码', cancel: '取消', verify: '认证', vipOk: 'VIP 认证完成。', vipError: '认证码不正确。',
    fittingAvailable: '可试穿', sameDay: '当日发货',
    showroomIntro: '可按氛围或长度搜索。喜欢的商品请用商品代码咨询库存和尺码。',
    newIntro: '最近新入库的款式。试穿和库存请通过 KakaoTalk 确认。', bestIntro: 'NICE 展厅推荐的人气款式。',
    costumeIntro: '包含水手风、校园风、制服风和概念造型的 Costume 系列。', miniIntro: '适合派对、夜店和拍摄的迷你连衣裙系列。',
    midiIntro: '更沉稳高级的中长款连衣裙系列。', twoPieceIntro: '上衣和下装组合的套装系列。', longIntro: '适合舞台、活动和特别拍摄的长裙系列。',
    editorDesc: 'NICE 展厅优先推荐的精选商品。',
    smartstoreDesc: '为您整理了部分已上架 Naver 的商品。',
    smartstoreBest: 'Naver热卖款',
    viewAllProducts: '查看全部商品',
    julyMore: '查看7月新品',
    editorsMore: '查看推荐款',
    dmGuideTitle: '请发送截图或商品代码。',
    dmGuideLine: '我们会快速确认库存和试穿。',
    luxury: '高级',
    sameDesignColors: '同款其他颜色',
    coordinatedLook: '搭配商品',
    viewProduct: '查看商品',
    contactPrefix: '商品咨询。',
    contactStockSizePrice: '请确认库存、尺码和价格。',
    wearInfo: '穿着信息',
    photoRuleKicker: '图片说明',
    photoRuleTitle: '展厅图片按照便于挑选商品的顺序整理。',
    photoRuleMain: '主图',
    photoRuleMainCopy: '先确认整体版型和氛围。',
    photoRuleDetail: '细节图',
    photoRuleDetailCopy: '依次确认长度、颜色、面料和设计重点。',
    photoRuleContact: '咨询图',
    photoRuleContactCopy: '请发送截图或商品代码，我们会快速协助。',
    imagePrev: '上一张',
    imageNext: '下一张', newDesc: 'NICE 精选的新款设计。颜色和选项请在商品详情中确认。',
    collectionJuly: '7月新款精选', collectionA: '6月最后新款精选', collectionB: '套装与造型精选', collectionC: '特别场合中长裙精选', collectionD: '适合派对与夜店风的迷你连衣裙精选', collectionE: '77/88尺码可咨询推荐款'
  },
  ja: {
    searchPlaceholder: 'ミニ、スリム、パーティールック、ステージ衣装を検索',
    item: '点', picks: '点', productCode: '商品コード', similarSearch: '似た服を探す', noPhoto: 'お問い合わせ可',
    priceInquiry: '価格問い合わせ', priceInquiryNote: 'KakaoTalkで在庫/価格を確認', detailPriceNote: '在庫と価格はKakaoTalkで確認できます。',
    stylePoint: 'スタイルポイント', recommendFor: 'おすすめシーン', detailDesc: '詳細説明', sizeGuide: 'サイズガイド', sizeAsk: '詳細サイズはKakaoTalkでお問い合わせください。',
    topBottom: 'ボトム', topDress: 'トップス/ワンピース', actualSize: '実寸', size: 'サイズ', chest: 'バスト', waist: 'ウエスト', hip: 'ヒップ', sleeve: '袖丈', totalLength: '総丈',
    color: 'カラー', fabric: '素材', lining: '裏地', stretch: '伸縮性', cap: 'カップ', sheer: '透け感', thickness: '厚み', zipper: 'ファスナー', ask: '問い合わせ',
    commonNote: '在庫、実寸、フィッティング相談は商品コードと一緒にKakaoTalkでお問い合わせください。',
    productAsk: '商品問い合わせ', instaAsk: 'Instagram DM', similarTitle: '似た服のおすすめ', similarDesc: '{name}を基準に{profile}スタイルを集めました。', close: '閉じる',
    empty: '条件に合う商品がありません。希望スタイルをKakaoTalkで送っていただければ似た商品をご提案します。', dataFail: '商品データを読み込めませんでした。',
    communityCopy: '東大門ミリオレ NICE<br>パーティールック · ステージ衣装 · クラブルック · 配信用衣装',
    communityGuide: 'ショールームには店頭セレクトとNaver掲載商品が一緒に紹介されています。',
    kakaoAsk: 'KakaoTalk問い合わせ', smartstoreGo: 'Naver掲載商品を見る', vipAuth: 'VIP認証', vipViewSameDay: '当日発送商品を見る', vipClear: '認証解除', vipTitle: 'VIP認証',
    vipDesc: 'VIPのお客様限定のセレクションを表示します。', vipPlaceholder: '認証コードを入力してください', cancel: 'キャンセル', verify: '認証', vipOk: 'VIP認証が完了しました。', vipError: '認証コードが正しくありません。',
    fittingAvailable: '試着可', sameDay: '当日発送',
    showroomIntro: '雰囲気や丈で検索できます。気になる商品は商品コードで在庫とサイズを確認できます。',
    newIntro: '最近入荷した新作ラインです。試着可否と在庫はKakaoTalkで確認できます。', bestIntro: 'ショールームおすすめの人気スタイルです。',
    costumeIntro: 'マリン、セーラー、スクール、ユニフォーム風まで探せるCostumeラインです。', miniIntro: 'パーティー、クラブ、撮影に使いやすいミニワンピースラインです。',
    midiIntro: '落ち着いた高級感のあるミディドレスラインです。', twoPieceIntro: 'トップスとボトムスで完成するツーピースラインです。', longIntro: 'ステージ、イベント、特別な撮影に合うロングドレスラインです。',
    editorDesc: '今ショールームで先にお見せしたい商品です。',
    smartstoreDesc: 'Naverに掲載中の一部商品をまとめました。',
    smartstoreBest: 'Naver販売中 BEST',
    viewAllProducts: '全商品を見る',
    julyMore: '7月新作を見る',
    editorsMore: 'おすすめを見る',
    dmGuideTitle: 'スクショまたは商品コードを送ってください。',
    dmGuideLine: '在庫と試着可否をすぐ確認します。',
    luxury: 'ラグジュアリー',
    sameDesignColors: '同デザインの他カラー',
    coordinatedLook: 'コーデ商品',
    viewProduct: '商品を見る',
    contactPrefix: '商品問い合わせです。',
    contactStockSizePrice: '在庫・サイズ・価格の案内をお願いします。',
    wearInfo: '着用情報',
    photoRuleKicker: '写真ガイド',
    photoRuleTitle: 'ショールーム写真は商品を選びやすい順番で整理しています。',
    photoRuleMain: 'メイン写真',
    photoRuleMainCopy: '全体のフィット感と雰囲気を最初に確認できます。',
    photoRuleDetail: '詳細写真',
    photoRuleDetailCopy: '丈感・色味・素材・デザインポイントを確認できます。',
    photoRuleContact: '相談用写真',
    photoRuleContactCopy: 'スクショまたは商品コードを送ってください。',
    imagePrev: '前の写真',
    imageNext: '次の写真', newDesc: 'NICEが選んだ新作デザインです。カラーとオプションは商品詳細でご確認ください。',
    collectionJuly: '7月入荷の新作セレクション', collectionA: '6月最後の新作セレクション', collectionB: 'セットアップ＆スタイリング編集', collectionC: '特別な日のミディ・ロングドレス編集', collectionD: 'クラブ・パーティー向けミニドレス編集', collectionE: '77/88サイズ対応のおすすめセレクション'
  }
};
let PRODUCTS = [];
let FILTER = 'HOME';
let currentImages = [];
let currentImageIndex = 0;
let currentProduct = null;
let modalHistoryOpen = false;
let SIMILAR_CODE = '';
let LANG = localStorage.getItem(LANG_STORAGE_KEY) || 'ko';
if (!I18N[LANG]) LANG = 'ko';
const COLLECTIONS = [
  { key: 'JULY_NEW', filter: 'COL_JULY', title: '7월 신상', name: 'July New Selection', desc: '이번 7월에 새로 입고된 NICE 신상 셀렉션입니다. 색상, 사이즈, 재고는 카카오톡으로 문의해 주세요.' },
  { key: 'A', filter: 'COL_A', title: 'Collection A', name: 'June Final New Arrival', desc: '6월 마지막 신상 제품만 모은 셀렉션' },
  { key: 'B', filter: 'COL_B', title: 'Collection B', name: 'Set-up & Styling Edit', desc: '투피스와 세트 아이템으로 완성하는 스타일링' },
  { key: 'C', filter: 'COL_C', title: 'Collection C', name: 'Evening & Long Edit', desc: '특별한 순간을 위한 미디·롱 드레스 셀렉션' },
  { key: 'D', filter: 'COL_D', title: 'Collection D', name: 'Mini Dress Edit', desc: '클럽룩·파티룩으로 입기 좋은 미니원피스 셀렉션' },
  { key: 'E', filter: 'COL_E', title: 'Collection E', name: 'Plus Fit & 77·88 Edit', desc: '77·88 사이즈까지 확인 가능한 추천 셀렉션' }
];
const FILTERS_BASE = ['HOME', 'ALL', 'BEST', 'NEW', 'COSTUME'];
const LABEL = {
  HOME: 'HOME',
  ALL: 'ALL',
  BEST: 'BEST PICK',
  NEW: 'NEW ARRIVAL',
  COSTUME: 'Costume',
  MINI: '미니',
  MIDI: '미디',
  TWO_PIECE: '투피스',
  LONG: '롱드레스',
  COL_JULY: '7월 신상',
  COL_A: 'COLLECTION A',
  COL_B: 'COLLECTION B',
  COL_C: 'COLLECTION C',
  COL_D: 'COLLECTION D',
  COL_E: 'COLLECTION E',
  SAME_DAY: '당일발송'
};
const QUICK_BASE = ['전체', '미니원피스', '미디원피스', '롱드레스', 'A라인', '슬림핏', '럭셔리', '투피스', '코스튬', '화이트룩', '당일배송', '77/88가능'];
const QUICK_VIP = [];
const QUICK_LABELS = {
  ko: {},
  en: { '\uc804\uccb4': 'All', '\ubbf8\ub2c8\uc6d0\ud53c\uc2a4': 'Mini dress', '\ubbf8\ub514\uc6d0\ud53c\uc2a4': 'Midi dress', '\ub871\ub4dc\ub808\uc2a4': 'Long dress', 'A\ub77c\uc778': 'A-line', '\uc2ac\ub9bc\ud54f': 'Slim fit', '\ub7ed\uc154\ub9ac': 'Luxury', '\ud22c\ud53c\uc2a4': 'Two-piece', '\ucf54\uc2a4\ud2ac': 'Costume', '\ud654\uc774\ud2b8\ub8e9': 'White look', '\ub2f9\uc77c\ubc30\uc1a1': 'Same-day', '77/88\uac00\ub2a5': '77/88 size' },
  zh: { '\uc804\uccb4': '\u5168\u90e8', '\ubbf8\ub2c8\uc6d0\ud53c\uc2a4': '\u8ff7\u4f60\u8fde\u8863\u88d9', '\ubbf8\ub514\uc6d0\ud53c\uc2a4': '\u4e2d\u957f\u8fde\u8863\u88d9', '\ub871\ub4dc\ub808\uc2a4': '\u957f\u793c\u670d', 'A\ub77c\uc778': 'A\u5b57\u7248', '\uc2ac\ub9bc\ud54f': '\u4fee\u8eab', '\ub7ed\uc154\ub9ac': '\u9ad8\u7ea7', '\ud22c\ud53c\uc2a4': '\u5957\u88c5', '\ucf54\uc2a4\ud2ac': '\u4e3b\u9898\u670d', '\ud654\uc774\ud2b8\ub8e9': '\u767d\u8272\u7cfb', '\ub2f9\uc77c\ubc30\uc1a1': '\u5f53\u65e5\u53d1\u8d27', '77/88\uac00\ub2a5': '77/88\u53ef\u7a7f' },
  ja: { '\uc804\uccb4': '\u3059\u3079\u3066', '\ubbf8\ub2c8\uc6d0\ud53c\uc2a4': '\u30df\u30cb\u30c9\u30ec\u30b9', '\ubbf8\ub514\uc6d0\ud53c\uc2a4': '\u30df\u30c7\u30a3\u30c9\u30ec\u30b9', '\ub871\ub4dc\ub808\uc2a4': '\u30ed\u30f3\u30b0\u30c9\u30ec\u30b9', 'A\ub77c\uc778': 'A\u30e9\u30a4\u30f3', '\uc2ac\ub9bc\ud54f': '\u30b9\u30ea\u30e0', '\ub7ed\uc154\ub9ac': '\u30e9\u30b0\u30b8\u30e5\u30a2\u30ea\u30fc', '\ud22c\ud53c\uc2a4': '\u30c4\u30fc\u30d4\u30fc\u30b9', '\ucf54\uc2a4\ud2ac': '\u30b3\u30b9\u30c1\u30e5\u30fc\u30e0', '\ud654\uc774\ud2b8\ub8e9': '\u30db\u30ef\u30a4\u30c8', '\ub2f9\uc77c\ubc30\uc1a1': '\u5f53\u65e5\u767a\u9001', '77/88\uac00\ub2a5': '77/88\u5bfe\u5fdc' }
};
const FILTER_LABELS = {
  ko: {},
  en: { '\uc804\uccb4': 'All', '\ubbf8\ub2c8\uc6d0\ud53c\uc2a4': 'Mini dress', '\ubbf8\ub514\uc6d0\ud53c\uc2a4': 'Midi dress', '\ub871\ub4dc\ub808\uc2a4': 'Long dress', 'A\ub77c\uc778': 'A-line', '\uc2ac\ub9bc\ud54f': 'Slim fit', '\ub7ed\uc154\ub9ac': 'Luxury', '\ud22c\ud53c\uc2a4': 'Two-piece', '\ucf54\uc2a4\ud2ac': 'Costume', '\ud654\uc774\ud2b8\ub8e9': 'White look', '\ub2f9\uc77c\ubc30\uc1a1': 'Same-day', '77/88\uac00\ub2a5': '77/88 size' },
  zh: { '\uc804\uccb4': '\u5168\u90e8', '\ubbf8\ub2c8\uc6d0\ud53c\uc2a4': '\u8ff7\u4f60\u8fde\u8863\u88d9', '\ubbf8\ub514\uc6d0\ud53c\uc2a4': '\u4e2d\u957f\u8fde\u8863\u88d9', '\ub871\ub4dc\ub808\uc2a4': '\u957f\u793c\u670d', 'A\ub77c\uc778': 'A\u5b57\u7248', '\uc2ac\ub9bc\ud54f': '\u4fee\u8eab', '\ub7ed\uc154\ub9ac': '\u9ad8\u7ea7', '\ud22c\ud53c\uc2a4': '\u5957\u88c5', '\ucf54\uc2a4\ud2ac': '\u4e3b\u9898\u670d', '\ud654\uc774\ud2b8\ub8e9': '\u767d\u8272\u7cfb', '\ub2f9\uc77c\ubc30\uc1a1': '\u5f53\u65e5\u53d1\u8d27', '77/88\uac00\ub2a5': '77/88\u53ef\u7a7f' },
  ja: { '\uc804\uccb4': '\u3059\u3079\u3066', '\ubbf8\ub2c8\uc6d0\ud53c\uc2a4': '\u30df\u30cb\u30c9\u30ec\u30b9', '\ubbf8\ub514\uc6d0\ud53c\uc2a4': '\u30df\u30c7\u30a3\u30c9\u30ec\u30b9', '\ub871\ub4dc\ub808\uc2a4': '\u30ed\u30f3\u30b0\u30c9\u30ec\u30b9', 'A\ub77c\uc778': 'A\u30e9\u30a4\u30f3', '\uc2ac\ub9bc\ud54f': '\u30b9\u30ea\u30e0', '\ub7ed\uc154\ub9ac': '\u30e9\u30b0\u30b8\u30e5\u30a2\u30ea\u30fc', '\ud22c\ud53c\uc2a4': '\u30c4\u30fc\u30d4\u30fc\u30b9', '\ucf54\uc2a4\ud2ac': '\u30b3\u30b9\u30c1\u30e5\u30fc\u30e0', '\ud654\uc774\ud2b8\ub8e9': '\u30db\u30ef\u30a4\u30c8', '\ub2f9\uc77c\ubc30\uc1a1': '\u5f53\u65e5\u767a\u9001', '77/88\uac00\ub2a5': '77/88\u5bfe\u5fdc' }
};
const EDITOR_SELECT_EXCLUDED_CODES = [];
const EDITOR_SELECT_LIMIT = 12;
const EDITOR_SELECT_PINNED_CODES = [
  'N260001',
  'N260002',
  'N260003',
  'N260006',
  'N260008',
  'N260039',
  'S755',
  'S678',
  'IMN-006',
  'IMN-007',
  'JES-384',
  'JES-381'
];
const NEW_ARRIVAL_PINNED_CODES = [
  'JES-384',
  'JES-381',
  'JES-380',
  'JES-365',
  'S755',
  'S754',
  'S692',
  'S691',
  'S680',
  'S679',
  'S678',
  'N260204',
  'N260076',
  'N260044',
  'N260043',
  'P045'
];
const SMARTSTORE_PINNED_CODES = [
  'JES-384',
  'JES-381',
  'JES-380',
  'JES-365',
  'N260033-PINK',
  'N260033',
  'N260079',
  'N260093',
  'N260035',
  'IMN-007',
  'IMN-006',
  'P045',
  'P026',
  'P021',
  'P019',
  'S755',
  'S754',
  'S692',
  'S691',
  'S680',
  'S679',
  'S678',
  'N260204',
  'N260076',
  'N260044',
  'N260043',
  'N260039',
  'N260038',
  'N260037',
  'N260013',
  'N260012',
  'N260011',
  'N260008',
  'S726',
  'N260003',
  'N260002',
  'N260001',
  'N260006'
];
const COLLECTION_A_EXTRA_CODES = ['N260228', 'N260227', 'N260226', 'N260225'];
const SLIMFIT_EXCLUDED_CODES = new Set([
  'JES-308', 'JES-316', 'JES-323',
  'N260225', 'N260011', 'N260012', 'N260013',
  'ANC-4047', 'ANC-4068',
  'N260122', 'N260123', 'N260124', 'N260125', 'N260164'
]);
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
const WIDE_SIZE_SUPPLIERS = ['앙크최', '지니', '세윤', '펄', '희야', '햅번', '지나', '그레이스', '실루엣'];
const norm = s => String(s || '').toLowerCase();
const tags = p => Array.isArray(p.tags) ? p.tags : [];
const codeOf = p => String(p.code || '');
const mainImg = p => p.mainImage || p.thumbnail || p.cardImage || (Array.isArray(p.images) && p.images[0]) || (Array.isArray(p.cuts) && p.cuts[0] && p.cuts[0].url) || '';
const cardImg = p => p.thumbImage || p.cardImage || p.mainImage || p.thumbnail || (Array.isArray(p.images) && p.images[0]) || (Array.isArray(p.cuts) && p.cuts[0] && p.cuts[0].url) || '';
const img = u => u ? `${u}?v=${VERSION}` : '';
const hasTag = (p, t) => tags(p).some(x => norm(x) === norm(t));
const manualList = (p, field) => Array.isArray(p[field]) ? p[field] : [];
function queryKey(raw) {
  const s = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return '';
  if (/^(미니|미니원피스|mini|minidress)$/.test(s)) return '미니원피스';
  if (/^(미디|미디원피스|midi|mididress)$/.test(s)) return '미디원피스';
  if (/^(롱|long|롱드레스|롱원피스|longdress|롱투피스)$/.test(s)) return '롱드레스';
  if (/^(a라인|에이라인|aline|a-line)$/.test(s)) return 'A라인';
  if (/^(슬림핏|슬림|slimfit)$/.test(s)) return '슬림핏';
  if (/^(럭셔리|luxury)$/.test(s)) return '럭셔리';
  if (/^(투피스|two-piece|twopiece|set|세트)$/.test(s)) return '투피스';
  if (/^(코스튬|costume)$/.test(s)) return '코스튬';
  if (/^(화이트룩|화이트|white|whitelook)$/.test(s)) return '화이트룩';
  if (/^(블랙룩|블랙|black|blacklook)$/.test(s)) return '블랙룩';
  if (/^(당일배송|당일발송|sameday|same-day)$/.test(s)) return '당일배송';
  if (/^(77가능|77size)$/.test(s)) return '77가능';
  if (/^(88가능|88size)$/.test(s)) return '88가능';
  if (/^(77\/88가능|7788가능)$/.test(s)) return '77/88가능';
  if (/^(블라우스|blouse|top)$/.test(s)) return '블라우스';
  if (/^(스커트|치마|skirt)$/.test(s)) return '스커트';
  return '';
}
function hasManualSearch(p, field, key) {
  if (!key) return false;
  return manualList(p, field).some(x => String(x).trim() === key);
}
function isManualSearchExcluded(p, raw) {
  return hasManualSearch(p, 'manualSearchExclude', queryKey(raw));
}
function isManualSearchIncluded(p, raw) {
  return hasManualSearch(p, 'manualSearchInclude', queryKey(raw));
}
const isNew = p => !!p.new || !!p.isNew || hasTag(p, 'NEW');
const isJulyNewProduct = p => p.collection === 'JULY_NEW' || hasTag(p, '7월신상');
const isBest = p => isJulyNewProduct(p) ? false : (!!p.best || !!p.isBest || !!p.bestItem || !!p.isPopular || hasTag(p, 'BEST') || !!p.mainDisplay || !!p.featured);
const vipCode = () => String.fromCharCode(...VIP_CODE_CHARS);
const vipUntil = () => Number(localStorage.getItem(VIP_STORAGE_KEY) || 0);
const isVipActive = () => vipUntil() > Date.now();
const setVipActive = () => localStorage.setItem(VIP_STORAGE_KEY, String(Date.now() + VIP_TTL_MS));
const clearVip = () => localStorage.removeItem(VIP_STORAGE_KEY);
const visibleToAudience = p => (isVipActive() || p.vipOnly !== true) && !!mainImg(p);
const isAnkProduct = p => /^ANC-/.test(codeOf(p));
const isJuneFinalNewProduct = p => /^S\d{3}$/.test(codeOf(p)) || /^GINI-/.test(codeOf(p)) || COLLECTION_A_EXTRA_CODES.includes(codeOf(p));
const isMiniDressEditProduct = p => {
  const text = productText(p);
  return p.category === 'MINI' || p.length === '미니' || hasTag(p, 'MINI') || /미니원피스|미니 드레스|mini dress/i.test(text);
};
function isJiniProduct(p) {
  return /^GINI-/.test(codeOf(p)) || /지니|Jini|GINI/i.test(supplierText(p));
}
const COLLECTION_E_EXCLUDED_CODES = new Set([
  'TIA-S757', 'TIA-S768', 'TIA-S769', 'TIA-S770', 'TIA-S771', 'TIA-S772',
  'N260167', 'N260168', 'N260217', 'N260125', 'N260147', 'N260154'
]);
const isPlusFitEditProduct = p => (isSize77Available(p) || isSize88Available(p))
  && !isJessicaProduct(p)
  && !isJiniProduct(p)
  && !isTiaraProduct(p)
  && !COLLECTION_E_EXCLUDED_CODES.has(codeOf(p));
const isOnepieceProduct = p => /원피스|dress/i.test([p.name, p.storeName, p.productName, p.seoName, p.category, p.collectionName, ...(p.tags || [])].join(' '));
const isLuxuryCandidate = p => {
  if (p.isLuxury === true) return true;
  if (p.isLuxury === false) return false;
  const price = Number(p.price || 0);
  if (!price) return false;
  const category = String(p.category || '').toUpperCase();
  const text = productText(p);
  if (category === 'TWO PIECE' || /\ud22c\ud53c\uc2a4|set|two/i.test(text)) return price >= 130000;
  if (category === 'TOP' || /\ube14\ub77c\uc6b0\uc2a4|\uc0c1\uc758|\ub2c8\ud2b8|\uac00\ub514\uac74|top|blouse/i.test(text)) return price >= 60000;
  if (category === 'SKIRT' || /\uc2a4\ucee4\ud2b8|skirt/i.test(text)) return price >= 60000;
  if (isOnepieceProduct(p) || ['MINI', 'MIDI', 'LONG', '\ub871\ub4dc\ub808\uc2a4'].includes(category)) return price >= 100000;
  return false;
};
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
  return cleanText(localizedProductValue(p, 'name') || localizedProductValue(p, 'storeName') || localizedProductValue(p, 'productName') || p.code, p.code);
}
function displayCode(p) {
  return cleanText(p.customerCode || p.code || '');
}
function sizeSummary(p) {
  return simpleSize(p);
}
function displayColors(p) {
  const colors = localizedProductArray(p, 'colors').map(cleanText).filter(Boolean);
  return colors.length ? colors.join(' / ') : safeText(localizedProductValue(p, 'color'));
}
function sizeDetail(p) {
  const size = cleanText(p.size || '');
  const info = cleanText(p.sizeInfo || '');
  if (!safeText(info)) return safeText(size) || '문의';
  if (size && info && size !== info) return `${size} / ${info}`;
  return size || info || t('ask');
}
function money(n) {
  if (!n) return t('priceInquiry');
  if (LANG === 'ko') return Number(n).toLocaleString('ko-KR') + '원';
  return '₩' + Number(n).toLocaleString('en-US');
}
function safeText(value) {
  const text = cleanText(value || '');
  if (!text || /확인\s*필요|확인필요|검수\s*필요|검수필요|추정|사진\s*기준|거래처|입고표|상품택|확정|경쟁사\s*참고|경쟁사/i.test(text)) return '';
  return text;
}
function t(key, vars = {}) {
  const text = (I18N[LANG] && I18N[LANG][key]) || I18N.ko[key] || key;
  return Object.entries(vars).reduce((out, [k, v]) => out.replaceAll(`{${k}}`, v || ''), text);
}

function localizedProductValue(p, field, fallback = '') {
  if (LANG === 'ko') return p[field] || fallback || '';
  const tr = p && p.translations && p.translations[LANG] ? p.translations[LANG] : null;
  const value = tr && tr[field] ? tr[field] : '';
  if (value && !/[가-힣]/.test(String(value))) return value;
  return fallback || '';
}
function localizedProductArray(p, field) {
  if (LANG === 'ko') return Array.isArray(p[field]) ? p[field] : [];
  const tr = p && p.translations && p.translations[LANG] ? p.translations[LANG] : null;
  if (tr && Array.isArray(tr[field])) return tr[field].filter(x => !/[가-힣]/.test(String(x)));
  return [];
}
function localizedSizeTables(p) {
  if (LANG === 'ko') return Array.isArray(p.sizeTables) ? p.sizeTables : [];
  const tr = p && p.translations && p.translations[LANG] ? p.translations[LANG] : null;
  return tr && Array.isArray(tr.sizeTables) ? tr.sizeTables : [];
}
function localizedWearTables(p) {
  if (LANG === 'ko') return Array.isArray(p.wearTables) ? p.wearTables : [];
  const tr = p && p.translations && p.translations[LANG] ? p.translations[LANG] : null;
  return tr && Array.isArray(tr.wearTables) ? tr.wearTables : [];
}
function localizedSizeBadge(text) {
  if (!text) return '';
  if (LANG === 'en') return text.replace('가능',' available');
  if (LANG === 'zh') return text.replace('가능','可穿');
  if (LANG === 'ja') return text.replace('가능','対応');
  return text;
}
function localizedLabelText(text) {
  if (text === '럭셔리') return t('luxury');
  if (/77|88/.test(text)) return localizedSizeBadge(text);
  return text;
}
function filterLabel(key) {
  return (FILTER_LABELS[LANG] && FILTER_LABELS[LANG][key]) || LABEL[key] || key;
}
function quickLabel(key) {
  return (QUICK_LABELS[LANG] && QUICK_LABELS[LANG][key]) || key;
}
function localizedCollection(c) {
  const descMap = {
    JULY_NEW: 'collectionJuly',
    A: 'collectionA',
    B: 'collectionB',
    C: 'collectionC',
    D: 'collectionD',
    E: 'collectionE'
  };
  return { ...c, desc: t(descMap[c.key] || 'collectionC') };
}
function setLanguage(nextLang) {
  if (!I18N[nextLang]) return;
  LANG = nextLang;
  localStorage.setItem(LANG_STORAGE_KEY, LANG);
  updateStaticLanguage();
  buildLangSwitcher();
  buildQuick();
  buildChips();
  render();
}
function buildLangSwitcher() {
  if (!langSwitcher) return;
  langSwitcher.innerHTML = LANGS.map(lang => `<button class="lang-chip ${lang.code === LANG ? 'on' : ''}" type="button" data-lang="${lang.code}">${lang.label}</button>`).join('');
}
function updateStaticLanguage() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hans' : LANG;
  if (q) q.placeholder = t('searchPlaceholder');
  const vipTitle = $('.vip-top h2');
  const vipDesc = $('.vip-panel > p');
  const vipCancel = $('#vipCancel');
  const vipSubmit = $('#vipSubmit');
  if (vipTitle) vipTitle.textContent = t('vipTitle');
  if (vipDesc) vipDesc.textContent = t('vipDesc');
  if (vipInput) vipInput.placeholder = t('vipPlaceholder');
  if (vipCancel) vipCancel.textContent = t('cancel');
  if (vipSubmit) vipSubmit.textContent = t('verify');
}
function detailPriceBlock(p) {
  if (p.price) return `<div class="detail-price">${money(p.price)}</div>`;
  return `<div class="detail-price price-inquiry"><strong>${t('priceInquiry')}</strong><span>${t('priceInquiryNote')}</span></div>`;
}
function simpleSize(p) {
  const size = safeText(p.size);
  if (size) return size;
  const info = safeText(p.sizeInfo);
  if (!info) return t('ask');
  return info.split('/')[0].trim() || t('ask');
}
function publicPoints(p) {
  const seen = new Set();
  const productPoints = localizedProductArray(p, 'points');
  const base = productPoints.length
    ? productPoints
    : [localizedProductValue(p, 'mainCopy'), localizedProductValue(p, 'desc'), localizedProductValue(p, 'description'), `${localizedProductValue(p, 'color')} ${localizedProductValue(p, 'length')} ${localizedProductValue(p, 'fit')}`];
  return base
    .map(x => safeText(x))
    .map(x => x
      .replace(/매장 피팅 후[^.。]*[.。]?/g, '')
      .replace(/피팅\s*상담\s*권장/g, '')
      .replace(/사이즈\s*상담\s*권장/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim())
    .filter(x => !/피팅|상담|권장/.test(x))
    .filter(Boolean)
    .filter(x => {
      const key = norm(x);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}
function recommendLine(p) {
  const text = safeText(localizedProductValue(p, 'recommend'))
    || `${localizedProductValue(p, 'length') || ''} ${p.category || 'dress'} ${LANG === 'ko' ? '를 데이트, 모임, 촬영룩으로 활용하기 좋습니다.' : 'is recommended for dates, gatherings, and shoots.'}`;
  return text.split(/[.!。]/)[0].replace(/추천$/, '추천').trim() + '.';
}
function cleanDetailText(text) {
  return safeText(text)
    .replace(/NICE\s*(컬렉션|셀렉션)/gi, '엄선한')
    .replace(/나이스\s*(컬렉션|셀렉션)/g, '엄선한')
    .replace(/매장 피팅 후[^.。]*[.。]?/g, '')
    .replace(/과하지 않은 포인트로 사진발과 착용 분위기를 함께 살려주며[,]?/g, '')
    .replace(/피팅\s*상담\s*권장/g, '')
    .replace(/사이즈\s*상담\s*권장/g, '')
    .replace(/카카오톡으로[^.。]*[.。]?/g, '')
    .replace(/\s*상품입니다\.?$/g, ' 상품입니다.')
    .replace(/\s{2,}/g, ' ')
    .replace(/[,\s]+$/g, '')
    .trim();
}
function shortDescription(p) {
  const source = safeText(localizedProductValue(p, 'desc') || localizedProductValue(p, 'description') || localizedProductValue(p, 'mainCopy'))
    || `${safeText(localizedProductValue(p, 'color')) || 'NICE'} ${safeText(localizedProductValue(p, 'fit')) || 'style'}`;
  const cleaned = cleanDetailText(source);
  const sentences = cleaned.split(/(?<=[.!?。])\s+/).filter(Boolean).slice(0, 2);
  return sentences.length ? sentences.join(' ') : cleaned;
}
function detailLeadCopy(p) {
  const color = displayColors(p);
  const fit = safeText(localizedProductValue(p, 'fit'));
  const length = safeText(localizedProductValue(p, 'length') || p.category);
  const mood = [color, fit, length].filter(Boolean).slice(0, 3).join(' · ');
  const base = shortDescription(p);
  if (base) return base;
  return mood || 'NICE selected style';
}
function detailHighlightItems(p, pointItems) {
  const items = [];
  const add = x => {
    const v = cleanDetailText(x);
    if (v && !items.some(y => norm(y) === norm(v))) items.push(v);
  };
  pointItems.forEach(add);
  add(recommendLine(p));
  return items.slice(0, 4);
}
function specValue(label, value) {
  const clean = safeText(value).replace(/\s*\/\s*/g, ' / ').replace(/\s{2,}/g, ' ').trim();
  if (label === t('fabric')) return clean.replace(/\s\/\s/g, '<br>');
  return clean;
}
function specCells(p) {
  const hasDetailedWear = Array.isArray(p.wearTables) && p.wearTables.length;
  const hasDetailedSize = !!structuredSizeTables(p) || (!!safeText(p.sizeInfo) && /([A-Z]{1,2}|55|66|77|88|FREE)\(/i.test(safeText(p.sizeInfo)));
  const hasDetailedProductInfo = hasDetailedWear || hasDetailedSize;
  const baseItems = [
    [t('color'), displayColors(p) || t('ask')],
    [t('size'), simpleSize(p)],
    [t('fabric'), safeText(localizedProductValue(p, 'fabric'))]
  ];
  const wearItems = [
    [t('lining'), safeText(localizedProductValue(p, 'lining'))],
    [t('stretch'), safeText(localizedProductValue(p, 'stretch'))],
    [t('cap'), safeText(localizedProductValue(p, 'cap'))],
    [t('sheer'), safeText(localizedProductValue(p, 'see'))],
    [t('thickness'), safeText(localizedProductValue(p, 'thickness'))],
    [t('zipper'), safeText(localizedProductValue(p, 'zipper'))]
  ];
  const items = hasDetailedProductInfo
    ? []
    : baseItems.concat(wearItems).filter(([, value]) => value);
  return items.map(([label, value]) => `<div class="cell"><b>${label}</b><span>${specValue(label, value)}</span></div>`).join('');
}
function sizeGuideRows(groupText) {
  const rows = [];
  const rowRe = /([A-Z]{1,2}|FREE|55|66|77|88)\(([^)]*)\)/gi;
  let match;
  const pick = (text, labels) => {
    const label = labels.join('|');
    const found = text.match(new RegExp(`(?:${label})\\s*:?\\s*([\\d.]+)`, 'i'));
    return found ? found[1] : '';
  };
  const sleeve = pick(groupText, ['소매', '팔']);
  const length = pick(groupText, ['총장', '총길이', '기장', '길이']);
  while ((match = rowRe.exec(groupText))) {
    const body = match[2];
    rows.push({
      size: match[1],
      chest: pick(body, ['가슴', '가']) || '-',
      waist: pick(body, ['허리', '허']) || '-',
      hip: pick(body, ['힙']) || '-',
      sleeve: pick(body, ['소매', '팔']) || sleeve || '-',
      length: pick(body, ['총장', '총길이', '기장', '길이']) || length || '-'
    });
  }
  return rows;
}
function structuredSizeTables(p) {
  const localTables = localizedSizeTables(p);
  if (!Array.isArray(localTables) || !localTables.length) return '';
  const tables = localTables.map(group => {
    const columns = Array.isArray(group.columns) && group.columns.length ? group.columns : [t('size'), t('totalLength'), t('sleeve'), t('chest'), t('waist'), t('hip')];
    const rows = Array.isArray(group.rows) ? group.rows : [];
    if (!rows.length) return '';
    const shortHeader = col => ({ '가슴단면': t('chest'), '허리단면': t('waist'), '힙단면': t('hip'), '소매길이': t('sleeve'), '총길이': t('totalLength'), 'Chest': t('chest'), 'Waist': t('waist'), 'Hip': t('hip'), 'Sleeve': t('sleeve'), 'Length': t('totalLength') }[safeText(col)] || safeText(col));
    const head = columns.map(col => `<th>${shortHeader(col)}</th>`).join('');
    const body = rows.map(row => `<tr>${columns.map(col => `<td>${safeText(row[col]) || '-'}</td>`).join('')}</tr>`).join('');
    return `<div class="size-table-wrap"><p>${safeText(group.title) || t('actualSize')}</p><table class="size-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }).filter(Boolean).join('');
  return tables;
}
function sizeGuideBlock(p) {
  const structured = structuredSizeTables(p);
  if (structured) return `<div class="box size-guide"><b>${t('sizeGuide')}</b>${structured}<p class="size-note">${LANG === 'ko' ? '실측은 단면 기준이며 측정 방법에 따라 1~2cm 정도 오차가 있을 수 있습니다.' : LANG === 'en' ? 'Measurements are flat and may vary by 1–2cm depending on how they are taken.' : LANG === 'zh' ? '实测为平铺尺寸，因测量方式不同可能有1–2cm误差。' : '実寸は平置き基準で、測定方法により1〜2cmの誤差が出る場合があります。'}</p></div>`;
  const info = safeText(p.sizeInfo);
  if (!info || !/([A-Z]{1,2}|55|66|77|88|FREE)\(/i.test(info)) {
    return `<div class="box size-guide"><b>${t('sizeGuide')}</b><p>${t('sizeAsk')}</p></div>`;
  }
  const groups = info.split('|').map(x => x.trim()).filter(Boolean).slice(0, 3);
  const tables = groups.map(group => {
    const rows = sizeGuideRows(group);
    if (!rows.length) return '';
    const title = /스커트|하의|skirt|bottom/i.test(group) ? t('topBottom') : /상의|블라우스|top|blouse/i.test(group) ? t('topDress') : t('actualSize');
    return `<div class="size-table-wrap"><p>${title}</p><table class="size-table"><thead><tr><th>${t('size')}</th><th>${t('chest')}</th><th>${t('waist')}</th><th>${t('hip')}</th><th>${t('sleeve')}</th><th>${t('totalLength')}</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row.size}</td><td>${row.chest}</td><td>${row.waist}</td><td>${row.hip}</td><td>${row.sleeve}</td><td>${row.length}</td></tr>`).join('')}</tbody></table></div>`;
  }).filter(Boolean).join('');
  return `<div class="box size-guide"><b>${t('sizeGuide')}</b>${tables || `<p>${t('sizeAsk')}</p>`}</div>`;
}
function wearInfoBlock(p) {
  const localWearTables = localizedWearTables(p);
  if (!Array.isArray(localWearTables) || !localWearTables.length) return '';
  const blocks = localWearTables.map(group => {
    const items = group.items && typeof group.items === 'object' ? group.items : {};
    const rows = Object.entries(items).filter(([, value]) => safeText(value)).map(([key, value]) => `<tr><th>${safeText(key)}</th><td>${safeText(value)}</td></tr>`).join('');
    if (!rows) return '';
    return `<div class="wear-table-wrap"><p>${safeText(group.title) || t('wearInfo')}</p><table class="wear-table"><tbody>${rows}</tbody></table></div>`;
  }).filter(Boolean).join('');
  return blocks ? `<div class="box wear-guide"><b>${t('wearInfo')}</b><div class="wear-table-grid">${blocks}</div></div>` : '';
}
function productText(p) {
  return [
    p.code, p.customerCode, p.name, p.storeName, p.productName, p.color, p.category, p.length,
    p.fit, p.size, p.sizeInfo, p.fabric, p.mainCopy, p.desc, p.description, p.recommend,
    p.origin, p.supplier, p.vendor, p.brand, p.lineName, p.folder, p.zipFolder,
    ...(p.colors || []), ...(p.options || []), ...(p.points || []), ...tags(p), ...(p.styleTags || []), ...(p.sceneTags || []), ...(p.searchKeywords || []), ...(p.badges || [])
  ].join(' ');
}
function focusedProductText(p) {
  return [
    p.name, p.storeName, p.productName, p.color, p.category, p.length, p.fit, p.size,
    p.fabric, ...(p.colors || []), ...(p.options || []), ...tags(p), ...(p.styleTags || []), ...(p.sceneTags || [])
  ].join(' ');
}
function supplierText(p) {
  return [p.code, p.origin, p.supplier, p.vendor, p.brand, p.lineName, p.folder, p.zipFolder, p.supplierProductNo].join(' ');
}
function isJessicaProduct(p) {
  return /^JES-/.test(codeOf(p)) || /제시카|Jessica/i.test(supplierText(p));
}
function isTiaraProduct(p) {
  return /티아라|Tiara/i.test(supplierText(p));
}
function isWideSizeSupplier(p) {
  const text = supplierText(p);
  return WIDE_SIZE_SUPPLIERS.some(name => text.includes(name));
}
function isSize77Available(p) {
  if (p.size77Available === true) return true;
  if (isWideSizeSupplier(p)) return true;
  return (p.sizeTags || []).some(x => String(x) === '77') || /(^|[^0-9])77([^0-9]|$)/.test(String(p.size || p.sizeInfo || ''));
}
function isSize88Available(p) {
  if (p.size88Available === true) return true;
  if (isJessicaProduct(p) || isTiaraProduct(p)) return false;
  if (isWideSizeSupplier(p)) return true;
  return (p.sizeTags || []).some(x => String(x) === '88') || /(^|[^0-9])88([^0-9]|$)/.test(String(p.size || p.sizeInfo || ''));
}
function sizeBadgeText(p) {
  const s77 = isSize77Available(p);
  const s88 = isSize88Available(p);
  if (s77 && s88) return '77/88가능';
  if (s77) return '77가능';
  if (s88) return '88가능';
  return '';
}
function isWideSize(p) {
  return isSize77Available(p) && isSize88Available(p);
}
function hasExtendedSizeLeadTime(p) {
  return isWideSizeSupplier(p);
}
function isFittingAvailable(p) {
  return p.isFittingAvailable === true;
}
function isSameDayCandidate(p) {
  return p.isSameDayDelivery === true;
}
function isSameDayVisible(p) {
  return isVipActive() && isSameDayCandidate(p);
}
function isLongDressProduct(p) {
  const label = [p.category, p.length, p.name, p.storeName, p.productName, p.seoName, ...(p.tags || []), ...(p.styleTags || []), ...(p.sceneTags || [])].join(' ');
  return p.category === '롱드레스'
    || p.category === '롱투피스'
    || p.category === 'LONG'
    || /롱드레스|롱원피스|롱투피스/i.test(label);
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
  if (isJulyNewProduct(p)) score += 9000;
  if (p.featured) score += 7000;
  if (isJuneFinalNewProduct(p)) score += 4500;
  if (isBest(p)) score += 3600;
  if (isNew(p)) score += 2500;
  if (isWideSize(p)) score += 250;
  if (mainImg(p)) score += 200;
  return score;
}
function sortProducts(list) {
  return [...list].sort((a, b) => rankProduct(b) - rankProduct(a) || codeOf(a).localeCompare(codeOf(b), 'ko'));
}
function designGroupKey(p) {
  return p && p.designGroupId ? String(p.designGroupId) : codeOf(p);
}
function uniqueByDesignGroup(items) {
  const seen = new Set();
  return items.filter(p => {
    const key = designGroupKey(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function chooseUniqueByDesignGroup(list, limit) {
  return uniqueByDesignGroup(list.filter(p => mainImg(p))).slice(0, limit);
}
function editorSelectItems(visible) {
  const excluded = new Set(EDITOR_SELECT_EXCLUDED_CODES);
  const pinned = EDITOR_SELECT_PINNED_CODES
    .map(code => visible.find(p => codeOf(p) === code))
    .filter(p => p && mainImg(p));
  const pinnedCodes = new Set(pinned.map(codeOf));
  const need = Math.max(0, EDITOR_SELECT_LIMIT - pinned.length);
  const fallback = choose(
    sortProducts(
      visible.filter(p =>
        isBest(p) &&
        !excluded.has(codeOf(p)) &&
        !pinnedCodes.has(codeOf(p))
      )
    ),
    need
  );
  return [...pinned, ...fallback].slice(0, EDITOR_SELECT_LIMIT);
}
function newArrivalItems(visible, editorCodes) {
  const editorGroupKeys = new Set(
    visible
      .filter(p => editorCodes.has(codeOf(p)))
      .map(designGroupKey)
  );
  const july = chooseUniqueByDesignGroup(
    sortProducts(
      visible.filter(p =>
        isJulyNewProduct(p) &&
        isNew(p) &&
        !editorCodes.has(codeOf(p)) &&
        !editorGroupKeys.has(designGroupKey(p))
      )
    ),
    8
  );
  const julyCodes = new Set(july.map(codeOf));
  const julyGroupKeys = new Set(july.map(designGroupKey));
  const pinned = chooseUniqueByDesignGroup(
    NEW_ARRIVAL_PINNED_CODES
      .map(code => visible.find(p => codeOf(p) === code))
      .filter(p => p && !editorCodes.has(codeOf(p)) && !editorGroupKeys.has(designGroupKey(p)) && !julyCodes.has(codeOf(p)) && !julyGroupKeys.has(designGroupKey(p))),
    Math.max(0, 8 - july.length)
  );
  const pinnedCodes = new Set(pinned.map(codeOf));
  const pinnedGroupKeys = new Set(pinned.map(designGroupKey));
  const fallback = chooseUniqueByDesignGroup(
    sortProducts(
      visible.filter(p =>
        isNew(p) &&
        !editorCodes.has(codeOf(p)) &&
        !editorGroupKeys.has(designGroupKey(p)) &&
        !pinnedCodes.has(codeOf(p)) &&
        !pinnedGroupKeys.has(designGroupKey(p)) &&
        !julyCodes.has(codeOf(p)) &&
        !julyGroupKeys.has(designGroupKey(p))
      )
    ),
    Math.max(0, 8 - july.length - pinned.length)
  );
  return [...july, ...pinned, ...fallback].slice(0, 8);
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
  quick.innerHTML = quickWords().map(k => `<button class="quick-chip" type="button" data-q="${k}">${quickLabel(k)}</button>`).join('');
}
function buildChips() {
  chips.innerHTML = filters().map(f => `<button class="chip ${f === FILTER ? 'on' : ''}" type="button" data-f="${f}">${filterLabel(f)}</button>`).join('');
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
  return PRODUCTS.filter(p => (k === 'A' ? isJuneFinalNewProduct(p) : k === 'D' ? isMiniDressEditProduct(p) : k === 'E' ? isPlusFitEditProduct(p) : p.collection === k) && visibleToAudience(p)).length;
}
function sectionName() {
  if (FILTER === 'HOME') return 'SHOWROOM';
  const c = COLLECTIONS.map(localizedCollection).find(x => x.filter === FILTER);
  if (c) return c.title;
  if (FILTER === 'NEW') return filterLabel('NEW');
  if (FILTER === 'BEST') return filterLabel('BEST');
  if (FILTER === 'COSTUME') return filterLabel('COSTUME');
  if (FILTER === 'MINI') return 'MINI DRESS';
  if (FILTER === 'MIDI') return 'MIDI DRESS';
  if (FILTER === 'TWO_PIECE') return 'TWO PIECE';
  if (FILTER === 'LONG') return 'LONG DRESS';
  if (FILTER === 'SAME_DAY') return filterLabel('SAME_DAY');
  return 'ALL COLLECTION';
}
function sectionIntro() {
  if (FILTER === 'HOME') return t('showroomIntro');
  if (FILTER === 'NEW') return t('newIntro');
  if (FILTER === 'BEST') return t('bestIntro');
  if (FILTER === 'COSTUME') return t('costumeIntro');
  if (FILTER === 'MINI') return t('miniIntro');
  if (FILTER === 'MIDI') return t('midiIntro');
  if (FILTER === 'TWO_PIECE') return t('twoPieceIntro');
  if (FILTER === 'LONG') return t('longIntro');
  const c = COLLECTIONS.map(localizedCollection).find(x => x.filter === FILTER);
  return c ? c.desc : '';
}
function matchesSearch(p, rawSearch) {
  const search = norm(rawSearch);
  if (!search) return true;
  if (/^(전체|all)$/i.test(rawSearch)) return true;
  if (isManualSearchExcluded(p, rawSearch)) return false;
  if (isManualSearchIncluded(p, rawSearch)) return true;
  const supplierAlias = {
    '앙크': ['앙크', '앙크최', 'anc', 'ank'],
    '앙크최': ['앙크', '앙크최', 'anc', 'ank'],
    '제시카': ['제시카', 'jes', 'jessica'],
    '티아라': ['티아라', 'tiara'],
    '지니': ['지니', 'gini'],
    '세윤': ['세윤'],
    '펄': ['펄'],
    '희야': ['희야'],
    '햅번': ['햅번'],
    '지나': ['지나'],
    '그레이스': ['그레이스'],
    '실루엣': ['실루엣']
  };
  const aliasKey = Object.keys(supplierAlias).find(key => rawSearch.includes(key));
  if (aliasKey) {
    // 거래처 검색은 상품 설명의 '실루엣' 같은 일반 단어까지 잡히지 않도록 거래처/폴더 영역만 검색합니다.
    const hay = norm(supplierText(p));
    return supplierAlias[aliasKey].some(word => hay.includes(norm(word)));
  }
  if (/^costume$/i.test(rawSearch) || /^코스튬$/i.test(rawSearch)) return isCostume(p);
  if (/^(A라인|에이라인|a라인)$/i.test(rawSearch)) return /A라인|에이라인|a-line|aline|플레어|플레어핏/i.test(productText(p));
  if (/^슬림핏$/i.test(rawSearch)) return !SLIMFIT_EXCLUDED_CODES.has(codeOf(p)) && /슬림핏|슬림|H라인|머메이드|타이트|바디라인|라인감/i.test(productText(p));
  if (/^럭셔리$/i.test(rawSearch)) return isLuxuryCandidate(p);
  if (/^(화이트룩|화이트|white)$/i.test(rawSearch)) return /화이트|아이보리|크림|크림베이지|white|ivory|cream/i.test(productText(p));
  if (/^(블랙룩|블랙|black)$/i.test(rawSearch)) return /블랙|검정|black/i.test(productText(p));
  if (/^(당일배송|당일발송|same[-_ ]?day)$/i.test(rawSearch)) return isSameDayCandidate(p);
  if (/^77가능$/i.test(rawSearch)) return isSize77Available(p);
  if (/^88가능$/i.test(rawSearch)) return isSize88Available(p);
  if (/77\s*\/\s*88|77\/88/.test(rawSearch)) return isSize77Available(p) || isSize88Available(p);
  if (/^(롱|long|롱드레스|롱원피스|이브닝룩|파티드레스|무대의상|롱투피스)$/i.test(rawSearch)) return isLongDressProduct(p);
  if (/^(미니|미니원피스|mini)$/i.test(rawSearch)) return p.category === 'MINI' || p.length === '미니' || hasTag(p, 'MINI');
  if (/^(미디|미디원피스|midi)$/i.test(rawSearch)) return p.category === 'MIDI' || p.length === '미디' || hasTag(p, 'MIDI');
  if (/^(투피스|two[-_ ]?piece)$/i.test(rawSearch)) return p.category === 'TWO PIECE' || hasTag(p, 'TWO PIECE') || /투피스|세트|two[-_ ]?piece/i.test(productText(p));
  if (/^(스커트|skirt)$/i.test(rawSearch)) return p.category === 'SKIRT' || hasTag(p, 'SKIRT');
  if (/^(블라우스|blouse)$/i.test(rawSearch)) {
    const label = [p.name, p.storeName, p.productName, p.seoName, ...(p.tags || [])].join(' ');
    return (p.category === 'TOP' || hasTag(p, 'TOP')) && /블라우스|blouse/i.test(label);
  }
  const hay = norm([productText(p), sizeBadgeText(p), isFittingAvailable(p) ? '피팅가능' : '', isSameDayCandidate(p) ? '당일배송 당일발송' : ''].join(' '));
  return hay.includes(search);
}
function match(p) {
  const rawSearch = q.value.trim();
  let f = true;
  if (FILTER === 'COL_A') f = isJuneFinalNewProduct(p);
  else if (FILTER === 'COL_JULY') f = isJulyNewProduct(p);
  else if (FILTER === 'COL_B') f = p.collection === 'B';
  else if (FILTER === 'COL_C') f = p.collection === 'C';
  else if (FILTER === 'COL_D') f = isMiniDressEditProduct(p);
  else if (FILTER === 'COL_E') f = isPlusFitEditProduct(p);
  else if (FILTER === 'NEW') f = isNew(p);
  else if (FILTER === 'BEST') f = isBest(p);
  else if (FILTER === 'COSTUME') f = isCostume(p);
  else if (FILTER === 'MINI') f = p.category === 'MINI' || p.length === '미니' || hasTag(p, 'MINI');
  else if (FILTER === 'MIDI') f = p.category === 'MIDI' || p.length === '미디' || hasTag(p, 'MIDI');
  else if (FILTER === 'TWO_PIECE') f = p.category === 'TWO PIECE' || hasTag(p, 'TWO PIECE');
  else if (FILTER === 'LONG') f = isLongDressProduct(p);
  else if (FILTER === 'SAME_DAY') f = isSameDayVisible(p);
  return f && matchesSearch(p, rawSearch) && visibleToAudience(p);
}
function badges(p) {
  const out = [];
  if (isNew(p)) out.push('<span class="badge gold">NEW</span>');
  if (p.steady || hasTag(p, 'STEADY')) out.push('<span class="badge">STEADY</span>');
  if (isBest(p)) out.push('<span class="badge">BEST</span>');
  if (isFittingAvailable(p)) out.push(`<span class="badge light">${t('fittingAvailable')}</span>`);
  if (isSameDayCandidate(p)) out.push(`<span class="badge light">${t('sameDay')}</span>`);
  const sizeBadge = sizeBadgeText(p);
  if (sizeBadge) out.push(`<span class="badge light">${sizeBadge}</span>`);
  if (isLuxuryCandidate(p)) out.push(`<span class="badge light">${t('luxury')}</span>`);
  return out.slice(0, 4).join('');
}
function meta(p) {
  const size = sizeSummary(p);
  return [localizedProductValue(p, 'length'), displayColors(p), size ? 'SIZE ' + size : '', localizedSizeBadge(sizeBadgeText(p))]
    .filter(Boolean)
    .slice(0, 3)
    .map(x => `<span>${cleanText(x)}</span>`)
    .join('');
}
function priceBlock(p) {
  if (p.price) return `<div class="price">${money(p.price)}</div>`;
  return `<div class="price price-inquiry"><strong>${t('priceInquiry')}</strong><span>${t('priceInquiryNote')}</span></div>`;
}
function productCard(p, compact = false) {
  const image = cardImg(p);
  const cardBadges = badges(p);
  return `<article class="card ${compact ? 'compact' : ''}" data-code="${codeOf(p)}">
    <div class="photo">${image ? `<img loading="lazy" decoding="async" src="${img(image)}" alt="${displayName(p)}">` : `<div class="no-photo"><b>NICE</b><span>${t('noPhoto')}</span></div>`}</div>
    <div class="info">
      <div class="code">${t('productCode')} ${displayCode(p)}</div>
      <div class="name">${displayName(p)}</div>
      <div class="meta">${meta(p)}</div>
      ${priceBlock(p)}
      ${cardBadges ? `<div class="card-badges">${cardBadges}</div>` : ''}
      <button class="card-similar" type="button" data-code="${codeOf(p)}">${t('similarSearch')}</button>
    </div>
  </article>`;
}
function choose(list, limit) {
  return list.filter(p => mainImg(p)).slice(0, limit);
}
function sectionBlock(label, desc, items, moreFilter = '', moreText = t('viewAllProducts')) {
  if (!items.length) return '';
  const previewItems = items.slice(0, 8);
  const moreButton = moreFilter ? `<button class="section-more" type="button" data-f="${moreFilter}">${moreText}</button>` : '';
  return `<section class="show-section home-preview-section"><div class="section-head"><div><h3>${label}</h3><p>${desc}</p></div><span>${previewItems.length} ${t('picks')}</span></div><div class="rail home-preview-rail">${previewItems.map(p => productCard(p, true)).join('')}</div>${moreButton}</section>`;
}
function imageListFor(p) {
  const main = mainImg(p) ? [{ url: mainImg(p), cut: '대표' }] : [];
  const cuts = Array.isArray(p.cuts) ? p.cuts.filter(im => im && im.url) : [];
  const images = Array.isArray(p.images) ? p.images.filter(Boolean).map((url, i) => ({ url, cut: `사진 ${i + 1}` })) : [];
  const seen = new Set();
  const productCutWords = /product|item|hanger|real|detail|제품|실물|행거|컷/i;
  const ordered = [...main, ...cuts, ...images].sort((a, b) => {
    if (a.cut === '대표') return -1;
    if (b.cut === '대표') return 1;
    return Number(productCutWords.test([a.cut, a.url].join(' '))) - Number(productCutWords.test([b.cut, b.url].join(' ')));
  });
  return ordered.filter(im => {
    const key = String(im.url || '').split('?')[0].replace(/\\/g, '/').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function detailPhotoGuide(images) {
  const labels = LANG === 'ko' ? ['대표 핏', '전신/길이', '상반신 포인트', '소재/디테일'] : LANG === 'en' ? ['Main fit', 'Full length', 'Upper detail', 'Fabric detail'] : LANG === 'zh' ? ['主版型', '全身长度', '上身重点', '面料细节'] : ['メインフィット', '全身丈', '上半身ポイント', '素材ディテール'];
  const steps = labels.slice(0, Math.min(labels.length, Math.max(images.length, 1)));
  return `<div class="photo-guide">${steps.map((label, i) => `<span>${i + 1}. ${label}</span>`).join('')}</div>`;
}
function showroomRulesBlock() {
  const rules = [
    [t('photoRuleMain'), t('photoRuleMainCopy')],
    [t('photoRuleDetail'), t('photoRuleDetailCopy')],
    [t('photoRuleContact'), t('photoRuleContactCopy')]
  ];
  return `<section class="rules-panel" aria-label="${t('photoRuleTitle')}">
    <div>
      <p class="rules-kicker">${t('photoRuleKicker')}</p>
      <h3>${t('photoRuleTitle')}</h3>
    </div>
    <div class="rules-grid">${rules.map(([title, copy]) => `<article><b>${title}</b><p>${copy}</p></article>`).join('')}</div>
  </section>`;
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
    isLuxuryCandidate(p) ? '럭셔리' : '',
    isCostume(p) ? 'Costume' : '',
    sizeBadgeText(p)
  ].filter(Boolean);
}
function unique(list) {
  return [...new Set(list.filter(Boolean).map(x => String(x).trim()).filter(Boolean))];
}
function colorGroup(value) {
  const text = norm(value);
  if (!text) return '';
  const groups = [
    ['black', ['블랙', '검정', 'black']],
    ['white', ['화이트', '아이보리', '크림', '백색', 'white', 'ivory', 'cream']],
    ['beige', ['베이지', '누드', '샴페인', 'beige', 'nude', 'champagne']],
    ['pink', ['핑크', '로즈', '코랄', 'pink', 'rose', 'coral']],
    ['red', ['레드', '버건디', '와인', 'red', 'burgundy', 'wine']],
    ['blue', ['블루', '네이비', '소라', 'blue', 'navy']],
    ['green', ['그린', '카키', '민트', 'green', 'khaki', 'mint']],
    ['gray', ['그레이', '실버', 'gray', 'grey', 'silver']]
  ];
  const found = groups.find(([, words]) => words.some(word => text.includes(word)));
  return found ? found[0] : text;
}
function fieldTokens(p) {
  const styleTags = Array.isArray(p.styleTags) ? p.styleTags : [];
  const sceneTags = Array.isArray(p.sceneTags) ? p.sceneTags : [];
  const source = [
    p.name, p.productName, p.storeName, p.color, p.category, p.length, p.fit, p.fabric,
    ...tags(p), ...styleTags, ...sceneTags
  ].join(' ');
  return unique(source
    .replace(/[()[\],/·|+]/g, ' ')
    .split(/\s+/)
    .map(x => cleanText(x))
    .filter(x => x.length > 1 && !/상품|드레스|원피스|가능|문의|NICE/i.test(x))
  );
}
function overlapCount(a, b) {
  const right = new Set(b);
  return a.filter(x => right.has(x)).length;
}
function similarScore(source, candidate) {
  const sourceProfile = styleProfile(source);
  const candidateProfile = styleProfile(candidate);
  const sourceTokens = fieldTokens(source);
  const candidateTokens = fieldTokens(candidate);
  let score = 0;
  sourceProfile.forEach(tag => {
    if (candidateProfile.includes(tag)) score += tag === 'A라인' || tag === '슬림핏' || tag === '미디' ? 140 : 90;
  });
  if (source.category && source.category === candidate.category) score += 110;
  if (source.length && source.length === candidate.length) score += 95;
  if (source.fit && candidate.fit && source.fit === candidate.fit) score += 55;
  if (source.collection && source.collection === candidate.collection) score += 35;
  if (source.color && candidate.color && source.color === candidate.color) score += 60;
  else if (colorGroup(source.color) && colorGroup(source.color) === colorGroup(candidate.color)) score += 32;
  score += overlapCount(tags(source), tags(candidate)) * 26;
  score += overlapCount(Array.isArray(source.styleTags) ? source.styleTags : [], Array.isArray(candidate.styleTags) ? candidate.styleTags : []) * 34;
  score += overlapCount(Array.isArray(source.sceneTags) ? source.sceneTags : [], Array.isArray(candidate.sceneTags) ? candidate.sceneTags : []) * 42;
  score += Math.min(overlapCount(sourceTokens, candidateTokens), 5) * 18;
  if (isBest(candidate)) score += 8;
  if (isNew(candidate)) score += 5;
  if (!mainImg(candidate)) score -= 80;
  return score;
}
function similarItemsFor(source, limit = 12) {
  const ranked = PRODUCTS
    .filter(p => visibleToAudience(p) && codeOf(p) !== codeOf(source) && mainImg(p))
    .map(p => ({ p, score: similarScore(source, p) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || rankProduct(b.p) - rankProduct(a.p));
  const strong = ranked.filter(x => x.score >= 45);
  const fallback = ranked.filter(x => x.score < 45);
  return [...strong, ...fallback]
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
        <h3>${t('similarTitle')}</h3>
        <p>${t('similarDesc', { name: displayName(source), profile: profile ? profile + ' ' : '' })}</p>
      </div>
      <button class="similar-close" type="button" aria-label="${t('close')}">${t('close')}</button>
    </div>
    <div class="rail">${items.map(p => productCard(p, true)).join('')}</div>
  </section>`;
}
function collectionBlock() {
  return `<section class="collection-grid">
    ${COLLECTIONS.map(localizedCollection).map(c => `<article class="collection-card" data-f="${c.filter}"><div class="collection-count">${cCount(c.key)} ${t('item')}</div><div class="collection-title">${c.title}</div><div class="collection-name">${c.name}</div><p>${c.desc}</p><span class="collection-action">${t('viewProduct')}</span></article>`).join('')}
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
      <p class="community-copy">${t('communityCopy')}</p>
      <p class="community-guide">${t('communityGuide')}</p>
    </div>
    <div class="community-links">
      <a class="community-link kakao community-brand" href="${KAKAO_URL}" target="_blank" rel="noopener noreferrer" data-external="kakao"><span class="kakao-logo">TALK</span><span>${t('kakaoAsk')}</span></a>
      <a class="community-link insta community-brand" href="${INSTA_URL}" target="_blank" rel="noopener noreferrer" data-external="instagram">${instaIcon()}<span>Instagram</span></a>
      <a class="community-link naver community-brand" href="${BLOG_URL}" target="_blank" rel="noopener"><span class="naver-logo">N</span><span>Naver Blog</span></a>
      <a class="community-link smartstore community-brand" href="${SMARTSTORE_URL}" target="_blank" rel="noopener noreferrer" data-external="smartstore"><span class="naver-logo">N</span><span>${t('smartstoreGo')}</span></a>
    </div>
  </section>`;
}
function dmGuideBlock() {
  return `<section class="dm-guide compact" aria-label="${t('productAsk')}">
    <strong>${t('dmGuideTitle')}</strong>
    <span>${t('dmGuideLine')}</span>
  </section>`;
}

function smartStoreItems(visible) {
  const visibleMap = new Map(visible.map(p => [codeOf(p), p]));
  const pinned = SMARTSTORE_PINNED_CODES.map(code => visibleMap.get(code)).filter(Boolean);
  return uniqueByDesignGroup(pinned).slice(0, 24);
}
function renderHome() {
  const visible = PRODUCTS.filter(visibleToAudience);
  const smartItems = smartStoreItems(visible);
  const smartCodes = new Set(smartItems.map(codeOf));
  const editorItems = editorSelectItems(visible.filter(p => !smartCodes.has(codeOf(p))));
  const editorCodes = new Set([...editorItems.map(codeOf), ...smartCodes]);
  const fresh = newArrivalItems(visible.filter(p => !smartCodes.has(codeOf(p))), editorCodes);
  title.textContent = 'SHOWROOM';
  count.textContent = `${visible.length} ${t('item')}`;
  intro.textContent = sectionIntro();
  grid.className = 'home';
  grid.innerHTML = `
    ${SIMILAR_CODE ? similarShelfBlock() : ''}
    ${dmGuideBlock()}
    ${sectionBlock(t('smartstoreBest'), t('smartstoreDesc'), smartItems, 'ALL', t('viewAllProducts'))}
    ${sectionBlock('New Arrival', t('newDesc'), fresh, 'COL_JULY', t('julyMore'))}
    ${sectionBlock("Editor's Pick", t('editorDesc'), editorItems, 'BEST', t('editorsMore'))}
    ${collectionBlock()}
    ${communityBlock()}`;
  $$('.collection-card').forEach(el => el.onclick = () => applyView(el.dataset.f, { push: true, scroll: true }));
  $$('[data-external]').forEach(a => a.onclick = e => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    // Keep normal anchor navigation as fallback, but explicitly open external links
    // for browsers that ignore nested tap targets. This helps desktop and mobile.
    const opened = window.open(href, '_blank');
    if (opened) e.preventDefault();
  });
  $$('.section-more').forEach(el => el.onclick = () => applyView(el.dataset.f, { push: true, scroll: true }));
  bindCards();
  bindVipControls();
}
function render() {
  title.textContent = sectionName();
  intro.textContent = sectionIntro();
  if (FILTER === 'HOME' && !q.value.trim()) return renderHome();
  grid.className = 'grid';
  const searchActive = !!q.value.trim();
  const visible = PRODUCTS.filter(visibleToAudience);
  let list;
  if (!searchActive && FILTER === 'BEST') {
    list = editorSelectItems(visible);
  } else if (!searchActive && FILTER === 'NEW') {
    const editorCodes = new Set(editorSelectItems(visible).map(codeOf));
    list = newArrivalItems(visible, editorCodes);
  } else {
    list = sortProducts(PRODUCTS.filter(match));
  }
  count.textContent = `${list.length} ${t('item')}`;
  if (!list.length) {
    grid.innerHTML = `${dmGuideBlock()}<div class="empty">${t('empty')}</div>`;
    return;
  }
  grid.innerHTML = `${dmGuideBlock()}${list.map(p => productCard(p)).join('')}${similarShelfBlock()}`;
  bindCards();
}
function points(p) {
  const localPoints = localizedProductArray(p, 'points');
  if (localPoints.length) return localPoints.map(x => cleanText(x)).slice(0, 4);
  const text = cleanText(localizedProductValue(p, 'desc') || localizedProductValue(p, 'description') || localizedProductValue(p, 'mainCopy') || '');
  const parts = text.replaceAll(' / ', '. ').split(/(?<=\.)\s+/).map(x => x.trim()).filter(Boolean);
  const picked = parts.filter(x => !/재고|촬영 환경|방문 전|DM 문의|온라인 쇼룸용/.test(x)).slice(0, 3);
  return picked.length ? picked : ['매장 피팅과 사이즈 확인 후 구매 가능합니다.', '카카오톡으로 재고와 가격을 빠르게 안내드립니다.'];
}
function editorNote(p) {
  return cleanText(localizedProductValue(p, 'editorsNote') || localizedProductValue(p, 'desc') || localizedProductValue(p, 'description') || localizedProductValue(p, 'mainCopy') || 'NICE PICK');
}
function contactText(p, mode = 'product') {
  const prefix = t('contactPrefix');
  return `${prefix}\n${t('productCode')}: ${displayCode(p)}\n${displayName(p)}\n${t('contactStockSizePrice')}`;
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
function coordinatedBlock(p) {
  const links = Array.isArray(p.coordinatedWith) ? p.coordinatedWith : [];
  const rows = links
    .map(item => {
      const target = PRODUCTS.find(x => codeOf(x) === item.code);
      if (!target || !visibleToAudience(target)) return '';
      const label = cleanText(item.label || t('coordinatedLook'));
      const name = cleanText(item.name || displayName(target));
      const image = mainImg(target) || cardImg(target);
      return '<button class="coord-link" type="button" data-code="' + codeOf(target) + '">' +
        (image ? '<img class="coord-thumb" loading="lazy" decoding="async" src="' + img(image) + '" alt="' + name + '">' : '') +
        '<span class="coord-copy"><em>' + label + '</em><b>' + name + '</b></span>' +
        '<strong>' + t('viewProduct') + '</strong>' +
      '</button>';
    })
    .filter(Boolean);
  if (!rows.length) return '';
  return '<div class="box coord-box"><div class="coord-title">' + t('coordinatedLook') + '</div>' + rows.join('') + '</div>';
}
function optionColorValue(name) {
  const text = String(name || '').toLowerCase();
  const map = [
    ['아이보리', '#fff6e6'], ['화이트', '#ffffff'], ['크림베이지', '#f3e4cc'], ['베이지', '#d6b98c'],
    ['블랙', '#111111'], ['네이비', '#102044'], ['블루', '#4f8fd8'], ['스카이블루', '#9fd1f5'], ['소라', '#a9d8f7'],
    ['핑크베이지', '#e8b9ad'], ['연핑크', '#f7cddd'], ['핑크', '#f4a7bf'], ['로즈', '#d85b79'], ['레드', '#d82632'], ['와인', '#7b1f35'],
    ['민트', '#a8e0cf'], ['세이지', '#a8bfa3'], ['그린', '#257a4a'], ['라임', '#cce85a'],
    ['옐로우', '#f3d34a'], ['엘로우', '#f3d34a'], ['오렌지', '#f28a3a'], ['브라운', '#7a4f32'],
    ['라벤더', '#c7b4e8'], ['연보라', '#c9b6ee'], ['보라', '#8f60c7'], ['그레이', '#9ca3af'], ['실버', '#cfd4dc']
  ];
  const hits = [];
  map.forEach(([key, value]) => {
    if (text.includes(key.toLowerCase()) && !hits.includes(value)) hits.push(value);
  });
  if (!hits.length) return '#fce7f3';
  if (hits.length === 1) return hits[0];
  const step = 100 / hits.length;
  return 'linear-gradient(135deg, ' + hits.map((color, i) => `${color} ${Math.round(i * step)}%, ${color} ${Math.round((i + 1) * step)}%`).join(', ') + ')';
}
function colorOptionStyle(label) {
  const swatch = optionColorValue(label);
  return `style="--option-color:${swatch};"`;
}
function colorOptionsBlock(p) {
  if (!p.designGroupId) return '';
  const variants = PRODUCTS
    .filter(item => item.designGroupId && item.designGroupId === p.designGroupId && visibleToAudience(item))
    .sort((a, b) => codeOf(a).localeCompare(codeOf(b), 'ko'));
  if (variants.length < 2) return '';
  const buttons = variants.map(item => {
    const selected = codeOf(item) === codeOf(p);
    const label = cleanText(localizedProductValue(item, 'variantColor') || localizedProductValue(item, 'color') || displayName(item));
    return `<button class="color-option ${selected ? 'on' : ''}" type="button" data-code="${codeOf(item)}" aria-pressed="${selected}" ${colorOptionStyle(label)}><span class="color-swatch" aria-hidden="true"></span><span>${label}</span></button>`;
  }).join('');
  return `<div class="box color-options-box"><b>${t('sameDesignColors')}</b><div class="color-options">${buttons}</div></div>`;
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
  document.body.classList.remove('detail-open');
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

function setDetailImage(index) {
  if (!currentImages.length) return;
  currentImageIndex = (index + currentImages.length) % currentImages.length;
  const next = currentImages[currentImageIndex];
  const main = $('#mainImage', detail);
  if (main && next) {
    const nextSrc = img(next.url);
    main.src = nextSrc;
    main.dataset.full = nextSrc;
    main.dataset.index = String(currentImageIndex);
    main.alt = `${displayName(currentProduct || {})} ${currentImageIndex + 1}`.trim();
  }
  $$('.thumb', detail).forEach((x, j) => {
    const on = currentImageIndex === j;
    x.classList.toggle('on', on);
    x.setAttribute('aria-current', on ? 'true' : 'false');
    if (on && typeof x.scrollIntoView === 'function') {
      x.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
  const counter = $('.image-counter', detail);
  if (counter) counter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
}
function moveDetailImage(delta) {
  setDetailImage(currentImageIndex + delta);
}

function bindDetailSwipe() {
  const main = $('.detail-main', detail);
  if (!main || main.dataset.swipeBound === '1') return;
  main.dataset.swipeBound = '1';
  let startX = 0;
  let startY = 0;
  main.addEventListener('pointerdown', e => {
    startX = e.clientX;
    startY = e.clientY;
  }, { passive: true });
  main.addEventListener('pointerup', e => {
    if (!startX) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    startX = 0;
    startY = 0;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      moveDetailImage(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
}


function openImageZoom(src, alt) {
  if (!src) return;
  let zoom = document.getElementById('imageZoomModal');
  if (!zoom) {
    zoom = document.createElement('div');
    zoom.id = 'imageZoomModal';
    zoom.className = 'image-zoom-modal';
    zoom.innerHTML = `<button class="image-zoom-close" type="button" aria-label="${t('close')}">×</button><img class="image-zoom-img" alt="">`;
    document.body.appendChild(zoom);
    zoom.addEventListener('click', e => {
      if (e.target === zoom || e.target.classList.contains('image-zoom-close')) {
        closeImageZoom();
      }
    });
  }
  const im = zoom.querySelector('.image-zoom-img');
  im.src = src;
  im.alt = alt || '';
  zoom.classList.add('open');
  document.body.classList.add('zoom-open');
}

function currentDetailImageSrc() {
  const fromList = currentImages && currentImages[currentImageIndex] && currentImages[currentImageIndex].url;
  if (fromList) return img(fromList);
  const main = $('#mainImage', detail);
  return main ? (main.dataset.full || main.currentSrc || main.src) : '';
}

function openCurrentDetailImage() {
  const main = $('#mainImage', detail);
  const src = currentDetailImageSrc();
  const alt = main ? main.alt : displayName(currentProduct || {});
  openImageZoom(src, alt);
}


function closeImageZoom() {
  const zoom = document.getElementById('imageZoomModal');
  if (zoom) zoom.classList.remove('open');
  document.body.classList.remove('zoom-open');
}

if (!window.__niceImageZoomEscBound) {
  window.__niceImageZoomEscBound = true;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeImageZoom();
  });
}

function bindDetailZoom() {
  const main = $('.detail-main', detail);
  if (!main || main.dataset.zoomBound === '1') return;
  main.dataset.zoomBound = '1';
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;

  main.addEventListener('touchstart', e => {
    const t0 = e.touches && e.touches[0];
    if (!t0) return;
    touchStartX = t0.clientX;
    touchStartY = t0.clientY;
    touchMoved = false;
  }, { passive: true });

  main.addEventListener('touchmove', e => {
    const t0 = e.touches && e.touches[0];
    if (!t0) return;
    if (Math.abs(t0.clientX - touchStartX) > 12 || Math.abs(t0.clientY - touchStartY) > 12) {
      touchMoved = true;
    }
  }, { passive: true });

  main.addEventListener('touchend', e => {
    if (touchMoved) return;
    if (e.target.closest && e.target.closest('.image-nav')) return;
    if (e.target.closest && e.target.closest('#mainImage, .detail-main')) {
      e.preventDefault();
      e.stopPropagation();
      openCurrentDetailImage();
    }
  }, { passive: false });

  main.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('.image-nav')) return;
    if (e.target.closest && e.target.closest('#mainImage, .detail-main')) {
      e.preventDefault();
      e.stopPropagation();
      openCurrentDetailImage();
    }
  });
}

function openDetail(code) {
  const p = PRODUCTS.find(x => codeOf(x) === code);
  if (!p || !visibleToAudience(p)) return;
  currentProduct = p;
  currentImages = imageListFor(p);
  currentImageIndex = 0;
  const labelTags = [isNew(p) ? 'NEW' : '', (p.steady || hasTag(p, 'STEADY')) ? 'STEADY' : '', isBest(p) ? 'BEST' : '', isFittingAvailable(p) ? t('fittingAvailable') : '', isSameDayCandidate(p) ? t('sameDay') : '', sizeBadgeText(p), isLuxuryCandidate(p) ? '럭셔리' : ''].filter(Boolean).slice(0, 5);
  const pointItems = publicPoints(p);
  detail.innerHTML = `<div class="body">
    <section class="visual">
      <div class="main detail-main">${currentImages[0] ? `<img id="mainImage" class="zoomable-image" loading="eager" decoding="async" data-index="0" src="${img(currentImages[0].url)}" data-full="${img(currentImages[0].url)}" alt="${displayName(p)}">` : 'NO IMAGE'}${currentImages.length > 1 ? `<button class="image-nav image-prev" type="button" data-dir="-1" aria-label="${t('imagePrev')}">‹</button><button class="image-nav image-next" type="button" data-dir="1" aria-label="${t('imageNext')}">›</button><span class="image-counter">1 / ${currentImages.length}</span>` : ''}</div>
      <div class="thumbs">${currentImages.map((im, i) => `<button class="thumb ${i === 0 ? 'on' : ''}" type="button" data-i="${i}" aria-current="${i === 0 ? 'true' : 'false'}"><img loading="lazy" decoding="async" src="${img(im.url)}" alt="${displayName(p)} ${i + 1}"></button>`).join('')}</div>
    </section>
    <section class="copy">
      <div class="tags">${labelTags.map(x => `<span>${localizedLabelText(x)}</span>`).join('')}</div>
      <h2>${displayName(p)}</h2>
      ${detailPriceBlock(p)}
      ${!p.price ? `<p class="detail-price-note">${t('detailPriceNote')}</p>` : ''}
      <div class="detail-lead">
        <span class="lead-label">NICE PICK</span>
        <p>${detailLeadCopy(p)}</p>
      </div>
      <div class="detail-highlight">
        ${detailHighlightItems(p, pointItems).map(x => `<span>${x}</span>`).join('')}
      </div>
      <div class="spec">
        ${specCells(p)}
      </div>
      ${sizeGuideBlock(p)}
      ${wearInfoBlock(p)}
      ${colorOptionsBlock(p)}
      ${coordinatedBlock(p)}
      <p class="common-note">${t('commonNote')}</p>
      <div class="cta detail-cta">
        <button class="kakao detail-contact" type="button" data-mode="product"><span class="kakao-logo">TALK</span><span>${t('productAsk')}</span></button>
        <a class="insta" href="${INSTA_URL}" target="_blank" rel="noopener noreferrer">${instaIcon()}<span>${t('instaAsk')}</span></a>
      </div>
    </section>
  </div>`;
  modal.classList.add('open');
  document.body.classList.add('detail-open');
  openModalHistory(code);
  $$('.thumb', detail).forEach(b => b.onclick = e => {
    e.preventDefault();
    e.stopPropagation();
    setDetailImage(Number(b.dataset.i));
  });
  $$('.image-nav', detail).forEach(b => b.onclick = e => {
    e.preventDefault();
    e.stopPropagation();
    moveDetailImage(Number(b.dataset.dir));
  });
  bindDetailSwipe();
  bindDetailZoom();
  $$('.detail-contact', detail).forEach(b => b.onclick = () => contactProduct(p, b.dataset.mode));
  $$('.color-option', detail).forEach(b => b.onclick = () => openDetail(b.dataset.code));
  $$('.coord-link', detail).forEach(b => b.onclick = () => openDetail(b.dataset.code));
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

detail.addEventListener('click', e => {
  const nav = e.target.closest && e.target.closest('.image-nav');
  if (nav) {
    e.preventDefault();
    e.stopPropagation();
    moveDetailImage(Number(nav.dataset.dir || 0));
    return;
  }
  const thumb = e.target.closest && e.target.closest('.thumb');
  if (thumb) {
    e.preventDefault();
    e.stopPropagation();
    setDetailImage(Number(thumb.dataset.i || 0));
  }
});

document.addEventListener('keydown', e => {
  if (!modal.classList.contains('open')) return;
  const tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag)) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    moveDetailImage(-1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    moveDetailImage(1);
  }
});

modal.onclick = e => { if (e.target === modal) closeDetail(); };
chips.onclick = e => {
  const b = e.target.closest('.chip');
  if (!b) return;
  applyView(b.dataset.f, { push: true, scroll: true });
};
quick.onclick = e => {
  const b = e.target.closest('.quick-chip');
  if (!b) return;
  if (b.dataset.q === '전체') {
    applyView('ALL', { search: '', push: true, scroll: true });
    return;
  }
  applyView('ALL', { search: b.dataset.q, push: true, scroll: true });
};
if (langSwitcher) {
  langSwitcher.onclick = e => {
    const b = e.target.closest('.lang-chip');
    if (!b) return;
    setLanguage(b.dataset.lang);
  };
}
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
      vipMessage.textContent = t('vipOk');
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
      vipMessage.textContent = t('vipError');
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
    updateStaticLanguage();
    buildLangSwitcher();
    buildQuick();
    buildChips();
    render();
  })
  .catch(() => {
    grid.innerHTML = `<div class="empty">${t('dataFail')}</div>`;
  });
