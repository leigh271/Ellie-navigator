# Ellie customer-demo readiness

**The complete provider demo is not ready yet.** The reviewed dataset still has zero providers because official source sites are blocked by this cloud environment. Calendar improvements do not establish that provider research, live tiles, live AI, or voice are complete.

The user chose **add-to-calendar links and files for the MVP**, rather than ongoing account synchronization. This document explains what can be demonstrated honestly and what must be completed first.

## Directory gate: ten real locations

Two in each of four categories is eight locations. The target is **ten distinct verified physical locations**: at least two per category, plus two additional verified locations in any category. Include Broward and Miami-Dade; never duplicate a clinic to fill multiple categories.

| Category                      | Minimum | Current reviewed records |
| ----------------------------- | ------: | -----------------------: |
| Community / low-cost          |       2 |                        0 |
| Private gynecology            |       2 |                        0 |
| Hospitals / health systems    |       2 |                        0 |
| Vaccination / preventive care |       2 |                        0 |
| Additional locations          |       2 |                        0 |

The initial ten named research candidates are leads, not the final balanced set: that pool still requires private-practice and preventive-service research. For each selected location, require:

- Current location name and address on an official clinic, DOH, or HRSA source.
- Precise clinic coordinates from an authoritative map/location source, not a city center.
- Current contact phone and official website; location-specific evidence for every listed service.
- Real source review date and per-field evidence in `sources`.
- Booking URL, exact insurance plans and affordability only if documented. Unknown is acceptable; invented claims are not.
- At least one documented plan match if insurance filtering will be demonstrated. A carrier name alone does not prove acceptance of every plan sold by that carrier.

`docs/provider-research.json` tracks the candidates and quota. None is imported into the public provider directory until reviewed. The running network policy still reports no applied custom domains, so the saved source-domain draft has not unblocked research.

## Customer journey rehearsal

1. **Find Care.** Enter a city/county and service. For insurance, enter the company and plan name (for example, Florida Blue PPO), never a member ID, policy number, or other personal insurance identifier. Confirm a documented filter match; clear the plan filter to see other options with unknown acceptance.
2. **Compare a provider.** Select the heart marker and confirm its card highlights. On mobile, marker selection returns to the corresponding list card. Read service and source details. Open directions to the actual clinic. Never present unverified costs, appointment slots or insurance acceptance.
3. **Save a favorite.** Use the heart on a provider card and confirm it appears in My Care, including after a reload in the same browser.
4. **Arrange the actual visit with the clinic.** Open its official website or call its published number. Ellie does not book the visit or verify a booking. Do not simulate a confirmed appointment.
5. **Save the personal appointment.** After a real clinic confirmation—or while clearly demonstrating a personal calendar record—choose “Save appointment” on the card or “Add appointment” in My Care. Enter provider, date, time, duration and desired reminder. No symptoms or medical notes are requested. Times are Eastern, with DST handling.
6. **Show My Care.** Use the month picker to jump to the visit’s month; click the date and confirm the saved record is listed. Edit the record and verify persistence after reload. A source link or favorite alone is not an appointment and contains no visit date/time to add to a calendar.
7. **Google Calendar.** Click “Add to Google.” The user signs in to Google if needed, reviews the prefilled event, chooses notifications on Google’s own event page, and clicks Save. Then verify the event in their Google Calendar. Ellie does not receive a Google sign-in, token, event ID, or confirmation through this link. The reminder preference cannot be transferred reliably by a template URL, so it is not falsely encoded as an unsupported URL parameter.
8. **Apple Calendar.** Export the `.ics` file, open it in Apple Calendar on the demonstration device, choose a destination calendar and import it. Verify the date, time and chosen alert in Apple Calendar. The file contains a standard DISPLAY VALARM for the selected reminder. The calendar application and OS determine whether alerts are honored and displayed. Importing is not an Apple account connection.
9. **Browser reminders, optionally.** Click “Enable browser reminders,” explicitly allow notifications, and click “Send test reminder.” Check the device’s actual notifications. Ellie must stay open; closed/suspended tabs, mobile limitations, browser throttling and Do Not Disturb can prevent or delay delivery. Notifications intentionally omit clinic/provider names. Disabling stops future tab reminders; clearing local data removes opt-in and deduplication records. Calendar events already imported elsewhere are unaffected.
10. **Ask Ellie and Resources.** Demonstrate the labeled rule-based navigator and original-source educational links. Do not describe it as live OpenAI unless credentials and a real response have been tested. Provider matching is not available while the reviewed dataset is empty. Voice is not implemented.

## Acceptance checks before presenting the full demo

- Ten published records satisfy the category quota and source-evidence review.
- The real deployed basemap loads tiles with attribution and has no blocking runtime errors.
- Real provider marker/card selection, directions, filtering and favorites work on desktop and mobile.
- A Google event has actually been saved to the chosen test calendar; no account sync is claimed.
- An ICS file has actually been imported into Apple Calendar, and its alert settings have been inspected.
- A browser test notification has actually appeared on the demonstration device, or the feature is presented as unavailable there and calendar alerts are used instead.
- Calendar edits/deletes in Ellie are explained as local changes, not automatic changes in Google, Apple or the clinic’s booking system. Re-exporting or clicking Google again may create duplicates; review the destination calendar.
- No real patient names, symptoms, insurance member numbers, credentials, or medical details appear in the demo.

## What automated QA can establish

Unit tests validate calendar times, reminder alarm syntax, reminder scheduling windows, deduplication, and strict input handling. Browser tests exercise appointment CRUD/persistence, month selection, reminder export, map behaviors, insurance help text, the actual Chromium Notification constructor, and denied/unsupported browser fallbacks. The notification constructor is wrapped to record the request while still calling the native browser API.

Those tests do **not** establish OS-level display, real Google/Apple imports, real clinic services, real insurance contracts, or the deployed site's live tile availability. They are separate manual/source checks, not unfinished features disguised as working integrations.

## Source access needed

Source pages, live tiles and the deployed site still receive proxy HTTP 403 in this cloud environment. The listed domain changes are saved in the environment draft but not confirmed applied. Apply the source access settings, or provide official location-page exports with authoritative location/map links for review. Do not fill the directory with synthetic test fixtures to make the demo look complete.
