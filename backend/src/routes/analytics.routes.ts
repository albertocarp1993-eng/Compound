import { Request, Response, Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { calculateAssetScoreDetails, ScoringInput } from '../services/scoringService';

type HoldingWithAsset = Prisma.HoldingGetPayload<{
  include: {
    asset: {
      include: {
        fundamentals: true;
        financials: true;
      };
    };
  };
}>;

type PortfolioSnapshotRecord = {
  id: number;
  portfolioId: number;
  date: Date;
  total_value: number;
  total_dividends: number;
  invested_capital: number;
  future_income: number;
};

export type AnalyticsDbClient = Pick<typeof prisma, 'holding'> & {
  portfolioSnapshot?: Pick<typeof prisma.portfolioSnapshot, 'findMany'>;
};

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

const safeNumber = (value: number | null | undefined, fallback = 0): number =>
  Number.isFinite(value) ? Number(value) : fallback;

const buildFallbackInput = (holding: HoldingWithAsset): ScoringInput => ({
  moat_rating: holding.asset.moat_rating,
  debt_to_equity: 1.2,
  payout_ratio: holding.asset.dividend_safety > 0 ? 70 - holding.asset.dividend_safety * 0.5 : 80,
  dividend_growth_streak: holding.asset.moat_rating === 'WIDE' ? 12 : holding.asset.moat_rating === 'NARROW' ? 6 : 0,
  pe_ratio: 0,
  roe: 0,
  dividend_safety_score: holding.asset.dividend_safety,
  historical_volatility: 0.3,
});

const symbolSeed = (symbol: string): number =>
  symbol
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);

const buildSparkline = (symbol: string, price: number, volatility: number): number[] => {
  const seed = symbolSeed(symbol);
  const points: number[] = [];

  for (let i = 0; i < 30; i += 1) {
    const wave = Math.sin((seed + i * 4) / 9) * volatility * 0.08;
    const drift = (i - 15) * 0.0025;
    const level = price * (1 + wave + drift);
    points.push(Number(Math.max(0.01, level).toFixed(2)));
  }

  return points;
};

const buildProjection10y = (value: number, score: number, dripEnabled: boolean): number => {
  const annualRate = 0.03 + (score / 100) * 0.08 + (dripEnabled ? 0.012 : 0);
  return Number((value * Math.pow(1 + annualRate, 10)).toFixed(2));
};

const getLatestDividendPerShare = (holding: HoldingWithAsset): number => {
  const annualRows = holding.asset.financials
    .filter((row) => row.period === 'ANNUAL')
    .sort((a, b) => b.fiscal_year - a.fiscal_year);

  return annualRows[0]?.dividends_per_share ?? 0;
};

const resolveEnrichedHoldings = (holdings: HoldingWithAsset[]) =>
  holdings
    .map((holding) => {
      const fallbackInput = buildFallbackInput(holding);
      const fundamentals = holding.asset.fundamentals;

      const scoringInput: ScoringInput = fundamentals
        ? {
            moat_rating: fundamentals.moat_rating,
            debt_to_equity: fundamentals.debt_to_equity,
            payout_ratio: fundamentals.payout_ratio,
            dividend_growth_streak: fundamentals.dividend_growth_streak,
            pe_ratio: fundamentals.pe_ratio,
            roe: fundamentals.roe,
            dividend_safety_score: fundamentals.dividend_safety_score,
            historical_volatility: fundamentals.historical_volatility,
          }
        : fallbackInput;

      const details = calculateAssetScoreDetails(scoringInput);
      const value = holding.quantity * holding.asset.currentPrice;
      const qualityScore = fundamentals?.health_rating ?? details.healthRating;
      const verdict = fundamentals?.verdict ?? details.verdict;

      const peRatio = safeNumber(
        fundamentals?.pe_ratio,
        scoringInput.pe_ratio && scoringInput.pe_ratio > 0
          ? scoringInput.pe_ratio
          : holding.asset.currentPrice > 0
            ? holding.asset.currentPrice / Math.max(0.01, holding.asset.currentPrice * 0.04)
            : 0,
      );

      return {
        holdingId: holding.id,
        assetId: holding.asset.id,
        symbol: holding.asset.symbol,
        name: holding.asset.name,
        quantity: holding.quantity,
        avgCost: holding.avgCost,
        currentPrice: holding.asset.currentPrice,
        value,
        peRatio,
        roe: safeNumber(fundamentals?.roe),
        debtToEquity: safeNumber(fundamentals?.debt_to_equity, fallbackInput.debt_to_equity),
        payoutRatio: safeNumber(fundamentals?.payout_ratio, fallbackInput.payout_ratio),
        dividendGrowthStreak: safeNumber(
          fundamentals?.dividend_growth_streak,
          fallbackInput.dividend_growth_streak,
        ),
        dividendSafetyScore: safeNumber(
          fundamentals?.dividend_safety_score,
          holding.asset.dividend_safety,
        ),
        historicalVolatility: safeNumber(
          fundamentals?.historical_volatility,
          fallbackInput.historical_volatility,
        ),
        moatRating: fundamentals?.moat_rating ?? holding.asset.moat_rating,
        calculatedScore: qualityScore,
        healthVerdict: verdict,
        color: getScoreColor(qualityScore),
        breakdown: details.breakdown,
        dripEnabled: holding.drip_enabled,
        snowballImpact10y: buildProjection10y(value, qualityScore, holding.drip_enabled),
        sparkline: buildSparkline(
          holding.asset.symbol,
          holding.asset.currentPrice,
          safeNumber(fundamentals?.historical_volatility, 0.28),
        ),
        annualDividendIncome: Number(
          (getLatestDividendPerShare(holding) * holding.quantity).toFixed(2),
        ),
      };
    })
    .filter((item) => Number.isFinite(item.value));

