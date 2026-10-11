# 口コミ・訂正・通報の段階的な開始条件

## 今回使えるもの / まだ使えないもの

実店舗詳細に、本人の体験下書き（非公開メモ名・訪問月・店舗との関係・評価・本文）、公式情報の訂正メモ、公開口コミごとの通報メモを用意した。確認画面は**未送信**と明記し、送信ボタンは無効。下書きは明示的な保存操作でこのブラウザのlocalStorageにだけ残す。日付・同行者・会社名・連絡先・予約情報・決済情報の入力欄、画像添付、位置取得はない。本文に書かれた個人情報を自動で発見/除去できるとは約束しない。

- 保存/削除失敗を表示し、入力を保持する。別タブで変わった保存内容を上書き/削除しない。
- 画面内の移動では入力をメモリ内で復元。未保存でページを閉じる際はブラウザの警告を要求する。警告表示はブラウザに依存する。
- 保存した下書きはアカウントと連動せず、ログアウトでも消えない。共有端末での注意と削除操作を表示する。暗号化保管ではない。自動失効は現段階では設定しない。
- 保存から復元すると本人訪問/プライバシー確認のチェックは解除する。過去のチェックを将来の投稿同意に流用しない。
- 口コミは本人の体験・感想、公式情報は出典付きの確認事実として別表示。公式確認や運営審査を「実訪問の証明」とは表示しない。
- 審査画面の開始前チェックリストは、既存のサーバー編集権限確認を通過した画面にだけ置く。架空の待ち件数・審査済み状態は作らない。

`ProposedReviewRepository` は**未接続のv2 adapter**。identity-aware private pilot SQL提案と隔離DBで接続試験を行うが、liveには接続しない。アプリのclient/画面からimport・生成しない。テストだけがmock transportを注入する。既存v1 RPCへのfallbackはなく、環境変数を追加するだけでは送信開始できない。live schema、gate、grant、Auth、ユーザー、投稿データは変更していない。

## v1だけを解放してはいけない理由

既存DBには作者固定、pending開始、店舗単位の投稿一意性、1日上限、自己承認禁止、理由付き審査、版番号、本人の取り下げがある。review RPCのclient executeは未付与のまま。

未完了:
1. 店舗との関係/招待・特典、投稿規約の版と同意時点を格納・公開する契約がない。
2. 同一request IDの照合がなく、送信結果不明時に重複/既存投稿を識別する本人一覧もない。
3. 投稿訂正→公開解除→再審査の経路、本人用の結果表示がない。現行一意制約では取り下げ後の単純な再投稿もできない。
4. 通報・公式訂正依頼の受付/管理データ、担当者・対応期限・異議申立て窓口がない。
5. 投稿時の店舗statusだけでなく、現在のcore source公開適格性を再確認する必要がある。
6. auth user削除で作者IDはnullとなり公開一覧から消えるが、本文はprivate tableに残る。これは完全消去ではない。削除/保存期間の明示と実装が必要。
7. client preflightはアクセス制御にならない。受付gate/役割を変えた直後や改造クライアントでも、すべての操作でserver側の判定が必要。

## v2 API案（未適用の提案に定義済み）

`dining_review_capabilities_v2` は contractVersion=2、signedIn、acceptingReviews/Reports/Corrections、canManageOwn、canModerate、policyVersion を返す。これはUIと契約互換性の判定で、権限の根拠をクライアントへ移すものではない。各mutationは再度auth.uid()/編集者membership/現在gateをDB transaction内で確認する。

| 関数案 | 最小のサーバー契約 |
| --- | --- |
| dining_submit_review_v2 | 作者はauth.uid()のみ。公開適格な店舗、月の精度/未来月、文字数、関係性・訪問申告・privacy確認、実際の規約版同意を検証。pending以外で作らない |
| dining_my_reviews_v2 | 作者指定引数なし。auth.uid()本人の一覧だけ。公開停止時も本人管理を利用可能にする。メール・他人の作者情報・内部審査メモを返さない |
| dining_review_queue_v2 | 最新の編集者membershipを毎回確認。最大200件の型を先行定義。運用前にカーソルと絞り込みを実装し、200件超を切り捨てない |
| dining_withdraw_review_v2 | 本人のみ。expected_version、request_id必須。新規受付OFFでも取り下げ可能。公開を解除し監査記録を追加 |
| dining_moderate_review_v2 | 編集者のみ、自己承認不可、作者削除/withdrawn不可、理由必須、expected_version不一致は拒否。審査時も元店舗の適格性を確認 |
| dining_report_review_v2 | report対象とrestaurantの対応、理由分類、本文上限、reporterはauth.uid()。本人以外の通報内容を返さず、通報数だけで口コミを消さない |
| dining_suggest_correction_v2 | 項目・公式HTTPS URL・短い指摘を受領。依頼だけで公式factを上書きしない。編集者が原典を確認し既存のfact記録/再承認経路へ |

