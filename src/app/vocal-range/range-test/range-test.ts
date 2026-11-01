import { Note } from '../../pitch/note';
import { VocalRange } from '../vocal-range';

export type RangeTestStep = 'lowest' | 'highest' | 'review';

/** The guided "sing your lowest, then your highest comfortable note" test. */
export class RangeTest {
  private constructor(
    readonly lowest: Note | null,
    readonly range: VocalRange | null,
  ) {}

  static start(): RangeTest {
    return new RangeTest(null, null);
  }

  get step(): RangeTestStep {
    if (this.range) {
      return 'review';
    }
    return this.lowest ? 'highest' : 'lowest';
  }

  withLowest(lowest: Note): RangeTest {
    return new RangeTest(lowest, null);
  }

  acceptsAsHighest(highest: Note): boolean {
    return this.lowest !== null && VocalRange.isAllowed(this.lowest, highest);
  }

  withHighest(highest: Note): RangeTest {
    if (!this.lowest) {
      throw new Error('Sing the lowest note first');
    }
    return new RangeTest(this.lowest, VocalRange.between(this.lowest, highest));
  }
}
