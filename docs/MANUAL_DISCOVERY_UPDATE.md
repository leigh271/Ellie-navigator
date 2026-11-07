# South Florida manual discovery update

This update extends `feature/hrsa-directory-final-mvp`; it does not rebuild the app, change main, merge a pull request or initiate deployment. Existing My Care, reminders, branding, navigation and Ask Ellie are preserved. No new chatbot features were added.

## Delivered

| Area                  | Result                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Manual search         | City/ZIP/clinic query, explicit service, county, separate carrier and exact-plan input, self-pay preference, documented sliding-scale filter, category, saved-only and radius controls. Find Care applies draft fields to the same cards and map result array.                                                                                                                                                                 |
| Counties              | Broward, Miami-Dade and All South Florida. Nearby expansion respects the selected county; it does not override geography or substitute a different service.                                                                                                                                                                                                                                                                    |
| Ranking               | Only documented requested services qualify. Exact area and straight-line proximity precede documented insurance/self-pay matches and additional source verification. No paid ranking. Unknown insurance/payment is labeled; explicit documented nonacceptance is excluded.                                                                                                                                                     |
| Categories            | Independent facility marker, evidence-backed clinical service tags and affordability evidence. Ten requested directory categories can overlap. A community health center is not assumed to offer Pap tests, gynecology or low-cost care.                                                                                                                                                                                       |
| Insurance             | Requested carrier choices plus any additional documented labels. Exact string matching after trimming/case normalization; Florida Blue, BCBS and unrelated networks are not aliases. Organization participation is displayed as organization-only and cannot establish a location/network match. Location or provider-network scope is retained. Carrier participation never guarantees a particular plan or visit is covered. |
| Map                   | Existing MapLibre heart markers, precise HRSA coordinates, selected card/profile sync, fit, zoom, recenter, directions, legend, attributed OSM alternative and explicit failure state retained. Map, list and combined layout controls added.                                                                                                                                                                                  |
| Profiles              | Address/county, facility/category separation, confirmed services or unknown, sourced participation scope, self-pay/sliding scale, Medicare/Medicaid status, general versus dedicated scheduling phone, source dates, official links, favorites and personal calendar action.                                                                                                                                                   |
| Phone scheduling      | All 14 records have source-listed general clinic phone links. A dedicated scheduling line has not been verified. The interface explains that the clinic must confirm how to schedule. Calls were not placed.                                                                                                                                                                                                                   |
| External scheduling   | Implemented evidence gate: no Book action without a reviewed clinic-specific URL. **Zero verified booking URLs** currently. No availability is invented.                                                                                                                                                                                                                                                                       |
| Integrated scheduling | Clearly labeled fictional slots and synthetic request simulation in profiles. Local UI only; no clinic request, real slot, confirmation or My Care appointment is generated.                                                                                                                                                                                                                                                   |
| Partner portal        | `/partners` previews signup/claim review, listing edits, service/insurance/network fields, booking link staging, synthetic slots/requests and local demo activity counts. No live accounts, affiliation verification, clinic permissions, persistence, real patient requests or billing. Public records cannot be changed from it.                                                                                             |
| Repeatable enrichment | Admin-only Python Places review command and separately validated official-source enrichment overlay. HRSA import preserves independently reviewed fields. Keys remain outside browser code.                                                                                                                                                                                                                                    |

## Clinic records and evidence

**No new clinic records or healthcare claims were added in this update.** The prior source-preserved directory remains 14 distinct locations (11 Broward, 3 Miami-Dade), selected from 119 reconciled candidates (25 Broward, 94 Miami-Dade). Marker assignments remain nine community health centers and five health-system locations. There are no private or vaccination-only assignments added to fill the legend.

Zero locations currently have verified Pap/service, plan/network, self-pay/sliding-scale, dedicated scheduling phone or online booking evidence. HRSA provides identity/location/contact provenance, not those clinical facts. All clinical category tags and affordability matches remain empty until supported. Google discovery cannot fill these fields.

### Initial official-source research queue

Prioritize these ten of the existing 14, without removing or capping the rest of the directory:

| Location                                                    | County     | Official starting website from supplied HRSA source                      |
| ----------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| BCFHC — Lauderhill                                          | Broward    | https://www.bcfhc.org                                                    |
| BCFHC — Hollywood                                           | Broward    | https://www.bcfhc.org                                                    |
| BCFHC — Pompano Medical                                     | Broward    | https://www.bcfhc.org                                                    |
| BCFHC — West Park                                           | Broward    | https://www.bcfhc.org                                                    |
| Cora E. Braynon Family Health Center                        | Broward    | https://www.browardhealth.org                                            |
| Maternity Care Center                                       | Broward    | https://www.browardhealth.org/health-resources/broward-healthpoint       |
| Care Resource at Ft. Lauderdale (source city Wilton Manors) | Broward    | https://www.careresource.org                                             |
| Doris Ison Health Center                                    | Miami-Dade | https://www.chisouthfl.org                                               |
| Coconut Grove Health Center                                 | Miami-Dade | https://www.chisouthfl.org                                               |
| South Miami Health Center                                   | Miami-Dade | Website absent in source; investigate CHI's official locations directory |

These are research targets, not newly verified service matches. The [source request checklist](SERVICE_VERIFICATION_NEEDED.md) lists exact addresses and missing evidence. Official starting sites and Google Places returned proxy HTTP 403 on this run; the observed environment still had no custom domains or secret bindings applied. Research must resume after the user's settings take effect. Never give a source a live review date when only its URL was supplied.

## Maya acceptance journeys

Automated desktop/mobile tests exercise both counties with Pap test + Florida Blue and Pap test + Uninsured / Self-Pay. With current evidence, both correctly show **no service-verified matches**, zero matching markers, and an explicit choice to browse general clinics. General results retain county constraints, show unknown coverage/payment, synchronize markers, expose sourced clinic phone links, and label simulated scheduling. Unknown ZIP and no verified booking are covered too.

The end-to-end journey to a **documented Pap service and insured/affordable provider** is still **data-blocked**, not accepted as complete. The general-directory path is functional. Source overlays and a rerun of these tests are required before claiming either successful clinical matching scenario.

## Required keys and setup

No key is required for the current HRSA directory, OpenFreeMap/OSM map or rule-based assistant. For optional Google location discovery, configure **`GOOGLE_MAPS_API_KEY`**, as described in [GOOGLE_PLACES_SETUP.md](GOOGLE_PLACES_SETUP.md). It is not configured or live-tested here. `OPENAI_API_KEY` remains optional and unrelated to this update.

## Review, merge and deploy — approval required

1. Review the feature branch and the changes against main on GitHub. Existing PR #2 history is retained; do not duplicate its commits by separately cherry-picking them.
2. Create a pull request with base `main` and compare `feature/hrsa-directory-final-mvp` when ready for review. Check for intervening main changes, resolve conflicts and rerun checks.
3. **Obtain approval before merging or deploying.** After approval, merge through GitHub normally, without force-pushing main.
4. For Vercel, keep framework Next.js, repository root, Node 24, `npm ci`, `npm run build`, and no output override. Review project deployment permissions/settings before triggering a build. No database is needed for this static directory/local-calendar MVP; partner access remains a prototype.
5. Validate real map hosts, console errors, both county journeys, clinic links and calendar imports on the resulting preview before production. No new preview URL or successful deployed build is claimed here.

Live partner rollout additionally requires authenticated backend accounts, reviewed affiliation, tenant authorization, audit trails, durable storage and clinic-approved scheduling integration. No subscription or payment work is included.
