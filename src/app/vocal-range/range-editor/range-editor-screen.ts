import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Note } from '../../pitch/note';
import { ReferenceTone } from '../../reference-tone/reference-tone';
import { describeSpan, SUGGESTED_STARTING_RANGE, VocalRange } from '../vocal-range';
import { VocalRangeStore } from '../vocal-range.store';
import { NoteStepper } from './note-stepper';

/** Lets the singer set or fine-tune their range note by note. */
@Component({
  selector: 'app-range-editor-screen',
  imports: [RouterLink, NoteStepper],
  templateUrl: './range-editor-screen.html',
  styleUrl: './range-editor-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeEditorScreen {
  private readonly router = inject(Router);
  private readonly rangeStore = inject(VocalRangeStore);
  private readonly referenceTone = inject(ReferenceTone);

  protected readonly hasSavedRange = this.rangeStore.range() !== null;
  protected readonly range = signal<VocalRange>(
    this.rangeStore.range() ?? SUGGESTED_STARTING_RANGE,
  );
  protected readonly spanDescription = computed(() => describeSpan(this.range().spanSemitones));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.referenceTone.stop());
  }

  protected moveLowest(semitones: number): void {
    this.range.update((range) => range.withLowestMovedBy(semitones));
    void this.referenceTone.play(this.range().lowest);
  }

  protected moveHighest(semitones: number): void {
    this.range.update((range) => range.withHighestMovedBy(semitones));
    void this.referenceTone.play(this.range().highest);
  }

  protected play(note: Note): void {
    void this.referenceTone.play(note);
  }

  protected save(): void {
    this.rangeStore.save(this.range());
    void this.router.navigateByUrl('/');
  }
}
