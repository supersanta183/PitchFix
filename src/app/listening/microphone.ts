import { Injectable, signal } from '@angular/core';

export type MicrophoneStatus = 'off' | 'starting' | 'on' | 'denied' | 'unsupported' | 'unavailable';

/**
 * Browser voice processing (echo cancellation, noise suppression, auto gain)
 * bends pitch and fades out held notes, so it is switched off for singing.
 */
const SINGING_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

@Injectable({ providedIn: 'root' })
export class Microphone {
  private readonly statusSignal = signal<MicrophoneStatus>('off');
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  readonly status = this.statusSignal.asReadonly();

  async open(context: AudioContext): Promise<MediaStreamAudioSourceNode | null> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.statusSignal.set('unsupported');
      return null;
    }
    this.statusSignal.set('starting');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: SINGING_CONSTRAINTS,
        video: false,
      });
    } catch (error) {
      this.statusSignal.set(isPermissionError(error) ? 'denied' : 'unavailable');
      return null;
    }
    for (const track of this.stream.getAudioTracks()) {
      track.addEventListener('ended', () => this.close());
    }
    this.source = context.createMediaStreamSource(this.stream);
    this.statusSignal.set('on');
    return this.source;
  }

  close(): void {
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.source = null;
    this.stream = null;
    this.statusSignal.set('off');
  }
}

function isPermissionError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'SecurityError')
  );
}
