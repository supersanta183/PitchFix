const CONCERT_A_HZ = 440;
const CONCERT_A_MIDI = 69;
const SEMITONES_PER_OCTAVE = 12;
const CENTS_PER_OCTAVE = 1200;

/** Fractional MIDI note number for a frequency (A4 = 440 Hz = 69). */
export function frequencyToMidi(hz: number): number {
  return CONCERT_A_MIDI + SEMITONES_PER_OCTAVE * Math.log2(hz / CONCERT_A_HZ);
}

export function midiToFrequency(midi: number): number {
  return CONCERT_A_HZ * 2 ** ((midi - CONCERT_A_MIDI) / SEMITONES_PER_OCTAVE);
}

/** Positive when `hz` is sharp of `referenceHz`, negative when flat. */
export function centsBetween(hz: number, referenceHz: number): number {
  return CENTS_PER_OCTAVE * Math.log2(hz / referenceHz);
}

/**
 * Removes whole octaves from a deviation so a singer one octave away from the
 * target counts as on pitch. Result is in [-600, 600).
 */
export function foldToNearestOctave(cents: number): number {
  const half = CENTS_PER_OCTAVE / 2;
  const folded = (((cents + half) % CENTS_PER_OCTAVE) + CENTS_PER_OCTAVE) % CENTS_PER_OCTAVE - half;
  return folded === 0 ? 0 : folded;
}
