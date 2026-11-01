export interface TracePoint {
  readonly atMs: number;
  /** Null while the singer is silent. */
  readonly hz: number | null;
}

export interface VoicedPoint extends TracePoint {
  readonly hz: number;
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

  lastVoiced(): VoicedPoint | null {
    for (let i = this.history.length - 1; i >= 0; i--) {
      const { atMs, hz } = this.history[i];
      if (hz !== null) {
        return { atMs, hz };
      }
    }
    return null;
  }

  /**
   * Continuous runs of singing, to draw as separate lines. Dropouts shorter
   * than `maxGapMs` are joined so a detector hiccup doesn't look like a breath.
   */
  strokes(maxGapMs: number): VoicedPoint[][] {
    const strokes: VoicedPoint[][] = [];
    let current: VoicedPoint[] = [];
    for (const point of this.history) {
      if (point.hz === null) {
        continue;
      }
      const previous = current.at(-1);
      if (previous && point.atMs - previous.atMs > maxGapMs) {
        strokes.push(current);
        current = [];
      }
      current.push({ atMs: point.atMs, hz: point.hz });
    }
    if (current.length > 0) {
      strokes.push(current);
    }
    return strokes;
  }

  clear(): void {
    this.history.length = 0;
  }
}
