import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { LivePitch } from '../../listening/live-pitch';
import { MicrophoneHelp } from '../../listening/microphone-help/microphone-help';
import { BuildStamp } from '../../shared/build-stamp/build-stamp';
import { ScreenWakeLock } from '../../shared/screen-wake-lock';
import { PitchGraph } from './pitch-graph/pitch-graph';

@Component({
  selector: 'app-practice-screen',
  imports: [BuildStamp, PitchGraph, MicrophoneHelp],
  templateUrl: './practice-screen.html',
  styleUrl: './practice-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeScreen {
  private readonly wakeLock = inject(ScreenWakeLock);
  protected readonly livePitch = inject(LivePitch);

  protected readonly reading = this.livePitch.reading;
  protected readonly showDiagnostics = new URLSearchParams(location.search).has('debug');
  protected readonly rawFrame = this.livePitch.rawFrame;
  protected readonly status = this.livePitch.microphoneStatus;
  protected readonly needsHelp = computed(() =>
    ['denied', 'unsupported', 'unavailable'].includes(this.status()),
  );
  protected readonly hint = computed(() => {
    switch (this.status()) {
      case 'starting':
        return 'Waiting for the microphone…';
      case 'on':
        return 'Listening. Sing any note!';
      case 'denied':
      case 'unsupported':
      case 'unavailable':
        return "The microphone isn't working yet.";
      default:
        return 'Tap Start, then sing any note.';
    }
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
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
