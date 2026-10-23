# Service home and isolated UI demo

The public root explains who Executive Dining is for, which decisions it supports, how to begin, and what it does not do. It remains a service home when database configuration is absent. Live discovery is now `#/find`; the existing public/private catalog, data gates, login and original routes remain separate.

Smartphones have explicit Home / Find navigation, not only a logo or a hidden menu. The new homepage uses 16–18 px explanatory text and a modest heading, with one primary action to an explicitly marked, login-free UI demonstration. It does not present a disconnected search as usable.

## Read-only preview boundary

`preview.html` is a separate Vite entry. It does not mount the live AuthProvider or AppAccessProvider and does not import Supabase or repositories. It renders a fixed copy of the already-public `tests/fixtures/owner-trial-catalog.json`; record status, sources, verification dates and factual strings are preserved. No reviews, ratings or venue photos are invented. Search and comparison update only the URL fragment. The demo cannot submit, reserve, change trial dates, or grant live access.

The demo is explicitly labelled on every view. External official-site links open separately; the interface states that records are not current availability or a booking guarantee. Home and the demo have direct, visible return links.

This work does not alter production, the original feature branch, database settings, Vercel environment variables, authentication settings, or deployment protection. A static demonstration is not proof of live login or backend connectivity.

## Verification

Acceptance includes 390×844 and 1440×1000 screenshots, computed typography, direct URLs/reload, Home → discovery → Home and Home → demo → detail/comparison → Home, search cancellation, unknown/long conditions, notices, three-candidate limit, source disclosure, and absence of Supabase traffic from the isolated demo. Existing authenticated flows remain tested with mocks, not live credentials. Final CI evidence is recorded in the pull request.
