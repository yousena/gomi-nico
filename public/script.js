/**
 * ごみ分別プラットフォーム — script.js
 * マルチテナントSaaS版 / さんあーるスタイル
 *
 * 使い方:
 *   ?city=shiki  → data_shiki.json を読み込む
 *   パラメータなし → デフォルト city = 'shiki'
 *
 * ※ fetch() はファイル直接開き(file://)では動きません。
 *   VS Code → Live Server 拡張 → http://127.0.0.1:5500/?city=shiki
 */

'use strict';

/* =====================================================
   定数: 表示スタイル（プレゼンテーション層）
===================================================== */
/* =====================================================
   日本の祝日（2025〜2027年）
===================================================== */
const JAPAN_HOLIDAYS = new Set([
  // 2025年
  '2025-01-01','2025-01-13','2025-02-11','2025-02-23','2025-02-24',
  '2025-03-20','2025-04-29','2025-05-03','2025-05-04','2025-05-05',
  '2025-05-06','2025-07-21','2025-08-11','2025-09-15','2025-09-22',
  '2025-09-23','2025-10-13','2025-11-03','2025-11-23','2025-11-24',
  // 2026年
  '2026-01-01','2026-01-12','2026-02-11','2026-02-23','2026-03-20',
  '2026-04-29','2026-05-03','2026-05-04','2026-05-05','2026-05-06',
  '2026-07-20','2026-08-11','2026-09-21','2026-09-22','2026-09-23',
  '2026-10-12','2026-11-03','2026-11-23',
  // 2027年
  '2027-01-01','2027-01-11','2027-02-11','2027-02-23','2027-03-21',
  '2027-04-29','2027-05-03','2027-05-04','2027-05-05','2027-07-19',
  '2027-08-11','2027-09-20','2027-09-23','2027-10-11','2027-11-03',
  '2027-11-23',
]);

function isHoliday(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var d = String(date.getDate()).padStart(2, '0');
  return JAPAN_HOLIDAYS.has(y + '-' + m + '-' + d);
}

