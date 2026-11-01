import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LivePitch } from '../../listening/live-pitch';
import { MicrophoneHelp } from '../../listening/microphone-help/microphone-help';
import { VersionLabel } from '../../shared/app-version/version-label';
import { SUGGESTED_STARTING_RANGE } from '../../vocal-range/vocal-range';
import { VocalRangeStore } from '../../vocal-range/vocal-range.store';
import { PracticeSettingsStore } from '../settings/practice-settings.store';
import { HeadphonesTip } from './headphones-tip/headphones-tip';
import { ModePicker } from './mode-picker/mode-picker';
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
    ModePicker,
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
  protected readonly session = inject(SessionRunner);
  protected readonly livePitch = inject(LivePitch);
  protected readonly settings = inject(PracticeSettingsStore).settings;
  /** The route guard ensures a saved range; the fallback only covers it being cleared meanwhile. */
  protected readonly range = computed(() => this.rangeStore.range() ?? SUGGESTED_STARTING_RANGE);

  protected readonly reading = this.livePitch.reading;
  protected readonly showDiagnostics = new URLSearchParams(location.search).has('debug');
  protected readonly rawFrame = this.livePitch.rawFrame;
  protected readonly status = this.livePitch.microphoneStatus;
  protected readonly needsHelp = computed(() =>
    ['denied', 'unsupported', 'unavailable'].includes(this.status()),
  );

  protected readonly progressCaption = computed(() => {
    const session = this.session;
    const round = `${session.mode().roundName} ${session.roundNumber()} of ${session.totalRounds()}`;
    return session.notesInRound() > 1
      ? `${round} · note ${session.noteNumber()} of ${session.notesInRound()}`
      : round;
  });

  protected readonly targetLabel = computed(() => {
    const target = this.session.target();
    if (!this.session.active() || !target) {
      return '–';
    }
    return this.session.targetRevealed() ? target.label : '?';
  });

  /** A short line under the target: where a slide starts, or which pattern is being sung. */
  protected readonly targetHint = computed(() => {
    const session = this.session;
    if (!session.active()) {
      return null;
    }
    const slideFrom = session.slideFrom();
    if (slideFrom) {
      return `Start on ${slideFrom.label}`;
    }
    if (session.mode().id === 'slides') {
      return 'Slide into it';
    }
    return session.roundName();
  });

  protected readonly instruction = computed(() => {
    const session = this.session;
    if (this.status() === 'starting') {
      return 'Waiting for the microphone…';
    }
    if (this.needsHelp()) {
      return "The microphone isn't working yet";
    }
    switch (session.phase()) {
      case 'listening':
        return session.notesInRound() > 1 ? 'Listen to the tune…' : 'Listen…';
      case 'remembering':
        return 'Keep it in your head…';
      case 'singing': {
        const slideFrom = session.slideFrom();
        if (slideFrom) {
          return `Start on ${slideFrom.label}…`;
        }
        if (session.mode().id === 'slides') {
          return `…now slide to ${session.target()?.label}`;
        }
        return session.mode().fromMemory ? 'Sing it from memory' : 'Now sing it and hold it';
      }
      case 'finished':
        return 'Session complete';
      default:
        return `Tap Start for ${session.mode().name.toLowerCase()}`;
    }
  });
}
