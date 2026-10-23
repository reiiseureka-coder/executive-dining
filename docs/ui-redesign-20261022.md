# Executive Dining: editorial UI redesign

## Scope and status

This document records the local pre-publication snapshot on 2026-10-22. Later preview and CI outcomes are tracked in the review pull request.

Local implementation against `feat/nagoya-foundation` at `ae9aad234eed022128edeb9b552749b25dfb7d98`. All 158 baseline file blobs were checked against the upstream Git tree with zero mismatches. No remote commit, branch, pull request, deployment, database write, or permission change was made.

Implementation and static checks are complete. Real-browser interaction and visual acceptance are **not complete**. This is a reviewable source deliverable, not a production-ready sign-off.

## Design changes

- A quieter editorial homepage: one existing stock dining photograph, a clear search action, three lightweight discovery links, and short on-demand explanations.
- Remove the repeated generated imagery from the homepage discovery section and real restaurant list/detail pages. The imagery remains only in explicitly marked legacy demos and editorial previews.
- Remove the grid of three unavailable cities; make the currently supported Nagoya path the clear area entry.
- Replace tall restaurant cards with name/address-led rows. Keep details, comparison and candidate-saving available. Full private-room and pricing conditions open on demand, without truncating or rewriting them.
- Operational notices remain immediately visible, outside collapsed condition sections.
- Public search's secondary filters become a disclosure. Active filter count stays visible; search, reset, map, saved-candidate and URL state handling remain intact.
- Business and restaurant information pages use thin rules, short introductions and progressive disclosure rather than nested cards. Copy failures reveal the original text for manual copying.
- Preserve existing authentication, authorization, publication gates, source evidence, comparison limits, draft safety, history and list-position restoration handlers.

## References consulted on 2026-10-22

- [MICHELIN Guide Japan](https://guide.michelin.com/jp/ja): separation between discovery/editorial content and detailed listing information.
- [OMAKASE](https://omakase.in/): restrained restaurant-name-first discovery with a small search vocabulary.
- [TableCheck](https://www.tablecheck.com/ja/japan): search as a clear primary task, with secondary discovery paths below it.

These were pattern references, not copied layouts or assets. No restaurant claims, reviews, ratings, pricing, or rights to third-party venue photographs were inferred from them. The existing homepage stock photograph retains its illustrative label.

## Verification

- `npm run check`: **passed**, 146 tests, zero failures; ESLint; TypeScript project build; Vite production build.
- `node qa/structure-check.mjs`: **passed**, 12 server-rendered assertions for information hierarchy and preservation of full pricing/room/operating-notice text.
- `npx playwright test --list`: **passed**, 182 tests discovered in 16 files. Discovery does not execute browser tests.
- `git diff --check`: **passed**.
- Independent static review: no concrete high-severity authentication/data regression found. Stale UI assertions were updated for the new layout while preserving history/logout/filter coverage.
- Existing warning: the lazy-loaded map bundle exceeds 500 kB. It was already present before this change.

### Browser verification blocker

Chromium could not launch in the cloud shell because the environment disallows its Unix socket operation (`socket() failed: Operation not permitted`). An elevated launch then failed before execution due to a read-only filesystem mount error. The separate cloud browser could not reach the local development port (`ERR_CONNECTION_REFUSED`). No bypass was attempted after the blocker was confirmed.

**No before/after screenshots were produced. No 390 px or 1440 px visual pass is claimed. No real browser flow is claimed to have passed.**

### Prepared browser acceptance

`tests/e2e/editorial-redesign.spec.ts` covers explicit 390 px and 1440 px viewports, repeated login open/close/Escape, no residual scroll lock, search history, on-demand condition text, full price caveats, comparison selection, detail/list return and focus restoration, horizontal overflow, and screenshot capture. Existing suites retain authentication interruption, 320–430 px layout, maps, drafts, history and repeated-flow coverage.

On a browser-capable environment:

1. `npm ci`
2. `npx playwright install --with-deps chromium`
3. `npm run check`
4. `npm run test:e2e`
5. Review the actual `redesign-home`, `redesign-list`, `redesign-detail` and `redesign-empty` screenshots at both target widths, then fix any layout issues before approval.

## Publication boundary

The existing base commit has a successful Vercel deployment status. The behavior and access protections for a newly created preview branch have not been verified. With separate approval, the next step is a new branch based on the pinned SHA, a draft PR to run existing CI, and verification of the resulting commit's preview status. Main, production publication and database settings must remain unchanged unless explicitly authorized.
