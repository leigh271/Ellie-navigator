# Validation results

Validated in the current cloud instance with Node 24.22.1 and npm 11.9.0.

- Frozen install: `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run format:check` passed.
- `npm run build` passed (Next.js 16.4.5 production build).
- `npm test`: **6 passed**, 0 failed. Covers calendar date validation, Eastern DST conversion, ICS escaping/folding, calendar links, filter semantics, directory structure policy and navigation boundaries. The directory structure check has zero real records to inspect; it does not validate any provider facts.
- `npm run test:e2e`: **9 passed, 1 intentionally skipped**, 0 failed. Eight application/API checks run across desktop/mobile profiles. One desktop component test uses isolated synthetic fixtures and a local empty MapLibre basemap to verify marker/card synchronization and favorite toggles. That component harness is intentionally skipped in the mobile profile; mobile application flows run separately.
- Rendered desktop (1440px) and mobile (390px) screens inspected in Chromium. Application tests check horizontal overflow.

## Not verified

- Individual provider facts: **no providers published**. Official-directory references are shown instead.
- Figma fidelity: outbound access to the supplied Figma file was denied by the network proxy.
- Live OpenFreeMap tiles: the network proxy denied the destination. The visible fallback is explicitly an approximate regional illustration, not a navigational map. The isolated local-basemap test does not prove external tile access.
- Live OpenAI: no key configured. Browser-local rule-based assistant and no-key server fallback are tested.
- Vercel deployment and environment publication: not performed.

Install/start commands and the required domain additions were saved to the environment configuration draft. Saving a draft did not apply its network policy or publish a snapshot. Review the settings before enabling external access; then verify original sources and populate the dataset following DATA_SOURCES.md.
