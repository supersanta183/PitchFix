import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PracticeSettings } from './practice-settings';
import { PracticeSettingsStore } from './practice-settings.store';

/** Lets the singer choose how strictly their singing is judged. Changes save immediately. */
@Component({
  selector: 'app-settings-screen',
  imports: [RouterLink],
  templateUrl: './settings-screen.html',
  styleUrl: './settings-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsScreen {
  private readonly store = inject(PracticeSettingsStore);

  protected readonly settings = this.store.settings;
  protected readonly tolerances = PracticeSettings.TOLERANCES;
  protected readonly holdSeconds = PracticeSettings.HOLD_SECONDS;

  protected chooseTolerance(cents: number): void {
    this.store.save(this.settings().withTolerance(cents));
  }

  protected chooseHoldSeconds(seconds: number): void {
    this.store.save(this.settings().withHoldSeconds(seconds));
  }

  protected setOctaveForgiveness(enabled: boolean): void {
    this.store.save(this.settings().withOctaveForgiveness(enabled));
  }
}
