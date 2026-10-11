import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('collector', Path(__file__).parents[1] / 'scripts/collect-feed.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class CollectorTests(unittest.TestCase):
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
