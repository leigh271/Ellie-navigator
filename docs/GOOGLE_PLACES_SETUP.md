# Optional Google Places location review

The integration uses **`GOOGLE_MAPS_API_KEY`** through an administrator-only command. It is not bundled into Next.js client code and there is no public paid search endpoint. It has not been tested against live Google because no key is configured and the environment blocks the endpoint.

## Configure

1. In Google Cloud, select an authorized project, enable billing and **Places API (New)**. Review current pricing, quotas and applicable terms; set budget alerts and an appropriate request quota.
2. Create a dedicated key restricted to Places API (New). Restrict server IPs where your administration environment has a stable outbound IP. Do not use a browser-referrer key for this server command. Never use a `NEXT_PUBLIC_` variable or paste a secret into chat.
3. In Codex environment settings, add secret **`GOOGLE_MAPS_API_KEY`**. Allow outbound HTTPS to `places.googleapis.com`, plus the official clinic websites needed for independent research. Save/apply the settings, then check a fresh request. A saved draft alone does not prove access is active.
4. Locally, put the variable in ignored `.env.local` or your process environment. The npm command loads `.env.local` without printing the value. Python 3 and Node 24 are used; no new Python packages are required.
5. If configuring Vercel for later server-side administration, add the same name under Project → Settings → Environment Variables for the intended environments. **The current deployed app does not call Google Places**, so adding a Vercel key alone does not activate discovery or require a deployment now. Run the review command in a trusted administration environment where the key is available.

```bash
npm run data:places -- "Broward Community and Family Health Center Lauderhill Florida"
```

The command requests only location/identity/contact fields and returned attributions. Results go to the administrator's terminal for transient review. It does not write a response cache, bulk-import Google locations, change the public directory, fetch reviews or infer clinical services. Avoid redirecting results into committed files or stored logs. Only place IDs may be retained under the applicable storage policy. Google does not establish Pap services, insurance, affordability or booking eligibility.

Do not display Google-sourced content or coordinates on this MapLibre map. Current clinic coordinates remain HRSA sourced. Independently review official location pages before adding official-site facts; retain their URL, scope and actual review date. Any later Google-backed public presentation must first implement Google's required attribution and satisfy current Maps Platform display, caching and data-use restrictions.

Policy references (not independently fetched in this restricted session):

- https://developers.google.com/maps/documentation/places/web-service/policies
- https://developers.google.com/maps/documentation/places/web-service/text-search
- https://cloud.google.com/maps-platform/terms/maps-service-terms

## Add independently reviewed official facts

`data/clinic-enrichment.json` intentionally contains no healthcare assertions yet. Its records use this shape; the following is **synthetic documentation only**, not real clinic evidence:

```json
{
  "id": "existing-source-clinic-id",
  "reviewed": true,
  "facts": {
    "services": ["Pap test"],
    "selfPay": true,
    "insuranceParticipation": [
      {
        "carrier": "Example Carrier",
        "plan": "Example Network",
        "scope": "organization",
        "sourceUrl": "https://example.org/official-insurance-page",
        "checkedAt": "2026-11-07"
      }
    ]
  },
  "sources": [
    {
      "url": "https://example.org/official-insurance-page",
      "title": "Synthetic documentation example — replace with actual official evidence",
      "checkedAt": "2026-11-07",
      "origin": "official-provider",
      "fields": ["Pap test", "selfPay", "participation:Example Carrier:Example Network"]
    }
  ]
}
```

Use separate source entries when different pages support different fields. Only include a service when the page establishes that specific location offers it. An organization-wide insurance list belongs in scope `organization`; it cannot satisfy an exact clinic/network match. Use `location` or `provider-network` only with matching evidence. A carrier without a specific network is not proof of all its plans. Dedicated scheduling phone and external booking require fields `schedulingPhone` and `bookingUrl` respectively, backed by reviewed official pages.

```bash
npm run data:import
npm run data:enrich
npm run test:data
npm test
npm run build
npm run test:e2e
```

The overlay rejects unknown/duplicate IDs, Google-derived medical evidence, missing exact source fields, invalid scopes, unsafe booking links and unsupported service values. The runtime publication contract provides another validation layer. Human review remains essential: structural validation cannot prove the truth of a web page or that an appointment/insurance benefit is currently available.
