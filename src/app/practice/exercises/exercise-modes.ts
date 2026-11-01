import { VocalRange } from '../../vocal-range/vocal-range';
import { patternRounds, Round, singleNoteRounds, slideRounds } from './exercise-rounds';

export type ExerciseModeId = 'single-notes' | 'slides' | 'patterns' | 'from-memory';

const PATTERN_MIN_HOLD_MS = 300;

export interface ExerciseMode {
  readonly id: ExerciseModeId;
  readonly name: string;
  readonly description: string;
  /** What one round is called on screen: "Note 3 of 10", "Pattern 2 of 5". */
  readonly roundName: string;
  readonly roundCount: number;
  /** How long each prompt note sounds, in seconds. */
  readonly promptNoteSeconds: number;
  /** The prompt plays once, then the singer sings without hearing it again. */
  readonly fromMemory: boolean;
  buildRounds(range: VocalRange, random: () => number): Round[];
  /** The hold needed per note, given the singer's hold setting. */
  holdMsFor(settingHoldMs: number): number;
}

const asIs = (holdMs: number) => holdMs;

export const EXERCISE_MODES: readonly ExerciseMode[] = [
  {
    id: 'single-notes',
    name: 'Single notes',
    description: 'Hear a note, then sing it back.',
    roundName: 'Note',
    roundCount: 10,
    promptNoteSeconds: 1.6,
    fromMemory: false,
    buildRounds: (range, random) => singleNoteRounds(range, 10, random),
    holdMsFor: asIs,
  },
  {
    id: 'slides',
    name: 'Slides',
    description: 'Start on one note and slide smoothly into the target.',
    roundName: 'Slide',
    roundCount: 8,
    promptNoteSeconds: 0.9,
    fromMemory: false,
    buildRounds: (range, random) => slideRounds(range, 8, random),
    holdMsFor: asIs,
  },
  {
    id: 'patterns',
    name: 'Patterns',
    description: 'Short tunes like 1-2-3-2-1, one note at a time.',
    roundName: 'Pattern',
    roundCount: 5,
    promptNoteSeconds: 0.55,
    fromMemory: false,
    buildRounds: (range, random) => patternRounds(range, 5, random),
    holdMsFor: (holdMs) => Math.max(PATTERN_MIN_HOLD_MS, holdMs / 2),
  },
  {
    id: 'from-memory',
    name: 'From memory',
    description: 'Hear a note once, wait, then sing it without hearing it again.',
    roundName: 'Note',
    roundCount: 8,
    promptNoteSeconds: 1.6,
    fromMemory: true,
    buildRounds: (range, random) => singleNoteRounds(range, 8, random),
    holdMsFor: asIs,
  },
];

export function exerciseMode(id: string): ExerciseMode {
  return EXERCISE_MODES.find((mode) => mode.id === id) ?? EXERCISE_MODES[0];
}
