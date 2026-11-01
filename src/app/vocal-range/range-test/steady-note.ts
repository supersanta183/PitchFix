import { Note } from '../../pitch/note';
import { frequencyToMidi, midiToFrequency } from '../../pitch/pitch-math';

export interface HoldProgress {
  /** The note currently being held, if any. */
  readonly note: Note | null;
  /** 0–1: how much of the required hold time has passed. */
  readonly progress: number;
  /** Set on the frame the hold completes. */
  readonly captured: Note | null;
}

const NOTHING_HELD: HoldProgress = { note: null, progress: 0, captured: null };

/** Recognises when a singer holds one note steadily, e.g. to find their lowest note. */
export class SteadyNoteDetector {
  private runStartMs: number | null = null;
  private runMidi: number[] = [];
  private lastVoicedAtMs = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly holdMs: number,
    private readonly wobbleCents = 50,
    private readonly maxGapMs = 150,
  ) {}

  next(hz: number | null, atMs: number): HoldProgress {
    if (hz === null) {
      if (atMs - this.lastVoicedAtMs > this.maxGapMs) {
        this.reset();
        return NOTHING_HELD;
      }
      return this.progressAt(atMs);
    }
    this.lastVoicedAtMs = atMs;

    const midi = frequencyToMidi(hz);
    if (this.runStartMs === null || Math.abs(midi - this.centerMidi()) * 100 > this.wobbleCents) {
      this.runStartMs = atMs;
      this.runMidi = [];
    }
    this.runMidi.push(midi);

    const progress = this.progressAt(atMs);
    if (progress.progress >= 1) {
      this.reset();
      return { ...progress, captured: progress.note };
    }
    return progress;
  }

  reset(): void {
    this.runStartMs = null;
    this.runMidi = [];
  }

  private progressAt(atMs: number): HoldProgress {
    if (this.runStartMs === null) {
      return NOTHING_HELD;
    }
    return {
      note: Note.nearestTo(midiToFrequency(this.centerMidi())),
      progress: Math.min(1, (atMs - this.runStartMs) / this.holdMs),
      captured: null,
    };
  }

  private centerMidi(): number {
    const sorted = [...this.runMidi].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }
}
