// EXPORTS: useLiveFeed, loadLiveFeedCache, LiveInvestmentItem, LiveExpoItem, LiveFeedState, FeedPhase
import { useState, useCallback, useEffect, useRef } from 'react';
import { capabilityClient, scopedStorage, logger } from '@lark-apaas/client-toolkit-lite';

// Plugin instance IDs
const SEARCH_PLUGIN_ID = 'pe_vc_investment_tech_exhibition_search_1';
const INVEST_EXTRACT_PLUGIN_ID = 'investment_exhibition_info_extract_1';
const EXPO_EXTRACT_PLUGIN_ID = 'exhibition_level_info_extract_1';
const ACTION_KEY = 'searchSummary';
const EXTRACT_ACTION = 'textToJson';
const CACHE_KEY = '__live_feed_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_VERSION = 3; // bump to invalidate old cache with garbage data

// ─── Garbage Field Detection ─────────────────────────────────────────────

const GARBAGE_PATTERNS = [
  '名称', '领域', '轮次', '金额', '日期', '赛道',
  '企业名', '投资方', '被投企业', '投资机', '投资领域',
  '融资轮', '融资金', '投资日', '所属', '公司名',
  '信息来源', '概述', '摘要', '备注', '说明',
  '投资机构名', '投资轮', '融资额', '时间',
];

function isGarbageValue(value: string): boolean {
  if (!value) return false;
  return GARBAGE_PATTERNS.some(p => value.includes(p));
}

function validateInvestment(item: LiveInvestmentItem): boolean {
  if (isGarbageValue(item.company)) return false;
  if (item.company.length < 2) return false;
  if (item.institution !== '未披露' && isGarbageValue(item.institution)) return false;
  if (item.round !== '未披露' && isGarbageValue(item.round)) return false;
  if (item.amount !== '未披露' && isGarbageValue(item.amount)) return false;
  if (item.sector !== '其他' && isGarbageValue(item.sector)) return false;
  return true;
}

function buildSummary(company: string, institution: string, round: string): string {
  if (company && !isGarbageValue(company)) {
    const roundPart = round && round !== '未披露' ? ` ${round}` : '';
    return `${company} 完成${roundPart}融资`;
  }
  if (institution && institution !== '未披露' && !isGarbageValue(institution)) {
    return `${institution} 最新投资动态`;
  }
  return '';
}

export interface LiveInvestmentItem {
  id: string;
  company: string;
  institution: string;
  sector: string;
  round: string;
  amount: string;
  date: string;
  summary: string;
  source: 'live';
}

export interface LiveExpoItem {
  id: string;
  name: string;
  type: 'consumer' | 'ai' | 'auto' | 'industrial';
  startDate: string;
  endDate: string;
  location: string;
  chineseExhibitorCount: number;
  description: string;
  exhibitors: string[];
  source: 'live';
}

export type FeedPhase = 'idle' | 'searching' | 'extracting' | 'done';

export interface LiveFeedState {
  investmentSummary: string;
  expoSummary: string;
  fullSummary: string;
  liveInvestments: LiveInvestmentItem[];
  liveExpos: LiveExpoItem[];
  isLoading: boolean;
  lastUpdate: number | null;
  error: string | null;
  phase: FeedPhase;
  refresh: () => void;
  hasData: boolean;
}

interface CacheData {
  fullSummary: string;
  timestamp: number;
  version: number;
  liveInvestments: LiveInvestmentItem[];
  liveExpos: LiveExpoItem[];
}

export function loadLiveFeedCache(): CacheData | null {
  try {
    const raw = scopedStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CacheData;
    if (Date.now() - data.timestamp > CACHE_TTL) return null;
    // Invalidate old cache (pre-v2 had no version field)
    if (!data.version || data.version < CACHE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCache(data: Omit<CacheData, 'version'>): void {
  try {
    scopedStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, version: CACHE_VERSION }));
  } catch {
    // silent fail
  }
}

// ─── Dynamic Query Generation (10 invest + 5 expo = 15 parallel) ────────

