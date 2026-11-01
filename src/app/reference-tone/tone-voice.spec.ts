import { Note } from '../pitch/note';
import { harmonicAmplitudes, MAX_HARMONIC_HZ } from './tone-voice';

describe('harmonicAmplitudes', () => {
  it('always includes the fundamental at full strength', () => {
    for (const label of ['E2', 'A3', 'C6']) {
      expect(harmonicAmplitudes(Note.fromLabel(label))[0]).toBe(1);
    }
  });

  it('keeps every harmonic below the brightness ceiling so the tone stays soft', () => {
    for (const label of ['E2', 'A3', 'C5', 'C6']) {
      const note = Note.fromLabel(label);
      const harmonics = harmonicAmplitudes(note);
      expect(harmonics.length * note.frequency).toBeLessThanOrEqual(MAX_HARMONIC_HZ);
    }
  });

  it('gives low notes enough upper harmonics to be heard on small phone speakers', () => {
    const low = harmonicAmplitudes(Note.fromLabel('E2'));
    expect(low.length).toBeGreaterThanOrEqual(8);
    expect(low[3]).toBeGreaterThan(0.2);
  });

  it('makes low notes brighter than high notes', () => {
    const low = harmonicAmplitudes(Note.fromLabel('C3'));
    const high = harmonicAmplitudes(Note.fromLabel('C5'));
    expect(low[2]).toBeGreaterThan(high[2]);
  });

  it('fades each harmonic relative to the one below it', () => {
    const harmonics = harmonicAmplitudes(Note.fromLabel('A3'));
    for (let i = 1; i < harmonics.length; i++) {
      expect(harmonics[i]).toBeLessThan(harmonics[i - 1]);
    }
  });
});
