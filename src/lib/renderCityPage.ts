// src/lib/renderCityPage.ts
//
// 自治体アプリ本体ページ（/{city}/）を data_{city}.json から組み立てる共通ロジック。
// src/pages/[city]/index.astro（本番用・publicとの衝突時は自動的に使われない）と
// src/pages/preview-city/[city]/index.astro（太平さん確認用プレビュー）の
// 両方から呼び出す。ロジックを1箇所にまとめることで、確認用プレビューが
// 実際に本番へ切り替わるページと完全に同じ内容であることを保証する。
import fs from 'node:fs';
import path from 'node:path';

export type CityData = {
  municipality_id: string;
  name: string;
  seo: {
    title: string;
    description: string;
    keywords: string;
    h1Title: string;
    contactCardNote: string;
    calDayWeight: number;
    serviceName: string;
    orgName: string;
    orgTelephone: string;
    addressLocality: string;
    addressRegion: string;
    faq: { name: string; text: string }[];
  };
  garbage_db?: { name: string; category: string; note?: string }[];
  categories?: Record<string, unknown>;
  [key: string]: unknown;
};

export function getAllCityData(): CityData[] {
  const publicDir = path.resolve('./public');
  const files = fs.readdirSync(publicDir).filter((f) => /^data_.*\.json$/.test(f));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(publicDir, f), 'utf-8')));
}

// ── 「品目から探す」静的アコーディオン（DS.md §2-4-12・v1.106で新設） ──
// 品目別の個別ページ・複数URLハイブリッド案はいずれも重複コンテンツリスクを理由に
// 不採用となり、代わりに新規URLを一切作らず /{city}/ 本体の初期HTMLへ garbage_db
// 全品目をカテゴリ別に埋め込む方式を採用した。SPAのshowPanel()切替（.is-hidden）
// の対象には含めず、<details>/<summary>だけで開閉する常時DOM上の静的セクションにする。
//
// categories[key].how/how_steps/tips・garbage_db[].note は、script.js側の
// section()/openItemDetail()と同じく「電話番号・問い合わせ先へのリンクを含む
// 信頼済みHTML断片」として扱う既存のデータ規約に合わせ、ここでもエスケープせず
// そのまま連結する（エスケープすると<a href="tel:...">等が文字列のまま表示されてしまう）。
const CATEGORY_ICON: Record<string, string> = {
  moeru: '/icons/moeru.svg',
  moenai: '/icons/moenai.svg',
  recycle: '/icons/recycle.svg',
  'shigen-pla': '/icons/plastic.svg',
  kiken: '/icons/kiken.svg',
  yugai: '/icons/harmful.svg',
  sodai: '/icons/sodai.svg',
  fuku: '/icons/fuku.svg',
  kami: '/icons/kami.svg',
  zasshi: '/icons/kami_other.svg',
  can: '/icons/can.svg',
  pet: '/icons/pet.svg',
  bin: '/icons/bin.svg',
  can_pet_bin: '/icons/can_pet.svg',
  can_pet: '/icons/can_pet.svg',
  spraycan: '/icons/spray_can.svg',
  unknown: '/icons/none.svg',
  ippan: '/icons/common_gomi.svg',
  metal: '/icons/metal.svg',
};

// 自治体別アイコン差し替え（v1.135新設・script.jsのCITY_ICON_OVERRIDEと対）。
// yugai・canは自治体ごとに指す内容が異なるため、共有辞書のままだと
// 他自治体で見た目と実態がズレる（詳細はscript.js側のコメント参照）。
// 太平さんの判断（2026-08-26）で川口市限定で適用。
const CITY_ICON_OVERRIDE: Record<string, Record<string, string>> = {
  kawaguchi: {
    yugai: '/icons/harmful_light_mercury.svg',
    can: '/icons/can_drink_only.svg',
  },
};

type GarbageItem = { name: string; category: string; note?: string };

