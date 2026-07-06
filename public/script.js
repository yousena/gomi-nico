/**
 * ゴミ分別プラットフォーム — script.js
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
  moeru:       { icon:'local_fire_department', bg:'var(--c-moeru-bg)',   iconBg:'rgba(232,81,42,0.14)',   fg:'var(--c-moeru)',   dotColor:'var(--c-moeru)'   },
  moenai:      { icon:'delete_sweep',          bg:'var(--c-moenai-bg)',  iconBg:'rgba(75,114,212,0.14)',  fg:'var(--c-moenai)',  dotColor:'var(--c-moenai)'  },
  recycle:     { icon:'recycling',             bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  'shigen-pla':{ icon:'water_bottle',          bg:'var(--c-pla-bg)',     iconBg:'rgba(120,190,0,0.14)',   fg:'var(--c-pla)',     dotColor:'var(--c-pla)'     },
  kiken:       { icon:'warning',               bg:'var(--c-kiken-bg)',   iconBg:'rgba(224,120,0,0.14)',   fg:'var(--c-kiken)',   dotColor:'var(--c-kiken)'   },
  yugai:       { icon:'science',               bg:'var(--c-yugai-bg)',   iconBg:'rgba(145,96,204,0.14)',  fg:'var(--c-yugai)',   dotColor:'var(--c-yugai)'   },
  sodai:       { icon:'weekend',               bg:'var(--c-sodai-bg)',   iconBg:'rgba(104,120,160,0.14)', fg:'var(--c-sodai)',   dotColor:'var(--c-sodai)'   },
  // ── 拡張（マルチ自治体対応）
  fuku:        { icon:'checkroom',             bg:'var(--c-fuku-bg)',    iconBg:'rgba(91,132,196,0.14)',  fg:'var(--c-fuku)',    dotColor:'var(--c-fuku)'    },
  kami:        { icon:'newspaper',             bg:'var(--c-kami-bg)',    iconBg:'rgba(180,130,40,0.14)',  fg:'var(--c-kami)',    dotColor:'var(--c-kami)'    },
  cardboard:   { icon:'inventory_2',           bg:'var(--c-cardboard-bg)',iconBg:'rgba(156,108,48,0.14)',fg:'var(--c-cardboard)',dotColor:'var(--c-cardboard)'},
  kami_pack:   { icon:'coffee',                bg:'var(--c-kami_pack-bg)',iconBg:'rgba(100,160,200,0.14)',fg:'var(--c-kami_pack)',dotColor:'var(--c-kami_pack)'},
  can:         { icon:'sports_bar',            bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  pet:         { icon:'water_bottle',          bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  bin:         { icon:'wine_bar',              bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  can_pet_bin: { icon:'recycling',             bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  can_pet:     { icon:'recycling',             bg:'var(--c-recycle-bg)', iconBg:'rgba(24,168,122,0.14)',  fg:'var(--c-recycle)', dotColor:'var(--c-recycle)' },
  spraycan:    { icon:'propane',               bg:'var(--c-kiken-bg)',   iconBg:'rgba(224,120,0,0.14)',   fg:'var(--c-kiken)',   dotColor:'var(--c-kiken)'   },
  kitchen:     { icon:'compost',               bg:'var(--c-moeru-bg)',   iconBg:'rgba(232,81,42,0.14)',   fg:'var(--c-moeru)',   dotColor:'var(--c-moeru)'   },
  tree:        { icon:'forest',                bg:'var(--c-tree-bg)',    iconBg:'rgba(90,136,0,0.14)',    fg:'var(--c-tree)',    dotColor:'var(--c-tree)'    },
  unknown:     { icon:'help',                  bg:'var(--c-unknown-bg)', iconBg:'rgba(136,144,160,0.14)', fg:'var(--c-unknown)', dotColor:'var(--c-unknown)'  },
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
  { q:'ゴミ出しの時間は？',        a:'朝8時までに指定の集積所へ出してください。前日夜の持ち出しは不可です。' },
  { q:'指定袋はありますか？',       a:'指定袋の指定はありません。透明または半透明の袋で出してください。' },
  { q:'収集日が祝日と重なったら？', a:'年末年始（12/31〜1/3）を除き、祝日でも通常通り収集します。' },
  { q:'粗大ごみの出し方は？',       a:'一斗缶（24×24×35cm）を超えるものは粗大ごみです。環境推進課へ事前申込が必要です。' },
  { q:'リチウム電池はどう出す？',   a:'令和8年4月から「危険ごみ」として月1回収集。モバイルバッテリー・スマホ・電動工具等が対象です。' },
];

/* =====================================================
   グローバル状態
===================================================== */
let DATA = null;
let calYear, calMonth;

