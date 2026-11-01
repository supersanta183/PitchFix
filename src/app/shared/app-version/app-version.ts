/** Turns a package version like "2.1.0" into the short label "v2.1" shown in the app. */
export function displayVersion(packageVersion: string): string {
  const [major, minor] = packageVersion.split('.');
  return `v${major}.${minor}`;
}
