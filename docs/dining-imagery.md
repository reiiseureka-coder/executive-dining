# Illustrative dining images

Created 2026-10-09 for the requested temporary imagery, using OpenAI's built-in image generation tool. No third-party restaurant photograph, reference image, trademark, person, or purchased asset was supplied. These are fictional/generated illustrations, not documentation of any venue, dish, room, menu, or private-room availability. No claim of exclusive copyright is made.

## Assets and prompts

- `public/images/dining-japanese.webp`: fictional Japanese seasonal meal, ceramic plates with grilled fish, vegetables and rice on warm wood, soft side light, restrained editorial photograph, no text, people or logos.
- `public/images/dining-chinese.webp`: fictional dim sum and vegetables on dark wood, bamboo steamer, refined minimal editorial styling, no text, people or logos.
- `public/images/dining-room.webp`: fictional quiet dining room, oak table, linen, two glasses, green plants, ivory plaster and soft daylight, no people, text, logos or recognizable architecture.

Generated landscape originals were visually inspected, then resized/re-encoded as 1200×800 WebP for delivery (approximately 87–123 KB each). No retouching of a real restaurant image occurred. They are served locally without a new external image provider.

## Display contract

`catalogImagery` chooses a generic cuisine image from the verified genre text, falling back to the generic table. A stable name hash also assigns the neutral table image to a subset, so adjacent cards need not repeat one food image. This is purely decorative and never evidence of a venue’s interior. It does not modify restaurant data. `CatalogPhoto` renders the same image and visible disclaimer on home, real catalog cards, details and editorial previews. Images carry both an “イメージ” label and an explicit generated/not-the-actual-venue-or-food caption and alt. Existing demo and hero photographs are unchanged. The current real-catalog contract contains no licensed photo field, so there are no real-catalog photos to replace. A future verified photo implementation must take precedence over this fallback and retain its own rights evidence.

Home uses at most three accessible real records in neutral Japanese name order. Private records are fetched via the existing authorized RPC only for the authenticated invited account, held only in component memory, cleared at expiry and discarded on account change/logout. No records or IDs are bundled into the frontend. If no accessible records exist, three generic image/search cards are shown instead; they contain no invented restaurant, rating, price, availability or private facts. No database/authentication/publication setting changed.
