# 法人プラン・会員限定枠の検討（2026-10-07）

## 今回の公開範囲

ホームは旧デモのアイボリーとグリーン、写真と余白を使う構成を継承。検索は `#/nagoya` の権限に応じた実データへ接続し、サンプルのカード・件数・口コミをホームへ持ち込まない。旧デモは `#/demo` に保持。

`#/restaurants` と `#/corporate` は準備案内。料金、開始日、導入実績、提携割引、予約枠を確約しない。連絡窓口・個人情報の目的と保管先が決まるまで入力フォームを置かず、相談用の確認リストだけをコピーできる。

## 法人サービスの仮説

Benefit Oneの総合福利厚生と、会食向けの接待ステーションは用途が異なる。Executive Diningの初期価値は、名古屋の公式情報に基づく条件比較と会食選びの時間短縮。従業員向け福利厚生は、利用頻度・対象者の公平性・補助原資・使える店舗の幅を別に検証する。

- [Benefit One サービス一覧](https://corp.benefit-one.co.jp/service/)
- [接待ステーション](https://corp.benefit-one.co.jp/service/reception/)
- [ベネワン スマート食事補助](https://corp.benefit-one.co.jp/service/bs/smart_mealcoupon/)
- [チケットレストラン](https://edenred.jp/ticketrestaurant/)
- [Benefit One 掲載事業者向け](https://corp.benefit-one.co.jp/supplier/)

掲載無料だけでは差別化しづらい。事実と体験評価の区別、確認日、個室・追加料金などの条件が強みになり得る。店舗による支払いや優待提供で評価・掲載順位を変えず、将来の有料部分は法人向けの比較・共有・運用支援として検証する。料金は未決定。

次は外部連絡の承認を得たうえで、名古屋の法人3〜5社に会食担当と福利厚生担当それぞれの利用頻度・困りごと・支払意思を聞く案。候補採用率、選定時間、運用工数を測ってから商品を決める。接待、社員懇親、日常の食事補助を一律に福利厚生費・非課税と表示しない。

## 会員限定予約の仮説

店全体の独占、特定日時の専用枠、先行案内、限定イベントを混同しない。最初は2〜3店舗と少数の特定日時枠を合意する案が現実的。現在は提携・在庫確保・予約受付を行っていない。

- [OMAKASE Hospitality Club](https://omakase.in/ohc/promote)
- [Pocket Concierge 会員向け案内](https://www.pocket-concierge.jp/lp/news/index.html)
- [TableCheck Channels](https://www.tablecheck.com/join/features/tablecheck-channels/)
- [TableCheck API](https://tablecheck.atlassian.net/wiki/spaces/API/pages/48595292)
- [OMAKASE 利用規約](https://omakase.in/terms)

試験では日時・席数、専用販売期間、返却期限、総額、キャンセル条件、予約成立時点、顧客対応の責任者を店舗と明文化する。予約リクエストと確定を別の状態にし、店舗台帳と照合。無許可代理予約や他サイトの席転売を前提にしない。API公開は利用許可・対象店舗在庫・限定枠制御の取得を意味しない。

## 開始前の判断

店舗・システム会社への連絡、契約、支出、決済導入は別途承認。個人情報の利用目的、店舗への提供範囲、保管期間、アクセス権、キャンセル規約を定める。カード情報を自社フォームで保持しない。税務・法務は実際の制度と契約に沿って専門家に確認する。

- [国税庁 食事を支給したとき](https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2594.htm)
- [国税庁 交際費等](https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5265.htm)
- [個人情報保護委員会 FAQ](https://www.ppc.go.jp/personalinfo/faq/APPI_QA/)
- [消費者庁 ステルスマーケティングQ&A](https://www.caa.go.jp/policies/policy/representation/fair_labeling/faq/stealth_marketing/)

以上は公開一次資料に基づく設計案。導入実績・提携・提供条件が確認できたことを意味しない。