Adapterはcapabilityの版/型/許可が不足すればmutationを送らず、author/role/statusをユーザー入力から転送しない。応答ID・request ID・期待status/versionを照合する。送信/審査後にネットワークが切れたり応答形式が不明なら**結果不明**とし、自動再送や成功表示をしない。

サーバーで `(auth.uid(), operation, request_id)` を一意にする。トランザクション内で同じ入力の再試行は同じ受付結果を返し、同じIDで違う入力なら拒否する。内容全体やtokenをログへ残さない。結果照合用の本人一覧/受付status照会を完成してからUIを接続する。識別子を作るだけでは冪等性は成立しない。

## 状態と訂正の運用案

- local draft → 明示的な送信/規約同意 → pending → 編集者判断でapproved/rejected
- 本人の訂正は元の公開を即時取り下げ、新版pendingへ。過去の版と審査理由は権限限定で追跡し、旧版を二重公開しない。private pilot提案では訂正RPCを実装・隔離検証済み。実UIは未接続。
- 本人の取り下げは公開解除。再投稿/訂正の方針と完全削除は別に決める。
- 通報はreceived → triage → resolved/dismissed。理由・担当・結果を監査し、当該レビューの取り下げと通報解決を別の操作にする。private pilot提案ではキュー/解決APIを実装・隔離検証済み。公開サービスには未接続。
- 公式訂正はreceived → 原典確認 → fact更新で店舗を再審査 → 承認。利用者の感想で公式事実を更新しない。
- 金銭/利害関係を理由に高評価を優遇しない、実在しない体験を生成しない等の運営方針を、公開規約の確定時に明文化する。現在の文書は運用案で、未決定の規約への同意は取得しない。

## 開始判定（担当と完了証拠）

| Gate | 完了証拠 | 現在 |
| --- | --- | --- |
| 運営判断 | 投稿対象・関係者/招待体験の扱い、公開/非公開項目、保存/消去、運営窓口、担当/対応目安、規約が確定 | 要判断 |
| Backend実装 | 新SQL提案、source毎回確認、idempotency、本人一覧/訂正/取り下げ、通報/訂正queue、retention処理 | private pilotの隔離DBで実装/検証済み。live未適用 |
| 隔離環境検証 | 匿名/他人/元編集者/自己承認/作者削除/競合/多重送信/受付OFF/source失効/削除をHTTP・DB両方で拒否/許可できる | v1とadapterの一部のみ検証 |
| UI接続 | 本人一覧・status照合・訂正/取り下げ・実審査/通報処理、結果不明後の回復、キーボード/mobile | 下書きのみ実装 |
| Auth/運用 | 対象利用者の登録方法、配信/ログイン、漏えい/濫用への対応、利用量上限/停止手順 | 未承認・未設定 |
| 承認された開始 | 対象project・追加schema/permissions・公開/受付対象を明示して承認、少数の本人投稿で検証 | 未承認 |

先に無料の店舗比較を公開し、口コミ受付はこれらが揃うまで閉じる段階公開が可能。店舗情報公開の承認と口コミ受付の承認は分ける。新しい認証手段、課金、サービス契約はこのパッチの対象外。

## 検証の境界と参考

- 単体: 月/関係性/申告/個人情報項目の除外、受付OFF、旧契約拒否、規約版不一致、結果不明、受領照合、作者/role引数の除外、審査条件。
- 隔離Postgres: 現行v1の不正月/未来月/重複、自己承認、版競合、別作者取り下げ、受付OFF時本人取り下げ、作者削除による非公開とprivate本文残存。テスト内でのgate/grant変更はPGliteだけ。
- UI: ローカル保存/移動/復元/削除/失敗/別タブ競合、送信ボタン無効、訂正と通報の区別、review/correction RPC通信ゼロ、編集者境界。
- v2のサーバー認可・並行transaction・rate-limit/idempotencyはまだ実証していない。adapterのmock成功を本番口コミ受付完了とは扱わない。

確認した一次資料:
- [Supabase RPC](https://supabase.com/docs/reference/javascript/rpc)
- [Database functions / privileges](https://supabase.com/docs/guides/database/functions)
- [Authenticated security-definer advisor](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0029_authenticated_security_definer_function_executable)
- [Changelog](https://supabase.com/changelog.md) は2026-10-05に確認。関連するPostgres minor breaking changeはltree/legacy pgcrypto/btree_gist/custom operatorsが対象で、このパッチはそれらやserver versionを変更しない。

最新版のprivate profile/公開snapshot/Owner表示と、適用・activation・ログイン・保管期限の承認事項は [private pilot承認用資料](review-pilot-approval.md) を正とする。旧v1の不足点はそのまま残し、新pilot tablesをpublic catalogへ流用しない。

同状態操作のfresh-ID反復は書込なしのno-opにする。quotaはprofile消去と分離した最小aggregateで保持し、profile削除を全user-linked dataの消去と説明しない。Auth account削除は別の手続き。詳しくは承認用資料の保持/削除範囲を参照。
