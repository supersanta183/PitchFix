import { TestBed } from '@angular/core/testing';
import { Note } from '../pitch/note';
import { InMemoryKeyValueStore, KeyValueStore } from '../shared/storage/key-value-store';
import { VocalRange } from './vocal-range';
import { VocalRangeStore } from './vocal-range.store';

describe('VocalRangeStore', () => {
  let storage: InMemoryKeyValueStore;

  function openStore(): VocalRangeStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: KeyValueStore, useValue: storage }] });
    return TestBed.inject(VocalRangeStore);
  }

  beforeEach(() => {
    storage = new InMemoryKeyValueStore();
  });

  it('has no range for a new singer', () => {
    expect(openStore().range()).toBeNull();
  });

  it('remembers a saved range on the next visit', () => {
    const range = VocalRange.between(Note.fromLabel('E2'), Note.fromLabel('A3'));
    openStore().save(range);

    expect(openStore().range()?.equals(range)).toBe(true);
  });

  it('starts fresh when the stored range is unreadable', () => {
    storage.write('vocal-range', '{not json');
    expect(openStore().range()).toBeNull();
  });

  it('starts fresh when the stored range breaks the rules', () => {
    storage.write('vocal-range', JSON.stringify({ version: 1, lowestMidi: 60, highestMidi: 61 }));
    expect(openStore().range()).toBeNull();
  });
});
