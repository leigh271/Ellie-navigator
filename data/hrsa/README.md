# Supplied HRSA extract

The user supplied `ellie_south_florida_hrsa_clinic_candidates.json` and the matching CSV. These are retained here as `candidates.json` and `candidates.csv`, byte-for-byte. `.gitattributes` prevents line-ending conversion; Prettier excludes these immutable files. SHA-256 checksums are in `docs/HRSA_IMPORT_AUDIT.json`.

The files contain 119 candidate site records: 25 Broward and 94 Miami-Dade, all marked Active in the CSV, permanent and non-school. The source record date is `11/06/2026` as supplied. There is no historical series to validate changes over time. The full 235-record reference file was not uploaded; it was not needed, downloaded, or counted as imported.

Original names, addresses, city labels, ZIP strings, telephone formatting (including extensions), website nulls/URLs, `[longitude, latitude]` coordinates and source metadata are preserved. IDs such as `hrsa-site-0003` are identifiers from this supplied extract, not asserted federal registry IDs. The files' provenance is the user's official HRSA export; live HRSA/source sites were not independently re-downloaded.

## Reproduce the selected directory

```bash
npm run data:import
npm test
npm run build
```

Python 3's standard library is required for curation and CSV/JSON reconciliation; the deployed Next.js application does not run Python or fetch HRSA during search. `scripts/import_hrsa.py` publishes the 14 explicit selected IDs to `src/data/providers.json`, preserves unrelated existing records and any separately sourced manual service reviews, and generates `src/data/search-areas.json` and the audit. Repeated runs have identical output hashes. The extract review date is fixed to the actual review date; do not advance it to imply a new clinic-site review.

The 14 selected locations emphasize Fort Lauderdale and nearby Broward communities (11 sites), with three Miami-Dade CHI sites. Dental-only and behavioral/support-unit candidates are not selected. Five selected locations are classified as health-system clinics because the supplied parent organization is NORTH BROWARD HOSPITAL DISTRICT; nine are community health-center sites. No private gynecology or vaccination category is manufactured from missing service evidence.

All imported records are `verification: location`, meaning location facts are sourced from the supplied HRSA extract. They have no service, insurance, cost or booking claims added by the importer. Per-field source evidence is required before such claims can be published. A location-only record may appear in general discovery but cannot satisfy a medical-service filter.

## Quality findings

- No duplicate IDs or duplicate normalized name/address/city keys.
- CSV and JSON agree on mapped identity, organization, contact, location and source fields.
- Coordinates are finite, correctly ordered and within coarse South Florida bounds; this is not a polygon-based county-boundary verification.
- 53 source records have no website; four of the 14 selected records have no website. No URLs are invented; all selected records have source-provided phone numbers.
- Seven coordinate groups contain 34 source records. Repeated names and shared coordinates are not automatically duplicate sites; distinct address/unit records are retained in the source files. No such coordinate cluster was selected for publication.
- Three Memorial-named sites list NORTH BROWARD HOSPITAL DISTRICT as the parent in the supplied extract. That association needs independent review; original fields are retained and these candidates are excluded from the selected set.
- Original HRSA city labels can be postal cities: for example, the Lauderhill-named clinic has Fort Lauderdale as its supplied city. Ellie preserves the city rather than silently rewriting the source.

Search origins for known cities and ZIPs are means of unique source coordinates in that area and are explicitly approximate. A query matching a single clinic can use that clinic's actual point as a reference. These origins are used only for estimated straight-line proximity; they are not patient GPS positions or replacement clinic coordinates.
