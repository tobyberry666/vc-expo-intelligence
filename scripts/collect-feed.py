"""Collect attributed public funding headlines; no credentials or generated facts."""
import hashlib
import html
import json
import re
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [('TechCrunch', 'https://techcrunch.com/category/venture/feed/'),
           ('TechCrunch', 'https://techcrunch.com/feed/'),
           ('Type One Energy', 'https://typeoneenergy.com/feed/')]
HOSTS = {'techcrunch.com', 'typeoneenergy.com'}


def funding_item(title, url, published, source):
    title = html.unescape(title).strip()
    if urlparse(url).scheme != 'https' or urlparse(url).hostname not in HOSTS:
        return None
    if re.search(r'\b(plans?|seeks?|talks|rumou?r|reportedly|could|fund|VC|Catalyst)\b', title, re.I):
        return None
    match = re.match(r'^(.{2,90}?)\s+(?:raises|raised|secures|secured|lands|bags|nabs|closes|completes)\s+(\$[\d,.]+\s*(?:million|billion|[MB]))\b', title, re.I)
    if not match:
        return None
    try:
        date = parsedate_to_datetime(published).astimezone(timezone.utc).date().isoformat()
    except (ValueError, TypeError, OverflowError):
        return None
    company = re.sub(r'^(?:Robot data startup|AI startup|Startup|Fintech startup)\s+', '', match[1], flags=re.I)
    if re.search(r'\b(founder|At \d+|While|After)\b|[,!?]', company, re.I):
        return None
    investor = re.search(r'\bfrom (Sequoia)\b', title)
    round_match = re.search(r'\b(Series [A-Z](?:\d)?|pre-seed|seed)\b', title, re.I)
    return dict(id='public-' + hashlib.sha256(url.encode()).hexdigest(), company=company,
                institution=investor[1] if investor else '未披露', sector='其他', round=round_match[1] if round_match else '未披露',
                amount=match[2], date=date, summary=f'{source} 公开披露融资，金额 {match[2]}。日期为报道发布日期；投资机构及其他字段以原文为准。',
                source='live', sourceName=source, sourceUrl=url)


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'VCExpoIntelligence/1.0 (+https://github.com/tobyberry666/vc-expo-intelligence)'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                data = response.read(2_000_001)
            if len(data) > 2_000_000:
                raise ValueError('source too large')
            return data
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            if attempt == 2 or (isinstance(error, urllib.error.HTTPError) and error.code not in (429, 500, 502, 503, 504)):
                raise
            time.sleep(2 ** attempt)


def source_status(name, url, checked_at, success, previous):
    last_success = next((x.get('lastSuccessAt') for x in previous if x.get('url') == url), None)
    return dict(name=name, url=url, status='ok' if success else 'failed', checkedAt=checked_at,
                lastSuccessAt=checked_at if success else last_success)


def expo_dates(body, expo_id):
    """Only parse dates explicitly published for the catalogued event year."""
    expected_year = expo_id.rsplit('-', 1)[-1]
    dates = None
    if expo_id.startswith('mwc-'):
        def events(value):
            if isinstance(value, dict):
                if value.get('@type') == 'Event':
                    yield value
                for child in value.values():
                    yield from events(child)
            elif isinstance(value, list):
                for child in value:
                    yield from events(child)
        for raw in re.findall(r'<script\b[^>]*type=[\"\x27]application/ld\+json[\"\x27][^>]*>(.*?)</script>', body, re.S | re.I):
            try:
                for event in events(json.loads(raw)):
                    start, end = str(event.get('startDate', ''))[:10], str(event.get('endDate', ''))[:10]
                    if start.startswith(expected_year) and end.startswith(expected_year):
                        dates = (start, end)
                        break
            except (ValueError, TypeError):
                continue
    else:
        text = html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<(script|style)\b[^>]*>.*?</\1>', ' ', body, flags=re.S | re.I)))
        text = re.sub(r'\s+', ' ', text)
        pattern = r'(?:January|Jan\.?)\s+(\d{1,2})\s*[-–—]\s*(\d{1,2}),?\s+(\d{4})' if expo_id.startswith('ces-') else r'(\d{1,2})\.\s*[-–—]\s*(\d{1,2})\.\s*April\s+(\d{4})'
        match = re.search(pattern, text, re.I)
        if match and match[3] == expected_year:
            month = 1 if expo_id.startswith('ces-') else 4
            dates = (f'{expected_year}-{month:02d}-{int(match[1]):02d}', f'{expected_year}-{month:02d}-{int(match[2]):02d}')
    if dates:
        try:
            start, end = (datetime.strptime(value, '%Y-%m-%d') for value in dates)
            if start <= end:
                return dates
        except ValueError:
            pass
    return None


