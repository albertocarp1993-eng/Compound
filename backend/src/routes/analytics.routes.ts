import { Request, Response, Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { calculateAssetScoreDetails } from '../services/scoringService';

type HoldingWithFundamentals = Prisma.HoldingGetPayload<{
  include: {
    asset: {
      include: {
        fundamentals: true;
      };
    };
  };
}>;

export type AnalyticsDbClient = Pick<typeof prisma, 'holding'>;

const getScoreColor = (score: number): string => {
  if (score > 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
};

const parsePortfolioId = (req: Request, res: Response): number | null => {
  const rawPortfolioId = req.query.portfolioId;
  const portfolioId = Number(rawPortfolioId);

  if (!Number.isFinite(portfolioId) || portfolioId <= 0) {
    res.status(400).json({
      error: 'portfolioId query parameter is required and must be a positive number',
    });
    return null;
  }

  return portfolioId;
};

const getEnrichedHoldings = (holdings: HoldingWithFundamentals[]) =>
  holdings
    .map((holding) => {
      if (!holding.asset.fundamentals) return null;

      const value = holding.quantity * holding.asset.currentPrice;
      const details = calculateAssetScoreDetails(holding.asset.fundamentals);

      return {
        holdingId: holding.id,
        assetId: holding.asset.id,
        symbol: holding.asset.symbol,
        name: holding.asset.name,
        quantity: holding.quantity,
        avgCost: holding.avgCost,
        currentPrice: holding.asset.currentPrice,
        value,
        peRatio: holding.asset.fundamentals.pe_ratio,
        moatRating: holding.asset.fundamentals.moat_rating,
        calculatedScore: details.score,
        color: getScoreColor(details.score),
        breakdown: details.breakdown,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

export const createAnalyticsRouter = (db: AnalyticsDbClient = prisma): Router => {
  const analyticsRouter = Router();

  analyticsRouter.get('/api/analytics/portfolio-health', async (req: Request, res: Response) => {
    const portfolioId = parsePortfolioId(req, res);
    if (!portfolioId) return;

    try {
      const holdings = (await db.holding.findMany({
        where: { portfolioId },
        include: {
          asset: {
            include: {
              fundamentals: true,
            },
          },
        },
      })) as HoldingWithFundamentals[];

      if (holdings.length === 0) {
        return res.json({
          portfolioId,
          weightedAverageScore: 0,
          scoreColor: getScoreColor(0),
          totalValue: 0,
          holdingsAnalyzed: 0,
        });
      }

      const enrichedHoldings = getEnrichedHoldings(holdings);
      const totalValue = enrichedHoldings.reduce((acc, item) => acc + item.value, 0);

      if (totalValue === 0 || enrichedHoldings.length === 0) {
        return res.json({
          portfolioId,
          weightedAverageScore: 0,
          scoreColor: getScoreColor(0),
          totalValue,
          holdingsAnalyzed: enrichedHoldings.length,
        });
      }

      const weightedAverageScore =
        enrichedHoldings.reduce((acc, item) => {
          const weight = item.value / totalValue;
          return acc + item.calculatedScore * weight;
        }, 0) ?? 0;

      return res.json({
        portfolioId,
        weightedAverageScore: Number(weightedAverageScore.toFixed(2)),
        scoreColor: getScoreColor(weightedAverageScore),
        totalValue: Number(totalValue.toFixed(2)),
        holdingsAnalyzed: enrichedHoldings.length,
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to calculate portfolio health', details });
    }
  });

  analyticsRouter.get('/api/analytics/matrix', async (req: Request, res: Response) => {
    const portfolioId = parsePortfolioId(req, res);
    if (!portfolioId) return;

    try {
      const holdings = (await db.holding.findMany({
        where: { portfolioId },
        include: {
          asset: {
            include: {
              fundamentals: true,
            },
          },
        },
      })) as HoldingWithFundamentals[];

      const enrichedHoldings = getEnrichedHoldings(holdings);
      const totalValue = enrichedHoldings.reduce((acc, item) => acc + item.value, 0);

      const matrix = enrichedHoldings.map((item) => {
        const weight = totalValue > 0 ? item.value / totalValue : 0;

        return {
          assetId: item.assetId,
          symbol: item.symbol,
          name: item.name,
          peRatio: item.peRatio,
          qualityScore: item.calculatedScore,
          positionValue: Number(item.value.toFixed(2)),
          portfolioWeight: Number((weight * 100).toFixed(2)),
          moatRating: item.moatRating,
          color: item.color,
          x: item.peRatio,
          y: item.calculatedScore,
          z: Number(item.value.toFixed(2)),
        };
      });

      return res.json({
        portfolioId,
        totalValue: Number(totalValue.toFixed(2)),
        count: matrix.length,
        matrix,
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to fetch analytics matrix', details });
    }
  });

  analyticsRouter.get('/api/analytics/holdings', async (req: Request, res: Response) => {
    const portfolioId = parsePortfolioId(req, res);
    if (!portfolioId) return;

    try {
      const holdings = (await db.holding.findMany({
        where: { portfolioId },
        include: {
          asset: {
            include: {
              fundamentals: true,
            },
          },
        },
      })) as HoldingWithFundamentals[];

      const enrichedHoldings = getEnrichedHoldings(holdings);
      const totalValue = enrichedHoldings.reduce((acc, item) => acc + item.value, 0);

      const payload = enrichedHoldings
        .map((item) => ({
          ...item,
          portfolioWeight: totalValue > 0 ? Number(((item.value / totalValue) * 100).toFixed(2)) : 0,
          value: Number(item.value.toFixed(2)),
        }))
        .sort((a, b) => b.value - a.value);

      return res.json({
        portfolioId,
        totalValue: Number(totalValue.toFixed(2)),
        count: payload.length,
        holdings: payload,
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to fetch holding analytics', details });
    }
  });

  return analyticsRouter;
};

const analyticsRouter = createAnalyticsRouter();

export default analyticsRouter;
