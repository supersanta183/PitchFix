import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { LivePitch } from '../../listening/live-pitch';
import { MicrophoneHelp } from '../../listening/microphone-help/microphone-help';
import { Note } from '../../pitch/note';
import { ReferenceTone } from '../../reference-tone/reference-tone';
import { VersionLabel } from '../../shared/app-version/version-label';
import { ScreenWakeLock } from '../../shared/screen-wake-lock';
import { pickRandomNote } from '../exercises/random-note';
import { DEFAULT_MATCH_RULES, judgePitch } from '../matching/pitch-judgement';
import { HeadphonesTip } from './headphones-tip/headphones-tip';
import { PitchGraph } from './pitch-graph/pitch-graph';
import { TuningMeter } from './tuning-meter/tuning-meter';

/** Comfortable for most voices; used until the singer has set up their own range. */
const PROVISIONAL_RANGE = { low: Note.fromLabel('D3'), high: Note.fromLabel('D4') };

@Component({
  selector: 'app-practice-screen',
  imports: [VersionLabel, PitchGraph, TuningMeter, HeadphonesTip, MicrophoneHelp],
  templateUrl: './practice-screen.html',
  styleUrl: './practice-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeScreen {
  private readonly wakeLock = inject(ScreenWakeLock);
  private readonly referenceTone = inject(ReferenceTone);
  protected readonly livePitch = inject(LivePitch);

  protected readonly rules = DEFAULT_MATCH_RULES;
  protected readonly target = signal(
    pickRandomNote(PROVISIONAL_RANGE.low, PROVISIONAL_RANGE.high, null),
  );
  protected readonly reading = this.livePitch.reading;
  protected readonly tonePlaying = this.referenceTone.playing;
  protected readonly judgement = computed(() => {
    const reading = this.reading();
    return reading ? judgePitch(reading.hz, this.target(), this.rules) : null;
  });

  protected readonly showDiagnostics = new URLSearchParams(location.search).has('debug');
  protected readonly rawFrame = this.livePitch.rawFrame;
  protected readonly status = this.livePitch.microphoneStatus;
  protected readonly needsHelp = computed(() =>
    ['denied', 'unsupported', 'unavailable'].includes(this.status()),
  );
  protected readonly idleMessage = computed(() => {
    if (this.tonePlaying()) {
      return 'Listen…';
    }
    switch (this.status()) {
      case 'starting':
        return 'Waiting for the microphone…';
      case 'on':
        return 'Now sing the note';
      case 'denied':
      case 'unsupported':
      case 'unavailable':
        return "The microphone isn't working yet";
      default:
        return 'Play the note, then tap Start';
    }
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stop();
      this.referenceTone.stop();
    });
  }

  protected playNote(): void {
    void this.referenceTone.play(this.target());
  }

  protected newNote(): void {
    this.target.update((previous) =>
      pickRandomNote(PROVISIONAL_RANGE.low, PROVISIONAL_RANGE.high, previous),
    );
    this.playNote();
  }

  protected async start(): Promise<void> {
    await this.livePitch.start();
    if (this.livePitch.listening()) {
      this.wakeLock.keepAwake();
    }
  }

  protected stop(): void {
    this.livePitch.stop();
    this.wakeLock.allowSleep();
  }
}
