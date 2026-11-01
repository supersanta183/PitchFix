import { Note } from '../../pitch/note';

/** Picks a note between `low` and `high` (inclusive), avoiding `previous` when possible. */
export function pickRandomNote(
  low: Note,
  high: Note,
  previous: Note | null,
  random: () => number = Math.random,
): Note {
  const candidates: Note[] = [];
  for (let midi = low.midi; midi <= high.midi; midi++) {
    if (previous?.midi !== midi) {
      candidates.push(Note.fromMidi(midi));
    }
  }
  if (candidates.length === 0) {
    return low;
  }
  return candidates[Math.floor(random() * candidates.length)];
}
