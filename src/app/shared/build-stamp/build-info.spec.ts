import { BuildInfo, describeBuild } from './build-info';

const UTC = { locale: 'en-GB', timeZone: 'UTC' };

describe('describeBuild', () => {
  it('shows the deployment, commit and build time of a Vercel deploy', () => {
    const info: BuildInfo = {
      deploymentId: '2cc2a1dvw',
      commit: '0ac42f8',
      builtAt: '2026-11-01T14:05:00.000Z',
    };
    expect(describeBuild(info, UTC)).toBe('2cc2a1dvw · 0ac42f8 · 1 Nov, 14:05');
  });

  it('marks local builds and leaves out what is unknown', () => {
    const info: BuildInfo = {
      deploymentId: null,
      commit: null,
      builtAt: '2026-11-01T09:30:00.000Z',
    };
    expect(describeBuild(info, UTC)).toBe('local · 1 Nov, 09:30');
  });
});
