import { Injectable } from '@angular/core';

/**
 * Keeps the screen on during practice. Browsers drop the lock whenever the
 * page is hidden, so it is requested again when the page becomes visible.
 */
@Injectable({ providedIn: 'root' })
export class ScreenWakeLock {
  private sentinel: WakeLockSentinel | null = null;
  private wanted = false;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (this.wanted && document.visibilityState === 'visible') {
        void this.request();
      }
    });
  }

  keepAwake(): void {
    this.wanted = true;
    void this.request();
  }

  allowSleep(): void {
    this.wanted = false;
    void this.sentinel?.release();
    this.sentinel = null;
  }

  private async request(): Promise<void> {
    if (!('wakeLock' in navigator) || (this.sentinel && !this.sentinel.released)) {
      return;
    }
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      if (this.wanted) {
        this.sentinel = sentinel;
      } else {
        void sentinel.release();
      }
    } catch {
      // Low battery mode or an unsupported browser: practice still works, the screen may just dim.
    }
  }
}