const TYPE_STYLE = {
  // ── 既存（志木市）
  moeru:       { icon:'local_fire_department', img:'/icons/moeru.svg',   bg:'var(--c-moeru-bg)',   iconBg:'rgba(232,81,42,0.14)',   fg:'var(--c-moeru)',   dotColor:'var(--c-moeru)'   },
  moenai:      { icon:'delete_sweep',          img:'/icons/moenai.svg',  bg:'var(--c-moenai-bg)',  iconBg:'rgba(128,64,204,0.14)', fg:'var(--c-moenai)',  dotColor:'var(--c-moenai)'  },
  recycle:     { icon:'recycling',             img:'/icons/recycle.svg', bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  'shigen-pla':{ icon:'water_bottle',          img:'/icons/plastic.svg', bg:'var(--c-pla-bg)',     iconBg:'rgba(120,190,0,0.14)',   fg:'var(--c-pla)',     dotColor:'var(--c-pla)'     },
  kiken:       { icon:'warning',               img:'/icons/danger.svg',  selfBg:true, bg:'var(--c-kiken-bg)',   iconBg:'rgba(240,122,0,0.14)',   fg:'var(--c-kiken)',   dotColor:'var(--c-kiken)'   },
  yugai:       { icon:'science',               img:'/icons/harmful.svg', selfBg:true, bg:'var(--c-yugai-bg)',   iconBg:'rgba(145,96,204,0.14)',  fg:'var(--c-yugai)',   dotColor:'var(--c-yugai)'   },
  sodai:       { icon:'weekend',               img:'/icons/sodai.svg',   selfBg:true, bg:'var(--c-sodai-bg)',   iconBg:'rgba(122,82,48,0.14)',   fg:'var(--c-sodai)',   dotColor:'var(--c-sodai)'   },
  // ── 拡張（マルチ自治体対応）
  fuku:        { icon:'checkroom',             img:'/icons/fuku.svg',    bg:'var(--c-fuku-bg)',    iconBg:'rgba(91,132,196,0.14)',  fg:'var(--c-fuku)',    dotColor:'var(--c-fuku)'    },
  kami:        { icon:'newspaper',             img:'/icons/kami.svg',    bg:'var(--c-kami-bg)',    iconBg:'rgba(180,130,40,0.14)',  fg:'var(--c-kami)',    dotColor:'var(--c-kami)'    },
  cardboard:   { icon:'inventory_2',                                      bg:'var(--c-cardboard-bg)',iconBg:'rgba(156,108,48,0.14)',fg:'var(--c-cardboard)',dotColor:'var(--c-cardboard)'},
  kami_pack:   { icon:'coffee',                                           bg:'var(--c-kami_pack-bg)',iconBg:'rgba(100,160,200,0.14)',fg:'var(--c-kami_pack)',dotColor:'var(--c-kami_pack)'},
  can:         { icon:'sports_bar',            img:'/icons/can_pet.svg', bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  pet:         { icon:'water_bottle',          img:'/icons/can_pet.svg', bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  bin:         { icon:'wine_bar',              img:'/icons/bin.svg',     bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  can_pet_bin: { icon:'recycling',             img:'/icons/can_pet.svg', bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  can_pet:     { icon:'recycling',             img:'/icons/can_pet.svg', bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  spraycan:    { icon:'propane',                                          bg:'var(--c-kiken-bg)',   iconBg:'rgba(224,120,0,0.14)',   fg:'var(--c-kiken)',   dotColor:'var(--c-kiken)'   },
  kitchen:     { icon:'compost',                                          bg:'var(--c-moeru-bg)',   iconBg:'rgba(232,81,42,0.14)',   fg:'var(--c-moeru)',   dotColor:'var(--c-moeru)'   },
  tree:        { icon:'forest',                                           bg:'var(--c-tree-bg)',    iconBg:'rgba(90,136,0,0.14)',    fg:'var(--c-tree)',    dotColor:'var(--c-tree)'    },
  unknown:     { icon:'help',               img:'/icons/none.svg',        keepBg:true, bg:'var(--c-unknown-bg)', iconBg:'rgba(136,144,160,0.14)', fg:'var(--c-unknown)', dotColor:'var(--c-unknown)'  },
};

/**
 * カテゴリアイコンHTML（Material Symbols Rounded · Filled）
 * @param {string} typeKey  TYPE_STYLE のキー
 * @param {number} sizePx   フォントサイズ px（省略時 20）
 * @returns {string} HTML文字列
 */
function catIcon(typeKey, sizePx) {
  var st = TYPE_STYLE[typeKey] || TYPE_STYLE.unknown;
  var sz = sizePx || 20;
  if (st.img && sz >= 20) {
    return '<img src="' + st.img + '" width="' + sz + '" height="' + sz + '" alt="" aria-hidden="true" style="display:block;object-fit:cover;flex-shrink:0">';
  }
  return '<span class="ms-cat" style="font-size:' + sz + 'px;color:' + st.fg + '" aria-hidden="true">' + st.icon + '</span>';
}

const WD_JP    = ['日','月','火','水','木','金','土'];
const QUICK_TAGS = ['ペットボトル','乾電池','スプレー缶','蛍光灯','段ボール','衣類','布団','自転車','リチウム電池','食用油'];

/* 対応言語（Google 翻訳コード） */
const LANGUAGES = [
  { code:'ja',    flag:'🇯🇵', label:'日本語'          },
  { code:'en',    flag:'🇺🇸', label:'English'          },
  { code:'zh-CN', flag:'🇨🇳', label:'中文（简体）'     },
  { code:'zh-TW', flag:'🇹🇼', label:'中文（繁體）'     },
  { code:'ko',    flag:'🇰🇷', label:'한국어'           },
  { code:'vi',    flag:'🇻🇳', label:'Tiếng Việt'       },
  { code:'pt',    flag:'🇧🇷', label:'Português'        },
  { code:'es',    flag:'🇪🇸', label:'Español'          },
  { code:'tl',    flag:'🇵🇭', label:'Filipino'         },
  { code:'id',    flag:'🇮🇩', label:'Bahasa Indonesia' },
];

const DEFAULT_FAQ = [
  { q:'ごみ出しの時間は？',        a:'朝8時までに指定の集積所へ出してください。前日夜の持ち出しは不可です。' },
  { q:'指定袋はありますか？',       a:'指定袋の指定はありません。透明または半透明の袋で出してください。' },
  { q:'収集日が祝日と重なったら？', a:'年末年始（12/31〜1/3）を除き、祝日でも通常通り収集します。' },
  { q:'粗大ごみの出し方は？',       a:'一斗缶（24×24×35cm）を超えるものは粗大ごみです。環境推進課へ事前申込が必要です。' },
  { q:'リチウム電池はどう出す？',   a:'令和8年4月から「危険ごみ」として月1回収集。モバイルバッテリー・スマホ・電動工具等が対象です。' },
];

/* =====================================================
   グローバル状態
===================================================== */
let DATA = null;
let calYear, calMonth; // 表示中の年・月（月間グリッド表示）

/**
 * 都市検出: metaタグ(/shiki/) → URLパス(/shiki/) → クエリパラメータ(?city=shiki) → デフォルト
 * init()と地域選択(gc_area)保存キーの両方で同じ判定ロジックを使うための共通関数。
 */
function getCityId() {
  const cityMeta = document.querySelector('meta[name="city"]');
  const pathMatch = location.pathname.match(/^\/([a-z0-9-]+)\//);
  return cityMeta?.content
      || (pathMatch ? pathMatch[1] : null)
      || new URLSearchParams(location.search).get('city')
      || 'shiki';
}

/**
 * 選択地区を保存するlocalStorageキー。自治体ごとに分離する（'gc_area_' + city）。
 * 志木市・蕨市は同一origin（gomi-nico.jp）のためlocalStorageを共有しており、
 * 自治体非依存の単一キー'gc_area'のままだと、片方の自治体で選んだ地区キーが
 * もう片方のDATA.areasに存在せず、restoreArea()のガードに弾かれて
 * 「地域設定バッジが表示されない」症状になっていた（2026-07-23発見・修正）。
 */
function getAreaKey() {
  return 'gc_area_' + getCityId();
}

/* =====================================================
   ENTRY POINT
===================================================== */
(async function init() {
  const city = getCityId();
  showLoading(true);

  try {
    const res = await fetch(`/data_${city}.json`);
    if (!res.ok) throw new Error(`data_${city}.json が見つかりません (HTTP ${res.status})`);
    DATA = await res.json();
  } catch (err) {
    showError(err.message);
    return;
  }

  showLoading(false);
  applyMunicipalityMeta();
  applyAdType();
  buildAreaSheet();
  restoreArea();

  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();

  applyFeatures();
  renderCalendar();
  renderTodayStrip();
  renderRules();
  renderGuide();
  renderContact();
  renderAffiliate();
  renderFAQ();
  renderQuickTags();
  document.getElementById('search-body').innerHTML = renderSearchIndex();

  // 言語インジケーター初期化
  updateLangIndicator(getCurrentLangCode());

  showPanel('calendar'); // デフォルト表示

  // 記事等からの深いリンク: /shiki/?open=sodai のようにカテゴリキーを指定すると
  // 該当カテゴリの詳細シートを自動で開く
  const openParam = new URLSearchParams(location.search).get('open');
  if (openParam && DATA.categories && DATA.categories[openParam]) {
    openCategoryDetail(openParam);
  }
})();

/* =====================================================
   ローディング / エラー
===================================================== */
function showLoading(visible) {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.toggle('is-hidden', !visible);
}

function showError(msg) {
  const el = document.getElementById('loading-overlay');
  if (!el) return;
  el.innerHTML = `
    <div class="text-center px-6 py-12">
      <div class="mb-4"><span class="ms-nav" style="font-size:48px;color:#E07800">warning</span></div>
      <p class="font-bold text-[#1C1C1E] mb-2">データを読み込めませんでした</p>
      <p class="text-xs text-[#636366]">${msg}</p>
      <p class="text-[11px] text-[#6B7280] mt-2 leading-relaxed">
        ローカルサーバーが必要です:<br>
        <code class="bg-black/[0.06] px-[6px] py-[2px] rounded">Live Server で開いてください</code>
      </p>
    </div>`;
}

/* =====================================================
   自治体メタ情報
===================================================== */
/* =====================================================
   自治体テーマカラー: brand_color から --brand系トークンを計算
   （詳細: docs/ごみニコDS.md §1-1-1）
===================================================== */
function shadeHex(hex, factor) {
  // factor: 1.0=そのまま、0.82のように1未満で暗色化
  var num = parseInt(hex.replace('#', ''), 16);
  var r = Math.max(0, Math.min(255, Math.round(((num >> 16) & 0xFF) * factor)));
  var g = Math.max(0, Math.min(255, Math.round(((num >> 8) & 0xFF) * factor)));
  var b = Math.max(0, Math.min(255, Math.round((num & 0xFF) * factor)));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

function hexToRgba(hex, alpha) {
  var num = parseInt(hex.replace('#', ''), 16);
  var r = (num >> 16) & 0xFF;
  var g = (num >> 8) & 0xFF;
  var b = num & 0xFF;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function applyMunicipalityMeta() {
  const city  = DATA.name;          // 志木市
  const pref  = DATA.prefecture;    // 埼玉県
  const id    = DATA.municipality_id; // shiki
  const pageUrl = `https://gomi-nico.jp/${id}/`;
  const pageTitle = `${city}のごみ収集日・ごみ分別検索｜ごみニコ`;
  const pageDesc  = `${pref}${city}のごみ収集日・分別方法を地区別に簡単検索。可燃ごみ・不燃ごみ・資源ごみのカレンダー表示、分別検索、ごみ出しルールをまとめた非公式情報サイト「ごみニコ」です。`;

  // ── タイトル ──
  document.title = pageTitle;
  document.getElementById('header-title').textContent = `${city}ごみ分別`;

  // ── meta 基本 ──
  const setMeta = (sel, val, attr = 'content') => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  };
  setMeta('meta[name="description"]', pageDesc);
  setMeta('meta[name="keywords"]',    `${city},ごみ,分別,収集日,カレンダー,可燃,不燃,資源,粗大ごみ,ペットボトル,ごみ出し`);
  setMeta('#meta-canonical',          pageUrl, 'href');

  // ── OGP ──
  setMeta('meta[property="og:title"]',       pageTitle);
  setMeta('meta[property="og:description"]', pageDesc);
  setMeta('meta[property="og:url"]',         pageUrl);

  // ── Twitter Card ──
  setMeta('meta[name="twitter:title"]',       `${city}のごみ収集日・ごみ分別検索｜ごみニコ`);
  setMeta('meta[name="twitter:description"]', `${pref}${city}のごみ収集日・分別方法を地区別に検索できます。`);

  // ── JSON-LD ──
  const contact0 = (DATA.contact || [])[0] || {};
  const faqItems = (DATA.faq || []).map(f => ({
    '@type': 'Question',
    'name': f.q,
    'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
  }));
  const ldJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://gomi-nico.jp/#website',
        'name': 'ごみニコ',
        'alternateName': 'ごみ分別ガイド',
        'url': 'https://gomi-nico.jp/',
        'description': '自治体別ごみ収集日・分別方法検索サービス「ごみニコ」',
        'inLanguage': 'ja',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `https://gomi-nico.jp/${id}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'WebPage',
        '@id': pageUrl,
        'url': pageUrl,
        'name': pageTitle,
        'description': pageDesc,
        'inLanguage': 'ja',
        'isPartOf': { '@id': 'https://gomi-nico.jp/#website' },
        'about': {
          '@type': 'GovernmentService',
          'name': `${city} ごみ収集サービス`,
          'provider': {
            '@type': 'GovernmentOrganization',
            'name': `${city} 環境推進課`,
            'telephone': contact0.tel || '',
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': city,
              'addressRegion': pref,
              'addressCountry': 'JP'
            }
          }
        }
      },
      ...(faqItems.length ? [{ '@type': 'FAQPage', 'mainEntity': faqItems }] : [])
    ]
  };
  const ldEl = document.getElementById('ld-json');
  if (ldEl) ldEl.textContent = JSON.stringify(ldJson);

  // ── フッター出典 ──
  const citationLink = document.getElementById('citation-link');
  if (citationLink && DATA.official_url) {
    citationLink.href = DATA.official_url;
    citationLink.textContent = DATA.official_url_label || `${city}ホームページ`;
  }
  const citationNote = document.getElementById('citation-note');
  if (citationNote) {
    const dateStr = DATA.citation_date || '';
    citationNote.textContent = `参照日：${dateStr}${dateStr ? ' ／ ' : ''}本サイトは${city}の非公式サイトです`;
  }

  // ── ブランドカラー ── brand_colorから--brand系3トークンを自動生成（DS.md §1-1-1）
  if (DATA.brand_color) {
    var brand = DATA.brand_color;
    document.documentElement.style.setProperty('--brand', brand);
    document.documentElement.style.setProperty('--brand-strong', shadeHex(brand, 0.82));
    document.documentElement.style.setProperty('--brand-soft', hexToRgba(brand, 0.08));
    document.documentElement.style.setProperty('--brand-soft-strong', hexToRgba(brand, 0.15));
    setMeta('meta[name="theme-color"]', brand);
  }

  // ── 自治体ロゴ ──
  const logoEl = document.getElementById('city-logo');
  if (logoEl) {
    if (DATA.cityLogo) {
      logoEl.src = DATA.cityLogo;
      logoEl.alt = city + ' ロゴ';
      logoEl.removeAttribute('aria-hidden');
      logoEl.classList.remove('is-hidden');
    } else {
      logoEl.classList.add('is-hidden');
    }
  }
}

/* =====================================================
   広告切替
===================================================== */
function applyAdType() {
  const type  = DATA.ad_type || 'affiliate';
  const topAd = document.getElementById('ad-top');
  const anchor = document.getElementById('anchor-ad-inner');

  if (type === 'none') {
    [topAd, document.getElementById('ad-infeed'), document.getElementById('anchor-ad')].forEach(el => { if (el) el.classList.add('is-hidden'); });
    document.body.style.paddingBottom = 'calc(64px + var(--safe-b))';
    return;
  }
  if (type === 'official') {
    if (anchor) anchor.innerHTML = `<div class="text-[10px] text-[#6B7280]">${DATA.name} 公式情報</div>`;
  }
}

/* =====================================================
   ハンバーガーメニュー
===================================================== */
function openMenu() {
  document.getElementById('menu-backdrop').classList.remove('is-hidden');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  document.getElementById('menu-backdrop').classList.add('is-hidden');
  document.body.style.overflow = '';
}

function handleMenuBackdrop(e) {
  if (e.target === e.currentTarget) closeMenu();
}

/* =====================================================
   地区シート
===================================================== */
function buildAreaSheet() {
  const scroll = document.getElementById('sheet-scroll');
  scroll.innerHTML = DATA.area_groups.map(g => `
    <p class="text-[10px] font-extrabold text-[#6B7280] tracking-[0.12em] uppercase pt-4 px-2 pb-2">${g.label}</p>
    ${g.keys.map(k => {
      const area = DATA.areas[k];
      if (!area) return '';
      return `
        <button class="area-option flex items-center justify-between w-full text-left
                       px-4 py-4 rounded-2xl border-none bg-transparent
                       font-sans text-base font-medium text-[#1C1C1E]
                       cursor-pointer min-h-[48px]"
                data-key="${k}" onclick="selectArea('${k}')" type="button">
          <span>
            ${area.name}
            ${area.note ? `<span class="text-xs text-[#6B7280] block mt-[1px] font-normal">${area.note}</span>` : ''}
          </span>
          <span class="ms-nav area-check-icon" aria-hidden="true">check_circle</span>
        </button>`;
    }).join('')}
  `).join('');
}

function openSheet() {
  closeMenu();
  const saved = localStorage.getItem(getAreaKey());
  document.querySelectorAll('.area-option').forEach(btn => {
    const isSelected = btn.dataset.key === saved;
    btn.classList.toggle('selected', isSelected);
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });
  document.getElementById('sheet-backdrop').classList.remove('is-hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => { const first = document.querySelector('.area-option'); if (first) first.focus(); }, 60);
}

function closeSheet() {
  document.getElementById('sheet-backdrop').classList.add('is-hidden');
  document.body.style.overflow = '';
}

function handleBackdropClick(e) {
  if (e.target === e.currentTarget) closeSheet();
}

function selectArea(key) {
  localStorage.setItem(getAreaKey(), key);
  updateAreaDisplay();
  renderTodayStrip();
  renderCalendar();
  closeSheet();
}

/**
 * 自治体非依存だった旧キー'gc_area'からの一度きりの移行。
 * 新キーが未設定で、かつ旧キーの値が「今開いている自治体」のareasに実在する場合のみコピーする
 * （他自治体の地区キーをそのまま持ち込んで誤爆させないための安全ガード）。
 */
function migrateLegacyAreaKey() {
  const newKey = getAreaKey();
  if (localStorage.getItem(newKey)) return;
  const legacy = localStorage.getItem('gc_area');
  if (legacy && DATA.areas[legacy]) localStorage.setItem(newKey, legacy);
}

function restoreArea() {
  migrateLegacyAreaKey();
  const saved = localStorage.getItem(getAreaKey());
  if (saved && DATA.areas[saved]) updateAreaDisplay();
}

function updateAreaDisplay() {
  const key    = localStorage.getItem(getAreaKey());
  const nameEl = document.getElementById('header-area-name');
  if (!nameEl) return;
  if (key && DATA.areas[key]) {
    const name = DATA.areas[key].name;
    nameEl.textContent = name.length > 12 ? name.slice(0, 11) + '…' : name;
    nameEl.parentElement.classList.remove('is-hidden');
  } else {
    nameEl.parentElement.classList.add('is-hidden');
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['sheet-backdrop','menu-backdrop','day-detail-backdrop','item-detail-backdrop','contact-sheet','faq-sheet','vendor-sheet','language-sheet']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('is-hidden')) {
          el.classList.add('is-hidden');
          document.body.style.overflow = '';
        }
      });
  }
});

/* =====================================================
   お問い合わせシート（ハンバーガーメニューから）
===================================================== */
function openContact() {
  closeMenu();
  renderContact();
  document.getElementById('contact-sheet').classList.remove('is-hidden');
  document.body.style.overflow = 'hidden';
}
function closeContact() {
  document.getElementById('contact-sheet').classList.add('is-hidden');
  document.body.style.overflow = '';
}

/* =====================================================
   関連業者シート（ハンバーガーメニューから）
===================================================== */
function openVendor() {
  closeMenu();
  document.getElementById('vendor-sheet').classList.remove('is-hidden');
  document.body.style.overflow = 'hidden';
}
function closeVendor() {
  document.getElementById('vendor-sheet').classList.add('is-hidden');
  document.body.style.overflow = '';
}

/* =====================================================
   FAQシート（ハンバーガーメニューから）
===================================================== */
function openFAQ() {
  closeMenu();
  document.getElementById('faq-sheet').classList.remove('is-hidden');
  document.body.style.overflow = 'hidden';
}
function closeFAQ() {
  document.getElementById('faq-sheet').classList.add('is-hidden');
  document.body.style.overflow = '';
}

/* =====================================================
   スケジュール計算
===================================================== */
function getNthWeekday(year, month, weekday, n) {
  let d = new Date(year, month, 1), count = 0;
  while (d.getMonth() === month) {
    if (d.getDay() === weekday) { count++; if (count === n) return new Date(d); }
    d.setDate(d.getDate() + 1);
  }
  return null;
}

function isYearEnd(date) {
  if (!DATA?.collection_settings?.yearend_enabled) return false;
  const m = date.getMonth(), dd = date.getDate();
  return DATA.collection_settings.yearend_ranges.some(r => r.month === m && r.days.includes(dd));
}

/**
 * 特定の祝日（月・日固定）のみ収集をお休みにする自治体向けの判定
 * （蕨市: 「勤労感謝の日（振替休日を含む）」だけ収集なし。他の祝日は通常通り収集する
 *  という公式ルールのため、祝日全般を扱うisHoliday()/JAPAN_HOLIDAYSとは別に、
 *  data_{city}.jsonのcollection_settings.fixed_holidays_no_collectionで
 *  自治体ごとに個別指定できるようにした。フィールドが無い自治体は従来通り影響なし）
 * @param {Date} date
 * @returns {object|null} 該当する祝日ルール（{month,day,label,observe_substitute}）。無ければnull
 */
function getFixedHolidayClosure(date) {
  const rules = DATA?.collection_settings?.fixed_holidays_no_collection;
  if (!rules || !rules.length) return null;
  const year = date.getFullYear();
  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  for (const rule of rules) {
    const holidayDate = new Date(year, rule.month, rule.day);
    if (isSameDay(date, holidayDate)) return rule;
    // 振替休日: 祝日が日曜なら翌月曜も収集お休み（国民の祝日に関する法律の振替休日ルール）
    if (rule.observe_substitute && holidayDate.getDay() === 0) {
      const substitute = new Date(holidayDate);
      substitute.setDate(substitute.getDate() + 1);
      if (isSameDay(date, substitute)) return rule;
    }
  }
  return null;
}

function getGarbageForDate(areaKey, date) {
  if (!areaKey || !DATA?.areas[areaKey]) return [];
  const area  = DATA.areas[areaKey];
  const day   = date.getDay();
  const year  = date.getFullYear();
  const month = date.getMonth();
  if (isYearEnd(date) || getFixedHolidayClosure(date)) return [];

  const result = [];
  const cats   = DATA.categories;

  if (area.burnable?.includes(day))
    result.push({ type:'moeru',      label: cats.moeru?.label       || '可燃ごみ',        how: cats.moeru?.how       || '' });
  if (area.recycle?.includes(day))
    result.push({ type:'recycle',    label: cats.recycle?.label     || 'リサイクル資源',   how: cats.recycle?.how     || '' });
  if (area.plasticRec?.includes(day))
    result.push({ type:'shigen-pla', label: cats['shigen-pla']?.label || '資源プラスチック', how: cats['shigen-pla']?.how || '' });
  if (day === area.nonBurnable?.day) {
    for (const wk of area.nonBurnable.weeks) {
      const d = getNthWeekday(year, month, day, wk);
      if (d && d.getDate() === date.getDate()) {
        result.push({ type:'moenai', label:'不燃ごみ・有害ごみ', how: cats.moenai?.how || '' });
        break;
      }
    }
  }
  if (day === area.dangerous?.day) {
    const d = getNthWeekday(year, month, day, area.dangerous.week);
    if (d && d.getDate() === date.getDate())
      result.push({ type:'kiken', label: cats.kiken?.label || '危険ごみ', how: cats.kiken?.how || '' });
  }

  // ── 汎用スキーマ対応（蕨市など・カテゴリキーそのものをareasのプロパティ名として使う自治体向け）
  // 上記の志木市方式（burnable/recycle/plasticRec/nonBurnable/dangerous固定フィールド名）を
  // 変更せず維持しつつ、area[カテゴリキー] が直接存在する自治体データにも対応する。
  // 値が曜日番号の配列なら毎週パターン、{day, week} または {day, weeks} オブジェクトなら
  // 第n○曜日パターンとして扱う。既に上記で追加済みのtypeは二重追加しない。
  const addedTypes = new Set(result.map(r => r.type));
  Object.keys(cats).forEach(catKey => {
    if (addedTypes.has(catKey)) return;
    const val = area[catKey];
    if (val == null) return;
    if (Array.isArray(val)) {
      if (val.includes(day)) {
        result.push({ type: catKey, label: cats[catKey]?.label || catKey, how: cats[catKey]?.how || '' });
        addedTypes.add(catKey);
      }
    } else if (typeof val === 'object' && typeof val.day === 'number') {
      if (day === val.day) {
        const weeksArr = val.weeks || (val.week != null ? [val.week] : []);
        for (const wk of weeksArr) {
          const d = getNthWeekday(year, month, day, wk);
          if (d && d.getDate() === date.getDate()) {
            result.push({ type: catKey, label: cats[catKey]?.label || catKey, how: cats[catKey]?.how || '' });
            addedTypes.add(catKey);
            break;
          }
        }
      }
    }
  });

  return result;
}

function formatDateJP(date) {
  return `${date.getMonth()+1}月${date.getDate()}日（${WD_JP[date.getDay()]}）`;
}

// タイポグラフィ差別化版（DS.md 2-4-5・v1.29で「M月D日（曜）」表記に戻す）
// 数字は大きく太く、月/日の漢字・曜日の括弧書きは小さく表示する
// 「今日の収集」バナー・日別詳細シート見出しなど、主要な日付表示に共通使用する
function formatDateJPHtml(date) {
  return `<span class="jpdate-num">${date.getMonth()+1}</span><span class="jpdate-kanji">月</span>` +
         `<span class="jpdate-num">${date.getDate()}</span><span class="jpdate-kanji">日</span>` +
         `<span class="jpdate-wd">（${WD_JP[date.getDay()]}）</span>`;
}

/* =====================================================
   【独自提案①】今日の収集バナー
   カレンダー上部に今日の収集種別をひと目で表示
===================================================== */
function renderTodayStrip() {
  const stripEl = document.getElementById('today-strip');
  if (!stripEl) return;

  const today   = new Date();
  const areaKey = localStorage.getItem(getAreaKey());

  document.getElementById('today-strip-date').innerHTML = formatDateJPHtml(today);

  // 「朝8時までに〜出しましょう」の注記行は2026-07-24に廃止（太平さんの指摘でカードの文字量を整理）。
  // 同内容はFAQ「ごみは何時までに出せばいいですか？」に集約し、情報自体は失われないようにした

  const typesEl = document.getElementById('today-strip-types');
  if (!areaKey) {
    typesEl.innerHTML = `<span class="text-sm text-[#6B7280]">地区を選択してください</span>`;
    return;
  }

  const types = getGarbageForDate(areaKey, today);
  if (types.length === 0) {
    // 収集なし → 次の収集日を探す（最大14日先まで）
    let nextDate = null;
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const t = getGarbageForDate(areaKey, d);
      if (t.length > 0) { nextDate = d; break; }
    }
    if (nextDate) {
      const diff = Math.round((nextDate - today) / 86400000);
      const diffLabel = diff === 1 ? '明日' : `${diff}日後`;
      // カテゴリ名の列挙は括弧の入れ子で読みにくいとの指摘（2026-07-24）を受け削除。日数のみ表示する
      typesEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:2px">
          <span class="text-sm font-bold text-[#636366] inline-flex items-center gap-1"><span class="ms-nav" style="font-size:18px;color:var(--brand);vertical-align:-3px">check_circle</span>今日は収集なし</span>
          <span class="text-[12px] text-[#6B7280]">次の収集: ${diffLabel}</span>
        </div>`;
    } else {
      typesEl.innerHTML = `<span class="text-sm font-bold text-[#636366] inline-flex items-center gap-1"><span class="ms-nav" style="font-size:18px;color:var(--brand);vertical-align:-3px">check_circle</span>今日は収集なし</span>`;
    }
    return;
  }

  // チップの文言は短縮表示（categoryShortLabel）を使う。「紙類（古紙類・その他の紙類）」のような
  // 括弧書きの補足はここでは省略し、詳細は品目検索・カテゴリ詳細シート側で確認する運用（2026-07-24）
  typesEl.innerHTML = types.map(t => {
    const s = TYPE_STYLE[t.type] || TYPE_STYLE.unknown;
    return '<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 13px;border-radius:999px;font-size:14px;font-weight:700;background:' + s.bg + ';color:' + s.fg + '">' +
      '<span style="width:20px;height:20px;border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + catIcon(t.type, 20) + '</span> ' + categoryShortLabel(t.type) + '</span>';
  }).join('');
}

/**
 * カテゴリの短縮表示名（DS.md 2-4-1・v1.30）。data_{city}.jsonのcategories[key].shortLabelを優先し、
 * 無ければ通常のlabelにフォールバックする。「紙類（古紙類・その他の紙類）」のような括弧書きの補足を
 * 省いた短い名前を、today-stripのチップやカレンダー凡例など一覧性を優先する箇所で使う。
 */
function categoryShortLabel(typeKey) {
  const cat = (DATA && DATA.categories && DATA.categories[typeKey]) || {};
  return cat.shortLabel || cat.label || typeKey;
}

/* =====================================================
   日付タップの振り分け
   収集が1種類だけ・かつ詳細情報がある場合は、
   日別シートを飛ばして直接カテゴリ詳細へ遷移する（2タップ→1タップ）
===================================================== */
function handleDayTap(year, month, day) {
  const date    = new Date(year, month, day);
  const areaKey = localStorage.getItem(getAreaKey());

  if (!areaKey || isYearEnd(date)) { showDayDetail(year, month, day); return; }

  const types = getGarbageForDate(areaKey, date);
  if (types.length === 1) {
    const cat = (DATA && DATA.categories && DATA.categories[types[0].type]) || {};
    if (cat.allowed && cat.allowed.length > 0) {
      openCategoryDetail(types[0].type, year, month, day);
      return;
    }
  }
  showDayDetail(year, month, day);
}

/* =====================================================
   【独自提案②】日付タップ → 収集詳細ポップアップ
   さんあーる と同様の核心機能
===================================================== */
function showDayDetail(year, month, day) {
  const date    = new Date(year, month, day);
  const areaKey = localStorage.getItem(getAreaKey());

  document.getElementById('day-detail-date').innerHTML = formatDateJPHtml(date);
  document.getElementById('day-detail-content').innerHTML = buildDayDetailHTML(areaKey, date);

  document.getElementById('day-detail-backdrop').classList.remove('is-hidden');
  document.body.style.overflow = 'hidden';
}

function closeDayDetail() {
  document.getElementById('day-detail-backdrop').classList.add('is-hidden');
  document.body.style.overflow = '';
}

function buildDayDetailHTML(areaKey, date) {
  if (!areaKey) {
    return `<div class="text-center py-10 px-6">
      <p class="text-base font-bold text-[#636366]">地区を選択してください</p>
      <button onclick="closeDayDetail();openSheet();"
              class="mt-4 inline-flex items-center gap-1 bg-[var(--brand)] text-white
                     border-none rounded-full px-5 h-11 font-sans text-sm font-bold cursor-pointer"
              type="button">地区を選択する</button>
    </div>`;
  }
  if (isYearEnd(date)) {
    return `<div class="text-center py-10 px-6">
      <span class="text-[48px] block mb-3">🎍</span>
      <p class="text-base font-bold text-[#636366]">年末年始休止</p>
      <p class="text-xs text-[#6B7280] mt-1">${DATA.collection_settings.yearend_ranges
        .map(r => `${r.month === 11 ? 12 : 1}/${r.days.join('・')}`).join('〜')}は収集お休みです</p>
    </div>`;
  }
  const fixedHoliday = getFixedHolidayClosure(date);
  if (fixedHoliday) {
    return `<div class="text-center py-10 px-6">
      <span class="text-[48px] block mb-3">🎌</span>
      <p class="text-base font-bold text-[#636366]">${fixedHoliday.label}のため収集お休み</p>
      <p class="text-xs text-[#6B7280] mt-1">この日は通常の収集日でも収集がありません</p>
    </div>`;
  }

  const types = getGarbageForDate(areaKey, date);
  if (types.length === 0) {
    return `<div class="text-center py-10 px-6">
      <span class="text-[48px] block mb-3">😊</span>
      <p class="text-base font-bold text-[#636366]">この日の収集はありません</p>
    </div>`;
  }

  const items = types.map(t => {
    const s   = TYPE_STYLE[t.type] || TYPE_STYLE.unknown;
    const cat = (DATA && DATA.categories && DATA.categories[t.type]) || {};
    const hasDetail = cat.allowed && cat.allowed.length > 0;
    const tag = hasDetail ? 'button' : 'div';
    const btnAttrs = hasDetail
      ? ' onclick="closeDayDetail();openCategoryDetail(\'' + t.type + '\',' + date.getFullYear() + ',' + date.getMonth() + ',' + date.getDate() + ')" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:16px;background:#fff;border:1px solid rgba(0,0,0,0.07);width:100%;text-align:left;font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent"'
      : ' style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:16px;background:#fff;border:1px solid rgba(0,0,0,0.07)"';
    return '<' + tag + btnAttrs + '>' +
      '<div style="width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:' + (s.keepBg ? s.iconBg : 'transparent') + ';flex-shrink:0">' +
      catIcon(t.type, s.img ? 56 : 30) + '</div>' +
      '<div style="flex:1">' +
      '<p style="font-size:18px;font-weight:800;color:' + s.fg + ';line-height:1.2">' + t.label + '</p>' +
      (t.how ? '<p style="font-size:12px;margin-top:4px;line-height:1.5;color:#636366">' + t.how + '</p>' : '') +
      '</div>' +
      (hasDetail ? '<span class="ms-nav" style="color:' + s.fg + ';opacity:0.5;font-size:20px;flex-shrink:0">chevron_right</span>' : '') +
      '</' + tag + '>';
  }).join('');

  return `<div class="flex flex-col gap-2">${items}</div>`;
}

/* =====================================================
   カレンダー（月間グリッド・DS.md 2-4-4・v1.29）
   2026-07-24: 一時的に「日〜土固定の週間リスト」を試したが、太平さんの実機確認で
   「1か月グリッドの方が見やすい」との最終判断により月間グリッドに戻した。
   蕨市のように1日に収集カテゴリが3〜6種類重なる地区への対策は、小セルを拡張する
   のではなく「アイコン最大4枠・超過分は+Nバッジ」で表現する方式にした（後述）。
===================================================== */
function prevMonth() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function nextMonth() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); }

const WD_SHORT = ['日','月','火','水','木','金','土'];
const CAL_MAX_ICONS = 4; // 1セルに表示するアイコンの上限（2列×2行）。超過時は3枠+「+Nバッジ」に切り替える

function renderCalendar() {
  if (!DATA) return;
  const areaKey = localStorage.getItem(getAreaKey());
  const grid    = document.getElementById('cal-grid');
  const noArea  = document.getElementById('cal-no-area');

  // 見出し「2026年7月」も、数字を大きく・年/月の漢字を小さくするタイポグラフィで統一（DS.md 2-4-5・v1.30）
  const labelEl = document.getElementById('cal-month-label');
  if (labelEl) {
    labelEl.innerHTML = `<span class="jpdate-num">${calYear}</span><span class="jpdate-kanji">年</span>` +
                         `<span class="jpdate-num">${calMonth + 1}</span><span class="jpdate-kanji">月</span>`;
  }

  if (!areaKey) {
    grid.innerHTML = '';
    grid.classList.add('is-hidden');
    noArea.classList.remove('is-hidden');
    return;
  }
  noArea.classList.add('is-hidden');
  grid.classList.remove('is-hidden');

  const today0      = new Date(); today0.setHours(0,0,0,0);
  const firstOfMonth = new Date(calYear, calMonth, 1);
  const startDow      = firstOfMonth.getDay();
  const daysInMonth    = new Date(calYear, calMonth + 1, 0).getDate();

  let html = '';
  const seenTypes = new Map(); // 表示中の月に実在するカテゴリのみ凡例に出す（DS.md 2-4-1）

  // 月初の曜日オフセット分は空セルで埋める（列位置合わせ）
  for (let i = 0; i < startDow; i++) {
    html += '<div class="cal-cell cal-cell-empty" aria-hidden="true"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date    = new Date(calYear, calMonth, d);
    const types   = getGarbageForDate(areaKey, date);
    const isToday = date.getTime() === today0.getTime();
    const isYE    = isYearEnd(date) || !!getFixedHolidayClosure(date);
    const isHol   = isHoliday(date);
    const dow     = date.getDay();

    types.forEach(t => { if (!seenTypes.has(t.type)) seenTypes.set(t.type, t.label); });

    const dayCls    = (dow === 0 || isHol) ? 'cal-day cal-day-sun' : dow === 6 ? 'cal-day cal-day-sat' : 'cal-day';
    const labelText = types.map(t => t.label).join('・') || '収集なし';

    let iconsHtml = '';
    if (!isYE && types.length > 0) {
      if (types.length <= CAL_MAX_ICONS) {
        iconsHtml = '<div class="cal-icons">' + types.map(t =>
          '<span class="cal-icon-wrap">' + catIcon(t.type, 20) + '</span>'
        ).join('') + '</div>';
      } else {
        // 4種類を超える日は、3枠+「+Nバッジ」（残り件数）にまとめる。全件はタップ後の日別詳細で確認できる
        const shown    = types.slice(0, CAL_MAX_ICONS - 1);
        const overflow = types.length - shown.length;
        iconsHtml = '<div class="cal-icons">' +
          shown.map(t => '<span class="cal-icon-wrap">' + catIcon(t.type, 20) + '</span>').join('') +
          '<span class="cal-icon-wrap cal-icon-more">+' + overflow + '</span>' +
          '</div>';
      }
    }

    const cellCls = ['cal-cell',
      types.length > 0 ? 'has-col' : '',
      isToday          ? 'is-today' : '',
      isYE             ? 'yearend'  : '',
    ].filter(Boolean).join(' ');

    html += `
      <button class="${cellCls}" role="gridcell"
              aria-label="${calMonth+1}月${d}日 ${labelText}"
              onclick="handleDayTap(${calYear},${calMonth},${d})"
              type="button">
        <span class="${dayCls}">${d}</span>
        ${iconsHtml}
      </button>`;
  }
  grid.innerHTML = html;
  renderCategoryLegend(seenTypes);
}

/* =====================================================
   カテゴリ凡例（DS.md 2-4-1）
   その月のカレンダーに実在する種類だけを動的にチップ表示する
===================================================== */
function renderCategoryLegend(seenTypes) {
  const el = document.getElementById('cal-legend');
  if (!el) return;
  if (!seenTypes || seenTypes.size === 0) { el.innerHTML = ''; return; }

  // 色付きピルは「カラフルすぎる」との指摘（2026-07-24）を受け廃止。
  // アイコン＋三点リーダー＋カテゴリ名（短縮表記）を1行ずつ並べる、色のないリスト表示に変更（DS.md 2-4-1・v1.30）
  let rows = '';
  seenTypes.forEach((label, typeKey) => {
    rows += '<div style="display:flex;align-items:center;gap:8px;padding:4px 0">' +
      '<span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + catIcon(typeKey, 20) + '</span>' +
      '<span style="color:#6B7280;font-size:13px">…</span>' +
      '<span style="font-size:13px;font-weight:700;color:#1C1C1E">' + categoryShortLabel(typeKey) + '</span>' +
      '</div>';
  });
  el.innerHTML = rows;
}

/* =====================================================
   検索 — あいうえお順一覧
===================================================== */

/* 五十音行の判定テーブル（keyはジャンプナビのアンカーID用・asciiで固定） */
const KANA_ROWS = [
  { key:'a',  label:'あ行', re:/^[あいうえおアイウエオぁぃぅぇぉァィゥェォ]/ },
  { key:'ka', label:'か行', re:/^[かきくけこがぎぐげごカキクケコガギグゲゴ]/ },
  { key:'sa', label:'さ行', re:/^[さしすせそざじずぜぞサシスセソザジズゼゾ]/ },
  { key:'ta', label:'た行', re:/^[たちつてとだぢづでどタチツテトダヂヅデド]/ },
  { key:'na', label:'な行', re:/^[なにぬねのナニヌネノ]/ },
  { key:'ha', label:'は行', re:/^[はひふへほばびぶべぼぱぴぷぺぽハヒフヘホバビブベボパピプペポ]/ },
  { key:'ma', label:'ま行', re:/^[まみむめもマミムメモ]/ },
  { key:'ya', label:'や行', re:/^[やゆよヤユヨ]/ },
  { key:'ra', label:'ら行', re:/^[らりるれろラリルレロ]/ },
  { key:'wa', label:'わ行', re:/^[わをんワヲン]/ },
];
const ROW_ORDER = [...KANA_ROWS.map(r => r.label), 'その他'];

/**
 * 品目を五十音行に分類する。
 * 品目名の先頭が漢字の場合（例: 「額ぶち」「石こうボード」等）は名前だけでは判定できないため、
 * garbage_db登録ルール（CLAUDE.md「漢字を含む品目名はひらがな読みをtagsに追加」）で
 * 既に付与されているひらがな読みタグを次点の判定材料として使う。
 * @param {string} name 品目名
 * @param {string[]} [tags] 品目のtags配列（あれば渡す。無ければ名前のみで判定＝従来動作）
 */
function getKanaRow(name, tags) {
  for (const r of KANA_ROWS) { if (r.re.test(name)) return r.label; }
  if (tags && tags.length) {
    var hiraganaTag = tags.find(function(t){ return /^[ぁ-ん]/.test(t); });
    if (hiraganaTag) {
      for (const r of KANA_ROWS) { if (r.re.test(hiraganaTag)) return r.label; }
    }
  }
  return 'その他';
}

function getKanaKey(label) {
  var row = KANA_ROWS.find(function(r){ return r.label === label; });
  return row ? row.key : 'other';
}


/* =====================================================
   検索 — クイックタグ（カード1内）
===================================================== */
function renderQuickTags() {
  var el = document.getElementById('search-quick');
  if (!el) return;
  el.innerHTML =
    '<p style="font-size:13px;font-weight:800;color:#6B7280;letter-spacing:.06em;margin-bottom:10px;padding-left:4px">よく検索されるごみ</p>' +
    '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:0 2px">' +
    QUICK_TAGS.map(function(q) {
      return '<button style="padding:8px 16px;background:#fff;border:none;border-radius:20px;font-size:14px;font-weight:700;color:#1C1C1E;cursor:pointer;font-family:inherit;white-space:nowrap;min-height:40px;line-height:1.2;box-shadow:0 2px 8px rgba(0,0,0,0.08)" onclick="openItemDetail(\'' + q + '\')">' + q + '</button>';
    }).join('') +
    '</div>';
}

/* =====================================================
   検索 — あいうえお順一覧（カード2）
===================================================== */
function renderSearchIndex() {
  if (!DATA) return '';
  var sorted = DATA.garbage_db.slice().sort(function(a,b){ return a.name.localeCompare(b.name,'ja'); });
  var groups = new Map(ROW_ORDER.map(function(r){ return [r, []]; }));
  sorted.forEach(function(item){ groups.get(getKanaRow(item.name, item.tags)).push(item); });

  // 枠外ラベルを更新
  var labelEl = document.getElementById('search-index-label');
  if (labelEl) {
    labelEl.textContent = '全' + sorted.length + '件 — 五十音順';
    labelEl.classList.remove('is-hidden');
  }

  // 五十音ジャンプナビ（実在する行のみ表示。DS.md 2-4-3参照）
  renderKanaJumpNav(groups);

  var html = '';

  for (var _ref of groups) {
    var rowLabel = _ref[0], items = _ref[1];
    if (items.length === 0) continue;
    var rowKey = getKanaKey(rowLabel);

    // グループごとに独立カード（id・scroll-margin-topはジャンプナビからのスクロール着地位置用）
    html += '<div id="kana-sec-' + rowKey + '" class="kana-section" ' +
      'style="scroll-margin-top:calc(200px + env(safe-area-inset-top, 0px));background:#fff;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.08);overflow:hidden">';

    // 行見出し（白背景・ブランドカラーテキスト）
    html += '<div style="padding:0 16px;height:54px;display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:16px;font-weight:800;color:var(--brand)">' + rowLabel + '</span>' +
      '<span style="font-size:12px;color:#6B7280">' + items.length + '件</span>' +
      '</div>';

    // アイテム一覧
    items.forEach(function(item, idx) {
      var st   = TYPE_STYLE[item.category] || TYPE_STYLE.unknown;
      var cat  = DATA.categories[item.category] ? DATA.categories[item.category].label : item.category;
      var safe = item.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      var isLast = idx === items.length - 1;
      html += '<button style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;' +
        'padding:14px 16px;border:none;border-top:1px solid rgba(0,0,0,0.04);' +
        'background:#fff;font-family:inherit;cursor:pointer;min-height:54px;-webkit-tap-highlight-color:transparent" ' +
        'onclick="openItemDetail(\'' + safe + '\')">' +
        '<span style="flex:1;font-size:16px;font-weight:400;color:#1C1C1E">' + item.name + '</span>' +
        '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:4px;flex-shrink:0;overflow:hidden;background:' + (st.keepBg ? st.iconBg : 'transparent') + '">' + catIcon(item.category, st.img ? 28 : 18) + '</span>' +
        '<span class="ms-nav" style="color:#6B7280;font-size:20px;margin-left:2px">chevron_right</span>' +
        '</button>';
    });

    html += '</div>';
  }
  return html;
}

/* =====================================================
   検索 — 五十音ジャンプナビ（sticky・DS.md 2-4-3）
===================================================== */
function renderKanaJumpNav(groups) {
  var el = document.getElementById('kana-jump-nav');
  if (!el) return;

  var chips = KANA_ROWS.map(function(row) {
    var items = groups.get(row.label) || [];
    if (items.length === 0) return ''; // 実在しない行は出さない（2-4-1と同じ方針）
    return '<button type="button" class="kana-chip" data-kana-key="' + row.key + '" ' +
      'onclick="jumpToKana(\'' + row.key + '\')" aria-label="' + row.label + 'へ移動">' +
      row.label.charAt(0) + '</button>';
  }).join('');

  if (!chips) {
    el.innerHTML = '';
    el.classList.add('is-hidden');
    return;
  }

  el.innerHTML = '<div style="display:flex;gap:6px;overflow-x:auto;padding:8px 4px;-webkit-overflow-scrolling:touch">' + chips + '</div>';
  el.classList.remove('is-hidden');
  setupKanaJumpObserver();
}

function jumpToKana(key) {
  var target = document.getElementById('kana-sec-' + key);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * env(safe-area-inset-top) の実際のpx値を取得する。
 * IntersectionObserverのrootMarginはCSSのenv()/calc()を解釈しないため、
 * 高さ0・envのみを指定したprobe要素をDOMに挿入して実測する定番手法。
 * ノッチ機種でヘッダーがsafe-area分だけ伸びる分、sticky検索バー群のスタック高さもその分ずれるため必要。
 */
function getSafeAreaTopPx() {
  if (typeof getSafeAreaTopPx._cached === 'number') return getSafeAreaTopPx._cached;
  var probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top, 0px);visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);
  var px = probe.getBoundingClientRect().height || 0;
  document.body.removeChild(probe);
  getSafeAreaTopPx._cached = px;
  return px;
}

var _kanaObserver = null;
function setupKanaJumpObserver() {
  if (!('IntersectionObserver' in window)) return;
  if (_kanaObserver) _kanaObserver.disconnect();

  var sections = Array.prototype.slice.call(document.querySelectorAll('.kana-section'));
  if (!sections.length) return;

  // sticky stack実測: ヘッダー60px + safe-area-inset-top + 検索ボックス64px + ジャンプナビ約60px
  var stackHeight = Math.round(60 + getSafeAreaTopPx() + 64 + 60);

  _kanaObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var key = entry.target.id.replace('kana-sec-', '');
      document.querySelectorAll('.kana-chip').forEach(function(chip) {
        chip.classList.toggle('active', chip.getAttribute('data-kana-key') === key);
      });
    });
  }, { root: null, rootMargin: '-' + stackHeight + 'px 0px -70% 0px', threshold: 0 });

  sections.forEach(function(sec) { _kanaObserver.observe(sec); });
}