const hasSnapshotClient = (
  db: AnalyticsDbClient,
): db is AnalyticsDbClient & { portfolioSnapshot: Pick<typeof prisma.portfolioSnapshot, 'findMany'> } =>
  Boolean(db.portfolioSnapshot && typeof db.portfolioSnapshot.findMany === 'function');

const getPortfolioSnapshots = async (
  db: AnalyticsDbClient,
  portfolioId: number,
): Promise<PortfolioSnapshotRecord[]> => {
  if (!hasSnapshotClient(db)) return [];

  const rows = await db.portfolioSnapshot.findMany({
    where: { portfolioId },
    orderBy: {
      date: 'asc',
    },
  });

  return rows as PortfolioSnapshotRecord[];
};

const synthesizeSnowballSeries = (enrichedHoldings: ReturnType<typeof resolveEnrichedHoldings>) => {
  const totalValue = enrichedHoldings.reduce((acc, item) => acc + item.value, 0);
  const annualDividend = enrichedHoldings.reduce((acc, item) => acc + item.annualDividendIncome, 0);

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear() - 5, now.getUTCMonth(), 1));
  const points: Array<{
    date: string;
    investedCapital: number;
    totalValue: number;
    compoundInterest: number;
    futureIncome: number;
    totalDividends: number;
  }> = [];

  let runningDividends = 0;

  for (let i = 0; i < 60; i += 1) {
    const date = new Date(start);
    date.setUTCMonth(start.getUTCMonth() + i);

    const investedCapital = totalValue * 0.53 + i * 1_250;
    const growth = 1 + i * 0.01 + i * i * 0.00014;
    const valueAtPoint = investedCapital * growth;

    const monthlyDividend = annualDividend / 12;
    runningDividends += monthlyDividend;

    points.push({
      date: date.toISOString(),
      investedCapital: Number(investedCapital.toFixed(2)),
      totalValue: Number(valueAtPoint.toFixed(2)),
      compoundInterest: Number((valueAtPoint - investedCapital).toFixed(2)),
      futureIncome: Number((annualDividend * (1 + i * 0.0025)).toFixed(2)),
      totalDividends: Number(runningDividends.toFixed(2)),
    });
  }

  return points;
};

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
              financials: true,
            },
          },
        },
      })) as HoldingWithAsset[];

      if (holdings.length === 0) {
        return res.json({
          portfolioId,
          weightedAverageScore: 0,
          scoreColor: getScoreColor(0),
          totalValue: 0,
          holdingsAnalyzed: 0,
        });
      }

      const enrichedHoldings = resolveEnrichedHoldings(holdings);
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
              financials: true,
            },
          },
        },
      })) as HoldingWithAsset[];

      const enrichedHoldings = resolveEnrichedHoldings(holdings);
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
          verdict: item.healthVerdict,
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
              financials: true,
            },
          },
        },
      })) as HoldingWithAsset[];

      const enrichedHoldings = resolveEnrichedHoldings(holdings);
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

  analyticsRouter.get('/api/analytics/kpis', async (req: Request, res: Response) => {
    const portfolioId = parsePortfolioId(req, res);
    if (!portfolioId) return;

    try {
      const [holdings, snapshots] = await Promise.all([
        db.holding.findMany({
          where: { portfolioId },
          include: {
            asset: {
              include: {
                fundamentals: true,
                financials: true,
              },
            },
          },
        }) as Promise<HoldingWithAsset[]>,
        getPortfolioSnapshots(db, portfolioId),
      ]);

      const enrichedHoldings = resolveEnrichedHoldings(holdings);
      const fallbackNetWorth = enrichedHoldings.reduce((acc, item) => acc + item.value, 0);

      const sortedByDateDesc = [...snapshots].sort((a, b) => b.date.getTime() - a.date.getTime());
      const latest = sortedByDateDesc[0] ?? null;
      const previous = sortedByDateDesc[1] ?? latest;

      const netWorth = latest?.total_value ?? fallbackNetWorth;
      const investedCapital = latest?.invested_capital ?? fallbackNetWorth * 0.85;

      const dayChangePct =
        latest && previous && previous.total_value > 0
          ? ((latest.total_value - previous.total_value) / previous.total_value) * 100
          : 0;

      const currentYear = latest?.date.getUTCFullYear() ?? new Date().getUTCFullYear();
      const earliestCurrentYear = [...sortedByDateDesc]
        .filter((snapshot) => snapshot.date.getUTCFullYear() === currentYear)
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

      const ytdDividends = latest
        ? latest.total_dividends - (earliestCurrentYear?.total_dividends ?? latest.total_dividends)
        : enrichedHoldings.reduce((acc, item) => acc + item.annualDividendIncome, 0) / 12;

      return res.json({
        portfolioId,
        netWorth: Number(netWorth.toFixed(2)),
        dayChangePct: Number(dayChangePct.toFixed(2)),
        ytdDividends: Number(Math.max(0, ytdDividends).toFixed(2)),
        investedCapital: Number(investedCapital.toFixed(2)),
        snowballFactor: netWorth > 0 ? Number((netWorth / Math.max(1, investedCapital)).toFixed(2)) : 0,
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to fetch KPI ticker', details });
    }
  });

  analyticsRouter.get('/api/analytics/snowball', async (req: Request, res: Response) => {
    const portfolioId = parsePortfolioId(req, res);
    if (!portfolioId) return;

    try {
      const [holdings, snapshots] = await Promise.all([
        db.holding.findMany({
          where: { portfolioId },
          include: {
            asset: {
              include: {
                fundamentals: true,
                financials: true,
              },
            },
          },
        }) as Promise<HoldingWithAsset[]>,
        getPortfolioSnapshots(db, portfolioId),
      ]);

      const enrichedHoldings = resolveEnrichedHoldings(holdings);

      const series = snapshots.length > 0
        ? snapshots.map((point) => ({
            date: point.date.toISOString(),
            investedCapital: Number(point.invested_capital.toFixed(2)),
            totalValue: Number(point.total_value.toFixed(2)),
            compoundInterest: Number((point.total_value - point.invested_capital).toFixed(2)),
            futureIncome: Number(point.future_income.toFixed(2)),
            totalDividends: Number(point.total_dividends.toFixed(2)),
          }))
        : synthesizeSnowballSeries(enrichedHoldings);

      const latest = series[series.length - 1];

      return res.json({
        portfolioId,
        points: series,
        summary: {
          totalValue: latest?.totalValue ?? 0,
          investedCapital: latest?.investedCapital ?? 0,
          compoundInterest: latest?.compoundInterest ?? 0,
          futureIncome: latest?.futureIncome ?? 0,
          totalDividends: latest?.totalDividends ?? 0,
        },
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to fetch snowball analytics', details });
    }
  });

  analyticsRouter.get('/api/analytics/payout-calendar', async (req: Request, res: Response) => {
    const portfolioId = parsePortfolioId(req, res);
    if (!portfolioId) return;

    const year = Number(req.query.year ?? new Date().getUTCFullYear());
    const targetYear = Number.isFinite(year) ? year : new Date().getUTCFullYear();

    try {
      const holdings = (await db.holding.findMany({
        where: { portfolioId },
        include: {
          asset: {
            include: {
              fundamentals: true,
              financials: true,
            },
          },
        },
      })) as HoldingWithAsset[];

      const incomeByDate = new Map<string, number>();

      for (const holding of holdings) {
        const annualDividendPerShare = getLatestDividendPerShare(holding);
        if (annualDividendPerShare <= 0) continue;

        const annualIncome = annualDividendPerShare * holding.quantity;
        const quarterlyIncome = annualIncome / 4;

        const quarterMonths = [2, 5, 8, 11];
        for (const month of quarterMonths) {
          const key = new Date(Date.UTC(targetYear, month, 15)).toISOString().slice(0, 10);
          incomeByDate.set(key, (incomeByDate.get(key) ?? 0) + quarterlyIncome);
        }
      }

      const maxValue = Math.max(...incomeByDate.values(), 0);

      const days = [...incomeByDate.entries()]
        .map(([date, amount]) => ({
          date,
          amount: Number(amount.toFixed(2)),
          intensity: maxValue > 0 ? Math.max(1, Math.round((amount / maxValue) * 4)) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const projectedAnnualDividends = Number(
        [...incomeByDate.values()].reduce((acc, amount) => acc + amount, 0).toFixed(2),
      );

      return res.json({
        portfolioId,
        year: targetYear,
        days,
        projectedAnnualDividends,
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to fetch payout calendar', details });
    }
  });

  return analyticsRouter;
};

const analyticsRouter = createAnalyticsRouter();

export default analyticsRouter;
