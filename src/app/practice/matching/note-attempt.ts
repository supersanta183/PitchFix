import { Note } from '../../pitch/note';
import { judgePitch, MatchRules, PitchJudgement } from './pitch-judgement';

/** Wobbles and detector dropouts shorter than this don't break a hold. */
const GRACE_MS = 150;

/**
 * One try at singing a target note. It counts as matched once the singer
 * holds the note within tolerance, without a real break, for the hold time.
 */
export class NoteAttempt {
  private inTuneSinceMs: number | null = null;
  private lastInTuneAtMs = Number.NEGATIVE_INFINITY;
  private latestJudgement: PitchJudgement | null = null;
  private matchedAtMs: number | null = null;

  private constructor(
    readonly target: Note,
    private readonly rules: MatchRules,
    private readonly holdMs: number,
    private readonly startedAtMs: number,
  ) {}

  static start(target: Note, rules: MatchRules, holdMs: number, atMs: number): NoteAttempt {
    return new NoteAttempt(target, rules, holdMs, atMs);
  }

  get matched(): boolean {
    return this.matchedAtMs !== null;
  }

  get timeToMatchMs(): number | null {
    return this.matchedAtMs === null ? null : this.matchedAtMs - this.startedAtMs;
  }

  get judgement(): PitchJudgement | null {
    return this.latestJudgement;
  }

  /** 0–1: how much of the hold time has been sung in tune. */
  get holdProgress(): number {
    return this.matched ? 1 : this.progressAt(this.lastInTuneAtMs);
  }

  /** Feeds the singer's current pitch (null when silent). */
  observe(sungHz: number | null, atMs: number): void {
    if (this.matched) {
      return;
    }
    this.latestJudgement = sungHz === null ? null : judgePitch(sungHz, this.target, this.rules);
    if (this.latestJudgement?.verdict !== 'on-pitch') {
      if (atMs - this.lastInTuneAtMs > GRACE_MS) {
        this.inTuneSinceMs = null;
      }
      return;
    }

    if (this.inTuneSinceMs === null || atMs - this.lastInTuneAtMs > GRACE_MS) {
      this.inTuneSinceMs = atMs;
    }
    this.lastInTuneAtMs = atMs;
    if (this.progressAt(atMs) >= 1) {
      this.matchedAtMs = atMs;
    }
  }

  private progressAt(atMs: number): number {
    if (this.inTuneSinceMs === null) {
      return 0;
    }
    return Math.min(1, (atMs - this.inTuneSinceMs) / this.holdMs);
  }
}
