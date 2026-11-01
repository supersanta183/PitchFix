import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LivePitch } from '../../listening/live-pitch';
import { MicrophoneHelp } from '../../listening/microphone-help/microphone-help';
import { Note } from '../../pitch/note';
import { ScreenWakeLock } from '../../shared/screen-wake-lock';
import { describeSpan } from '../vocal-range';
import { VocalRangeStore } from '../vocal-range.store';
import { RangeTest } from './range-test';
import { HoldProgress, SteadyNoteDetector } from './steady-note';

const HOLD_MS = 1000;
const NOTHING_HELD: HoldProgress = { note: null, progress: 0, captured: null };

@Component({
  selector: 'app-range-test-screen',
  imports: [RouterLink, MicrophoneHelp],
  templateUrl: './range-test-screen.html',
  styleUrl: './range-test-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeTestScreen {
  private readonly router = inject(Router);
  private readonly rangeStore = inject(VocalRangeStore);
  private readonly wakeLock = inject(ScreenWakeLock);
  private readonly livePitch = inject(LivePitch);
  private readonly detector = new SteadyNoteDetector(HOLD_MS);

  protected readonly test = signal(RangeTest.start());
  protected readonly hold = signal<HoldProgress>(NOTHING_HELD);
  /** A note the singer held, waiting for them to confirm it. */
  protected readonly heard = signal<Note | null>(null);
  protected readonly tooClose = signal<Note | null>(null);

  protected readonly status = this.livePitch.microphoneStatus;
  protected readonly listening = this.livePitch.listening;
  protected readonly needsHelp = computed(() =>
    ['denied', 'unsupported', 'unavailable'].includes(this.status()),
  );
  protected readonly spanDescription = computed(() => {
    const range = this.test().range;
    return range ? describeSpan(range.spanSemitones) : '';
  });

  constructor() {
    effect(() => {
      const reading = this.livePitch.reading();
      untracked(() => this.listenFor(reading?.hz ?? null));
    });
    inject(DestroyRef).onDestroy(() => this.stopListening());
  }

  protected async start(): Promise<void> {
    await this.livePitch.start();
    if (this.listening()) {
      this.wakeLock.keepAwake();
    }
  }

  protected accept(note: Note): void {
    this.heard.set(null);
    const test = this.test();
    if (test.step === 'lowest') {
      this.test.set(test.withLowest(note));
    } else {
      this.test.set(test.withHighest(note));
      this.stopListening();
    }
  }

  protected tryAgain(): void {
    this.heard.set(null);
    this.detector.reset();
  }

  protected startOver(): void {
    this.heard.set(null);
    this.tooClose.set(null);
    this.detector.reset();
    this.test.set(RangeTest.start());
    void this.start();
  }

  protected saveAndPractise(): void {
    const range = this.test().range;
    if (range) {
      this.rangeStore.save(range);
      void this.router.navigateByUrl('/');
    }
  }

  private listenFor(hz: number | null): void {
    if (this.heard() || this.test().step === 'review') {
      return;
    }
    const progress = this.detector.next(hz, performance.now());
    this.hold.set(progress);
    const captured = progress.captured;
    if (!captured) {
      return;
    }
    if (this.test().step === 'highest' && !this.test().acceptsAsHighest(captured)) {
      this.tooClose.set(captured);
      return;
    }
    this.tooClose.set(null);
    this.heard.set(captured);
  }

  private stopListening(): void {
    this.livePitch.stop();
    this.wakeLock.allowSleep();
    this.hold.set(NOTHING_HELD);
  }
}
