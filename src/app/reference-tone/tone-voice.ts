import { Note } from '../pitch/note';

/** Harmonics above this make the tone sound buzzy rather than soft. */
export const MAX_HARMONIC_HZ = 4000;
const MAX_HARMONICS = 16;
const BRIGHTEST_ROLLOFF = 1.1;
const SOFTEST_ROLLOFF = 1.9;
const LOW_MIDI = 40;
const HIGH_MIDI = 76;

/** Volume envelope of each reference note, in seconds. */
export const TONE_ENVELOPE = {
  attack: 0.04,
  release: 0.3,
  peakGain: 0.5,
} as const;

/**
 * Relative strength of each harmonic (index 0 = fundamental) for a reference note.
 *
 * Phone speakers can't reproduce low fundamentals, but the ear rebuilds a low
 * note from its harmonics. Low notes therefore get a slower rolloff (brighter),
 * high notes a faster one (softer), and nothing above MAX_HARMONIC_HZ.
 */
export function harmonicAmplitudes(note: Note): number[] {
  const lowToHigh = Math.min(1, Math.max(0, (note.midi - LOW_MIDI) / (HIGH_MIDI - LOW_MIDI)));
  const rolloff = BRIGHTEST_ROLLOFF + (SOFTEST_ROLLOFF - BRIGHTEST_ROLLOFF) * lowToHigh;
  const count = Math.max(1, Math.min(MAX_HARMONICS, Math.floor(MAX_HARMONIC_HZ / note.frequency)));
  return Array.from({ length: count }, (_, i) => 1 / (i + 1) ** rolloff);
}
