import { Note } from '../../pitch/note';
import { Round } from '../exercises/exercise-rounds';
import { MatchRules } from '../matching/pitch-judgement';
import { PracticeSession, SessionPlan } from './practice-session';

const note = Note.fromLabel;
const RULES: MatchRules = { toleranceCents: 50, octaveForgiveness: false };

function single(label: string): Round {
  return { prompt: [note(label)], targets: [note(label)] };
}

function plan(rounds: Round[]): SessionPlan {
  return { rounds, rules: RULES, holdMs: 500 };
}

/** Sings `hz` once per frame for `ms`; returns the time after the last frame. */
function sing(session: PracticeSession, hz: number | null, fromMs: number, ms: number): number {
  let atMs = fromMs;
  for (; atMs <= fromMs + ms; atMs += 16) {
    session.observe(hz, atMs);
  }
  return atMs;
}

describe('PracticeSession', () => {
  describe('with one note per round', () => {
    it('starts on the first round', () => {
      const session = PracticeSession.start(plan([single('A3'), single('C4')]), 0);
      expect(session.roundNumber).toBe(1);
      expect(session.totalRounds).toBe(2);
      expect(session.current?.target.label).toBe('A3');
      expect(session.startsNewRound).toBe(true);
    });

    it('records a matched note with how long it took, then moves to the next round', () => {
      const session = PracticeSession.start(plan([single('A3'), single('C4')]), 0);
      const atMs = sing(session, 220, 300, 600);
      expect(session.current?.matched).toBe(true);

      session.moveOn(atMs);

      expect(session.outcomes[0]).toEqual(expect.objectContaining({ round: 0, matched: true }));
      expect(session.outcomes[0].timeToMatchMs).toBeGreaterThan(700);
      expect(session.roundNumber).toBe(2);
      expect(session.current?.target.label).toBe('C4');
    });

    it('records a skipped note as missed', () => {
      const session = PracticeSession.start(plan([single('A3'), single('C4')]), 0);
      session.moveOn(1000);
      expect(session.outcomes[0]).toEqual(
        expect.objectContaining({ matched: false, timeToMatchMs: null }),
      );
    });

    it('finishes after the last round and counts the matches', () => {
      const session = PracticeSession.start(plan([single('A3'), single('C4')]), 0);
      session.moveOn(sing(session, 220, 0, 600));
      session.moveOn(1000);

      expect(session.finished).toBe(true);
      expect(session.current).toBeNull();
      expect(session.matchedCount).toBe(1);
      expect(() => session.observe(220, 2000)).not.toThrow();
      expect(() => session.moveOn(2100)).not.toThrow();
      expect(session.outcomes).toHaveLength(2);
    });
  });

  describe('with a pattern of notes per round', () => {
    const pattern: Round = {
      name: '1-2-3-2-1',
      prompt: ['C4', 'D4', 'E4', 'D4', 'C4'].map(note),
      targets: ['C4', 'D4', 'E4', 'D4', 'C4'].map(note),
    };

    it('asks for each note of the pattern in turn within the same round', () => {
      const session = PracticeSession.start(plan([pattern, single('A3')]), 0);
      expect(session.notesInRound).toBe(5);

      session.moveOn(100);

      expect(session.roundNumber).toBe(1);
      expect(session.noteNumber).toBe(2);
      expect(session.current?.target.label).toBe('D4');
      expect(session.startsNewRound).toBe(false);
    });

    it('moves to the next round after the last note of the pattern', () => {
      const session = PracticeSession.start(plan([pattern, single('A3')]), 0);
      for (let i = 0; i < 5; i++) {
        session.moveOn(i * 100);
      }
      expect(session.roundNumber).toBe(2);
      expect(session.startsNewRound).toBe(true);
      expect(session.outcomes.map((o) => o.round)).toEqual([0, 0, 0, 0, 0]);
    });
  });

  describe('with a slide', () => {
    const slide: Round = {
      prompt: [note('F3'), note('A3')],
      targets: [note('A3')],
      slideFrom: note('F3'),
    };

    it('waits for the singer to find the start note first', () => {
      const session = PracticeSession.start(plan([slide]), 0);
      expect(session.awaitingSlideStart).toBe(true);
      expect(session.focus?.target.label).toBe('F3');

      sing(session, 220, 0, 1000);

      expect(session.current?.matched).toBe(false);
    });

    it('counts the target once the singer slides into it from the start note', () => {
      const session = PracticeSession.start(plan([slide]), 0);
      let atMs = sing(session, note('F3').frequency, 0, 400);
      expect(session.awaitingSlideStart).toBe(false);
      expect(session.focus?.target.label).toBe('A3');

      atMs = sing(session, note('G3').frequency, atMs, 150);
      sing(session, 220, atMs, 600);

      expect(session.current?.matched).toBe(true);
    });
  });
});
