# 名古屋の実データ基盤：導入前チェック

このブランチは公開前の基盤準備です。既存デモは維持しています。2026-10-05、承認済みの基盤migrationと候補取り込みが専用DBへ適用されましたが、公開・口コミ受付はOFFです。ユーザー入力のpublishable keyでPreview接続を確認済みです。認証と編集者権限は別工程です。安全な本番公開を意味しません。

## 確認済みの専用DB状態（2026-10-05）

- 対象project: `gpwcleaohnywnnhlcvtm`。新規専用DBを使用し、旧`public.user_profiles`等のschemaは導入しない。
- 適用済みserver history: `20261005102621 nagoya_foundation`、`20261005104017 catalog_source_eligibility`。
- 対応repo file: `supabase/migrations/202610050001_nagoya_foundation.sql`。
- 適用内容のSHA-256: `84d5e91be8a42eb778514c483ce17735624395601aba7de947179b394df2724e`。適用後もこのファイルは変更していない。
- repo filenameのversionとserver historyのversionが異なる。CLIで自動pushする前に、承認済みの履歴照合・同期が必要。同じ基盤を再実行したり、過去ファイルを無断で改名/上書きしたりしない。
- 10:40時点の監査：10候補、15 private source（official-research 10＋OpenPOI 5）。全候補candidate、全source未審査、公開fact・編集者・口コミ0件。
- 公開/口コミgate OFF。publicの新規table/function自動公開設定もOFFを保存・再確認済み。
- 12:27時点のPreview確認：ユーザーがpublishable keyを入力し、commit `04c012a298299bb6d1d8407e5788c7950658f377`で再構築済み。catalogは読み込み後0件、curationは未ログインで操作不可。キーの値はrepo/文書に保存しない。
- テーブル本体約304 kB、DB全体約11 MBという時点確認。継続監視や大量取得ジョブは設定していない。


## 今回できること

- `#/nagoya`：審査済みの項目だけを出典・取得日・確認日付きで表示。評価・写真・価格・個室情報の欠損を捏造しない。独立した実データ型を使用し、旧モックを代入しない。
- `#/curation`：DBが有効な場合にログインを確認し、DBに保存された編集者membershipをRPCで検証。候補の出典・元資料を確認し、公式ページで確認した短い事実を項目別に記録。掲載承認・差し戻し・対象外変更は再確認画面と楽観ロック付き。
- 編集者による事実の変更は店舗を確認待ちに戻し、再承認まで非公開。全体の公開スイッチはDB側で初期OFF。
- OpenPOI adapter：限定された名古屋のbbox＋市名チェック、最大50件/呼び出し、2秒以上の間隔、同時実行拒否、15秒timeout。429を自動再試行しない。生レコードとライセンス・帰属表示の全配列を保持する。
- MapLibre GL JS + OpenFreeMap：ユーザーが「地図を表示」を押したときだけ読み込み。標準attributionを維持。WebGL2未対応・worker起動不可・配信元通信障害を区別して表示し、障害時でも一覧を利用可能。20秒で読込状態を打ち切る。正確な位置を公式確認した店舗だけピンを表示する。
- 本人口コミのDBモデル：サーバー側のauth.uid()に作者を固定、pending開始、承認を経て公開、自己承認禁止、本人の取り下げ。現段階では全口コミRPCのクライアント実行権限なし、DB受付スイッチOFF、投稿/審査UI未公開。

## 明示的に残る制限