/* ── 検索0件クエリをGA4へ記録（GTM経由）──
   打鍵途中のノイズを避けるため1.2秒静止後に送信。同一クエリはセッション中1回のみ */
var _noResultTimer = null;
var _noResultSent  = {};
function trackNoResult(q) {
  if (_noResultTimer) clearTimeout(_noResultTimer);
  _noResultTimer = setTimeout(function () {
    var input   = document.getElementById('search-input');
    var current = input ? input.value.trim() : '';
    if (current !== q || q.length < 2 || _noResultSent[q]) return;
    _noResultSent[q] = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'search_no_result',
      search_term: q,
      municipality: (DATA && DATA.municipality_id) || 'unknown'
    });
  }, 1200);
}

/**
 * カタカナ→ひらがな正規化（検索でカナ・かなの表記ゆれを吸収するため）
 * カタカナ(U+30A1-U+30F6)はひらがな(U+3041-U+3096)からの固定オフセット(+0x60)なので、
 * カタカナだけをひらがなへ変換すれば、入力側がどちらの表記でも同じ形に揃えられる。
 * @param {string} str
 * @returns {string}
 */
function toHiragana(str) {
  return (str || '').replace(/[ァ-ヶ]/g, function(ch) {
    return String.fromCharCode(ch.charCodeAt(0) - 0x60);
  });
}

