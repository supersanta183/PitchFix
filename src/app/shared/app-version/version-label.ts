import { ChangeDetectionStrategy, Component } from '@angular/core';
import { displayVersion } from './app-version';
import { PACKAGE_VERSION } from './app-version.generated';

/** Shows which version is running, so testers can tell whether their phone has the latest release. */
@Component({
  selector: 'app-version-label',
  template: `<p><span class="visually-hidden">App version </span>{{ version }}</p>`,
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
export class VersionLabel {
  protected readonly version = displayVersion(PACKAGE_VERSION);
}