- 新専用Supabaseの基盤schema/RLSとOFF gateは確認済み。実際のGoogle provider、redirect、利用者session、アプリからの匿名catalog接続は確認済み。認証sessionと編集操作は別途確認が必要。旧SQLコメントのproject refはこの専用projectとは異なる。
- 新しいprivate schemaは旧publicテーブルの弱い権限を修正しない。旧店舗insert、他人名義口コミinsert、プロフィール全公開/ランク自己変更は、実際のpolicyを確認して別途是正が必要。旧テーブルのデータ移行や削除も行わない。
- 審査画面は最新200件の初期キュー。大規模運用向けページング・担当者管理・候補のマージUIは次段階。OpenPOI上の名前/座標を永続IDにせず、重複を自動統合しない。
- 接続済みPreviewの匿名catalog応答は確認済み。実際のメールログイン/OAuthと、利用者sessionによるSupabase RESTのロール境界は未検証。ローカルPostgres実行とmocked RPC UIだけではこれらを保証できない。
- 口コミの利用規約・プライバシーポリシー・運営者名・保持期間・アカウント削除/開示対応・通報窓口・スパム対策・審査UI・本人編集フローを決めるまで受付不可。DBの5件/日制限だけでは十分な濫用対策ではない。
- MapLibreは地図表示時に約1MB（gzip約286KB）の別chunkを読む。通常検索の初期bundleには含まれない。OpenFreeMapにSLA/将来の料金条件を保証しない。別providerへ変更する場合はstyleとattribution/プライバシーを再確認する。
- 現在の10店舗資料は実座標未確認のためピン0件。会食適性、空席、遮音性やサービス品質の評価ではない。

## データ構造と権限

`dining_private`（Supabaseの公開schemaには追加しない）:

- `restaurants`：アプリUUID、候補名/住所（住所不明はNULL）、名古屋のcity、candidate/verified/rejected、version、取得用import_key
- `restaurant_sources`：provider、source URL、任意のprovider ID、生レコード、全licenses/attributions、取得/確認日時、掲載根拠と利用条件確認日
- `restaurant_facts`：店舗×確認項目の正規化された短い事実、同一店舗のsource FK、確認者と確認日
- `editors`：DB管理者が承認済みのauth UUIDだけを登録。rank/user_metadata/localStorageでは権限を与えない
- `reviews`：本人のauth UUIDをprivateで保持し、公開名とは分離
- `moderation_events`：変更者・対象・理由・日時の記録。一般クライアントの読み書きを許可しない
- `settings`：公開・口コミ受付の独立gate。どちらもfalse

全テーブルでRLS有効、anon/authenticatedのschema/table権限なし。限定SECURITY DEFINER RPCのみ、search_path固定、関数のPUBLIC実行権限を明示失効、編集系は毎回membershipをチェックする。公開RPCは作者UUID、メール、取得候補や元資料を返さない。RLS単独ではなく権限とRPC検証を合わせて使う。

`verified`は掲載の承認状態であり、「全項目確認済み」「営業中」「おすすめ」の意味ではない。名/住所/公式URLの公式確認が必須。その他の公開項目も全件、確認日と掲載根拠のある出典が必要。個室未確認は「未確認」で表示する。

## 必要なアクセスと承認

1. 対象Supabase project ID・所有組織・現行migration/テーブル/policyの読み取り確認。秘密値のチャット貼り付けは不要。
2. stagingまたは隔離したテストprojectでのmigration適用を承認。SQLは `supabase/migrations/202610050001_nagoya_foundation.sql`。この基盤は上記の専用DBへ承認済みで適用済み。再適用しない。別環境への適用や追加SQLには別途承認が必要。既存名衝突を`IF NOT EXISTS`で隠さない。
3. 最初の編集者のauth UUIDを安全な管理画面から確認し、その特定アカウントへの編集権限付与を承認。匿名ユーザー/通常ユーザー/編集者でRPCと直接テーブルアクセスを実環境テストする。
4. 旧policyの是正とデータ公開範囲を承認。データを失う操作は別途確認。OAuth redirect先は https://executive-dining.vercel.app の実構成を確認する。
5. 同じprojectの公開URLとpublishable keyのみを、ユーザー自身の操作でVercel Previewの対象branchに入力する。変数名は `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`（旧`VITE_SUPABASE_ANON_KEY`は互換用）。service-role/token/秘密鍵をVITE変数やrepoに入れない。永続アクセスの新規作成/拡大は別途承認。
6. 確認済みcommitのpreviewで `VITE_DINING_DATABASE_ENABLED=true` を有効にしてQA。DBの `public_enabled` はまだfalse。
7. 候補取り込みSQL、公式証拠、営業休止・料金条件、ライセンス/NOTICEの保持、公開する店舗を運営者がレビュー。承認後に限定公開スイッチをON。口コミは引き続きOFF。
8. 対象commitをmainへmerge/本番デプロイする前に承認。Vercelがmainの更新で自動デプロイするため、mergeを単なるコード保存として扱わない。

