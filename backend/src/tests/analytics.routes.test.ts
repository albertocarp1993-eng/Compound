import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { calculateAssetScore } from '../services/scoringService';
import { createAnalyticsRouter } from '../routes/analytics.routes';

type MockHolding = {
  id: number;
  portfolioId: number;
  assetId: number;
  quantity: number;
  avgCost: number;
  asset: {
    id: number;
    symbol: string;
    name: string;
    currentPrice: number;
    fundamentals: {
      pe_ratio: number;
      roe: number;
      debt_to_equity: number;
      dividend_safety_score: number;
      moat_rating: 'WIDE' | 'NARROW' | 'NONE';
      historical_volatility: number;
      calculated_score: number;
    };
  };
};

const makeHolding = (holding: Omit<MockHolding, 'asset'> & { asset: Omit<MockHolding['asset'], 'fundamentals'> & { fundamentals: Omit<MockHolding['asset']['fundamentals'], 'calculated_score'> } }): MockHolding => {
  const score = calculateAssetScore(holding.asset.fundamentals);
  return {
    ...holding,
    asset: {
      ...holding.asset,
      fundamentals: {
        ...holding.asset.fundamentals,
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
        asset: {
          id: 1,
          symbol: 'AAPL',
          name: 'Apple',
          currentPrice: 100,
          fundamentals: {
            pe_ratio: 15,
            roe: 120,
            debt_to_equity: 0.6,
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
        asset: {
          id: 2,
          symbol: 'RISK',
          name: 'Risky Co',
          currentPrice: 100,
          fundamentals: {
            pe_ratio: 0,
            roe: -10,
            debt_to_equity: 4.2,
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
    expect(response.body.weightedAverageScore).toBeCloseTo(66.67, 2);
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
        asset: {
          id: 1,
          symbol: 'AAPL',
          name: 'Apple',
          currentPrice: 100,
          fundamentals: {
            pe_ratio: 28,
            roe: 120,
            debt_to_equity: 0.6,
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
    });
    expect(response.body.matrix[0].y).toBeGreaterThanOrEqual(0);
    expect(response.body.matrix[0].y).toBeLessThanOrEqual(100);
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
