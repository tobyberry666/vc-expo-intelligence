import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function evaluateAudit(report, exceptions, now = new Date()) {
  if (!report?.metadata?.vulnerabilities || !report.vulnerabilities)
    throw new Error('Invalid npm audit report');
  const expired = now >= new Date(`${exceptions.expires}T00:00:00Z`);
  const denied = new Set();
  for (const vulnerability of Object.values(report.vulnerabilities)) {
    for (const advisory of vulnerability.via) {
      if (typeof advisory !== 'object') continue;
      const id = advisory.url?.split('/').pop();
      if (expired || !exceptions.advisories[id])
        denied.add(id ?? advisory.name);
    }
  }
  return {
    denied: [...denied],
    expired,
    totals: report.metadata.vulnerabilities,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    let raw;
    if (process.argv[2]) raw = readFileSync(process.argv[2], 'utf8');
    else {
      if (!process.env.npm_execpath)
        throw new Error('Run via npm run audit:check or provide a report file');
      try {
        raw = execFileSync(
          process.execPath,
          [process.env.npm_execpath, 'audit', '--json'],
          { encoding: 'utf8', timeout: 120000, maxBuffer: 4000000 },
        );
      } catch (error) {
        if (error.status !== 1 || !error.stdout) throw error;
        raw = error.stdout;
      }
    }
    const exceptions = JSON.parse(
      readFileSync(
        new URL('../docs/security/exceptions.json', import.meta.url),
        'utf8',
      ),
    );
    const result = evaluateAudit(JSON.parse(raw), exceptions);
    console.log(JSON.stringify(result, null, 2));
    if (result.denied.length) process.exitCode = 1;
  } catch (error) {
    console.error(`Audit gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}
