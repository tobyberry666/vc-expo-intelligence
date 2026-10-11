import { z } from 'zod';
import { normalizeDate, dateRange } from './dates';
import { investmentId, expoId } from './identity';
import type { LiveInvestmentItem, LiveExpoItem } from './types';

const textField = z.string().max(1000).optional();
const extractedInvestment = z.object({
  invested_company: textField,
  investor: textField,
  investment_round: textField,
  investment_amount: textField,
  investment_date: textField,
  investment_industry: textField,
});
const extractedExpo = z.object({
  exhibition_name: textField,
  exhibition_type: textField,
  exhibition_date: textField,
  exhibition_location: textField,
  exhibition_description: z.string().max(4000).optional(),
  chinese_exhibitor_count: z
    .number()
    .int()
    .nonnegative()
    .max(1000000)
    .optional(),
  chinese_exhibitor_names: z
    .array(z.object({ company_name: textField }))
    .max(1000)
    .optional(),
});
const HEADERS = new Set([
  '企业名',
  '企业名称',
  '被投企业',
  '公司名',
  '公司名称',
  'company',
  '投资机构',
  '轮次',
  '金额',
  '日期',
  '赛道',
  '参展企业',
  '行业',
]);
function isHeader(value: string): boolean {
  return HEADERS.has(value.trim().toLowerCase());
}
function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((s) => s.trim());
}
function investment(
  company: string,
  institution: string,
  round: string,
  amount: string,
  date: string,
  sector: string,
): LiveInvestmentItem {
  const item = {
    company: company.trim(),
    institution: institution.trim() || '未披露',
    round: round.trim() || '未披露',
    amount: amount.trim() || '未披露',
    date: normalizeDate(date),
    sector: sector.trim() || '其他',
    summary: `${company.trim()} 完成${round.trim() ? ` ${round.trim()}` : ''}融资`,
    source: 'live' as const,
  };
  return { ...item, id: investmentId(item) };
}

export function parseExtractedInvestments(
  input: unknown,
): LiveInvestmentItem[] {
  const result = z
    .object({ investment_events: z.array(z.unknown()).max(500) })
    .safeParse(input);
  if (!result.success) return [];
  const items: LiveInvestmentItem[] = [];
  for (const value of result.data.investment_events) {
    const parsed = extractedInvestment.safeParse(value);
    if (!parsed.success) continue;
    const ev = parsed.data;
    const name = ev.invested_company?.trim();
    if (!name || name.length < 2 || isHeader(name)) continue;
    items.push(
      investment(
        name,
        ev.investor ?? '',
        ev.investment_round ?? '',
        ev.investment_amount ?? '',
        ev.investment_date ?? '',
        ev.investment_industry ?? '',
      ),
    );
  }
  return mergeInvestments(items);
}

export function parseMarkdownInvestments(text: string): LiveInvestmentItem[] {
  const items: LiveInvestmentItem[] = [];
  for (const line of text.split('\n')) {
    if (!line.includes('|')) continue;
    const row = cells(line);
    if (
      row.length < 4 ||
      row.some((c) => /^[-:]+$/.test(c)) ||
      isHeader(row[0])
    )
      continue;
    const [company, inst, round, amount, date = '', sector = ''] = row;
    if (
      company.length < 2 ||
      company.length > 1000 ||
      /^\d+$/.test(company) ||
      row.some((s) => s.length > 1000)
    )
      continue;
    items.push(investment(company, inst, round, amount, date, sector));
  }
  return mergeInvestments(items);
}

export function parseInvestmentsFallback(text: string): LiveInvestmentItem[] {
  const items: LiveInvestmentItem[] = [];
  for (const line of text.split('\n')) {
    if (line.includes('|') || line.length > 300) continue;
    const company = line.match(
      /(?:^|[「“【])([\u4e00-\u9fa5A-Za-z]{2,40}?)\s*(?:完成|获得|宣布|获)\s*/,
    )?.[1];
    const round = line.match(
      /(?:Pre-[AB]|[A-E]\+{0,2}|天使|种子)轮|Pre-IPO|战略投资/i,
    )?.[0];
    const amount = line.match(
      /(?:\d+(?:\.\d+)?|数|几)\s*[亿千万]+(?:美元|元|人民币)?/,
    )?.[0];
    if (
      !company ||
      !round ||
      !amount ||
      ['中国', '最近', '企业', '公司'].includes(company)
    )
      continue;
    const inst =
      line.match(
        /(IDG资本|红杉中国|高瓴创投|高瓴|经纬创投|真格基金|启明创投|腾讯投资|深创投)/,
      )?.[1] ?? '';
    const date =
      line.match(/20\d{2}[-/年]\d{1,2}(?:[-/月]\d{1,2}日?)?/)?.[0] ?? '';
    items.push(investment(company, inst, round, amount, date, ''));
  }
  return mergeInvestments(items);
}

export function mergeInvestments(
  ...groups: LiveInvestmentItem[][]
): LiveInvestmentItem[] {
  const map = new Map<string, LiveInvestmentItem>();
  for (const item of groups.flat())
    if (!map.has(item.id)) map.set(item.id, item);
  return [...map.values()].slice(0, 100);
}

