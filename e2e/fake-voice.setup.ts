import { writeFileSync } from 'node:fs';
import { FAKE_VOICE_HZ, FAKE_VOICE_WAV } from './fake-voice';

const SAMPLE_RATE = 48_000;
const SECONDS = 3;

/** Writes a voice-like tone (fundamental plus harmonics) as a 16-bit mono WAV. */
export default function writeFakeVoice(): void {
  const sampleCount = SAMPLE_RATE * SECONDS;
  const harmonics = [1, 0.6, 0.4, 0.25, 0.15];
  const pcm = Buffer.alloc(sampleCount * 2);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const sample = harmonics.reduce(
      (sum, gain, h) => sum + gain * Math.sin(2 * Math.PI * FAKE_VOICE_HZ * (h + 1) * t),
      0,
    );
    pcm.writeInt16LE(Math.round((sample / 2.4) * 0.5 * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  writeFileSync(FAKE_VOICE_WAV, Buffer.concat([header, pcm]));
}
