# 名古屋の実データ基盤：導入前チェック

このブランチは公開前の基盤準備です。既存デモを維持し、DB・認証・Vercel環境変数を変更しません。SQLファイルが存在することは、適用済み・安全な本番公開を意味しません。

## 今回できること

- `#/nagoya`：審査済みの項目だけを出典・取得日・確認日付きで表示。評価・写真・価格・個室情報の欠損を捏造しない。独立した実データ型を使用し、旧モックを代入しない。
- `#/curation`：DBが有効な場合にログインを確認し、DBに保存された編集者membershipをRPCで検証。候補の出典・元資料を確認し、公式ページで確認した短い事実を項目別に記録。掲載承認・差し戻し・対象外変更は再確認画面と楽観ロック付き。
- 編集者による事実の変更は店舗を確認待ちに戻し、再承認まで非公開。全体の公開スイッチはDB側で初期OFF。
- OpenPOI adapter：限定された名古屋のbbox＋市名チェック、最大50件/呼び出し、2秒以上の間隔、同時実行拒否、15秒timeout。429を自動再試行しない。生レコードとライセンス・帰属表示の全配列を保持する。
- MapLibre GL JS + OpenFreeMap：ユーザーが「地図を表示」を押したときだけ読み込み。標準attributionを維持。WebGL2未対応・worker起動不可・配信元通信障害を区別して表示し、障害時でも一覧を利用可能。20秒で読込状態を打ち切る。正確な位置を公式確認した店舗だけピンを表示する。
- 本人口コミのDBモデル：サーバー側のauth.uid()に作者を固定、pending開始、承認を経て公開、自己承認禁止、本人の取り下げ。現段階では全口コミRPCのクライアント実行権限なし、DB受付スイッチOFF、投稿/審査UI未公開。

## 明示的に残る制限

- 本番Supabaseの現行schema・RLS・ユーザー・プロバイダー設定は未検証。旧SQLコメントにproject refはあるが、対象projectと決めつけない。
- 新しいprivate schemaは旧publicテーブルの弱い権限を修正しない。旧店舗insert、他人名義口コミinsert、プロフィール全公開/ランク自己変更は、実際のpolicyを確認して別途是正が必要。旧テーブルのデータ移行や削除も行わない。
- 審査画面は最新200件の初期キュー。大規模運用向けページング・担当者管理・候補のマージUIは次段階。OpenPOI上の名前/座標を永続IDにせず、重複を自動統合しない。
- 公開カタログの本番通信、実際のOAuth、Supabase RESTでのロール境界は未検証。ローカルPostgres実行とmocked RPC UIだけではこれらを保証できない。
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
2. stagingまたは隔離したテストprojectでのmigration適用を承認。SQLは `supabase/migrations/202610050001_nagoya_foundation.sql`。既存名衝突なら停止し、`IF NOT EXISTS`で隠さない。ライブ環境に適用しない。
3. 最初の編集者のauth UUIDを安全な管理画面から確認し、その特定アカウントへの編集権限付与を承認。匿名ユーザー/通常ユーザー/編集者でRPCと直接テーブルアクセスを実環境テストする。
4. 旧policyの是正とデータ公開範囲を承認。データを失う操作は別途確認。OAuth redirect先は https://executive-dining.vercel.app の実構成を確認する。
5. 同じprojectの公開URLとpublishable/anon keyのみをVercelに設定。既存コードの変数名は `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`。service-role/token/秘密鍵をVITE変数やrepoに入れない。永続アクセスの新規作成/拡大は別途承認。
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
`tests/database.test.mjs`はPGliteの隔離されたPostgresで、auth関数/ロールをテスト用に構成する。本番への接続・migration適用はしない。E2Eは2つのlocalhostサーバーとmocked Supabase応答だけを使い、本番認証を操作しない。

参照した一次資料:
- https://api.openpoiapi.com/openapi.json
- https://openpoiapi.com/attribution.html
- https://openfreemap.org/quick_start/
- https://maplibre.org/maplibre-gl-js/docs/
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security

### 2026-10-05 地図検証の区分

既存CIでの地図ケースは意図的な通信障害時のfallback確認。追加ケースでは制御したMapLibre styleでWebGL描画のload完了を検証する。OpenFreeMap本番styleのHTTP 200/CORSレスポンス確認と、実ブラウザでのタイル描画成功は別の結果として扱う。環境がWebGL2を無効にしている場合は理由を表示し、迂回しない。
