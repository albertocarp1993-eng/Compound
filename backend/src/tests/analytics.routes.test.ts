import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { calculateAssetScore, calculateAssetScoreDetails } from '../services/scoringService';
import { createAnalyticsRouter } from '../routes/analytics.routes';

type MockHolding = {
  id: number;
  portfolioId: number;
  assetId: number;
  quantity: number;
  avgCost: number;
  drip_enabled: boolean;
  asset: {
    id: number;
    symbol: string;
    name: string;
    currentPrice: number;
    moat_rating: 'WIDE' | 'NARROW' | 'NONE';
    dividend_safety: number;
    financials: Array<{
      period: 'ANNUAL' | 'QUARTERLY';
      fiscal_year: number;
      dividends_per_share: number;
    }>;
    fundamentals: {
      pe_ratio: number;
      roe: number;
      debt_to_equity: number;
      payout_ratio: number;
      dividend_growth_streak: number;
      dividend_safety_score: number;
      moat_rating: 'WIDE' | 'NARROW' | 'NONE';
      historical_volatility: number;
      health_rating: number;
      verdict: 'BUY' | 'HOLD' | 'TRIM';
      calculated_score: number;
    };
  };
};

type MakeHoldingInput = Omit<MockHolding, 'asset'> & {
  asset: Omit<MockHolding['asset'], 'fundamentals'> & {
    fundamentals: Omit<MockHolding['asset']['fundamentals'], 'health_rating' | 'verdict' | 'calculated_score'>;
  };
};

const makeHolding = (holding: MakeHoldingInput): MockHolding => {
  const details = calculateAssetScoreDetails(holding.asset.fundamentals);
  const score = calculateAssetScore(holding.asset.fundamentals);
  return {
    ...holding,
    asset: {
      ...holding.asset,
      fundamentals: {
        ...holding.asset.fundamentals,
        health_rating: details.healthRating,
        verdict: details.verdict,
        calculated_score: score,
      },
    },
  };
};

