import { Note } from '../../pitch/note';
import { VocalRange } from '../../vocal-range/vocal-range';
import { EXERCISE_MODES, exerciseMode } from './exercise-modes';

const RANGE = VocalRange.between(Note.fromLabel('D3'), Note.fromLabel('D4'));

describe('exercise modes', () => {
  it('offers single notes, slides, patterns and singing from memory', () => {
    expect(EXERCISE_MODES.map((mode) => mode.id)).toEqual([
      'single-notes',
      'slides',
      'patterns',
      'from-memory',
    ]);
  });

  it('builds the planned number of rounds inside the singer’s range', () => {
    for (const mode of EXERCISE_MODES) {
      const rounds = mode.buildRounds(RANGE, Math.random);
      expect(rounds).toHaveLength(mode.roundCount);
      expect(rounds.flatMap((r) => r.targets).every((n) => RANGE.contains(n))).toBe(true);
    }
  });

  it('asks for shorter holds on each note of a pattern', () => {
    expect(exerciseMode('patterns').holdMsFor(1000)).toBeLessThan(1000);
    expect(exerciseMode('single-notes').holdMsFor(1000)).toBe(1000);
  });

  it('falls back to single notes for an unknown mode', () => {
    expect(exerciseMode('karaoke').id).toBe('single-notes');
  });
});
