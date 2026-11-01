import { Note } from '../../pitch/note';
import { midiToFrequency } from '../../pitch/pitch-math';
import { judgePitch, MatchRules } from './pitch-judgement';

const A3 = Note.fromLabel('A3');
const hzAt = (note: Note, cents: number) => midiToFrequency(note.midi + cents / 100);

const forgiving: MatchRules = { toleranceCents: 50, octaveForgiveness: true };
const strictOctave: MatchRules = { toleranceCents: 50, octaveForgiveness: false };

describe('judgePitch', () => {
  it('is on pitch when exactly on the target', () => {
    expect(judgePitch(220, A3, forgiving)).toEqual({ centsOff: 0, verdict: 'on-pitch' });
  });

  it('is on pitch anywhere within the tolerance, including its edge', () => {
    expect(judgePitch(hzAt(A3, 49), A3, forgiving).verdict).toBe('on-pitch');
    expect(judgePitch(hzAt(A3, -50), A3, forgiving).verdict).toBe('on-pitch');
  });

  it('is too low when flat beyond the tolerance', () => {
    const judgement = judgePitch(hzAt(A3, -80), A3, forgiving);
    expect(judgement.verdict).toBe('too-low');
    expect(judgement.centsOff).toBeCloseTo(-80, 6);
  });

  it('is too high when sharp beyond the tolerance', () => {
    expect(judgePitch(hzAt(A3, 120), A3, forgiving).verdict).toBe('too-high');
  });

  it('applies a tighter tolerance', () => {
    expect(judgePitch(hzAt(A3, 30), A3, { ...forgiving, toleranceCents: 20 }).verdict).toBe(
      'too-high',
    );
  });

  describe('with octave forgiveness', () => {
    it('accepts the target note sung an octave lower or higher', () => {
      expect(judgePitch(110, A3, forgiving).verdict).toBe('on-pitch');
      expect(judgePitch(440, A3, forgiving).verdict).toBe('on-pitch');
    });

    it('measures the deviation from the nearest octave of the target', () => {
      expect(judgePitch(hzAt(A3, -1200 + 30), A3, forgiving).centsOff).toBeCloseTo(30, 6);
    });
  });

  describe('without octave forgiveness', () => {
    it('treats the wrong octave as far off', () => {
      const judgement = judgePitch(110, A3, strictOctave);
      expect(judgement.verdict).toBe('too-low');
      expect(judgement.centsOff).toBeCloseTo(-1200, 6);
    });
  });
});
