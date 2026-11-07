# Ellie Navigator

A responsive women’s healthcare navigation MVP for Broward and Miami-Dade, Florida. An initiative of **Flowers for Women**.

**Women’s health, closer to you.**

## Run locally

Use Node.js 22 LTS or newer (validated here on Node 24.22.1) and npm.

```bash
cd /workspace/Ellie-navigator
npm ci
npm run dev
```

Open the development server on port **3000** using your development environment’s forwarded-port preview, or `http://localhost:3000` on your own machine. This cloud onboarding UI does not expose a localhost preview link. The server binds to `0.0.0.0`.

For a production preview:

```bash
npm run build
npm start
```

## What works

- **Find Care:** service, location, documented-insurance and sliding-fee filters; synchronized MapLibre heart markers and selectable provider cards; favorites; original source details. **The provider dataset is currently empty** because source websites could not be accessed for verification in this environment. The live screen shows clearly labeled official-directory links, never sample clinics. All six services are available in the dropdown. Mobile insurance entry is in Filters.
- **Map:** OpenFreeMap Positron vector style with MapLibre. Attribution is preserved. Controls include zoom, reset and fit-to-providers; provider cards link to directions using their exact stored coordinates. The live map becomes visible once its style is ready, while tiles continue loading. Slow or failed individual tiles show a status message without hiding the map. If the style or WebGL cannot initialize, a clearly labeled, approximate regional illustration replaces the basemap; it is not a navigational map and does not place invented providers.
- **My Care:** browser-local favorites and personal appointment CRUD; month calendar and upcoming list; Google Calendar links; Apple-compatible `.ics` downloads. Uses Eastern Time, including DST. Clinic booking is external and never implied by saving a record. No email, SMS, or push reminders.
- **Ask Ellie:** labeled, deterministic navigation guide. Default messages stay entirely in the browser. Optional server-side OpenAI integration requires a key and explicit user opt-in for each session. No diagnosis or treatment advice.
- **Resources:** original CDC and NIH educational links. Links are references, not reviewed clinical recommendations. External link destinations could not be checked in this restricted environment.

Phase 2 status, source-access evidence and deferred work are documented in [docs/PHASE2_STATUS.md](docs/PHASE2_STATUS.md). All ten requested research candidates are tracked in [docs/provider-research.json](docs/provider-research.json); none is published as verified.

## Known gaps before a public launch

1. **Provider data:** no individual providers are published yet. Follow [DATA_SOURCES.md](DATA_SOURCES.md) to verify and curate records. Do not call the empty directory a live provider search. Map/card/favorite interaction passes an isolated browser test with synthetic fixtures and a local test basemap; it is not yet validated against a populated real-world dataset.
2. **Figma:** the provided file could not be accessed under the environment’s network policy. The current design follows the written brief: locally hosted typography, gradient sans-serif Ellie wordmark, white cards, pastel heart markers, and an iridescent assistant. Direct comparison with Figma is pending.
3. **Live tiles:** `tiles.openfreemap.org` needs to be allowed in the cloud environment. Runtime fallback was exercised; live external tile access was not established here. Production visitors need Internet/WebGL access.
4. **AI:** no API key was present. The rule-based flow and fallback route are tested; the live OpenAI integration is untested. Add platform rate limits and monitoring before enabling a paid API on a public deployment. The default no-key version does not incur API costs.
5. **Privacy:** localStorage is accessible to other users of the same browser profile, is not encrypted by this app, and is not backed up or synced. Store only a generic provider name, date, time, and duration. No medical notes, accounts, or tracking. Users can clear local data in My Care. Calendar export shares the provider and time with the chosen calendar service.
6. **Appointments:** exports create separate calendar events; edits/deletions in Ellie do not update external calendars or clinic bookings. Repeated fall-back times use the first occurrence. Nonexistent spring-forward times are rejected.

## Optional OpenAI setup

Copy `.env.example` to `.env.local` locally and set `OPENAI_API_KEY` through your secure secret manager or Vercel project settings. Never commit it or prefix it with `NEXT_PUBLIC_`.

`OPENAI_MODEL` defaults to `gpt-4.1-mini`. When a key is configured, Ask Ellie offers an unchecked AI opt-in. Only the current message and public directory records go through the server to OpenAI. Chat history, saved appointments and favorites are not sent. The server uses `store: false`, a timeout, streaming request-size limits, JSON shape validation, an origin check, and a per-instance AI request budget (20/minute). This instance budget is not a distributed abuse-prevention system. Medical questions use deterministic boundaries; network/model failures return a labeled rule-based answer. This is not a medical triage system. Do not submit sensitive information.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run format:check
```

The isolated map harness and production map regression tests run on both desktop and mobile profiles. Map tests use deterministic test-only style/tile fixtures; they do not prove live OpenFreeMap access. No synthetic fixture is shipped as provider data.

Browser tests use system Chromium at `/usr/bin/chromium` in this cloud environment. On other machines, install Chromium with Playwright and set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable, or update the launch path to your installed browser. Tests start an isolated production server on port 3100 and never reuse a development server. Playwright uses one worker and desktop plus mobile profiles. Domain-test fixtures are synthetic and are never shipped as provider data.

## Deploy to Vercel

1. Review the local files and commit/push them to `leigh271/Ellie-navigator`.
2. In Vercel, import that GitHub repository. Choose **Next.js** and the repository root. Use the supported Node 24 runtime, `npm ci`, and `npm run build`; leave the output-directory override unset.
3. No API keys are required for the rule-based MVP. If enabling AI, set server-only environment variables and rate limits before deployment. Rebuild after changing the key so the optional AI UI is rendered.
4. Deploy a preview first. Test directory sources, map attribution/tiles, mobile navigation, appointment export, privacy labels, and browser storage. Verify every provider record before calling the directory live.
5. Promote to production after reviewing those checks. Vercel deployment must be completed separately.

## Project layout

- `src/app`: App Router entry, styles, server-only `/api/ask` route
- `src/components`: care discovery, map, calendar, appointment dialog, assistant and resources
- `src/lib`: typed providers, deterministic assistant, calendar utilities and local storage
- `src/data`: reviewed-provider JSON and official directory references
- `tests`: domain checks and Playwright desktop/mobile flows
- `IMPLEMENTATION_PLAN.md`: concise delivery plan

Dependencies are locked in `package-lock.json`. Fonts are bundled from Fontsource; no runtime Google Fonts request is needed. MapLibre is BSD-3-Clause licensed. OpenFreeMap serves OpenMapTiles/OSM-derived data; its style’s attribution control credits the relevant sources. Preserve [OpenFreeMap](https://openfreemap.org/) and [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) attribution in any map changes. Fontsource packages include their upstream font licenses.
