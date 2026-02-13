import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createPortfolioRouter } from '../routes/portfolios.routes';

describe('portfolio routes', () => {
  it('returns portfolio list with computed total value', async () => {
    const db = {
      portfolio: {
        findMany: async () => [
          {
            id: 1,
            userId: 1,
            name: 'Core',
            user: { id: 1, name: 'Alberto', email: 'alberto@example.com', createdAt: new Date(), updatedAt: new Date() },
            holdings: [
              {
                id: 1,
                portfolioId: 1,
                assetId: 1,
                quantity: 2,
                avgCost: 150,
                asset: { id: 1, symbol: 'AAPL', name: 'Apple', currentPrice: 200, createdAt: new Date(), updatedAt: new Date() },
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    };

    const app = express();
    app.use(createPortfolioRouter(db as never));

    const response = await request(app).get('/api/portfolios');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.portfolios[0]).toMatchObject({
      id: 1,
      name: 'Core',
      totalValue: 400,
      holdingsCount: 1,
    });
  });
});
