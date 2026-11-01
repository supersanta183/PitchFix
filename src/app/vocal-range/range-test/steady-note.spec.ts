import { midiToFrequency } from '../../pitch/pitch-math';
import { HoldProgress, SteadyNoteDetector } from './steady-note';

const FRAME_MS = 16;

function sing(detector: SteadyNoteDetector, hzPerFrame: (number | null)[]): HoldProgress[] {
  return hzPerFrame.map((hz, i) => detector.next(hz, i * FRAME_MS));
}

function hold(hz: number, ms: number): number[] {
  return Array.from({ length: Math.ceil(ms / FRAME_MS) + 1 }, () => hz);
}

describe('SteadyNoteDetector', () => {
  let detector: SteadyNoteDetector;

  beforeEach(() => {
    detector = new SteadyNoteDetector(1000);
  });

  it('captures a note held steadily for the hold time', () => {
    const progress = sing(detector, hold(220, 1000));
    expect(progress.at(-1)?.captured?.label).toBe('A3');
    expect(progress.slice(0, -1).every((p) => p.captured === null)).toBe(true);
  });

  it('shows the note and how far through the hold the singer is', () => {
    const progress = sing(detector, hold(220, 500));
    expect(progress.at(-1)?.note?.label).toBe('A3');
    expect(progress.at(-1)?.progress).toBeCloseTo(0.5, 1);
  });

  it('captures the nearest note when the singer is a little flat', () => {
    const progress = sing(detector, hold(midiToFrequency(57 - 0.4), 1000));
    expect(progress.at(-1)?.captured?.label).toBe('A3');
  });

  it('accepts a gentle natural wobble', () => {
    const vibrato = hold(220, 1000).map((hz, i) => hz * 2 ** ((0.2 * Math.sin(i / 3)) / 12));
    expect(sing(detector, vibrato).some((p) => p.captured)).toBe(true);
  });

  it('starts over when the voice moves to another note', () => {
    const progress = sing(detector, [...hold(220, 600), ...hold(247, 600)]);
    expect(progress.some((p) => p.captured)).toBe(false);
    expect(progress.at(-1)?.note?.label).toBe('B3');
  });

  it('keeps going through a tiny dropout but starts over after a breath', () => {
    const tinyGap = [...hold(220, 500), null, null, ...hold(220, 520)];
    expect(sing(detector, tinyGap).some((p) => p.captured)).toBe(true);

    detector.reset();
    const breath = [...hold(220, 500), ...Array<null>(20).fill(null), ...hold(220, 500)];
    expect(sing(detector, breath).some((p) => p.captured)).toBe(false);
  });

  it('shows nothing while silent', () => {
    expect(detector.next(null, 0)).toEqual({ note: null, progress: 0, captured: null });
  });
});