## 10店舗の研究資料を使う手順

資料: `data/research/nagoya-2026-10-05/verified-seed.json` と同ディレクトリのREADME/ライセンス。
10店舗・23公式出典・価格証拠6店舗・OpenPOI候補一致5店舗。すべて未公開。確認日は2026-10-05。

重要な例外:
- 源氏/王朝：ホテルの一時利用不可期間が2026-10-06 12:00 JSTまで。期限が過ぎても営業/空席を自動確認したことにしない。
- 南国酒家：2026-10-05,14,19,26の休業と短縮営業時間。一般的な「年中無休」で上書きしない。
- 加賀屋：OpenPOIのlodging分類を原本に残し、公式確認の料理情報と分離。
- 個室/半個室/可動間仕切りを区別。表示価格は平均予算でなく、期間・昼夜・税・サービス・席料条件付きのコース価格。

候補取得（オペレーターによる限定ジョブ。一般検索UIから呼ばない）:

```sh
node scripts/acquire-nagoya.mjs '日本料理' /tmp/nagoya-candidates.json
```

研究資料から候補のみのSQLファイルを生成:

```sh
node scripts/prepare-seed.mjs data/research/nagoya-2026-10-05/verified-seed.json /tmp/nagoya-candidates.sql
```

このスクリプトはファイル作成のみ。DB接続・実行をしない。import_keyにより同一batchは重複追加せず、既存レコードを上書きしない。候補とprivateな原資料のみを挿入し、公開facts/roles/settingsには触らない。承認前のSQL実行は禁止。管理画面で原資料と公式ページを照合し、日付付きの営業noticeも記録してから掲載承認する。

