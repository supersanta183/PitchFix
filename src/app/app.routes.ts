import { Routes } from '@angular/router';
import { requireVocalRange } from './vocal-range/require-vocal-range';

export const routes: Routes = [
  {
    path: '',
    title: 'PitchFix',
    canActivate: [requireVocalRange],
    loadComponent: () =>
      import('./practice/practice-screen/practice-screen').then((m) => m.PracticeScreen),
  },
  {
    path: 'range/test',
    title: 'Find your range · PitchFix',
    loadComponent: () =>
      import('./vocal-range/range-test/range-test-screen').then((m) => m.RangeTestScreen),
  },
  {
    path: 'range',
    title: 'Your range · PitchFix',
    loadComponent: () =>
      import('./vocal-range/range-editor/range-editor-screen').then((m) => m.RangeEditorScreen),
  },
  {
    path: 'settings',
    title: 'Settings · PitchFix',
    loadComponent: () =>
      import('./practice/settings/settings-screen').then((m) => m.SettingsScreen),
  },
  { path: '**', redirectTo: '' },
];