function onSearch(query) {
  if (!DATA) return;
  var q       = (query || '').trim();
  var bodyEl  = document.getElementById('search-body');
  var quickEl = document.getElementById('search-quick');

  if (!q) {
    // 空：クイックタグ表示 ＋ あいうえお一覧
    if (quickEl) quickEl.style.display = '';
    bodyEl.innerHTML = renderSearchIndex();
    return;
  }

  // 入力中：クイックタグ・ラベルを折りたたんで結果を表示
  if (quickEl) quickEl.style.display = 'none';
  var labelEl = document.getElementById('search-index-label');
  if (labelEl) labelEl.classList.add('is-hidden');

  var lower  = q.toLowerCase();
  var qHira  = toHiragana(q);
  var hits  = DATA.garbage_db.filter(function(item) {
    return item.name.includes(q) || toHiragana(item.name).includes(qHira) ||
      (item.tags || []).some(function(t){
        return t.includes(q) || t.toLowerCase().includes(lower) || toHiragana(t).includes(qHira);
      }) ||
      (DATA.categories[item.category] ? DATA.categories[item.category].label : '').includes(q);
  });

  if (hits.length === 0) {
    trackNoResult(q);
    bodyEl.innerHTML = '<div style="text-align:center;padding:40px 16px"><span style="font-size:36px;display:block;margin-bottom:12px">🤔</span><p style="font-size:14px;font-weight:700;color:#636366">「' + q + '」は見つかりませんでした</p><p style="font-size:12px;color:#6B7280;margin-top:8px">市の公式サイトでご確認ください</p></div>';
    return;
  }

  // 検索結果をグローバルに保持してページング
  window._searchHits = hits;
  window._searchPage = 0;
  renderSearchPage(bodyEl);
}

