import { Prisma } from '@prisma/client';
import { Request, Response, Router } from 'express';
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

export type PortfolioDbClient = {
  portfolio: typeof prisma.portfolio;
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

      const payload = portfolios.map((portfolio) => {
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
      });

      return res.json({ count: payload.length, portfolios: payload });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to fetch portfolios', details });
    }
  });

  return router;
};

const portfolioRouter = createPortfolioRouter();

export default portfolioRouter;