function buildExampleRows(kind: 'ok' | 'ng', list: string[] | undefined): string {
  if (!list || list.length === 0) return '';
  const rowIcon = kind === 'ok' ? 'check_circle' : 'cancel';
  const color = kind === 'ok' ? 'var(--c-status-ok)' : 'var(--c-status-ng)';
  const title = kind === 'ok' ? '出せるものの例' : '出せないものの例';
  const rows = list
    .slice(0, 10)
    .map(
      (t) =>
        `<div class="item-idx-row"><span class="ms-nav" style="font-size:16px;color:${color};flex-shrink:0;line-height:1.5">${rowIcon}</span><span>${t}</span></div>`
    )
    .join('');
  return `<p class="item-idx-sub" style="margin-top:0">${title}</p>${rows}`;
}

function buildItemIndexSection(data: CityData): string {
  const categories = (data.categories || {}) as Record<string, any>;
  const items = (data.garbage_db || []) as GarbageItem[];

  const byCat = new Map<string, GarbageItem[]>();
  for (const item of items) {
    if (!byCat.has(item.category)) byCat.set(item.category, []);
    byCat.get(item.category)!.push(item);
  }

  const blocks = Object.keys(categories)
    .filter((key) => (byCat.get(key) || []).length > 0)
    .map((key) => {
      const cat = categories[key] || {};
      const catItems = byCat.get(key)!;
      const icon =
        (CITY_ICON_OVERRIDE[data.municipality_id] || {})[key] ||
        CATEGORY_ICON[key] ||
        '/icons/none.svg';

      const howTexts = ([] as string[]).concat(cat.how_steps || [], cat.tips || []);
      const howHtml = howTexts.length
        ? `<div class="item-idx-how"><p class="item-idx-sub" style="margin-top:0">出し方・注意点</p>${howTexts
            .map((t) => `<p>${t}</p>`)
            .join('')}</div>`
        : '';

      const itemListHtml =
        `<p class="item-idx-sub">品目一覧</p><ul class="item-idx-list">` +
        catItems
          .map(
            (it) =>
              `<li>${it.name}${it.note ? `<span class="item-idx-note"> — ${it.note}</span>` : ''}</li>`
          )
          .join('') +
        `</ul>`;

      return (
        `<details><summary><span class="item-idx-summary-label"><img src="${icon}" width="22" height="22" alt="" aria-hidden="true">${
          cat.label || key
        }<span class="item-idx-count">（${catItems.length}件）</span></span>` +
        `<span class="ms-nav item-idx-chevron" aria-hidden="true" style="font-size:20px;color:var(--muted)">expand_more</span></summary>` +
        `<div class="item-idx-body">${buildExampleRows('ok', cat.allowed)}${buildExampleRows(
          'ng',
          cat.not_allowed
        )}${howHtml}${itemListHtml}</div></details>`
      );
    });

  if (blocks.length === 0) return '';

  // 全体をもう1段階、閉じたdetailsで包む（v1.109）。カレンダー・お知らせ・お得情報など
  // 品目と無関係なタブでも常時この節が見えてしまい太平さんから「かなり違和感がある」との
  // 指摘を受けた対応。SPAのshowPanel()切替（.is-hidden）には含めない方針は維持しつつ
  // （Googleの初期スナップショットで隠れてしまうとSEO効果が弱まるため）、閉じた状態の
  // <details>は初期状態でもテキストとしてDOM上に存在し続けるため、どのタブでも
  // 「品目から探す」という1行だけが最後に出る程度まで見た目を抑えられる
  return `<section class="item-idx" aria-label="品目から探す">
  <details class="item-idx-outer">
    <summary>
      <span class="item-idx-outer-label">品目から探す<span class="item-idx-count">（全${items.length}件）</span></span>
      <span class="ms-nav item-idx-chevron" aria-hidden="true" style="font-size:20px;color:var(--muted)">expand_more</span>
    </summary>
    <div class="item-idx-outer-body">
      <p class="item-idx-lead">${data.name}のごみ分別を、カテゴリごとに一覧で確認できます。品目名で探すには、下部メニューの「分別検索」もあわせてご利用ください。</p>
      ${blocks.join('\n      ')}
    </div>
  </details>
</section>`;
}

