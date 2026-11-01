import { Note } from '../pitch/note';

/** Partials above this make the tone sound harsh on small speakers. */
export const MAX_PARTIAL_HZ = 4500;
const MAX_PARTIALS = 12;
/** String stiffness: real piano overtones are slightly sharper than whole multiples. */
const INHARMONICITY = 0.0004;
const BRIGHTEST_ROLLOFF = 1.0;
const SOFTEST_ROLLOFF = 1.8;
const LOW_MIDI = 40;
const HIGH_MIDI = 76;

/** Timings of each reference note, in seconds. */
export const PIANO_ENVELOPE = {
  hammerAttack: 0.005,
  /** How long the key is held before the damper falls. */
  hold: 1.6,
  damperRelease: 0.12,
  peakGain: 0.8,
  /** The filter starts open (bright hammer strike) and closes as the note rings. */
  brightnessDecay: 0.4,
} as const;

export interface PianoPartial {
  readonly frequency: number;
  /** Share of the note's total loudness; all partials add up to 1. */
  readonly amplitude: number;
  /** Time constant of the exponential fade. */
  readonly decaySeconds: number;
}

/**
 * The overtones that make up one piano-like reference note.
 *
 * Phone speakers can't reproduce low fundamentals, but the ear rebuilds a low
 * note from its overtones, so low notes get relatively strong overtones.
 */
export function pianoPartials(note: Note): PianoPartial[] {
  const f0 = note.frequency;
  const lowToHigh = Math.min(1, Math.max(0, (note.midi - LOW_MIDI) / (HIGH_MIDI - LOW_MIDI)));
  const rolloff = BRIGHTEST_ROLLOFF + (SOFTEST_ROLLOFF - BRIGHTEST_ROLLOFF) * lowToHigh;
  const fundamentalDecay = Math.min(4, Math.max(0.6, 3 * Math.sqrt(110 / f0)));

  const partials: { frequency: number; strength: number; decaySeconds: number }[] = [];
  for (let n = 1; n <= MAX_PARTIALS; n++) {
    const frequency = n * f0 * Math.sqrt(1 + INHARMONICITY * n * n);
    if (frequency > MAX_PARTIAL_HZ && n > 1) {
      break;
    }
    partials.push({
      frequency,
      strength: 1 / n ** rolloff,
      decaySeconds: fundamentalDecay / n ** 0.8,
    });
  }

  const totalStrength = partials.reduce((sum, p) => sum + p.strength, 0);
  return partials.map(({ frequency, strength, decaySeconds }) => ({
    frequency,
    amplitude: strength / totalStrength,
    decaySeconds,
  }));
}

/** Low-pass cutoff at the hammer strike and once the note has mellowed. */
export function pianoBrightness(note: Note): { strikeHz: number; restingHz: number } {
  return {
    strikeHz: Math.min(MAX_PARTIAL_HZ, note.frequency * 10),
    restingHz: Math.max(800, note.frequency * 3),
  };
}
