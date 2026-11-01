import { DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { LivePitch } from '../../listening/live-pitch';
import { Note } from '../../pitch/note';
import { ReferenceTone } from '../../reference-tone/reference-tone';
import { ScreenWakeLock } from '../../shared/screen-wake-lock';
import { SUGGESTED_STARTING_RANGE } from '../../vocal-range/vocal-range';
import { VocalRangeStore } from '../../vocal-range/vocal-range.store';
import { PitchJudgement } from '../matching/pitch-judgement';
import { AttemptOutcome, SingleNotesSession } from '../session/single-notes-session';
import { PracticeSettingsStore } from '../settings/practice-settings.store';

export type SessionPhase = 'ready' | 'singing' | 'matched' | 'finished';

export const NOTES_PER_SESSION = 10;
/** How long "Matched!" shows before the next note plays. */
const CELEBRATION_MS = 1200;

/**
 * Runs a single-notes session on screen: plays each target, feeds the
 * singer's pitch to the current attempt, and moves on after a match or skip.
 */
@Injectable()
export class SessionRunner {
  private readonly livePitch = inject(LivePitch);
  private readonly referenceTone = inject(ReferenceTone);
  private readonly wakeLock = inject(ScreenWakeLock);
  private readonly rangeStore = inject(VocalRangeStore);
  private readonly settingsStore = inject(PracticeSettingsStore);
  private session: SingleNotesSession | null = null;
  private celebrationTimer: ReturnType<typeof setTimeout> | null = null;

  readonly phase = signal<SessionPhase>('ready');
  readonly target = signal<Note | null>(null);
  readonly number = signal(0);
  readonly total = NOTES_PER_SESSION;
  readonly holdProgress = signal(0);
  readonly judgement = signal<PitchJudgement | null>(null);
  readonly outcomes = signal<readonly AttemptOutcome[]>([]);

  constructor() {
    effect(() => {
      const reading = this.livePitch.reading();
      untracked(() => this.hear(reading?.hz ?? null));
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /** Must be called from a tap handler so the browser allows the microphone and sound. */
  async start(): Promise<void> {
    await this.livePitch.start();
    if (!this.livePitch.listening()) {
      return;
    }
    this.wakeLock.keepAwake();
    const settings = this.settingsStore.settings();
    this.session = SingleNotesSession.start(
      {
        range: this.rangeStore.range() ?? SUGGESTED_STARTING_RANGE,
        rules: settings.matchRules,
        holdMs: settings.holdMs,
        noteCount: NOTES_PER_SESSION,
      },
      performance.now(),
    );
    this.outcomes.set([]);
    this.beginCurrentNote();
  }

  playTarget(): void {
    const target = this.target();
    if (target) {
      void this.referenceTone.play(target);
    }
  }

  skip(): void {
    if (this.phase() === 'singing') {
      this.moveOn();
    }
  }

  /** Ends the session early; notes sung so far still show in the summary. */
  stop(): void {
    this.clearCelebration();
    this.referenceTone.stop();
    this.livePitch.stop();
    this.wakeLock.allowSleep();
    this.session = null;
    this.judgement.set(null);
    this.phase.set(this.outcomes().length > 0 ? 'finished' : 'ready');
  }

  private hear(sungHz: number | null): void {
    const attempt = this.session?.current;
    if (this.phase() !== 'singing' || !attempt) {
      return;
    }
    this.session!.observe(sungHz, performance.now());
    this.judgement.set(attempt.judgement);
    this.holdProgress.set(attempt.holdProgress);
    if (attempt.matched) {
      this.phase.set('matched');
      this.celebrationTimer = setTimeout(() => this.moveOn(), CELEBRATION_MS);
    }
  }

  private moveOn(): void {
    this.clearCelebration();
    const session = this.session;
    if (!session) {
      return;
    }
    session.moveOn(performance.now());
    this.outcomes.set([...session.outcomes]);
    if (session.finished) {
      this.stop();
    } else {
      this.beginCurrentNote();
    }
  }

  private beginCurrentNote(): void {
    const session = this.session!;
    this.target.set(session.current!.target);
    this.number.set(session.number);
    this.holdProgress.set(0);
    this.judgement.set(null);
    this.phase.set('singing');
    this.playTarget();
  }

  private clearCelebration(): void {
    if (this.celebrationTimer !== null) {
      clearTimeout(this.celebrationTimer);
      this.celebrationTimer = null;
    }
  }
}