## 検証

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
```

既存Chromiumを使う場合: `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`。
`tests/database.test.mjs`はPGliteの隔離されたPostgresで、auth関数/ロールをテスト用に構成する。本番への接続・migration適用はしない。E2Eは3つのlocalhostサーバーとmocked Supabase応答だけを使い、本番認証を操作しない。

参照した一次資料:
- https://api.openpoiapi.com/openapi.json
- https://openpoiapi.com/attribution.html
- https://openfreemap.org/quick_start/
- https://maplibre.org/maplibre-gl-js/docs/
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security

### 2026-10-05 地図検証の区分

既存CIでの地図ケースは意図的な通信障害時のfallback確認。追加ケースでは制御したMapLibre styleでWebGL描画のload完了を検証する。OpenFreeMap本番styleのHTTP 200/CORSレスポンス確認と、実ブラウザでのタイル描画成功は別の結果として扱う。環境がWebGL2を無効にしている場合は理由を表示し、迂回しない。

## 最小の安全なアプリ接続手順

1. 対象projectのDashboardで公開URLとpublishable keyを確認。キーをチャットへ貼らない。キー取得/入力はユーザー操作へ引き継ぐ。
2. Vercelの既存ExecutiveDining projectで、Preview・`feat/nagoya-foundation` branchのみに `VITE_SUPABASE_URL` と `VITE_SUPABASE_PUBLISHABLE_KEY` を設定する。Productionには設定しない。service-role/secret keyは使わない。
3. 同じPreview scopeで `VITE_DINING_DATABASE_ENABLED=true`、`VITE_SUPABASE_GOOGLE_LOGIN_ENABLED=false` とする。変更・preview再構築は確認された範囲内で実施する。
4. DBの`public_enabled`と`reviews_enabled`はOFFのまま、1回の匿名catalog RPCが空配列を返すこと、一般アクセスがprivate table/編集RPCを拒否されることを少数回確認する。定期pollingやseed再取得を始めない。
5. Googleログインを使う場合は、Google providerと許可redirect URLを別途確認する。クライアントID/secretやOAuthの永続アクセス設定が必要な部分はユーザーへ引き継ぐ。確認後に限り `VITE_SUPABASE_GOOGLE_LOGIN_ENABLED=true`。
6. 編集者への付与は確認済みのauth UUIDだけを別途承認して登録する。プロフィールrankやuser_metadataで権限を与えない。
7. source eligibilityの追加対策は適用済み。店舗ごとの公式確認、公開対象と公開スイッチを承認してから公開へ進む。mainへのmerge/Productionデプロイは別の承認対象。

## Source eligibilityの追加対策（承認・適用済み）

`supabase/proposals/202610050002_catalog_source_eligibility.sql` はレビュー時のファイルをそのまま保存している。承認後、専用projectへserver version `20261005104017 catalog_source_eligibility`として適用・検証済み。SHA-256は `715d6d13e0f8eda8d43ed1e916458515a9a85d0b0992640f9ad5a10e03abcf2a`。historicalなproposal-onlyコメントを含め、SQL本文/ファイル名は変更しない。元の承認RPCは公式3項目を検証するが、後からsourceを失効した際のtop-level joins再確認をこの対策で補った。

適用済みの対策は公開RPCの読み取り時にもname/address/websiteの3公式sourceを毎回確認する。core sourceが失効・未確認・非公式へ変更された場合は店舗全体を非公開にし、任意項目のみ失効した場合は既存fact_jsonがその項目を除外する。データ・役割・gate・関数署名/実行grantは変更しない。ローカルPGliteで正例、core失効、任意項目失効、OFF gate、grant維持を検証する。専用project上でも関数定義・ACL維持・OFF gate・匿名catalog空配列を確認済み。今後のCLI履歴同期ではこのserver versionとの対応も照合する。

フロントのdecodeも公式core項目と表示名/住所の一致、重複、最低限のライセンス情報を検証するが、これは画面の防御でありRPC自体のアクセス制御の代わりではない。

認証状態の同期はauth sessionだけを読む。旧profile tableは一切問い合わせず、初回session取得が遅れて返っても新しいログイン/ログアウト状態を上書きしない。Supabase SDKは既存利用版`2.99.3`へexact pinし、依存更新による予期しない挙動変更を避ける。

## 管理者のメールリンクログイン（コードのみ・初期OFF）

メールリンクは `VITE_SUPABASE_EMAIL_LOGIN_ENABLED=false` が初期値。Googleは引き続きOFF。画面の小さなメールフォームだけを用意し、招待・メール送信・auth user作成・editor付与・SMTP/redirect/signup設定の変更はこのコード準備では行わない。

- `signInWithOtp` の `shouldCreateUser:false` で、このフォームからの自動登録を防ぐ。これはAuth API全体のsignup禁止ではないため、既存のsignup許可状態を別途確認する。
- `emailRedirectTo` は現在のアプリoriginに固定。queryや外部入力のredirect先を使わない。callbackは既存SDKが処理し、URL内のtokenを除去する。
- 送信中と送信試行後60秒は再送を抑制。SPA内の画面移動/ダイアログ再表示でも同じcooldownを保持する。これはUXの抑制で、サーバーのrate limitを置き換えない。
- 送信受付、設定/上限エラー、期限切れcallbackを表示し、メール/OTPを自動再送しない。provider error textやURLのcredentialをそのままUIへ表示しない。
- 管理者メールアドレスをコードへハードコード/保存しない。メール送信・初回招待の前に宛先と目的を確認する。

最小セットアップの確認順:

1. 対象メールが本人の指定したアドレスであり、Supabase organizationの既存team member宛かを確認する。標準SMTPはteam memberにしか配信せず、現行Docsでは2通/時・本番SLAなし。配信のためだけにorganizationへの権限を追加しない。
2. Dashboardの非秘密項目だけでEmail provider、custom SMTP有無、送信上限、Site URL/redirect allowlist、signup許可状態を確認する。SMTP password/API keysは取得・表示しない。
3. 必要なAuth設定変更は正確なPreview originと変更内容を示して承認を得る。redirectはbranchの既知URLだけに限定し、広いwildcardを追加しない。
4. 初回auth userがなければ指定メール1件への招待を別途承認。リンクはユーザーが自分のブラウザで開く。招待token/セッションをチャットへ貼らない。
5. 所有確認済みauth UUIDへのeditor membershipを別途承認して付与。ログイン成功だけで編集者に昇格させない。
6. 既知のbranch alias `https://executive-dining-git-feat-nag-96fdff-reiiseureka-6623s-projects.vercel.app` を使う。Vercel保護付きのため、受信リンクを開くブラウザで先にPreview本体を表示できることを確認する。保護を外したりbypass credentialを追加したりしない。Previewだけでメールflagを有効にする場合もその設定変更を確認し、1通の制御したログイン検証から始める。既定SMTPの2通/時に注意し、招待＋再ログイン以外の繰返しテストをしない。
7. 本運用/複数管理者には配信品質を含む別設計が必要。custom SMTPの契約・DNS・資格情報、Google OAuthのclient/secretは選択された場合に限り別途承認・ユーザー入力へ引き継ぐ。

