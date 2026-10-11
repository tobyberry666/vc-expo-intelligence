export const UNKNOWN_DATE = '未披露';

export function normalizeDate(input: string): string {
  const text = input.trim();
  const match = text.match(
    /^(20\d{2})(?:[-/年](\d{1,2})(?:[-/月](\d{1,2})日?)?月?)?$/,
  );
  if (!match) return UNKNOWN_DATE;
  const [, year, month, day] = match;
  if (!month) return year;
  const m = Number(month);
  if (m < 1 || m > 12) return UNKNOWN_DATE;
  if (!day) return `${year}-${month.padStart(2, '0')}`;
  const d = Number(day);
  const maxDay = new Date(Date.UTC(Number(year), m, 0)).getUTCDate();
  if (d < 1 || d > maxDay) return UNKNOWN_DATE;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function dateRange(input: string): [string, string] {
  const parts = input.split(/至|\s+[-–—]\s+|~|～/);
  const start = normalizeDate(parts[0]);
  const end = normalizeDate(parts[1] ?? parts[0]);
  if (start !== UNKNOWN_DATE && end !== UNKNOWN_DATE && end < start)
    return [UNKNOWN_DATE, UNKNOWN_DATE];
  return [start, end];
}

export function compareDatesDesc(a: string, b: string): number {
  const left = normalizeDate(a);
  const right = normalizeDate(b);
  if (left === UNKNOWN_DATE) return right === UNKNOWN_DATE ? 0 : 1;
  if (right === UNKNOWN_DATE) return -1;
  return right.localeCompare(left);
}

export function formatDateRange(start: string, end: string): string {
  if (start === UNKNOWN_DATE || normalizeDate(start) === UNKNOWN_DATE)
    return '日期未披露';
  if (start === end || end === UNKNOWN_DATE) return start;
  return `${start} — ${end}`;
}

export function getExpoStatus(
  start: string,
  end: string,
  today = new Date().toLocaleDateString('sv-SE'),
): { label: string; variant: string } {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    normalizeDate(start) === UNKNOWN_DATE ||
    normalizeDate(end) === UNKNOWN_DATE ||
    end < start
  ) {
    return {
      label: '日期待确认',
      variant: 'bg-muted text-muted-foreground border-border',
    };
  }
  if (today < start)
    return {
      label: '即将开展',
      variant: 'bg-warning/15 text-warning border-warning/20',
    };
  if (today <= end)
    return {
      label: '进行中',
      variant: 'bg-success/15 text-success border-success/20',
    };
  return {
    label: '已结束',
    variant: 'bg-muted text-muted-foreground border-border',
  };
}
