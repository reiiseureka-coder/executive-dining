# Data provenance and modification notices

Source guidance: https://openpoiapi.com/attribution.html (read 2026-10-05).

Applicable license texts and the full Foursquare NOTICE are in `licenses/`. Original per-record licenses and attributions remain unchanged in the JSON snapshots.

## OpenPOI upstream processing notice

【本APIが加えた変更の通知（上記NOTICE本文が "may be modified to include an additional notice of your changes/modifications" と認めている追記。Apache License 2.0 第4条(b)にも対応）】
OpenPOI APIは、Foursquare由来データを含むOverture Maps Placesテーマのレコードに対し、
他ソース（Japan Food Facilities等）との名寄せ（正規化・重複排除）および複数レコード間での緯度経度の統合処理を行っています。
変更の主体: OpenPOI API（本APIの運営者）。
（この記載は、別途記載しているPDL1.0向け「加工の主体」の記載とは別に、Apache-2.0第4条(b)・Foursquare NOTICE.txt自身が
認める追記欄への対応として独立に行っています。適用されるライセンスが異なるため、どちらか一方を消して兼用にはしていません。）

## Japan Food Facilities / PDL1.0

出典：Japan Food Facilities（各自治体・厚生労働省のオープンデータを加工して作成）のデータを加工して作成

上流の加工主体：OpenPOI API。該当レコードの原出典：厚生労働省 食品衛生申請等システム（オープンデータ）。

PDL1.0 official terms: https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/f7fde41d-ffca-4b2a-9b25-94b8a701a037/24afdf33/20240705_resources_data_outline_05.pdf

## ExecutiveDining modifications

ExecutiveDining selected a bounded Nagoya research set, attached independently observed official factual evidence, and added application identifiers, verification state and quality warnings. Source-provided coordinates, licenses and attribution arrays are preserved without promotion to verified facts. The raw discovery responses are unmodified snapshots inside request/timestamp wrappers. Neither source operators nor licensors endorse this application.
