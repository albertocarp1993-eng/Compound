import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAssetRouter } from '../routes/assets.routes';

const mockAsset = {
  id: 1,
  symbol: 'AAPL',
  name: 'Apple Inc.',
  currentPrice: 189.5,
  createdAt: new Date(),
  updatedAt: new Date(),
  fundamentals: {
    id: 1,
    asset_id: 1,
    pe_ratio: 28,
    roe: 150,
    debt_to_equity: 1.7,
    payout_ratio: 15.7,
    dividend_growth_streak: 12,
    dividend_safety_score: 86,
    moat_rating: 'WIDE' as const,
    historical_volatility: 0.26,
    health_rating: 95,
    verdict: 'BUY' as const,
    calculated_score: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  financials: [
    {
      id: 1,
      asset_id: 1,
      period: 'ANNUAL' as const,
      fiscal_year: 2023,
      fiscal_period: 'FY',
      revenue: 383285,
      gross_profit: 169148,
      operating_income: 114301,
      net_income: 97000,
      eps: 6.13,
      free_cash_flow: 99600,
      total_assets: 352583,
      total_liabilities: 290437,
      total_equity: 62146,
      dividends_per_share: 0.96,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

const createExternalMock = () => ({
  searchCompanies: async () => [],
  getCompanyProfile: async () => ({ symbol: 'AAPL', name: 'Apple Inc.', cik: '0000320193' }),
  getFinancialStatements: async () => [],
  getQuote: async () => ({
    symbol: 'AAPL',
    price: 191,
    change: 1.4,
    changePercent: 0.74,
    marketCap: 3_000_000_000_000,
    currency: 'USD',
    exchange: 'US',
    source: 'stooq' as const,
  }),
  getNews: async () => [
    {
      title: 'Apple launches new AI features',
      url: 'https://example.com/apple-ai',
      publishedAt: '2026-02-10T10:00:00.000Z',
      source: 'Example News',
      summary: 'A new release expands on-device intelligence features.',
    },
  ],
});

describe('asset routes', () => {
  it('returns financial statements for a symbol', async () => {
    const db = {
      asset: {
        findFirst: async () => mockAsset,
        findMany: async () => [],
      },
    };

    const app = express();
    app.use(createAssetRouter(db as never, createExternalMock()));

    const response = await request(app).get('/api/assets/AAPL/financials');

    expect(response.status).toBe(200);
    expect(response.body.symbol).toBe('AAPL');
    expect(response.body.financials).toHaveLength(1);
    expect(response.body.financials[0]).toMatchObject({
      fiscalYear: 2023,
      netIncome: 97000,
    });
  });

  it('returns search results for asset query', async () => {
    const db = {
      asset: {
        findFirst: async () => null,
        findMany: async () => [mockAsset],
      },
    };

    const externalClient = {
      ...createExternalMock(),
      searchCompanies: async () => [
        { symbol: 'MSFT', name: 'MICROSOFT CORP', cik: '0000789019' },
      ],
    };

    const app = express();
    app.use(createAssetRouter(db as never, externalClient));

    const response = await request(app).get('/api/assets/search?query=app');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.results[0]).toMatchObject({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      snowballScore: 95,
    });
  });

  it('returns comprehensive payload with quote and news', async () => {
    const db = {
      asset: {
        findFirst: async () => mockAsset,
        findMany: async () => [],
      },
    };

    const app = express();
    app.use(createAssetRouter(db as never, createExternalMock()));

    const response = await request(app).get('/api/assets/AAPL/comprehensive');

    expect(response.status).toBe(200);
    expect(response.body.symbol).toBe('AAPL');
    expect(response.body.quote).toMatchObject({
      symbol: 'AAPL',
      price: 191,
      source: 'stooq',
    });
    expect(response.body.news).toHaveLength(1);
    expect(response.body.insights.moat).toContain('competitive');
  });

  it('returns 404 when symbol does not exist', async () => {
    const db = {
      asset: {
        findFirst: async () => null,
        findMany: async () => [],
      },
    };

    const externalClient = {
      ...createExternalMock(),
      getCompanyProfile: async () => null,
      getFinancialStatements: async () => [],
      getQuote: async () => null,
      getNews: async () => [],
    };

    const app = express();
    app.use(createAssetRouter(db as never, externalClient));

    const response = await request(app).get('/api/assets/UNKN/financials');

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('not found');
  });
});