var SEARCH_PAGE_SIZE = 10;

function renderSearchItemHtml(item) {
  var st      = TYPE_STYLE[item.category] || TYPE_STYLE.unknown;
  var cat     = DATA.categories[item.category] ? DATA.categories[item.category].label : item.category;
  var safeName = item.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return '<button onclick="openItemDetail(\'' + safeName + '\')" style="display:block;padding:14px 16px;border-radius:16px;background:#fff;border:1px solid rgba(0,0,0,0.07);width:100%;text-align:left;font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent">' +
    '<div style="display:flex;align-items:center;gap:8px">' +
    '<p style="font-size:16px;font-weight:700;color:#1C1C1E;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + item.name + '</p>' +
    '<span style="display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap;flex-shrink:0;background:' + st.iconBg + ';color:' + st.fg + ';border:1.5px solid ' + st.fg + '33">' + cat + '</span>' +
    '<span class="ms-nav" style="color:#6B7280;font-size:18px;flex-shrink:0">chevron_right</span></div>' +
    (item.note ? '<p style="font-size:12px;color:#636366;margin-top:5px;line-height:1.5">※ ' + item.note + '</p>' : '') +
    '</button>';
}

function renderSearchPage(bodyEl) {
  var hits  = window._searchHits || [];
  var page  = window._searchPage || 0;
  var shown = (page + 1) * SEARCH_PAGE_SIZE;
  var slice = hits.slice(0, shown);
  var rest  = hits.length - shown;

  var itemsHtml = slice.map(renderSearchItemHtml).join('');
  var moreBtn   = rest > 0
    ? '<button onclick="loadMoreSearch()" style="display:block;width:100%;margin-top:4px;padding:14px;border-radius:16px;background:#fff;border:1.5px solid rgba(0,0,0,0.10);font-size:14px;font-weight:700;color:#636366;cursor:pointer;font-family:inherit">もっと' + Math.min(rest, SEARCH_PAGE_SIZE) + '件見る（残り' + rest + '件）</button>'
    : '';

  if (!bodyEl) bodyEl = document.getElementById('search-body');
  bodyEl.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;padding:12px">' + itemsHtml + moreBtn + '</div>';
}

