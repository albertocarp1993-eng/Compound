import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createPortfolioRouter } from '../routes/portfolios.routes';

const mockHolding = {
  id: 1,
  portfolioId: 1,
  assetId: 1,
  quantity: 10,
  avgCost: 120,
  drip_enabled: true,
  asset: {
    id: 1,
    symbol: 'AAPL',
    name: 'Apple',
    currentPrice: 190,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe('portfolio routes', () => {
  it('returns portfolio list with computed total value', async () => {
    const db = {
      portfolio: {
        findMany: async () => [
          {
            id: 1,
            userId: 1,
            name: 'Core',
            user: {
              id: 1,
              name: 'Alberto',
              email: 'alberto@example.com',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            holdings: [
              {
                id: 1,
                portfolioId: 1,
                assetId: 1,
                quantity: 2,
                avgCost: 150,
                asset: {
                  id: 1,
                  symbol: 'AAPL',
                  name: 'Apple',
                  currentPrice: 200,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
      user: {
        findFirst: async () => null,
        findUnique: async () => null,
        create: async () => ({
          id: 1,
          name: 'Alberto',
          email: 'alberto@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      holding: {
        findFirst: async () => null,
        update: async () => mockHolding,
        delete: async () => mockHolding,
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

  it('creates a new portfolio for existing user', async () => {
    const db = {
      portfolio: {
        findMany: async () => [],
        create: async ({ data }: { data: { name: string; userId: number } }) => ({
          id: 3,
          userId: data.userId,
          name: data.name,
          user: {
            id: data.userId,
            name: 'Alberto',
            email: 'alberto@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          holdings: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      user: {
        findFirst: async () => ({
          id: 1,
          name: 'Alberto',
          email: 'alberto@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findUnique: async () => null,
        create: async () => ({
          id: 1,
          name: 'Alberto',
          email: 'alberto@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      holding: {
        findFirst: async () => null,
        update: async () => mockHolding,
        delete: async () => mockHolding,
      },
    };

    const app = express();
    app.use(express.json());
    app.use(createPortfolioRouter(db as never));

    const response = await request(app).post('/api/portfolios').send({ name: 'Dividend Income' });

    expect(response.status).toBe(201);
    expect(response.body.portfolio).toMatchObject({
      id: 3,
      name: 'Dividend Income',
      userId: 1,
      holdingsCount: 0,
      totalValue: 0,
    });
  });

  it('updates a holding in a portfolio', async () => {
    const db = {
      portfolio: {
        findMany: async () => [],
        create: async () => ({
          id: 1,
          userId: 1,
          name: 'Core',
          user: {
            id: 1,
            name: 'Alberto',
            email: 'alberto@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          holdings: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      user: {
        findFirst: async () => null,
        findUnique: async () => null,
        create: async () => ({
          id: 1,
          name: 'Alberto',
          email: 'alberto@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      holding: {
        findFirst: async () => mockHolding,
        update: async () => ({
          ...mockHolding,
          quantity: 12,
          avgCost: 130,
          drip_enabled: false,
        }),
        delete: async () => mockHolding,
      },
    };

    const app = express();
    app.use(express.json());
    app.use(createPortfolioRouter(db as never));

    const response = await request(app)
      .patch('/api/portfolios/1/holdings/1')
      .send({ quantity: 12, avgCost: 130, dripEnabled: false });

    expect(response.status).toBe(200);
    expect(response.body.holding).toMatchObject({
      id: 1,
      quantity: 12,
      avgCost: 130,
      dripEnabled: false,
      symbol: 'AAPL',
    });
  });

  it('deletes a holding from a portfolio', async () => {
    const db = {
      portfolio: {
        findMany: async () => [],
        create: async () => ({
          id: 1,
          userId: 1,
          name: 'Core',
          user: {
            id: 1,
            name: 'Alberto',
            email: 'alberto@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          holdings: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      user: {
        findFirst: async () => null,
        findUnique: async () => null,
        create: async () => ({
          id: 1,
          name: 'Alberto',
          email: 'alberto@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      holding: {
        findFirst: async () => mockHolding,
        update: async () => mockHolding,
        delete: async () => mockHolding,
      },
    };

    const app = express();
    app.use(createPortfolioRouter(db as never));

    const response = await request(app).delete('/api/portfolios/1/holdings/1');

    expect(response.status).toBe(200);
    expect(response.body.deleted).toBe(true);
    expect(response.body.holding).toMatchObject({
      id: 1,
      symbol: 'AAPL',
      positionValue: 1900,
    });
  });
});
