import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Chrome loops this file as the microphone input during end-to-end tests. */
export const FAKE_VOICE_WAV = join(tmpdir(), 'pitchfix-fake-voice-a3.wav');
export const FAKE_VOICE_HZ = 220;
