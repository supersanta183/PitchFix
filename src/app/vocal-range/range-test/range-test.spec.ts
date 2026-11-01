import { Note } from '../../pitch/note';
import { RangeTest } from './range-test';

const note = Note.fromLabel;

describe('RangeTest', () => {
  it('asks for the lowest note first', () => {
    expect(RangeTest.start().step).toBe('lowest');
  });

  it('asks for the highest note once the lowest is known', () => {
    const test = RangeTest.start().withLowest(note('E2'));
    expect(test.step).toBe('highest');
    expect(test.lowest?.label).toBe('E2');
  });

  it('finishes with the range once a high enough note is sung', () => {
    const test = RangeTest.start().withLowest(note('E2')).withHighest(note('A3'));
    expect(test.step).toBe('review');
    expect(test.range?.lowest.label).toBe('E2');
    expect(test.range?.highest.label).toBe('A3');
  });

  it('asks again when the highest note is too close to the lowest', () => {
    const lowest = RangeTest.start().withLowest(note('E3'));
    expect(lowest.acceptsAsHighest(note('A3'))).toBe(false);
    expect(lowest.acceptsAsHighest(note('B3'))).toBe(true);
  });

  it('refuses a too-close highest note instead of finishing', () => {
    const test = RangeTest.start().withLowest(note('E3'));
    expect(() => test.withHighest(note('F3'))).toThrow();
  });
});
