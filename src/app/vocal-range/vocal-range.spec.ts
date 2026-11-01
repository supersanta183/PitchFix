import { Note } from '../pitch/note';
import { describeSpan, MIN_SPAN_SEMITONES, VocalRange } from './vocal-range';

const note = Note.fromLabel;

describe('VocalRange', () => {
  it('spans from the lowest to the highest comfortable note', () => {
    const range = VocalRange.between(note('E2'), note('A3'));
    expect(range.lowest.label).toBe('E2');
    expect(range.highest.label).toBe('A3');
    expect(range.spanSemitones).toBe(17);
  });

  it('includes both ends', () => {
    const range = VocalRange.between(note('C3'), note('C4'));
    expect(range.contains(note('C3'))).toBe(true);
    expect(range.contains(note('C4'))).toBe(true);
    expect(range.contains(note('B2'))).toBe(false);
    expect(range.contains(note('C#4'))).toBe(false);
  });

  it('lists every note in it, low to high', () => {
    const labels = VocalRange.between(note('C3'), note('G3'))
      .notes()
      .map((n) => n.label);
    expect(labels).toEqual(['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3']);
  });

  describe('rules', () => {
    it('needs the highest note above the lowest', () => {
      expect(() => VocalRange.between(note('C4'), note('C3'))).toThrow();
    });

    it(`needs at least ${MIN_SPAN_SEMITONES} semitones so exercises have room`, () => {
      expect(() => VocalRange.between(note('C3'), note('F#3'))).toThrow();
      expect(() => VocalRange.between(note('C3'), note('G3'))).not.toThrow();
    });

    it('stays within the notes the app can hear', () => {
      expect(() => VocalRange.between(note('B1'), note('C3'))).toThrow();
      expect(() => VocalRange.between(note('C5'), note('C#6'))).toThrow();
      expect(() => VocalRange.between(note('C2'), note('C6'))).not.toThrow();
    });

    it('can say whether a range would be allowed without throwing', () => {
      expect(VocalRange.isAllowed(note('C3'), note('G3'))).toBe(true);
      expect(VocalRange.isAllowed(note('C3'), note('D3'))).toBe(false);
    });
  });

  describe('adjusting by hand', () => {
    const range = VocalRange.between(note('C3'), note('C4'));

    it('moves the lowest or highest note by semitones', () => {
      expect(range.withLowestMovedBy(-2).lowest.label).toBe('A#2');
      expect(range.withHighestMovedBy(1).highest.label).toBe('C#4');
    });

    it('knows when a move would break the rules', () => {
      expect(range.canMoveLowestBy(5)).toBe(true);
      expect(range.canMoveLowestBy(6)).toBe(false);
      expect(() => range.withLowestMovedBy(6)).toThrow();
    });
  });

  it('round-trips through its stored form', () => {
    const range = VocalRange.between(note('E2'), note('A3'));
    expect(VocalRange.fromStored(range.toStored())?.equals(range)).toBe(true);
  });

  it('ignores stored data that is broken or breaks the rules', () => {
    expect(VocalRange.fromStored(null)).toBeNull();
    expect(VocalRange.fromStored({ lowestMidi: 'x' })).toBeNull();
    expect(VocalRange.fromStored({ lowestMidi: 60, highestMidi: 50 })).toBeNull();
  });
});

describe('describeSpan', () => {
  it('describes a range in octaves a beginner can picture', () => {
    expect(describeSpan(12)).toBe('1 octave');
    expect(describeSpan(24)).toBe('2 octaves');
    expect(describeSpan(18)).toBe('1½ octaves');
    expect(describeSpan(6)).toBe('half an octave');
  });

  it('says "about" when the span falls between half-octaves', () => {
    expect(describeSpan(17)).toBe('about 1½ octaves');
    expect(describeSpan(7)).toBe('about half an octave');
    expect(describeSpan(13)).toBe('about 1 octave');
  });
});
