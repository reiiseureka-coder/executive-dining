# 法人プラン・会員限定枠の検討（2026-10-07）

## 今回の公開範囲

ホームは旧デモのアイボリーとグリーン、写真と余白を使う構成を継承。検索は `#/nagoya` の権限に応じた実データへ接続し、サンプルのカード・件数・口コミをホームへ持ち込まない。旧デモは `#/demo` に保持。

`#/restaurants` と `#/corporate` は準備案内。料金、開始日、導入実績、提携割引、予約枠を確約しない。連絡窓口・個人情報の目的と保管先が決まるまで入力フォームを置かず、相談用の確認リストだけをコピーできる。

## 法人サービスの仮説

一次商品は、法人がサイトの有料会員利用料を負担し、社員が個人の食事のお店選びに利用できる福利厚生プラン。個人への直接課金を主軸にしない。業務での会食支援は副次的な用途とする。飲食代の負担や食事補助は会員機能へのアクセスとは別で、料金に含む前提ではない。

- [Benefit One サービス一覧](https://corp.benefit-one.co.jp/service/)
- [Benefit One 掲載事業者向け](https://corp.benefit-one.co.jp/supplier/)
- [ベネワン スマート食事補助](https://corp.benefit-one.co.jp/service/bs/smart_mealcoupon/)
- [チケットレストラン](https://edenred.jp/ticketrestaurant/)
- [接待ステーション（副次用途の比較対象）](https://corp.benefit-one.co.jp/service/reception/)

店舗情報・レビューの基本部分は無料で、店舗からの支払いや優待提供で評価・掲載順位を変えない方針。有料価値は社員向けの店選び機能を中心に検討する。優待・限定枠は店舗との合意ができた内容のみ表示し、料金は未決定。

特定の業界に限定せず、法人顧客や紹介・販売連携先を検討する。M&A会社はその一例。現在の提携先や導入実績ではないため、企業名・ロゴ・提携実績としてホームページへ掲載しない。連絡・契約は別途承認が必要。

次は承認後、企業の福利厚生担当者と社員に、利用場面・頻度・対象者の公平性・必要な有料機能・法人の支払意思を聞く案。名古屋の現在の掲載候補で日常や記念日の用途を十分に満たせるかを検証する。利用権の配布と退職時の終了、企業への報告範囲、請求・問い合わせの工数も設計する。個々の社員の食事履歴を企業へ開示する前提にはしない。

法人会員費と食事補助の税務を混同せず、一律に非課税・全額福利厚生費と表示しない。

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
