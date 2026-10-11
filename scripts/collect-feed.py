"""Collect attributed public funding headlines; no credentials or generated facts."""
import hashlib
import html
import json
import re
import sys
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
    with urllib.request.urlopen(request, timeout=25) as response:
        data = response.read(2_000_001)
    if len(data) > 2_000_000:
        raise ValueError('source too large')
    return data


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
    for name, url in SOURCES:
        try:
            body = fetch(url)
            if b'<!DOCTYPE' in body.upper() or b'<!ENTITY' in body.upper():
                raise ValueError('unsupported XML declaration')
            root = ET.fromstring(body)
            if root.tag != 'rss':
                raise ValueError('not RSS')
            for node in root.findall('./channel/item'):
                item = funding_item(node.findtext('title', ''), node.findtext('link', ''), node.findtext('pubDate', ''), name)
                if item:
                    records[item['sourceUrl']] = item
            successes += 1
            statuses.append({'name': name, 'url': url, 'status': 'ok'})
        except Exception:
            statuses.append({'name': name, 'url': url, 'status': 'failed'})
    if not successes:
        raise RuntimeError('All funding sources failed; keep previous deployment')
    cutoff = (now - timedelta(days=180)).date().isoformat()
    items = sorted((x for x in records.values() if cutoff <= x['date'] <= now.date().isoformat()), key=lambda x: x['date'], reverse=True)[:100]
    if not items:
        raise RuntimeError('No verified funding headlines; keep previous deployment')
    expos = json.loads((ROOT / 'data/expos.json').read_text(encoding='utf-8'))
    expos = [x for x in expos if x['endDate'] >= now.date().isoformat()]
    summary = '## 投融资动态\n公开来源披露的融资事件；日期为报道发布日期，未披露字段不推测。点击详情的原文链接核验。\n\n## 科技展会\n展会日程经主办方官方网站核验，中国参展企业数量与名单尚未披露。统计仅覆盖本站采集来源，不代表全市场。'
    result = dict(updatedAt=int(now.timestamp() * 1000), fullSummary=summary, liveInvestments=items, liveExpos=expos,
                  sources=statuses, warning='部分新闻源暂时不可用，保留历史记录' if successes < len(SOURCES) else None)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)
    print(f'Collected {len(items)} funding events, {len(expos)} expos; {successes}/{len(SOURCES)} sources available')


if __name__ == '__main__':
    collect()
