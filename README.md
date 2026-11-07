# Ellie Navigator

A responsive South Florida healthcare navigation MVP, an initiative of **Flowers for Women**. **Women’s health, closer to you.**

See the [manual discovery update and remaining gaps](docs/MANUAL_DISCOVERY_UPDATE.md) for the latest work.

## Current scope

- **119 uploaded HRSA candidates retained**, reconciled between CSV and JSON (25 Broward, 94 Miami-Dade).
- **14 real location-sourced clinics published**: 11 Broward and 3 Miami-Dade. Original names, addresses, ZIPs, phones, websites/nulls and precise HRSA coordinates are preserved.
- **Zero service-verified, insurance-verified or booking-verified locations at present.** HRSA inclusion is not evidence of women's healthcare services. General directory records are clearly labeled; they cannot satisfy a service-specific filter without location-specific evidence.
- Search supports city/state variations, ZIP, county and clinic names, separate county/carrier/plan controls, self-pay preferences, supported categories, and map/list/combined views. Find Care applies draft filters. Nearby expansion uses 10/25/50-mile straight-line distances with an explicitly described search origin. Insurance is optional; unknown acceptance remains visible and separate from documented plan matches.
- MapLibre heart markers synchronize with cards and details. Colors distinguish community and health-system locations where supported; no private or vaccination classification is invented to fill the legend. Zoom, fit, recenter, mobile map/list, Google and Apple directions are included.
- Contact uses a verified booking link only when evidence exists; otherwise Call Clinic or a source-provided website. Currently the clinics have phone actions, not pretend booking buttons.
- My Care favorites, appointment CRUD, month picker, Google Calendar templates, Apple-compatible ICS reminders and opt-in tab reminders remain. These do not connect calendar accounts or book clinic appointments.

Read [DATA_SOURCES.md](DATA_SOURCES.md), [import audit](docs/HRSA_IMPORT_AUDIT.json), [service-page requests](docs/SERVICE_VERIFICATION_NEEDED.md), and [the demo walkthrough](docs/DEMO_READINESS.md).

## Run locally

Use Node 22+ (validated on Node 24.22.1) and npm. Python 3 is needed only for offline import/data QA, not for Vercel runtime.

```bash
cd /workspace/Ellie-navigator
npm ci
npm run dev
```

The development server binds port **3000** on `0.0.0.0`. Use your environment's forwarded-port preview; this onboarding UI does not supply a localhost preview link. On your own machine, open the local development server in a browser.

```bash
npm run build
npm start
```

## Reproduce the offline directory

```bash
npm run data:import
npm run data:enrich
npm run test:data
npm test
npm run build
```

