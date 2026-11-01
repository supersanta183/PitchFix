import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { PitchTrace } from '../../../listening/pitch-trace';
import { Note } from '../../../pitch/note';
import { frequencyToMidi } from '../../../pitch/pitch-math';
import { prefersReducedMotion } from '../../../shared/reduced-motion';
import { PitchViewport } from './pitch-viewport';

const VISIBLE_SEMITONES = 13;
const A3_MIDI = 57;
const NOW_INSET_PX = 20;
const LABEL_GUTTER_PX = 36;
const VIEWPORT_EASING = 0.12;
const REDUCED_MOTION_FRAME_MS = 125;
const MAX_BRIDGED_GAP_MS = 150;

interface GraphColors {
  grid: string;
  gridStrong: string;
  label: string;
  line: string;
}

/** Scrolling line of the singer's pitch over the last few seconds, on a grid of notes. */
@Component({
  selector: 'app-pitch-graph',
  template: `<canvas #canvas role="img" [attr.aria-label]="description()"></canvas>`,
  styleUrl: './pitch-graph.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PitchGraph {
  readonly trace = input.required<PitchTrace>();
  readonly description = input('Graph of your pitch over the last few seconds');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly reducedMotion = prefersReducedMotion();
  private viewport = new PitchViewport(A3_MIDI, VISIBLE_SEMITONES);
  private colors: GraphColors | null = null;
  private lastDrawMs = 0;
  private frameRequest = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const resizeObserver = new ResizeObserver(() => this.fitCanvasToHost());
      resizeObserver.observe(this.host.nativeElement);
      const colorScheme = matchMedia('(prefers-color-scheme: dark)');
      const forgetColors = () => (this.colors = null);
      colorScheme.addEventListener('change', forgetColors);
      this.frameRequest = requestAnimationFrame(this.draw);

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(this.frameRequest);
        resizeObserver.disconnect();
        colorScheme.removeEventListener('change', forgetColors);
      });
    });
  }

  private fitCanvasToHost(): void {
    const canvas = this.canvas().nativeElement;
    const { width, height } = this.host.nativeElement.getBoundingClientRect();
    const pixelRatio = devicePixelRatio || 1;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  private readonly draw = (nowMs: number): void => {
    this.frameRequest = requestAnimationFrame(this.draw);
    if (this.reducedMotion() && nowMs - this.lastDrawMs < REDUCED_MOTION_FRAME_MS) {
      return;
    }
    this.lastDrawMs = nowMs;

    const canvas = this.canvas().nativeElement;
    const context = canvas.getContext('2d');
    if (!context || canvas.width === 0) {
      return;
    }
    const pixelRatio = devicePixelRatio || 1;
    const width = canvas.width / pixelRatio;
    const height = canvas.height / pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    this.colors ??= this.readColors();
    this.moveViewport();
    this.drawNoteGrid(context, width, height, this.colors);
    this.drawPitchLine(context, width, height, this.colors);
  };

  private moveViewport(): void {
    const latest = this.trace().lastVoiced();
    if (!latest) {
      return;
    }
    const target = this.viewport.follow(frequencyToMidi(latest.hz));
    this.viewport = this.reducedMotion() ? target : this.viewport.approach(target, VIEWPORT_EASING);
  }

  private drawNoteGrid(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: GraphColors,
  ): void {
    context.font = '12px system-ui, sans-serif';
    context.textBaseline = 'middle';
    context.lineWidth = 1;
    for (
      let midi = Math.ceil(this.viewport.lowMidi);
      midi <= Math.floor(this.viewport.highMidi);
      midi++
    ) {
      const note = Note.fromMidi(midi);
      const y = Math.round(this.viewport.yFor(midi, height)) + 0.5;
      const isNatural = !note.name.includes('#');
      context.strokeStyle = note.name === 'C' ? colors.gridStrong : colors.grid;
      context.globalAlpha = isNatural ? 1 : 0.45;
      context.beginPath();
      context.moveTo(LABEL_GUTTER_PX, y);
      context.lineTo(width, y);
      context.stroke();
      context.globalAlpha = 1;
      if (isNatural) {
        context.fillStyle = colors.label;
        context.fillText(note.label, 6, y);
      }
    }
  }

  private drawPitchLine(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: GraphColors,
  ): void {
    const trace = this.trace();
    const points = trace.points;
    const latest = points.at(-1);
    if (!latest) {
      return;
    }
    const nowX = width - NOW_INSET_PX;
    const pxPerMs = (nowX - LABEL_GUTTER_PX) / trace.windowMs;

    context.strokeStyle = colors.line;
    context.lineWidth = 4;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    const xFor = (atMs: number) => nowX - (latest.atMs - atMs) * pxPerMs;
    const yFor = (hz: number) => this.viewport.yFor(frequencyToMidi(hz), height);

    context.beginPath();
    for (const stroke of trace.strokes(MAX_BRIDGED_GAP_MS)) {
      const visible = stroke.filter((point) => xFor(point.atMs) >= LABEL_GUTTER_PX);
      visible.forEach((point, i) => {
        const [x, y] = [xFor(point.atMs), yFor(point.hz)];
        if (i === 0) {
          context.moveTo(x, y);
        }
        context.lineTo(x, y);
      });
    }
    context.stroke();

    const lastVoiced = trace.lastVoiced();
    if (lastVoiced && latest.atMs - lastVoiced.atMs <= MAX_BRIDGED_GAP_MS) {
      context.fillStyle = colors.line;
      context.beginPath();
      context.arc(xFor(lastVoiced.atMs), yFor(lastVoiced.hz), 8, 0, Math.PI * 2);
      context.fill();
    }
  }

  private readColors(): GraphColors {
    const style = getComputedStyle(this.host.nativeElement);
    const read = (name: string) => style.getPropertyValue(name).trim();
    return {
      grid: read('--graph-grid'),
      gridStrong: read('--graph-grid-strong'),
      label: read('--graph-label'),
      line: read('--graph-line'),
    };
  }
}
