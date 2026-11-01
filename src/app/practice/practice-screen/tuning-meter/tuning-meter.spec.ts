import { formatCents, verdictMessage } from './tuning-meter';

describe('tuning meter wording', () => {
  it('tells the singer which way to move', () => {
    expect(verdictMessage('too-low')).toBe('Too low – go up');
    expect(verdictMessage('too-high')).toBe('Too high – go down');
    expect(verdictMessage('on-pitch')).toBe('Spot on!');
  });

  it('shows cents rounded, with a sign', () => {
    expect(formatCents(12.4)).toBe('+12 ¢');
    expect(formatCents(-35.6)).toBe('−36 ¢');
    expect(formatCents(0.3)).toBe('0 ¢');
  });
});