function loadMoreSearch() {
  window._searchPage = (window._searchPage || 0) + 1;
  var bodyEl = document.getElementById('search-body');
  renderSearchPage(bodyEl);
}

function quickSearch(q) {
  var input = document.getElementById('search-input');
  input.value = q;
  onSearch(q);
  showPanel('search');
  window.scrollTo(0, 0);
  setTimeout(function(){ input.focus(); }, 100);
}

function clearSearch() {
  document.getElementById('search-input').value = '';
  onSearch('');
}

/* =====================================================
   アイテム詳細ボトムシート
===================================================== */
function openItemDetail(name) {
  if (!DATA) return;
  // 名前で完全一致、なければタグで探す
  var item = DATA.garbage_db.find(function(g){ return g.name === name; });
  if (!item) {
    item = DATA.garbage_db.find(function(g){
      return (g.tags || []).indexOf(name) !== -1;
    });
  }
  if (!item) return;

  var st       = TYPE_STYLE[item.category] || TYPE_STYLE.unknown;
  var catLabel = DATA.categories[item.category]
    ? DATA.categories[item.category].label
    : item.category;

  // ── ヘッダー（アイコン＋名前＋種別バッジ）
  document.getElementById('item-detail-header').innerHTML =
    '<div style="display:flex;align-items:center;gap:14px">' +
      '<div style="width:56px;height:56px;border-radius:14px;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:' + (st.keepBg ? st.iconBg : 'transparent') + '">' +
        catIcon(item.category, st.img ? 56 : 30) +
      '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<p style="font-size:18px;font-weight:800;color:#1C1C1E;margin:0 0 7px;line-height:1.2">' + item.name + '</p>' +
        '<span style="display:inline-flex;align-items:center;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;background:' + st.bg + ';color:' + st.fg + '">' +
          catLabel +
        '</span>' +
      '</div>' +
    '</div>';

  // ── ボディ（出し方・タグ・カテゴリ一覧ボタン）
  var html = '';

  if (item.note) {
    html += '<div style="background:#F4F5F7;border-radius:12px;padding:14px 16px;margin-bottom:16px">' +
      '<p style="font-size:11px;font-weight:800;color:#6B7280;margin:0 0 6px;letter-spacing:.06em">出し方・注意点</p>' +
      '<p style="font-size:14px;color:#1C1C1E;line-height:1.7;margin:0">' + item.note + '</p>' +
    '</div>';
  }

  if (item.source === 'estimated') {
    html += '<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:16px;padding:10px 12px;background:#F4F5F7;border-radius:10px;border:1px dashed rgba(0,0,0,0.15)">' +
      '<span class="ms-nav" style="font-size:16px;color:#6B7280;flex-shrink:0;line-height:1.4">info</span>' +
      '<p style="font-size:12px;color:#6B7280;line-height:1.6;margin:0">' + DATA.name + 'の公式資料に記載がないため、一般的な分別ルールをもとにした参考情報です。正式な確認は<a href="javascript:void(0)" onclick="closeItemDetail();openContact()" style="color:var(--brand);text-decoration:underline;font-weight:700">問い合わせ先</a>へ</p>' +
    '</div>';
  }

  html +=
    '<button onclick="closeItemDetail();openCategoryDetail(\'' + item.category + '\')"' +
    ' style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:52px;' +
    'background:' + st.fg + ';color:#fff;border:none;border-radius:14px;' +
    'font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;' +
    'box-shadow:0 4px 14px ' + st.fg + '44">' +
      '「' + catLabel + '」のごみ一覧を見る' +
    '</button>';

  document.getElementById('item-detail-body').innerHTML = html;
  document.getElementById('item-detail-backdrop').classList.remove('is-hidden');
  requestAnimationFrame(function() {
    document.getElementById('item-detail-body').scrollTop = 0;
  });
}

function closeItemDetail() {
  document.getElementById('item-detail-backdrop').classList.add('is-hidden');
}

/* =====================================================
   ガイドパネル
===================================================== */
function renderGuide() {
  if (!DATA) return;
  var cats = DATA.categories;
  var CFG = [
    { key:'moeru',      title:'可燃ごみ'          },
    { key:'moenai',     title:'不燃ごみ・有害ごみ' },
    { key:'recycle',    title:'リサイクル資源'      },
    { key:'shigen-pla', title:'資源プラスチック'    },
    { key:'kiken',      title:'危険ごみ'            },
    { key:'yugai',      title:'有害ごみ'            },
    { key:'sodai',      title:'粗大ごみ'            },
  ];
  var el = document.getElementById('guide-rows');
  if (!el) return;
  el.innerHTML = CFG.map(function(cfg, i) {
    var cat  = cats[cfg.key] || {};
    var st   = TYPE_STYLE[cfg.key] || TYPE_STYLE.unknown;
    var last = i === CFG.length - 1;
    return '<button onclick="openCategoryDetail(\'' + cfg.key + '\')" style="display:block;width:100%;text-align:left;background:transparent;border:none;font-family:inherit;cursor:pointer" class="' + (last ? '' : 'border-b border-black/[0.04]') + ' px-5 py-4 hover:bg-black/[0.02] active:bg-black/[0.04]">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
      '<div style="width:44px;height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:' + (st.keepBg ? st.iconBg : 'transparent') + ';flex-shrink:0">' + catIcon(cfg.key, st.img ? 44 : 24) + '</div>' +
      '<div style="flex:1"><p style="font-size:16px;font-weight:800;color:' + st.fg + '">' + (cat.label || cfg.title) + '</p></div>' +
      '<span class="ms-nav" style="color:#6B7280;font-size:20px">chevron_right</span></div>' +
      (cat.how  ? '<p style="font-size:13px;color:#1C1C1E;line-height:1.6;margin-bottom:4px"><span class="ms-nav" style="font-size:15px;vertical-align:-3px;color:#6B7280">brand_awareness</span> ' + cat.how  + '</p>' : '') +
      (cat.note ? '<p style="font-size:13px;color:#636366;line-height:1.6">※ ' + cat.note + '</p>' : '') +
      '</button>';
  }).join('');
}

/* =====================================================
   問い合わせ先 / 業者 / FAQ / お知らせ
===================================================== */
function renderContact() {
  var el = document.getElementById('contact-sheet-rows');
  if (!el) return;
  var contacts = (DATA && DATA.contact) || [];

  var cardsHtml = contacts.length === 0
    ? '<div style="padding:24px;text-align:center"><p style="font-size:13px;color:#6B7280">問い合わせ先情報が見つかりませんでした。</p></div>'
    : contacts.map(function(c, i) {
    var last = i === contacts.length - 1;
    return '<div style="padding:16px 24px;' + (last ? '' : 'border-bottom:1px solid rgba(0,0,0,0.05)') + '">' +
      (c.note ? '<p style="font-size:11px;color:#6B7280;margin-bottom:4px">' + c.note + '</p>' : '') +
      '<p style="font-size:15px;font-weight:800;color:#1C1C1E;margin-bottom:8px">' + c.name + '</p>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
      '<div>' +
      '<p style="font-size:12px;color:#636366"><span style="color:#6B7280">電話番号</span>　' + c.tel + '</p>' +
      (c.hours ? '<p style="font-size:12px;color:#636366;margin-top:2px"><span style="color:#6B7280">受付時間</span>　' + c.hours + '</p>' : '') +
      '</div>' +
      '<a href="tel:' + c.tel + '" style="flex-shrink:0;display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:999px;background:var(--brand-soft);color:var(--brand);font-size:13px;font-weight:700;text-decoration:none;border:1px solid rgba(26,92,56,0.15)">' +
      '<span class="ms-nav" style="font-size:16px;vertical-align:-2px">call</span>電話する</a>' +
      '</div></div>';
  }).join('');

  // セクション見出し（ごみに関するお問い合わせ）
  var sectionHeadGomi = '<p style="font-size:12px;font-weight:800;color:#6B7280;padding:16px 20px 8px">ごみの分別・収集について（' + DATA.name + '）</p>';

  // サイトについてのお問い合わせ（ユウセナ・運営者マター）
  var sectionHeadSite = '<p style="font-size:12px;font-weight:800;color:#6B7280;padding:20px 20px 8px">サイトの内容・不具合について（運営者）</p>';
  var siteContact = '<div style="background:#fff;border-radius:16px;margin:0 16px;box-shadow:0 2px 14px rgba(0,0,0,0.08);overflow:hidden;padding:16px 20px">' +
    '<p style="font-size:12px;color:#1C1C1E;line-height:1.7;margin-bottom:12px">掲載情報の誤り・古い情報や、画面表示の不具合などはこちらからお知らせください。</p>' +
    '<a href="mailto:contact@gomi-nico.jp" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:var(--brand-soft);color:var(--brand);font-size:13px;font-weight:700;text-decoration:none;border:1px solid rgba(26,92,56,0.15)">' +
    '<span class="ms-nav" style="font-size:16px;vertical-align:-2px">mail</span>メールする</a>' +
    '<p style="font-size:11px;color:#6B7280;margin-top:8px">contact@gomi-nico.jp　※返信にお時間をいただく場合があります</p>' +
    '</div>';

  // 免責・出典（サイト全般についての注記）
  var notice = '<div style="margin:12px 16px 0;background:#FFF8EC;border-radius:12px;border:1px solid rgba(224,120,0,0.15);overflow:hidden">' +

    // ヘッダー
    '<div style="padding:12px 16px 10px;border-bottom:1px solid rgba(224,120,0,0.12)">' +
    '<p style="font-size:13px;font-weight:800;color:#E07800">⚠ 本サイトについてのご注意</p>' +
    '</div>' +

    // 本サイトについて
    '<div style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.05)">' +
    '<p style="font-size:11px;font-weight:700;color:#6B7280;margin-bottom:4px">本サイトについて</p>' +
    '<p style="font-size:12px;color:#1C1C1E;line-height:1.7">本サイト「gomi-nico.jp」は、' + DATA.name + 'が運営する<strong>公式サイトではありません</strong>。市民のための非公式の情報サイトです。</p>' +
    '</div>' +

    // 情報について
    '<div style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.05)">' +
    '<p style="font-size:11px;font-weight:700;color:#6B7280;margin-bottom:4px">情報について</p>' +
    '<p style="font-size:12px;color:#1C1C1E;line-height:1.7">' + DATA.name + 'ホームページの公開情報を参考に作成されています。月1回程度で更新していますが、最新情報は公式サイトをご確認ください。</p>' +
    '<p style="font-size:11px;margin-top:6px"><a href="' + (DATA.official_url || '#') + '" target="_blank" rel="noopener" style="color:var(--brand);text-decoration:underline">出典：' + DATA.name + 'ホームページ（ごみ・リサイクル）</a></p>' +
    '</div>' +

    // 免責事項
    '<div style="padding:12px 16px">' +
    '<p style="font-size:11px;font-weight:700;color:#6B7280;margin-bottom:4px">免責事項</p>' +
    '<p style="font-size:12px;color:#636366;line-height:1.7">当サイトの情報に基づいて行った行為により損害が発生した場合、当サイト運営者は責任を負いかねます。</p>' +
    '</div>' +

    '</div>';

  el.innerHTML = sectionHeadGomi +
    '<div style="background:#fff;border-radius:16px;margin:0 16px 8px;box-shadow:0 2px 14px rgba(0,0,0,0.08);overflow:hidden">' + cardsHtml + '</div>' +
    sectionHeadSite + siteContact +
    notice;
}

