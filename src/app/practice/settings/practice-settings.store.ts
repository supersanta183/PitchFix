import { inject, Injectable, signal } from '@angular/core';
import { KeyValueStore } from '../../shared/storage/key-value-store';
import { PracticeSettings } from './practice-settings';

const STORAGE_KEY = 'practice-settings';
const SCHEMA_VERSION = 1;

/** The singer's practice settings, kept on this device. */
@Injectable({ providedIn: 'root' })
export class PracticeSettingsStore {
  private readonly storage = inject(KeyValueStore);
  private readonly settingsSignal = signal(this.load());

  readonly settings = this.settingsSignal.asReadonly();

  save(settings: PracticeSettings): void {
    this.storage.write(
      STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, ...settings.toStored() }),
    );
    this.settingsSignal.set(settings);
  }

  private load(): PracticeSettings {
    try {
      return PracticeSettings.fromStored(JSON.parse(this.storage.read(STORAGE_KEY) ?? 'null'));
    } catch {
      return PracticeSettings.DEFAULT;
    }
  }
}
