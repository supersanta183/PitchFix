import { centsBetween } from '../pitch/pitch-math';
import { PitchFrame } from './pitch-frame';
import { PitchStabilizer } from './pitch-stabilizer';

const FRAME_MS = 16;

function voiced(hz: number): PitchFrame {
  return { hz, clarity: 0.97, rms: 0.1 };
}

/** Feeds frames one per animation frame and returns the stabilizer's outputs. */
function sing(stabilizer: PitchStabilizer, frames: PitchFrame[], startMs = 0): (number | null)[] {
  return frames.map((frame, i) => stabilizer.next(frame, startMs + i * FRAME_MS));
}

function repeat(frame: PitchFrame, count: number): PitchFrame[] {
  return Array.from({ length: count }, () => frame);
}

describe('PitchStabilizer', () => {
  let stabilizer: PitchStabilizer;

  beforeEach(() => {
    stabilizer = new PitchStabilizer();
  });

  it('reports the pitch of a steady, clear voice', () => {
    const outputs = sing(stabilizer, repeat(voiced(220), 10));
    expect(outputs.at(-1)).toBeCloseTo(220, 6);
  });

  describe('when there is no usable voice', () => {
    it('reports nothing for quiet input', () => {
      expect(stabilizer.next({ hz: 220, clarity: 0.97, rms: 0.001 }, 0)).toBeNull();
    });

    it('reports nothing for noisy, unclear input', () => {
      expect(stabilizer.next({ hz: 220, clarity: 0.5, rms: 0.1 }, 0)).toBeNull();
    });

    it('reports nothing for frequencies outside the human singing range', () => {
      expect(stabilizer.next(voiced(30), 0)).toBeNull();
      expect(stabilizer.next(voiced(2500), 0)).toBeNull();
    });
  });

  describe('while the singer is mid-phrase', () => {
    const blurry = (hz: number): PitchFrame => ({ hz, clarity: 0.83, rms: 0.1 });
    const fading = (hz: number): PitchFrame => ({ hz, clarity: 0.97, rms: 0.003 });

    it('keeps following through less clear frames, such as during a fast slide', () => {
      const outputs = sing(stabilizer, [...repeat(voiced(220), 6), ...repeat(blurry(233), 6)]);
      expect(outputs.slice(6).every((hz) => hz !== null)).toBe(true);
      expect(outputs.at(-1)).toBeCloseTo(233, 6);
    });

    it('keeps following as the voice gets softer', () => {
      const outputs = sing(stabilizer, [...repeat(voiced(220), 6), ...repeat(fading(220), 4)]);
      expect(outputs.at(-1)).toBeCloseTo(220, 6);
    });

    it('does not start a new phrase from a less clear frame', () => {
      expect(stabilizer.next(blurry(220), 0)).toBeNull();
    });

    it('does not start a new phrase from a very soft frame', () => {
      expect(stabilizer.next(fading(220), 0)).toBeNull();
    });
  });

  it('smooths away a single glitchy frame', () => {
    const frames = [...repeat(voiced(220), 6), voiced(300), ...repeat(voiced(220), 2)];
    const outputs = sing(stabilizer, frames);
    for (const hz of outputs.slice(6)) {
      expect(hz).toBeCloseTo(220, 6);
    }
  });

  it('ignores a brief jump to the octave above', () => {
    const frames = [
      ...repeat(voiced(220), 6),
      ...repeat(voiced(440), 3),
      ...repeat(voiced(220), 3),
    ];
    const outputs = sing(stabilizer, frames);
    for (const hz of outputs.slice(6)) {
      expect(hz).toBeCloseTo(220, 6);
    }
  });

  it('ignores a brief jump to the octave below', () => {
    const frames = [
      ...repeat(voiced(220), 6),
      ...repeat(voiced(110), 3),
      ...repeat(voiced(220), 3),
    ];
    const outputs = sing(stabilizer, frames);
    for (const hz of outputs.slice(6)) {
      expect(hz).toBeCloseTo(220, 6);
    }
  });

  it('follows a real octave leap once it is held', () => {
    const frames = [...repeat(voiced(220), 6), ...repeat(voiced(440), 12)];
    const outputs = sing(stabilizer, frames);
    expect(outputs.at(-1)).toBeCloseTo(440, 6);
  });

  it('follows a smooth slide between notes', () => {
    const slide = Array.from({ length: 30 }, (_, i) => voiced(220 * 2 ** ((i / 29) * (7 / 12))));
    const frames = [...repeat(voiced(220), 5), ...slide, ...repeat(voiced(329.63), 5)];
    const outputs = sing(stabilizer, frames);

    expect(outputs.at(-1)).toBeCloseTo(329.63, 1);
    const midSlideLag = centsBetween(outputs[5 + 15]!, slide[15].hz);
    expect(Math.abs(midSlideLag)).toBeLessThan(60);
  });

  it('keeps its octave lock through a short breath', () => {
    const quiet: PitchFrame = { hz: 0, clarity: 0, rms: 0 };
    const frames = [
      ...repeat(voiced(220), 6),
      ...repeat(quiet, 3),
      voiced(440),
      ...repeat(voiced(220), 3),
    ];
    const outputs = sing(stabilizer, frames);
    expect(outputs[9]).toBeCloseTo(220, 6);
  });

  it('accepts a new note in any octave after a real pause', () => {
    const quiet: PitchFrame = { hz: 0, clarity: 0, rms: 0 };
    const frames = [...repeat(voiced(220), 6), ...repeat(quiet, 30), voiced(440)];
    const outputs = sing(stabilizer, frames);
    expect(outputs.at(-1)).toBeCloseTo(440, 6);
  });

  it('starts fresh after reset', () => {
    sing(stabilizer, repeat(voiced(220), 6));
    stabilizer.reset();
    expect(stabilizer.next(voiced(440), 1000)).toBeCloseTo(440, 6);
  });
});
