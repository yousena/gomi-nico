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
  [key: string]: unknown;
};

export function getAllCityData(): CityData[] {
  const publicDir = path.resolve('./public');
  const files = fs.readdirSync(publicDir).filter((f) => /^data_.*\.json$/.test(f));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(publicDir, f), 'utf-8')));
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
  // public/shiki/index.html を「共通シェルの原本」としてビルド時に読み込み、
  // 都市固有の4箇所（.cal-dayのfont-weight／ヘッダーh1コメント／ヘッダーh1本文／
  // 問い合わせカードの説明文）だけをプレースホルダ経由で差し替える。
  // この置換ロジックは、両都市の既存本番HTMLと一字一句一致することを
  // ビルド時diffで検証済み（Astro移行フェーズ3作業時）。
  const masterAfterSource = (() => {
    const master = fs.readFileSync(path.resolve('./public/shiki/index.html'), 'utf-8');
    const endMarker = '</script>\n\n  <!-- Material Symbols';
    const e = master.indexOf(endMarker) + '</script>'.length;
    let after = master.slice(e);
    after = after.replace(
      'font-weight:500; color:var(--ink); line-height:1;',
      '__CAL_DAY_WEIGHT__ color:var(--ink); line-height:1;'
    );
    after = after.replace('志木市ごみ分別・JS が更新', '__H1_TITLE_COMMENT__');
    after = after.replace('          志木市のごみ分別\n', '          __H1_TITLE__\n');
    after = after.replace('市役所・環境推進課へのご連絡', '__CONTACT_NOTE__');
    return after;
  })();

  const afterRendered = masterAfterSource
    .replace('__CAL_DAY_WEIGHT__', `font-weight:${seo.calDayWeight};`)
    .replace('__H1_TITLE_COMMENT__', `${data.name}ごみ分別・JS が更新`)
    .replace('__H1_TITLE__', seo.h1Title)
    .replace('__CONTACT_NOTE__', seo.contactCardNote);

  return headBefore + seoBlock + afterRendered;
}