function buildSearchQueries(): { investments: string[]; expos: string[] } {
  const now = new Date();
  const year = now.getFullYear();

  return {
    investments: [
      // 5 sector-specific queries
      `最近3个月 中国 AI人工智能 大模型 AIGC Agent 融资投资事件 金额 投资机构`,
      `最近3个月 中国 医疗健康 生物医药 创新药 基因治疗 融资投资事件`,
      `最近3个月 中国 新能源 智能汽车 自动驾驶 固态电池 融资投资事件`,
      `最近3个月 中国 半导体 芯片 机器人 硬科技 融资投资`,
      `最近半年 中国科技创投领域 C轮D轮Pre-IPO 重大融资事件`,
      // 5 institution-specific queries (NEW)
      `红杉中国 IDG资本 高瓴创投 经纬创投 ${year} 最新投资案例 被投企业`,
      `腾讯投资 阿里战投 百度风投 字节跳动 美团龙珠 ${year} 最新投资`,
      `深创投 达晨财智 中金资本 国投创新 鼎晖投资 ${year} 最新投资`,
      `${year} 中国科技创业 天使轮 A轮 B轮 融资事件 初创企业`,
      `${year} 中国独角兽 大额融资 数亿美元 数亿人民币 融资完成`,
    ],
    expos: [
      `WAIC 世界人工智能大会 ${year} 上海 中国参展企业 展商名单`,
      `CES ${year} 拉斯维加斯 中国参展企业 展商`,
      `MWC ${year} 巴塞罗那 中国企业参展 展商`,
      `北京车展 上海车展 广州车展 汉诺威工博会 世界机器人大会 ${year} 中国参展`,
      `COMPUTEX GITEX IFA NeurIPS CVPR Google-IO ${year} ${year + 1} 中国参展`,
    ],
  };
}

const INVEST_INSTRUCTION = '请以markdown表格形式列出所有投资事件，表头为：|企业名|投资机构|轮次|金额|日期|赛道|。每行一个事件，尽可能多列出（至少15个）。不要使用其他格式。';
const EXPO_INSTRUCTION = '请先说明展会名称、举办日期、地点和中国参展企业总数。然后以markdown表格形式列出所有中国参展企业，表头为：|企业名称|行业|。尽可能多列出企业。';

// ─── Concurrency & Retry Utilities ────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrent: number,
  staggerMs: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const idx = nextIndex++;
      results[idx] = await tasks[idx]();
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(maxConcurrent, tasks.length); i++) {
    if (i > 0) await delay(staggerMs); // stagger worker starts
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

// ─── Single Search Runner (with rate-limit retry) ─────────────────────────

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 3000; // 3 seconds

async function runSingleSearch(
  query: string,
  instruction: string,
  abortRef: React.RefObject<boolean>
): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (abortRef.current) return '';
    try {
      const stream = capabilityClient
        .load(SEARCH_PLUGIN_ID)
        .callStream(ACTION_KEY, { query, instruction });
      let text = '';
      for await (const chunk of stream) {
        if (abortRef.current) break;
        const piece = (chunk as Record<string, unknown>).summary;
        if (typeof piece === 'string' && piece) {
          text += piece;
        }
      }
      return text;
    } catch (err) {
      const errMsg = String(err);
      const isRateLimit = errMsg.includes('RateLimit') || errMsg.includes('频繁');
      if (isRateLimit && attempt < MAX_RETRIES) {
        const waitMs = RETRY_BASE_DELAY * (attempt + 1);
        logger.warn(`Rate limited on query (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${waitMs}ms:`, query.slice(0, 40));
        await delay(waitMs);
        continue;
      }
      logger.error('Search query failed:', query.slice(0, 60));
      return '';
    }
  }
  return '';
}

// ─── textToJson Extraction ───────────────────────────────────────────────

interface ExtractedInvestment {
  investor?: string;
  invested_company?: string;
  investment_amount?: string;
  investment_round?: string;
  investment_date?: string;
  investment_industry?: string;
}

interface ExtractedExpo {
  exhibition_name?: string;
  exhibition_type?: string;
  exhibition_date?: string;
  exhibition_location?: string;
  chinese_exhibitor_count?: number;
  chinese_exhibitor_names?: Array<{ company_name?: string }>;
  exhibition_description?: string;
}

