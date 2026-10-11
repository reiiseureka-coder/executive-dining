# Actual catalog preview and image audit

## Scope

The 10-store catalog remains private and candidate-only. The editorial queue can preview each actual record as a card or detailed factual page before approval. Opening, switching, closing, or reloading the preview performs no mutation and does not change publication gates. It displays the same factual and photo components as the catalog, without pretending that save, reservation, review or approval actions have occurred.

## Photographs

As checked on 2026-10-07, the existing restaurant/fact contracts contain no photograph, photographer, image-license, permitted-use, or image-approval fields. The ten-store fixture contains 61 factual records and no authorized photos. The read-only database audit also confirmed 10 candidates and 61 facts, with no coordinate facts. Source-page links and text-data licenses are not permission to reuse photography.

All actual-store views now show an explicit `写真未登録` area with an official-site link where verified. No sample, generated, unrelated, Google listing, or scraped official-site photo is represented as a restaurant photograph. Opening a preview makes no image request.

For actual photographs, obtain a rights-cleared restaurant/photographer delivery or user-owned images with permission for this service. A future media model should record the restaurant, rights holder, permission evidence, source, license/scope, attribution, allowed transformations, expiration/revocation, alternative text, and editorial approval. No schema/storage/bucket changes, rehosting, uploads, or permission requests were performed in this change.

## Search semantics

The private catalog searches NFKC-normalized text across names, addresses and verified fact values. Multiple space-separated terms are combined with AND; the selected cuisine adds an exact condition. It is textual evidence search, not an availability or boolean facility search: `個室なし` can match `個室`, and unknown is never converted to “no.” The UI explains this and provides a reset control that preserves comparison selections.

Tests use the existing actual-ten-store fixture and keep its candidate status, factual qualifications and source links. They cover all names, combined terms, full-width normalization, cuisine mismatches, empty results, unknown versus explicit-no evidence, reset, detail/back/forward/reload, and read-only editorial preview for every record. Existing suites cover owner denial/expiry, private comparison, and public comparison-link access boundaries. Fixtures are mocked; these do not constitute a new authenticated production smoke test.
