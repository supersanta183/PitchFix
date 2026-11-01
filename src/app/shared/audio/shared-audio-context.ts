import { Injectable } from '@angular/core';

/**
 * One AudioContext for the whole app (microphone and reference tone).
 * Mobile browsers only allow audio to start from a user gesture, so
 * `acquire()` must be called from a tap handler.
 */
@Injectable({ providedIn: 'root' })
export class SharedAudioContext {
  private context: AudioContext | null = null;

  acquire(): AudioContext {
    this.context ??= new AudioContext({ latencyHint: 'interactive' });
    if (this.context.state !== 'running') {
      void this.context.resume();
    }
    return this.context;
  }
}
