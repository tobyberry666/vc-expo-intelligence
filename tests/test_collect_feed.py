import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
import io

spec = importlib.util.spec_from_file_location('collector', Path(__file__).parents[1] / 'scripts/collect-feed.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class CollectorTests(unittest.TestCase):
    def test_fetch_retries_transient_network_failure(self):
        with patch.object(collector.urllib.request, 'urlopen', side_effect=[TimeoutError(), io.BytesIO(b'ok')]) as request, patch.object(collector.time, 'sleep'):
            self.assertEqual(collector.fetch('https://techcrunch.com/feed/'), b'ok')
            self.assertEqual(request.call_count, 2)

    def test_official_expo_dates_and_impossible_dates(self):
        self.assertEqual(collector.expo_dates('<script type="application/ld+json">{"@type":"Event","startDate":"2027-03-01","endDate":"2027-03-04"}</script>', 'mwc-2027'), ('2027-03-01', '2027-03-04'))
        self.assertEqual(collector.expo_dates('Die HANNOVER MESSE findet vom 5. - 8. April 2027 statt.', 'hannover-2027'), ('2027-04-05', '2027-04-08'))
        self.assertEqual(collector.expo_dates('CES 2027 January 6-9, 2027', 'ces-2027'), ('2027-01-06', '2027-01-09'))
        self.assertIsNone(collector.expo_dates('January 32-35, 2027', 'ces-2027'))
        self.assertIsNone(collector.expo_dates('January 6-9, 2028', 'ces-2027'))

    def test_failed_source_keeps_last_success_time(self):
        status = collector.source_status('TechCrunch', 'https://techcrunch.com/feed/', 2000, False, [{'url': 'https://techcrunch.com/feed/', 'lastSuccessAt': 1000}])
        self.assertEqual(status['lastSuccessAt'], 1000)
        self.assertEqual(status['checkedAt'], 2000)
        self.assertEqual(status['status'], 'failed')

    def test_completed_round(self):
        item = collector.funding_item('Example Labs raises $30M in Series A', 'https://techcrunch.com/example', 'Thu, 08 Oct 2026 12:00:00 +0000', 'TechCrunch')
        self.assertEqual(item['company'], 'Example Labs')
        self.assertEqual(item['amount'], '$30M')
        self.assertEqual(item['round'], 'Series A')
        self.assertEqual(item['institution'], '未披露')
        self.assertEqual(item['date'], '2026-10-08')

    def test_rumors_funds_and_unsafe_links_excluded(self):
        for title, url in [('Example plans to raise $30M', 'https://techcrunch.com/x'), ('Example VC raises $30M fund', 'https://techcrunch.com/x'), ('Example raises $30M', 'javascript:alert(1)'), ('Example raises $30M', 'https://untrusted.example/x')]:
            self.assertIsNone(collector.funding_item(title, url, 'Thu, 08 Oct 2026 12:00:00 +0000', 'TechCrunch'))

    def test_invalid_dates_and_non_funding_excluded(self):
        self.assertIsNone(collector.funding_item('Example raises $30M', 'https://techcrunch.com/x', 'invalid', 'TechCrunch'))
        self.assertIsNone(collector.funding_item('Example launches a robot', 'https://techcrunch.com/x', 'Thu, 08 Oct 2026 12:00:00 +0000', 'TechCrunch'))
        self.assertIsNone(collector.funding_item('At 19, founder raises $11M', 'https://techcrunch.com/x', 'Thu, 08 Oct 2026 12:00:00 +0000', 'TechCrunch'))

    def test_explicit_investor(self):
        item = collector.funding_item('Robot data startup Mecka AI nabs $60M from Sequoia', 'https://techcrunch.com/x', 'Thu, 08 Oct 2026 12:00:00 +0000', 'TechCrunch')
        self.assertEqual(item['company'], 'Mecka AI')
        self.assertEqual(item['institution'], 'Sequoia')

    def test_primary_announcement(self):
        item = collector.funding_item('Type One Energy Completes $200M Series B Financing', 'https://typeoneenergy.com/x', 'Tue, 06 Oct 2026 11:59:07 +0000', 'Type One Energy')
        self.assertEqual(item['company'], 'Type One Energy')
        self.assertEqual(item['round'], 'Series B')


if __name__ == '__main__':
    unittest.main()
