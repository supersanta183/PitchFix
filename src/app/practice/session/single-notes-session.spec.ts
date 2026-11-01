import { Note } from '../../pitch/note';
import { VocalRange } from '../../vocal-range/vocal-range';
import { MatchRules } from '../matching/pitch-judgement';
import { SessionPlan, SingleNotesSession } from './single-notes-session';

const RULES: MatchRules = { toleranceCents: 50, octaveForgiveness: false };
const RANGE = VocalRange.between(Note.fromLabel('D3'), Note.fromLabel('D4'));

function plan(overrides: Partial<SessionPlan> = {}): SessionPlan {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return { range: RANGE, rules: RULES, holdMs: 1000, noteCount: 3, random, ...overrides };
}

/** Holds the current target in tune long enough to match it. */
function singCurrentTarget(session: SingleNotesSession, fromMs: number): number {
  const hz = session.current!.target.frequency;
  let atMs = fromMs;
  for (; atMs <= fromMs + 1100; atMs += 16) {
    session.observe(hz, atMs);
  }
  return atMs;
}

describe('SingleNotesSession', () => {
  it('starts on the first of the planned notes', () => {
    const session = SingleNotesSession.start(plan(), 0);
    expect(session.number).toBe(1);
    expect(session.total).toBe(3);
    expect(session.finished).toBe(false);
  });

  it('only asks for notes inside the singer’s range, never the same note twice in a row', () => {
    const session = SingleNotesSession.start(plan({ noteCount: 40 }), 0);
    let previous = null as Note | null;
    let atMs = 0;
    while (!session.finished) {
      const target = session.current!.target;
      expect(RANGE.contains(target)).toBe(true);
      expect(previous?.equals(target)).not.toBe(true);
      previous = target;
      session.moveOn((atMs += 100));
    }
  });

  it('records a matched note with how long it took', () => {
    const session = SingleNotesSession.start(plan(), 0);
    const atMs = singCurrentTarget(session, 500);
    expect(session.current!.matched).toBe(true);

    session.moveOn(atMs);

    expect(session.outcomes).toHaveLength(1);
    expect(session.outcomes[0].matched).toBe(true);
    expect(session.outcomes[0].timeToMatchMs).toBeGreaterThan(1000);
    expect(session.number).toBe(2);
  });

  it('records a skipped note as missed', () => {
    const session = SingleNotesSession.start(plan(), 0);
    session.moveOn(3000);
    expect(session.outcomes[0]).toEqual(
      expect.objectContaining({ matched: false, timeToMatchMs: null }),
    );
  });

  it('finishes after the last note and counts the matches', () => {
    const session = SingleNotesSession.start(plan(), 0);
    let atMs = singCurrentTarget(session, 0);
    session.moveOn(atMs);
    session.moveOn((atMs += 100));
    atMs = singCurrentTarget(session, atMs);
    session.moveOn(atMs);

    expect(session.finished).toBe(true);
    expect(session.current).toBeNull();
    expect(session.matchedCount).toBe(2);
    expect(session.outcomes).toHaveLength(3);
  });

  it('ignores singing once finished', () => {
    const session = SingleNotesSession.start(plan({ noteCount: 1 }), 0);
    session.moveOn(100);
    expect(() => session.observe(220, 200)).not.toThrow();
    expect(() => session.moveOn(300)).not.toThrow();
    expect(session.outcomes).toHaveLength(1);
  });
});
