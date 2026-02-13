import { describe, expect, it } from 'vitest';
import { calculateAssetScore, calculateAssetScoreDetails } from '../services/scoringService';

describe('calculateAssetScore', () => {
  it('rewards high quality moat and profitability while clamping to 100', () => {
    const score = calculateAssetScore({
      pe_ratio: 14,
      roe: 180,
      debt_to_equity: 0.3,
      dividend_safety_score: 95,
      moat_rating: 'WIDE',
      historical_volatility: 0.18,
    });

    expect(score).toBe(100);
  });

  it('penalizes risky fundamentals and clamps lower bound to 0', () => {
    const score = calculateAssetScore({
      pe_ratio: 0,
      roe: -40,
      debt_to_equity: 6.5,
      dividend_safety_score: 0,
      moat_rating: 'NONE',
      historical_volatility: 1.4,
    });

    expect(score).toBe(0);
  });

  it('returns deterministic detailed breakdown', () => {
    const details = calculateAssetScoreDetails({
      pe_ratio: 30,
      roe: 20,
      debt_to_equity: 2.6,
      dividend_safety_score: 70,
      moat_rating: 'NARROW',
      historical_volatility: 0.35,
    });

    expect(details.breakdown).toHaveLength(6);
    expect(details.score).toBeGreaterThanOrEqual(0);
    expect(details.score).toBeLessThanOrEqual(100);
    expect(details.breakdown.find((item) => item.metric === 'Moat')?.points).toBe(10);
  });
});
