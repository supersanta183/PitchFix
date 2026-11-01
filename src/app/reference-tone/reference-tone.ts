import { inject, Injectable } from '@angular/core';
import { Note } from '../pitch/note';
import { SharedAudioContext } from '../shared/audio/shared-audio-context';
import { SpeakerActivity } from '../shared/audio/speaker-activity';
import { PIANO_ENVELOPE, pianoBrightness, pianoPartials } from './piano-voice';

interface SoundingNote {
  readonly oscillators: OscillatorNode[];
  readonly output: GainNode;
}

/** Plays a piano-like reference note that is audible even on small phone speakers. */
@Injectable({ providedIn: 'root' })
export class ReferenceTone {
  private readonly audio = inject(SharedAudioContext);
  private readonly speaker = inject(SpeakerActivity);
  private current: SoundingNote | null = null;

  readonly playing = this.speaker.sounding;

  /** Must be called from a tap handler the first time, so the browser allows sound. */
  play(note: Note, holdSeconds: number = PIANO_ENVELOPE.hold): Promise<void> {
    this.stop();
    const context = this.audio.acquire();
    const strikeS = context.currentTime + 0.01;
    const damperS = strikeS + holdSeconds;
    const endS = damperS + PIANO_ENVELOPE.damperRelease * 5;

    const output = context.createGain();
    output.gain.setValueAtTime(PIANO_ENVELOPE.peakGain, strikeS);
    output.gain.setTargetAtTime(0, damperS, PIANO_ENVELOPE.damperRelease);

    const { strikeHz, restingHz } = pianoBrightness(note);
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.5;
    filter.frequency.setValueAtTime(strikeHz, strikeS);
    filter.frequency.setTargetAtTime(restingHz, strikeS, PIANO_ENVELOPE.brightnessDecay);
    filter.connect(output).connect(context.destination);

    const oscillators = pianoPartials(note).map((partial) => {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = partial.frequency;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, strikeS);
      gain.gain.linearRampToValueAtTime(partial.amplitude, strikeS + PIANO_ENVELOPE.hammerAttack);
      gain.gain.setTargetAtTime(0, strikeS + PIANO_ENVELOPE.hammerAttack, partial.decaySeconds);
      oscillator.connect(gain).connect(filter);
      oscillator.start(strikeS);
      oscillator.stop(endS);
      return oscillator;
    });

    const sounding: SoundingNote = { oscillators, output };
    this.current = sounding;
    this.speaker.soundUntil(performance.now() + (endS - context.currentTime) * 1000);

    return new Promise<void>((resolve) => {
      oscillators[0].addEventListener('ended', () => {
        if (this.current === sounding) {
          this.current = null;
          this.speaker.silence(performance.now());
        }
        output.disconnect();
        resolve();
      });
    });
  }

  stop(): void {
    if (!this.current) {
      return;
    }
    const { oscillators, output } = this.current;
    this.current = null;
    const nowS = output.context.currentTime;
    output.gain.cancelScheduledValues(nowS);
    output.gain.setTargetAtTime(0, nowS, 0.02);
    for (const oscillator of oscillators) {
      oscillator.stop(nowS + 0.1);
    }
    this.speaker.silence(performance.now() + 100);
  }
}
