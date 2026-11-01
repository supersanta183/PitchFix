import { Note } from '../../pitch/note';
import { VocalRange } from '../../vocal-range/vocal-range';
import { pickRandomNote } from '../exercises/random-note';
import { NoteAttempt } from '../matching/note-attempt';
import { MatchRules } from '../matching/pitch-judgement';

export interface SessionPlan {
  readonly range: VocalRange;
  readonly rules: MatchRules;
  readonly holdMs: number;
  readonly noteCount: number;
  readonly random?: () => number;
}

export interface AttemptOutcome {
  readonly target: Note;
  readonly matched: boolean;
  readonly timeToMatchMs: number | null;
}

/** A practice round of random single notes from the singer's range, one attempt at a time. */
export class SingleNotesSession {
  private attempt: NoteAttempt | null;
  private readonly results: AttemptOutcome[] = [];

  private constructor(
    private readonly plan: SessionPlan,
    atMs: number,
  ) {
    this.attempt = this.attemptAt(null, atMs);
  }

  static start(plan: SessionPlan, atMs: number): SingleNotesSession {
    return new SingleNotesSession(plan, atMs);
  }

  get current(): NoteAttempt | null {
    return this.attempt;
  }

  /** 1-based position of the current note. */
  get number(): number {
    return Math.min(this.results.length + 1, this.plan.noteCount);
  }

  get total(): number {
    return this.plan.noteCount;
  }

  get outcomes(): readonly AttemptOutcome[] {
    return this.results;
  }

  get matchedCount(): number {
    return this.results.filter((outcome) => outcome.matched).length;
  }

  get finished(): boolean {
    return this.attempt === null;
  }

  observe(sungHz: number | null, atMs: number): void {
    this.attempt?.observe(sungHz, atMs);
  }

  /** Records the current note (matched or not) and moves to the next one, or finishes. */
  moveOn(atMs: number): void {
    if (!this.attempt) {
      return;
    }
    const { target, matched, timeToMatchMs } = this.attempt;
    this.results.push({ target, matched, timeToMatchMs });
    this.attempt = this.results.length < this.plan.noteCount ? this.attemptAt(target, atMs) : null;
  }

  private attemptAt(previous: Note | null, atMs: number): NoteAttempt {
    const { range, rules, holdMs, random } = this.plan;
    const target = pickRandomNote(range.lowest, range.highest, previous, random);
    return NoteAttempt.start(target, rules, holdMs, atMs);
  }
}