async function extractInvestments(text: string): Promise<LiveInvestmentItem[]> {
  if (!text.trim()) return [];

  try {
    const result = await capabilityClient
      .load(INVEST_EXTRACT_PLUGIN_ID)
      .call(EXTRACT_ACTION, { search_result_text: text });

    const events = (result as Record<string, unknown>).investment_events as ExtractedInvestment[] | undefined;
    if (!Array.isArray(events) || events.length === 0) return [];

    const seen = new Set<string>();
    const items: LiveInvestmentItem[] = [];

    for (const ev of events) {
      const company = ev.invested_company?.trim() ?? '';
      if (!company || seen.has(company.toLowerCase())) continue;
      seen.add(company.toLowerCase());

      const dateStr = ev.investment_date?.trim() ?? '';
      const normalizedDate = normalizeDate(dateStr);

      const inst = ev.investor?.trim() ?? '未披露';
      const rnd = ev.investment_round?.trim() ?? '未披露';

      items.push({
        id: `live-inv-${items.length}`,
        company,
        institution: inst,
        sector: ev.investment_industry?.trim() ?? '其他',
        round: rnd,
        amount: ev.investment_amount?.trim() ?? '未披露',
        date: normalizedDate,
        summary: buildSummary(company, inst, rnd),
        source: 'live',
      });

      if (items.length >= 50) break;
    }

    return items;
  } catch (err) {
    logger.error('Investment extraction failed:', String(err));
    return [];
  }
}

async function extractExpo(text: string): Promise<ExtractedExpo | null> {
  if (!text.trim()) return null;

  try {
    const result = await capabilityClient
      .load(EXPO_EXTRACT_PLUGIN_ID)
      .call(EXTRACT_ACTION, { search_result_text: text });

    return result as ExtractedExpo;
  } catch (err) {
    logger.error('Expo extraction failed:', String(err));
    return null;
  }
}

// ─── Markdown Table Parser (middle layer between textToJson and regex) ───

function parseMarkdownInvestments(text: string): LiveInvestmentItem[] {
  const items: LiveInvestmentItem[] = [];
  const seen = new Set<string>();

  const lines = text.split('\n');
  for (const line of lines) {
    // Match markdown table rows: | col1 | col2 | ...
    if (!line.includes('|')) continue;
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 4) continue; // Need at least 4 columns

    // Skip separator rows (|---|---|)
    if (cells.some(c => /^[-:]+$/.test(c))) continue;

    // Broad header detection: skip if ANY cell contains header keywords
    const HEADER_KEYWORDS = [
      '企业名', '企业名称', '被投企业', '公司名', 'company',
      '投资机构', '投资机', '轮次', '金额', '日期', '赛道',
      '领域', '时间', '备注', '说明', '融资轮', '融资金',
      '概述', '摘要', '信息来源',
    ];
    if (cells.some(c => HEADER_KEYWORDS.some(h => c.toLowerCase().includes(h.toLowerCase())))) continue;

    const company = cells[0] ?? '';
    if (!company || company.length < 2 || company.length > 20) continue;
    // Skip non-company-looking values
    if (/^\d+$/.test(company) || company === '-' || company === 'N/A') continue;
    if (isGarbageValue(company)) continue;
    if (seen.has(company.toLowerCase())) continue;
    seen.add(company.toLowerCase());

    const institution = cells[1] ?? '未披露';
    const round = cells[2] ?? '未披露';
    const amount = cells[3] ?? '未披露';
    const dateStr = cells[4] ?? '';
    const sector = cells[5] ?? '其他';

    // Field-level validation: reject garbage values
    if (institution !== '未披露' && isGarbageValue(institution)) continue;
    if (round !== '未披露' && isGarbageValue(round)) continue;
    if (amount !== '未披露' && isGarbageValue(amount)) continue;
    if (sector !== '其他' && isGarbageValue(sector)) continue;

    const inst = institution || '未披露';
    const rnd = round || '未披露';
    const amt = amount || '未披露';
    const sec = sector || '其他';

    items.push({
      id: `live-inv-${items.length}`,
      company,
      institution: inst,
      round: rnd,
      amount: amt,
      date: normalizeDate(dateStr),
      sector: sec,
      summary: buildSummary(company, inst, rnd),
      source: 'live',
    });

    if (items.length >= 50) break;
  }

  return items;
}

