# TxConv 引継ぎ・共通認識メモ

この文書は、TxConv リポジトリを引き継ぐ人・AI エージェントが、作業前に共有しておくべき前提知識をまとめたものです。`.clinerules` の内容を土台にしつつ、実際のコードベースから読み取れる実装パターンや注意点もあわせて整理しています。

## 1. このプロジェクトの概要

- サービス名: **TxConv**
- 用途: テキスト変換・整形・簡易計算ツール集
- URL: https://txconv.com
- 構成: **完全静的サイト**（HTML / CSS / Vanilla JS）
- ホスティング: 現状は GitHub Pages 前提

重要なのは、**ユーザー入力をサーバーに送らず、ブラウザ内だけで処理する**ことです。これは単なる実装方針ではなく、TxConv の価値そのものです。

---

## 2. 最優先ルール

詳細は `.clinerules` を必ず参照してください。特に以下は絶対遵守です。

### 2-1. ユーザー入力を外部送信しない

- `fetch()`
- `XMLHttpRequest`
- `WebSocket`
- その他の外部送信手段

を使って、ユーザーが入力したテキストを送信してはいけません。

### 2-2. サーバーサイドを追加しない

- バックエンドサーバー追加禁止
- DB 保存禁止
- API Gateway / Lambda / RDS / DynamoDB など禁止

### 2-3. ビルド前提の構成を持ち込まない

- React / Vue / Next.js / Nuxt 禁止
- npm / node_modules 依存の開発フロー禁止
- TypeScript 化禁止

### 2-4. ユーザー入力をブラウザ保存しない

- `localStorage`
- `sessionStorage`

へ入力テキストを保存しないこと。

---

## 3. リポジトリ構成の基本認識

主要構成は以下です。

- `/index.html`
  - トップページ・ツール一覧
- `/tools/[slug]/index.html`
  - 各ツールの独立ページ
- `/assets/css/`
  - 共通スタイル
- `/assets/js/tools/`
  - ツールごとの変換・計算ロジック
- `/assets/js/ui.js`
  - コピー、クリア、トーストなどの共通 UI
- `/tools-meta.json`
  - ツール台帳
- `/sitemap.xml`
  - サイトマップ
- `/.clinerules`
  - AI/開発ルール本体

補足:

- `.claude/` ディレクトリは存在するが、**`CLAUDE.md` は現状なし**
- `AGENTS.md` や既存の handover 系 Markdown も現状なし

---

## 4. 実装アーキテクチャの実態

理念としては「ロジックと UI の分離」です。

- `assets/js/tools/*.js`
  - 変換・計算ロジック
- `assets/js/ui.js`
  - DOM 操作や共通 UI

ただし、現状コードは**移行途中の2パターンが混在**しています。

### 4-1. 旧来パターン: グローバル公開型

例:

- `assets/js/tools/case.js`
- `assets/js/tools/count.js`
- `assets/js/tools/width.js`
- `assets/js/tools/encode.js`
- `assets/js/tools/diff.js`

これらは `window.TxConvCase` や `window.TxConvUI` のように、`window` に公開して利用します。

ページ側では次のような構成が多いです。

1. HTML で対象 JS を `<script src="..."></script>` 読み込み
2. `ui.js` を読み込み
3. ページ末尾のインライン `<script>` 内で初期化
4. 即時関数 `(function(){ ... })();` でスコープを閉じる

### 4-2. 新しめパターン: ES Modules 型

例:

- `assets/js/tools/tax.js`
- `assets/js/tools/warikan.js`
- `assets/js/tools/unit-price.js`
- `assets/js/tools/bulk-replace.js`

これらは `export function ...` を使い、HTML 側の `<script type="module">` から import します。

### 4-3. 実務上の理解

現状は完全統一されていません。したがって:

- **既存ページの流儀を尊重する**
- 新規追加や小改修では、その周辺コードのパターンに合わせる
- 全体統一リファクタは別タスクとして扱う

これが安全です。

---

## 5. ツールページの共通パターン

各 `tools/*/index.html` には、かなり共通した骨格があります。

### 5-1. head 内の定番要素

- `<title>`
- `<meta name="description">`
- canonical
- OGP 一式
- Twitter card
- 構造化データ（少なくとも BreadcrumbList）
- favicon
- `base.css` / `tool.css`
- `theme.js`

### 5-2. body の定番要素

- 共通ヘッダー
- パンくず (`.breadcrumb`)
- ツールのヒーロー (`.tool-hero`)
- ツール UI 本体
- 説明記事 (`.tool-article`)
- FAQ または補足
- 関連ツール
- 共通フッター

### 5-3. UX の定番

