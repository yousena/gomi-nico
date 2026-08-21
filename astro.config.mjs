// astro.config.mjs
// ごみニコ: 静的サイト生成のみ（SSR/エッジ関数は使わない = Cloudflare Pagesの設定も
// 「ビルドコマンド: npm run build」「出力ディレクトリ: dist」だけで完結し、運用負荷を増やさない）
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://gomi-nico.jp',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
