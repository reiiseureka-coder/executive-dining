# Restaurant imagery and rights

## Current preview (2026-10-23)

The user approved temporary, explicitly labelled UI illustrations on 2026-10-23 after being told that republication rights for the ten venues' photography could not be established. No restaurant photography has been licensed or copied as part of this change. Official pages are links only, never image sources or an implied reuse permission.

`src/data/restaurantPhotos.ts` keeps two distinct models:

- `RestaurantPhoto` and the empty `restaurantPhotos` manifest are reserved for actual venue photographs with confirmed rights.
- `DiningIllustration` and `generatedIllustrations` contain three existing local, fictional, OpenAI-generated assets created on 2026-10-09. They have no restaurant ID, claimed license or invented photographer credit. The provenance and original prompts are recorded in `docs/dining-imagery.md`.

All three actual image files were visually inspected before this implementation. They show a fictional Japanese meal, a fictional Chinese meal and a fictional dining table. They do not document the named venues' food, interior, service, menu, private rooms or availability.

## Display contract

- Every illustration thumbnail and expanded image carries the visible exact disclaimer `実店舗の写真ではないイメージ画像` and the caption `生成 / UI確認用`. Alt text also makes the distinction explicit.
- Cards choose one cuisine illustration from the verified genre. There is no restaurant-name hash or inference from a restaurant's name. The ten current Japanese/Chinese records each have the matching generic cuisine cover and a second, neutral fictional table illustration in detail. Unknown genres use only the neutral table, rather than inventing cuisine imagery.
- Detail shows a compact two-image layout, not a large hero. The official-site link is explicitly where users should check photographs of the actual venue.
- The native dialog supports Close, Escape, backdrop dismissal, previous/next buttons and arrow keys. Its active item is tracked by stable image ID, not an array index. Native modal focus containment is retained. Closing restores focus to the trigger; if an error removed that trigger, restoration waits for render and uses a surviving link/control in the same article or main area.
- Thumbnail and expanded-image errors remove the failed item from the shared gallery. The remaining image can still be opened. If all images fail, a card returns no photo block, and detail shows only a short unavailable notice plus the verified official link, when known. Failed images are not replaced with unverified venue photographs.
- Styling is scoped to the photo component. The component does not change restaurant facts, authentication, storage, database state, publication permissions or selection behavior. Images are served locally; gallery interaction performs no external fetch or embed. Official links open only when selected by the user.

This new component supersedes the old name-hash selection behavior described for `CatalogPhoto` in `docs/dining-imagery.md` only on surfaces that import `RestaurantPhotos`; that older component is not changed by this work.

## Adding actual photographs later

Actual photographs take precedence as a complete gallery over illustrations for the same restaurant ID. Before adding a row, confirm the exact venue and image, rightsholder, source, written permission or applicable license, attribution and any required license link, approval date, and scope covering card/detail/modal use, local hosting and any proposed cropping. Keep permission evidence in the rights record, not only a generic site footer. The manifest requires `status: 'approved'` and `displayScope: 'card-detail-modal'`; an official URL alone is insufficient.

Use unique stable IDs and locally hosted image paths. Do not relax permission scope to fit the type. If permission is limited, update both the rights model and the display filter before adding the asset. Retain photograph-specific attribution on each displayed thumbnail and in the expanded view, with source/license links in the expanded view. Do not put the illustration disclaimer on actual approved venue photography or invent a public license for generated illustrations.

## Verified official destinations

The ten entries in `officialRestaurantGalleries` were checked on 2026-10-23. These are official venue pages or official galleries, including dining-room pages when appropriate. This verification establishes a navigation destination only, not current availability or a license to reuse images. No tracking/prefetch requests or external embeds are introduced.
