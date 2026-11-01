import { Note } from '../pitch/note';
import { centsBetween } from '../pitch/pitch-math';
import { MAX_PARTIAL_HZ, pianoPartials } from './piano-voice';

describe('pianoPartials', () => {
  it('starts with the fundamental at the note frequency, as the loudest partial', () => {
    const a3 = Note.fromLabel('A3');
    const [fundamental, ...overtones] = pianoPartials(a3);
    expect(fundamental.frequency).toBeCloseTo(a3.frequency, 0);
    for (const overtone of overtones) {
      expect(overtone.amplitude).toBeLessThan(fundamental.amplitude);
    }
  });

  it('keeps the overall loudness the same for every note', () => {
    for (const label of ['E2', 'A3', 'C6']) {
      const total = pianoPartials(Note.fromLabel(label)).reduce((sum, p) => sum + p.amplitude, 0);
      expect(total).toBeCloseTo(1, 6);
    }
  });

  it('keeps every partial below the brightness ceiling', () => {
    for (const label of ['E2', 'A3', 'C5', 'C6']) {
      for (const partial of pianoPartials(Note.fromLabel(label))) {
        expect(partial.frequency).toBeLessThanOrEqual(MAX_PARTIAL_HZ);
      }
    }
  });

  it('gives low notes enough overtones to be heard on small phone speakers', () => {
    expect(pianoPartials(Note.fromLabel('E2')).length).toBeGreaterThanOrEqual(8);
  });

  it('tunes overtones slightly sharp, like real piano strings', () => {
    const a3 = Note.fromLabel('A3');
    const fifthPartial = pianoPartials(a3)[4];
    const sharpness = centsBetween(fifthPartial.frequency, a3.frequency * 5);
    expect(sharpness).toBeGreaterThan(0);
    expect(sharpness).toBeLessThan(15);
  });

  it('lets higher overtones die away faster than the fundamental', () => {
    const partials = pianoPartials(Note.fromLabel('A3'));
    for (let i = 1; i < partials.length; i++) {
      expect(partials[i].decaySeconds).toBeLessThan(partials[i - 1].decaySeconds);
    }
  });

  it('lets low notes ring longer than high notes', () => {
    const low = pianoPartials(Note.fromLabel('C3'))[0];
    const high = pianoPartials(Note.fromLabel('C5'))[0];
    expect(low.decaySeconds).toBeGreaterThan(high.decaySeconds);
  });
});
