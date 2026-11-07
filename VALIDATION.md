# Current validation results

Validated locally on the production Next.js bundle with system Chromium. These results apply to the review branch, not an independently inspected Vercel deployment.

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm test`: **21 passed**. Covers source-file reconciliation and checksums, publication evidence requirements, search normalization, progressive distances, optional insurance, service distinctions, calendar dates and exports, and assistant boundaries.
- `npm run test:e2e`: **34 passed** across desktop and mobile. Covers search submission, real imported directory records, marker/card synchronization, details and contact links, favorites, personal appointment CRUD, Google Calendar URLs, ICS reminders, notification permissions, map failure/retry, and the attributed alternative map style.
- `npm run test:data`: **6 passed**, validating official enrichment provenance/scopes and a mocked Google request without live credentials.
- Browser tests include insured and self-pay journeys in both counties, all view modes, invalid ZIP handling, synthetic scheduling and the partner preview. Positive Pap/coverage matches remain data-blocked; those tests assert the truthful empty state and explicit general-directory fallback.
- Production browser tests use a dedicated port and controlled tile responses. They establish MapLibre rendering and interaction, not external tile-host availability.
- Importing twice produced identical provider, search-origin and audit outputs. Original uploaded CSV/JSON bytes are preserved and checked by tests.
- The full 34-test browser suite passed; the 10 affected discovery/partner checks were rerun successfully after the final UI refinements.
- Desktop and mobile manual-search screenshots and the mobile partner preview were visually inspected. Browser checks also cover horizontal overflow and accessible control labels.

## Data evidence

The supplied files reconcile to 119 candidates: 25 Broward and 94 Miami-Dade. Fourteen distinct locations are published: 11 Broward and three Miami-Dade. Coordinates and contact fields come from the supplied extract. No service-specific, insurance, affordability or booking evidence was supplied: all corresponding confirmed counts remain zero. See [the import audit](docs/HRSA_IMPORT_AUDIT.json) and [the evidence needed](docs/SERVICE_VERIFICATION_NEEDED.md).

## External checks still needed

The environment proxy returned HTTP 403 before content for official clinic sources, live map hosts, GitHub API and the deployed Vercel site. Therefore:

- No deployed runtime, Vercel build, new preview URL, live map-host availability or independently verified clinic service is claimed.
- Source-provided websites and phone links are preserved; successful calls, website contents and appointment availability were not verified.
- Calendar links/files are tested. Actual Google/Apple account imports and device alarm delivery require a manual check. There is no account synchronization or clinic booking integration.
- Browser reminders require permission and an open running page; background delivery is not guaranteed.
- Live OpenAI and voice were not enabled or tested by this change. The existing rule-based fallback remains available.

Network additions were saved to the cloud configuration draft; they were not published or confirmed applied. PR 2 source history was fetched and reviewed, while its live API metadata was inaccessible. This work preserves that history on a separate review branch.
