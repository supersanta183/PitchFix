import { centsBetween } from '../pitch/pitch-math';
import { VoicePitchDetector } from './voice-pitch-detector';

const SAMPLE_RATE = 48_000;
const BUFFER_SIZE = 2048;

/** A voice-like tone: a fundamental plus decaying harmonics. */
function synthVoice(hz: number, amplitude = 0.3): Float32Array {
  const samples = new Float32Array(BUFFER_SIZE);
  const harmonics = [1, 0.6, 0.4, 0.25, 0.15];
  for (let i = 0; i < BUFFER_SIZE; i++) {
    const t = i / SAMPLE_RATE;
    samples[i] =
      harmonics.reduce((sum, gain, h) => sum + gain * Math.sin(2 * Math.PI * hz * (h + 1) * t), 0) *
      (amplitude / 2.4);
  }
  return samples;
}

function whiteNoise(): Float32Array {
  let seed = 42;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  return Float32Array.from({ length: BUFFER_SIZE }, () => random() * 0.2);
}

describe('VoicePitchDetector', () => {
  const detector = new VoicePitchDetector(BUFFER_SIZE);

  it.each([82.41, 110, 196, 261.63, 440, 880])('detects a %s Hz voice within 5 cents', (hz) => {
    const frame = detector.analyse(synthVoice(hz), SAMPLE_RATE);
    expect(Math.abs(centsBetween(frame.hz, hz))).toBeLessThan(5);
    expect(frame.clarity).toBeGreaterThan(0.9);
  });

  it('reports loudness of the buffer', () => {
    const loud = detector.analyse(synthVoice(220, 0.5), SAMPLE_RATE);
    const soft = detector.analyse(synthVoice(220, 0.05), SAMPLE_RATE);
    expect(loud.rms).toBeGreaterThan(soft.rms * 5);
  });

  it('reports low clarity for noise', () => {
    expect(detector.analyse(whiteNoise(), SAMPLE_RATE).clarity).toBeLessThan(0.9);
  });

  it('reports silence as zero loudness', () => {
    expect(detector.analyse(new Float32Array(BUFFER_SIZE), SAMPLE_RATE).rms).toBe(0);
  });
});
