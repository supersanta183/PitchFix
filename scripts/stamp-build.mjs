// Writes src/app/shared/build-stamp/build-info.generated.ts so the app can show which deploy is running.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

function gitCommit() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

/** Vercel deployment URLs look like "pitchfix-2cc2a1dvw-team.vercel.app"; the middle part identifies the deploy. */
function vercelDeploymentId() {
  const match = /^[^-]+-([a-z0-9]+)-/.exec(process.env.VERCEL_URL ?? '');
  return match ? match[1] : null;
}

const buildInfo = {
  deploymentId: vercelDeploymentId(),
  commit: gitCommit(),
  builtAt: new Date().toISOString(),
};

writeFileSync(
  new URL('../src/app/shared/build-stamp/build-info.generated.ts', import.meta.url),
  `import { BuildInfo } from './build-info';\n\nexport const BUILD_INFO: BuildInfo = ${JSON.stringify(buildInfo, null, 2)};\n`,
);
console.log('Build stamp:', buildInfo);
