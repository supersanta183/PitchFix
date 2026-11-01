import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { KeyValueStore } from '../../../shared/storage/key-value-store';

const DISMISSED_KEY = 'tips.headphones.dismissed';

@Component({
  selector: 'app-headphones-tip',
  template: `
    @if (visible()) {
      <aside class="tip" aria-label="Tip">
        <p>
          <strong>Tip:</strong> headphones work best. PitchFix stops listening while the note plays
          so it doesn't hear the speaker. No sound on iPhone? Turn off silent mode.
        </p>
        <button type="button" class="dismiss" (click)="dismiss()">Got it</button>
      </aside>
    }
  `,
  styleUrl: './headphones-tip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadphonesTip {
  private readonly store = inject(KeyValueStore);
  protected readonly visible = signal(this.store.read(DISMISSED_KEY) !== 'true');

  protected dismiss(): void {
    this.store.write(DISMISSED_KEY, 'true');
    this.visible.set(false);
  }
}
