import { Note } from '../../pitch/note';
import { Round } from '../exercises/exercise-rounds';
import { NoteAttempt } from '../matching/note-attempt';
import { MatchRules } from '../matching/pitch-judgement';

/** The start note of a slide only needs to be found, not held for long. */
const SLIDE_START_HOLD_MS = 250;

export interface SessionPlan {
  readonly rounds: readonly Round[];
  readonly rules: MatchRules;
  readonly holdMs: number;
}

export interface AttemptOutcome {
  /** 0-based index of the round the note belonged to. */
  readonly round: number;
  readonly target: Note;
  readonly matched: boolean;
  readonly timeToMatchMs: number | null;
}

/** A practice session: rounds of notes to hear and sing back, one note attempt at a time. */
export class PracticeSession {
  private roundIndex = 0;
  private noteIndex = 0;
  private attempt: NoteAttempt | null = null;
  private slideStart: NoteAttempt | null = null;
  private readonly results: AttemptOutcome[] = [];

  private constructor(private readonly plan: SessionPlan) {}

  static start(plan: SessionPlan, atMs: number): PracticeSession {
    const session = new PracticeSession(plan);
    session.beginNote(atMs);
    return session;
  }

  get round(): Round | null {
    return this.plan.rounds[this.roundIndex] ?? null;
  }

  get roundNumber(): number {
    return Math.min(this.roundIndex + 1, this.totalRounds);
  }

  get totalRounds(): number {
    return this.plan.rounds.length;
  }

  get noteNumber(): number {
    return this.noteIndex + 1;
  }

  get notesInRound(): number {
    return this.round?.targets.length ?? 0;
  }

  /** True on the first note of a round, when the round's prompt should be played. */
  get startsNewRound(): boolean {
    return this.noteIndex === 0 && !this.finished;
  }

  /** The note being matched. */
  get current(): NoteAttempt | null {
    return this.attempt;
  }

  get awaitingSlideStart(): boolean {
    return this.slideStart !== null && !this.slideStart.matched;
  }

  /** The note the singer should be on right now: the slide's start note, or the target. */
  get focus(): NoteAttempt | null {
    return this.awaitingSlideStart ? this.slideStart : this.attempt;
  }

  get outcomes(): readonly AttemptOutcome[] {
    return this.results;
  }

  get matchedCount(): number {
    return this.results.filter((outcome) => outcome.matched).length;
  }

  get finished(): boolean {
    return this.roundIndex >= this.plan.rounds.length;
  }

  observe(sungHz: number | null, atMs: number): void {
    if (this.awaitingSlideStart) {
      this.slideStart!.observe(sungHz, atMs);
      return;
    }
    this.attempt?.observe(sungHz, atMs);
  }

  /** Records the current note (matched or not) and moves to the next note, round, or the end. */
  moveOn(atMs: number): void {
    const attempt = this.attempt;
    if (!attempt) {
      return;
    }
    const { target, matched, timeToMatchMs } = attempt;
    this.results.push({ round: this.roundIndex, target, matched, timeToMatchMs });

    this.noteIndex++;
    if (this.noteIndex >= this.notesInRound) {
      this.roundIndex++;
      this.noteIndex = 0;
    }
    this.beginNote(atMs);
  }

  private beginNote(atMs: number): void {
    const round = this.round;
    if (!round) {
      this.attempt = null;
      this.slideStart = null;
      return;
    }
    const { rules, holdMs } = this.plan;
    this.attempt = NoteAttempt.start(round.targets[this.noteIndex], rules, holdMs, atMs);
    this.slideStart =
      round.slideFrom && this.noteIndex === 0
        ? NoteAttempt.start(round.slideFrom, rules, SLIDE_START_HOLD_MS, atMs)
        : null;
  }
}
