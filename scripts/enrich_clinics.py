#!/usr/bin/env python3
"""Apply explicitly reviewed official-source facts; never infer claims from Google."""
import copy
import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
SERVICES={'Cervical cancer screening','Pap test','HPV testing','HPV vaccination','Annual gynecology / wellness','Birth control / family planning','PCOS care','Fibroid care','Gynecology / OB-GYN','STI / sexual health testing','Breast health / mammography','Primary care / women’s preventive health','Women’s health specialty care'}
FIELDS={'services','insurance','insuranceParticipation','insuranceDeclined','affordability','selfPay','schedulingPhone','bookingUrl','phone','website'}

def https(value):
    return isinstance(value,str) and urlparse(value).scheme == 'https' and bool(urlparse(value).hostname)

def apply_enrichment(providers, payload):
    updated=copy.deepcopy(providers)
    index={p['id']:p for p in updated}
    seen=set()
    for row in payload['records']:
        identity=row['id']
        if identity not in index or identity in seen: raise ValueError('Unknown or duplicate clinic ID')
        seen.add(identity)
        if row.get('reviewed') is not True: raise ValueError('Human source review is required')
        facts=row['facts']; sources=row['sources']
        if not isinstance(facts,dict) or not facts or set(facts)-FIELDS: raise ValueError('Unsupported enrichment fields')
        if not sources: raise ValueError('Official evidence is required')
        supported=set()
        for source in sources:
            if source.get('origin') != 'official-provider' or not https(source.get('url')) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',source.get('checkedAt','')): raise ValueError('Only dated, reviewed official-provider sources may enrich services/insurance')
            if not source.get('title') or not isinstance(source.get('fields'),list) or not all(isinstance(f,str) for f in source['fields']): raise ValueError('Malformed source')
            supported.update(source['fields'])
        for field,value in facts.items():
            if field in ['services','insurance','insuranceDeclined']:
                if not isinstance(value,list) or not all(isinstance(v,str) and v.strip() for v in value): raise ValueError('Expected string list')
            if field == 'services' and (set(value)-SERVICES or not set(value)<=supported): raise ValueError('Unsupported or unsourced service')
            if field == 'insurance' and not all('insurance:'+v in supported for v in value): raise ValueError('Exact plan evidence required')
            if field == 'insuranceDeclined' and not all('insuranceDeclined:'+v in supported for v in value): raise ValueError('Exact nonacceptance evidence required')
            if field == 'insuranceParticipation':
                if not isinstance(value,list): raise ValueError('Expected participation list')
                for entry in value:
                    key='participation:'+entry['carrier']+(':'+entry['plan'] if entry.get('plan') else '')
                    if entry.get('scope') not in ['organization','location','provider-network'] or not any(s['url']==entry.get('sourceUrl') and key in s['fields'] for s in sources) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',entry.get('checkedAt','')): raise ValueError('Participation scope and exact source required')
            if field not in ['services','insurance','insuranceDeclined','insuranceParticipation'] and field not in supported: raise ValueError('Field-specific source required')
            if field in ['website','bookingUrl'] and not https(value): raise ValueError('HTTPS URL required')
            if field == 'selfPay' and type(value) is not bool: raise ValueError('Self-pay must be boolean')
            if field == 'affordability' and value not in ['unknown','sliding-scale']: raise ValueError('Invalid affordability value')
            if field in ['phone','schedulingPhone'] and (not isinstance(value,str) or len(re.sub(r'\D','',value))<10): raise ValueError('Invalid phone')
        index[identity].update(facts)
        # Replace sources from this explicit overlay, retaining HRSA and other reviews.
        urls={s['url'] for s in sources}
        index[identity]['sources']=[s for s in index[identity]['sources'] if s['url'] not in urls]+sources
    return updated

def main():
    path=ROOT/'src/data/providers.json'
    providers=json.loads(path.read_text())
    payload=json.loads((ROOT/'data/clinic-enrichment.json').read_text())
    result=apply_enrichment(providers,payload)
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'reviewedOverlaysApplied':len(payload['records']),'locations':len(result)}))

if __name__=='__main__':main()
