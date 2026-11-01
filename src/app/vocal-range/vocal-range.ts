import { Note } from '../pitch/note';

/** A fifth: enough room for patterns like 1-2-3-4-5. */
export const MIN_SPAN_SEMITONES = 7;
/** The notes the pitch detector hears reliably (roughly 65–1050 Hz). */
const LOWEST_SUPPORTED = Note.fromLabel('C2');
const HIGHEST_SUPPORTED = Note.fromLabel('C6');

export interface StoredVocalRange {
  readonly lowestMidi: number;
  readonly highestMidi: number;
}

/** The notes a singer can sing comfortably. Exercises only use notes inside it. */
export class VocalRange {
  private constructor(
    readonly lowest: Note,
    readonly highest: Note,
  ) {}

  static between(lowest: Note, highest: Note): VocalRange {
    const problem = VocalRange.problemWith(lowest, highest);
    if (problem) {
      throw new RangeError(problem);
    }
    return new VocalRange(lowest, highest);
  }

  static isAllowed(lowest: Note, highest: Note): boolean {
    return VocalRange.problemWith(lowest, highest) === null;
  }

  static fromStored(stored: unknown): VocalRange | null {
    const candidate = stored as Partial<StoredVocalRange> | null;
    try {
      return VocalRange.between(
        Note.fromMidi(candidate?.lowestMidi as number),
        Note.fromMidi(candidate?.highestMidi as number),
      );
    } catch {
      return null;
    }
  }

  private static problemWith(lowest: Note, highest: Note): string | null {
    if (lowest.midi < LOWEST_SUPPORTED.midi || highest.midi > HIGHEST_SUPPORTED.midi) {
      return `A range must stay between ${LOWEST_SUPPORTED.label} and ${HIGHEST_SUPPORTED.label}`;
    }
    if (highest.midi - lowest.midi < MIN_SPAN_SEMITONES) {
      return `The highest note must be at least ${MIN_SPAN_SEMITONES} semitones above the lowest`;
    }
    return null;
  }

  get spanSemitones(): number {
    return this.highest.midi - this.lowest.midi;
  }

  contains(note: Note): boolean {
    return note.midi >= this.lowest.midi && note.midi <= this.highest.midi;
  }

  notes(): Note[] {
    return Array.from({ length: this.spanSemitones + 1 }, (_, i) => this.lowest.transpose(i));
  }

  canMoveLowestBy(semitones: number): boolean {
    return this.isMoveAllowed(this.lowest.midi + semitones, this.highest.midi);
  }

  canMoveHighestBy(semitones: number): boolean {
    return this.isMoveAllowed(this.lowest.midi, this.highest.midi + semitones);
  }

  withLowestMovedBy(semitones: number): VocalRange {
    return VocalRange.between(this.lowest.transpose(semitones), this.highest);
  }

  withHighestMovedBy(semitones: number): VocalRange {
    return VocalRange.between(this.lowest, this.highest.transpose(semitones));
  }

  equals(other: VocalRange): boolean {
    return this.lowest.equals(other.lowest) && this.highest.equals(other.highest);
  }

  toStored(): StoredVocalRange {
    return { lowestMidi: this.lowest.midi, highestMidi: this.highest.midi };
  }

  private isMoveAllowed(lowestMidi: number, highestMidi: number): boolean {
    return (
      lowestMidi >= 0 &&
      highestMidi <= 127 &&
      VocalRange.isAllowed(Note.fromMidi(lowestMidi), Note.fromMidi(highestMidi))
    );
  }
}

/** "1 octave", "about 1½ octaves": a span in words a beginner can picture. */
export function describeSpan(semitones: number): string {
  const halfOctaves = Math.max(1, Math.round(semitones / 6));
  const octaves = halfOctaves / 2;
  const whole = Math.floor(octaves);
  const words =
    octaves === 0.5
      ? 'half an octave'
      : `${whole}${octaves % 1 ? '½' : ''} ${octaves === 1 ? 'octave' : 'octaves'}`;
  return semitones % 6 === 0 ? words : `about ${words}`;
}

/** Comfortable for most voices; the starting point when setting a range by hand. */
export const SUGGESTED_STARTING_RANGE = VocalRange.between(
  Note.fromLabel('D3'),
  Note.fromLabel('D4'),
);
