import { Note } from '../../pitch/note';
import { VocalRange } from '../../vocal-range/vocal-range';
import { pickRandomNote } from './random-note';

/** One go at an exercise: notes the singer hears, then notes they sing back. */
export interface Round {
  /** Shown to the singer, e.g. "1-3-5-3-1" for a pattern. */
  readonly name?: string;
  /** Played before singing. */
  readonly prompt: readonly Note[];
  /** Matched one after another. */
  readonly targets: readonly Note[];
  /** For slides: the note to start on before sliding into the target. */
  readonly slideFrom?: Note;
}

export interface Pattern {
  readonly name: string;
  readonly degrees: readonly number[];
}

export const PATTERNS: readonly Pattern[] = [
  { name: '1-2-3-2-1', degrees: [1, 2, 3, 2, 1] },
  { name: '1-3-5-3-1', degrees: [1, 3, 5, 3, 1] },
  { name: '1-2-3-4-5-4-3-2-1', degrees: [1, 2, 3, 4, 5, 4, 3, 2, 1] },
];

/** Semitones above the key note for each degree of the major scale. */
const MAJOR_SCALE: Readonly<Record<number, number>> = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7 };
const SLIDE_MIN_SEMITONES = 3;
const SLIDE_MAX_SEMITONES = 7;

export function singleNoteRounds(range: VocalRange, count: number, random: () => number): Round[] {
  const rounds: Round[] = [];
  let previous: Note | null = null;
  for (let i = 0; i < count; i++) {
    const target: Note = pickRandomNote(range.lowest, range.highest, previous, random);
    rounds.push({ prompt: [target], targets: [target] });
    previous = target;
  }
  return rounds;
}

export function slideRounds(range: VocalRange, count: number, random: () => number): Round[] {
  return singleNoteRounds(range, count, random).map(({ targets: [target] }) => {
    const starts = slideStartsFor(target, range);
    const slideFrom = starts[Math.floor(random() * starts.length)];
    return { prompt: [slideFrom, target], targets: [target], slideFrom };
  });
}

export function patternRounds(range: VocalRange, count: number, random: () => number): Round[] {
  const rounds: Round[] = [];
  let previousTonic: Note | null = null;
  for (let i = 0; i < count; i++) {
    const pattern = PATTERNS[Math.floor(random() * PATTERNS.length)];
    const span = Math.max(...pattern.degrees.map((degree) => MAJOR_SCALE[degree]));
    const highestTonic = range.highest.transpose(-span);
    const tonic: Note = pickRandomNote(range.lowest, highestTonic, previousTonic, random);
    const notes = pattern.degrees.map((degree) => tonic.transpose(MAJOR_SCALE[degree]));
    rounds.push({ name: pattern.name, prompt: notes, targets: notes });
    previousTonic = tonic;
  }
  return rounds;
}

function slideStartsFor(target: Note, range: VocalRange): Note[] {
  const starts: Note[] = [];
  for (let distance = SLIDE_MIN_SEMITONES; distance <= SLIDE_MAX_SEMITONES; distance++) {
    for (const start of [target.midi - distance, target.midi + distance]) {
      if (start >= range.lowest.midi && start <= range.highest.midi) {
        starts.push(Note.fromMidi(start));
      }
    }
  }
  return starts;
}