def collect():
    path = ROOT / 'public/data/feed.json'
    previous = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    # Scheduled builds reuse the last deployed snapshot, including older RSS items.
    try:
        deployed = json.loads(fetch('https://tobyberry666.github.io/vc-expo-intelligence/data/feed.json'))
        if isinstance(deployed, dict) and isinstance(deployed.get('liveInvestments'), list):
            previous = deployed
    except Exception:
        pass
    records = {item['sourceUrl']: item for item in previous.get('liveInvestments', []) if urlparse(item.get('sourceUrl', '')).hostname in HOSTS and not re.search(r'\b(founder|At \d+|While|After)\b|[,!?]', item.get('company', ''), re.I)}
    statuses = []
    successes = 0
    now = datetime.now(timezone.utc)
    checked_at = int(now.timestamp() * 1000)
    for name, url in SOURCES:
        try:
            body = fetch(url)
            if b'<!DOCTYPE' in body.upper() or b'<!ENTITY' in body.upper():
                raise ValueError('unsupported XML declaration')
            root = ET.fromstring(body)
            if root.tag != 'rss' or not root.findall('./channel/item'):
                raise ValueError('not RSS')
            for node in root.findall('./channel/item'):
                item = funding_item(node.findtext('title', ''), node.findtext('link', ''), node.findtext('pubDate', ''), name)
                if item:
                    records[item['sourceUrl']] = item
            successes += 1
            statuses.append(source_status(name, url, checked_at, True, previous.get('sources', [])))
        except Exception:
            statuses.append(source_status(name, url, checked_at, False, previous.get('sources', [])))
    if not successes:
        raise RuntimeError('All funding sources failed; keep previous deployment')
    cutoff = (now - timedelta(days=180)).date().isoformat()
    items = sorted((x for x in records.values() if cutoff <= x['date'] <= now.date().isoformat()), key=lambda x: x['date'], reverse=True)[:100]
    if not items:
        raise RuntimeError('No verified funding headlines; keep previous deployment')
    expos = json.loads((ROOT / 'data/expos.json').read_text(encoding='utf-8'))
    expo_failures = 0
    for expo in expos:
        old = next((x for x in previous.get('liveExpos', []) if x.get('name') == expo['name']), None)
        if old:
            try:
                start, end = (datetime.strptime(old[key], '%Y-%m-%d') for key in ('startDate', 'endDate'))
                if start <= end and start.year == int(expo['id'].rsplit('-', 1)[-1]):
                    expo['startDate'], expo['endDate'] = old['startDate'], old['endDate']
            except (ValueError, KeyError, TypeError):
                pass
        try:
            dates = expo_dates(fetch(expo['sourceUrl']).decode('utf-8', errors='replace'), expo['id'])
            if not dates:
                raise ValueError('Official dates require review')
            expo['startDate'], expo['endDate'] = dates
            statuses.append(source_status(expo['sourceName'], expo['sourceUrl'], checked_at, True, previous.get('sources', [])))
        except Exception:
            expo_failures += 1
            statuses.append(source_status(expo['sourceName'], expo['sourceUrl'], checked_at, False, previous.get('sources', [])))
    expos = [x for x in expos if x['endDate'] >= now.date().isoformat()]
    summary = '## 投融资动态\n公开来源披露的融资事件；日期为报道发布日期，未披露字段不推测。点击详情的原文链接核验。\n\n## 科技展会\n展会日程经主办方官方网站核验，中国参展企业数量与名单尚未披露。统计仅覆盖本站采集来源，不代表全市场。'
    warnings = []
    if successes < len(SOURCES):
        warnings.append('部分新闻源暂时不可用，保留历史记录')
    if expo_failures:
        warnings.append('部分官方展会日程未能核验，保留人工核实日期，需复核官网')
    result = dict(updatedAt=checked_at, fullSummary=summary, liveInvestments=items, liveExpos=expos,
                  sources=statuses, warning='；'.join(warnings) or None)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)
    print(f'Collected {len(items)} funding events, {len(expos)} expos; {successes}/{len(SOURCES)} sources available')


if __name__ == '__main__':
    collect()
