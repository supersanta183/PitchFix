import { centsBetween, frequencyToMidi, midiToFrequency } from './pitch-math';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const LETTER_OFFSETS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LABEL_PATTERN = /^([A-Ga-g])([#b]?)(-?\d+)$/;

export type NoteName = (typeof NOTE_NAMES)[number];

/** A note of the equal-tempered scale, identified by its MIDI number. */
export class Note {
  private constructor(readonly midi: number) {}

  static fromMidi(midi: number): Note {
    if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
      throw new RangeError(`Not a MIDI note number: ${midi}`);
    }
    return new Note(midi);
  }

  /** Parses labels like "A4", "C#3" or "Db3". */
  static fromLabel(label: string): Note {
    const match = LABEL_PATTERN.exec(label.trim());
    if (!match) {
      throw new RangeError(`Not a note label: ${label}`);
    }
    const [, letter, accidental, octave] = match;
    const accidentalOffset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
    const midi = (Number(octave) + 1) * 12 + LETTER_OFFSETS[letter.toUpperCase()] + accidentalOffset;
    return Note.fromMidi(midi);
  }

  static nearestTo(hz: number): Note {
    return Note.fromMidi(Math.round(frequencyToMidi(hz)));
  }

  get name(): NoteName {
    return NOTE_NAMES[this.midi % 12];
  }

  get octave(): number {
    return Math.floor(this.midi / 12) - 1;
  }

  get label(): string {
    return `${this.name}${this.octave}`;
  }

  get frequency(): number {
    return midiToFrequency(this.midi);
  }

  /** Positive when `hz` is sharp of this note, negative when flat. */
  centsFrom(hz: number): number {
    return centsBetween(hz, this.frequency);
  }

  transpose(semitones: number): Note {
    return Note.fromMidi(this.midi + semitones);
  }

  equals(other: Note): boolean {
    return this.midi === other.midi;
  }
}
