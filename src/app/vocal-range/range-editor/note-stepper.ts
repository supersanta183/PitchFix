import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Note } from '../../pitch/note';

/** A note with big − / + buttons either side; tapping the note plays it. */
@Component({
  selector: 'app-note-stepper',
  template: `
    <div class="end" role="group" [attr.aria-label]="label()">
      <p class="caption">{{ label() }}</p>
      <div class="stepper">
        <button
          type="button"
          class="step"
          [disabled]="!canLower()"
          [attr.aria-label]="'Lower ' + label().toLowerCase()"
          (click)="lower.emit()"
        >
          −
        </button>
        <button
          type="button"
          class="note"
          data-testid="stepper-note"
          [attr.aria-label]="'Play ' + note().label"
          (click)="play.emit()"
        >
          {{ note().label }}
        </button>
        <button
          type="button"
          class="step"
          [disabled]="!canRaise()"
          [attr.aria-label]="'Raise ' + label().toLowerCase()"
          (click)="raise.emit()"
        >
          +
        </button>
      </div>
    </div>
  `,
  styleUrl: './note-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteStepper {
  readonly label = input.required<string>();
  readonly note = input.required<Note>();
  readonly canLower = input(true);
  readonly canRaise = input(true);
  readonly lower = output<void>();
  readonly raise = output<void>();
  readonly play = output<void>();
}
