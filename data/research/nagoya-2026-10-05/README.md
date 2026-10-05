# ExecutiveDining Nagoya: verified seed handoff

Checked 2026-10-05. This is a bounded 10-venue launch seed, not a ranking or exhaustive inventory. It is an implementation input, not a reservation recommendation for a specified date or party.

## Deliverables

- `verified-seed.json`: authoritative structured handoff; 10 venues, 23 official sources, per-field evidence and unknowns.
- `verified-seed-summary.csv`: convenient flat summary. JSON preserves the important details.
- `openpoi-discovery.json` and `openpoi-discovery-2.json`: exactly two bounded public-location search responses, full provenance arrays and request/fetch timestamps.
- `openapi.json`: fetched API contract. The API uses OR for space-separated search terms, longitude first for center, max limit 200, and exposes no stable facility ID.
- `licenses/`: retrieved license texts and Foursquare NOTICE to accompany shared data. `OPENPOI-NOTICE.md` retains required upstream and application processing notices and links to the attribution page.

## What is verified

All 10 venues have official name, address, cuisine and private-room evidence. Six have some official published course-price evidence. Five have a candidate OpenPOI name/city match. No exact venue coordinate has been independently verified.

The 10: 名古屋浅田、日本料理 加賀屋 名古屋店、名駅 なだ万茶寮、日本料理 呉竹、中国料理 柳城、日本料理「源氏」会席コーナー、中国料理「王朝」、名古屋 なだ万、南国酒家 名古屋店、京都 吉兆 名古屋店.

## Implementation requirements

1. Do not label a whole venue “fully verified.” Show the field-specific verified date and original source. A current official page establishes a published fact, not live bookability or service quality.
2. `coordinates.lat/lng` intentionally remain null. `map_pin_eligible=false` throughout. Keep raw candidate OpenPOI coordinates in provenance; do not fabricate pins from addresses or use a hotel's coordinate for every restaurant without saying so. If a provisional map layer is used, label its coordinates as unverified and keep it visually distinct from verified navigation pins.
3. Unknown values are null/unknown, not false, zero, “no private room,” or a quality penalty. No scores, reviews, photos or unsupported estimates were imported.
4. The source has no stable venue ID. Slugs here are application-assigned IDs. Provider name+coordinates are not durable identity. Keep fuzzy/provisional matches separate from the verified venue record.
5. Private rooms, semi-private rooms, movable-partition rooms, connected rooms and hall buyouts remain different. Acoustic privacy was not established. Source capacities can be maximums rather than minimum party requirements.
6. Prices are published course prices, not average spend. Keep tax, service and room-fee qualifiers. Never use the general restaurant minimum for an individual private-room plan. `min` and `max` describe only the cited course subset; a null maximum is unknown. For 名駅なだ万 the documented room-plan menu has no meal period established in this pass.
7. Do not load entire venue HTML or copyrighted promotional text into the application. Use the concise factual records and direct links. No third-party reviews or Google Maps content were copied.

## Time-sensitive operational evidence

- Hilton Nagoya 源氏 and 王朝: official notice says rooms, restaurants and facilities cannot accept bookings/use from 2026-09-14 to 2026-10-06 12:00 local. Flag temporarily unavailable as of the check date. Recheck official status after the interval; expiration of the notice does not verify a table.
- 南国酒家: closed October 5, 14, 19 and 26. The restaurant and hotel official pages corroborate the October dates. Its normal “open year-round” line must not override these dated closures. It also publishes shortened hours.
- 浅田: Sunday dinner closed; the 加賀 dinner course is not sold in December.
- 京都吉兆: a cheaper floor-seat weekday lunch had a September 30 seasonal end, so it was excluded. Old pages with 8% consumption-tax prices still appear in search results and must not be imported.

## OpenPOI quality findings

The first query returned eight results; the second nine. These are name-targeted queries and do not measure overall geographic coverage. Five of the ten selected venues have candidate matches. “Not found” means absent from these two calls, not absent from OpenPOI entirely.

- 加賀屋名古屋店 is marked `lodging` although its own site establishes a restaurant. Keep raw category untouched and verified cuisine separate.
- Generic names such as なだ万 (Nadaman), 南国酒家 and GENJI lack branch addresses. Treat association as provisional; nearby coordinates alone are not identity proof.
- Results also include a takeaway counter, retailer, florist, beauty salon, plaza office and hotel corporate record. Filter for the intended venue type after discovery.
- A 名古屋ヒルトンホテル record is labelled 名古屋市千種区, unlike the official hotel's 中区栄 address. It was not used as a venue or coordinate source.
- No result was assigned to an absent restaurant solely through a shared hotel address or token match.

## Licensing and provenance

Keep every OpenPOI `licenses` and `attributions` element, even when a record has multiple sources. API code licensing is not a blanket license for all data. The selected seed includes CDLA-Permissive-2.0 records and one Apache-2.0/Foursquare candidate. Raw discovery files additionally include PDL1.0 records.

- OpenPOI source guidance: https://openpoiapi.com/attribution.html
- CDLA text: https://cdla.dev/permissive-2-0/
- Apache text: https://www.apache.org/licenses/LICENSE-2.0
- Current Foursquare NOTICE: https://opensource.foursquare.com/places-notice-txt/
- Overture attribution: https://docs.overturemaps.org/attribution/

Do not remove the source-provided 2024 Foursquare attribution just because the current Foursquare NOTICE says 2026. Preserve both with their provenance. When distributing the data, make the applicable license texts available and retain notices, including OpenPOI's upstream processing notice from its attribution page. A data API using Foursquare-derived data should include the full NOTICE in its developer documentation as the source requests. Before publishing raw PDL-derived discovery records, implement the applicable attribution and processing statements; the selected venue records themselves do not use PDL data.

No contacts, bookings, account actions or external state changes were made.
