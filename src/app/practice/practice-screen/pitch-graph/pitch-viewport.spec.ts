import { PitchViewport } from './pitch-viewport';

describe('PitchViewport', () => {
  const viewport = new PitchViewport(57, 13);

  it('spans the given number of semitones around its centre', () => {
    expect(viewport.lowMidi).toBe(50.5);
    expect(viewport.highMidi).toBe(63.5);
  });

  it('stays put while the voice is comfortably on screen', () => {
    expect(viewport.follow(57).centerMidi).toBe(57);
    expect(viewport.follow(52.5).centerMidi).toBe(57);
    expect(viewport.follow(61.5).centerMidi).toBe(57);
  });

  it('recentres on the voice when it nears the top or bottom edge', () => {
    expect(viewport.follow(62.5).centerMidi).toBe(62.5);
    expect(viewport.follow(45).centerMidi).toBe(45);
  });

  it('places notes on screen from bottom (low) to top (high)', () => {
    expect(viewport.yFor(viewport.lowMidi, 260)).toBe(260);
    expect(viewport.yFor(viewport.highMidi, 260)).toBe(0);
    expect(viewport.yFor(57, 260)).toBe(130);
  });

  it('moves gradually towards another viewport', () => {
    const target = new PitchViewport(67, 13);
    expect(viewport.approach(target, 0.5).centerMidi).toBe(62);
    expect(viewport.approach(target, 1).centerMidi).toBe(67);
  });
});
