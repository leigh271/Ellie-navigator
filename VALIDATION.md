# Current validation results

Validated locally with Node 24.22.1, npm 11.9.0, Next.js 16.4.5 and system Chromium. See [Phase 2 status](docs/PHASE2_STATUS.md) for scope and blockers.

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run format:check`: passed.
- `npm run build`: passed.
- `npm test`: **7 passed**, 0 failed or skipped. Covers Eastern/DST times, invalid dates, ICS escaping/folding and durations, Google Calendar template dates, filter semantics, assistant boundaries and exact coordinate order in directions URLs. The provider structural check has zero real records to inspect; it verifies no healthcare facts.
- `npm run test:e2e`: **16 passed**, 0 failed or skipped. Eight application/API checks run across desktop/mobile. Six production map checks cover slow tiles, source attribution, resource failures and style retries. Two isolated component tests cover stable keyboard focus, selection/card synchronization, favorites, exact-coordinate directions, filtering and hidden-panel resizing. Additional fit/zoom assertions were rerun successfully in both profiles after the full suite.
- Production browser tests run on a dedicated port **3100**, refuse existing servers and use the actual Next.js production bundle. Synthetic style/tile responses and synthetic provider fixtures are confined to tests and never shipped as real clinic data.
- Rendered desktop (1440px) and mobile (390px) screens inspected in Chromium. Layout tests check horizontal overflow. Branding tests verify the sans-serif wordmark and absence of sparkle elements.

## External validation still blocked

- Deployed Vercel site: curl CONNECT HTTP 403 and Chromium `net::ERR_TUNNEL_CONNECTION_FAILED` before any app document. No deployed runtime behavior or deployed root cause can be inferred from these failures.
- All four starting provider sources: proxy HTTP 403 before source content. Ten user-supplied candidates are tracked in `docs/provider-research.json`; **zero verified providers are published**.
- Real OpenFreeMap style/tiles: access denied by the environment proxy. Fixture-based rendering and failure/retry tests do not establish live tile availability.
- Figma: direct design inspection remains unavailable under the network policy.
- Live OpenAI and voice: not tested or enabled by this change. Existing no-key fallback remains tested.
- Real calendar accounts: no Google/Apple account connection or event creation was attempted. URL/export behavior is tested, including appointment persistence and CRUD. No clinic booking or reminders are claimed.
- Vercel production deployment/promotion and cloud environment publication: not performed for Phase 2.

Initial browser attempts reused a stale development server after build output changed. Those results were discarded. The stale server was stopped, the runner was isolated, and the production checks above passed. A first tile-error test used HTTP 404, which MapLibre intentionally treats as missing tile coverage and retries via parent tiles; the resource-failure case was corrected to HTTP 503 to exercise its documented error event without weakening the visibility assertion.

Network additions are saved in the environment configuration draft, preserving existing domains. They are not confirmed applied or published. Provider verification and deployed-site inspection must resume once access is available, before progressing to the user's live-AI/voice/calendar enhancement stage.
