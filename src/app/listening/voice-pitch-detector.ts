import { PitchDetector } from 'pitchy';
import { PitchFrame } from './pitch-frame';

/** Estimates the pitch of one audio buffer using the McLeod Pitch Method (via pitchy). */
export class VoicePitchDetector {
  private readonly detector: PitchDetector<Float32Array>;

  constructor(readonly bufferSize: number) {
    this.detector = PitchDetector.forFloat32Array(bufferSize);
  }

  analyse(samples: Float32Array, sampleRate: number): PitchFrame {
    const rms = rootMeanSquare(samples);
    if (rms === 0) {
      return { hz: 0, clarity: 0, rms };
    }
    const [hz, clarity] = this.detector.findPitch(samples, sampleRate);
    return { hz, clarity, rms };
  }
}

function rootMeanSquare(samples: Float32Array): number {
  let sumOfSquares = 0;
  for (const sample of samples) {
    sumOfSquares += sample * sample;
  }
  return Math.sqrt(sumOfSquares / samples.length);
}
