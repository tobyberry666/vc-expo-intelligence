import { expect, it } from 'vitest';
import { investmentId, expoId } from '../src/features/feed/identity';

it('uses route-safe stable identities independent of list position', () => {
  const item = {
    company: '星河科技',
    institution: 'IDG资本',
    round: 'A轮',
    date: '2026-07-01',
  };
  const id = investmentId(item);
  expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  expect(investmentId({ ...item, company: ' 星河科技 ' })).toBe(id);
  expect(investmentId({ ...item, round: 'B轮' })).not.toBe(id);
  expect(expoId({ name: 'CES 2026', startDate: '2026-01-06' })).not.toBe(
    expoId({ name: 'CES 2027', startDate: '2027-01-06' }),
  );
});
