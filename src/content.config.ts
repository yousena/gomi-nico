// src/content.config.ts
// 記事コンテンツのコレクション定義（Astro移行フェーズ2）。
// 新しい記事を追加するときは src/content/articles/ に .md ファイルを1つ置くだけでよい
// （URLはファイル名から自動生成、一覧・meta・JSON-LD・目次・まとめボックスはArticleLayoutが自動生成する）
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    eyebrow: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    readingMinutes: z.number(),
    // 「この記事でわかること」ボックス（<mark>タグをそのまま使ってよい）
    summaryPoints: z.array(z.string()),
    // 記事末尾のタグチップ
    tags: z.array(z.string()),
    // 記事末尾のまとめボックス（kaden.html の【〜まとめ】パターンと同じ構成）
    wrapupTitle: z.string(),
    wrapupPoints: z.array(
      z.object({
        label: z.string(),
        action: z.string(),
      })
    ),
    wrapupClosing: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
