import { Note } from '../../pitch/note';
import { midiToFrequency } from '../../pitch/pitch-math';
import { MatchRules } from './pitch-judgement';
import { NoteAttempt } from './note-attempt';

const FRAME_MS = 16;
const A3 = Note.fromLabel('A3');
const RULES: MatchRules = { toleranceCents: 50, octaveForgiveness: true };
const hzAt = (cents: number) => midiToFrequency(A3.midi + cents / 100);

/** Sings one value per animation frame for `ms`, starting at `fromMs`; returns the end time. */
function sing(attempt: NoteAttempt, hz: number | null, fromMs: number, ms: number): number {
  let atMs = fromMs;
  for (; atMs <= fromMs + ms; atMs += FRAME_MS) {
    attempt.observe(hz, atMs);
  }
  return atMs;
}

describe('NoteAttempt', () => {
  it('is matched once the target is held in tune for the hold time', () => {
    const attempt = NoteAttempt.start(A3, RULES, 1000, 0);
    sing(attempt, 220, 0, 990);
    expect(attempt.matched).toBe(false);

    sing(attempt, 220, 1000, 32);
    expect(attempt.matched).toBe(true);
  });

  it('shows how far through the hold the singer is', () => {
    const attempt = NoteAttempt.start(A3, RULES, 1000, 0);
    sing(attempt, 220, 0, 500);
    expect(attempt.holdProgress).toBeCloseTo(0.5, 1);
  });

  it('does not count time spent out of tune', () => {
    const attempt = NoteAttempt.start(A3, RULES, 1000, 0);
    const end = sing(attempt, hzAt(-80), 0, 2000);
    expect(attempt.matched).toBe(false);
    expect(attempt.holdProgress).toBe(0);

    sing(attempt, 220, end, 1050);
    expect(attempt.matched).toBe(true);
  });

  it('starts the hold over when the singer drifts out of tune', () => {
    const attempt = NoteAttempt.start(A3, RULES, 1000, 0);
    let atMs = sing(attempt, 220, 0, 700);
    atMs = sing(attempt, hzAt(90), atMs, 300);
    sing(attempt, 220, atMs, 500);
    expect(attempt.matched).toBe(false);
  });

  it('forgives a tiny wobble or dropout', () => {
    const attempt = NoteAttempt.start(A3, RULES, 1000, 0);
    let atMs = sing(attempt, 220, 0, 500);
    atMs = sing(attempt, null, atMs, 80);
    sing(attempt, 220, atMs, 450);
    expect(attempt.matched).toBe(true);
  });

  it('uses the tolerance from the rules', () => {
    const strict = NoteAttempt.start(A3, { ...RULES, toleranceCents: 20 }, 1000, 0);
    sing(strict, hzAt(30), 0, 1100);
    expect(strict.matched).toBe(false);
  });

  it('accepts the target in another octave only with octave forgiveness', () => {
    const forgiving = NoteAttempt.start(A3, RULES, 1000, 0);
    sing(forgiving, 110, 0, 1100);
    expect(forgiving.matched).toBe(true);

    const strict = NoteAttempt.start(A3, { ...RULES, octaveForgiveness: false }, 1000, 0);
    sing(strict, 110, 0, 1100);
    expect(strict.matched).toBe(false);
  });

  it('remembers how long it took to match', () => {
    const attempt = NoteAttempt.start(A3, RULES, 1000, 5000);
    let atMs = sing(attempt, null, 5000, 1000);
    atMs = sing(attempt, 220, atMs, 1100);
    expect(attempt.timeToMatchMs).toBeGreaterThanOrEqual(2000);
    expect(attempt.timeToMatchMs).toBeLessThan(2100);
  });

  it('stays matched and stops listening once matched', () => {
    const attempt = NoteAttempt.start(A3, RULES, 1000, 0);
    const atMs = sing(attempt, 220, 0, 1100);
    sing(attempt, hzAt(-300), atMs, 500);
    expect(attempt.matched).toBe(true);
    expect(attempt.holdProgress).toBe(1);
  });

  it('judges the latest sung pitch for live feedback', () => {
    const attempt = NoteAttempt.start(A3, RULES, 1000, 0);
    attempt.observe(hzAt(-80), 0);
    expect(attempt.judgement?.verdict).toBe('too-low');
    attempt.observe(null, 16);
    expect(attempt.judgement).toBeNull();
  });
});
