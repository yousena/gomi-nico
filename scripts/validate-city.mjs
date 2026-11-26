#!/usr/bin/env node
// 自治体データの一括検証スクリプト（読み取り専用）
// 使い方: node scripts/validate-city.mjs <city> [<city> ...]   例: node scripts/validate-city.mjs matsuda
// 終了コード: 0=問題なし（警告のみ含む）/ 1=エラーあり
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pub = join(root, 'public');
const read = (p) => readFileSync(p, 'utf8');

const SHARED_KEYS = new Set([
  'moeru', 'moenai', 'recycle', 'shigen-pla', 'kiken', 'yugai', 'sodai', 'fuku', 'kami', 'zasshi',
  'can', 'pet', 'bin', 'can_pet_bin', 'can_pet', 'spraycan', 'unknown', 'ippan', 'kanden', 'metal',
  'pla_pet', 'kinzoku_gb', 'fuku_zasshi', 'glass', 'sentei', 'danball', 'dekinai', 'kaden', 'bin_brown',
]);
// 誤ると実害につながるため estimated 品目を禁止するカテゴリ（CLAUDE.md ルール3）
const NO_ESTIMATED = new Set(['kiken', 'yugai', 'sodai', 'unknown', 'dekinai', 'spraycan']);

const cities = process.argv.slice(2);
if (!cities.length) {
  console.error('usage: node scripts/validate-city.mjs <city> [<city> ...]');
  process.exit(2);
}

let errors = 0;
const err = (c, m) => { errors++; console.log(`ERROR [${c}] ${m}`); };
const warn = (c, m) => console.log(`WARN  [${c}] ${m}`);

const sitemap = read(join(pub, 'sitemap.xml'));
const index = read(join(pub, 'index.html'));
const sw = read(join(pub, 'sw.js'));
const allData = readdirSync(pub).filter((f) => /^data_.*\.json$/.test(f));

for (const city of cities) {
  const file = join(pub, `data_${city}.json`);
  let d;
  try { d = JSON.parse(read(file)); } catch (e) { err(city, `JSONを読めません: ${e.message}`); continue; }

  if (d.municipality_id !== city) err(city, `municipality_id(${d.municipality_id}) がファイル名と不一致`);
  for (const k of ['name', 'prefecture', 'population', 'brand_color', 'official_url', 'citation_date', 'seo',
    'area_groups', 'areas', 'categories', 'garbage_db', 'contact', 'features', 'notices']) {
    if (!(k in d)) err(city, `必須キー欠落: ${k}`);
  }
  if (!d.seo?.faq?.length) warn(city, 'seo.faq が空です');
  if (!d.official_url?.startsWith('https://')) warn(city, 'official_url がhttpsではありません');

  // brand_color 重複
  for (const f of allData) {
    if (f === `data_${city}.json`) continue;
    try {
      if (JSON.parse(read(join(pub, f))).brand_color?.toLowerCase() === d.brand_color?.toLowerCase()) {
        warn(city, `brand_color ${d.brand_color} が ${f} と重複`);
      }
    } catch { /* 他ファイルの破損は対象外 */ }
  }

  // カテゴリ整合
  const cats = new Set(Object.keys(d.categories || {}));
  for (const c of cats) if (!SHARED_KEYS.has(c)) warn(city, `共有辞書にないカテゴリキー: ${c}（新規キー追加は要記録）`);
  const used = new Set();
  const groupKeys = new Set();
  for (const g of d.area_groups || []) for (const k of g.keys || []) groupKeys.add(k);
  for (const [ak, a] of Object.entries(d.areas || {})) {
    if (!groupKeys.has(ak)) err(city, `areas.${ak} が area_groups に含まれていません`);
    for (const [k, v] of Object.entries(a)) {
      if (k === 'name') continue;
      used.add(k);
      if (!cats.has(k)) err(city, `areas.${ak}.${k} に対応する categories がありません`);
      const days = Array.isArray(v) ? v : [v];
      for (const x of days) {
        const day = typeof x === 'object' ? x.day : x;
        if (!Number.isInteger(day) || day < 0 || day > 6) err(city, `areas.${ak}.${k} の曜日が不正: ${JSON.stringify(x)}`);
        if (typeof x === 'object' && x.weeks) {
          for (const w of x.weeks) if (!(w === 'last' || (Number.isInteger(w) && w >= 1 && w <= 5))) {
            err(city, `areas.${ak}.${k}.weeks が不正: ${w}`);
          }
        }
      }
    }
  }
  for (const k of groupKeys) if (!d.areas?.[k]) err(city, `area_groups のキー ${k} が areas にありません`);

  // garbage_db
  const names = new Set();
  const hasKanji = /[一-鿿]/;
  const hasKana = /^[぀-ゟ]+$/;
  let noReading = 0;
  for (const it of d.garbage_db || []) {
    if (!cats.has(it.category)) err(city, `garbage_db「${it.name}」のcategory(${it.category})が categories にありません`);
    if (names.has(it.name)) warn(city, `garbage_db の品目名が重複: ${it.name}`);
    names.add(it.name);
    if (it.source === 'estimated' && NO_ESTIMATED.has(it.category)) {
      err(city, `危険・有害・粗大・受入不可カテゴリに estimated 品目: ${it.name}`);
    }
    if (hasKanji.test(it.name) && !(it.tags || []).some((t) => hasKana.test(t))) noReading++;
  }
  if (noReading) warn(city, `漢字を含む品目のうち、ひらがな読みタグが無いもの: ${noReading}件（読みは推測せず確認して追加）`);
  if ((d.garbage_db || []).length < 50) warn(city, `garbage_db が ${d.garbage_db?.length ?? 0} 件と少なめです`);

  // サイト組み込み
  if (!sitemap.includes(`https://gomi-nico.jp/${city}/`)) err(city, 'sitemap.xml に未登録');
  if (!index.includes(`href="/${city}/"`)) err(city, 'public/index.html の都道府県アコーディオンに未登録');
  if (!sw.includes(`'/${city}/'`)) err(city, 'sw.js の SHELL_ASSETS に /' + city + '/ が未登録');
  if (!sw.includes(`'/data_${city}.json'`)) err(city, `sw.js の SHELL_ASSETS に /data_${city}.json が未登録`);

  console.log(`OK    [${city}] 検証完了（品目${d.garbage_db?.length ?? 0}件・地区${Object.keys(d.areas || {}).length}）`);
}

// 全体チェック（cityに依らない）
const open = (index.match(/<details/g) || []).length, close = (index.match(/<\/details>/g) || []).length;
if (open !== close) err('index.html', `<details> の開閉が不一致 (${open}/${close})`);
const d1 = (index.match(/<div/g) || []).length, d2 = (index.match(/<\/div>/g) || []).length;
if (d1 !== d2) err('index.html', `<div> の開閉が不一致 (${d1}/${d2})`);
if (!/<\/urlset>\s*$/.test(sitemap)) err('sitemap.xml', '</urlset> で終わっていません');

console.log(errors ? `\n${errors} 件のエラーがあります` : '\nエラーなし');
process.exit(errors ? 1 : 0);
