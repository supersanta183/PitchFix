import { Note } from '../../pitch/note';
import { pickRandomNote } from './random-note';

const D3 = Note.fromLabel('D3');
const D4 = Note.fromLabel('D4');

describe('pickRandomNote', () => {
  it('picks every note in the range, including both ends', () => {
    const lowest = pickRandomNote(D3, D4, null, () => 0);
    const highest = pickRandomNote(D3, D4, null, () => 0.9999);
    expect(lowest.label).toBe('D3');
    expect(highest.label).toBe('D4');
  });

  it('spreads picks across the range', () => {
    expect(pickRandomNote(D3, D4, null, () => 0.56).label).toBe('A3');
  });

  it('never repeats the previous note when there is a choice', () => {
    const sameAsBefore = pickRandomNote(D3, D4, D3, () => 0);
    expect(sameAsBefore.equals(D3)).toBe(false);
  });

  it('returns the only note of a one-note range', () => {
    expect(pickRandomNote(D3, D3, D3, () => 0.5).label).toBe('D3');
  });
});
