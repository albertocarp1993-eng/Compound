import { Prisma } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

type PortfolioWithHoldings = Prisma.PortfolioGetPayload<{
  include: {
    user: true;
    holdings: {
      include: {
        asset: true;
      };
    };
  };
}>;

type HoldingWithAsset = Prisma.HoldingGetPayload<{
  include: {
    asset: true;
  };
}>;

export type PortfolioDbClient = Pick<typeof prisma, 'portfolio' | 'user' | 'holding'>;

const createPortfolioSchema = z.object({
  name: z.string().trim().min(1).max(80),
  userId: z.number().int().positive().optional(),
  userName: z.string().trim().min(2).max(80).optional(),
  userEmail: z.string().trim().email().optional(),
});

const updateHoldingSchema = z
  .object({
    quantity: z.number().positive().optional(),
    avgCost: z.number().positive().optional(),
    dripEnabled: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      payload.quantity !== undefined ||
      payload.avgCost !== undefined ||
      payload.dripEnabled !== undefined,
    {
      message: 'At least one field (quantity, avgCost, dripEnabled) must be provided',
    },
  );

const toPortfolioSummary = (portfolio: PortfolioWithHoldings) => {
  const totalValue = portfolio.holdings.reduce(
    (acc, holding) => acc + holding.quantity * holding.asset.currentPrice,
    0,
  );

  return {
    id: portfolio.id,
    name: portfolio.name,
    userId: portfolio.userId,
    userName: portfolio.user.name,
    holdingsCount: portfolio.holdings.length,
    totalValue: Number(totalValue.toFixed(2)),
  };
};

const parsePositiveId = (raw: string): number | null => {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
};

const toHoldingPayload = (holding: HoldingWithAsset) => ({
  id: holding.id,
  portfolioId: holding.portfolioId,
  assetId: holding.assetId,
  symbol: holding.asset.symbol,
  name: holding.asset.name,
  quantity: holding.quantity,
  avgCost: holding.avgCost,
  dripEnabled: holding.drip_enabled,
  currentPrice: holding.asset.currentPrice,
  positionValue: Number((holding.quantity * holding.asset.currentPrice).toFixed(2)),
});

export const createPortfolioRouter = (db: PortfolioDbClient = prisma): Router => {
  const router = Router();

  router.get('/api/portfolios', async (_req: Request, res: Response) => {
    try {
      const portfolios = (await db.portfolio.findMany({
        include: {
          user: true,
          holdings: {
            include: {
              asset: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      })) as PortfolioWithHoldings[];

      const payload = portfolios.map(toPortfolioSummary);
      return res.json({ count: payload.length, portfolios: payload });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to fetch portfolios', details });
    }
  });

  router.post('/api/portfolios', async (req: Request, res: Response) => {
    const parsed = createPortfolioSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid payload for creating portfolio',
        details: parsed.error.flatten(),
      });
    }

    try {
      const payload = parsed.data;
      let owner = null as Awaited<ReturnType<typeof db.user.findFirst>>;

      if (payload.userId) {
        owner = await db.user.findUnique({ where: { id: payload.userId } });
        if (!owner) {
          return res.status(404).json({
            error: `User with id ${payload.userId} was not found`,
          });
        }
      } else if (payload.userEmail) {
        owner = await db.user.findUnique({ where: { email: payload.userEmail } });

        if (!owner) {
          owner = await db.user.create({
            data: {
              email: payload.userEmail,
              name: payload.userName ?? 'Snowball Investor',
            },
          });
        }
      } else {
        owner = await db.user.findFirst({ orderBy: { id: 'asc' } });

        if (!owner) {
          owner = await db.user.create({
            data: {
              email: `snowball-owner-${Date.now()}@example.com`,
              name: payload.userName ?? 'Snowball Owner',
            },
          });
        }
      }

      const created = (await db.portfolio.create({
        data: {
          name: payload.name,
          userId: owner.id,
        },
        include: {
          user: true,
          holdings: {
            include: {
              asset: true,
            },
          },
        },
      })) as PortfolioWithHoldings;

      return res.status(201).json({ portfolio: toPortfolioSummary(created) });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to create portfolio', details });
    }
  });

  router.patch('/api/portfolios/:portfolioId/holdings/:holdingId', async (req: Request, res: Response) => {
    const portfolioId = parsePositiveId(req.params.portfolioId);
    const holdingId = parsePositiveId(req.params.holdingId);

    if (!portfolioId || !holdingId) {
      return res.status(400).json({
        error: 'portfolioId and holdingId must be positive integers',
      });
    }

    const parsed = updateHoldingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid payload for updating holding',
        details: parsed.error.flatten(),
      });
    }

    try {
      const existing = await db.holding.findFirst({
        where: {
          id: holdingId,
          portfolioId,
        },
        include: {
          asset: true,
        },
      });

      if (!existing) {
        return res.status(404).json({
          error: `Holding ${holdingId} was not found in portfolio ${portfolioId}`,
        });
      }

      const payload = parsed.data;
      const updated = (await db.holding.update({
        where: {
          id: holdingId,
        },
        data: {
          ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
          ...(payload.avgCost !== undefined ? { avgCost: payload.avgCost } : {}),
          ...(payload.dripEnabled !== undefined ? { drip_enabled: payload.dripEnabled } : {}),
        },
        include: {
          asset: true,
        },
      })) as HoldingWithAsset;

      return res.json({
        holding: toHoldingPayload(updated),
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to update holding', details });
    }
  });

  router.delete('/api/portfolios/:portfolioId/holdings/:holdingId', async (req: Request, res: Response) => {
    const portfolioId = parsePositiveId(req.params.portfolioId);
    const holdingId = parsePositiveId(req.params.holdingId);

    if (!portfolioId || !holdingId) {
      return res.status(400).json({
        error: 'portfolioId and holdingId must be positive integers',
      });
    }

    try {
      const existing = await db.holding.findFirst({
        where: {
          id: holdingId,
          portfolioId,
        },
        include: {
          asset: true,
        },
      });

      if (!existing) {
        return res.status(404).json({
          error: `Holding ${holdingId} was not found in portfolio ${portfolioId}`,
        });
      }

      const deleted = (await db.holding.delete({
        where: {
          id: holdingId,
        },
        include: {
          asset: true,
        },
      })) as HoldingWithAsset;

      return res.json({
        deleted: true,
        holding: toHoldingPayload(deleted),
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to delete holding', details });
    }
  });

  return router;
};

const portfolioRouter = createPortfolioRouter();

export default portfolioRouter;
