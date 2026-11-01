import { PitchTrace } from './pitch-trace';

describe('PitchTrace', () => {
  it('keeps points in the order they were sung', () => {
    const trace = new PitchTrace(1000);
    trace.add(0, 220);
    trace.add(16, null);
    trace.add(32, 221);
    expect(trace.points.map((p) => p.hz)).toEqual([220, null, 221]);
  });

  it('forgets points older than its time window', () => {
    const trace = new PitchTrace(1000);
    trace.add(0, 220);
    trace.add(500, 230);
    trace.add(1200, 240);
    expect(trace.points.map((p) => p.atMs)).toEqual([500, 1200]);
  });

  it('can be cleared', () => {
    const trace = new PitchTrace(1000);
    trace.add(0, 220);
    trace.clear();
    expect(trace.points).toEqual([]);
  });
});