/* =====================================================
   ENTRY POINT
===================================================== */
(async function init() {
  // 都市検出: metaタグ(/shiki/) → URLパス(/shiki/) → クエリパラメータ(?city=shiki) → デフォルト
  const cityMeta = document.querySelector('meta[name="city"]');
  const pathMatch = location.pathname.match(/^\/([a-z0-9-]+)\//);
  const city = cityMeta?.content
            || (pathMatch ? pathMatch[1] : null)
            || new URLSearchParams(location.search).get('city')
            || 'shiki';
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
      <p class="text-[11px] text-[#AEAEB2] mt-2 leading-relaxed">
        ローカルサーバーが必要です:<br>
        <code class="bg-black/[0.06] px-[6px] py-[2px] rounded">Live Server で開いてください</code>
      </p>
    </div>`;
}

/* =====================================================
   自治体メタ情報
===================================================== */
function applyMunicipalityMeta() {
  const city  = DATA.name;          // 志木市
  const pref  = DATA.prefecture;    // 埼玉県
  const id    = DATA.municipality_id; // shiki
  const pageUrl = `https://gomi-nico.jp/?city=${id}`;
  const pageTitle = `${city} ごみ分別ガイド｜収集日・分別方法を地区別に確認`;
  const pageDesc  = `${pref}${city}のごみ収集日・分別方法を地区別に簡単検索。可燃ごみ・不燃ごみ・資源ごみのカレンダー表示、分別検索、ごみ出しルールをまとめた非公式情報サイトです。`;

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
  setMeta('meta[name="twitter:title"]',       `${city} ごみ分別ガイド`);
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
        'name': 'ごみ分別ガイド',
        'url': 'https://gomi-nico.jp/',
        'description': '自治体別ごみ収集日・分別方法検索サービス',
        'inLanguage': 'ja',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `https://gomi-nico.jp/?city=${id}&q={search_term_string}`,
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

  // ── ブランドカラー ──
  if (DATA.brand_color) {
    document.documentElement.style.setProperty('--brand', DATA.brand_color);
  }

  // ── 自治体ロゴ ──
  const logoEl = document.getElementById('city-logo');
  if (logoEl) {
    if (DATA.cityLogo) {
      logoEl.src = DATA.cityLogo;
      logoEl.alt = city + ' ロゴ';
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
    [topAd, document.getElementById('anchor-ad')].forEach(el => { if (el) el.classList.add('is-hidden'); });
    document.body.style.paddingBottom = 'calc(64px + var(--safe-b))';
    return;
  }
  if (type === 'official') {
    if (anchor) anchor.innerHTML = `<div class="text-[10px] text-[#AEAEB2]">${DATA.name} 公式情報</div>`;
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
    <p class="text-[10px] font-extrabold text-[#AEAEB2] tracking-[0.12em] uppercase pt-4 px-2 pb-2">${g.label}</p>
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
            ${area.note ? `<span class="text-xs text-[#AEAEB2] block mt-[1px] font-normal">${area.note}</span>` : ''}
          </span>
          <span class="ms-nav area-check-icon" aria-hidden="true">check_circle</span>
        </button>`;
    }).join('')}
  `).join('');
}

function openSheet() {
  closeMenu();
  const saved = localStorage.getItem('gc_area');
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
  localStorage.setItem('gc_area', key);
  updateAreaDisplay();
  renderTodayStrip();
  renderCalendar();
  closeSheet();
}

function restoreArea() {
  const saved = localStorage.getItem('gc_area');
  if (saved && DATA.areas[saved]) updateAreaDisplay();
}

function updateAreaDisplay() {
  const key    = localStorage.getItem('gc_area');
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

function getGarbageForDate(areaKey, date) {
  if (!areaKey || !DATA?.areas[areaKey]) return [];
  const area  = DATA.areas[areaKey];
  const day   = date.getDay();
  const year  = date.getFullYear();
  const month = date.getMonth();
  if (isYearEnd(date)) return [];

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
  return result;
}

function formatDateJP(date) {
  return `${date.getMonth()+1}月${date.getDate()}日（${WD_JP[date.getDay()]}）`;
}

/* =====================================================
   【独自提案①】今日の収集バナー
   カレンダー上部に今日の収集種別をひと目で表示
===================================================== */
function renderTodayStrip() {
  const stripEl = document.getElementById('today-strip');
  if (!stripEl) return;

  const today   = new Date();
  const areaKey = localStorage.getItem('gc_area');

  document.getElementById('today-strip-date').textContent = formatDateJP(today);

  const typesEl = document.getElementById('today-strip-types');
  if (!areaKey) {
    typesEl.innerHTML = `<span class="text-sm text-[#AEAEB2]">地区を選択してください</span>`;
    return;
  }

  const types = getGarbageForDate(areaKey, today);
  if (types.length === 0) {
    // 収集なし → 次の収集日を探す（最大14日先まで）
    let nextDate = null, nextTypes = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const t = getGarbageForDate(areaKey, d);
      if (t.length > 0) { nextDate = d; nextTypes = t; break; }
    }
    if (nextDate) {
      const diff = Math.round((nextDate - today) / 86400000);
      const diffLabel = diff === 1 ? '明日' : `${diff}日後`;
      typesEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:2px">
          <span class="text-sm font-bold text-[#636366] inline-flex items-center gap-1"><span class="ms-nav" style="font-size:18px;color:#00A86B;vertical-align:-3px">check_circle</span>今日は収集なし</span>
          <span class="text-[12px] text-[#AEAEB2]">次の収集: ${diffLabel}（${nextTypes.map(t => t.label).join('・')}）</span>
        </div>`;
    } else {
      typesEl.innerHTML = `<span class="text-sm font-bold text-[#636366] inline-flex items-center gap-1"><span class="ms-nav" style="font-size:18px;color:#00A86B;vertical-align:-3px">check_circle</span>今日は収集なし</span>`;
    }
    return;
  }

  typesEl.innerHTML = types.map(t => {
    const s = TYPE_STYLE[t.type] || TYPE_STYLE.unknown;
    return '<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 13px;border-radius:999px;font-size:14px;font-weight:700;background:' + s.bg + ';color:' + s.fg + '">' +
      catIcon(t.type, 17) + ' ' + t.label + '</span>';
  }).join('');
}

/* =====================================================
   【独自提案②】日付タップ → 収集詳細ポップアップ
   さんあーる と同様の核心機能
===================================================== */
function showDayDetail(year, month, day) {
  const date    = new Date(year, month, day);
  const areaKey = localStorage.getItem('gc_area');

  document.getElementById('day-detail-date').textContent = formatDateJP(date);
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
              class="mt-4 inline-flex items-center gap-1 bg-[#00A86B] text-white
                     border-none rounded-full px-5 h-11 font-sans text-sm font-bold cursor-pointer"
              type="button">地区を選択する</button>
    </div>`;
  }
  if (isYearEnd(date)) {
    return `<div class="text-center py-10 px-6">
      <span class="text-[48px] block mb-3">🎍</span>
      <p class="text-base font-bold text-[#636366]">年末年始休止</p>
      <p class="text-xs text-[#AEAEB2] mt-1">${DATA.collection_settings.yearend_ranges
        .map(r => `${r.month === 11 ? 12 : 1}/${r.days.join('・')}`).join('〜')}は収集お休みです</p>
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
      ? ' onclick="closeDayDetail();openCategoryDetail(\'' + t.type + '\')" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:16px;background:' + s.bg + ';width:100%;text-align:left;border:none;font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent"'
      : ' style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:16px;background:' + s.bg + '"';
    return '<' + tag + btnAttrs + '>' +
      '<div style="width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:' + s.iconBg + ';flex-shrink:0">' +
      catIcon(t.type, 26) + '</div>' +
      '<div style="flex:1">' +
      '<p style="font-size:18px;font-weight:800;color:' + s.fg + ';line-height:1.2">' + t.label + '</p>' +
      (t.how ? '<p style="font-size:12px;margin-top:4px;line-height:1.5;color:#636366">' + t.how + '</p>' : '') +
      '</div>' +
      (hasDetail ? '<span class="ms-nav" style="color:' + s.fg + ';opacity:0.5;font-size:20px;flex-shrink:0">chevron_right</span>' : '') +
      '</' + tag + '>';
  }).join('');

  const cutoff = DATA.collection_settings?.cutoff_note || '';
  return `
    <div class="flex flex-col gap-2">${items}</div>
    ${cutoff ? `<p class="text-sm font-bold text-[#636366] flex items-center justify-center gap-[6px] mt-4 pt-4 border-t border-black/[0.04]"><span class="ms-nav" style="font-size:18px;color:#00A86B">alarm</span>${cutoff}</p>` : ''}`;
}

/* =====================================================
   カレンダー
===================================================== */
function prevMonth() { calMonth--; if (calMonth < 0)  { calMonth=11; calYear--;  } renderCalendar(); }
function nextMonth() { calMonth++; if (calMonth > 11) { calMonth=0;  calYear++;  } renderCalendar(); }

function renderCalendar() {
  if (!DATA) return;
  document.getElementById('cal-month-label').textContent = `${calYear}年${calMonth+1}月`;
  const areaKey = localStorage.getItem('gc_area');
  const grid    = document.getElementById('cal-grid');
  const noArea  = document.getElementById('cal-no-area');

  if (!areaKey) {
    grid.innerHTML = '';
    grid.classList.add('is-hidden');
    noArea.classList.remove('is-hidden');
    return;
  }
  noArea.classList.add('is-hidden');
  grid.classList.remove('is-hidden');

  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today       = new Date();
  let html = '';

  for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell" aria-hidden="true"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const date    = new Date(calYear, calMonth, d);
    const types   = getGarbageForDate(areaKey, date);
    const isToday = date.toDateString() === today.toDateString();
    const isYE    = isYearEnd(date);
    const dow     = date.getDay();

    // アイコン（件数に応じてサイズ・レイアウト変更）
    let iconsHtml = '';
    if (types.length === 1) {
      iconsHtml = '<div style="display:flex;align-items:center;justify-content:center;width:100%;flex:1" aria-hidden="true">'
        + catIcon(types[0].type, 26) + '</div>';
    } else if (types.length === 2) {
      iconsHtml = '<div style="display:flex;align-items:center;justify-content:center;gap:1px;width:100%;flex:1" aria-hidden="true">'
        + types.map(t => catIcon(t.type, 22)).join('') + '</div>';
    } else if (types.length >= 3) {
      iconsHtml = '<div class="cal-icons" aria-hidden="true">'
        + types.slice(0,4).map(t => '<span class="cal-icon-wrap">' + catIcon(t.type, 22) + '</span>').join('')
        + '</div>';
    }

    const isHol   = isHoliday(new Date(calYear, calMonth, d));
    const dayCls  = (dow === 0 || isHol) ? 'cal-day cal-day-sun' : dow === 6 ? 'cal-day cal-day-sat' : 'cal-day';
    const cellCls = ['cal-cell',
      isToday ? 'is-today' : '',
      isYE    ? 'yearend'  : '',
      (types.length > 0 && !isYE) ? 'has-col' : '',
    ].filter(Boolean).join(' ');

    const labelText = types.map(t => t.label).join('・') || '収集なし';

    html += `
      <button class="${cellCls}" role="gridcell"
              aria-label="${calMonth+1}月${d}日 ${labelText}"
              onclick="showDayDetail(${calYear},${calMonth},${d})"
              type="button">
        <span class="${dayCls}">${d}</span>
        ${iconsHtml}
      </button>`;
  }
  grid.innerHTML = html;
}

/* =====================================================
   検索 — あいうえお順一覧
===================================================== */

/* 五十音行の判定テーブル */
const KANA_ROWS = [
  { label:'あ行', re:/^[あいうえおアイウエオぁぃぅぇぉァィゥェォ]/ },
  { label:'か行', re:/^[かきくけこがぎぐげごカキクケコガギグゲゴ]/ },
  { label:'さ行', re:/^[さしすせそざじずぜぞサシスセソザジズゼゾ]/ },
  { label:'た行', re:/^[たちつてとだぢづでどタチツテトダヂヅデド]/ },
  { label:'な行', re:/^[なにぬねのナニヌネノ]/ },
  { label:'は行', re:/^[はひふへほばびぶべぼぱぴぷぺぽハヒフヘホバビブベボパピプペポ]/ },
  { label:'ま行', re:/^[まみむめもマミムメモ]/ },
  { label:'や行', re:/^[やゆよヤユヨ]/ },
  { label:'ら行', re:/^[らりるれろラリルレロ]/ },
  { label:'わ行', re:/^[わをんワヲン]/ },
];
const ROW_ORDER = [...KANA_ROWS.map(r => r.label), 'その他'];

function getKanaRow(name) {
  for (const r of KANA_ROWS) { if (r.re.test(name)) return r.label; }
  return 'その他';
}


/* =====================================================
   検索 — クイックタグ（カード1内）
===================================================== */
function renderQuickTags() {
  var el = document.getElementById('search-quick');
  if (!el) return;
  el.innerHTML =
    '<p style="font-size:13px;font-weight:800;color:#8890A0;letter-spacing:.06em;margin-bottom:10px;padding-left:4px">よく検索されるごみ</p>' +
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
  sorted.forEach(function(item){ groups.get(getKanaRow(item.name)).push(item); });

  // 枠外ラベルを更新
  var labelEl = document.getElementById('search-index-label');
  if (labelEl) {
    labelEl.textContent = '全' + sorted.length + '件 — 五十音順';
    labelEl.classList.remove('is-hidden');
  }

  var html = '';

  for (var _ref of groups) {
    var rowLabel = _ref[0], items = _ref[1];
    if (items.length === 0) continue;

    // グループごとに独立カード
    html += '<div style="background:#fff;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.08);overflow:hidden">';

    // 行見出し（白背景・ブランドカラーテキスト）
    html += '<div style="padding:0 16px;height:54px;display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:16px;font-weight:800;color:#00A86B">' + rowLabel + '</span>' +
      '<span style="font-size:12px;color:#AEAEB2">' + items.length + '件</span>' +
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
        '<span style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;background:' + st.bg + ';color:' + st.fg + '">' + catIcon(item.category, 14) + ' ' + cat + '</span>' +
        '<span class="ms-nav" style="color:#C7C7CC;font-size:20px;margin-left:2px">chevron_right</span>' +
        '</button>';
    });

    html += '</div>';
  }
  return html;
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

  var lower = q.toLowerCase();
  var hits  = DATA.garbage_db.filter(function(item) {
    return item.name.includes(q) ||
      (item.tags || []).some(function(t){ return t.includes(q) || t.toLowerCase().includes(lower); }) ||
      (DATA.categories[item.category] ? DATA.categories[item.category].label : '').includes(q);
  });

  if (hits.length === 0) {
    bodyEl.innerHTML = '<div style="text-align:center;padding:40px 16px"><span style="font-size:36px;display:block;margin-bottom:12px">🤔</span><p style="font-size:14px;font-weight:700;color:#636366">「' + q + '」は見つかりませんでした</p><p style="font-size:12px;color:#AEAEB2;margin-top:8px">市の公式サイトでご確認ください</p></div>';
    return;
  }

  var itemsHtml = hits.slice(0,15).map(function(item) {
    var st      = TYPE_STYLE[item.category] || TYPE_STYLE.unknown;
    var cat     = DATA.categories[item.category] ? DATA.categories[item.category].label : item.category;
    var safeName = item.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return '<button onclick="openItemDetail(\'' + safeName + '\')" style="display:flex;align-items:flex-start;gap:12px;padding:16px;border-radius:16px;background:' + st.bg + ';width:100%;text-align:left;border:none;font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent">' +
      '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap;flex-shrink:0;margin-top:2px;background:' + st.bg + ';color:' + st.fg + ';border:1.5px solid ' + st.fg + '33">' + catIcon(item.category, 13) + ' ' + cat + '</span>' +
      '<div style="flex:1;min-width:0"><p style="font-size:16px;font-weight:600;color:#1C1C1E">' + item.name + '</p>' +
      (item.note ? '<p style="font-size:12px;color:#636366;margin-top:3px;line-height:1.5"><span class="ms-nav" style="font-size:13px;color:#AEAEB2;vertical-align:-2px">lightbulb</span> ' + item.note + '</p>' : '') +
      '</div><span class="ms-nav" style="color:#C7C7CC;font-size:18px;flex-shrink:0;margin-top:2px">chevron_right</span></button>';
  }).join('');

  var more = hits.length > 15 ? '<p style="text-align:center;font-size:12px;color:#AEAEB2;padding:12px">他 ' + (hits.length-15) + ' 件</p>' : '';
  bodyEl.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;padding:12px">' + itemsHtml + '</div>' + more;
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
      '<div style="width:56px;height:56px;border-radius:14px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:' + st.iconBg + '">' +
        catIcon(item.category, 30) +
      '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<p style="font-size:18px;font-weight:800;color:#1C1C1E;margin:0 0 7px;line-height:1.2">' + item.name + '</p>' +
        '<span style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;background:' + st.bg + ';color:' + st.fg + '">' +
          catIcon(item.category, 14) + ' ' + catLabel +
        '</span>' +
      '</div>' +
    '</div>';

  // ── ボディ（出し方・タグ・カテゴリ一覧ボタン）
  var html = '';

  if (item.note) {
    html += '<div style="background:#F4F5F7;border-radius:12px;padding:14px 16px;margin-bottom:16px">' +
      '<p style="font-size:11px;font-weight:800;color:#8890A0;margin:0 0 6px;letter-spacing:.06em">出し方・注意点</p>' +
      '<p style="font-size:14px;color:#1C1C1E;line-height:1.7;margin:0">' + item.note + '</p>' +
    '</div>';
  }

  html +=
    '<button onclick="closeItemDetail();openCategoryDetail(\'' + item.category + '\')"' +
    ' style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:52px;' +
    'background:' + st.fg + ';color:#fff;border:none;border-radius:14px;' +
    'font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;' +
    'box-shadow:0 4px 14px ' + st.fg + '44">' +
      catIcon(item.category, 18) + '「' + catLabel + '」のごみ一覧を見る' +
    '</button>';

  document.getElementById('item-detail-body').innerHTML = html;
  document.getElementById('item-detail-backdrop').classList.remove('is-hidden');
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
      '<div style="width:44px;height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:' + st.iconBg + ';flex-shrink:0">' + catIcon(cfg.key, 24) + '</div>' +
      '<div style="flex:1"><p style="font-size:16px;font-weight:800;color:' + st.fg + '">' + (cat.label || cfg.title) + '</p></div>' +
      '<span class="ms-nav" style="color:#C7C7CC;font-size:20px">chevron_right</span></div>' +
      (cat.how  ? '<p style="font-size:13px;color:#1C1C1E;line-height:1.6;margin-bottom:4px"><span class="ms-nav" style="font-size:15px;vertical-align:-3px;color:#AEAEB2">brand_awareness</span> ' + cat.how  + '</p>' : '') +
      (cat.note ? '<p style="font-size:13px;color:#636366;line-height:1.6"><span class="ms-nav" style="font-size:16px;vertical-align:-3px;color:#AEAEB2">lightbulb</span> ' + cat.note + '</p>' : '') +
      '</button>';
  }).join('');
}

/* =====================================================
   問い合わせ先 / 業者 / FAQ / お知らせ
===================================================== */
function renderContact() {
  var el = document.getElementById('contact-sheet-rows');
  if (!el) return;
  var contacts = (DATA && DATA.contacts) || [
    { name:'志木市 環境推進課', phone:'048-473-1492', hours:'月〜金 8:45〜16:30' }
  ];

  var cardsHtml = contacts.map(function(c, i) {
    var last = i === contacts.length - 1;
    return '<div style="padding:16px 24px;' + (last ? '' : 'border-bottom:1px solid rgba(0,0,0,0.05)') + '">' +
      (c.desc ? '<p style="font-size:11px;color:#8890A0;margin-bottom:4px">' + c.desc + '</p>' : '') +
      '<p style="font-size:15px;font-weight:800;color:#1C1C1E;margin-bottom:8px">' + c.name + '</p>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
      '<div>' +
      '<p style="font-size:12px;color:#636366"><span style="color:#8890A0">電話番号</span>　' + c.phone + (c.phone_note ? '（' + c.phone_note + '）' : '') + '</p>' +
      (c.hours ? '<p style="font-size:12px;color:#636366;margin-top:2px"><span style="color:#8890A0">受付時間</span>　' + c.hours + '</p>' : '') +
      '</div>' +
      '<a href="tel:' + c.phone + '" style="flex-shrink:0;display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:999px;background:#EBF7F2;color:#00A86B;font-size:13px;font-weight:700;text-decoration:none;border:1px solid rgba(26,92,56,0.15)">' +
      '<span class="ms-nav" style="font-size:16px;vertical-align:-2px">call</span>電話する</a>' +
      '</div></div>';
  }).join('');

  // 免責・運営者情報
  var S = 'style="';
  var notice = '<div style="margin:16px 16px 0;background:#FFF8EC;border-radius:12px;border:1px solid rgba(224,120,0,0.15);overflow:hidden">' +

    // ヘッダー
    '<div style="padding:12px 16px 10px;border-bottom:1px solid rgba(224,120,0,0.12)">' +
    '<p style="font-size:13px;font-weight:800;color:#E07800">⚠ 本サイトについてのご注意</p>' +
    '</div>' +

    // 本サイトについて
    '<div style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.05)">' +
    '<p style="font-size:11px;font-weight:700;color:#8890A0;margin-bottom:4px">本サイトについて</p>' +
    '<p style="font-size:12px;color:#1C1C1E;line-height:1.7">本サイト「gomi-nico.jp」は、志木市が運営する<strong>公式サイトではありません</strong>。市民のための非公式の情報サイトです。</p>' +
    '</div>' +

    // 情報について
    '<div style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.05)">' +
    '<p style="font-size:11px;font-weight:700;color:#8890A0;margin-bottom:4px">情報について</p>' +
    '<p style="font-size:12px;color:#1C1C1E;line-height:1.7">志木市ホームページの公開情報を参考に作成されています。月1回程度で更新していますが、最新情報は公式サイトをご確認ください。</p>' +
    '<p style="font-size:11px;margin-top:6px"><a href="https://www.city.shiki.lg.jp/life/1/12/" target="_blank" rel="noopener" style="color:#00A86B;text-decoration:underline">出典：志木市ホームページ（ごみ・リサイクル）</a></p>' +
    '</div>' +

    // 誤情報・不具合
    '<div style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.05)">' +
    '<p style="font-size:11px;font-weight:700;color:#8890A0;margin-bottom:4px">サイトの誤情報・不具合のご報告</p>' +
    '<p style="font-size:12px;color:#1C1C1E;line-height:1.7;margin-bottom:4px">サイト運営者へお知らせください。</p>' +
    '<a href="mailto:contact@gomi-nico.jp" style="font-size:13px;color:#00A86B;text-decoration:underline">contact@gomi-nico.jp</a>' +
    '<p style="font-size:11px;color:#AEAEB2;margin-top:4px">※返信にお時間をいただく場合があります</p>' +
    '</div>' +

    // 免責事項
    '<div style="padding:12px 16px">' +
    '<p style="font-size:11px;font-weight:700;color:#8890A0;margin-bottom:4px">免責事項</p>' +
    '<p style="font-size:12px;color:#636366;line-height:1.7">当サイトの情報に基づいて行った行為により損害が発生した場合、当サイト運営者は責任を負いかねます。</p>' +
    '</div>' +

    '</div>';

  el.innerHTML = '<div style="background:#fff;border-radius:16px;margin:0 16px 8px;box-shadow:0 2px 14px rgba(0,0,0,0.08);overflow:hidden">' + cardsHtml + '</div>' +
    notice;
}

function renderAffiliate() {
  var el = document.getElementById('vendor-grid');
  if (!el || !(DATA && DATA.affiliate_items)) return;
  el.innerHTML = DATA.affiliate_items.map(function(item) {
    return '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer" class="flex flex-col items-center gap-2 p-4 px-3 bg-black/[0.025] rounded-[20px] no-underline text-[#1C1C1E] active:scale-[0.97] transition-transform">' +
      '<span class="text-[28px]">' + item.icon + '</span>' +
      '<span class="text-xs font-extrabold text-center">' + item.name + '</span>' +
      '<span class="text-[10px] text-[#AEAEB2]">' + (item.sub || '楽天で探す →') + '</span></a>';
  }).join('');
}

function renderFAQ() {
  var el = document.getElementById('faq-content');
  if (!el) return;
  var items = (DATA && DATA.faq) || DEFAULT_FAQ;
  el.innerHTML = items.map(function(item, i) {
    var bc = i < items.length - 1 ? 'border-b border-black/[0.04]' : '';
    return '<div class="px-6 py-4 ' + bc + '">' +
      '<p class="text-sm font-extrabold text-[#00A86B] mb-[6px]">Q. ' + item.q + '</p>' +
      '<p class="text-sm text-[#636366] leading-relaxed">A. ' + item.a + '</p></div>';
  }).join('');
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
        'font-size:13px;font-weight:700;color:#00A86B;text-decoration:none">' +
        '公式サイトで詳細を確認' +
        '<span class="ms-nav" style="font-size:15px">open_in_new</span></a>'
      : '';
    return '<div class="px-6 py-5 ' + bc + '">' +
      '<p class="text-[12px] text-[#AEAEB2] mb-2">' + (n.date || '') + '</p>' +
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
        'background:' + (active ? '#F0F8F3' : 'transparent') + ';font-family:inherit;cursor:pointer">' +
        '<span style="font-size:24px">' + lang.flag + '</span>' +
        '<span style="flex:1;font-size:16px;font-weight:' + (active ? 800 : 500) + ';' +
        'color:' + (active ? '#00A86B' : '#1C1C1E') + '">' + lang.label + '</span>' +
        (active ? '<span style="font-size:18px;color:#00A86B;font-weight:800">✓</span>' : '<span class="ms-nav" style="font-size:20px;color:#C7C7CC">chevron_right</span>') +
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

  // ── 自治体テーマカラー（JSON の theme オブジェクトで指定）
  // 例: "theme": { "bgContent": "#f7f7f1", "brand": "#38a546" }
  var theme = (DATA && DATA.theme) || {};
  if (theme.bgContent) {
    document.documentElement.style.setProperty('--bg-content', theme.bgContent);
  }
  if (theme.brand) {
    var b = theme.brand;
    document.documentElement.style.setProperty('--c-recycle', b);
    // ナビ・フォーカスリングにも反映
    var style = document.createElement('style');
    style.textContent =
      '.nav-item.active{color:' + b + '}' +
      '.nav-item.active::after{background:' + b + '}' +
      ':focus-visible{outline-color:' + b + '}';
    document.head.appendChild(style);
  }
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

  // ── お知らせセクション（features.notice が true の場合のみ）
  if (features.notice !== false && notices.length > 0) {
    html += '<div style="background:#fff;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.08);overflow:hidden;margin-bottom:16px">' +
      '<h2 style="font-size:18px;font-weight:800;color:#1C1C1E;padding:20px 24px 16px;border-bottom:1px solid rgba(0,0,0,0.04);margin:0">お知らせ</h2>';
    notices.forEach(function(n) {
      var link = n.url
        ? '<a href="' + n.url + '" target="_blank" rel="noopener" ' +
          'style="display:inline-flex;align-items:center;gap:4px;margin-top:12px;' +
          'font-size:13px;font-weight:700;color:#00A86B;text-decoration:none">' +
          '公式サイトで詳細を確認' +
          '<span class="ms-nav" style="font-size:15px">open_in_new</span></a>'
        : '';
      html += '<div style="padding:18px 24px;border-bottom:1px solid rgba(0,0,0,0.04)">' +
        '<p style="font-size:12px;color:#8890A0;margin-bottom:6px">' + n.date + '</p>' +
        '<p style="font-size:16px;font-weight:800;color:#1C1C1E;margin-bottom:8px;line-height:1.35">' + n.title + '</p>' +
        '<p style="font-size:16px;color:#636366;line-height:1.5">' + n.body + '</p>' +
        link +
        '</div>';
    });
    html += '</div>';
  }

  // ── ゴミ出しルールセクション
  if (ruleItems.length > 0) {
    html += '<div style="background:#fff;border-radius:16px;box-shadow:0 2px 14px rgba(0,0,0,0.08);overflow:hidden">' +
      '<h2 style="font-size:18px;font-weight:800;color:#1C1C1E;padding:20px 24px 16px;border-bottom:1px solid rgba(0,0,0,0.04);margin:0">ゴミ出しルール</h2>';
    ruleItems.forEach(function(item, i) {
      var last = i === ruleItems.length - 1;
      html += '<div style="display:flex;gap:14px;padding:14px 24px;' + (last ? '' : 'border-bottom:1px solid rgba(0,0,0,0.04)') + '">' +
        '<span class="ms-nav" style="font-size:22px;color:#00A86B;flex-shrink:0;margin-top:1px">' + item.icon + '</span>' +
        '<div><p style="font-size:16px;font-weight:700;color:#1C1C1E;margin-bottom:6px">' + item.title + '</p>' +
        '<p style="font-size:16px;color:#636366;line-height:1.5">' + item.body + '</p></div>' +
        '</div>';
    });
    html += '</div>';
  }

  el.innerHTML = html || '<p style="text-align:center;color:#8890A0;padding:40px 20px;font-size:14px">情報はありません</p>';
}


/* =====================================================
   カテゴリ別おすすめグッズ（楽天アフィリエイト）
===================================================== */
var CAT_PRODUCTS = {
  moeru:       [{ name:'半透明ゴミ袋（45L）', kw:'ゴミ袋 半透明 45L' },
                { name:'防臭ゴミ袋',          kw:'防臭袋 ゴミ 生ごみ' },
                { name:'生ゴミポット',         kw:'生ゴミ ポット 蓋つき' }],
  moenai:      [{ name:'不燃ゴミ袋',         kw:'不燃ゴミ袋 半透明' },
                { name:'分別ゴミ箱',          kw:'分別 ゴミ箱 スリム' }],
  recycle:     [{ name:'3分別ゴミ箱',        kw:'分別 ゴミ箱 3分別' },
                { name:'缶クラッシャー',       kw:'缶クラッシャー 家庭用' },
                { name:'ペットボトルつぶし',   kw:'ペットボトル クラッシャー' }],
  'shigen-pla':[{ name:'プラ分別ボックス',   kw:'プラスチック ゴミ箱 分別' },
                { name:'洗いやすいゴミ箱',    kw:'ゴミ箱 洗いやすい キッチン' }],
  can:         [{ name:'缶クラッシャー',       kw:'缶クラッシャー 家庭用' },
                { name:'缶専用ゴミ箱',         kw:'缶 ゴミ箱 分別' }],
  pet:         [{ name:'ペットボトルつぶし',   kw:'ペットボトル クラッシャー' },
                { name:'ペット専用ゴミ箱',     kw:'ペットボトル ゴミ箱 分別' }],
  bin:         [{ name:'瓶専用ゴミ箱',        kw:'瓶 ゴミ箱 分別' },
                { name:'分別ゴミ箱',           kw:'分別 ゴミ箱 スリム' }],
  can_pet_bin: [{ name:'3分別ゴミ箱',         kw:'分別 ゴミ箱 3分別' },
                { name:'缶クラッシャー',        kw:'缶クラッシャー 家庭用' },
                { name:'ペットボトルつぶし',    kw:'ペットボトル クラッシャー' }],
  can_pet:     [{ name:'缶クラッシャー',        kw:'缶クラッシャー 家庭用' },
                { name:'ペットボトルつぶし',    kw:'ペットボトル クラッシャー' }],
  sodai:       [{ name:'大型ゴミ袋',           kw:'粗大ごみ袋 大型 透明' },
                { name:'養生テープ',            kw:'養生テープ 梱包 搬出' }],
  kami:        [{ name:'古紙ストッカー',        kw:'古紙 ストッカー 縛らない' },
                { name:'紙ひも',                kw:'紙ひも ゴミ 縛る' }],
  cardboard:   [{ name:'段ボールストッカー',   kw:'段ボール ストッカー 収納' },
                { name:'段ボールカッター',       kw:'段ボール カッター 開梱' },
                { name:'紙ひも',                 kw:'紙ひも ゴミ 縛る' }],
  kami_pack:   [{ name:'古紙ストッカー',        kw:'古紙 ストッカー 縛らない' },
                { name:'分別ゴミ箱',             kw:'分別 ゴミ箱 スリム' }],
  kiken:       [{ name:'廃電池収納ボックス',   kw:'廃電池 収納 ボックス' },
                { name:'絶縁テープ',             kw:'絶縁テープ 電気 安全' }],
  yugai:       [{ name:'蛍光灯収納ケース',     kw:'蛍光灯 収納 ケース 廃棄' }],
  fuku:        [{ name:'衣類圧縮袋',            kw:'衣類 圧縮袋 収納' },
                { name:'古着まとめ袋',           kw:'古着 回収 袋 まとめ' }],
  kitchen:     [{ name:'生ゴミ処理機',          kw:'生ゴミ処理機 家庭用' },
                { name:'三角コーナー',           kw:'三角コーナー キッチン' },
                { name:'防臭ゴミ袋',             kw:'防臭袋 ゴミ 生ごみ' }],
  tree:        [{ name:'剪定バサミ',            kw:'剪定バサミ 庭 手入れ' },
                { name:'落ち葉収集バッグ',       kw:'落ち葉 収集 バッグ 庭' }],
  spraycan:    [{ name:'スプレー缶穴あけ器',   kw:'スプレー缶 穴あけ 処理 安全' }],
};

function renderProducts(typeKey, iconBg, fg) {
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
    '<span class="ms-nav" style="font-size:15px;color:#8890A0">shopping_bag</span>' +
    '<p style="font-size:13px;font-weight:800;color:#636366">関連グッズ</p></div>' +
    '<div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;' +
    '-webkit-overflow-scrolling:touch;scrollbar-width:none">' +
    cards + '</div>' +
    '<p style="font-size:10px;color:#AEAEB2;margin-top:8px">※広告・アフィリエイトリンクを含みます</p>' +
    '</div>';
}

/* =====================================================
   カテゴリ詳細シート
===================================================== */
function openCategoryDetail(typeKey) {
  var cats = (DATA && DATA.categories) || {};
  var cat  = cats[typeKey] || {};
  var st   = TYPE_STYLE[typeKey] || TYPE_STYLE.unknown;

  // ヘッダー
  var headerEl = document.getElementById('category-detail-header');
  if (headerEl) {
    headerEl.innerHTML =
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding-bottom:4px">' +
        '<div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0">' +
          '<div style="width:52px;height:52px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:' + st.iconBg + ';flex-shrink:0">' +
          catIcon(typeKey, 28) + '</div>' +
          '<div style="min-width:0"><h2 style="font-size:20px;font-weight:800;color:' + st.fg + '">' + (cat.label || typeKey) + '</h2>' +
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
  html += section('lightbulb',    '出し方・注意点', (cat.how_steps||[]).concat(cat.tips||[]), '#E07800');

  // 関連する検索へのショートカット
  html += '<button onclick="closeCategoryDetail();showPanel(\'search\');quickSearch(this.getAttribute(\'data-q\'))" data-q="' + (cat.label || '') + '"' +
    ' style="width:100%;padding:14px;background:' + st.bg + ';border:none;border-radius:12px;' +
    'font-size:14px;font-weight:700;color:' + st.fg + ';cursor:pointer;font-family:inherit;margin-top:4px">' +
    catIcon(typeKey, 16) + ' 「' + (cat.label || typeKey) + '」でごみを検索</button>';

  // 関連グッズ（アフィリエイト）
  html += renderProducts(typeKey, st.iconBg, st.fg);

  bodyEl.innerHTML = html;

  document.getElementById('category-detail-backdrop').classList.remove('is-hidden');
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
