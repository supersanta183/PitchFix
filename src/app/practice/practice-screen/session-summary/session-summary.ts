import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AttemptOutcome } from '../../session/practice-session';

/** End-of-session result: how many notes were matched, and which. */
@Component({
  selector: 'app-session-summary',
  templateUrl: './session-summary.html',
  styleUrl: './session-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionSummary {
  readonly outcomes = input.required<readonly AttemptOutcome[]>();
  /** What one round is called, e.g. "Pattern". */
  readonly roundName = input('Note');

  protected readonly matchedCount = computed(
    () => this.outcomes().filter((outcome) => outcome.matched).length,
  );
  /** Outcomes grouped by round, for exercises with several notes per round. */
  protected readonly rounds = computed(() => {
    const rounds: AttemptOutcome[][] = [];
    for (const outcome of this.outcomes()) {
      (rounds[outcome.round] ??= []).push(outcome);
    }
    return rounds.filter(Boolean);
  });
  protected readonly severalNotesPerRound = computed(() =>
    this.rounds().some((round) => round.length > 1),
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
