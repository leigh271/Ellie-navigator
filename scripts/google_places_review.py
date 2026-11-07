#!/usr/bin/env python3
"""Transient Places API (New) location review. Never imports Google facts into MapLibre.
Requires explicit invocation; requests may incur Google charges. No key or response cache.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'
FIELDS = 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.attributions'

def search(query, api_key):
    if not api_key:
        raise ValueError('Set GOOGLE_MAPS_API_KEY securely in the shell environment. Never pass a key as an argument.')
    body = json.dumps({'textQuery': query, 'regionCode':'US', 'languageCode':'en',
        'pageSize':5, 'locationRestriction':{'rectangle':{'low':{'latitude':25.1,'longitude':-81},'high':{'latitude':26.5,'longitude':-79.8}}}}).encode()
    request = urllib.request.Request(ENDPOINT, data=body, headers={
        'Content-Type':'application/json', 'X-Goog-Api-Key':api_key, 'X-Goog-FieldMask':FIELDS}, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            payload = json.load(response)
    except urllib.error.HTTPError as error:
        # Do not print response/request headers, URLs with secrets, or credential-bearing errors.
        raise RuntimeError(f'Google Places request failed: HTTP {error.code}. Check API enablement, key restrictions, billing and network access.') from None
    except (urllib.error.URLError, TimeoutError):
        raise RuntimeError('Google Places could not be reached. Check network access.') from None
    if not isinstance(payload.get('places', []), list): raise ValueError('Invalid Places response')
    return payload.get('places', [])

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('query', help='Exact clinic name plus city/county, Florida')
    args=parser.parse_args()
    if not 3 <= len(args.query) <= 200: parser.error('Query must be 3–200 characters')
    print('Google Maps Platform location review; Google attribution and any returned third-party attributions apply. Do not cache results or publish Google content/coordinates on the MapLibre map. Independently source facts from official clinic pages. Only place IDs may be retained under applicable policy.', file=sys.stderr)
    try:
        results=search(args.query,os.environ.get('GOOGLE_MAPS_API_KEY',''))
    except (ValueError,RuntimeError) as error:
        print(str(error),file=sys.stderr); return 1
    print(json.dumps({'attribution':'Google Maps','transientReviewOnly':True,'places':results},ensure_ascii=False,indent=2))
    return 0

if __name__ == '__main__': sys.exit(main())