一次資料（2026-10-05確認）:
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/redirect-urls

## コア画面の改善（Draft Previewのみ）

- `/`と主検索導線は実データ用名古屋画面。旧6件サンプルは明示した`#/demo`/`#/search`へ分離。公開gate OFFの場合、実画面は0件のまま表示する。
- 複数語のAND検索、公式ジャンル、確認済み情報の有無、保存候補、店名/確認日順。数値予算や個室の有無を自由記述から推測しない。
- 実店舗UUIDのローカル保存、専用詳細URL、検索条件/地図モードを含むURL、戻る/進む/再読み込み。投稿や予約は追加しない。
- 価格の税/サービス/席料条件、休業notice、出典/確認日を一覧・詳細へ保持する。位置未確認の店舗には推測ピンを付けない。
- 公開RPCの同時要求をまとめ、成功結果を60秒だけメモリ内再利用。時間経過だけでは要求せず、自動pollingなし。読取失敗時は古い結果を除外してエラー/再試行を表示。
- 地図の一覧絞り込みではmarkerだけを更新し、背景styleを再読込しない。WebGL2非対応時の代替表示は維持。
- 招待/メールcallback時だけ、認証後のDB編集権限がtrueなら審査へ置換遷移する。通常のホーム閲覧・session復元・権限なし・別画面への途中移動には介入しない。権限をmetadataやcallback typeから判断しない。
- pinned auth-js 2.99.3のdetectSessionInUrl hookで、SDKが既に解析したcallback URLの履歴entryを置換し、戻る操作にcredential fragmentを残さない。SDKの検証/保存/refreshは変更しない。対応はcallback/back-forward/reloadのテストで固定する。
- 最大3店を公式情報で比較し、未確認・価格条件・休業情報・項目の出典/確認日を保持する。共有リンクは公開UUIDだけで構成し、元URLのquery/fragmentは引き継がない。送信・共有サービス・analyticsは追加しない。
- 比較選択はブラウザ内のみ。保存失敗を表示し、clipboard失敗時は手動コピーへ切り替える。受信側に保存状態がなくても利用でき、現在の公開RPCから消えた店舗は表示しない。
- SDK既定のpersistSession/autoRefreshを維持。同じ安定したoriginとブラウザではsessionを再利用する。新しいVercel一時URL、別ブラウザ、ストレージ削除では共有されない。Google OAuthは低優先の別工程。

この作業ではDB/security/Auth設定/公開gate/main/Productionを変更しない。fixtureはtests内のみで、実Previewの掲載情報として同梱しない。

### 2026-10-06 private pilot基盤の適用

Phase Aの提案`20261005234433_review_pilot_v2.sql`（SHA-256 `a4a20d2dcf38ca70ee011fb683527f5dc94ce9d02debb0b2e16eddb2bb703685`）は承認後、server version `20261006065548 review_pilot_v2`として適用・確認済み。新10private tablesはRLS/client accessなし、19RPCのclient EXECUTEなし、設定singleton以外の新tableは空、受付OFF。歴史的なSQL本文/ファイル名は保持し、元の公開gate/Auth/店舗状態を変更していない。本人限定の実店舗テストは別の[owner trial提案](owner-trial.md)で扱う。
