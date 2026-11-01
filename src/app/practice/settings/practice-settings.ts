import { MatchRules } from '../matching/pitch-judgement';

export interface ToleranceChoice {
  readonly cents: number;
  readonly name: string;
}

export interface StoredPracticeSettings {
  readonly toleranceCents: number;
  readonly holdSeconds: number;
  readonly octaveForgiveness: boolean;
}

const TOLERANCES: readonly ToleranceChoice[] = [
  { cents: 50, name: 'Relaxed' },
  { cents: 35, name: 'Steady' },
  { cents: 20, name: 'Precise' },
  { cents: 10, name: 'Expert' },
];
const HOLD_SECONDS: readonly number[] = [0.5, 1, 1.5, 2, 3];

/** How strictly singing is judged. */
export class PracticeSettings {
  static readonly TOLERANCES = TOLERANCES;
  static readonly HOLD_SECONDS = HOLD_SECONDS;
  static readonly DEFAULT = new PracticeSettings(50, 1, true);

  private constructor(
    /** How far from the target, either way, still counts as on pitch. */
    readonly toleranceCents: number,
    /** How long a note must be held in tune to count as matched. */
    readonly holdSeconds: number,
    /** Accept the target note in any octave. */
    readonly octaveForgiveness: boolean,
  ) {}

  static fromStored(stored: unknown): PracticeSettings {
    const candidate = (stored ?? {}) as Partial<StoredPracticeSettings>;
    const fallback = PracticeSettings.DEFAULT;
    return new PracticeSettings(
      TOLERANCES.some((t) => t.cents === candidate.toleranceCents)
        ? (candidate.toleranceCents as number)
        : fallback.toleranceCents,
      HOLD_SECONDS.includes(candidate.holdSeconds as number)
        ? (candidate.holdSeconds as number)
        : fallback.holdSeconds,
      typeof candidate.octaveForgiveness === 'boolean'
        ? candidate.octaveForgiveness
        : fallback.octaveForgiveness,
    );
  }

  get matchRules(): MatchRules {
    return { toleranceCents: this.toleranceCents, octaveForgiveness: this.octaveForgiveness };
  }

  get holdMs(): number {
    return this.holdSeconds * 1000;
  }

  withTolerance(cents: number): PracticeSettings {
    if (!TOLERANCES.some((t) => t.cents === cents)) {
      throw new RangeError(`Not an offered tolerance: ${cents}`);
    }
    return new PracticeSettings(cents, this.holdSeconds, this.octaveForgiveness);
  }

  withHoldSeconds(seconds: number): PracticeSettings {
    if (!HOLD_SECONDS.includes(seconds)) {
      throw new RangeError(`Not an offered hold time: ${seconds}`);
    }
    return new PracticeSettings(this.toleranceCents, seconds, this.octaveForgiveness);
  }

  withOctaveForgiveness(enabled: boolean): PracticeSettings {
    return new PracticeSettings(this.toleranceCents, this.holdSeconds, enabled);
  }

  toStored(): StoredPracticeSettings {
    return {
      toleranceCents: this.toleranceCents,
      holdSeconds: this.holdSeconds,
      octaveForgiveness: this.octaveForgiveness,
    };
  }
}
