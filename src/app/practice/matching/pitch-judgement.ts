import { Note } from '../../pitch/note';
import { foldToNearestOctave } from '../../pitch/pitch-math';

export type PitchVerdict = 'too-low' | 'on-pitch' | 'too-high';

export interface PitchJudgement {
  /** Positive when sharp, negative when flat. */
  readonly centsOff: number;
  readonly verdict: PitchVerdict;
}

export interface MatchRules {
  /** How far from the target, either way, still counts as on pitch. */
  readonly toleranceCents: number;
  /** Accept the target note in any octave. */
  readonly octaveForgiveness: boolean;
}

export const DEFAULT_MATCH_RULES: MatchRules = { toleranceCents: 50, octaveForgiveness: true };

export function judgePitch(sungHz: number, target: Note, rules: MatchRules): PitchJudgement {
  const rawCents = target.centsFrom(sungHz);
  const centsOff = rules.octaveForgiveness ? foldToNearestOctave(rawCents) : rawCents;
  const verdict =
    Math.abs(centsOff) <= rules.toleranceCents ? 'on-pitch' : centsOff < 0 ? 'too-low' : 'too-high';
  return { centsOff, verdict };
}
