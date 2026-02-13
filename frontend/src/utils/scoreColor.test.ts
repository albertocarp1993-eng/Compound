import { describe, expect, it } from 'vitest';
import { formatSignedPoints, getScoreColor } from './scoreColor';

describe('score color utility', () => {
  it('returns green for high scores', () => {
    expect(getScoreColor(85)).toBe('#22c55e');
  });

  it('returns yellow for medium scores', () => {
    expect(getScoreColor(65)).toBe('#eab308');
  });

  it('returns red for low scores', () => {
    expect(getScoreColor(49)).toBe('#ef4444');
  });

  it('formats signed points', () => {
    expect(formatSignedPoints(5.234)).toBe('+5.2pts');
    expect(formatSignedPoints(-2)).toBe('-2pts');
  });
});
