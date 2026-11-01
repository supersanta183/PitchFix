import { inject, Injectable } from '@angular/core';
import { Note } from '../pitch/note';
import { SharedAudioContext } from '../shared/audio/shared-audio-context';
import { SpeakerActivity } from '../shared/audio/speaker-activity';
import { PIANO_ENVELOPE, pianoBrightness, pianoPartials } from './piano-voice';

interface SoundingNote {
  readonly oscillators: OscillatorNode[];
  readonly output: GainNode;
}

/** Plays piano-like reference notes that are audible even on small phone speakers. */
@Injectable({ providedIn: 'root' })
export class ReferenceTone {
  private readonly audio = inject(SharedAudioContext);
  private readonly speaker = inject(SpeakerActivity);
  private sounding: SoundingNote[] = [];

  readonly playing = this.speaker.sounding;

  /** Must be called from a tap handler the first time, so the browser allows sound. */
  play(note: Note, holdSeconds: number = PIANO_ENVELOPE.hold): Promise<void> {
    return this.playSequence([note], holdSeconds);
  }

  /** Plays notes one after another, each held for `noteSeconds`. Resolves when the last has faded. */
  playSequence(notes: readonly Note[], noteSeconds: number): Promise<void> {
    this.stop();
    if (notes.length === 0) {
      return Promise.resolve();
    }
    const context = this.audio.acquire();
    const firstStrikeS = context.currentTime + 0.01;
    const sequence = notes.map((note, i) =>
      this.strike(context, note, firstStrikeS + i * noteSeconds, noteSeconds),
    );
    this.sounding = sequence.map(({ sounding }) => sounding);

    const endS = sequence[sequence.length - 1].endS;
    this.speaker.soundUntil(performance.now() + (endS - context.currentTime) * 1000);

    const last = this.sounding[this.sounding.length - 1];
    return new Promise<void>((resolve) => {
      last.oscillators[0].addEventListener('ended', () => {
        if (this.sounding.includes(last)) {
          this.sounding = [];
          this.speaker.silence(performance.now());
        }
        resolve();
      });
    });
  }

  stop(): void {
    if (this.sounding.length === 0) {
      return;
    }
    for (const { oscillators, output } of this.sounding) {
      const nowS = output.context.currentTime;
      output.gain.cancelScheduledValues(nowS);
      output.gain.setTargetAtTime(0, nowS, 0.02);
      for (const oscillator of oscillators) {
        oscillator.stop(nowS + 0.1);
      }
    }
    this.sounding = [];
    this.speaker.silence(performance.now() + 100);
  }

  private strike(
    context: AudioContext,
    note: Note,
    strikeS: number,
    holdSeconds: number,
  ): { sounding: SoundingNote; endS: number } {
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
    oscillators[0].addEventListener('ended', () => output.disconnect());

    return { sounding: { oscillators, output }, endS };
  }
}
