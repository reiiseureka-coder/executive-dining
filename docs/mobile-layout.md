# Mobile layout verification

This update keeps the existing ivory/green visual identity, concise enterprise offering and four-city home navigation. Only Nagoya remains enabled. No authentication, signup, data-publication or database permission settings are changed.

## Responsive changes

- Phone body text is generally 14–16px; secondary notices remain at least 12–13px. Form fields use 16px text, avoiding iOS focus zoom triggered by smaller inputs.
- Header/menu controls have 44px targets; primary actions and inputs are 48px. Dialog height follows `dvh` and its contents remain scrollable when the available height is reduced.
- Search bars and long filter selects get full-width rows. Venue fact labels stack above values instead of squeezing Japanese text into narrow columns.
- The home, restaurant and enterprise pages retain their content hierarchy with smaller padding and readable notes/checklists.
- Membership, editorial fields, draft forms, comparison tables and the legacy listing draft receive the same readable controls. Comparison keeps its own horizontal scroll region and a reachable comparison action.
- Admin rating controls are labeled, tag inputs shrink correctly, long chips wrap, and save/reset actions stack on phones.

## Automated and visual checks

`npm run check` runs unit/database permission tests, ESLint and TypeScript/Vite build. `npm run test:e2e` retains the full desktop/mobile flow suite and adds 320, 375, 390, 430 and 768px coverage, including menu/history, no page overflow, minimum form text sizes and a 320×440 login-dialog test.

CI saves screenshots as the `mobile-layout-screenshots` artifact. A separate read-only local reference server uses commit `095f58467f1b42a38ae5af66e4a021f0c6c1c6c0` so home/enterprise before images are from the actual previous source, not reconstructed approximations. Screenshots are review artifacts, not pixel-equality assertions.

The mobile project is Chromium with an iPhone-sized emulated viewport. This does not constitute physical iOS/Safari or real on-screen keyboard verification. The shortened viewport test checks reduced space, not a real device keyboard.
