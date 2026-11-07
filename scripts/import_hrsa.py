#!/usr/bin/env python3
"""Validate the supplied HRSA extract; publish selected location-only records.
Never fetch the national dataset or infer services, insurance, fees or booking URLs.
"""
import collections
import csv
import hashlib
import json
import math
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/hrsa'
REVIEW_DATE = '2026-11-07'  # Review of the supplied extract, not of clinic websites.
SELECTED = ['0003', '0004', '0005', '0007', '0008', '0016', '0018', '0020', '0026', '0028', '0029', '0039', '0122', '0191']

def key(row):
    return tuple(str(row[k]).strip().casefold() for k in ['name', 'address', 'city'])

def load_and_validate():
    records = json.loads((SOURCE / 'candidates.json').read_text())
    with (SOURCE / 'candidates.csv').open(newline='') as stream:
        csv_records = list(csv.DictReader(stream))
    if not isinstance(records, list) or len(records) != len(csv_records):
        raise ValueError('CSV/JSON row counts differ or JSON is not an array')
    ids, keys, mismatches = set(), set(), []
    csv_by_key = {}
    for c in csv_records:
        k = tuple(c[field].strip().casefold() for field in ['clinic_name', 'address', 'city'])
        if k in csv_by_key: raise ValueError(f'Duplicate CSV location key: {k}')
        csv_by_key[k] = c
    required = ['id', 'name', 'organization', 'address', 'city', 'state', 'zip', 'county', 'phone', 'locationType', 'setting']
    for r in records:
        if not isinstance(r, dict): raise ValueError('Invalid JSON record')
        for field in required:
            if not isinstance(r.get(field), str) or not r[field].strip(): raise ValueError(f'Missing or invalid {field}: {r.get("id")}')
        if r['id'] in ids or key(r) in keys: raise ValueError(f'Duplicate identity: {r["id"]}')
        ids.add(r['id']); keys.add(key(r))
        if r['county'] not in ['Broward', 'Miami-Dade'] or r['state'] != 'FL': raise ValueError('Out-of-scope location')
        if r['locationType'] != 'Permanent' or 'school' in r['setting'].lower(): raise ValueError('Not a permanent, non-school candidate')
        xy = r.get('coordinates')
        if not isinstance(xy, list) or len(xy) != 2 or any(type(n) not in [int, float] or not math.isfinite(n) for n in xy): raise ValueError('Invalid coordinates')
        if not (-81 < xy[0] < -79.8 and 25.1 < xy[1] < 26.5): raise ValueError(f'Coordinates outside South Florida bounds: {r["id"]}')
        if not re.fullmatch(r'\d{5}(?:-\d{4})?', r['zip']): raise ValueError('Invalid ZIP')
        if r.get('website') is not None and (not isinstance(r['website'], str) or urlparse(r['website']).scheme.lower() not in ['http', 'https']): raise ValueError('Unsafe website URL')
        if r.get('services') != [] or r.get('insurance') != [] or r.get('serviceVerification') != 'not_verified' or r.get('insuranceVerification') != 'not_verified': raise ValueError('Do not promote candidate service/insurance claims without evidence')
        if not isinstance(r.get('source'), dict) or r['source'].get('url') != 'https://data.hrsa.gov/data/download': raise ValueError('Unexpected source metadata')
        c = csv_by_key[key(r)]
        fields = {'clinic_name':'name', 'organization_name':'organization', 'address':'address', 'city':'city', 'state':'state', 'zip_code':'zip', 'county':'county', 'phone':'phone', 'location_type':'locationType', 'setting':'setting'}
        for ck,jk in fields.items():
            if c[ck] != r[jk]: mismatches.append([r['id'], jk])
        if (c['website'] or None) != r['website'] or [float(c['longitude']), float(c['latitude'])] != xy: mismatches.append([r['id'], 'website/coordinates'])
        if c['source_record_date'] != r['source']['recordDate'] or c['source_url'] != r['source']['url'] or c['source'] != r['source']['name']: mismatches.append([r['id'], 'source'])
        if c['status'] != 'Active': raise ValueError('Inactive candidate')
    if mismatches: raise ValueError(f'CSV/JSON disagreements: {mismatches}')
    return records, csv_records

