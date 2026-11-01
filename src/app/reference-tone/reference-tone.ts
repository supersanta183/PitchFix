import { inject, Injectable } from '@angular/core';
import { Note } from '../pitch/note';
import { SharedAudioContext } from '../shared/audio/shared-audio-context';
import { SpeakerActivity } from '../shared/audio/speaker-activity';
import { harmonicAmplitudes, TONE_ENVELOPE } from './tone-voice';

const DEFAULT_DURATION_S = 1.5;

/** Plays a soft, bright reference note that is audible even on small phone speakers. */
@Injectable({ providedIn: 'root' })
export class ReferenceTone {
  private readonly audio = inject(SharedAudioContext);
  private readonly speaker = inject(SpeakerActivity);
  private current: { oscillator: OscillatorNode; gain: GainNode } | null = null;

  readonly playing = this.speaker.sounding;

  /** Must be called from a tap handler the first time, so the browser allows sound. */
  play(note: Note, durationS = DEFAULT_DURATION_S): Promise<void> {
    this.stop();
    const context = this.audio.acquire();
    const startS = context.currentTime + 0.01;
    const releaseStartS = startS + Math.max(durationS, TONE_ENVELOPE.attack);
    const endS = releaseStartS + TONE_ENVELOPE.release;

    const oscillator = context.createOscillator();
    oscillator.frequency.value = note.frequency;
    oscillator.setPeriodicWave(createVoiceWave(context, note));

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, startS);
    gain.gain.linearRampToValueAtTime(TONE_ENVELOPE.peakGain, startS + TONE_ENVELOPE.attack);
    gain.gain.setValueAtTime(TONE_ENVELOPE.peakGain, releaseStartS);
    gain.gain.exponentialRampToValueAtTime(0.0001, endS);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startS);
    oscillator.stop(endS);

    this.speaker.soundUntil(performance.now() + (endS - context.currentTime) * 1000);
    const finished = new Promise<void>((resolve) => {
      oscillator.addEventListener('ended', () => {
        if (this.current?.oscillator === oscillator) {
          this.current = null;
          this.speaker.silence(performance.now());
        }
        resolve();
      });
    });
    this.current = { oscillator, gain };
    return finished;
  }

  stop(): void {
    if (!this.current) {
      return;
    }
    const { oscillator, gain } = this.current;
    this.current = null;
    const nowS = oscillator.context.currentTime;
    gain.gain.cancelScheduledValues(nowS);
    gain.gain.setTargetAtTime(0, nowS, 0.02);
    oscillator.stop(nowS + 0.1);
    this.speaker.silence(performance.now() + 100);
  }
}

function createVoiceWave(context: AudioContext, note: Note): PeriodicWave {
  const amplitudes = harmonicAmplitudes(note);
  const real = new Float32Array(amplitudes.length + 1);
  const imaginary = new Float32Array([0, ...amplitudes]);
  return context.createPeriodicWave(real, imaginary);
}
