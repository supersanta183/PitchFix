import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PitchJudgement, PitchVerdict } from '../../matching/pitch-judgement';

/** The meter spans this many cents either side of the target. */
const METER_RANGE_CENTS = 100;

export function verdictMessage(verdict: PitchVerdict): string {
  switch (verdict) {
    case 'too-low':
      return 'Too low – go up';
    case 'too-high':
      return 'Too high – go down';
    case 'on-pitch':
      return 'Spot on!';
  }
}

export function formatCents(cents: number): string {
  const rounded = Math.round(cents);
  if (rounded === 0) {
    return '0 ¢';
  }
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)} ¢`;
}

/** Shows how far the singer is from the target: a needle, an "on pitch" zone and plain words. */
@Component({
  selector: 'app-tuning-meter',
  templateUrl: './tuning-meter.html',
  styleUrl: './tuning-meter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TuningMeter {
  readonly judgement = input<PitchJudgement | null>(null);
  readonly toleranceCents = input(50);
  /** Shown when there is nothing to judge, e.g. "Listen…". */
  readonly idleMessage = input('');
  /** 0–1: how much of the required hold has been sung in tune. */
  readonly holdProgress = input(0);
  readonly matched = input(false);

  protected readonly state = computed(() =>
    this.matched() ? 'matched' : (this.judgement()?.verdict ?? 'idle'),
  );

  protected readonly zoneWidthPercent = computed(
    () => (Math.min(this.toleranceCents(), METER_RANGE_CENTS) / METER_RANGE_CENTS) * 100,
  );
  protected readonly needlePercent = computed(() => {
    const cents = this.judgement()?.centsOff ?? 0;
    const clamped = Math.max(-METER_RANGE_CENTS, Math.min(METER_RANGE_CENTS, cents));
    return 50 + (clamped / METER_RANGE_CENTS) * 50;
  });
  protected readonly message = computed(() => {
    if (this.matched()) {
      return 'Matched!';
    }
    const judgement = this.judgement();
    if (judgement?.verdict === 'on-pitch' && this.holdProgress() > 0) {
      return 'Spot on! Hold it…';
    }
    return judgement ? verdictMessage(judgement.verdict) : this.idleMessage();
  });
  protected readonly cents = computed(() => {
    const judgement = this.judgement();
    return judgement ? formatCents(judgement.centsOff) : '';
  });
}
