import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAudit } from '../scripts/check-audit.mjs';
const report = {
  metadata: { vulnerabilities: { high: 1 } },
  vulnerabilities: {
    dependency: {
      via: [{ url: 'https://github.com/advisories/GHSA-known' }, 'parent'],
    },
  },
};
test('allows only explicitly accepted, unexpired advisories', () => {
  assert.deepEqual(
    evaluateAudit(
      report,
      { expires: '2026-11-11', advisories: { 'GHSA-known': 'reason' } },
      new Date('2026-10-11'),
    ).denied,
    [],
  );
  assert.deepEqual(
    evaluateAudit(
      report,
      { expires: '2026-11-11', advisories: {} },
      new Date('2026-10-11'),
    ).denied,
    ['GHSA-known'],
  );
});
test('expired exceptions fail and invalid reports fail closed', () => {
  assert.equal(
    evaluateAudit(
      report,
      { expires: '2026-11-11', advisories: { 'GHSA-known': 'reason' } },
      new Date('2026-11-11'),
    ).denied.length,
    1,
  );
  assert.throws(() => evaluateAudit({}, {}), /Invalid/);
});
