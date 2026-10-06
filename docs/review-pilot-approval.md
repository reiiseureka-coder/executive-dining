# identity-aware private pilot: 適用承認用の一式

## 結論

最大10人の指定利用者と指定店舗に限り、private登録→本人投稿→別運営者の審査→本人訂正/再審査→取り下げ/削除、通報/公式訂正の受領・処理を試すためのSQL/APIを準備した。**まだ適用も受付開始もしていない**。今のUIは架空データの会員操作デモとローカル下書きだけ。実用のpilot UI接続は承認後の別工程で、SQL適用だけで登録は始まらない。

## 正確な成果物

- `supabase/proposals/20261005234433_review_pilot_v2.sql`
- `tests/review-pilot-database.test.mjs`: adapter→隔離Postgresでprofile/レビュー/審査/通報を検証
- `src/data/repositories/proposedReviewRepository.ts`: 明示的に未接続。v1へのfallbackなし
- `src/domain/membership.ts`: 公開属性の語彙、本人確認したLatin表記からのinitials、private属性混入の拒否
- `#/membership`: 実情報を入力できない架空データ限定デモ

SQLファイル名はSupabase CLI 2.119.0の`migration new review_pilot_v2`で生成し、適用対象migration directoryの外へ移した。CLIでremote login/link/applyはしていない。既存の適用済みSQLは変更していない。実適用時のserver versionを別途記録し、過去のmigration version不一致を自動修正しない。

## このSQLを適用した場合に変わること

9つのprivate tableと18のv2 RPC、private helpers/triggerを追加する。全新tableにRLSを有効化し、clientへのschema/table grantなし。すべての新RPCの`PUBLIC/anon/authenticated EXECUTE`を明示的に取り消した状態で終了する。

- profile: 実会社名、氏名、正式職名は本人だけのprivate RPC。編集者一覧にも返さない
- snapshot: 業種・規模・広い役割区分・initials・自己申告の表記・投稿時の運営関係のみ。会社名/氏名/正式職名を含まない
- profile consent: private保管とpublic labelの別確認、本人が確認したローマ字、表示文字列一致、規約版、profile versionをserverで検証
- Owner: server管理の独立した表示レコード。editor権限とは別で、metadata/支払い/投稿数では取得できない。badge行は空のまま
- pilot: 初期OFF、policy未承認、参加者/対象店舗は空。最大10人をDBでも制限。期間は最大30日
- review: private専用table。既存public catalogへ一切joinしない。approvalはprivate pilot内の審査状態で、一般公開ではない
- idempotency: actor/operation/request IDの一意性、payloadのSHA-256照合、actor単位transaction lock。同じIDの違う入力は拒否。raw payloadは保存しない
- limits: 本人の投稿+訂正は5回/24h、通報+公式訂正は10回/24h、profile変更5回/24h。取り下げ/削除は受付OFFでも許可。pilot全体でレビュー100件/feedback200件まで
- delete: profile削除で本人レビュー・feedback・関連eventをcascade削除し、過去payload fingerprintも削除。auth user削除でもcascade。JWTが残ってもauth.usersの存在確認でアクセスを拒否
- retention: 30日超データのoperator専用purge関数を用意。scheduler/client grantは追加しない。実保管上限を守るには運用担当と実行設定が必要

既存public/review gate、Auth provider/signup、ユーザー、editor、課金、Vercel Productionには触らない。

## 適用と開始を分ける承認

### A. Schemaのみ

既存の専用Executive Dining projectを管理画面で照合し、ファイルの最終hashを示して適用を承認する。ここではclient RPC grant、会員データ、Owner表示の付与、登録開始はない。適用後にRLS/ACL/初期OFF/空データ/旧公開gate維持をread-only確認する。

### B. 限定pilotを実際に開始する前

以下を具体化し、別途承認する:

1. **参加者**: 本人が選び連絡する10人以内のauth UUID。signupは閉じたまま。未知の人を新しいOwner/editorにしない
2. **審査者**: 投稿者とは別の確認済み運営アカウント。自己承認できない。Owner表示の付与対象も別に指定
3. **対象店舗**: 公式core3項目のeligibleな店舗UUID。候補を自動承認しない
4. **private収集の説明**: 実会社/氏名/正式職名の利用目的・本人閲覧・担当者の扱う範囲、自己申告であること、公開属性の再識別リスク、停止/削除方法。規約版と表示文章を確定
5. **保持期間**: 最大30日のpilot期間、終了時の消去担当/手順。purgeの定期実行または期限内の確実な手動処理を決める。バックアップの保持/失効条件とログにpayloadを残さない設定も確認
6. **ログイン方法**: 既定SMTPは一般利用者向け配信に制約がある。既存ユーザーだけの試用、別の配信設定、Google等を選ぶ場合の設定は別承認。利用者10人への連絡を自動送信しない
7. **UI接続**: このadapterを初めて使うprivate pilot画面を用意し、profile/投稿の送信先・公開範囲・結果不明時の照合を表示。本人一覧/修正/取り下げ/削除・実審査/feedback処理をHTTP/UIでも試験
8. **RPC grant**: 以下のexact signaturesの`authenticated` EXECUTEだけを必要範囲で明示付与。private table/schema/anon EXECUTEや旧v1を解放しない。capabilityの表示だけを権限判定にしない

全18RPCはprofile4件、capability/対象店舗2件、本人review/審査queue2件、review操作5件（submit/revise/withdraw/moderate/delete）、feedback5件（report/correction/本人一覧/審査queue/resolve）。合計は18件。全一覧はSQL末尾のrevocation allowlistと関数signatureを照合する。

### C. 一般公開/100人募集

このpilotを自動で広げない。public catalogへの口コミ投影、投稿表示への本人同意、公開規約、スパム対策・HTTP rate limiting・通報対応人数・一般登録/配信の用意を別に承認する。Plus/Primeの実entitlement、永続特典、支払いは別の変更で、レビュー点数/検索順位/削除可否へ結びつけない。

## 停止と回復

新規受付停止はpilot settingのenabled=false。現在の投稿者による本人一覧/取り下げ/削除を可能にしたままにし、すべてのRPCを一括revokeして利用者を閉じ込めない。編集者の権限剥奪は既存membershipを変えれば次のRPCで反映される。Owner表示を外しても過去投稿時の運営関係は隠れない。

保存失敗/通信途絶は成功と表示せず、自動再送もしない。同じrequest IDの照合と本人一覧で確認する。clientで新しいrequest IDを勝手に再発行して二重処理しない。

## 検証の限界

PGliteは1つの隔離Postgresインスタンスで、実Supabase HTTPや複数接続の同時実行ではない。server transaction/制約/RLS/grant・実SQLへのadapter連携は検証するが、live OAuth/メール・PostgREST・ブラウザからの実情報送信は未検証。fake fixtureやモックの成功を本人確認/実際の口コミ受領とは表示しない。