function renderAffiliate() {
  var el = document.getElementById('vendor-grid');
  if (!el || !(DATA && DATA.affiliate_items)) return;
  el.innerHTML = DATA.affiliate_items.map(function(item) {
    return '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer" class="flex flex-col items-center gap-2 p-4 px-3 bg-black/[0.025] rounded-[20px] no-underline text-[#1C1C1E] active:scale-[0.97] transition-transform">' +
      '<span class="text-[28px]">' + item.icon + '</span>' +
      '<span class="text-xs font-extrabold text-center">' + item.name + '</span>' +
      '<span class="text-[10px] text-[#6B7280]">' + (item.sub || '楽天で探す →') + '</span></a>';
  }).join('');
}

function renderFAQ() {
  var el = document.getElementById('faq-content');
  if (!el) return;
  var items = (DATA && DATA.faq) || DEFAULT_FAQ;
  var html = items.map(function(item, i) {
    var bc = i < items.length - 1 ? 'border-b border-black/[0.04]' : '';
    return '<div class="px-6 py-4 ' + bc + '">' +
      '<p class="text-sm font-extrabold mb-[6px]" style="color:var(--brand)">Q. ' + item.q + '</p>' +
      '<p class="text-sm text-[#636366] leading-relaxed">A. ' + item.a + '</p></div>';
  }).join('');
  // 記事への内部リンク（テレビ・パソコン等、収集に出せない品目の詳しい記事）
  html += '<div class="px-6 pt-2 pb-5">' +
    '<a href="/articles/kaden.html" style="display:flex;align-items:center;gap:10px;background:var(--brand-soft);border-radius:12px;padding:12px 14px;text-decoration:none">' +
    '<span class="ms-nav" style="font-size:20px;color:var(--brand);flex-shrink:0">menu_book</span>' +
    '<span style="font-size:13px;font-weight:700;color:var(--brand-strong);flex:1">テレビ・パソコンなど、出せないごみの処分方法</span>' +
    '<span class="ms-nav" style="font-size:18px;color:var(--brand);flex-shrink:0">chevron_right</span>' +
    '</a></div>';
  el.innerHTML = html;
}

function renderNotice() {
  var el = document.getElementById('notice-body');
  if (!el) return;
  var notices = DATA && DATA.notices;
  if (!notices || notices.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px 24px"><span style="font-size:40px;display:block;margin-bottom:12px">📭</span><p style="font-size:16px;font-weight:700;color:#636366">お知らせはありません</p></div>';
    return;
  }
  el.innerHTML = notices.map(function(n, i) {
    var bc = i < notices.length - 1 ? 'border-b border-black/[0.04]' : '';
    var link = n.url
      ? '<a href="' + n.url + '" target="_blank" rel="noopener" ' +
        'style="display:inline-flex;align-items:center;gap:4px;margin-top:12px;' +
        'font-size:13px;font-weight:700;color:var(--brand);text-decoration:none">' +
        '公式サイトで詳細を確認' +
        '<span class="ms-nav" style="font-size:15px">open_in_new</span></a>'
      : '';
    return '<div class="px-6 py-5 ' + bc + '">' +
      '<p class="text-[12px] text-[#6B7280] mb-2">' + (n.date || '') + '</p>' +
      '<p class="text-[16px] font-extrabold text-[#1C1C1E] mb-2 leading-snug">' + n.title + '</p>' +
      '<p class="text-[16px] text-[#636366] leading-[1.5]">' + n.body + '</p>' +
      link + '</div>';
  }).join('');
}

/* =====================================================
   言語設定（Google 翻訳）
===================================================== */
function openLanguageSheet() {
  closeMenu();
  var el = document.getElementById('language-sheet');
  if (!el) return;
  var current = getCurrentLangCode();
  var list = document.getElementById('language-list');
  if (list) {
    list.innerHTML = LANGUAGES.map(function(lang) {
      var active = lang.code === current;
      // data-lang 属性経由で呼び出し → コード内の特殊文字の影響を回避
      return '<button data-lang="' + lang.code + '" ' +
        'style="display:flex;align-items:center;gap:16px;width:100%;text-align:left;' +
        'padding:16px 24px;border:none;border-bottom:1px solid rgba(0,0,0,0.04);' +
        'background:' + (active ? 'var(--brand-soft)' : 'transparent') + ';font-family:inherit;cursor:pointer">' +
        '<span style="font-size:24px">' + lang.flag + '</span>' +
        '<span style="flex:1;font-size:16px;font-weight:' + (active ? 800 : 500) + ';' +
        'color:' + (active ? 'var(--brand)' : '#1C1C1E') + '">' + lang.label + '</span>' +
        (active ? '<span style="font-size:18px;color:var(--brand);font-weight:800">✓</span>' : '<span class="ms-nav" style="font-size:20px;color:#6B7280">chevron_right</span>') +
        '</button>';
    }).join('');
    // イベント委任でクリックを処理
    list.onclick = function(e) {
      var btn = e.target.closest('[data-lang]');
      if (btn) changeLanguage(btn.dataset.lang);
    };
  }
  el.classList.remove('is-hidden');
  document.body.style.overflow = 'hidden';
}

function closeLanguageSheet() {
  var el = document.getElementById('language-sheet');
  if (el) el.classList.add('is-hidden');
  document.body.style.overflow = '';
}

function getCurrentLangCode() {
  var match = document.cookie.match(/googtrans=\/ja\/([^;]+)/);
  if (match) return match[1];
  return localStorage.getItem('gc_lang') || 'ja';
}

function changeLanguage(code) {
  if (code === 'ja') {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + location.hostname + ';';
    localStorage.setItem('gc_lang', 'ja');
    closeLanguageSheet();
    location.reload();
    return;
  }
  function trySwitch() {
    var select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
      localStorage.setItem('gc_lang', code);
      closeLanguageSheet();
      updateLangIndicator(code);
    } else {
      setTimeout(trySwitch, 500);
    }
  }
  trySwitch();
}

function updateLangIndicator(code) {
  var el = document.getElementById('lang-indicator');
  if (!el) return;
  if (!code || code === 'ja') {
    el.classList.add('is-hidden');
  } else {
    var lang = LANGUAGES.find(function(l){ return l.code === code; });
    el.textContent = lang ? lang.flag : '🌐';
    el.classList.remove('is-hidden');
  }
}


/* =====================================================
   features: メニュー表示切替
===================================================== */
function applyFeatures() {
  var f = (DATA && DATA.features) || {};
  var items = {
    'menu-faq':      f.faq      !== false,
    'menu-vendor':   f.vendor   !== false,
    'menu-contact':  f.contact  !== false,
    'menu-language': f.language !== false,
  };
  Object.keys(items).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('is-hidden', !items[id]);
  });

}

/* =====================================================
   ルールパネル（お知らせ + 共通ルール）
===================================================== */
function renderRules() {
  var el = document.getElementById('rules-body');
  if (!el) return;
  var notices   = (DATA && DATA.notices) || [];
  var rules     = (DATA && DATA.rules)   || {};
  var ruleItems = rules.items || [];
  var features  = (DATA && DATA.features) || {};
  var html = '';

  // ── ホーム画面追加カード（インストール済み・却下済みの場合は非表示）
  var isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  if (!isStandalone && !localStorage.getItem('a2hs_dismissed')) {
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var installBtnHtml = window._deferredPrompt
      ? '<button onclick="installA2hs()" style="margin-top:12px;padding:9px 18px;background:var(--brand);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">ホーム画面に追加する</button>'
      : isIOS
        ? '<p style="font-size:12px;color:#636366;margin-top:10px;line-height:1.7">画面下の <strong>共有ボタン（↑）</strong> をタップし、「<strong>ホーム画面に追加</strong>」を選んでください</p>'
        : '<p style="font-size:12px;color:#6B7280;margin-top:10px">お使いのブラウザで対応していません</p>';
    html += '<div style="background:#fff;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.08);padding:18px 20px;margin-bottom:16px;display:flex;gap:14px;align-items:flex-start">' +
      '<img src="/icons/icon-192.png" style="width:44px;height:44px;border-radius:10px;flex-shrink:0" alt="">' +
      '<div style="flex:1;min-width:0">' +
        '<p style="font-size:15px;font-weight:800;color:#1C1C1E;margin-bottom:4px">ホーム画面に追加</p>' +
        '<p style="font-size:13px;color:#636366;line-height:1.5">アプリのようにすぐ起動できます</p>' +
        installBtnHtml +
      '</div>' +
      '<button onclick="dismissA2hs();renderRules()" style="background:none;border:none;color:#6B7280;font-size:18px;cursor:pointer;padding:0;line-height:1;flex-shrink:0">×</button>' +
    '</div>';
  }

  // ── お知らせセクション（features.notice が true の場合のみ）
  if (features.notice !== false && notices.length > 0) {
    html += '<div style="background:#fff;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.08);overflow:hidden;margin-bottom:16px">' +
      '<h2 style="font-size:18px;font-weight:800;color:#1C1C1E;padding:20px 24px 16px;border-bottom:1px solid rgba(0,0,0,0.04);margin:0">お知らせ</h2>';
    notices.forEach(function(n) {
      var link = n.url
        ? '<a href="' + n.url + '" target="_blank" rel="noopener" ' +
          'style="display:inline-flex;align-items:center;gap:4px;margin-top:12px;' +
          'font-size:13px;font-weight:700;color:var(--brand);text-decoration:none">' +
          '公式サイトで詳細を確認' +
          '<span class="ms-nav" style="font-size:15px">open_in_new</span></a>'
        : '';
      html += '<div style="padding:18px 24px;border-bottom:1px solid rgba(0,0,0,0.04)">' +
        '<p style="font-size:12px;color:#6B7280;margin-bottom:6px">' + n.date + '</p>' +
        '<p style="font-size:16px;font-weight:800;color:#1C1C1E;margin-bottom:8px;line-height:1.35">' + n.title + '</p>' +
        '<p style="font-size:16px;color:#636366;line-height:1.5">' + n.body + '</p>' +
        link +
        '</div>';
    });
    html += '</div>';
  }

  // ── ごみ出しルールセクション
  if (ruleItems.length > 0) {
    html += '<div style="background:#fff;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.08);overflow:hidden">' +
      '<h2 style="font-size:18px;font-weight:800;color:#1C1C1E;padding:20px 24px 16px;border-bottom:1px solid rgba(0,0,0,0.04);margin:0">ごみ出しルール</h2>';
    ruleItems.forEach(function(item, i) {
      var last = i === ruleItems.length - 1;
      html += '<div style="display:flex;gap:14px;padding:14px 24px;' + (last ? '' : 'border-bottom:1px solid rgba(0,0,0,0.04)') + '">' +
        '<span class="ms-nav" style="font-size:22px;color:var(--brand);flex-shrink:0;margin-top:1px">' + item.icon + '</span>' +
        '<div><p style="font-size:16px;font-weight:700;color:#1C1C1E;margin-bottom:6px">' + item.title + '</p>' +
        '<p style="font-size:16px;color:#636366;line-height:1.5">' + item.body + '</p></div>' +
        '</div>';
    });
    html += '</div>';
  }

  el.innerHTML = html || '<p style="text-align:center;color:#6B7280;padding:40px 20px;font-size:14px">情報はありません</p>';
}


