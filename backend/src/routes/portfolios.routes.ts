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

export type PortfolioDbClient = Pick<typeof prisma, 'portfolio' | 'user'>;

const createPortfolioSchema = z.object({
  name: z.string().trim().min(1).max(80),
  userId: z.number().int().positive().optional(),
  userName: z.string().trim().min(2).max(80).optional(),
  userEmail: z.string().trim().email().optional(),
});

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

  return router;
};

const portfolioRouter = createPortfolioRouter();

export default portfolioRouter;
