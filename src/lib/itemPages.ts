// src/lib/itemPages.ts
//
// 品目別ページ（/{city}/bunbetsu/{item}/）用の共通ロジック。
// 「ユーザーが品目名で検索したときに、ごみニコが答えを直接示せるようにする」
// というSEO目的のための新規ページ群。既存のアプリ本体（[city]/index.astro）の
// 対話的なUXは一切変更せず、完全に別ページとして追加する設計。
//
// 重複コンテンツ・薄いコンテンツによるペナルティを避けるため、各ページには
// 品目固有の情報（メモ・タグ）に加えて、その自治体でのそのカテゴリの
// 出し方・許容/不可リスト・コツ（data_{city}.jsonのcategoriesに実データとして
// 存在する、自治体ごとに内容が異なる本物のテキスト）を組み合わせて表示する。
import fs from 'node:fs';
import path from 'node:path';

export type GarbageItem = {
  name: string;
  category: string;
  note?: string;
  tags?: string[];
  source?: string;
};

export type CategoryInfo = {
  label: string;
  how?: string;
  allowed?: string[];
  not_allowed?: string[];
  tips?: string[];
  how_steps?: string[];
};

export type ContactInfo = {
  name: string;
  note?: string;
  tel?: string;
  hours?: string;
  url?: string;
};

export type CityItemData = {
  municipality_id: string;
  name: string;
  garbage_db: GarbageItem[];
  categories: Record<string, CategoryInfo>;
  contact: ContactInfo[];
};

// script.js の TYPE_STYLE と同じマッピング（アイコン・CSS変数）。
// 二重管理になるが、script.js側はランタイムのSPA用、こちらはビルド時の
// 静的ページ用と役割が分かれているため、変更頻度の低い固定マッピングとして許容する。
export const CATEGORY_STYLE: Record<string, { icon: string; fg: string; bg: string }> = {
  moeru:        { icon: 'local_fire_department', fg: 'var(--c-moeru)',    bg: 'var(--c-moeru-bg)' },
  moenai:       { icon: 'delete_sweep',           fg: 'var(--c-moenai)',   bg: 'var(--c-moenai-bg)' },
  recycle:      { icon: 'recycling',              fg: 'var(--c-recycle)',  bg: 'var(--c-recycle-bg)' },
  'shigen-pla': { icon: 'water_bottle',           fg: 'var(--c-pla)',      bg: 'var(--c-pla-bg)' },
  kiken:        { icon: 'warning',                fg: 'var(--c-kiken)',    bg: 'var(--c-kiken-bg)' },
  yugai:        { icon: 'science',                fg: 'var(--c-yugai)',    bg: 'var(--c-yugai-bg)' },
  sodai:        { icon: 'weekend',                fg: 'var(--c-sodai)',    bg: 'var(--c-sodai-bg)' },
  fuku:         { icon: 'checkroom',              fg: 'var(--c-fuku)',     bg: 'var(--c-fuku-bg)' },
  kami:         { icon: 'newspaper',              fg: 'var(--c-kami)',     bg: 'var(--c-kami-bg)' },
  can:          { icon: 'sports_bar',             fg: 'var(--c-can)',      bg: 'var(--c-can-bg)' },
  pet:          { icon: 'water_bottle',           fg: 'var(--c-pet)',      bg: 'var(--c-pet-bg)' },
  bin:          { icon: 'wine_bar',                fg: 'var(--c-bin)',      bg: 'var(--c-bin-bg)' },
  can_pet_bin:  { icon: 'recycling',              fg: 'var(--c-recycle)',  bg: 'var(--c-recycle-bg)' },
  can_pet:      { icon: 'recycling',              fg: 'var(--c-recycle)',  bg: 'var(--c-recycle-bg)' },
  spraycan:     { icon: 'propane',                fg: 'var(--c-kiken)',    bg: 'var(--c-kiken-bg)' },
  unknown:      { icon: 'help',                   fg: 'var(--c-unknown)',  bg: 'var(--c-unknown-bg)' },
};

export function getAllCityItemData(): CityItemData[] {
  const publicDir = path.resolve('./public');
  const files = fs.readdirSync(publicDir).filter((f) => /^data_.*\.json$/.test(f));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(publicDir, f), 'utf-8')));
}

/**
 * data_{city}.json の categories.*.how / tips 等には、SPAモーダル内でしか
 * 動かない `onclick="closeXxx();openContact()"` 等のJSや `href="javascript:void(0)"`
 * が埋め込まれている（元々アプリのモーダル内表示専用に書かれたHTMLのため）。
 * 品目別ページはSPA本体を読み込まない独立ページなので、そのまま出すとリンクが
 * 死んだ状態になる。ここで安全な実リンクに機械的に置き換える。
 */
export function sanitizeAppHtml(html: string, cityPath: string, primaryTel?: string): string {
  let out = html.replace(/\s+onclick="[^"]*"/g, '');
  out = out.replace(
    /href="javascript:void\(0\)"([^>]*)>([^<]*(?:問い合わせ|環境推進課|担当)[^<]*)</g,
    primaryTel
      ? `href="tel:${primaryTel}"$1>$2<`
      : `href="${cityPath}"$1>$2<`
  );
  out = out.replace(/href="javascript:void\(0\)"/g, `href="${cityPath}"`);
  return out;
}

export function formatTel(tel?: string): string | undefined {
  if (!tel) return undefined;
  return tel;
}
