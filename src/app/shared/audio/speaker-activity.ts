import { Injectable, signal } from '@angular/core';

/**
 * Knows when the app itself is making sound, so listening can ignore the
 * speaker instead of mistaking it for the singer's voice.
 */
@Injectable({ providedIn: 'root' })
export class SpeakerActivity {
  private soundingUntilMs = Number.NEGATIVE_INFINITY;
  private readonly soundingSignal = signal(false);

  /** True while a reference tone is audible. */
  readonly sounding = this.soundingSignal.asReadonly();

  soundUntil(untilMs: number): void {
    this.soundingUntilMs = untilMs;
    this.soundingSignal.set(true);
  }

  silence(atMs: number): void {
    this.soundingUntilMs = Math.min(this.soundingUntilMs, atMs);
    this.soundingSignal.set(false);
  }

  /** Whether the speaker was sounding at `atMs`, or within `echoMs` before it. */
  wasSoundingRecently(atMs: number, echoMs: number): boolean {
    return atMs < this.soundingUntilMs + echoMs;
  }
}
