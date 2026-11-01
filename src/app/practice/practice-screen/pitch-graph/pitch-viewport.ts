/** Semitones kept free between the voice and the edge of the graph. */
const EDGE_MARGIN = 2;

/**
 * The vertical window of notes visible on the pitch graph. It only moves when
 * the voice nears an edge, so the grid stays still while the singer holds a note.
 */
export class PitchViewport {
  constructor(
    readonly centerMidi: number,
    readonly spanSemitones: number,
  ) {}

  get lowMidi(): number {
    return this.centerMidi - this.spanSemitones / 2;
  }

  get highMidi(): number {
    return this.centerMidi + this.spanSemitones / 2;
  }

  follow(midi: number): PitchViewport {
    const comfortable = midi >= this.lowMidi + EDGE_MARGIN && midi <= this.highMidi - EDGE_MARGIN;
    return comfortable ? this : new PitchViewport(midi, this.spanSemitones);
  }

  /** Moves `fraction` (0–1) of the way to `target`. */
  approach(target: PitchViewport, fraction: number): PitchViewport {
    const center = this.centerMidi + (target.centerMidi - this.centerMidi) * fraction;
    return new PitchViewport(center, this.spanSemitones);
  }

  yFor(midi: number, height: number): number {
    return ((this.highMidi - midi) / this.spanSemitones) * height;
  }
}
