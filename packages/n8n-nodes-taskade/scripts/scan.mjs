// Runs the n8n community package scanner before publish, on the source and on the packed tarball.
// After publish, n8n runs the same checks plus a provenance check:
//   npx @n8n/scan-community-package n8n-nodes-taskade
//
// Usage: npm run scan -- <directory where @n8n/scan-community-package is installed>
// Example:
//   npm install --no-save --prefix /tmp/n8n-scanner @n8n/scan-community-package@0.38.0
//   npm run build && npm run scan -- /tmp/n8n-scanner
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const scannerPrefix = process.argv[2];
if (!scannerPrefix) {
  console.error('Pass the directory where @n8n/scan-community-package is installed.');
  process.exit(2);
}
const scannerEntry = path.resolve(
  scannerPrefix,
  'node_modules/@n8n/scan-community-package/scanner/scanner.mjs',
);
const { analyzePackage, SOURCE_FILE_PATTERNS } = await import(pathToFileURL(scannerEntry).href);

const packageDir = process.cwd();
const packDir = mkdtempSync(path.join(tmpdir(), 'n8n-nodes-taskade-pack-'));
execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', packDir], {
  cwd: packageDir,
  stdio: 'ignore',
});
const tarball = readdirSync(packDir).find((file) => file.endsWith('.tgz'));
const tarballDir = path.join(packDir, 'package');
execFileSync('tar', ['-xzf', tarball, '-C', packDir], { cwd: packDir });

let failed = false;
for (const [label, dir, patterns] of [
  ['source', packageDir, SOURCE_FILE_PATTERNS],
  // The same file set that the scanner lints in a published tarball.
  ['tarball', tarballDir, ['**/*.js', 'package.json']],
]) {
  const result = await analyzePackage(dir, patterns);
  if (result.passed) {
    console.log(`PASS ${label}: no scanner violations`);
  } else {
    failed = true;
    console.log(`FAIL ${label}: ${result.message}`);
    if (result.details) {
      console.log(result.details);
    }
  }
}
process.exit(failed ? 1 : 0);
