/** Raw result of analysing one buffer of microphone audio. */
export interface PitchFrame {
  readonly hz: number;
  /** 0–1: how clearly periodic the audio is. Voices score high, noise low. */
  readonly clarity: number;
  /** Root-mean-square loudness of the buffer, 0–1. */
  readonly rms: number;
}
