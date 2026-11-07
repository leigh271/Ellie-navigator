# Provider evidence and publication policy

`src/data/providers.json` intentionally contains **zero records**. Outbound access to Figma and official healthcare domains returned proxy HTTP 403 during implementation. No individual provider location, service, insurance plan, fee policy, phone number, or coordinate was source-verified. No records are described as verified, and no fabricated sample providers are visible to users.

The app instead links to official directories in `src/data/directory-sources.json`. These are reference links, not provider records or verified filtered matches. Their destination availability still needs checking with network access:

- Florida DOH Broward: https://broward.floridahealth.gov/locations/
- Florida DOH Miami-Dade: https://miamidade.floridahealth.gov/locations/
- HRSA health-center finder: https://findahealthcenter.hrsa.gov/

Educational reference links are defined in `src/components/resources.tsx` and point to original CDC/NICHD sources. They are not a substitute for individual care.

## Complete the directory

1. Read an official clinic location page or HRSA/DOH entry. Record the exact organization/location name, address, phone, county, and public URL. NPI registration alone does not prove a practice is active or a service is available.
2. Verify each advertised service against the specific location’s official page. Organization-wide service offerings do not prove every branch offers them. Leave unsupported services out.
3. Include only explicitly documented insurance plans. A blank array means unknown, not uninsured-only care. Never infer acceptance from insurance logos elsewhere on a network website.
4. Set `affordability: "sliding-scale"` only if an official source documents the location’s policy. This is not a price quote or guarantee of eligibility. Otherwise use `"unknown"`.
5. Verify WGS84 coordinates in **[longitude, latitude]** order using an authoritative location/map source. Do not guess from a city center. Preserve source attribution and applicable data licenses. Use exact provider locations only when reviewed.
6. Include per-source `url`, `title`, `checkedAt` (the real review date, `YYYY-MM-DD`), and `fields` documenting supported facts. Fields should include `address`, `coordinates`, and the exact service names when relevant. Use real evidence rather than a date entered merely to satisfy the test.
7. Run `npm test`, review the page, click every marker/card, and confirm filters and favorites against the actual data. Recheck at least quarterly and remove stale entries. Availability, pricing and insurance should always be confirmed directly by the user.

## Record shape

See `Provider` in `src/lib/types.ts`. Required fields: `id`, `name`, `kind`, `county`, `address`, `city`, `coordinates`, `services`, `website`, `insurance`, `affordability`, `sources`, `verification: "reviewed"`. `phone` is optional.

Marker kinds are `community` (pink), `private` (lavender), `hospital` (ice blue), and `preventive` (mint). Classification should reflect the source, not imply free care or guaranteed service.

No reviews, star ratings, travel distances, prices, booking slots, availability, or “accepting new patients” status are modeled in this MVP. All clinic bookings happen outside Ellie. A dataset passing structural tests is not evidence that its factual claims were reviewed.
