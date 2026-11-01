import { inject, Injectable, signal } from '@angular/core';
import { KeyValueStore } from '../shared/storage/key-value-store';
import { VocalRange } from './vocal-range';

const STORAGE_KEY = 'vocal-range';
const SCHEMA_VERSION = 1;

/** The singer's saved vocal range, kept on this device. */
@Injectable({ providedIn: 'root' })
export class VocalRangeStore {
  private readonly storage = inject(KeyValueStore);
  private readonly rangeSignal = signal<VocalRange | null>(this.load());

  readonly range = this.rangeSignal.asReadonly();

  save(range: VocalRange): void {
    this.storage.write(
      STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, ...range.toStored() }),
    );
    this.rangeSignal.set(range);
  }

  private load(): VocalRange | null {
    const raw = this.storage.read(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    try {
      return VocalRange.fromStored(JSON.parse(raw));
    } catch {
      return null;
    }
  }
}
