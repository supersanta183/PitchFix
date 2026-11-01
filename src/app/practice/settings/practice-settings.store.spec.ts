import { TestBed } from '@angular/core/testing';
import { InMemoryKeyValueStore, KeyValueStore } from '../../shared/storage/key-value-store';
import { PracticeSettings } from './practice-settings';
import { PracticeSettingsStore } from './practice-settings.store';

describe('PracticeSettingsStore', () => {
  let storage: InMemoryKeyValueStore;

  function openStore(): PracticeSettingsStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: KeyValueStore, useValue: storage }] });
    return TestBed.inject(PracticeSettingsStore);
  }

  beforeEach(() => {
    storage = new InMemoryKeyValueStore();
  });

  it('uses the defaults for a new singer', () => {
    expect(openStore().settings()).toEqual(PracticeSettings.DEFAULT);
  });

  it('remembers changed settings on the next visit', () => {
    openStore().save(PracticeSettings.DEFAULT.withTolerance(20).withOctaveForgiveness(false));

    const settings = openStore().settings();
    expect(settings.toleranceCents).toBe(20);
    expect(settings.octaveForgiveness).toBe(false);
  });

  it('uses the defaults when stored settings are unreadable', () => {
    storage.write('practice-settings', '{oops');
    expect(openStore().settings()).toEqual(PracticeSettings.DEFAULT);
  });
});