function expoType(name: string): LiveExpoItem['type'] {
  if (/waic|neurips|cvpr|aaai|google|人工智能|\bai\b/i.test(name)) return 'ai';
  if (/车展|汽车|auto|iaa|mobility/i.test(name)) return 'auto';
  if (/工业|工博|机器人|汉诺威|industrial|semicon|formnext/i.test(name))
    return 'industrial';
  return 'consumer';
}

export function parseExtractedExpo(input: unknown): LiveExpoItem | null {
  const parsed = extractedExpo.safeParse(input);
  if (
    !parsed.success ||
    !parsed.data.exhibition_name?.trim() ||
    parsed.data.exhibition_name.trim().length < 2
  )
    return null;
  const ev = parsed.data;
  const name = ev.exhibition_name!.trim();
  const [startDate, endDate] = dateRange(ev.exhibition_date ?? '');
  const exhibitors = [
    ...new Set(
      (ev.chinese_exhibitor_names ?? [])
        .map((c) => c.company_name?.trim() ?? '')
        .filter(Boolean),
    ),
  ];
  const item = {
    name,
    type: expoType(`${ev.exhibition_type ?? ''} ${name}`),
    startDate,
    endDate,
    location: ev.exhibition_location?.trim() || '未披露',
    description: ev.exhibition_description?.trim() ?? '',
    exhibitors,
    chineseExhibitorCount: Math.max(
      ev.chinese_exhibitor_count ?? 0,
      exhibitors.length,
    ),
    source: 'live' as const,
  };
  return { ...item, id: expoId(item) };
}

export function parseExposFallback(text: string): LiveExpoItem[] {
  const items: LiveExpoItem[] = [];
  for (const line of text.split('\n')) {
    if (line.length > 1000 || line.includes('|')) continue;
    const name = line.match(
      /(?:CES|MWC|IFA|COMPUTEX|GITEX|WAIC|NeurIPS|CVPR|北京车展|上海车展|世界人工智能大会|世界机器人大会)(?:\s*20\d{2})?/i,
    )?.[0];
    if (!name) continue;
    const dates =
      line.match(/20\d{2}[-/年]\d{1,2}(?:[-/月]\d{1,2}日?)?/g) ?? [];
    const item = parseExtractedExpo({
      exhibition_name: name,
      exhibition_date: dates.join('至'),
      exhibition_description: line.trim(),
    });
    if (item) items.push(item);
  }
  return mergeExpos(items);
}

export function mergeExpos(...groups: LiveExpoItem[][]): LiveExpoItem[] {
  const map = new Map<string, LiveExpoItem>();
  for (const item of groups.flat()) {
    // An undated regex supplement must not duplicate a dated structured record.
    if (
      item.startDate === '未披露' &&
      [...map.values()].some(
        (e) => e.name.toLowerCase() === item.name.toLowerCase(),
      )
    )
      continue;
    const previous = map.get(item.id);
    const exhibitors = [
      ...new Set([...(previous?.exhibitors ?? []), ...item.exhibitors]),
    ];
    map.set(item.id, {
      ...(previous ?? item),
      exhibitors,
      chineseExhibitorCount: Math.max(
        previous?.chineseExhibitorCount ?? 0,
        item.chineseExhibitorCount,
        exhibitors.length,
      ),
    });
  }
  return [...map.values()].slice(0, 50);
}

export function attachMarkdownExhibitors(
  expos: LiveExpoItem[],
  text: string,
): LiveExpoItem[] {
  let heading = '';
  const additions = new Map<string, string[]>();
  for (const line of text.split('\n')) {
    const title =
      line.match(/^#+\s*(.+)/)?.[1] ?? line.match(/^\*\*(.+?)\*\*/)?.[1];
    if (title) heading = title.toLowerCase();
    if (!line.includes('|')) continue;
    const row = cells(line);
    if (
      row.length < 2 ||
      isHeader(row[0]) ||
      row.some((s) => /^[-:]+$/.test(s)) ||
      !row[0] ||
      row[0].length > 1000
    )
      continue;
    const expo = expos.find((e) =>
      heading.includes(e.name.toLowerCase().replace(/\s*20\d{2}$/, '')),
    );
    if (expo)
      additions.set(expo.id, [...(additions.get(expo.id) ?? []), row[0]]);
  }
  return expos.map((expo) => {
    const exhibitors = [
      ...new Set([...expo.exhibitors, ...(additions.get(expo.id) ?? [])]),
    ].slice(0, 1000);
    return {
      ...expo,
      exhibitors,
      chineseExhibitorCount: Math.max(
        expo.chineseExhibitorCount,
        exhibitors.length,
      ),
    };
  });
}

export function extractSection(text: string, keywords: string[]): string {
  const lines = text.split('\n');
  const start = lines.findIndex(
    (line) => /^#+\s/.test(line) && keywords.some((k) => line.includes(k)),
  );
  if (start < 0) return text.slice(0, 3000);
  const end = lines.findIndex(
    (line, i) =>
      i > start &&
      /^#+\s/.test(line) &&
      !keywords.some((k) => line.includes(k)),
  );
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
}
