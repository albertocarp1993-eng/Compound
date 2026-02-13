import { describe, expect, it } from 'vitest';
import { calculateAssetScore, calculateAssetScoreDetails } from '../services/scoringService';

describe('calculateAssetScore', () => {
  it('rewards wide moat + long dividend streak + safe payout', () => {
    const score = calculateAssetScore({
      debt_to_equity: 0.7,
      payout_ratio: 42,
      dividend_growth_streak: 18,
      moat_rating: 'WIDE',
    });

    expect(score).toBe(95);
  });

  it('penalizes excessive leverage and can result in trim territory', () => {
    const score = calculateAssetScore({
      debt_to_equity: 3.4,
      payout_ratio: 88,
      dividend_growth_streak: 0,
      moat_rating: 'NONE',
    });

    expect(score).toBe(35);
  });

  it('returns deterministic detailed breakdown and verdict', () => {
    const details = calculateAssetScoreDetails({
      debt_to_equity: 1.9,
      payout_ratio: 55,
      dividend_growth_streak: 12,
      moat_rating: 'NARROW',
    });

    expect(details.breakdown).toHaveLength(6);
    expect(details.score).toBeGreaterThanOrEqual(0);
    expect(details.score).toBeLessThanOrEqual(100);
    expect(details.healthRating).toBe(details.score);
    expect(details.verdict).toBe('HOLD');
    expect(details.breakdown.find((item) => item.metric === 'Moat')?.points).toBe(10);
    expect(
      details.breakdown.find((item) => item.metric === 'Dividend Growth Streak')?.points,
    ).toBe(15);
  });
});
