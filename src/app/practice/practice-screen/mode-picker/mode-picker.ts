import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EXERCISE_MODES, ExerciseMode } from '../../exercises/exercise-modes';

/** Lets the singer choose which exercise to practise. */
@Component({
  selector: 'app-mode-picker',
  template: `
    <fieldset class="modes">
      <legend>Choose an exercise</legend>
      @for (mode of modes; track mode.id) {
        <label class="mode">
          <input
            type="radio"
            name="exercise-mode"
            [value]="mode.id"
            [checked]="selected().id === mode.id"
            (change)="choose.emit(mode)"
          />
          <span class="name">{{ mode.name }}</span>
          <span class="description">{{ mode.description }}</span>
        </label>
      }
    </fieldset>
  `,
  styleUrl: './mode-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModePicker {
  readonly selected = input.required<ExerciseMode>();
  readonly choose = output<ExerciseMode>();

  protected readonly modes = EXERCISE_MODES;
}
