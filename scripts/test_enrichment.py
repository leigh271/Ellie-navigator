import unittest
from unittest.mock import patch
from enrich_clinics import apply_enrichment
from google_places_review import search

class EnrichmentTests(unittest.TestCase):
    def setUp(self):
        self.provider={'id':'synthetic','services':[],'insurance':[],'sources':[]}
        self.source={'url':'https://example.org/clinic','title':'Synthetic official-page test fixture','origin':'official-provider','checkedAt':'2026-11-07','fields':['Pap test','selfPay','participation:Florida Blue:PPO']}
    def row(self,facts):
        return {'records':[{'id':'synthetic','reviewed':True,'facts':facts,'sources':[self.source]}]}
    def test_reviewed_facts_apply_without_mutating_input(self):
        result=apply_enrichment([self.provider],self.row({'services':['Pap test'],'selfPay':True}))
        self.assertEqual(result[0]['services'],['Pap test'])
        self.assertEqual(self.provider['services'],[])
    def test_location_and_google_facts_cannot_prove_services(self):
        self.source['origin']='google-places'
        with self.assertRaises(ValueError):apply_enrichment([self.provider],self.row({'services':['Pap test']}))
    def test_unsourced_service_plan_and_booking_are_rejected(self):
        for facts in [{'services':['HPV testing']},{'insurance':['Florida Blue PPO']},{'bookingUrl':'https://example.org/book'}]:
            with self.assertRaises(ValueError):apply_enrichment([self.provider],self.row(facts))
    def test_participation_scope_and_matching_source_required(self):
        entry={'carrier':'Florida Blue','plan':'PPO','scope':'organization','sourceUrl':self.source['url'],'checkedAt':'2026-11-07'}
        self.assertEqual(apply_enrichment([self.provider],self.row({'insuranceParticipation':[entry]}))[0]['insuranceParticipation'][0]['scope'],'organization')
        entry['scope']='guaranteed'
        with self.assertRaises(ValueError):apply_enrichment([self.provider],self.row({'insuranceParticipation':[entry]}))
    def test_unknown_and_duplicate_clinic_rejected(self):
        payload=self.row({'selfPay':True});payload['records']*=2
        with self.assertRaises(ValueError):apply_enrichment([self.provider],payload)
        payload=self.row({'selfPay':True});payload['records'][0]['id']='missing'
        with self.assertRaises(ValueError):apply_enrichment([self.provider],payload)
    def test_places_requires_secret_and_uses_minimal_location_fields(self):
        with self.assertRaises(ValueError):search('Demo clinic Florida','')
        with patch('urllib.request.urlopen') as client:
            client.return_value.__enter__.return_value.read.return_value=b'{"places":[]}'
            self.assertEqual(search('Demo clinic Florida','synthetic-test-key'),[])
            request=client.call_args.args[0]
            self.assertIn('places.id',request.get_header('X-goog-fieldmask'))
            self.assertNotIn('reviews',request.get_header('X-goog-fieldmask'))
            self.assertNotIn('synthetic-test-key',request.full_url)

if __name__=='__main__':unittest.main()
