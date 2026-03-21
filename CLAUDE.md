# Executive Dining — プロジェクト概要

ビジネスエグゼクティブ向けの**会食・接待特化型口コミサイト**。
「成功するビジネスは、食卓から始まる」をコンセプトに、接待・商談に適した飲食店を探せるプラットフォーム。

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite 6 |
| スタイリング | Tailwind CSS v4 + カスタム CSS（src/index.css）|
| フォント | Playfair Display（serif）、Noto Sans JP、Inter |
| アイコン | lucide-react |
| AI | Google Gemini API（`@google/genai`）|
| 認証 | Supabase Auth（Google OAuth）|
| ルーティング | 外部ライブラリなし（App.tsx の state ベース独自実装）|
| バックエンド | Supabase（DBスキーマ: supabase_setup.sql）/ 現在はモックデータ |

---

## ディレクトリ構成

```
executive-dining/
├── index.html
├── CLAUDE.md
├── supabase_setup.sql          # Supabase テーブル定義
├── src/
│   ├── main.tsx                # エントリーポイント
│   ├── App.tsx                 # ルーティング・グローバル state 管理
│   ├── index.css               # グローバルスタイル（font-serif 定義・glass-morphism 等）
│   ├── components/
│   │   ├── Header.tsx          # ヘッダー（ナビゲーション・ログインモーダル）
│   │   ├── RestaurantCard.tsx  # 店舗カードコンポーネント
│   │   ├── RankBadge.tsx       # ユーザーランクバッジ
│   │   └── StarRating.tsx      # 星評価 UI
│   ├── contexts/
│   │   └── AuthContext.tsx     # Supabase 認証コンテキスト
│   ├── pages/
│   │   ├── Home.tsx            # ホーム（ヒーロー・エリアカード・厳選店・フッター）
│   │   ├── Search.tsx          # 検索・絞り込み結果ページ
│   │   ├── Detail.tsx          # 店舗詳細ページ
│   │   └── Admin.tsx           # 店舗登録ページ
│   ├── services/
│   │   └── gemini.ts           # Gemini API（ビジネス適性分析・アクセスガイド）
│   ├── data/
│   │   └── mockData.ts         # モック店舗・口コミデータ
│   ├── types/
│   │   └── index.ts            # 型定義（Restaurant, Review, Page 等）
│   └── lib/
│       └── supabase.ts         # Supabase クライアント
```

---

## ルーティング

`App.tsx` の `currentPage` state で制御するスイッチ方式。外部ルーターは使用しない。

| page | コンポーネント | 主な params |
|------|--------------|------------|
| `home` | `Home` | — |
| `search` | `Search` | `initialQuery?: string`（キーワード・エリア名）|
| `detail` | `Detail` | `restaurantId: string` |
| `admin` | `Admin` | — |

ページ間の遷移はすべて `handleNavigate(page, restaurantId?, searchParams?)` 経由。
Search への遷移時は `searchKey` をインクリメントしてコンポーネントをリセットする。

---

## 主要な型（src/types/index.ts）

- **Restaurant**: `businessSpecs`（接客/静かさ/アクセス/機密性/雰囲気）、`overallBusinessScore`（0-100）、`privateRoomType`、`tags` 等を含む詳細な店舗情報
- **Review**: 接客・静かさ・アクセス・機密性・雰囲気の個別評価 + コメント
- **AIAnalysis**: Gemini が生成するビジネス適性スコア・推奨シーン・懸念点
- **AIAccessGuide**: 最寄り駅・タクシー案内・ドライバー指示文
- **UserProfile / UserRank**: ブロンズ / シルバー / ゴールド / ルビー
- **Page**: `'home' | 'search' | 'detail' | 'admin'`

---

## AI 機能（src/services/gemini.ts）

### ビジネス適性分析 `analyzeRestaurantForBusiness()`
- モデル: `gemini-2.0-flash`
- 店舗情報 + 口コミを元に `AIAnalysis` を JSON で返す

### アクセスガイド `getAccessGuide()`
- モデル: `gemini-2.0-flash`
- 住所・最寄り駅情報から `AIAccessGuide` を JSON で返す

環境変数 `VITE_GEMINI_API_KEY`（`.env.local`）が未設定の場合は AI 機能が無効化される。

---

## 認証（Supabase）

- Google OAuth でサインイン
- サインイン時に `user_profiles` テーブルへ自動でプロフィールを作成
- ランクは `ブロンズ` からスタート

---

## デザイン方針

- **ベース**: 白・スレートの落ち着いたカラーパレット
- **見出し**: `font-serif`（Playfair Display）を使用
- **カード**: 白背景・ライトボーダーのクリーンなスタイル
- **ヘッダー**: glass-morphism（`glass-morphism` クラス、`src/index.css` 定義）

---

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動（http://localhost:5173）
npm run build    # プロダクションビルド
npm run preview  # ビルド結果のプレビュー
```

## 環境変数（.env.local）

```
VITE_GEMINI_API_KEY=...          # Google Gemini API キー
VITE_SUPABASE_URL=...            # Supabase プロジェクト URL
VITE_SUPABASE_ANON_KEY=...       # Supabase 匿名キー
```