def main():
    records, csv_records = load_and_validate()
    indexed = {r['id']:r for r in records}
    selected = [indexed[f'hrsa-site-{s}'] for s in SELECTED]
    previous = json.loads((ROOT/'src/data/providers.json').read_text())
    existing = {p['id']:p for p in previous}
    published = []
    for r in selected:
        old = existing.get(r['id'], {})
        source = {'url':r['source']['url'], 'title':'HRSA site extract supplied by the user', 'checkedAt':REVIEW_DATE,
                  'recordDate':r['source']['recordDate'], 'origin':'uploaded-hrsa',
                  'fields':['name','organization','address','city','county','zip','phone','coordinates'] + (['website'] if r['website'] else [])}
        p = {'id':r['id'], 'name':r['name'], 'organization':r['organization'], 'kind':'hospital' if r['organization']=='NORTH BROWARD HOSPITAL DISTRICT' else 'community',
             'county':r['county'], 'address':r['address'], 'city':r['city'], 'state':r['state'], 'zip':r['zip'], 'coordinates':r['coordinates'],
             'phone':r['phone'], 'website':r['website'], 'services':old.get('services', []), 'insurance':old.get('insurance', []),
             'affordability':old.get('affordability','unknown'), 'verification':old.get('verification','location'),
             'sources':[source]+[s for s in old.get('sources',[]) if s.get('origin')!='uploaded-hrsa'],
             'hrsa':{'sourceId':r['id'], 'sourceRecordDate':r['source']['recordDate'], 'sourceName':r['source']['name'], 'sourceURL':r['source']['url'], 'locationType':r['locationType'], 'setting':r['setting'], 'status':'Active', 'serviceVerification':r['serviceVerification'], 'insuranceVerification':r['insuranceVerification']}}
        for optional in ['bookingUrl','insuranceDeclined','insuranceParticipation','selfPay','schedulingPhone']:
            if optional in old: p[optional] = old[optional]
        # Higher-confidence official evidence survives repeated HRSA refreshes.
        for field in ['name','organization','address','city','county','state','zip','phone','website','coordinates']:
            if field in old and any(field in s.get('fields',[]) and s.get('origin') != 'uploaded-hrsa' for s in old.get('sources',[])):
                p[field]=old[field]
        published.append(p)
    # Preserve unrelated reviewed records rather than overwriting work from another branch.
    selected_ids = {p['id'] for p in published}
    published += [p for p in previous if p['id'] not in selected_ids]
    (ROOT/'src/data/providers.json').write_text(json.dumps(published, ensure_ascii=False, indent=2)+'\n')
    # Data-derived search origins are means of unique HRSA coordinates for a city/ZIP.
    # They are approximate SEARCH origins, never replacements for clinic coordinates.
    groups = collections.defaultdict(set)
    for r in records:
        city = re.sub(r'^ft\.?\s+', 'fort ', r['city'].lower().strip())
        groups[city].add(tuple(r['coordinates'])); groups[r['zip'][:5]].add(tuple(r['coordinates']))
    areas = {k:{'coordinates':[sum(p[i] for p in pts)/len(pts) for i in [0,1]], 'basis':'Mean of unique HRSA site coordinates in the searched city/ZIP; approximate search origin, not user location.'} for k,pts in sorted(groups.items())}
    (ROOT/'src/data/search-areas.json').write_text(json.dumps(areas, indent=2)+'\n')
    coordinate_counts = collections.Counter(tuple(r['coordinates']) for r in records)
    name_counts = collections.Counter(r['name'] for r in records)
    audit = {'inputRecords':len(records), 'csvRecords':len(csv_records), 'crossFileMismatches':0, 'duplicateIds':0, 'duplicateNameAddressCityKeys':0,
             'counties':dict(collections.Counter(r['county'] for r in records)), 'missingWebsites':sum(r['website'] is None for r in records),
             'coordinateBounds':{'longitude':[min(r['coordinates'][0] for r in records),max(r['coordinates'][0] for r in records)],'latitude':[min(r['coordinates'][1] for r in records),max(r['coordinates'][1] for r in records)]},
             'sharedCoordinateGroups':sum(n>1 for n in coordinate_counts.values()), 'recordsAtSharedCoordinates':sum(n for n in coordinate_counts.values() if n>1),
             'duplicateNames':{name:n for name,n in name_counts.items() if n>1}, 'publishedLocations':len(published),
             'serviceVerifiedProviders':sum(bool(p['services']) for p in published), 'verifiedBookingLinks':sum(bool(p.get('bookingUrl')) for p in published),
             'sourceRecordDates':sorted({r['source']['recordDate'] for r in records}), 'extractReviewDate':REVIEW_DATE,
             'sourceSHA256':{f:hashlib.sha256((SOURCE/f).read_bytes()).hexdigest() for f in ['candidates.json','candidates.csv']},
             'limitations':['Full 235-record reference extract was not uploaded or re-downloaded.', '119 candidates are not 119 verified women\u2019s healthcare providers.', 'Site-specific services, plans, costs, booking links and live operating status are not independently website-verified.', 'Three Memorial-named candidates have NORTH BROWARD HOSPITAL DISTRICT as their supplied organization; original fields are preserved and those candidates are not selected.', 'Names/coordinates alone are not duplicate keys. Shared locations are retained in the source data; no shared-coordinate clusters were selected for publication.']}
    (ROOT/'docs/HRSA_IMPORT_AUDIT.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({k:audit[k] for k in ['inputRecords','counties','publishedLocations','serviceVerifiedProviders','verifiedBookingLinks','missingWebsites','sharedCoordinateGroups']}))

if __name__ == '__main__': main()
