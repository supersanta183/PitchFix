import { Injectable } from '@angular/core';

const KEY_PREFIX = 'pitchfix.';

/**
 * Where the app keeps its small amount of data on this device. Tests swap in
 * InMemoryKeyValueStore; the app uses localStorage.
 */
@Injectable({ providedIn: 'root', useFactory: () => new LocalStorageKeyValueStore() })
export abstract class KeyValueStore {
  abstract read(key: string): string | null;
  abstract write(key: string, value: string): void;
}

/** localStorage can be missing or throw (private mode, storage full), so failures fall back to "nothing stored". */
export class LocalStorageKeyValueStore extends KeyValueStore {
  read(key: string): string | null {
    try {
      return localStorage.getItem(KEY_PREFIX + key);
    } catch {
      return null;
    }
  }

  write(key: string, value: string): void {
    try {
      localStorage.setItem(KEY_PREFIX + key, value);
    } catch {
      // Not saved; the app keeps working for this visit.
    }
  }
}

export class InMemoryKeyValueStore extends KeyValueStore {
  private readonly values = new Map<string, string>();

  read(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  write(key: string, value: string): void {
    this.values.set(key, value);
  }
}
