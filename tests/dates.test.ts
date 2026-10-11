import { expect, it } from 'vitest';
import {
  normalizeDate,
  dateRange,
  compareDatesDesc,
  formatDateRange,
  getExpoStatus,
} from '../src/features/feed/dates';

it.each([
  ['2026/7/1', '2026-07-01'],
  ['2026年7月', '2026-07'],
  ['2026-07', '2026-07'],
  ['', '未披露'],
  ['tomorrow', '未披露'],
  ['2026-00-01', '未披露'],
  ['2026-01-00', '未披露'],
])('normalizes %s without inventing facts', (input, output) =>
  expect(normalizeDate(input)).toBe(output),
);
it('preserves and validates expo date ranges', () => {
  expect(dateRange('2026-01-06至2026-01-09')).toEqual([
    '2026-01-06',
    '2026-01-09',
  ]);
  expect(dateRange('2026-01-09至2026-01-06')).toEqual(['未披露', '未披露']);
  expect(dateRange('2026年7月')).toEqual(['2026-07', '2026-07']);
  expect(dateRange('')).toEqual(['未披露', '未披露']);
});
it('sorts unknown dates last and displays partial dates safely', () => {
  expect(['未披露', '2026', '2026-07-01'].sort(compareDatesDesc)).toEqual([
    '2026-07-01',
    '2026',
    '未披露',
  ]);
  expect(compareDatesDesc('未披露', '未披露')).toBe(0);
  expect(compareDatesDesc('2026', '未披露')).toBe(-1);
  expect(formatDateRange('未披露', '未披露')).toBe('日期未披露');
  expect(formatDateRange('2026', '2026')).toBe('2026');
  expect(formatDateRange('2026-07', '未披露')).toBe('2026-07');
  expect(formatDateRange('2026-01-06', '2026-01-09')).toContain('2026-01-09');
});
it('treats the entire last day as ongoing and does not guess partial-date status', () => {
  expect(getExpoStatus('2026-01-06', '2026-01-09', '2026-01-09').label).toBe(
    '进行中',
  );
  expect(getExpoStatus('2026-01-06', '2026-01-09', '2026-01-01').label).toBe(
    '即将开展',
  );
  expect(getExpoStatus('2026-01-06', '2026-01-09', '2026-01-10').label).toBe(
    '已结束',
  );
  expect(getExpoStatus('2026', '2026', '2026-01-01').label).toBe('日期待确认');
  expect(getExpoStatus('2026-02-30', '2026-03-01', '2026-02-01').label).toBe(
    '日期待确认',
  );
  expect(getExpoStatus('2026-03-01', '2026-02-30', '2026-02-01').label).toBe(
    '日期待确认',
  );
  expect(getExpoStatus('2026-03-02', '2026-03-01').label).toBe('日期待确认');
});