export function renderCityPage(data: CityData): string {
  const seo = data.seo;
  const cityPath = `https://gomi-nico.jp/${data.municipality_id}/`;

  // ── head 前半（GTM・charsetまで。全都市共通・静的） ──
  const headBefore = fs.readFileSync(
    path.resolve('./src/city-templates/head-before.html'),
    'utf-8'
  );

  // ── SEO用 head ブロック（title/meta/OGP/Twitter Card/JSON-LD） ──
  const faqBlock = seo.faq
    .map(
      (qa) => `          {
            "@type": "Question",
            "name": "${qa.name}",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "${qa.text}"
            }
          }`
    )
    .join(',\n');

  const seoBlock = `  <meta name="city" content="${data.municipality_id}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

  <!-- ══ SEO基本（JS が自治体データから動的に上書き） ══ -->
  <title>${seo.title}</title>
  <meta name="description" content="${seo.description}">
  <meta name="keywords" content="${seo.keywords}">
  <meta name="robots" content="index, follow">
  <link id="meta-canonical" rel="canonical" href="${cityPath}">

  <!-- ══ OGP（SNSシェア用） ══ -->
  <meta property="og:type"        content="website">
  <meta property="og:site_name"   content="ごみニコ">
  <meta property="og:title"       content="${seo.title}">
  <meta property="og:description" content="${seo.description}">
  <meta property="og:url"         content="${cityPath}">
  <meta property="og:locale"      content="ja_JP">

  <!-- ══ Twitter Card ══ -->
  <meta name="twitter:card"        content="summary">
  <meta name="twitter:title"       content="${seo.title}">
  <meta name="twitter:description" content="${seo.description}">

  <!-- ══ JSON-LD 構造化データ（JS が自治体データから動的に生成） ══ -->
  <script id="ld-json" type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://gomi-nico.jp/#website",
        "name": "ごみニコ",
        "alternateName": "ごみ分別ガイド",
        "url": "https://gomi-nico.jp/",
        "description": "自治体別ごみ収集日・分別方法検索サービス「ごみニコ」",
        "inLanguage": "ja",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "${cityPath}?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "WebPage",
        "@id": "${cityPath}",
        "url": "${cityPath}",
        "name": "${seo.title}",
        "description": "${seo.description}",
        "inLanguage": "ja",
        "isPartOf": { "@id": "https://gomi-nico.jp/#website" },
        "about": {
          "@type": "GovernmentService",
          "name": "${seo.serviceName}",
          "provider": {
            "@type": "GovernmentOrganization",
            "name": "${seo.orgName}",
            "telephone": "${seo.orgTelephone}",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "${seo.addressLocality}",
              "addressRegion": "${seo.addressRegion}",
              "addressCountry": "JP"
            }
          }
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
${faqBlock}
        ]
      }
    ]
  }
  </script>`;

  // ── head 後半（共通CSS等）＋ <body> 全体 ──
  // src/city-templates/app-shell-after.html を「共通シェルの原本」として
  // ビルド時に読み込む（このファイルは public/shiki/index.html・
  // public/warabi/index.html の「後半部分」を一字一句そのまま複製した、
  // リポジトリ内の自己完結型ファイル。以前の実装は public/shiki/index.html を
  // 直接ビルド時に読みに行っていたが、それだと同ファイルが存在する前提が
  // 崩れると即ビルド不能になる欠陥があったため、このファイルへ切り出した）。
  // 都市固有の4箇所（.cal-dayのfont-weight／ヘッダーh1コメント／ヘッダーh1本文／
  // 問い合わせカードの説明文）だけをプレースホルダ経由で差し替える。
  // この置換ロジックは、両都市の既存本番HTMLと一字一句一致することを
  // ビルド時diffで検証済み（Astro移行フェーズ3作業時）。
  const masterAfterSource = fs.readFileSync(
    path.resolve('./src/city-templates/app-shell-after.html'),
    'utf-8'
  );

  const afterRendered = masterAfterSource
    .replace('__CAL_DAY_WEIGHT__', `font-weight:${seo.calDayWeight};`)
    .replace('__H1_TITLE_COMMENT__', `${data.name}ごみ分別・JS が更新`)
    .replace('__H1_TITLE__', seo.h1Title)
    .replace('__CONTACT_NOTE__', seo.contactCardNote)
    .replace('__ITEM_INDEX_SECTION__', buildItemIndexSection(data));

  return headBefore + seoBlock + afterRendered;
}
