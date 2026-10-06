# 実店舗を使う本人限定テスト

`#/pilot` で、現在DBにある実在10店舗の61件の確認記録を検索・詳細表示・3店比較する。公開前のcandidate状態は維持し、一般向けcatalogに変換しない。出典、確認日、料金の税/サービス/個室条件と日付付き営業案内を表示する。正確な位置の未確認ピンや評価を作らない。

プロフィールと投稿だけを固定の架空データに限定する。利用者の会社名・氏名・自由な口コミ本文を受け取るAPI引数はない。投稿には`test_entry=true`を付け、実来店や店舗評価ではない本文をserverが設定する。DB CHECKで承認を禁止し、自分の投稿を審査queueで確認するところまで試せる。

## Schemaと権限

- Phase Aは承認済みのSQL hash `a4a20d2dcf38ca70ee011fb683527f5dc94ce9d02debb0b2e16eddb2bb703685` をserver version `20261006065548 review_pilot_v2`として適用済み。元ファイルは書き換えない。
- 追加提案は`supabase/proposals/20261006071219_owner_dummy_trial.sql`。受付OFF、owner未設定、新wrapper EXECUTEなしで終了する。
- 共有`pilot_eligible`は変更しない。owner専用`owner_trial_eligible`のみで、指定店舗のcandidate/verifiedと公式core3項目を再確認する。
- 許可候補は`dining_owner_trial_*`の9wrapperだけ。既存19v2 RPCは未許可を維持する。private table/schemaへのclient access、他人の登録、口コミの承認RPCを解放しない。
- 実際の本人UUID/メールと10対象IDを含むactivation SQLはprivate Libraryで保管し、公開repoには入れない。Owner badgeの付与やeditor追加はこのactivationには含めない。
- 期限は2026-10-13 00:00 UTC（09:00 JST）。店舗閲覧と新規準備/送信を止める。本人のテスト結果確認、取り下げ、削除は残す。期限到来時の自動削除は設定しない。
- Auth userが削除される場合はowner参照を外すと同時に試用を閉じる。既存profileの削除cascadeを妨げない。

## 画面の確認順

1. 同じ安定Previewのブラウザで、指定した本人アカウントへログインして`#/pilot`を開く。
2. 実店舗10件を確認し、店名/所在地/料理で検索、2〜3店を比較、詳細で公式資料を確認。
3. 架空プロフィールの説明を確認して準備する。実際の個人情報を入力する欄はない。
4. 1店の詳細から固定のテスト投稿を送信。本人一覧と審査queueで受領を確認。承認ボタンはない。
5. 本人一覧から取り下げ、必要なら確認画面を経てテストprofile/投稿を削除。店舗情報・Authアカウントは消さない。

多重クリックは抑制し、結果不明時に自動再送しない。書込操作IDを保持して、まず本人の保存状態を再確認する。privateな店舗/プロフィール/投稿をlocalStorageやURLへ保存しない。ログアウト・別ユーザーへの切替でworkspaceを破棄する。

## 検証

`tests/fixtures/owner-trial-catalog.json` は既存DBの店舗の確認記録をread-onlyで取得したテストfixture（2026-10-06）。アプリへ固定データとしてimportしない。実画面は認証済みRPCから読む。

隔離Postgresでは、9wrapper以外の非公開、本人以外/別editorの拒否、候補のpublic非掲載、全10店/61facts、固定の架空保存、テスト承認拒否、期限切れcleanup、出典失効、通常profileの保護、Auth owner削除を検証する。画面試験では実店舗fixtureを使うが、全RPCをmockしliveデータは作らない。

一般公開、main/Production、一般signup、Google OAuth、課金、scheduled purgeは別工程。実行前に追加SQL・private activationそれぞれの最終hashと対象projectを照合して承認する。