function parseMarkdownExpos(text: string): Array<{ name: string; company: string; industry: string }> {
  const results: Array<{ name: string; company: string; industry: string }> = [];
  let currentExpoName = '';

  const lines = text.split('\n');
  for (const line of lines) {
    // Try to detect expo name from headings or bold text
    const headingMatch = line.match(/^#+\s*(.+)/);
    if (headingMatch) {
      currentExpoName = headingMatch[1].trim();
      continue;
    }
    const boldMatch = line.match(/\*\*(.+?)\*\*/);
    if (boldMatch && (line.includes('展') || line.includes('大会') || line.includes('CES') || line.includes('MWC'))) {
      currentExpoName = boldMatch[1].trim();
    }

    // Match table rows
    if (!line.includes('|')) continue;
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    if (cells.some(c => /^[-:]+$/.test(c))) continue;
    if (['企业名称', '公司名称', '参展企业', 'company'].some(h => cells[0].includes(h))) continue;

    const company = cells[0] ?? '';
    if (!company || company.length < 2 || company.length > 30) continue;
    if (/^\d+$/.test(company)) continue;

    results.push({
      name: currentExpoName,
      company,
      industry: cells[1] ?? '',
    });
  }

  return results;
}

// ─── Utility Functions ───────────────────────────────────────────────────

function normalizeDate(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) return '未披露';

  // Try YYYY-MM-DD
  const isoMatch = dateStr.match(/(20\d{2})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // Try YYYY年M月D日 or YYYY年M月
  const cnMatch = dateStr.match(/(20\d{2})年(\d{1,2})月(?:(\d{1,2})日?)?/);
  if (cnMatch) {
    const m = cnMatch[2].padStart(2, '0');
    const d = (cnMatch[3] || '01').padStart(2, '0');
    return `${cnMatch[1]}-${m}-${d}`;
  }

  // Try YYYY/MM/DD
  const slashMatch = dateStr.match(/(20\d{2})[/](\d{1,2})[/](\d{1,2})/);
  if (slashMatch) {
    return `${slashMatch[1]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[3].padStart(2, '0')}`;
  }

  // Try just YYYY
  const yearMatch = dateStr.match(/(20\d{2})/);
  if (yearMatch) return `${yearMatch[1]}-01-01`;

  return '未披露';
}

function mapExpoType(typeStr: string): 'consumer' | 'ai' | 'auto' | 'industrial' {
  const lower = (typeStr ?? '').toLowerCase();
  if (lower.includes('ai') || lower.includes('人工智能') || lower.includes('学术')) return 'ai';
  if (lower.includes('汽车') || lower.includes('auto') || lower.includes('车展')) return 'auto';
  if (lower.includes('工业') || lower.includes('制造') || lower.includes('机器人') || lower.includes('industrial')) return 'industrial';
  return 'consumer';
}

function expoNameToType(name: string): 'consumer' | 'ai' | 'auto' | 'industrial' {
  const lower = name.toLowerCase();
  if (['ces', 'mwc', 'ifa', 'computex', 'gitex', 'ise'].some(k => lower.includes(k))) return 'consumer';
  if (['waic', 'neurips', 'cvpr', 'aaai', 'iros', 'google'].some(k => lower.includes(k)) || lower.includes('人工智能')) return 'ai';
  if (['车展', 'iaa', 'mobility'].some(k => lower.includes(k))) return 'auto';
  if (['汉诺威', '工博会', '机器人大会', 'formnext', 'semicon', 'ciif', 'snec'].some(k => lower.includes(k))) return 'industrial';
  return 'consumer';
}

function expoNameToLocation(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('ces')) return '拉斯维加斯';
  if (lower.includes('mwc')) return '巴塞罗那';
  if (lower.includes('ifa')) return '柏林';
  if (lower.includes('computex')) return '台北';
  if (lower.includes('gitex')) return '迪拜';
  if (lower.includes('waic') || lower.includes('人工智能大会')) return '上海';
  if (lower.includes('neurips')) return '圣迭戈';
  if (lower.includes('cvpr')) return '纳什维尔';
  if (lower.includes('google')) return '山景城';
  if (lower.includes('北京车展')) return '北京';
  if (lower.includes('上海车展')) return '上海';
  if (lower.includes('广州车展')) return '广州';
  if (lower.includes('汉诺威')) return '汉诺威';
  if (lower.includes('机器人大会')) return '北京';
  if (lower.includes('工博会')) return '上海';
  return '';
}

