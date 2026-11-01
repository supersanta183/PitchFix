import { Note } from '../../pitch/note';
import { VocalRange } from '../../vocal-range/vocal-range';
import { patternRounds, PATTERNS, singleNoteRounds, slideRounds } from './exercise-rounds';

const note = Note.fromLabel;
const RANGE = VocalRange.between(note('D3'), note('D4'));
const NARROWEST = VocalRange.between(note('C3'), note('G3'));

function seededRandom(seed = 11): () => number {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

describe('single note rounds', () => {
  it('plays one note and asks for the same note, never twice in a row', () => {
    const rounds = singleNoteRounds(RANGE, 30, seededRandom());
    expect(rounds).toHaveLength(30);
    rounds.forEach((round, i) => {
      expect(round.prompt).toEqual(round.targets);
      expect(round.targets).toHaveLength(1);
      expect(RANGE.contains(round.targets[0])).toBe(true);
      if (i > 0) {
        expect(round.targets[0].equals(rounds[i - 1].targets[0])).toBe(false);
      }
    });
  });
});

describe('slide rounds', () => {
  const rounds = slideRounds(RANGE, 40, seededRandom());

  it('starts each slide a few notes away from the target', () => {
    for (const round of rounds) {
      const distance = Math.abs(round.slideFrom!.midi - round.targets[0].midi);
      expect(distance).toBeGreaterThanOrEqual(3);
      expect(distance).toBeLessThanOrEqual(7);
    }
  });

  it('keeps both the start and the target inside the range', () => {
    for (const round of rounds) {
      expect(RANGE.contains(round.slideFrom!)).toBe(true);
      expect(RANGE.contains(round.targets[0])).toBe(true);
    }
  });

  it('plays the start note, then the target', () => {
    for (const round of rounds) {
      expect(round.prompt).toEqual([round.slideFrom, round.targets[0]]);
    }
  });

  it('slides both up and down', () => {
    const upwards = rounds.filter((r) => r.slideFrom!.midi < r.targets[0].midi);
    expect(upwards.length).toBeGreaterThan(0);
    expect(upwards.length).toBeLessThan(rounds.length);
  });
});

describe('pattern rounds', () => {
  it('sings major-scale patterns from a key note', () => {
    const rounds = patternRounds(RANGE, 20, seededRandom());
    for (const round of rounds) {
      const tonic = round.targets[0];
      const steps = round.targets.map((n) => n.midi - tonic.midi);
      const pattern = PATTERNS.find((p) => p.name === round.name)!;
      const majorScale: Record<number, number> = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7 };
      expect(steps).toEqual(pattern.degrees.map((degree) => majorScale[degree]));
      expect(round.prompt).toEqual(round.targets);
    }
  });

  it('picks keys so every note of the pattern fits the range', () => {
    for (const round of patternRounds(RANGE, 30, seededRandom())) {
      expect(round.targets.every((n) => RANGE.contains(n))).toBe(true);
    }
  });

  it('works even in the narrowest allowed range', () => {
    for (const round of patternRounds(NARROWEST, 20, seededRandom())) {
      expect(round.targets.every((n) => NARROWEST.contains(n))).toBe(true);
      if (round.name !== '1-2-3-2-1') {
        expect(round.targets[0].label).toBe('C3');
      }
    }
  });

  it('includes the classic 1-2-3-4-5-4-3-2-1 pattern', () => {
    expect(PATTERNS.map((p) => p.name)).toContain('1-2-3-4-5-4-3-2-1');
  });
});
