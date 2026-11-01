import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { VocalRangeStore } from './vocal-range.store';

/** Sends a singer without a saved range to the range test first. */
export const requireVocalRange: CanActivateFn = () =>
  inject(VocalRangeStore).range() !== null || inject(Router).createUrlTree(['/range/test']);