describe('analytics routes', () => {
  it('returns weighted portfolio health score', async () => {
    const holdings: MockHolding[] = [
      makeHolding({
        id: 1,
        portfolioId: 1,
        assetId: 1,
        quantity: 10,
        avgCost: 90,
        drip_enabled: true,
        asset: {
          id: 1,
          symbol: 'AAPL',
          name: 'Apple',
          currentPrice: 100,
          moat_rating: 'WIDE',
          dividend_safety: 90,
          financials: [
            {
              period: 'ANNUAL',
              fiscal_year: 2025,
              dividends_per_share: 1,
            },
          ],
          fundamentals: {
            pe_ratio: 15,
            roe: 120,
            debt_to_equity: 0.6,
            payout_ratio: 40,
            dividend_growth_streak: 14,
            dividend_safety_score: 90,
            moat_rating: 'WIDE',
            historical_volatility: 0.2,
          },
        },
      }),
      makeHolding({
        id: 2,
        portfolioId: 1,
        assetId: 2,
        quantity: 5,
        avgCost: 120,
        drip_enabled: false,
        asset: {
          id: 2,
          symbol: 'RISK',
          name: 'Risky Co',
          currentPrice: 100,
          moat_rating: 'NONE',
          dividend_safety: 10,
          financials: [
            {
              period: 'ANNUAL',
              fiscal_year: 2025,
              dividends_per_share: 0,
            },
          ],
          fundamentals: {
            pe_ratio: 0,
            roe: -10,
            debt_to_equity: 4.2,
            payout_ratio: 95,
            dividend_growth_streak: 0,
            dividend_safety_score: 10,
            moat_rating: 'NONE',
            historical_volatility: 0.9,
          },
        },
      }),
    ];

    const db = {
      holding: {
        findMany: async () => holdings,
      },
    };

    const app = express();
    app.use(createAnalyticsRouter(db as never));

    const response = await request(app).get('/api/analytics/portfolio-health?portfolioId=1');

    expect(response.status).toBe(200);
    expect(response.body.weightedAverageScore).toBeCloseTo(75, 2);
    expect(response.body.scoreColor).toBe('#eab308');
    expect(response.body.holdingsAnalyzed).toBe(2);
  });

  it('returns scatter matrix data with x y z fields', async () => {
    const holdings: MockHolding[] = [
      makeHolding({
        id: 1,
        portfolioId: 1,
        assetId: 1,
        quantity: 10,
        avgCost: 90,
        drip_enabled: true,
        asset: {
          id: 1,
          symbol: 'AAPL',
          name: 'Apple',
          currentPrice: 100,
          moat_rating: 'WIDE',
          dividend_safety: 90,
          financials: [
            {
              period: 'ANNUAL',
              fiscal_year: 2025,
              dividends_per_share: 1,
            },
          ],
          fundamentals: {
            pe_ratio: 28,
            roe: 120,
            debt_to_equity: 0.6,
            payout_ratio: 40,
            dividend_growth_streak: 14,
            dividend_safety_score: 90,
            moat_rating: 'WIDE',
            historical_volatility: 0.2,
          },
        },
      }),
    ];

    const db = {
      holding: {
        findMany: async () => holdings,
      },
    };

    const app = express();
    app.use(createAnalyticsRouter(db as never));

    const response = await request(app).get('/api/analytics/matrix?portfolioId=1');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.matrix[0]).toMatchObject({
      symbol: 'AAPL',
      x: 28,
      z: 1000,
      verdict: 'BUY',
    });
    expect(response.body.matrix[0].y).toBeGreaterThanOrEqual(0);
    expect(response.body.matrix[0].y).toBeLessThanOrEqual(100);
  });

  it('returns CRM KPI ticker and snowball series', async () => {
    const holdings: MockHolding[] = [
      makeHolding({
        id: 1,
        portfolioId: 1,
        assetId: 1,
        quantity: 10,
        avgCost: 90,
        drip_enabled: true,
        asset: {
          id: 1,
          symbol: 'AAPL',
          name: 'Apple',
          currentPrice: 100,
          moat_rating: 'WIDE',
          dividend_safety: 90,
          financials: [
            {
              period: 'ANNUAL',
              fiscal_year: 2025,
              dividends_per_share: 1,
            },
          ],
          fundamentals: {
            pe_ratio: 20,
            roe: 120,
            debt_to_equity: 0.6,
            payout_ratio: 40,
            dividend_growth_streak: 14,
            dividend_safety_score: 90,
            moat_rating: 'WIDE',
            historical_volatility: 0.2,
          },
        },
      }),
    ];

    const snapshots = [
      {
        id: 1,
        portfolioId: 1,
        date: new Date('2025-01-01T00:00:00.000Z'),
        total_value: 100_000,
        total_dividends: 4_000,
        invested_capital: 85_000,
        future_income: 2_800,
      },
      {
        id: 2,
        portfolioId: 1,
        date: new Date('2025-12-01T00:00:00.000Z'),
        total_value: 128_000,
        total_dividends: 6_400,
        invested_capital: 95_000,
        future_income: 3_600,
      },
    ];

    const db = {
      holding: {
        findMany: async () => holdings,
      },
      portfolioSnapshot: {
        findMany: async () => snapshots,
      },
    };

    const app = express();
    app.use(createAnalyticsRouter(db as never));

    const kpiResponse = await request(app).get('/api/analytics/kpis?portfolioId=1');
    expect(kpiResponse.status).toBe(200);
    expect(kpiResponse.body.netWorth).toBe(128000);
    expect(kpiResponse.body.ytdDividends).toBe(2400);

    const snowballResponse = await request(app).get('/api/analytics/snowball?portfolioId=1');
    expect(snowballResponse.status).toBe(200);
    expect(snowballResponse.body.points).toHaveLength(2);
    expect(snowballResponse.body.summary).toMatchObject({
      totalValue: 128000,
      investedCapital: 95000,
    });

    const payoutResponse = await request(app).get('/api/analytics/payout-calendar?portfolioId=1&year=2026');
    expect(payoutResponse.status).toBe(200);
    expect(payoutResponse.body.days).toHaveLength(4);
    expect(payoutResponse.body.projectedAnnualDividends).toBe(10);
  });

  it('returns 400 when portfolioId is missing', async () => {
    const db = {
      holding: {
        findMany: async () => [],
      },
    };

    const app = express();
    app.use(createAnalyticsRouter(db as never));

    const response = await request(app).get('/api/analytics/portfolio-health');

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('portfolioId');
  });
});
