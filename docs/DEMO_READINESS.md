# Customer demo: real locations, honest service status

## Current readiness

**The general-directory journey is implemented with 14 real HRSA location records. The verified cervical-screening journey is not yet supported by clinical service evidence.**

There are 119 retained candidates, 14 published clinic locations, zero service-verified providers, zero verified insurance-plan acceptances and zero verified online booking links. No candidate is promoted to a women's healthcare provider based on its name or HRSA inclusion alone. The missing 235-row reference-only file was not re-downloaded.

The selected source categories are nine community clinics and five health-system clinics. Private gynecology and vaccination-only categories are not invented. If a later demo needs two per category, obtain separate private-practice and preventive-service evidence; this HRSA-only selection does not establish that balanced quota.

## Fort Lauderdale persona

1. Enter **Fort Lauderdale, FL**, select **Cervical cancer screening**, leave insurance blank, and click **Find Care**. The fields are drafts until submitted.
2. Ellie shows **No service-verified matches yet**, explains that HRSA locations do not establish the requested service, and offers general discovery, broader area, related-service choice and official directories. It never silently substitutes vaccination or general primary care for Pap/HPV screening.
3. Select **Browse general clinics · services unconfirmed**. This explicitly removes the service filter while retaining the location and plan preference. Five selected locations match the supplied Fort Lauderdale postal-city data. The map/sidebar use the same records.
4. Click a heart marker. The card highlights and scrolls into view; mobile returns to the list. Open **View details** to review the original address, source-provided phone and website, source dates and unknown service/plan/cost/booking status.
5. Use **Call Clinic** or a source-provided official website. Inspect the action destination, but do not pretend a visit is confirmed. No Book with Clinic button is shown without a reviewed official booking URL.
6. Save the clinic to My Care. After the user obtains a real clinic confirmation—or while explicitly demonstrating a personal record—select **Save appointment**, enter date/time/duration and reminder, then save. Ellie opens My Care. This action does not contact the clinic.
7. Use the month picker to locate the saved date. Edit/delete records and check persistence after reload in the same browser.
8. **Google:** Add to Google opens an event template. The user reviews it, sets notifications and clicks Save in Google. No Google account connection or automatic sync is claimed.
9. **Apple:** export ICS, import it into the chosen calendar, and verify its date/time/reminder in the actual app. Exported reminder syntax is tested; the OS/app decides display behavior. Changing/deleting a record in Ellie does not update the external calendar.
10. Optionally enable browser reminders, explicitly grant permission and use **Send test reminder**. Check actual device display. Ellie must remain open; there is no closed-browser guarantee, SMS or email.

## Other demonstrated searches

- `Ft Lauderdale`, `Ft. Lauderdale`, `Fort Lauderdale, FL` and `Fort Lauderdale,FL` normalize consistently.
- A source ZIP such as `33313` has an exact clinic match; nearby alternatives can be included and are labeled separately.
- County and clinic-name queries work without external geocoding. City/ZIP search origins are means of unique source coordinates, and a single matching clinic can provide an exact reference point. Distances are approximate straight-line values from that reference, not GPS or driving distances.
- Limited results expand progressively through 10, 25 and 50 miles, within the two counties only. Requested service evidence is still required.
- Insurance is optional. Enter a plan/company name, never a member or policy number. Unknown acceptance stays in a labeled section; documented matching plans rank first. Nonacceptance is excluded only with explicit corresponding source evidence. The current records are all unknown, so a positive acceptance demo cannot be claimed yet.
- Reset filters restores the 14 general-directory entries; an unknown place does not silently become an unrelated city search.

## Manual checks still needed

- Obtain the location-specific exports in [SERVICE_VERIFICATION_NEEDED.md](SERVICE_VERIFICATION_NEEDED.md), review their claims and source dates, and only then run a real service-verified cervical-screening demo.
- Check live geographic tiles, attribution and browser errors on the actual Vercel deployment. Local browser QA uses controlled map responses because this environment blocks the live sources. “Use OpenStreetMap tiles” is a licensed independent alternative, not proof of connectivity here.
- Actually save a Google event and import an Apple event on the demonstration devices; verify reminder settings and permissions. These are not account synchronization features.
- Verify a browser test notification is visibly displayed on the actual device, or use the calendar fallback instead. Headless native-API requests do not establish OS-level display.
- Do not present a rule-based assistant as live OpenAI. Live credentials and a real AI response are not verified here; voice is not implemented.

No patient names, symptoms, medical details, insurance identifiers or credentials should appear in a demo. Use clear test labels for any personal appointment created solely to rehearse the calendar flow; never fabricate a clinic identity or confirmed booking.
