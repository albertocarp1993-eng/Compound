import { describe, expect, it } from 'vitest';
import {
  calculateAssetScore,
  calculateAssetScoreDetails,
  calculateCompositeQualityScore,
} from '../services/scoringService';

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

  it('produces a high composite quality score for strong valuation/growth/profitability setup', () => {
    const composite = calculateCompositeQualityScore({
      peRatio: 14,
      roe: 24,
      debtToEquity: 0.6,
      payoutRatio: 38,
      dividendSafetyScore: 88,
      moatRating: 'WIDE',
      historicalVolatility: 0.24,
      dividendGrowthStreak: 15,
      qoqRevenueGrowthPct: 9,
      qoqNetIncomeGrowthPct: 15,
      qoqEpsGrowthPct: 12,
      qoqFreeCashFlowGrowthPct: 8,
      yoyRevenueGrowthPct: 10,
      yoyNetIncomeGrowthPct: 18,
      yoyEpsGrowthPct: 15,
      yoyFreeCashFlowGrowthPct: 11,
      grossMarginPct: 43,
      operatingMarginPct: 31,
      netMarginPct: 24,
      freeCashFlowMarginPct: 26,
    });

    expect(composite.compositeScore).toBeGreaterThanOrEqual(80);
    expect(['ELITE', 'STRONG']).toContain(composite.label);
    expect(composite.components.growth).toBeGreaterThan(60);
    expect(composite.breakdown).toHaveLength(5);
  });

  it('reduces composite score for expensive/negative growth and high leverage', () => {
    const composite = calculateCompositeQualityScore({
      peRatio: 52,
      roe: 3,
      debtToEquity: 3.2,
      payoutRatio: 110,
      dividendSafetyScore: 32,
      moatRating: 'NONE',
      historicalVolatility: 0.72,
      dividendGrowthStreak: 0,
      qoqRevenueGrowthPct: -12,
      qoqNetIncomeGrowthPct: -30,
      qoqEpsGrowthPct: -25,
      qoqFreeCashFlowGrowthPct: -18,
      yoyRevenueGrowthPct: -8,
      yoyNetIncomeGrowthPct: -20,
      yoyEpsGrowthPct: -22,
      yoyFreeCashFlowGrowthPct: -15,
      grossMarginPct: 8,
      operatingMarginPct: 2,
      netMarginPct: -4,
      freeCashFlowMarginPct: -2,
    });

    expect(composite.compositeScore).toBeLessThan(50);
    expect(composite.label).toBe('RISK');
    expect(composite.components.valuation).toBeLessThan(40);
    expect(composite.components.safety).toBeLessThan(45);
  });
});
