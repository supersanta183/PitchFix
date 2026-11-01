import { PracticeSettings } from './practice-settings';

describe('PracticeSettings', () => {
  it('starts relaxed: ±50 cents, a 1 second hold and octave forgiveness on', () => {
    const settings = PracticeSettings.DEFAULT;
    expect(settings.toleranceCents).toBe(50);
    expect(settings.holdSeconds).toBe(1);
    expect(settings.octaveForgiveness).toBe(true);
  });

  it('turns into the rules used to judge singing', () => {
    const settings = PracticeSettings.DEFAULT.withTolerance(20).withOctaveForgiveness(false);
    expect(settings.matchRules).toEqual({ toleranceCents: 20, octaveForgiveness: false });
    expect(settings.withHoldSeconds(1.5).holdMs).toBe(1500);
  });

  it('only allows the offered tolerances and hold times', () => {
    expect(() => PracticeSettings.DEFAULT.withTolerance(7)).toThrow();
    expect(() => PracticeSettings.DEFAULT.withHoldSeconds(10)).toThrow();
  });

  it('names tolerances in words a beginner understands', () => {
    expect(PracticeSettings.TOLERANCES.map((t) => t.name)).toEqual([
      'Relaxed',
      'Steady',
      'Precise',
      'Expert',
    ]);
  });

  it('round-trips through its stored form', () => {
    const settings = PracticeSettings.DEFAULT.withTolerance(35).withHoldSeconds(2);
    expect(PracticeSettings.fromStored(settings.toStored())).toEqual(settings);
  });

  it('falls back to defaults for each broken stored value', () => {
    const restored = PracticeSettings.fromStored({
      toleranceCents: 13,
      holdSeconds: 2,
      octaveForgiveness: 'yes',
    });
    expect(restored.toleranceCents).toBe(50);
    expect(restored.holdSeconds).toBe(2);
    expect(restored.octaveForgiveness).toBe(true);
    expect(PracticeSettings.fromStored(null)).toEqual(PracticeSettings.DEFAULT);
  });
});
