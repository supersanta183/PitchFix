import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LivePitch } from '../../listening/live-pitch';
import { MicrophoneHelp } from '../../listening/microphone-help/microphone-help';
import { ReferenceTone } from '../../reference-tone/reference-tone';
import { VersionLabel } from '../../shared/app-version/version-label';
import { SUGGESTED_STARTING_RANGE } from '../../vocal-range/vocal-range';
import { VocalRangeStore } from '../../vocal-range/vocal-range.store';
import { PracticeSettingsStore } from '../settings/practice-settings.store';
import { HeadphonesTip } from './headphones-tip/headphones-tip';
import { PitchGraph } from './pitch-graph/pitch-graph';
import { SessionRunner } from './session-runner';
import { SessionSummary } from './session-summary/session-summary';
import { TuningMeter } from './tuning-meter/tuning-meter';

@Component({
  selector: 'app-practice-screen',
  imports: [
    RouterLink,
    VersionLabel,
    PitchGraph,
    TuningMeter,
    SessionSummary,
    HeadphonesTip,
    MicrophoneHelp,
  ],
  providers: [SessionRunner],
  templateUrl: './practice-screen.html',
  styleUrl: './practice-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeScreen {
  private readonly rangeStore = inject(VocalRangeStore);
  private readonly tonePlaying = inject(ReferenceTone).playing;
  protected readonly session = inject(SessionRunner);
  protected readonly livePitch = inject(LivePitch);
  protected readonly settings = inject(PracticeSettingsStore).settings;
  /** The route guard ensures a saved range; the fallback only covers it being cleared meanwhile. */
  protected readonly range = computed(() => this.rangeStore.range() ?? SUGGESTED_STARTING_RANGE);

  protected readonly reading = this.livePitch.reading;
  protected readonly inSession = computed(() =>
    ['singing', 'matched'].includes(this.session.phase()),
  );

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
    if (this.status() === 'starting') {
      return 'Waiting for the microphone…';
    }
    if (this.needsHelp()) {
      return "The microphone isn't working yet";
    }
    switch (this.session.phase()) {
      case 'singing':
        return 'Now sing it and hold it';
      case 'finished':
        return 'Session complete';
      default:
        return `Tap Start for ${this.session.total} notes`;
    }
  });
}