// ─── Regex Fallback Parsers (last resort) ────────────────────────────────

function parseInvestmentsFallback(text: string): LiveInvestmentItem[] {
  const items: LiveInvestmentItem[] = [];
  const seenCompanies = new Set<string>();

  const knownInstitutions = [
    'IDG资本', 'IDG', '红杉中国', '红杉', '高瓴', '高瓴创投',
    'GGV', '经纬创投', '真格基金', '启明创投', '光速创投',
    '软银', '淡马锡', '老虎基金', 'DCM', '北极光',
    '腾讯投资', '阿里战投', '字节跳动', '百度风投', '美团龙珠',
    '中金资本', '招商局资本', '国投创新', '鼎晖投资', '春华资本',
    '五源资本', '源码资本', '钟鼎资本', '蓝驰创投', '创新工场',
    '联想之星', '梅花创投', '险峰长青', '英诺天使',
    '深创投', '达晨财智', '君联资本', '金沙江创投', '华登国际',
  ];

  const roundPatterns = [
    '天使轮', 'Pre-A轮', 'A轮', 'A+轮', 'A++轮',
    'B轮', 'B+轮', 'C轮', 'C+轮', 'D轮', 'E轮',
    'Pre-IPO', '战略投资',
  ];

  const sectorKeywords = [
    '人工智能', 'AI', '大模型', 'AIGC', 'Agent',
    '机器人', '芯片', '半导体', '新能源', '生物医药',
    'SaaS', '自动驾驶', '量子计算', '区块链', '基因治疗',
    '创新药', '固态电池', '智能汽车', '工业互联网',
  ];

  const lines = text.split('\n').map((l) => l.replace(/^[\s#*\-|>]+/, '').trim());

  for (const line of lines) {
    if (line.length < 10 || line.length > 300) continue;

    let foundInstitution = '';
    for (const inst of knownInstitutions) {
      if (line.includes(inst)) { foundInstitution = inst; break; }
    }

    let foundRound = '';
    for (const r of roundPatterns) {
      if (line.includes(r)) { foundRound = r; break; }
    }

    const hasAmount = /\d+[\d.]*\s*[亿万千百]+/.test(line);
    // Strict: require at least known institution OR (round + amount together)
    if (!foundInstitution && !(foundRound && hasAmount)) continue;

    // Try multiple company name patterns
    const companyPatterns = [
      line.match(/([\u4e00-\u9fa5A-Za-z]{2,12})\s*(完成|获得|获|宣布|融资)/),
      line.match(/([「「【《]?)([\u4e00-\u9fa5A-Za-z]{2,12})([」」】》]?)\s*[，,]\s*(?:完成|获得|获|宣布|融资)/),
      line.match(/^([\u4e00-\u9fa5]{2,10})/),
    ];

    let company = '';
    for (const m of companyPatterns) {
      if (m) {
        company = m[2] ?? m[1] ?? '';
        break;
      }
    }
    if (!company || company.length < 2 || seenCompanies.has(company.toLowerCase())) continue;
    // Skip if company looks like a common word
    if (['最近', '中国', '科技', '投资', '融资', '事件', '企业', '公司'].includes(company)) continue;
    seenCompanies.add(company.toLowerCase());

    const dateMatch = line.match(/(20\d{2})[年/\-.](\d{1,2})[月/\-.](\d{1,2})/) || line.match(/(20\d{2})年(\d{1,2})月/);
    let extractedDate = '未披露';
    if (dateMatch) {
      extractedDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${(dateMatch[3] || '01').padStart(2, '0')}`;
    }

    const amountMatch = line.match(/(\d+[\d.]*\s*[亿万千百]+[\u4e00-\u9fa5]*|[数几][亿千万]+[\u4e00-\u9fa5]*)/);
    const amount = amountMatch?.[1] ?? '未披露';

    let sector = '其他';
    for (const s of sectorKeywords) {
      if (line.includes(s)) { sector = s; break; }
    }

    items.push({
      id: `live-inv-${items.length}`,
      company,
      institution: foundInstitution || '未披露',
      sector,
      round: foundRound || '未披露',
      amount,
      date: extractedDate,
      summary: line.slice(0, 120),
      source: 'live',
    });

    if (items.length >= 50) break;
  }

  return items;
}

function parseExposFallback(text: string): LiveExpoItem[] {
  const items: LiveExpoItem[] = [];
  const seenNames = new Set<string>();

  const knownExpos = [
    { name: 'CES', type: 'consumer' as const, location: '拉斯维加斯' },
    { name: 'MWC', type: 'consumer' as const, location: '巴塞罗那' },
    { name: 'IFA', type: 'consumer' as const, location: '柏林' },
    { name: 'COMPUTEX', type: 'consumer' as const, location: '台北' },
    { name: 'GITEX', type: 'consumer' as const, location: '迪拜' },
    { name: 'ISE', type: 'consumer' as const, location: '巴塞罗那' },
    { name: 'WAIC', type: 'ai' as const, location: '上海' },
    { name: '世界人工智能大会', type: 'ai' as const, location: '上海' },
    { name: 'NeurIPS', type: 'ai' as const, location: '圣迭戈' },
    { name: 'CVPR', type: 'ai' as const, location: '纳什维尔' },
    { name: 'Google I/O', type: 'ai' as const, location: '山景城' },
    { name: 'Google IO', type: 'ai' as const, location: '山景城' },
    { name: 'AWS re:Invent', type: 'ai' as const, location: '拉斯维加斯' },
    { name: 'AAAI', type: 'ai' as const, location: '费城' },
    { name: 'IROS', type: 'ai' as const, location: '台北' },
    { name: '北京车展', type: 'auto' as const, location: '北京' },
    { name: '上海车展', type: 'auto' as const, location: '上海' },
    { name: '广州车展', type: 'auto' as const, location: '广州' },
    { name: 'IAA', type: 'auto' as const, location: '慕尼黑' },
    { name: 'Japan Mobility', type: 'auto' as const, location: '东京' },
    { name: '东京车展', type: 'auto' as const, location: '东京' },
    { name: '汉诺威', type: 'industrial' as const, location: '汉诺威' },
    { name: '世界机器人大会', type: 'industrial' as const, location: '北京' },
    { name: '工博会', type: 'industrial' as const, location: '上海' },
    { name: '中国国际工业博览会', type: 'industrial' as const, location: '上海' },
    { name: 'Formnext', type: 'industrial' as const, location: '法兰克福' },
    { name: 'SEMICON', type: 'industrial' as const, location: '上海' },
    { name: 'CIIF', type: 'industrial' as const, location: '上海' },
    { name: 'SNEC', type: 'industrial' as const, location: '上海' },
  ];

  const lines = text.split('\n');
  for (const line of lines) {
    for (const expo of knownExpos) {
      if (line.includes(expo.name) && !seenNames.has(expo.name.toLowerCase())) {
        seenNames.add(expo.name.toLowerCase());
        const countMatch = line.match(/(\d+)\s*家/);
        const dateMatch = line.match(/(20\d{2})[年/\-.](\d{1,2})[月/\-.](\d{1,2})/) || line.match(/(20\d{2})年(\d{1,2})月/);
        let extractedStart = '未披露';
        if (dateMatch) {
          extractedStart = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${(dateMatch[3] || '01').padStart(2, '0')}`;
        }

        items.push({
          id: `live-expo-${items.length}`,
          name: `${expo.name} ${new Date().getFullYear()}`,
          type: expo.type,
          startDate: extractedStart,
          endDate: extractedStart,
          location: expo.location,
          chineseExhibitorCount: countMatch ? parseInt(countMatch[1], 10) : 0,
          description: line.replace(/^[\s#*\-|>]+/, '').trim().slice(0, 120),
          exhibitors: [],
          source: 'live',
        });
        break;
      }
    }
    if (items.length >= 30) break;
  }

  return items;
}

// ─── Summary Section Extractor ──────────────────────────────────────────

function extractSection(text: string, keywords: string[]): string {
  if (!text) return '';
  const lines = text.split('\n');
  const relevantLines: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const hasKeyword = keywords.some((k) => line.includes(k));
    if (hasKeyword) inSection = true;
    if (inSection && /^#+\s/.test(line) && !keywords.some((k) => line.includes(k))) break;
    if (inSection) relevantLines.push(line);
  }

  return relevantLines.length > 0
    ? relevantLines.join('\n')
    : text.slice(0, 3000);
}

// ─── Main Hook ───────────────────────────────────────────────────────────

export function useLiveFeed(): LiveFeedState {
  const [fullSummary, setFullSummary] = useState('');
  const [liveInvestments, setLiveInvestments] = useState<LiveInvestmentItem[]>([]);
  const [liveExpos, setLiveExpos] = useState<LiveExpoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<FeedPhase>('idle');
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = loadLiveFeedCache();
    if (cached) {
      setFullSummary(cached.fullSummary);
      setLiveInvestments(cached.liveInvestments);
      setLiveExpos(cached.liveExpos);
      setLastUpdate(cached.timestamp);
      setPhase('done');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPhase('searching');
    abortRef.current = false;

    try {
      const queries = buildSearchQueries();

      // ── Phase 1: Staggered concurrent searches (max 3 at a time, 1.5s stagger) ──
      const allQueries = [
        ...queries.investments.map((q) => () => runSingleSearch(q, INVEST_INSTRUCTION, abortRef)),
        ...queries.expos.map((q) => () => runSingleSearch(q, EXPO_INSTRUCTION, abortRef)),
      ];
      const allResults = await runWithConcurrency(allQueries, 3, 1500);
      const investSearches = allResults.slice(0, queries.investments.length);
      const expoSearches = allResults.slice(queries.investments.length);
      if (abortRef.current) return;

      const investText = investSearches.filter(Boolean).join('\n\n---\n\n');
      const expoTexts = expoSearches.filter(Boolean);
      const allExpoText = expoTexts.join('\n\n---\n\n');
      const combinedText = [investText, allExpoText].filter(Boolean).join('\n\n===\n\n');

      // ── Phase 2: Structured extraction via textToJson ──
      setPhase('extracting');

      // Sequential extraction to avoid rate limits on textToJson plugin
      const extractedInvestments = await extractInvestments(investText);
      const extractedExpos: (ExtractedExpo | null)[] = [];
      for (const t of expoTexts) {
        if (abortRef.current) break;
        extractedExpos.push(await extractExpo(t));
        await delay(800); // stagger between expo extractions
      }

      if (abortRef.current) return;

      // ── Build investment items: 3-layer defense ──
      // Layer 1: textToJson structured extraction
      let investments = extractedInvestments;

      // Layer 2: Markdown table parser
      if (investments.length < 5 && investText) {
        logger.info(`textToJson returned ${investments.length} items, trying Markdown parser`);
        const mdItems = parseMarkdownInvestments(investText);
        if (mdItems.length > 0) {
          const existingCompanies = new Set(investments.map(i => i.company.toLowerCase()));
          const supplements = mdItems.filter(i => !existingCompanies.has(i.company.toLowerCase()));
          investments = [...investments, ...supplements];
        }
      }

      // Layer 3: Regex fallback
      if (investments.length < 5 && investText) {
        logger.info(`After Markdown: ${investments.length} items, trying regex fallback`);
        const regexItems = parseInvestmentsFallback(investText);
        const existingCompanies = new Set(investments.map(i => i.company.toLowerCase()));
        const supplements = regexItems.filter(i => !existingCompanies.has(i.company.toLowerCase()));
        investments = [...investments, ...supplements];
      }

      // ── Post-merge: validate all items and strip garbage ──
      const beforeCount = investments.length;
      investments = investments
        .filter(validateInvestment)
        .map((item, idx) => ({
          ...item,
          id: `live-inv-${idx}`,
          // Rebuild summary if it contains garbage
          summary: isGarbageValue(item.summary) ? buildSummary(item.company, item.institution, item.round) : item.summary,
        }));
      logger.info(`Validation: ${beforeCount} → ${investments.length} items (removed ${beforeCount - investments.length} garbage entries)`);

      // ── Build expo items ──
      const expoMap = new Map<string, LiveExpoItem>();

      // First, add textToJson extracted expos with exhibitors
      for (const extracted of extractedExpos) {
        if (!extracted?.exhibition_name) continue;

        const name = extracted.exhibition_name.trim();
        if (!name || expoMap.has(name.toLowerCase())) continue;

        const exhibitorNames = (extracted.chinese_exhibitor_names ?? [])
          .map((n) => (n as Record<string, string>).company_name?.trim() ?? '')
          .filter(Boolean);

        const location = extracted.exhibition_location?.trim()
          || expoNameToLocation(name);

        const startDate = normalizeDate(extracted.exhibition_date ?? '');
        const type = mapExpoType(extracted.exhibition_type ?? '') || expoNameToType(name);

        expoMap.set(name.toLowerCase(), {
          id: `live-expo-${expoMap.size}`,
          name: name.includes(String(new Date().getFullYear())) ? name : `${name} ${new Date().getFullYear()}`,
          type,
          startDate,
          endDate: startDate,
          location,
          chineseExhibitorCount: extracted.chinese_exhibitor_count ?? exhibitorNames.length,
          description: extracted.exhibition_description?.trim() ?? '',
          exhibitors: exhibitorNames,
          source: 'live',
        });
      }

      // Layer 2: Markdown expo exhibitors
      if (allExpoText) {
        const mdExpos = parseMarkdownExpos(allExpoText);
        // Group by expo name
        const exhibitorsByExpo = new Map<string, string[]>();
        for (const item of mdExpos) {
          const key = (item.name || '').toLowerCase();
          if (!key) continue;
          if (!exhibitorsByExpo.has(key)) exhibitorsByExpo.set(key, []);
          const list = exhibitorsByExpo.get(key)!;
          if (!list.includes(item.company)) list.push(item.company);
        }

        // Attach exhibitors to existing expos
        for (const [key, exhibitors] of exhibitorsByExpo) {
          // Try to match existing expo
          for (const [expoKey, expo] of expoMap) {
            if (expoKey.includes(key) || key.includes(expoKey.replace(/\s*\d{4}$/, ''))) {
              if (expo.exhibitors.length === 0) {
                expo.exhibitors = exhibitors;
                if (expo.chineseExhibitorCount === 0) {
                  expo.chineseExhibitorCount = exhibitors.length;
                }
              }
              break;
            }
          }
        }
      }

      // Layer 3: Regex fallback for expos not found by extraction
      if (allExpoText) {
        const regexExpos = parseExposFallback(allExpoText);
        for (const re of regexExpos) {
          const key = re.name.replace(/\s*\d{4}$/, '').toLowerCase();
          if (!expoMap.has(key)) {
            re.id = `live-expo-${expoMap.size}`;
            expoMap.set(key, re);
          }
        }
      }

      const expos = Array.from(expoMap.values());

      setPhase('done');

      // ── Save results ──
      const now = Date.now();
      setFullSummary(combinedText);
      setLiveInvestments(investments);
      setLiveExpos(expos);
      setLastUpdate(now);

      saveCache({
        fullSummary: combinedText,
        timestamp: now,
        liveInvestments: investments,
        liveExpos: expos,
      });

      logger.info(`Live feed complete: ${investments.length} investments, ${expos.length} expos`);
    } catch (err) {
      logger.error('Live feed search failed:', String(err));
      setError('实时情报获取失败，请点击刷新重试');
      setPhase('done');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchData();
    return () => {
      abortRef.current = true;
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    try {
      scopedStorage.setItem(CACHE_KEY, '');
    } catch {
      // ignore
    }
    setFullSummary('');
    setLiveInvestments([]);
    setLiveExpos([]);
    setPhase('idle');
    fetchData();
  }, [fetchData]);

  const investmentSummary = fullSummary
    ? extractSection(fullSummary, ['投资', 'PE/VC', '融资'])
    : '';
  const expoSummary = fullSummary
    ? extractSection(fullSummary, ['展会', '参展', 'CES', 'MWC', 'WAIC'])
    : '';

  return {
    investmentSummary,
    expoSummary,
    fullSummary,
    liveInvestments,
    liveExpos,
    isLoading,
    lastUpdate,
    error,
    phase,
    refresh,
    hasData: fullSummary.length > 0,
  };
}
