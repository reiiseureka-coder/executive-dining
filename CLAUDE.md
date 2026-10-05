# Executive Dining — 開発ガイド

React 19 / TypeScript / Vite 7 / Tailwind CSS 4 の会食店検索プレビューです。詳細と本番化の未解決事項は README.md を参照してください。

## 検証

Node.js 22.18+。`npm ci`、`npm run test`、`npm run lint`、`npm run build`。
UI変更はスマホ・デスクトップ、検索から詳細への移動、ブラウザの戻る／進む、再読み込み、ダイアログの閉じる／Escapeを確認してください。

## 構成

- `src/lib/routing.ts`: ハッシュルーティング。検索条件は詳細URLにも保持
- `src/lib/search.ts`: 正規化・複数語検索・地域／個室／予算／時間帯の絞り込み
- `src/hooks/useSavedRestaurants.ts`: ブラウザ内の候補保存
- `src/lib/drafts.ts`: ブラウザ内の下書きの安全な読み込み
- `src/data/mockData.ts`: 既存サンプル6店と架空の口コミ。実データとして表示しない
- `src/components/SampleNotice.tsx`: サンプル情報の明示
- `src/contexts/AuthContext.tsx`: 任意のSupabase認証。未設定でも閲覧できる

## 重要な制約

- 投稿・掲載はローカル下書きのみ。成功表示は実際に保存できた場合に限る
- 本番DBのスキーマ・RLS変更は別途承認が必要。SQLを勝手に適用しない
- AIは準備中。Gemini等の秘密鍵を `VITE_*` に置かない。ブラウザ直接呼び出しを復活させない
- 利用規約・プライバシーポリシーは未提供。架空リンクや同意文を作らない
- サンプル写真を実店舗の写真として扱わない。未確認の店舗設備や予約可否を保証しない

## デザイン

温かいアイボリー、濃い文字色、落ち着いたグリーン。日本語の明朝見出しと読みやすい本文。大きなグラデーション・過剰なピル／影・AIを強調する装飾は避け、条件・写真・余白で整理します。
