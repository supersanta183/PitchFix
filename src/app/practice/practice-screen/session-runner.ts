import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { LivePitch } from '../../listening/live-pitch';
import { Note } from '../../pitch/note';
import { ReferenceTone } from '../../reference-tone/reference-tone';
import { ScreenWakeLock } from '../../shared/screen-wake-lock';
import { KeyValueStore } from '../../shared/storage/key-value-store';
import { SUGGESTED_STARTING_RANGE } from '../../vocal-range/vocal-range';
import { VocalRangeStore } from '../../vocal-range/vocal-range.store';
import { ExerciseMode, exerciseMode } from '../exercises/exercise-modes';
import { PitchJudgement } from '../matching/pitch-judgement';
import { AttemptOutcome, PracticeSession } from '../session/practice-session';
import { PracticeSettingsStore } from '../settings/practice-settings.store';

export type SessionPhase =
  'ready' | 'listening' | 'remembering' | 'singing' | 'matched' | 'finished';

const MODE_KEY = 'exercise-mode';
/** How long "Matched!" shows before the next round's notes play. */
const ROUND_CELEBRATION_MS = 1200;
/** Pause after each matched note within a pattern. */
const NEXT_NOTE_PAUSE_MS = 250;
/** Silence between hearing a note and singing it, in "from memory" mode. */
const MEMORY_PAUSE_MS = 2000;

/**
 * Runs a practice session on screen: plays each round's notes, feeds the
 * singer's pitch to the current attempt, and moves on after a match or skip.
 */
@Injectable()
export class SessionRunner {
  private readonly livePitch = inject(LivePitch);
  private readonly referenceTone = inject(ReferenceTone);
  private readonly wakeLock = inject(ScreenWakeLock);
  private readonly storage = inject(KeyValueStore);
  private readonly rangeStore = inject(VocalRangeStore);
  private readonly settingsStore = inject(PracticeSettingsStore);
  private session: PracticeSession | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** Bumped whenever the flow changes, so late callbacks from an old prompt are ignored. */
  private flowId = 0;

  readonly mode = signal<ExerciseMode>(exerciseMode(this.storage.read(MODE_KEY) ?? ''));
  readonly phase = signal<SessionPhase>('ready');
  readonly roundNumber = signal(0);
  readonly totalRounds = signal(0);
  readonly noteNumber = signal(0);
  readonly notesInRound = signal(0);
  readonly roundName = signal<string | null>(null);
  /** The note to land on in this step. */
  readonly target = signal<Note | null>(null);
  /** For slides: the note to start on, until the singer has found it. */
  readonly slideFrom = signal<Note | null>(null);
  readonly holdProgress = signal(0);
  readonly judgement = signal<PitchJudgement | null>(null);
  readonly outcomes = signal<readonly AttemptOutcome[]>([]);

  readonly active = computed(() =>
    ['listening', 'remembering', 'singing', 'matched'].includes(this.phase()),
  );
  /** In "from memory" mode the target stays secret until it's matched or skipped. */
  readonly targetRevealed = computed(() => !this.mode().fromMemory || this.phase() === 'matched');

  constructor() {
    effect(() => {
      const reading = this.livePitch.reading();
      untracked(() => this.hear(reading?.hz ?? null));
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  chooseMode(mode: ExerciseMode): void {
    this.mode.set(mode);
    this.storage.write(MODE_KEY, mode.id);
  }

  /** Must be called from a tap handler so the browser allows the microphone and sound. */
  async start(): Promise<void> {
    await this.livePitch.start();
    if (!this.livePitch.listening()) {
      return;
    }
    this.wakeLock.keepAwake();
    const mode = this.mode();
    const settings = this.settingsStore.settings();
    this.session = PracticeSession.start(
      {
        rounds: mode.buildRounds(this.rangeStore.range() ?? SUGGESTED_STARTING_RANGE, Math.random),
        rules: settings.matchRules,
        holdMs: mode.holdMsFor(settings.holdMs),
      },
      performance.now(),
    );
    this.outcomes.set([]);
    this.totalRounds.set(this.session.totalRounds);
    this.beginNote();
  }

  /** Plays the current round's notes again (not offered when singing from memory). */
  replay(): void {
    if (this.phase() === 'singing' && !this.mode().fromMemory) {
      void this.playPrompt();
    }
  }

  skip(): void {
    if (['listening', 'remembering', 'singing'].includes(this.phase())) {
      this.moveOn();
    }
  }

  /** Ends the session early; notes sung so far still show in the summary. */
  stop(): void {
    this.flowId++;
    this.clearTimer();
    this.referenceTone.stop();
    this.livePitch.stop();
    this.wakeLock.allowSleep();
    this.session = null;
    this.judgement.set(null);
    this.phase.set(this.outcomes().length > 0 ? 'finished' : 'ready');
  }

  /** Leaves the summary to pick another exercise. */
  backToChoosing(): void {
    this.outcomes.set([]);
    this.phase.set('ready');
  }

  private hear(sungHz: number | null): void {
    const session = this.session;
    if (this.phase() !== 'singing' || !session?.current) {
      return;
    }
    session.observe(sungHz, performance.now());
    const focus = session.focus!;
    this.judgement.set(focus.judgement);
    this.holdProgress.set(focus.holdProgress);
    this.slideFrom.set(session.awaitingSlideStart ? session.round!.slideFrom! : null);

    if (session.current.matched) {
      const lastNoteOfRound = session.noteNumber === session.notesInRound;
      this.phase.set('matched');
      this.later(() => this.moveOn(), lastNoteOfRound ? ROUND_CELEBRATION_MS : NEXT_NOTE_PAUSE_MS);
    }
  }

  private moveOn(): void {
    this.clearTimer();
    const session = this.session;
    if (!session) {
      return;
    }
    session.moveOn(performance.now());
    this.outcomes.set([...session.outcomes]);
    if (session.finished) {
      this.stop();
    } else {
      this.beginNote();
    }
  }

  private beginNote(): void {
    const session = this.session!;
    this.flowId++;
    this.roundNumber.set(session.roundNumber);
    this.noteNumber.set(session.noteNumber);
    this.notesInRound.set(session.notesInRound);
    this.roundName.set(session.round!.name ?? null);
    this.target.set(session.current!.target);
    this.slideFrom.set(session.awaitingSlideStart ? session.round!.slideFrom! : null);
    this.holdProgress.set(0);
    this.judgement.set(null);
    if (session.startsNewRound) {
      void this.playPrompt();
    } else {
      this.phase.set('singing');
    }
  }

  private async playPrompt(): Promise<void> {
    const round = this.session?.round;
    if (!round) {
      return;
    }
    const flow = ++this.flowId;
    this.phase.set('listening');
    await this.referenceTone.playSequence(round.prompt, this.mode().promptNoteSeconds);
    if (flow !== this.flowId) {
      return;
    }
    if (this.mode().fromMemory) {
      this.phase.set('remembering');
      this.later(() => this.phase.set('singing'), MEMORY_PAUSE_MS);
    } else {
      this.phase.set('singing');
    }
  }

  private later(action: () => void, ms: number): void {
    this.clearTimer();
    const flow = this.flowId;
    this.timer = setTimeout(() => {
      if (flow === this.flowId) {
        action();
      }
    }, ms);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
