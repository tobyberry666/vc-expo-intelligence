import { describe, expect, it } from 'vitest';
import { normalizeDate } from '../src/features/feed/dates';
import {
  parseMarkdownInvestments,
  parseInvestmentsFallback,
} from '../src/features/feed/parsers';

describe('investment parsing regressions', () => {
  it('preserves date precision instead of fabricating January 1', () => {
    expect(normalizeDate('2026')).toBe('2026');
    expect(normalizeDate('2026-07')).toBe('2026-07');
  });

  it('rejects impossible dates', () => {
    expect(normalizeDate('2026-02-30')).toBe('未披露');
    expect(normalizeDate('2026-13-01')).toBe('未披露');
    expect(normalizeDate('2024年2月29日')).toBe('2024-02-29');
  });

  it('keeps empty table cells aligned', () => {
    const [item] = parseMarkdownInvestments(
      '| 星河科技 | | A轮 | 1亿元 | 2026-07-01 | AI |',
    );
    expect(item).toMatchObject({
      company: '星河科技',
      institution: '未披露',
      round: 'A轮',
      amount: '1亿元',
      date: '2026-07-01',
    });
  });

  it('retains different financing rounds for one company', () => {
    const items = parseMarkdownInvestments(
      '| 星河科技 | IDG资本 | A轮 | 1亿元 | 2026-07-01 | AI |\n| 星河科技 | IDG资本 | B轮 | 2亿元 | 2026-09-01 | AI |',
    );
    expect(items).toHaveLength(2);
  });

  it('extracts the company rather than the financing verb', () => {
    expect(
      parseInvestmentsFallback(
        '星河科技完成A轮融资1亿元，IDG资本领投，2026年7月1日',
      )[0]?.company,
    ).toBe('星河科技');
  });
});
