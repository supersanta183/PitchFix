import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MicrophoneStatus } from '../microphone';

/** Explains, in plain words, how to get the microphone working after it failed to start. */
@Component({
  selector: 'app-microphone-help',
  templateUrl: './microphone-help.html',
  styleUrl: './microphone-help.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrophoneHelp {
  readonly status = input.required<MicrophoneStatus>();
}