/* =====================================================
   カテゴリ別おすすめグッズ（楽天アフィリエイト）
===================================================== */
var CAT_PRODUCTS = {
  moeru:       [{ name:'半透明ごみ袋（45L）', kw:'ごみ袋 半透明 45L' },
                { name:'防臭ごみ袋',          kw:'防臭袋 ごみ 生ごみ' },
                { name:'生ごみポット',         kw:'生ごみ ポット 蓋つき' }],
  moenai:      [{ name:'不燃ごみ袋',         kw:'不燃ごみ袋 半透明' },
                { name:'分別ごみ箱',          kw:'分別 ごみ箱 スリム' }],
  recycle:     [{ name:'3分別ごみ箱',        kw:'分別 ごみ箱 3分別' },
                { name:'缶クラッシャー',       kw:'缶クラッシャー 家庭用' },
                { name:'ペットボトルつぶし',   kw:'ペットボトル クラッシャー' }],
  'shigen-pla':[{ name:'プラ分別ボックス',   kw:'プラスチック ごみ箱 分別' },
                { name:'洗いやすいごみ箱',    kw:'ごみ箱 洗いやすい キッチン' }],
  can:         [{ name:'缶クラッシャー',       kw:'缶クラッシャー 家庭用' },
                { name:'缶専用ごみ箱',         kw:'缶 ごみ箱 分別' }],
  pet:         [{ name:'ペットボトルつぶし',   kw:'ペットボトル クラッシャー' },
                { name:'ペット専用ごみ箱',     kw:'ペットボトル ごみ箱 分別' }],
  bin:         [{ name:'瓶専用ごみ箱',        kw:'瓶 ごみ箱 分別' },
                { name:'分別ごみ箱',           kw:'分別 ごみ箱 スリム' }],
  can_pet_bin: [{ name:'3分別ごみ箱',         kw:'分別 ごみ箱 3分別' },
                { name:'缶クラッシャー',        kw:'缶クラッシャー 家庭用' },
                { name:'ペットボトルつぶし',    kw:'ペットボトル クラッシャー' }],
  can_pet:     [{ name:'缶クラッシャー',        kw:'缶クラッシャー 家庭用' },
                { name:'ペットボトルつぶし',    kw:'ペットボトル クラッシャー' }],
  sodai:       [{ name:'大型ごみ袋',           kw:'粗大ごみ袋 大型 透明' },
                { name:'養生テープ',            kw:'養生テープ 梱包 搬出' }],
  kami:        [{ name:'古紙ストッカー',        kw:'古紙 ストッカー 縛らない' },
                { name:'紙ひも',                kw:'紙ひも ごみ 縛る' }],
  cardboard:   [{ name:'段ボールストッカー',   kw:'段ボール ストッカー 収納' },
                { name:'段ボールカッター',       kw:'段ボール カッター 開梱' },
                { name:'紙ひも',                 kw:'紙ひも ごみ 縛る' }],
  kami_pack:   [{ name:'古紙ストッカー',        kw:'古紙 ストッカー 縛らない' },
                { name:'分別ごみ箱',             kw:'分別 ごみ箱 スリム' }],
  kiken:       [{ name:'廃電池収納ボックス',   kw:'廃電池 収納 ボックス' },
                { name:'絶縁テープ',             kw:'絶縁テープ 電気 安全' }],
  yugai:       [{ name:'蛍光灯収納ケース',     kw:'蛍光灯 収納 ケース 廃棄' }],
  fuku:        [{ name:'衣類圧縮袋',            kw:'衣類 圧縮袋 収納' },
                { name:'古着まとめ袋',           kw:'古着 回収 袋 まとめ' }],
  kitchen:     [{ name:'生ごみ処理機',          kw:'生ごみ処理機 家庭用' },
                { name:'三角コーナー',           kw:'三角コーナー キッチン' },
                { name:'防臭ごみ袋',             kw:'防臭袋 ごみ 生ごみ' }],
  tree:        [{ name:'剪定バサミ',            kw:'剪定バサミ 庭 手入れ' },
                { name:'落ち葉収集バッグ',       kw:'落ち葉 収集 バッグ 庭' }],
  spraycan:    [{ name:'ガス抜きキャップ',     kw:'スプレー缶 ガス抜き キャップ' }],
};

function renderProducts(typeKey, iconBg, fg) {
  // アフィリエイトは当面停止中のため非表示（data_{city}.jsonのad_typeで一括制御。復活時はこの分岐を外す）
  if (!DATA || DATA.ad_type === 'none') return '';
  var products = CAT_PRODUCTS[typeKey];
  if (!products || products.length === 0) return '';
  var cards = products.map(function(p) {
    var url = 'https://search.rakuten.co.jp/search/mall/' + encodeURIComponent(p.kw) + '/';
    return '<a href="' + url + '" target="_blank" rel="noopener sponsored"' +
      ' style="flex-shrink:0;width:114px;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,0.08);border-radius:10px;' +
      'overflow:hidden;text-decoration:none;display:flex;flex-direction:column">' +
      '<div style="height:68px;background:' + iconBg + ';display:flex;align-items:center;justify-content:center">' +
      '<span class="ms-nav" style="font-size:30px;color:' + fg + '">shopping_bag</span></div>' +
      '<div style="padding:8px 8px 10px">' +
      '<p style="font-size:11px;font-weight:700;color:#1C1C1E;line-height:1.4;margin-bottom:6px">' + p.name + '</p>' +
      '<span style="font-size:10px;color:#BF0000;font-weight:700">楽天で見る ›</span>' +
      '</div></a>';
  }).join('');
  return '<div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(0,0,0,0.07)">' +
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">' +
    '<span class="ms-nav" style="font-size:15px;color:#6B7280">shopping_bag</span>' +
    '<p style="font-size:13px;font-weight:800;color:#636366">関連グッズ</p></div>' +
    '<div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;' +
    '-webkit-overflow-scrolling:touch;scrollbar-width:none">' +
    cards + '</div>' +
    '<p style="font-size:10px;color:#6B7280;margin-top:8px">※広告・アフィリエイトリンクを含みます</p>' +
    '</div>';
}

/* =====================================================
   カテゴリ詳細シート
===================================================== */
function openCategoryDetail(typeKey, year, month, day) {
  var cats = (DATA && DATA.categories) || {};
  var cat  = cats[typeKey] || {};
  var st   = TYPE_STYLE[typeKey] || TYPE_STYLE.unknown;
  var dateLabel = (year !== undefined) ? formatDateJP(new Date(year, month, day)) : '';

  // ヘッダー
  var headerEl = document.getElementById('category-detail-header');
  if (headerEl) {
    headerEl.innerHTML =
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding-bottom:4px">' +
        '<div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0">' +
          '<div style="width:52px;height:52px;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:' + (st.keepBg ? st.iconBg : 'transparent') + ';flex-shrink:0">' +
          catIcon(typeKey, st.img ? 52 : 28) + '</div>' +
          '<div style="min-width:0">' +
          (dateLabel ? '<p style="font-size:12px;font-weight:800;color:#6B7280;margin-bottom:1px">' + dateLabel + '</p>' : '') +
          '<h2 style="font-size:20px;font-weight:800;color:' + st.fg + '">' + (cat.label || typeKey) + '</h2>' +
          '</div>' +
        '</div>' +
        '<button onclick="closeCategoryDetail()" aria-label="閉じる" ' +
          'style="width:40px;height:40px;border-radius:50%;border:none;background:rgba(0,0,0,0.07);' +
          'display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-family:inherit">' +
          '<span class="ms-nav" style="font-size:22px;color:#636366">close</span>' +
        '</button>' +
      '</div>';
  }

  // ボディ
  var bodyEl = document.getElementById('category-detail-body');
  if (!bodyEl) return;
  var html = '';

  function section(icon, title, items, color) {
    if (!items || items.length === 0) return '';
    return '<div style="margin-bottom:20px">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
      '<span class="ms-nav" style="font-size:20px;color:' + color + '">' + icon + '</span>' +
      '<p style="font-size:18px;font-weight:800;color:#1C1C1E">' + title + '</p></div>' +
      '<div style="background:#FFFFFF;border-radius:12px;overflow:hidden">' +
      items.map(function(item, i) {
        var last = i === items.length - 1;
        return '<div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;' +
          (last ? '' : 'border-bottom:1px solid rgba(0,0,0,0.05)') + '">' +
          '<span class="ms-nav" style="font-size:16px;color:' + color + ';flex-shrink:0;line-height:1.5">check</span>' +
          '<p style="font-size:16px;color:#1C1C1E;line-height:1.5">' + item + '</p></div>';
      }).join('') +
      '</div></div>';
  }

  html += section('check_circle', '出せるもの',    cat.allowed,                               '#00A86B');
  html += section('close',        '出せないもの',   cat.not_allowed,                           '#E8512A');
  html += section('info',         '出し方・注意点', (cat.how_steps||[]).concat(cat.tips||[]), '#E07800');

  // 関連記事への導線（cat.article_urlが設定されている場合のみ表示。記事公開までは非表示のまま）
  if (cat.article_url) {
    html += '<a href="' + cat.article_url + '" style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:14px;background:var(--brand-soft);border-radius:12px;' +
      'font-size:14px;font-weight:700;color:var(--brand-strong);text-decoration:none;margin-top:4px;margin-bottom:4px">' +
      '<span class="ms-nav" style="font-size:18px">menu_book</span>' +
      (cat.article_label || (cat.label || typeKey) + 'について詳しく読む') +
      '<span class="ms-nav" style="font-size:16px">arrow_forward</span>' +
    '</a>';
  }

  // 関連する検索へのショートカット
  html += '<button onclick="closeCategoryDetail();showPanel(\'search\');quickSearch(this.getAttribute(\'data-q\'))" data-q="' + (cat.label || '') + '"' +
    ' style="width:100%;padding:14px;background:#fff;border:1.5px solid rgba(0,0,0,0.10);border-radius:12px;' +
    'font-size:14px;font-weight:700;color:#1C1C1E;cursor:pointer;font-family:inherit;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:6px">' +
    '<span class="ms-nav" style="font-size:18px;color:#636366">search</span>' +
    '「' + (cat.label || typeKey) + '」でごみを検索</button>';

  // 関連グッズ（アフィリエイト）
  html += renderProducts(typeKey, st.iconBg, st.fg);

  bodyEl.innerHTML = html;
  document.getElementById('category-detail-backdrop').classList.remove('is-hidden');
  requestAnimationFrame(function() { bodyEl.scrollTop = 0; });
  document.body.style.overflow = 'hidden';
}

function closeCategoryDetail() {
  var el = document.getElementById('category-detail-backdrop');
  if (el) el.classList.add('is-hidden');
  document.body.style.overflow = '';
}

/* =====================================================
   パネル切替
===================================================== */
var ALL_PANELS = ['calendar','today','search','guide','notice','faq','vendor','contact','language','affiliate','tokutoku'];

function showPanel(p) {
  ALL_PANELS.forEach(function(id) {
    var panel = document.getElementById('panel-' + id);
    if (panel) panel.classList.toggle('is-hidden', id !== p);
    var nav = document.getElementById('nav-' + id);
    if (nav) {
      nav.classList.toggle('active', id === p);
      nav.setAttribute('aria-current', id === p ? 'page' : 'false');
    }
  });
  window.scrollTo(0, 0);
  if (p === 'search') {
    var input = document.getElementById('search-input');
    if (input && !input.value.trim()) {
      var qEl = document.getElementById('search-quick');
      if (qEl) qEl.style.display = '';
      var bodyEl = document.getElementById('search-body');
      if (bodyEl) bodyEl.innerHTML = renderSearchIndex();
    }
  }
}
