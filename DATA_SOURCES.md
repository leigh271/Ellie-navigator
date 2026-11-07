# Clinic evidence and publication policy

The supplied official HRSA candidate CSV/JSON now provide the clinic identity/location foundation. **119 candidate records are retained; 14 selected location-sourced records are published** in `src/data/providers.json`. They are not asserted to be 14 service-verified women's healthcare providers.

See [the source package](data/hrsa/README.md), [exact audit results](docs/HRSA_IMPORT_AUDIT.json) and [service-verification requests](docs/SERVICE_VERIFICATION_NEEDED.md). No national dataset was downloaded again. All public directory records are in Broward or Miami-Dade.

## Verification levels

- **Location sourced:** the supplied HRSA record supports name, address, city, county, ZIP, phone, coordinates and any provided website. `verification: location` explicitly distinguishes this from independent clinic-site review. The source record date and extract review date are separate.
- **Service verified:** a location-specific official source explicitly supports the service. Add its exact service name to `services` and to the supporting source's `fields`. A clinic name, hospital ownership or HRSA inclusion is not service evidence.
- **Insurance verified:** explicit plan names require location-specific source evidence. Add the named plans and `insurance:<plan>` fields. Confirmed nonacceptance requires a corresponding `insuranceDeclined:<plan>` field. Unlisted plans remain unknown, never automatically rejected or accepted.
- **Booking verified:** add `bookingUrl` only after the official scheduling destination is source-reviewed, with a corresponding source field. Until then, display Call Clinic or the supplied website, not a pretend booking button.
- **Unknown:** keep missing websites null, services/plans empty, costs unknown and booking links absent. The UI labels these states explicitly.

Cervical screening, Pap tests and HPV testing are distinct. Broad cervical-screening searches may include a specifically confirmed Pap or HPV test, but a general cervical-screening claim does not establish either specific test. Vaccination cannot substitute for screening.

## Review a clinic service

Read its official location page or an authoritative DOH/HRSA supplement that ties the named service to the exact location. Save the source URL, actual review date, and fields supported. Do not infer branch-level services from a network-wide homepage. Keep record dates unchanged. The uploaded HRSA coordinates must remain precise `[longitude, latitude]` values; no city centers or guessed geocoding are used for clinic markers.

The publication contract in `src/lib/provider-schema.ts` rejects malformed coordinates, duplicate IDs and unsupported service/insurance/affordability claims. Data tests reconcile both uploads and check original source values. Passing structural tests is not independent factual verification; manual evidence review is still required.

## Basemap sources and attribution

Default: OpenFreeMap Positron vector style, rendered by MapLibre GL JS. Preserve the attribution embedded in that style. If it fails, the UI offers an independent OpenStreetMap raster mode at `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, with visible OpenStreetMap attribution and a copyright link. This alternative is for ordinary interactive viewing, not offline downloads, bulk prefetching or unrestricted high-volume use.

Follow the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) and [OSM attribution/license requirements](https://www.openstreetmap.org/copyright). The browser uses normal requests and caching; do not suppress the Referer or add cache-bypassing/bulk-download code. Choose a suitably hosted/contracted tile service before scaling beyond an appropriate public-service usage level. OpenFreeMap and OSM are independent endpoints; a cloud egress restriction can block both, which code cannot bypass.

Browser tests exercise primary and alternative rendering, attribution, retries and real imported clinic positions using controlled map responses. Live third-party tile availability remains unverified from this environment because outbound requests are denied. If neither source is reachable or WebGL is unavailable, a labeled regional illustration appears and the real clinic list remains usable; clinics are never placed on that non-geographic illustration as fake markers.
