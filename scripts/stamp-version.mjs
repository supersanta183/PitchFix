// Copies the package.json version into the app so it can show which release is running.
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

writeFileSync(
  new URL('../src/app/shared/app-version/app-version.generated.ts', import.meta.url),
  `export const PACKAGE_VERSION = '${version}';\n`,
);
console.log(`App version: ${version}`);
