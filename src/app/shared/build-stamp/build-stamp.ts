import { ChangeDetectionStrategy, Component } from '@angular/core';
import { describeBuild } from './build-info';
import { BUILD_INFO } from './build-info.generated';

/** Shows which deploy is running, so testers can tell whether their phone has the latest version. */
@Component({
  selector: 'app-build-stamp',
  template: `<p><span class="visually-hidden">App version </span>{{ label }}</p>`,
  styles: `
    p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildStamp {
  protected readonly label = describeBuild(BUILD_INFO);
}
