import { centsBetween, foldToNearestOctave, frequencyToMidi, midiToFrequency } from './pitch-math';

describe('pitch math', () => {
  describe('frequency to MIDI', () => {
    it('places concert A (440 Hz) at MIDI 69', () => {
      expect(frequencyToMidi(440)).toBe(69);
    });

    it('places middle C (261.63 Hz) at MIDI 60', () => {
      expect(frequencyToMidi(261.6256)).toBeCloseTo(60, 4);
    });

    it('moves 12 semitones per doubling of frequency', () => {
      expect(frequencyToMidi(880)).toBe(81);
      expect(frequencyToMidi(220)).toBe(57);
    });

    it('returns fractional values between notes', () => {
      expect(frequencyToMidi(452.893)).toBeCloseTo(69.5, 3);
    });
  });

  describe('MIDI to frequency', () => {
    it('converts MIDI 69 to 440 Hz', () => {
      expect(midiToFrequency(69)).toBe(440);
    });

    it('converts low E2 (MIDI 40) to about 82.41 Hz', () => {
      expect(midiToFrequency(40)).toBeCloseTo(82.407, 3);
    });

    it('round-trips with frequencyToMidi', () => {
      for (const midi of [36, 48, 55.25, 60, 72.9, 84]) {
        expect(frequencyToMidi(midiToFrequency(midi))).toBeCloseTo(midi, 9);
      }
    });
  });

  describe('cents between frequencies', () => {
    it('is zero for identical frequencies', () => {
      expect(centsBetween(440, 440)).toBe(0);
    });

    it('is +1200 for one octave above and -1200 for one octave below', () => {
      expect(centsBetween(880, 440)).toBeCloseTo(1200, 9);
      expect(centsBetween(220, 440)).toBeCloseTo(-1200, 9);
    });

    it('is +100 for one semitone sharp', () => {
      expect(centsBetween(midiToFrequency(70), 440)).toBeCloseTo(100, 9);
    });

    it('is negative when singing flat', () => {
      expect(centsBetween(435, 440)).toBeCloseTo(-19.786, 3);
    });
  });

  describe('folding cents to the nearest octave', () => {
    it('leaves deviations within half an octave unchanged', () => {
      expect(foldToNearestOctave(30)).toBe(30);
      expect(foldToNearestOctave(-250)).toBe(-250);
    });

    it('treats a note one octave away as on pitch', () => {
      expect(foldToNearestOctave(1200)).toBe(0);
      expect(foldToNearestOctave(-1200)).toBe(0);
    });

    it('keeps the remaining deviation after removing whole octaves', () => {
      expect(foldToNearestOctave(1215)).toBeCloseTo(15, 9);
      expect(foldToNearestOctave(-2420)).toBeCloseTo(-20, 9);
    });

    it('folds into the range -600 (inclusive) to +600 (exclusive)', () => {
      expect(foldToNearestOctave(700)).toBe(-500);
      expect(foldToNearestOctave(600)).toBe(-600);
      expect(foldToNearestOctave(-600)).toBe(-600);
    });
  });
});
