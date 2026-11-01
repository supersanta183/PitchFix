import {
  centsBetween,
  foldToNearestOctave,
  frequencyToMidi,
  midiToFrequency,
} from '../pitch/pitch-math';
import { PitchFrame } from './pitch-frame';

export interface StabilizerSettings {
  readonly minClarity: number;
  readonly minRms: number;
  readonly minHz: number;
  readonly maxHz: number;
  readonly medianWindow: number;
  /** How long a new octave must hold before we believe it is real. */
  readonly octaveSwitchMs: number;
  /** Silence longer than this ends the phrase, so the next note may start in any octave. */
  readonly phraseGapMs: number;
}

export const DEFAULT_STABILIZER_SETTINGS: StabilizerSettings = {
  minClarity: 0.9,
  minRms: 0.01,
  minHz: 65,
  maxHz: 1100,
  medianWindow: 5,
  octaveSwitchMs: 80,
  phraseGapMs: 250,
};

/**
 * Turns noisy per-frame pitch estimates into a steady pitch line suitable for
 * display and scoring. Detectors like McLeod occasionally report the octave
 * above or below for a frame or two; those jumps are held back unless they
 * persist.
 */
export class PitchStabilizer {
  private recentMidi: number[] = [];
  private stableHz: number | null = null;
  private lastVoicedAtMs = Number.NEGATIVE_INFINITY;
  private octaveCandidateSinceMs: number | null = null;

  constructor(private readonly settings: StabilizerSettings = DEFAULT_STABILIZER_SETTINGS) {}

  /** Returns the stable pitch in Hz, or null when nobody is singing. */
  next(frame: PitchFrame, atMs: number): number | null {
    if (!this.isVoiced(frame)) {
      if (atMs - this.lastVoicedAtMs > this.settings.phraseGapMs) {
        this.reset();
      }
      return null;
    }
    this.lastVoicedAtMs = atMs;

    if (this.stableHz !== null && this.isOctaveJump(frame.hz, this.stableHz)) {
      this.octaveCandidateSinceMs ??= atMs;
      if (atMs - this.octaveCandidateSinceMs < this.settings.octaveSwitchMs) {
        return this.stableHz;
      }
      this.recentMidi = [];
    }
    this.octaveCandidateSinceMs = null;

    this.recentMidi.push(frequencyToMidi(frame.hz));
    if (this.recentMidi.length > this.settings.medianWindow) {
      this.recentMidi.shift();
    }
    this.stableHz = midiToFrequency(median(this.recentMidi));
    return this.stableHz;
  }

  reset(): void {
    this.recentMidi = [];
    this.stableHz = null;
    this.octaveCandidateSinceMs = null;
  }

  private isVoiced(frame: PitchFrame): boolean {
    const s = this.settings;
    return (
      frame.rms >= s.minRms &&
      frame.clarity >= s.minClarity &&
      frame.hz >= s.minHz &&
      frame.hz <= s.maxHz
    );
  }

  private isOctaveJump(hz: number, referenceHz: number): boolean {
    const cents = centsBetween(hz, referenceHz);
    return Math.abs(cents) > 1000 && Math.abs(foldToNearestOctave(cents)) < 200;
  }
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}
