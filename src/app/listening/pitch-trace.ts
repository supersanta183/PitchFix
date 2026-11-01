export interface TracePoint {
  readonly atMs: number;
  /** Null while the singer is silent, which breaks the line. */
  readonly hz: number | null;
}

/** The recent history of sung pitch shown on the scrolling graph. */
export class PitchTrace {
  private readonly history: TracePoint[] = [];

  constructor(readonly windowMs: number) {}

  get points(): readonly TracePoint[] {
    return this.history;
  }

  add(atMs: number, hz: number | null): void {
    this.history.push({ atMs, hz });
    const oldestKept = atMs - this.windowMs;
    while (this.history.length > 0 && this.history[0].atMs < oldestKept) {
      this.history.shift();
    }
  }

  clear(): void {
    this.history.length = 0;
  }
}
