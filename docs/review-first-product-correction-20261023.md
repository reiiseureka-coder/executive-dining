# Review-first product correction

Executive Dining is a dining-specific review service for people arranging business meals and client hospitality. Earlier layout work over-emphasized official conditions and comparison. Readability and working controls did not establish that the service purpose was clear.

## Current hierarchy

- Home: identify the dining-review service, explain who it is for, then offer restaurant discovery. Current connection and posting availability are secondary, truthful state messages.
- Public discovery/list: restaurant identity, actual published review count and first actual review excerpt (or honest zero), then complete price/private-room information.
- Public detail: restaurant identity and dining reviews before official facts. Existing browser-only draft/report controls retain their behavior.
- Private owner catalog: state that public reviews are not displayed. Do not infer zero public reviews from a private response that contains no review corpus.
- Standalone demo: the same review-first structure with an explicit empty review state scoped to the demo. Its official-record fixture is unchanged. No invented review, score, photo, author profile or simulated five-axis rating is added.

## Availability boundaries

General review submission and membership registration remain in preparation. Demo pages do not initialize authentication, query a backend, write storage, or send requests other than static reads. Existing production, feature branch, database state, trial dates, deployment environment variables and authentication settings are unchanged.

## Acceptance evidence

CI tests at 390px and 1440px check identity/CTA in the first viewport, DOM and rendered review-before-facts order, 16px review body/count and condition values, genuine empty states, actual fixture review excerpts, navigation/back/reload, and static-demo request/storage isolation. Public review test examples are synthetic intercepted test responses, never production records. Before screenshots are pinned to a64856c04ef6749a6015eb3cc62312be75a91579. Passing automation is not a substitute for reviewing the rendered product against this purpose.