The importer reads only `data/hrsa/candidates.json` and `candidates.csv`, validates types/keys/ranges/source metadata and reconciles both files by location key. It preserves unrelated provider records and separately sourced manual reviews. It does not fetch the national dataset or require live HRSA during user searches. Repeated runs produce identical output hashes. See [source package notes](data/hrsa/README.md).

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run format:check
```

Browser tests start an isolated production server on port **3100** and refuse to reuse an existing server. They use system Chromium (`/usr/bin/chromium`); on another machine set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to your installed Chromium executable. Tests cover desktop and mobile, map failure/retry/alternative attribution, real imported clinic identities, service-honest fallback, optional insurance, contact URLs, favorites, appointments and calendar exports. Controlled tile responses do not establish third-party live tile availability. Synthetic service/insurance fixtures exist only in tests.

## Maps

Default: OpenFreeMap Positron vector style. If unavailable, “Use OpenStreetMap tiles” switches to an independent raster source. Both preserve source attribution. Requests must be allowed to `tiles.openfreemap.org` and, for the alternative, `tile.openstreetmap.org`; no map API key is needed. See [tile licensing and usage conditions](DATA_SOURCES.md#basemap-sources-and-attribution). The alternative is not an unlimited bulk/offline tile service.

If neither source is reachable or WebGL cannot initialize, the labeled regional illustration is not a geographic map. The clinic list and directions remain usable, and fake clinic markers are never placed on that illustration. Live tile and deployed-site access remain blocked in this cloud environment; validate the real deployment separately.

## Calendars and privacy

Appointments store only a generic clinic name, date, time, duration and optional reminder in browser localStorage. Do not enter symptoms, patient names, medical notes or insurance member/policy identifiers. This local data is not encrypted by Ellie, backed up or synced; avoid shared devices. My Care includes a clear-data control.

Google opens a prefilled event that the user must save. Choose Google notifications on Google's event page; unsupported reminder URL parameters are not invented. Apple-compatible ICS files include the selected DISPLAY alarm, which must be imported and checked in the destination app. Export shares the chosen clinic name/time with that calendar. Edits/deletes in Ellie do not update external calendars or clinic bookings; repeated exports may create duplicates. Times use America/New_York including DST; repeated fall-back times use the first occurrence.

Optional browser reminders explicitly request notification permission, use generic wording without clinic names and require Ellie to remain open. Closed or suspended tabs, mobile/browser/OS limits and Do Not Disturb can prevent delivery. A test button requests a notification; verify actual display on the demonstration device. No email, SMS, service-worker push or account synchronization is implemented.

## Clinic administration and enrichment

`/partners` is a labeled local prototype for clinic claims, listing staging, fictional slots/requests and demo activity counts. It creates no accounts, verifies no affiliation, persists no clinic changes and receives no patient requests. Profile scheduling previews are synthetic and separate from My Care. Live partner authorization and integrations are future work.

Optional administrator-only Google Places review reads `GOOGLE_MAPS_API_KEY`; [setup, policy boundaries and official-source import steps](docs/GOOGLE_PLACES_SETUP.md) are documented. No key is configured and live Google calls are untested. The patient app does not call Places.

## Optional OpenAI

The default labeled rule-based navigator works in-browser without sending chat to a server. It distinguishes HRSA location records from unconfirmed services and does not diagnose or recommend treatment.

For optional AI, put `OPENAI_API_KEY` in secure server-side Vercel environment variables (locally, `.env.local`; never commit it or use `NEXT_PUBLIC_`). `OPENAI_MODEL` defaults to `gpt-4.1-mini`. Redeploy after changing availability so the opt-in UI is rebuilt. Explicit user opt-in sends only the current message and public clinic directory through `/api/ask`; chat history, favorites and appointments are not forwarded. The route has origin/input/streaming-size checks, a timeout, `store:false`, and a per-instance AI budget; configure distributed rate limits before exposing a paid API widely. Live OpenAI is not verified in this environment. Voice is outside this implementation.

## GitHub and Vercel

This work extends the two commits from PR **#2**, fetched and reviewed via Git on `origin/pr-2`. The current review branch is `feature/hrsa-directory-final-mvp`; original PR history and unrelated main-branch work are preserved. GitHub API access is blocked here, so live PR comments/state are not independently read. Do not merge or deploy without approval. After approval, merge the reviewed branch normally; do not force-push over unrelated work.

In Vercel, import `leigh271/Ellie-navigator`, select Next.js, the repository root, Node 24, `npm ci`, and `npm run build`; leave the output override unset. No API keys are required for the general directory and rule-based MVP. Verify the selected deployment branch and deployment status before presenting. A source push is not proof of a successful Vercel build or a new preview URL.

## Project layout

- `data/hrsa`: immutable supplied files and provenance notes
- `scripts/import_hrsa.py`: repeatable validation/import
- `src/data`: selected providers and source-derived search origins
- `src/lib`: publication contract, evidence checks, search, map and calendar logic
- `src/components`: responsive Find Care, source details, My Care and assistant
- `tests`: import/search contracts and browser journeys

Fonts are locally bundled from Fontsource. MapLibre is BSD-3-Clause licensed. Preserve all font, map and source attribution in subsequent changes.
