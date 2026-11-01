import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AttemptOutcome } from '../../session/single-notes-session';

/** End-of-session result: how many notes were matched, and which. */
@Component({
  selector: 'app-session-summary',
  templateUrl: './session-summary.html',
  styleUrl: './session-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionSummary {
  readonly outcomes = input.required<readonly AttemptOutcome[]>();

  protected readonly matchedCount = computed(
    () => this.outcomes().filter((outcome) => outcome.matched).length,
  );
  protected readonly headline = computed(() => {
    const matched = this.matchedCount();
    const total = this.outcomes().length;
    if (matched === total) {
      return 'Every note matched. Brilliant!';
    }
    return matched >= total / 2 ? 'Nice work!' : 'Good effort. It gets easier with practice.';
  });
}
