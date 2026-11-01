import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'PitchFix',
    loadComponent: () =>
      import('./practice/practice-screen/practice-screen').then((m) => m.PracticeScreen),
  },
  { path: '**', redirectTo: '' },
];
