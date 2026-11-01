import { displayVersion } from './app-version';

describe('displayVersion', () => {
  it('shows major and minor version with a "v" prefix', () => {
    expect(displayVersion('1.0.0')).toBe('v1.0');
    expect(displayVersion('2.1.0')).toBe('v2.1');
  });

  it('leaves out the patch number', () => {
    expect(displayVersion('1.4.7')).toBe('v1.4');
  });

  it('keeps multi-digit numbers', () => {
    expect(displayVersion('1.12.0')).toBe('v1.12');
  });
});
