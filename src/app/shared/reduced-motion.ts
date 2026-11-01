import { DestroyRef, inject, Signal, signal } from '@angular/core';

/** Tracks the user's "reduce motion" preference. Call from an injection context. */
export function prefersReducedMotion(): Signal<boolean> {
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = signal(query.matches);
  const update = (event: MediaQueryListEvent) => reduced.set(event.matches);
  query.addEventListener('change', update);
  inject(DestroyRef).onDestroy(() => query.removeEventListener('change', update));
  return reduced.asReadonly();
}
