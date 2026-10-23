# 会食の判断情報を中心にした再設計

2026-10-23。研究に基づく設計仮説の実装であり、実利用者によるユーザーテストを行ったという報告ではありません。

## 設計判断

- 状態を先に説明。未接続、読み込み、通信エラー、公開準備、検索条件に該当なし、招待権限・期限を区別し、利用不能な検索を主操作にしない。
- 利用可能時は「名古屋の会食店を探す」から開始。料理写真や情緒コピーを先頭から外し、実在する料理の選択肢と店名・エリア検索にする。「個室あり」を装う全文検索チップは置かない。
- 料金の種類・税サービス料・室料などを含む原文と、個室の人数・条件を一覧で常時表示。短縮、金額だけの抽出、行数制限をしない。重要本文16px、補助情報14pxを基準にする。
- 詳細は料金・個室 → 公式確認 → 営業・アクセス・根拠。実店舗画像・口コミ・評価は創作しない。
- 比較では同じ条件を揃え、狭い画面は条件ごとに各店を縦に読む。選択・検索条件・戻る操作を保持する。
- 認証設定、公開ゲート、データベース、既存ブランチ、本番は変更しない。

## 参考資料と適用範囲

- [Material 3 Typography](https://m3.material.io/styles/typography/applying-type): 見出し、本文、ラベルを役割で使い分ける。
- [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout) / [Typography](https://developer.apple.com/jp/design/human-interface-guidelines/typography): 重要度、整列、まとまり、読みやすさ。
- [GOV.UK Question pages](https://design-system.service.gov.uk/patterns/question-pages/): 現在の課題と次の操作を明確にする。
- [食べログの接待・個室一覧](https://tabelog.com/aichi/A2301/A230101/R7155/rstLst/cond15-02-00/) / [一休の個室検索](https://restaurant.ikyu.com/t/s5-%E5%80%8B%E5%AE%A4/aichi/001/): 比較すべき場所・料金・個室条件の提示を研究。空席、確約、評価や価格の転用はしない。

CSS pxはAppleのptやMaterialのspと同一ではありません。16px等は日本語Webの初期設計値であり、各ガイドが唯一の正解として要求する数値ではありません。

## 検証方針

390×844、1440×1000で同一のモックデータを使い、直前版cbbfc95と改修後のホーム・一覧・詳細を撮影。全文とviewportを別々に保存し、computed typographyを記録します。長い料金文・個室なし/未確認・営業注意・比較・戻る・ログイン取消・期限切れ/再読込失敗を確認します。モック認証とローカルSQL検証は、実バックエンドとの疎通確認を意味しません。