- リアルタイム変換・リアルタイム計算が多い
- コピーボタンが基本
- クリア操作あり
- 「入力はサーバー送信されない」と明示するページが多い
- ダークモード前提

---

## 6. UI 共通部品の扱い

`assets/js/ui.js` は共通 UI の中心です。

主な役割:

- トースト表示
- クリップボードコピー
- コピーボタン初期化
- クリアボタン初期化
- 値スワップ
- textarea 自動伸長
- 文字数バッジ

現状は `window.TxConvUI` としてグローバル公開されています。

つまり `.clinerules` の理想像では ES Modules 中心の整理が示されていても、**実装実態としてはグローバル公開の共通 UI が使われている**点を理解しておく必要があります。

---

## 7. tools-meta.json の位置づけ

`tools-meta.json` は単なる補助ファイルではなく、実質的な**ツール台帳**です。

各ツールについて以下のような情報を持ちます。

- ID
- タイトル
- 説明
- URL / path
- icon / tag / tags
- 使用 JS
- 関連ツール
- 最終更新日

新しいツールを追加したら、原則としてここも更新対象です。

---

## 8. 新規ツール追加・大きめ改修のチェックリスト

### 必須更新候補

1. `tools/[slug]/index.html`
2. `assets/js/tools/[tool].js`
3. `tools-meta.json`
4. `sitemap.xml`
5. トップページ `index.html`（一覧追加が必要なら）

### HTML 側チェック

- `h1` は 1 つだけ
- canonical 設定
- description 設定
- OGP 設定
- BreadcrumbList 構造化データ
- 関連ツールリンク 3 本以上を意識
- 「サーバー送信なし」を説明に含める

### 実装側チェック

- ツールロジックはブラウザ内で完結するか
- DOM 操作と変換ロジックが過剰に密結合していないか
- 例外時に無言で失敗しないか
- 必要に応じて `console.error` を使っているか

---

## 9. 現状コードから読み取れる暗黙知

明文化されていないが、実際には次の傾向があります。

### 9-1. 小さな独立ツールの集合体として設計されている

各ツールは URL 単位で完結しやすく、ページ間の依存は薄めです。共通化しすぎるより、壊しにくさと単純さが優先されています。

### 9-2. 「純粋ロジック」はテストしやすい形を目指している

新しい `tax.js` などは pure function 的で、入力と出力が明確です。今後の追加実装でも、この方向に寄せるのが望ましいです。

### 9-3. ただし全面的なモダン化はまだ完了していない

- 一部は module
- 一部は global
- 一部はインラインスクリプト

このため、改善時には「理想論で全部直す」よりも、**差分を小さく保つ**ほうが現実的です。

---

## 10. 既知のギャップ（理想ルールと現状実装）

`.clinerules` の理想と現実コードには、いくつか差があります。

### 例

- `assets/js/ui.js` は現状 ES Module ではなくグローバル公開
- 各ツールページでインライン `<script>` を使うものが多い
- 外部ライブラリは原則禁止だが、例外的に許可されたページがある
  - Markdown Preview
  - 文字コード/AI 系の一部機能

このギャップは「ルール違反」というより、**段階的に整理中の状態**として理解するのが妥当です。

---

## 11. 変更時の基本スタンス

迷ったら以下を優先してください。

1. 既存ページを壊さない
2. ユーザー入力を外部送信しない
3. 依存を増やさない
4. 周辺コードの流儀に合わせる
5. 大規模リファクタは別タスクに分ける

特に、1つの軽微な改修の中で

- global → module 全面移行
- 全 HTML のテンプレート統一
- CSS の全体再設計

のような変更を同時にやらないこと。

---

## 12. AI エージェント向け作業前チェック

作業前に最低限確認すること:

1. `.clinerules` を読む
2. 対象ページの `tools/[slug]/index.html` を読む
3. 対応する `assets/js/tools/*.js` を読む
4. そのページが global 型か module 型か確認する
5. `tools-meta.json` / `sitemap.xml` の更新要否を判断する

---

## 13. 参考として確認済みの実装例

今回の整理では主に以下を確認しています。

- `.clinerules`
- `index.html`
- `assets/js/ui.js`
- `assets/js/tools/tax.js`
- `tools/zen-han/index.html`
- `tools/tax-calc/index.html`
- `tools-meta.json`

これにより、ルール文書だけでなく、現状の実装実態も反映した内容になっています。

---

## 14. この文書の使い方

- 新しい AI エージェントの初回コンテキストとして読む
- 人が作業再開するときの前提確認に使う
- 実装方針で迷ったときに「TxConv では何を優先すべきか」を確認する

もし `.clinerules` を更新したり、module 化方針が固まったり、ディレクトリ構造が変わった場合は、この文書も一緒に更新してください。