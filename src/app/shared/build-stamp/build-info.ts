export interface BuildInfo {
  /** Vercel's id for the deployment, null for local builds. */
  readonly deploymentId: string | null;
  readonly commit: string | null;
  readonly builtAt: string;
}

export interface StampFormat {
  readonly locale?: string;
  readonly timeZone?: string;
}

/** A short label like "2cc2a1dvw · 0ac42f8 · 1 Nov, 14:05" identifying the running build. */
export function describeBuild(info: BuildInfo, format: StampFormat = {}): string {
  const builtAt = new Intl.DateTimeFormat(format.locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: format.timeZone,
  }).format(new Date(info.builtAt));
  return [info.deploymentId ?? 'local', info.commit, builtAt].filter(Boolean).join(' · ');
}
