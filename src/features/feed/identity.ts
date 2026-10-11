import type { LiveExpoItem, LiveInvestmentItem } from './types';

// Reversible identity avoids both order-dependent IDs and short-hash collisions.
function identity(prefix: string, fields: string[]): string {
  const bytes = new TextEncoder().encode(
    JSON.stringify(fields.map((s) => s.trim().normalize('NFKC').toLowerCase())),
  );
  const encoded = btoa(
    Array.from(bytes, (b) => String.fromCharCode(b)).join(''),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${prefix}-v1-${encoded}`;
}
export function investmentId(
  item: Pick<LiveInvestmentItem, 'company' | 'institution' | 'round' | 'date'>,
): string {
  return identity('live-inv', [
    item.company,
    item.institution,
    item.round,
    item.date,
  ]);
}
export function expoId(
  item: Pick<LiveExpoItem, 'name' | 'startDate' | 'identityDate'>,
): string {
  // Public catalogs keep the first verified date as an immutable identity anchor.
  return identity('live-expo', [
    item.name,
    item.identityDate ?? item.startDate,
  ]);
}
