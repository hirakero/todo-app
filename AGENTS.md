<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## ブランチ運用

GitHub Flow。`main` は常にデプロイ可能な状態を保ち、直接 push しない。

```
main（branch protection: 直接push禁止 / CI "verify" 必須 / strict）
 └─ feat/xxx, fix/xxx, refactor/xxx, ci/xxx, docs/xxx → PR → CI通過 → Squash merge
```

- マージは **Squash merge**。ブランチは削除する
- レビュー承認は必須にしていない（1人開発では自分の PR を承認できずマージ不能になるため）。共同開発者が増えた時点で有効化する
- CI は `.github/workflows/ci.yml` で `npm ci` → `next typegen` → `tsc --noEmit` → `eslint` → `next build` を実行する
  - `next typegen` は必須。`LayoutProps` などの型は gitignore 対象の `.next/types` に生成されるため、これが無いとクリーンな CI で型チェックが落ちる

### 粒度の基準

- **コミット** = 細かい作業単位。いくら細かくてもよい
- **ブランチ / PR** = 「単体でマージして意味がある」単位

1つの機能の途中で PR を切らない。逆に、複数の独立した機能を1ブランチに溜めない（差分が膨らみレビュー不能になる）。

機能追加とリファクタが混ざる場合は、リファクタを先に独立した PR にする。「振る舞いが変わらないこと」だけを確認すればよくなり、レビューが容易になるため。

## 指示の受け取り方

ユーザーの指示には、以下の2点が含まれていればブランチ粒度を自分で判断してよい。

1. **全体ゴールの中での位置づけ**（例: 「CRUD一式のうち削除だけ」）
2. **出荷単位**（例: 「これ単体でマージOK」/「次とまとめて1ブランチに」）

この2点が無く、かつ独立した依頼かどうか判断がつかない場合は、作業を始める前に確認する。明らかに独立した依頼であればそのままブランチを切ってよい。

ユーザーに書き方を案内する場合のテンプレート:

```
全体ゴール: 〈最終的に作りたいもの〉
今回の範囲: 〈そのうちどこ〉／これ単体でマージOK（or 次とまとめて）

ゴール:
含める要素:
やらないこと:
仕上がりの希望:
```

## 作業の進め方

```
実装 → 【ユーザーの動作確認を待つ】 → commit → push → PR作成
     → CI → ユーザーが Files changed を確認 → Squash merge
```

**実装したら commit せずに止まり、ユーザーがブラウザで動作確認するのを待つ。**
CI は型とビルドしか検証できず、見た目や操作感は検証できないため、ここが最初の関門になる。

コミット前に止めるのは、修正が入ったときに追加コミットや `--amend` が不要になるため。
Squash merge なので main の履歴は結局どちらでも同じだが、作業中の手戻りが少ない。
変更が大きく途中で区切りたい場合は WIP コミットを積み、確認後に整理してから push する。

ドキュメントのみの変更などブラウザで確認するものが無い場合は、その旨を伝えて確認を取る。

マージ前には、ユーザーが GitHub の Files changed で差分を読む。
1人開発でレビュアーがいないため、この差分レビューがコードレビューの代わりになる。

## コードの方針

- 初学者が読めるよう、わかりにくい箇所には日本語で短いコメントを入れる
- 配色は緑系で統一（メインの緑 `emerald` + 白いカード + 薄いグレーの背景）
- ライトモード前提のデザイン。`color-scheme: light` を指定しており、`dark:` クラスは使わない
- スマホで横スクロールを出さない。flex アイテムには `min-w-0` を忘れない
