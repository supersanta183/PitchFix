import { computed, inject, Injectable, signal } from '@angular/core';
import { Note } from '../pitch/note';
import { SharedAudioContext } from '../shared/audio/shared-audio-context';
import { Microphone } from './microphone';
import { PitchFrame } from './pitch-frame';
import { PitchStabilizer } from './pitch-stabilizer';
import { PitchTrace } from './pitch-trace';
import { VoicePitchDetector } from './voice-pitch-detector';

/** ~43 ms at 48 kHz: long enough for low male voices, short enough to feel live. */
const ANALYSIS_BUFFER_SIZE = 2048;
const TRACE_WINDOW_MS = 6000;
/** Keeps the note readout steady through detector hiccups instead of flickering. */
const READOUT_HOLD_MS = 150;

export interface LivePitchReading {
  readonly hz: number;
  readonly nearestNote: Note;
  readonly centsFromNearestNote: number;
}

/** Listens to the microphone and publishes the singer's stable pitch every animation frame. */
@Injectable({ providedIn: 'root' })
export class LivePitch {
  private readonly audio = inject(SharedAudioContext);
  private readonly microphone = inject(Microphone);
  private readonly detector = new VoicePitchDetector(ANALYSIS_BUFFER_SIZE);
  private readonly stabilizer = new PitchStabilizer();
  private readonly samples = new Float32Array(ANALYSIS_BUFFER_SIZE);
  private readonly readingSignal = signal<LivePitchReading | null>(null);
  private readonly rawFrameSignal = signal<PitchFrame | null>(null);
  private lastVoicedAtMs = Number.NEGATIVE_INFINITY;
  private analyser: AnalyserNode | null = null;
  private frameRequest: number | null = null;

  readonly trace = new PitchTrace(TRACE_WINDOW_MS);
  readonly reading = this.readingSignal.asReadonly();
  /** Unfiltered detector output, for the ?debug diagnostics readout. */
  readonly rawFrame = this.rawFrameSignal.asReadonly();
  readonly microphoneStatus = this.microphone.status;
  readonly listening = computed(() => this.microphone.status() === 'on');

  /** Must be called from a tap handler so the browser allows audio to start. */
  async start(): Promise<void> {
    const status = this.microphone.status();
    if (status === 'on' || status === 'starting') {
      return;
    }
    const context = this.audio.acquire();
    const source = await this.microphone.open(context);
    if (!source) {
      return;
    }
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = ANALYSIS_BUFFER_SIZE;
    source.connect(this.analyser);
    this.stabilizer.reset();
    this.trace.clear();
    this.frameRequest = requestAnimationFrame(this.analyseFrame);
  }

  stop(): void {
    if (this.frameRequest !== null) {
      cancelAnimationFrame(this.frameRequest);
    }
    this.frameRequest = null;
    this.analyser = null;
    this.microphone.close();
    this.readingSignal.set(null);
    this.rawFrameSignal.set(null);
  }

  private readonly analyseFrame = (nowMs: number): void => {
    if (!this.analyser || !this.listening()) {
      this.stop();
      return;
    }
    this.analyser.getFloatTimeDomainData(this.samples);
    const frame = this.detector.analyse(this.samples, this.analyser.context.sampleRate);
    const hz = this.stabilizer.next(frame, nowMs);

    this.trace.add(nowMs, hz);
    this.rawFrameSignal.set(frame);
    if (hz !== null) {
      this.lastVoicedAtMs = nowMs;
      this.readingSignal.set(toReading(hz));
    } else if (nowMs - this.lastVoicedAtMs > READOUT_HOLD_MS) {
      this.readingSignal.set(null);
    }
    this.frameRequest = requestAnimationFrame(this.analyseFrame);
  };
}

function toReading(hz: number): LivePitchReading {
  const nearestNote = Note.nearestTo(hz);
  return { hz, nearestNote, centsFromNearestNote: nearestNote.centsFrom(hz) };
}
