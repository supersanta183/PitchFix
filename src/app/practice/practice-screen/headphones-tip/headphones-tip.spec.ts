import { TestBed } from '@angular/core/testing';
import { InMemoryKeyValueStore, KeyValueStore } from '../../../shared/storage/key-value-store';
import { HeadphonesTip } from './headphones-tip';

describe('HeadphonesTip', () => {
  let store: InMemoryKeyValueStore;

  beforeEach(() => {
    store = new InMemoryKeyValueStore();
    TestBed.configureTestingModule({ providers: [{ provide: KeyValueStore, useValue: store }] });
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(HeadphonesTip);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('recommends headphones to a new singer', () => {
    expect(render().textContent).toContain('headphones work best');
  });

  it('stays hidden after the singer dismisses it, even on a later visit', async () => {
    const fixture = TestBed.createComponent(HeadphonesTip);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('headphones');

    expect(render().textContent).not.toContain('headphones');
  });
});
